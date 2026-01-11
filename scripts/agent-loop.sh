#!/bin/bash
#
# Autonomous Agent Loop
# Syncs Linear tickets and processes them with Claude Code
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
AGENT_DIR="$PROJECT_DIR/.agent"
LOG_FILE="$AGENT_DIR/agent.log"
CURRENT_TICKET="$AGENT_DIR/current-ticket.json"
LOCK_FILE="$AGENT_DIR/agent.lock"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp]${NC} $1" | tee -a "$LOG_FILE"
}

# Ensure agent directory exists
mkdir -p "$AGENT_DIR"

# Check for required environment variables
check_env() {
    if [ -z "$LINEAR_API_KEY" ]; then
        error "LINEAR_API_KEY not set"
        exit 1
    fi
    if [ -z "$LINEAR_TEAM_ID" ]; then
        error "LINEAR_TEAM_ID not set"
        exit 1
    fi
}

# Acquire lock
acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local pid=$(cat "$LOCK_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            error "Agent already running (PID: $pid)"
            exit 1
        else
            warn "Removing stale lock file"
            rm -f "$LOCK_FILE"
        fi
    fi
    echo $$ > "$LOCK_FILE"
    trap "rm -f $LOCK_FILE" EXIT
}

# Sync tickets from Linear
sync_tickets() {
    log "📥 Syncing tickets from Linear..."
    cd "$PROJECT_DIR"
    node scripts/linear-sync.js sync
}

# Get next ticket
get_next_ticket() {
    cd "$PROJECT_DIR"
    node scripts/linear-sync.js next 2>/dev/null | head -1
}

# Start working on a ticket
start_ticket() {
    log "🚀 Starting ticket..."
    cd "$PROJECT_DIR"
    node scripts/linear-sync.js start
}

# Complete current ticket
complete_ticket() {
    local comment="$1"
    log "✅ Completing ticket..."
    cd "$PROJECT_DIR"
    node scripts/linear-sync.js complete "$comment"
}

# Get current ticket info
get_current_ticket() {
    if [ -f "$CURRENT_TICKET" ]; then
        cat "$CURRENT_TICKET"
    fi
}

# Build Claude prompt from ticket
build_prompt() {
    local ticket_json="$1"
    local identifier=$(echo "$ticket_json" | jq -r '.identifier')
    local title=$(echo "$ticket_json" | jq -r '.title')
    local description=$(echo "$ticket_json" | jq -r '.description // "No description provided"')

    cat <<EOF
# Linear Ticket: $identifier

## Title
$title

## Description
$description

## Instructions
You are working on the CIDIF.TECH project. Follow these steps:

1. **Read CLAUDE.md** for project guidelines and requirements
2. **Implement** the requested feature or fix as described above
3. **Add i18n translations** for any user-facing text (ES + EN)
4. **Write tests** if applicable
5. **Build and verify** the code compiles: \`npm run build\`
6. **Commit changes** with a meaningful message referencing $identifier:
   \`git add . && git commit -m "feat: description ($identifier)"\`
7. **Push to git**: \`git push origin main\`
8. **Deploy using Orquesta API** (NOT vercel CLI):
   \`\`\`bash
   curl -X POST "https://orquesta.live/api/integrations/vercel/deploy" \\
     -H "Content-Type: application/json" \\
     -H "X-Agent-Token: \$ORQUESTA_TOKEN" \\
     -d '{"projectId": "fb324d50-c231-4aa4-93b6-cfc424a449d0", "environment": "production"}'
   \`\`\`

## Completion Signals
- When ALL tasks are complete, output: **TICKET_COMPLETE**
- If blocked and need human help, output: **TICKET_BLOCKED: <reason>**

## Important Reminders
- NEVER use vercel CLI - it's not authenticated
- Always use the Orquesta Deploy API for deployments
- Ensure i18n translations exist for all user-facing text
- Run \`npm run build\` to verify no errors before committing
EOF
}

# Run Claude Code on the ticket
run_claude() {
    local prompt="$1"
    log "🤖 Starting Claude Code agent..."

    cd "$PROJECT_DIR"

    # Create a temporary prompt file
    local prompt_file="$AGENT_DIR/current-prompt.md"
    echo "$prompt" > "$prompt_file"

    # Check if we should use the new CLI method
    if [ "${USE_NEW_CLI:-true}" = "true" ]; then
        # Use the new Claude CLI with JSON output
        log "Using Claude CLI with stream-json output..."
        claude -p "$prompt" \
            --output-format stream-json \
            --max-turns "${MAX_TURNS:-30}" \
            --allowedTools "Bash,Read,Write,Edit,Glob,Grep,Task,WebFetch,TodoWrite" \
            --dangerously-skip-permissions 2>&1 | tee -a "$LOG_FILE"
    else
        # Legacy: Using --print for non-interactive mode if available, otherwise pipe
        if claude --help 2>&1 | grep -q "print"; then
            claude --print < "$prompt_file" 2>&1 | tee -a "$LOG_FILE"
        else
            # Alternative: run in dangerously-skip-permissions for full autonomy
            echo "$prompt" | claude --dangerously-skip-permissions 2>&1 | tee -a "$LOG_FILE"
        fi
    fi

    local exit_code=$?
    rm -f "$prompt_file"
    return $exit_code
}

# Process a single ticket
process_ticket() {
    local ticket_json=$(get_current_ticket)

    if [ -z "$ticket_json" ]; then
        warn "No current ticket to process"
        return 1
    fi

    local identifier=$(echo "$ticket_json" | jq -r '.identifier')
    log "📋 Processing ticket: $identifier"

    local prompt=$(build_prompt "$ticket_json")
    local output=$(run_claude "$prompt")

    # Check for completion or blocker
    if echo "$output" | grep -q "TICKET_COMPLETE"; then
        success "✅ Ticket $identifier completed successfully"
        complete_ticket "🤖 Agent completed this ticket automatically"
        return 0
    elif echo "$output" | grep -q "TICKET_BLOCKED:"; then
        local reason=$(echo "$output" | grep "TICKET_BLOCKED:" | sed 's/.*TICKET_BLOCKED: //')
        warn "⚠️ Ticket $identifier blocked: $reason"
        # Don't complete, leave for human intervention
        return 2
    else
        warn "⚠️ Ticket $identifier finished without explicit completion signal"
        return 1
    fi
}

# Main loop
main_loop() {
    local interval="${1:-300}" # Default: 5 minutes between syncs

    log "🔄 Starting autonomous agent loop (sync interval: ${interval}s)"

    while true; do
        # Sync tickets
        sync_tickets

        # Check for current ticket or get next one
        if [ ! -f "$CURRENT_TICKET" ]; then
            local next=$(get_next_ticket)
            if [ -n "$next" ] && [ "$next" != "No ticket to start" ]; then
                start_ticket
            else
                log "💤 No tickets to process, waiting..."
                sleep "$interval"
                continue
            fi
        fi

        # Process current ticket
        if ! process_ticket; then
            warn "Ticket processing failed, will retry after sync"
        fi

        # Brief pause before next iteration
        sleep 10
    done
}

# Single run mode (process one ticket and exit)
single_run() {
    sync_tickets

    if [ ! -f "$CURRENT_TICKET" ]; then
        local next=$(get_next_ticket)
        if [ -n "$next" ] && [ "$next" != "No ticket to start" ]; then
            start_ticket
        else
            log "No tickets to process"
            exit 0
        fi
    fi

    process_ticket
}

# CLI
case "${1:-}" in
    loop)
        check_env
        acquire_lock
        main_loop "${2:-300}"
        ;;
    once)
        check_env
        acquire_lock
        single_run
        ;;
    status)
        if [ -f "$LOCK_FILE" ]; then
            local pid=$(cat "$LOCK_FILE")
            if kill -0 "$pid" 2>/dev/null; then
                echo "Agent running (PID: $pid)"
            else
                echo "Agent not running (stale lock)"
            fi
        else
            echo "Agent not running"
        fi
        if [ -f "$CURRENT_TICKET" ]; then
            echo ""
            echo "Current ticket:"
            cat "$CURRENT_TICKET" | jq -r '"[\(.identifier)] \(.title)"'
        fi
        ;;
    logs)
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            echo "No logs yet"
        fi
        ;;
    *)
        echo "Autonomous Agent Loop"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  loop [interval]  - Run continuous loop (default: 300s sync interval)"
        echo "  once             - Process one ticket and exit"
        echo "  status           - Show agent status"
        echo "  logs             - Tail agent logs"
        echo ""
        echo "Environment Variables Required:"
        echo "  LINEAR_API_KEY   - Your Linear API key"
        echo "  LINEAR_TEAM_ID   - Your Linear team ID"
        ;;
esac
