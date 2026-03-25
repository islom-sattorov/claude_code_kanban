import { spawn } from 'child_process';

export interface ClaudeRunOptions {
  prompt: string;
  cwd: string;
  allowedTools?: string[];
  maxTurns?: number;
  sessionId?: string;
  timeoutMs?: number;
  onLog?: (line: string) => void;
}

export interface ClaudeRunResult {
  result: string;
  sessionId: string;
  costUsd?: number;
  exitCode: number;
}

function formatStreamEvent(event: Record<string, unknown>): string | null {
  const type = event.type as string;

  if (type === 'assistant') {
    const message = event.message as { content?: Array<{ type: string; text?: string }> } | undefined;
    const textBlock = message?.content?.find(b => b.type === 'text');
    if (textBlock?.text) return `[claude] ${textBlock.text.trim()}`;
  }

  if (type === 'tool_use') {
    const toolName = (event.tool_name ?? (event as Record<string, unknown>).name) as string | undefined;
    const input = event.tool_input ?? event.input;
    const detail = input ? JSON.stringify(input).slice(0, 120) : '';
    return `[tool] ${toolName ?? 'unknown'}${detail ? ` ${detail}` : ''}`;
  }

  if (type === 'system' && event.subtype === 'init') {
    const tools = (event.tools as string[] | undefined) ?? [];
    return `[init] tools: ${tools.join(', ')}`;
  }

  return null;
}

export async function runClaudeCode(opts: ClaudeRunOptions): Promise<ClaudeRunResult> {
  const args: string[] = ['-p', opts.prompt, '--output-format', 'stream-json', '--verbose'];

  if (opts.maxTurns) args.push('--max-turns', String(opts.maxTurns));
  if (opts.sessionId) args.push('--session-id', opts.sessionId);
  if (opts.allowedTools?.length) {
    args.push('--allowedTools', opts.allowedTools.join(','));
  }

  return new Promise((resolve, reject) => {
    const proc = spawn('claude', args, {
      cwd: opts.cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let lineBuffer = '';
    let resultEvent: ClaudeRunResult | null = null;
    let stderr = '';

    proc.stdout.on('data', (d: Buffer) => {
      lineBuffer += d.toString();
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const event = JSON.parse(trimmed) as Record<string, unknown>;

          // Capture the final result
          if (event.type === 'result') {
            resultEvent = {
              result: (event.result as string) ?? '',
              sessionId: (event.session_id as string) ?? '',
              costUsd: (event as Record<string, unknown> & { usage?: { cost_usd?: number } }).usage?.cost_usd,
              exitCode: 0,
            };
          }

          // Forward formatted line to caller
          if (opts.onLog) {
            const formatted = formatStreamEvent(event);
            if (formatted) opts.onLog(formatted);
          }
        } catch {
          // non-JSON line — forward raw if caller wants it
          if (opts.onLog && trimmed) opts.onLog(trimmed);
        }
      }
    });

    proc.stderr.on('data', (d: Buffer) => {
      stderr += d.toString();
      if (opts.onLog) {
        d.toString().split('\n').forEach(l => { if (l.trim()) opts.onLog!(`[stderr] ${l.trim()}`); });
      }
    });

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`Claude Code timeout after ${opts.timeoutMs ?? 120000}ms`));
    }, opts.timeoutMs ?? 120000);

    proc.on('close', (code: number) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(`Claude Code exited with code ${code}: ${stderr}`));
      }
      if (resultEvent) {
        resolve({ ...resultEvent, exitCode: code });
      } else {
        reject(new Error('Claude Code stream ended without a result event'));
      }
    });

    proc.on('error', (err: Error) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('Claude Code CLI not installed. Run: npm install -g @anthropic-ai/claude-code'));
      } else {
        reject(err);
      }
    });
  });
}
