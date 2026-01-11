#!/usr/bin/env node
/**
 * Orquesta-Claude Agent Orchestrator
 * Combines Linear ticket management, Claude CLI execution, and Orquesta deployment
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         ORQUESTA AGENT                                  │
 * │   ┌─────────────────────────────────────────────────────────────────┐   │
 * │   │                                                                 │   │
 * │   │  1. Receive task from Linear API                               │   │
 * │   │  2. Execute: claude -p "task" --output-format stream-json      │   │
 * │   │  3. Parse result, update Linear, trigger deploy                │   │
 * │   │  4. Report status back to Orquesta                             │   │
 * │   └─────────────────────────────────────────────────────────────────┘   │
 * │                              │                                          │
 * │                              ▼                                          │
 * │   ┌─────────────────────────────────────────────────────────────────┐   │
 * │   │  claude -p "Implement feature X"                                │   │
 * │   │    --output-format stream-json                                  │   │
 * │   │    --max-turns 30                                               │   │
 * │   │    --allowedTools Bash,Read,Edit,Write,Glob,Grep,Task,WebFetch  │   │
 * │   └─────────────────────────────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { ClaudeCLI, createAgentCLI } from './claude-cli.js';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const AGENT_DIR = path.join(process.cwd(), '.agent');
const TICKETS_FILE = path.join(AGENT_DIR, 'tickets.json');
const CURRENT_TICKET_FILE = path.join(AGENT_DIR, 'current-ticket.json');
const EXECUTION_LOG_FILE = path.join(AGENT_DIR, 'execution-log.json');

/**
 * @typedef {Object} AgentConfig
 * @property {string} linearApiKey
 * @property {string} linearTeamId
 * @property {string} [orquestaToken]
 * @property {string} [orquestaProjectId]
 * @property {number} [maxTurns]
 * @property {boolean} [autoDeploy]
 * @property {boolean} [verbose]
 */

/**
 * @typedef {Object} ExecutionResult
 * @property {boolean} success
 * @property {string} ticketId
 * @property {string} ticketIdentifier
 * @property {number} turnsUsed
 * @property {string} sessionId
 * @property {string[]} toolsUsed
 * @property {Object} [deployment]
 * @property {string} [error]
 * @property {number} duration
 */

class OrquestaAgent {
  constructor(config) {
    this.config = {
      maxTurns: 30,
      autoDeploy: true,
      verbose: false,
      ...config
    };

    this.cli = createAgentCLI({
      maxTurns: this.config.maxTurns,
      cwd: process.cwd()
    });

    this.executionLog = this.loadExecutionLog();
  }

  /**
   * Ensure agent directory exists
   */
  ensureAgentDir() {
    if (!fs.existsSync(AGENT_DIR)) {
      fs.mkdirSync(AGENT_DIR, { recursive: true });
    }
  }

  /**
   * Load execution log
   */
  loadExecutionLog() {
    this.ensureAgentDir();
    if (fs.existsSync(EXECUTION_LOG_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(EXECUTION_LOG_FILE, 'utf-8'));
      } catch {
        return { executions: [] };
      }
    }
    return { executions: [] };
  }

  /**
   * Save execution log
   */
  saveExecutionLog() {
    fs.writeFileSync(EXECUTION_LOG_FILE, JSON.stringify(this.executionLog, null, 2));
  }

  /**
   * Make HTTP request
   */
  async httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const req = protocol.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data)
            });
          } catch {
            resolve({
              status: res.statusCode,
              data
            });
          }
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }

      req.end();
    });
  }

  /**
   * Linear GraphQL request
   */
  async linearRequest(query, variables = {}) {
    const response = await this.httpRequest('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.linearApiKey
      },
      body: JSON.stringify({ query, variables })
    });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data;
  }

  /**
   * Sync tickets from Linear
   */
  async syncTickets() {
    console.log('📥 Syncing tickets from Linear...');

    const query = `
      query GetAgentTickets($teamId: ID!) {
        issues(
          filter: {
            team: { id: { eq: $teamId } }
            state: { type: { in: ["backlog", "unstarted", "started"] } }
            labels: { name: { eq: "agent" } }
          }
          orderBy: priority
          first: 50
        ) {
          nodes {
            id
            identifier
            title
            description
            priority
            url
            createdAt
            updatedAt
            state { name, type, id }
            labels { nodes { name } }
          }
        }
      }
    `;

    const result = await this.linearRequest(query, { teamId: this.config.linearTeamId });
    const tickets = result.issues.nodes;

    // Filter for CIDIF project tickets only
    const cidifTickets = tickets.filter(ticket => {
      const desc = (ticket.description || '').toLowerCase();
      const title = ticket.title.toLowerCase();
      return (
        desc.includes('cidif') ||
        desc.includes('cidif-ia.vercel.app') ||
        title.includes('cidif') ||
        ticket.labels?.nodes?.some(l => l.name.toLowerCase().includes('cidif'))
      );
    });

    this.ensureAgentDir();
    const queue = {
      lastSync: new Date().toISOString(),
      tickets: cidifTickets
    };

    fs.writeFileSync(TICKETS_FILE, JSON.stringify(queue, null, 2));
    console.log(`✅ Synced ${cidifTickets.length} CIDIF tickets (filtered from ${tickets.length} total)`);

    return cidifTickets;
  }

  /**
   * Get next ticket to process
   */
  getNextTicket() {
    if (!fs.existsSync(TICKETS_FILE)) {
      return null;
    }

    const queue = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf-8'));
    const pending = queue.tickets.filter(t =>
      t.state.type !== 'completed' && t.state.type !== 'canceled'
    );

    return pending[0] || null;
  }

  /**
   * Get current ticket
   */
  getCurrentTicket() {
    if (!fs.existsSync(CURRENT_TICKET_FILE)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(CURRENT_TICKET_FILE, 'utf-8'));
  }

  /**
   * Update ticket status in Linear
   */
  async updateTicketStatus(issueId, stateType) {
    // Get workflow states
    const statesQuery = `
      query GetWorkflowStates($teamId: String!) {
        team(id: $teamId) {
          states { nodes { id, name, type } }
        }
      }
    `;

    const statesResult = await this.linearRequest(statesQuery, { teamId: this.config.linearTeamId });
    const states = statesResult.team.states.nodes;
    const targetState = states.find(s => s.type === stateType);

    if (!targetState) {
      console.warn(`⚠️ No state found for type: ${stateType}`);
      return;
    }

    const updateQuery = `
      mutation UpdateIssue($issueId: String!, $stateId: String!) {
        issueUpdate(id: $issueId, input: { stateId: $stateId }) {
          success
        }
      }
    `;

    await this.linearRequest(updateQuery, { issueId, stateId: targetState.id });
  }

  /**
   * Add comment to Linear ticket
   */
  async addComment(issueId, body) {
    const query = `
      mutation AddComment($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          success
        }
      }
    `;

    await this.linearRequest(query, { issueId, body });
  }

  /**
   * Build prompt for Claude
   */
  buildPrompt(ticket) {
    return `# Linear Ticket: ${ticket.identifier}

## Title
${ticket.title}

## Description
${ticket.description || 'No description provided'}

## Instructions
You are working on the CIDIF.TECH project. Follow these steps:

1. **Read CLAUDE.md** for project guidelines and requirements
2. **Implement** the requested feature or fix as described above
3. **Add i18n translations** for any user-facing text (ES + EN)
4. **Write tests** if applicable
5. **Build and verify** the code compiles: \`npm run build\`
6. **Commit changes** with a meaningful message referencing ${ticket.identifier}:
   \`git add . && git commit -m "feat: description (${ticket.identifier})"\`
7. **Push to git**: \`git push origin main\`
8. **Deploy using Orquesta API** (NOT vercel CLI):
   \`\`\`bash
   curl -X POST "https://orquesta.live/api/integrations/vercel/deploy" \\
     -H "Content-Type: application/json" \\
     -H "X-Agent-Token: $ORQUESTA_TOKEN" \\
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
`;
  }

  /**
   * Trigger deployment via Orquesta
   */
  async triggerDeployment() {
    if (!this.config.orquestaToken || !this.config.orquestaProjectId) {
      console.warn('⚠️ Orquesta credentials not configured, skipping deployment');
      return null;
    }

    console.log('🚀 Triggering deployment via Orquesta...');

    try {
      const response = await this.httpRequest(
        'https://orquesta.live/api/integrations/vercel/deploy',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-Token': this.config.orquestaToken
          },
          body: {
            projectId: this.config.orquestaProjectId,
            environment: 'production'
          }
        }
      );

      if (response.status >= 200 && response.status < 300) {
        console.log('✅ Deployment triggered successfully');
        return response.data;
      } else {
        console.error('❌ Deployment failed:', response.data);
        return { error: response.data };
      }
    } catch (err) {
      console.error('❌ Deployment error:', err.message);
      return { error: err.message };
    }
  }

  /**
   * Start working on a ticket
   */
  async startTicket(ticket = null) {
    this.ensureAgentDir();

    if (!ticket) {
      ticket = this.getNextTicket();
    }

    if (!ticket) {
      console.log('📭 No tickets to process');
      return null;
    }

    console.log(`🚀 Starting ticket: [${ticket.identifier}] ${ticket.title}`);

    // Update status to "In Progress"
    await this.updateTicketStatus(ticket.id, 'started');
    await this.addComment(ticket.id, '🤖 Orquesta Agent started working on this ticket');

    // Save current ticket
    fs.writeFileSync(CURRENT_TICKET_FILE, JSON.stringify(ticket, null, 2));

    return ticket;
  }

  /**
   * Process a ticket with Claude CLI
   * @param {Object} ticket
   * @returns {Promise<ExecutionResult>}
   */
  async processTicket(ticket) {
    const startTime = Date.now();
    const toolsUsed = new Set();

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🎯 Processing: [${ticket.identifier}] ${ticket.title}`);
    console.log(`${'═'.repeat(60)}\n`);

    const prompt = this.buildPrompt(ticket);

    // Set up event handlers
    this.cli.on('tool_use', (event) => {
      toolsUsed.add(event.tool_name || event.tool);
      if (this.config.verbose) {
        console.log(`  🔧 Tool: ${event.tool_name || event.tool}`);
      }
    });

    this.cli.on('assistant', (event) => {
      if (event.message && this.config.verbose) {
        console.log(`  💬 ${event.message.substring(0, 100)}...`);
      }
    });

    try {
      const result = await this.cli.execute(prompt);

      const duration = Date.now() - startTime;
      const output = result.output;

      // Check completion status
      const isComplete = output.includes('TICKET_COMPLETE');
      const isBlocked = output.includes('TICKET_BLOCKED:');
      const blockReason = isBlocked
        ? output.match(/TICKET_BLOCKED:\s*(.+)/)?.[1] || 'Unknown reason'
        : null;

      // Create execution result
      const executionResult = {
        success: isComplete,
        ticketId: ticket.id,
        ticketIdentifier: ticket.identifier,
        turnsUsed: result.turnsUsed,
        sessionId: result.sessionId,
        toolsUsed: Array.from(toolsUsed),
        duration,
        blocked: isBlocked,
        blockReason,
        timestamp: new Date().toISOString()
      };

      // Trigger deployment if successful
      if (isComplete && this.config.autoDeploy) {
        executionResult.deployment = await this.triggerDeployment();
      }

      // Update Linear status
      if (isComplete) {
        await this.updateTicketStatus(ticket.id, 'completed');
        await this.addComment(ticket.id, `✅ Agent completed this ticket

**Stats:**
- Duration: ${Math.round(duration / 1000)}s
- Turns used: ${result.turnsUsed}
- Tools used: ${Array.from(toolsUsed).join(', ')}
- Session ID: ${result.sessionId}
${executionResult.deployment ? `\n**Deployment:** ${executionResult.deployment.url || 'Triggered'}` : ''}`);

        // Remove current ticket file
        if (fs.existsSync(CURRENT_TICKET_FILE)) {
          fs.unlinkSync(CURRENT_TICKET_FILE);
        }
      } else if (isBlocked) {
        await this.addComment(ticket.id, `⚠️ Agent blocked: ${blockReason}

Please review and provide guidance. The agent will retry after human intervention.`);
      }

      // Log execution
      this.executionLog.executions.push(executionResult);
      this.saveExecutionLog();

      return executionResult;

    } catch (err) {
      const duration = Date.now() - startTime;

      const executionResult = {
        success: false,
        ticketId: ticket.id,
        ticketIdentifier: ticket.identifier,
        turnsUsed: 0,
        sessionId: null,
        toolsUsed: Array.from(toolsUsed),
        duration,
        error: err.message,
        timestamp: new Date().toISOString()
      };

      await this.addComment(ticket.id, `❌ Agent error: ${err.message}`);

      this.executionLog.executions.push(executionResult);
      this.saveExecutionLog();

      throw err;
    }
  }

  /**
   * Run single ticket processing
   */
  async processOnce() {
    await this.syncTickets();

    let ticket = this.getCurrentTicket();
    if (!ticket) {
      ticket = await this.startTicket();
    }

    if (!ticket) {
      console.log('📭 No tickets to process');
      return null;
    }

    return this.processTicket(ticket);
  }

  /**
   * Run continuous agent loop
   */
  async runLoop(intervalSeconds = 300) {
    console.log(`\n🔄 Starting Orquesta Agent Loop (sync interval: ${intervalSeconds}s)\n`);

    while (true) {
      try {
        const result = await this.processOnce();

        if (result) {
          console.log(`\n${'─'.repeat(60)}`);
          console.log(`✅ Ticket ${result.ticketIdentifier} processed`);
          console.log(`   Success: ${result.success}`);
          console.log(`   Duration: ${Math.round(result.duration / 1000)}s`);
          console.log(`   Turns: ${result.turnsUsed}`);
          console.log(`${'─'.repeat(60)}\n`);
        } else {
          console.log(`\n💤 No tickets, waiting ${intervalSeconds}s...\n`);
          await this.sleep(intervalSeconds * 1000);
        }

        // Brief pause between tickets
        await this.sleep(5000);

      } catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
        await this.sleep(30000); // Wait 30s before retry
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution stats
   */
  getStats() {
    const executions = this.executionLog.executions;
    const successful = executions.filter(e => e.success);
    const failed = executions.filter(e => !e.success);

    return {
      total: executions.length,
      successful: successful.length,
      failed: failed.length,
      avgDuration: executions.length > 0
        ? Math.round(executions.reduce((sum, e) => sum + e.duration, 0) / executions.length / 1000)
        : 0,
      avgTurns: executions.length > 0
        ? Math.round(executions.reduce((sum, e) => sum + (e.turnsUsed || 0), 0) / executions.length)
        : 0,
      toolUsage: this.getToolUsageStats()
    };
  }

  getToolUsageStats() {
    const toolCounts = {};
    for (const exec of this.executionLog.executions) {
      for (const tool of exec.toolsUsed || []) {
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      }
    }
    return toolCounts;
  }
}

// CLI
const command = process.argv[2];

async function main() {
  const config = {
    linearApiKey: process.env.LINEAR_API_KEY,
    linearTeamId: process.env.LINEAR_TEAM_ID,
    orquestaToken: process.env.ORQUESTA_TOKEN,
    orquestaProjectId: process.env.ORQUESTA_PROJECT_ID || 'fb324d50-c231-4aa4-93b6-cfc424a449d0',
    maxTurns: parseInt(process.env.AGENT_MAX_TURNS || '30'),
    autoDeploy: process.env.AGENT_AUTO_DEPLOY !== 'false',
    verbose: process.env.AGENT_VERBOSE === 'true'
  };

  if (!config.linearApiKey || !config.linearTeamId) {
    console.error('ERROR: LINEAR_API_KEY and LINEAR_TEAM_ID environment variables required');
    process.exit(1);
  }

  const agent = new OrquestaAgent(config);

  switch (command) {
    case 'sync':
      await agent.syncTickets();
      break;

    case 'once':
      const result = await agent.processOnce();
      if (result) {
        console.log('\n📊 Execution Result:');
        console.log(JSON.stringify(result, null, 2));
      }
      break;

    case 'loop':
      const interval = parseInt(process.argv[3] || '300');
      await agent.runLoop(interval);
      break;

    case 'stats':
      const stats = agent.getStats();
      console.log('\n📊 Agent Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    case 'current':
      const current = agent.getCurrentTicket();
      if (current) {
        console.log(`Current: [${current.identifier}] ${current.title}`);
        console.log(`\n${current.description || 'No description'}`);
        console.log(`\n🔗 ${current.url}`);
      } else {
        console.log('No current ticket');
      }
      break;

    default:
      console.log(`
Orquesta-Claude Agent Orchestrator

Usage: node orquesta-agent.js <command> [options]

Commands:
  sync              - Sync tickets from Linear (CIDIF only)
  once              - Process one ticket and exit
  loop [interval]   - Run continuous loop (default: 300s)
  stats             - Show execution statistics
  current           - Show current ticket

Environment Variables:
  LINEAR_API_KEY         - Linear API key (required)
  LINEAR_TEAM_ID         - Linear team ID (required)
  ORQUESTA_TOKEN         - Orquesta agent token (for deployments)
  ORQUESTA_PROJECT_ID    - Orquesta project ID
  AGENT_MAX_TURNS        - Max Claude turns (default: 30)
  AGENT_AUTO_DEPLOY      - Auto-deploy after success (default: true)
  AGENT_VERBOSE          - Verbose output (default: false)
`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

export { OrquestaAgent };
