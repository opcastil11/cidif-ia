#!/usr/bin/env node
/**
 * Linear API Integration for Autonomous Agent Workflow
 * Syncs tickets from Linear and manages them for Claude Code agent
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TICKETS_FILE = path.join(process.cwd(), '.agent', 'tickets.json');
const CURRENT_TICKET_FILE = path.join(process.cwd(), '.agent', 'current-ticket.json');

function getApiKey() {
  const key = process.env.LINEAR_API_KEY;
  if (!key) {
    console.error('ERROR: LINEAR_API_KEY environment variable not set');
    process.exit(1);
  }
  return key;
}

function getTeamId() {
  const id = process.env.LINEAR_TEAM_ID;
  if (!id) {
    console.error('ERROR: LINEAR_TEAM_ID environment variable not set');
    process.exit(1);
  }
  return id;
}

async function graphqlRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });

    const options = {
      hostname: 'api.linear.app',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getApiKey(),
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.errors) {
            reject(new Error(parsed.errors[0].message));
          } else {
            resolve(parsed.data);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fetchAssignedTickets() {
  const query = `
    query GetAssignedIssues($teamId: ID!) {
      issues(
        filter: {
          team: { id: { eq: $teamId } }
          state: { type: { in: ["backlog", "unstarted", "started"] } }
          labels: { name: { eq: "agent" } }
        }
        orderBy: updatedAt
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
          state {
            name
            type
          }
          labels {
            nodes {
              name
            }
          }
        }
      }
    }
  `;

  const result = await graphqlRequest(query, { teamId: getTeamId() });
  return result.issues.nodes;
}

async function updateTicketStatus(issueId, stateId) {
  const query = `
    mutation UpdateIssue($issueId: String!, $stateId: String!) {
      issueUpdate(id: $issueId, input: { stateId: $stateId }) {
        success
        issue {
          id
          state {
            name
          }
        }
      }
    }
  `;

  await graphqlRequest(query, { issueId, stateId });
}

async function addComment(issueId, body) {
  const query = `
    mutation AddComment($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
      }
    }
  `;

  await graphqlRequest(query, { issueId, body });
}

async function getWorkflowStates() {
  const query = `
    query GetWorkflowStates($teamId: String!) {
      team(id: $teamId) {
        states {
          nodes {
            id
            name
            type
          }
        }
      }
    }
  `;

  const result = await graphqlRequest(query, { teamId: getTeamId() });
  return result.team.states.nodes;
}

function ensureAgentDir() {
  const dir = path.join(process.cwd(), '.agent');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function syncTickets() {
  console.log('📥 Syncing tickets from Linear...');

  ensureAgentDir();
  const tickets = await fetchAssignedTickets();

  const queue = {
    lastSync: new Date().toISOString(),
    tickets,
  };

  fs.writeFileSync(TICKETS_FILE, JSON.stringify(queue, null, 2));
  console.log(`✅ Synced ${tickets.length} tickets with "agent" label`);

  tickets.forEach((t, i) => {
    console.log(`  ${i + 1}. [${t.identifier}] ${t.title} (${t.state.name})`);
  });
}

function getNextTicket() {
  if (!fs.existsSync(TICKETS_FILE)) {
    console.error('No tickets file. Run: npm run agent:sync');
    return null;
  }

  const queue = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf-8'));
  const pending = queue.tickets.filter(t => t.state.type !== 'completed' && t.state.type !== 'canceled');

  if (pending.length === 0) {
    console.log('🎉 No pending tickets!');
    return null;
  }

  return pending[0];
}

async function startTicket(identifier) {
  ensureAgentDir();

  let ticket = null;

  if (identifier) {
    if (!fs.existsSync(TICKETS_FILE)) {
      console.error('No tickets file. Run: npm run agent:sync');
      return;
    }
    const queue = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf-8'));
    ticket = queue.tickets.find(t => t.identifier === identifier) || null;
  } else {
    ticket = getNextTicket();
  }

  if (!ticket) {
    console.log('No ticket to start');
    return;
  }

  // Get workflow states
  const states = await getWorkflowStates();
  const inProgressState = states.find(s => s.type === 'started');

  if (inProgressState) {
    await updateTicketStatus(ticket.id, inProgressState.id);
    console.log(`🚀 Started ticket: [${ticket.identifier}] ${ticket.title}`);
  }

  // Save current ticket
  fs.writeFileSync(CURRENT_TICKET_FILE, JSON.stringify(ticket, null, 2));

  // Add comment
  await addComment(ticket.id, '🤖 Agent started working on this ticket');

  console.log(`\n📋 Ticket Details:\n${ticket.description || 'No description'}`);
  console.log(`\n🔗 ${ticket.url}`);
}

async function completeTicket(comment) {
  if (!fs.existsSync(CURRENT_TICKET_FILE)) {
    console.error('No current ticket. Run: npm run agent:start');
    return;
  }

  const ticket = JSON.parse(fs.readFileSync(CURRENT_TICKET_FILE, 'utf-8'));

  // Get workflow states
  const states = await getWorkflowStates();
  const doneState = states.find(s => s.type === 'completed');

  if (doneState) {
    await updateTicketStatus(ticket.id, doneState.id);
  }

  const finalComment = comment || '✅ Agent completed this ticket';
  await addComment(ticket.id, finalComment);

  // Remove current ticket file
  fs.unlinkSync(CURRENT_TICKET_FILE);

  console.log(`✅ Completed ticket: [${ticket.identifier}] ${ticket.title}`);
}

function getCurrentTicket() {
  if (!fs.existsSync(CURRENT_TICKET_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(CURRENT_TICKET_FILE, 'utf-8'));
}

// CLI
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'sync':
    syncTickets().catch(console.error);
    break;
  case 'list':
    if (fs.existsSync(TICKETS_FILE)) {
      const queue = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf-8'));
      console.log(`Last sync: ${queue.lastSync}\n`);
      queue.tickets.forEach((t, i) => {
        console.log(`${i + 1}. [${t.identifier}] ${t.title}`);
        console.log(`   Status: ${t.state.name} | Priority: ${t.priority}`);
      });
    } else {
      console.log('No tickets. Run: npm run agent:sync');
    }
    break;
  case 'next':
    const next = getNextTicket();
    if (next) {
      console.log(`Next ticket: [${next.identifier}] ${next.title}`);
      console.log(`\n${next.description || 'No description'}`);
    }
    break;
  case 'start':
    startTicket(arg).catch(console.error);
    break;
  case 'complete':
    completeTicket(arg).catch(console.error);
    break;
  case 'current':
    const current = getCurrentTicket();
    if (current) {
      console.log(`Current: [${current.identifier}] ${current.title}`);
      console.log(`\n${current.description || 'No description'}`);
      console.log(`\n🔗 ${current.url}`);
    } else {
      console.log('No current ticket');
    }
    break;
  case 'states':
    getWorkflowStates().then(states => {
      console.log('Workflow States:');
      states.forEach(s => console.log(`  - ${s.name} (${s.type}): ${s.id}`));
    }).catch(console.error);
    break;
  default:
    console.log(`
Linear Sync CLI

Commands:
  sync      - Fetch tickets with "agent" label from Linear
  list      - List all synced tickets
  next      - Show next ticket to work on
  start     - Start working on next ticket (or specify identifier)
  complete  - Mark current ticket as done
  current   - Show current ticket being worked on
  states    - List workflow states for the team

Environment Variables Required:
  LINEAR_API_KEY  - Your Linear API key
  LINEAR_TEAM_ID  - Your Linear team ID
`);
}
