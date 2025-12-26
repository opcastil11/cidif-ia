#!/bin/bash
#
# CIDIF.TECH VM Bootstrap Script
# Sets up a complete autonomous development environment
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/YOUR_USER/cidif-ia/main/scripts/bootstrap-vm.sh | bash
#
# Or inside VM:
#   chmod +x bootstrap-vm.sh && ./bootstrap-vm.sh
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║           CIDIF.TECH VM Bootstrap Script                  ║"
    echo "║              Autonomous Agent Environment                 ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        error "Do not run as root. Run as a regular user with sudo access."
        exit 1
    fi
}

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        error "Cannot detect OS"
        exit 1
    fi
    log "Detected OS: $OS $VERSION"
}

# Update system
update_system() {
    log "Updating system packages..."
    sudo apt-get update -qq
    sudo apt-get upgrade -y -qq
    success "System updated"
}

# Install base dependencies
install_base() {
    log "Installing base dependencies..."
    sudo apt-get install -y -qq \
        curl \
        wget \
        git \
        jq \
        build-essential \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    success "Base dependencies installed"
}

# Install Node.js 20
install_node() {
    if command -v node &> /dev/null; then
        local version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$version" -ge 20 ]; then
            success "Node.js $(node -v) already installed"
            return
        fi
    fi

    log "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
    success "Node.js $(node -v) installed"
}

# Install global npm packages
install_npm_globals() {
    log "Installing global npm packages..."

    # Vercel CLI
    sudo npm install -g vercel --silent
    success "Vercel CLI installed"

    # Supabase CLI
    sudo npm install -g supabase --silent
    success "Supabase CLI installed"

    # TypeScript and ts-node for scripts
    sudo npm install -g typescript ts-node --silent
    success "TypeScript installed"
}

# Install Claude Code CLI
install_claude() {
    log "Installing Claude Code CLI..."

    if command -v claude &> /dev/null; then
        success "Claude Code already installed"
        return
    fi

    sudo npm install -g @anthropic-ai/claude-code --silent
    success "Claude Code CLI installed"

    echo ""
    warn "Claude Code requires authentication."
    echo "    Run 'claude' to authenticate with your Anthropic account"
    echo ""
}

# Clone project
clone_project() {
    local repo_url="${REPO_URL:-https://github.com/YOUR_USER/cidif-ia.git}"
    local project_dir="${PROJECT_DIR:-$HOME/cidif-ia}"

    if [ -d "$project_dir" ]; then
        log "Project directory exists, pulling latest..."
        cd "$project_dir"
        git pull
        success "Project updated"
    else
        log "Cloning project..."
        git clone "$repo_url" "$project_dir"
        success "Project cloned to $project_dir"
    fi

    cd "$project_dir"

    log "Installing project dependencies..."
    npm install --silent
    success "Dependencies installed"
}

# Setup environment file
setup_env() {
    local project_dir="${PROJECT_DIR:-$HOME/cidif-ia}"
    local env_file="$project_dir/.env.local"

    if [ -f "$env_file" ]; then
        warn "Environment file exists, skipping..."
        return
    fi

    log "Setting up environment file..."

    cat > "$env_file" << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (for AI assistant)
ANTHROPIC_API_KEY=

# Linear (for autonomous agent workflow)
LINEAR_API_KEY=
LINEAR_TEAM_ID=
EOF

    success "Environment file created at $env_file"
    warn "Edit $env_file and add your API keys"
}

# Setup agent directory
setup_agent_dir() {
    local project_dir="${PROJECT_DIR:-$HOME/cidif-ia}"
    local agent_dir="$project_dir/.agent"

    mkdir -p "$agent_dir"

    # Add to gitignore
    if ! grep -q "^.agent/" "$project_dir/.gitignore" 2>/dev/null; then
        echo -e "\n# Agent working directory\n.agent/" >> "$project_dir/.gitignore"
    fi

    success "Agent directory created"
}

# Create systemd service for autonomous mode
create_systemd_service() {
    local project_dir="${PROJECT_DIR:-$HOME/cidif-ia}"
    local service_file="/etc/systemd/system/cidif-agent.service"

    log "Creating systemd service..."

    sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=CIDIF.TECH Autonomous Agent
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$project_dir
Environment=PATH=/usr/bin:/usr/local/bin:$HOME/.npm-global/bin
EnvironmentFile=$project_dir/.env.local
ExecStart=$project_dir/scripts/agent-loop.sh loop 300
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    success "Systemd service created"

    echo ""
    echo "  To enable auto-start on boot:"
    echo "    sudo systemctl enable cidif-agent"
    echo ""
    echo "  To start the agent:"
    echo "    sudo systemctl start cidif-agent"
    echo ""
    echo "  To check status:"
    echo "    sudo systemctl status cidif-agent"
    echo ""
}

# Create helper aliases
create_aliases() {
    local bashrc="$HOME/.bashrc"
    local project_dir="${PROJECT_DIR:-$HOME/cidif-ia}"

    log "Creating helper aliases..."

    if ! grep -q "# CIDIF Agent Aliases" "$bashrc"; then
        cat >> "$bashrc" << EOF

# CIDIF Agent Aliases
alias cidif="cd $project_dir"
alias agent-sync="cd $project_dir && npm run agent:sync"
alias agent-start="cd $project_dir && npm run agent:start"
alias agent-loop="cd $project_dir && ./scripts/agent-loop.sh loop"
alias agent-once="cd $project_dir && ./scripts/agent-loop.sh once"
alias agent-status="cd $project_dir && ./scripts/agent-loop.sh status"
alias agent-logs="cd $project_dir && ./scripts/agent-loop.sh logs"
EOF
    fi

    success "Aliases added to .bashrc"
    echo "  Run 'source ~/.bashrc' to load aliases"
}

# Print summary
print_summary() {
    local project_dir="${PROJECT_DIR:-$HOME/cidif-ia}"

    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ VM Bootstrap Complete!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Project Location: $project_dir"
    echo ""
    echo "  ${CYAN}Next Steps:${NC}"
    echo ""
    echo "  1. Configure environment:"
    echo "     nano $project_dir/.env.local"
    echo ""
    echo "  2. Authenticate Claude Code:"
    echo "     claude"
    echo ""
    echo "  3. Link to Vercel (optional):"
    echo "     cd $project_dir && vercel link"
    echo ""
    echo "  4. Start autonomous agent:"
    echo "     cd $project_dir"
    echo "     ./scripts/agent-loop.sh loop"
    echo ""
    echo "  ${CYAN}Or use systemd service:${NC}"
    echo "     sudo systemctl enable cidif-agent"
    echo "     sudo systemctl start cidif-agent"
    echo ""
    echo "  ${CYAN}Available Commands:${NC}"
    echo "     npm run agent:sync     - Sync tickets from Linear"
    echo "     npm run agent:list     - List synced tickets"
    echo "     npm run agent:start    - Start working on next ticket"
    echo "     npm run agent:complete - Complete current ticket"
    echo ""
}

# Main
main() {
    print_header
    check_root
    detect_os
    update_system
    install_base
    install_node
    install_npm_globals
    install_claude
    clone_project
    setup_env
    setup_agent_dir
    create_systemd_service
    create_aliases
    print_summary
}

# Run main
main "$@"
