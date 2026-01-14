import { spawn, execFileSync } from 'child_process';

/**
 * Result of executing a GT command.
 */
export interface GtResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    stderr?: string;
  };
  exitCode: number;
}

/**
 * Options for GT command execution.
 */
export interface GtExecOptions {
  /** Working directory for the command */
  cwd?: string;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Whether to parse stdout as JSON (default: true for commands with --json) */
  parseJson?: boolean;
  /** Additional environment variables to set */
  env?: Record<string, string | undefined>;
}

const DEFAULT_TIMEOUT = 30000;

// GT commands must run from the town root to work correctly
const GT_TOWN_ROOT = process.env['GT_TOWN_ROOT'] ?? '/Users/will/gt';

/**
 * Resolves the gt binary path dynamically.
 * Priority: GT_BIN env var > `which gt` > $HOME/go/bin/gt > 'gt' (PATH lookup)
 */
function resolveGtBinary(): string {
  // 1. Explicit env var takes precedence
  if (process.env['GT_BIN']) {
    return process.env['GT_BIN'];
  }

  // 2. Try to find gt in PATH using 'which' (Unix) or 'where' (Windows)
  try {
    const whichCmd = process.platform === 'win32' ? 'where' : 'which';
    const resolved = execFileSync(whichCmd, ['gt'], {
      encoding: 'utf8',
      timeout: 5000,
    }).trim();
    if (resolved) {
      // 'where' on Windows may return multiple lines; take the first
      const firstLine = resolved.split('\n')[0];
      if (firstLine) {
        return firstLine.trim();
      }
    }
  } catch {
    // which/where failed, continue to fallbacks
  }

  // 3. Try $HOME/go/bin/gt (common Go install location)
  if (process.env['HOME']) {
    return `${process.env['HOME']}/go/bin/gt`;
  }

  // 4. Last resort: let spawn try PATH resolution
  return 'gt';
}

// Cache the resolved binary path at module load time
const GT_BIN = resolveGtBinary();

/**
 * Executes a GT command and returns the result.
 *
 * @param args - Command arguments (e.g., ['status', '--json'])
 * @param options - Execution options
 * @returns Promise resolving to the command result
 */
export async function execGt<T = unknown>(
  args: string[],
  options: GtExecOptions = {}
): Promise<GtResult<T>> {
  const { cwd = GT_TOWN_ROOT, timeout = DEFAULT_TIMEOUT, parseJson = true, env } = options;

  return new Promise((resolve) => {
    const child = spawn(GT_BIN, args, {
      cwd,
      timeout,
      env: { ...process.env, ...env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      resolve({
        success: false,
        error: {
          code: 'SPAWN_ERROR',
          message: err.message,
        },
        exitCode: -1,
      });
    });

    child.on('close', (code) => {
      const exitCode = code ?? 0;

      if (exitCode !== 0) {
        const stderrTrimmed = stderr.trim();
        resolve({
          success: false,
          error: {
            code: 'COMMAND_FAILED',
            message: stderrTrimmed || `Command exited with code ${exitCode}`,
            ...(stderrTrimmed ? { stderr: stderrTrimmed } : {}),
          },
          exitCode,
        });
        return;
      }

      // Parse JSON output if requested
      if (parseJson && stdout.trim()) {
        try {
          const data = JSON.parse(stdout) as T;
          resolve({ success: true, data, exitCode });
        } catch {
          resolve({
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: 'Failed to parse JSON output',
              stderr: stdout.substring(0, 500),
            },
            exitCode,
          });
        }
      } else {
        // Return raw stdout as data for non-JSON commands
        resolve({
          success: true,
          data: stdout.trim() as unknown as T,
          exitCode,
        });
      }
    });
  });
}

/**
 * Parses a single agent line from gt agents list output.
 * Format: "  🎩 Mayor" or "  👷 crew/name"
 */
interface ParsedAgent {
  name: string;
  type: string;
  rig: string | null;
  running: boolean;
  state: string;
  unreadMail: number;
}

/**
 * Maps emoji to agent type.
 */
const EMOJI_TYPE_MAP: Record<string, string> = {
  '🎩': 'mayor',
  '🏭': 'refinery',
  '🦉': 'witness',
  '👷': 'crew',
  '🐱': 'polecat',
  '😈': 'deacon',
};

/**
 * Parses the text output of gt agents list --all into structured data.
 *
 * Example input:
 *   🎩 Mayor
 * ── gastown ──
 *   🏭 refinery
 *   🦉 witness
 *   👷 crew/vin
 */
function parseAgentsListOutput(output: string): ParsedAgent[] {
  const agents: ParsedAgent[] = [];
  let currentRig: string | null = null;

  const lines = output.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for rig header: "── gastown ──"
    const rigMatch = trimmed.match(/^──\s+(.+?)\s+──$/);
    if (rigMatch?.[1]) {
      currentRig = rigMatch[1];
      continue;
    }

    // Check for agent line: "🎩 Mayor" or "👷 crew/name"
    for (const [emoji, type] of Object.entries(EMOJI_TYPE_MAP)) {
      if (trimmed.startsWith(emoji)) {
        const namePart = trimmed.slice(emoji.length).trim();
        agents.push({
          name: namePart.toLowerCase(),
          type,
          rig: currentRig,
          running: true, // Assume running since they appear in the list
          state: 'idle',
          unreadMail: 0,
        });
        break;
      }
    }
  }

  return agents;
}

/**
 * GT command executor with typed methods for each operation.
 */
export const gt = {
  /**
   * Get gastown status.
   */
  async status<T = unknown>(options?: GtExecOptions): Promise<GtResult<T>> {
    return execGt<T>(['status', '--json'], options);
  },

  /**
   * Start gastown (gt up).
   */
  async up(options?: GtExecOptions): Promise<GtResult<string>> {
    return execGt<string>(['up'], { ...options, parseJson: false });
  },

  /**
   * Stop gastown (gt down).
   */
  async down(options?: GtExecOptions): Promise<GtResult<string>> {
    return execGt<string>(['down'], { ...options, parseJson: false });
  },

  /**
   * Mail operations.
   */
  mail: {
    /**
     * Get inbox messages.
     * Runs from the gastown_boy rig root to get the rig's mail.
     */
    async inbox<T = unknown>(options?: GtExecOptions): Promise<GtResult<T>> {
      return execGt<T>(['mail', 'inbox', '--json'], {
        ...options,
        cwd: process.env['GT_TOWN_ROOT']
          ? `${process.env['GT_TOWN_ROOT']}/gastown_boy`
          : '/Users/will/gt/gastown_boy',
      });
    },

    /**
     * Read a specific message.
     * Runs from the gastown_boy rig root for consistent context.
     */
    async read<T = unknown>(
      messageId: string,
      options?: GtExecOptions
    ): Promise<GtResult<T>> {
      return execGt<T>(['mail', 'read', messageId, '--json'], {
        ...options,
        cwd: process.env['GT_TOWN_ROOT']
          ? `${process.env['GT_TOWN_ROOT']}/gastown_boy`
          : '/Users/will/gt/gastown_boy',
      });
    },

    /**
     * Send a message.
     */
    async send(
      to: string,
      subject: string,
      body: string,
      sendOptions?: {
        type?: 'notification' | 'task' | 'scavenge' | 'reply';
        priority?: 0 | 1 | 2 | 3 | 4;
        replyTo?: string;
        permanent?: boolean;
      },
      options?: GtExecOptions
    ): Promise<GtResult<string>> {
      const args = ['mail', 'send', to, '-s', subject, '-m', body];

      // UI messages should be permanent by default (not wisps)
      if (sendOptions?.permanent !== false) {
        args.push('--permanent');
      }

      if (sendOptions?.type) {
        args.push('--type', sendOptions.type);
      }
      if (sendOptions?.priority !== undefined) {
        args.push('--priority', sendOptions.priority.toString());
      }
      if (sendOptions?.replyTo) {
        args.push('--reply-to', sendOptions.replyTo);
      }

      // Run from gastown_boy rig with explicit actor identity
      return execGt<string>(args, {
        ...options,
        parseJson: false,
        cwd: process.env['GT_TOWN_ROOT']
          ? `${process.env['GT_TOWN_ROOT']}/gastown_boy`
          : '/Users/will/gt/gastown_boy',
        env: {
          ...process.env,
          BD_ACTOR: 'gastown_boy/ui',
        },
      });
    },

    /**
     * Mark a message as read.
     * Runs from the gastown_boy rig root for consistent context.
     */
    async markRead(
      messageId: string,
      options?: GtExecOptions
    ): Promise<GtResult<string>> {
      return execGt<string>(['mail', 'mark-read', messageId], {
        ...options,
        parseJson: false,
        cwd: process.env['GT_TOWN_ROOT']
          ? `${process.env['GT_TOWN_ROOT']}/gastown_boy`
          : '/Users/will/gt/gastown_boy',
      });
    },

    /**
     * Get a thread of messages.
     * Runs from the gastown_boy rig root for consistent context.
     */
    async thread<T = unknown>(
      threadId: string,
      options?: GtExecOptions
    ): Promise<GtResult<T>> {
      return execGt<T>(['mail', 'thread', threadId, '--json'], {
        ...options,
        cwd: process.env['GT_TOWN_ROOT']
          ? `${process.env['GT_TOWN_ROOT']}/gastown_boy`
          : '/Users/will/gt/gastown_boy',
      });
    },
  },

  /**
   * Agent operations.
   */
  agents: {
    /**
     * List all agents.
     * Note: gt agents list doesn't support --json, so we parse text output.
     */
    async list<T = unknown>(options?: GtExecOptions): Promise<GtResult<T>> {
      const result = await execGt<string>(['agents', 'list', '--all'], {
        ...options,
        parseJson: false,
      });

      if (!result.success) {
        return result as GtResult<T>;
      }

      // Parse the text output into structured data
      const agents = parseAgentsListOutput(result.data ?? '');
      return { success: true, data: agents as T, exitCode: result.exitCode };
    },

    /**
     * Check agent health.
     */
    async check<T = unknown>(options?: GtExecOptions): Promise<GtResult<T>> {
      return execGt<T>(['agents', 'check', '--json'], options);
    },
  },

  /**
   * Execute an arbitrary GT command.
   */
  exec: execGt,
};

export default gt;
