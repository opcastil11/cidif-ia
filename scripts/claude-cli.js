#!/usr/bin/env node
/**
 * Claude CLI Wrapper Module
 * Provides programmatic access to Claude Code CLI with JSON output support
 * Based on: https://docs.anthropic.com/en/docs/claude-code/cli-reference
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

/**
 * @typedef {Object} ClaudeConfig
 * @property {string[]} [allowedTools] - List of allowed tools (Bash, Read, Edit, Write, Glob, Grep, Task, WebFetch, etc.)
 * @property {string[]} [disallowedTools] - List of disallowed tools
 * @property {number} [maxTurns] - Maximum number of agentic turns before stopping
 * @property {string} [systemPrompt] - System prompt to prepend
 * @property {string} [appendSystemPrompt] - System prompt to append
 * @property {string} [model] - Model to use (claude-sonnet-4-20250514, etc.)
 * @property {'text'|'json'|'stream-json'} [outputFormat] - Output format
 * @property {boolean} [verbose] - Enable verbose output
 * @property {string} [cwd] - Working directory
 * @property {boolean} [dangerouslySkipPermissions] - Skip permission prompts (use with caution)
 * @property {string[]} [mcpServers] - MCP server config files
 */

/**
 * @typedef {Object} ClaudeMessage
 * @property {'assistant'|'user'|'system'|'result'} type
 * @property {string} content
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} ClaudeResult
 * @property {boolean} success
 * @property {string} output
 * @property {ClaudeMessage[]} messages
 * @property {string} sessionId
 * @property {number} turnsUsed
 * @property {Object} [error]
 */

export class ClaudeCLI extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      outputFormat: 'stream-json',
      maxTurns: 25,
      ...config
    };
  }

  /**
   * Build CLI arguments from config
   * @returns {string[]}
   */
  buildArgs(prompt) {
    const args = ['-p', prompt];

    if (this.config.outputFormat) {
      args.push('--output-format', this.config.outputFormat);
    }

    if (this.config.maxTurns) {
      args.push('--max-turns', String(this.config.maxTurns));
    }

    if (this.config.systemPrompt) {
      args.push('--system-prompt', this.config.systemPrompt);
    }

    if (this.config.appendSystemPrompt) {
      args.push('--append-system-prompt', this.config.appendSystemPrompt);
    }

    if (this.config.model) {
      args.push('--model', this.config.model);
    }

    if (this.config.allowedTools?.length) {
      args.push('--allowedTools', this.config.allowedTools.join(','));
    }

    if (this.config.disallowedTools?.length) {
      args.push('--disallowedTools', this.config.disallowedTools.join(','));
    }

    if (this.config.verbose) {
      args.push('--verbose');
    }

    if (this.config.dangerouslySkipPermissions) {
      args.push('--dangerously-skip-permissions');
    }

    if (this.config.mcpServers?.length) {
      this.config.mcpServers.forEach(server => {
        args.push('--mcp-config', server);
      });
    }

    return args;
  }

  /**
   * Execute a prompt with Claude CLI
   * @param {string} prompt - The prompt to execute
   * @returns {Promise<ClaudeResult>}
   */
  async execute(prompt) {
    return new Promise((resolve, reject) => {
      const args = this.buildArgs(prompt);
      const cwd = this.config.cwd || process.cwd();

      const messages = [];
      let outputBuffer = '';
      let sessionId = null;
      let turnsUsed = 0;

      this.emit('start', { prompt, args, cwd });

      const proc = spawn('claude', args, {
        cwd,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      proc.stdout.on('data', (data) => {
        const chunk = data.toString();
        outputBuffer += chunk;

        // Parse stream-json output
        if (this.config.outputFormat === 'stream-json') {
          const lines = chunk.split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const event = JSON.parse(line);
              this.handleStreamEvent(event, messages);

              if (event.session_id) {
                sessionId = event.session_id;
              }
              if (event.num_turns !== undefined) {
                turnsUsed = event.num_turns;
              }
            } catch {
              // Not JSON, emit as raw
              this.emit('raw', line);
            }
          }
        } else {
          this.emit('output', chunk);
        }
      });

      proc.stderr.on('data', (data) => {
        const error = data.toString();
        this.emit('error', error);
      });

      proc.on('close', (code) => {
        const success = code === 0;
        const result = {
          success,
          output: outputBuffer,
          messages,
          sessionId,
          turnsUsed,
          exitCode: code
        };

        if (!success) {
          result.error = { code, message: `Process exited with code ${code}` };
        }

        this.emit('complete', result);
        resolve(result);
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Handle streaming JSON events
   * @param {Object} event
   * @param {ClaudeMessage[]} messages
   */
  handleStreamEvent(event, messages) {
    switch (event.type) {
      case 'system':
        this.emit('system', event);
        messages.push({ type: 'system', content: event.message || '', metadata: event });
        break;

      case 'assistant':
        this.emit('assistant', event);
        if (event.message) {
          messages.push({ type: 'assistant', content: event.message, metadata: event });
        }
        break;

      case 'user':
        this.emit('user', event);
        messages.push({ type: 'user', content: event.message || '', metadata: event });
        break;

      case 'result':
        this.emit('result', event);
        messages.push({ type: 'result', content: event.result || '', metadata: event });
        break;

      case 'tool_use':
        this.emit('tool_use', event);
        break;

      case 'tool_result':
        this.emit('tool_result', event);
        break;

      default:
        this.emit('event', event);
    }
  }

  /**
   * Resume a previous session
   * @param {string} sessionId - Session ID to resume
   * @param {string} prompt - New prompt
   * @returns {Promise<ClaudeResult>}
   */
  async resume(sessionId, prompt) {
    const args = this.buildArgs(prompt);
    args.push('--resume', sessionId);

    // Create a temporary CLI instance with the modified args
    const resumeConfig = { ...this.config };
    const tempCLI = new ClaudeCLI(resumeConfig);

    // Override buildArgs to include --resume
    const originalBuildArgs = tempCLI.buildArgs.bind(tempCLI);
    tempCLI.buildArgs = (p) => {
      const baseArgs = originalBuildArgs(p);
      baseArgs.push('--resume', sessionId);
      return baseArgs;
    };

    return tempCLI.execute(prompt);
  }
}

/**
 * Create a pre-configured Claude CLI for agent workflows
 * @param {Object} options
 * @returns {ClaudeCLI}
 */
export function createAgentCLI(options = {}) {
  return new ClaudeCLI({
    outputFormat: 'stream-json',
    maxTurns: options.maxTurns || 30,
    allowedTools: options.allowedTools || [
      'Bash',
      'Read',
      'Write',
      'Edit',
      'Glob',
      'Grep',
      'Task',
      'WebFetch',
      'TodoWrite'
    ],
    systemPrompt: options.systemPrompt || `You are an autonomous agent working on the CIDIF.TECH project.
Follow the instructions in CLAUDE.md for project guidelines.
Complete tasks fully before marking them done.
Always commit and push changes to git.
Use the Orquesta Deploy API for deployments (NOT vercel CLI).`,
    dangerouslySkipPermissions: options.autonomousMode ?? true,
    cwd: options.cwd || process.cwd(),
    ...options
  });
}

/**
 * Quick execute a single prompt
 * @param {string} prompt
 * @param {ClaudeConfig} config
 * @returns {Promise<ClaudeResult>}
 */
export async function executePrompt(prompt, config = {}) {
  const cli = new ClaudeCLI(config);
  return cli.execute(prompt);
}

// CLI usage
if (process.argv[1]?.includes('claude-cli.js')) {
  const prompt = process.argv[2];

  if (!prompt) {
    console.log(`
Claude CLI Wrapper

Usage: node claude-cli.js "<prompt>" [options]

Options are passed via environment variables:
  CLAUDE_MAX_TURNS     - Maximum turns (default: 25)
  CLAUDE_OUTPUT_FORMAT - Output format: text, json, stream-json (default: stream-json)
  CLAUDE_MODEL         - Model to use
  CLAUDE_ALLOWED_TOOLS - Comma-separated list of allowed tools

Example:
  node claude-cli.js "Fix the TypeScript errors in src/app/page.tsx"
`);
    process.exit(1);
  }

  const config = {
    maxTurns: parseInt(process.env.CLAUDE_MAX_TURNS || '25'),
    outputFormat: process.env.CLAUDE_OUTPUT_FORMAT || 'stream-json',
    model: process.env.CLAUDE_MODEL,
    allowedTools: process.env.CLAUDE_ALLOWED_TOOLS?.split(','),
    dangerouslySkipPermissions: true
  };

  const cli = new ClaudeCLI(config);

  cli.on('assistant', (event) => {
    if (event.message) {
      console.log('\n🤖 Assistant:', event.message);
    }
  });

  cli.on('tool_use', (event) => {
    console.log(`\n🔧 Using tool: ${event.tool_name}`);
  });

  cli.on('error', (error) => {
    console.error('\n❌ Error:', error);
  });

  cli.execute(prompt)
    .then(result => {
      console.log('\n✅ Complete');
      console.log(`Turns used: ${result.turnsUsed}`);
      console.log(`Session ID: ${result.sessionId}`);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
