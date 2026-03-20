import { spawn } from 'child_process';

export interface ClaudeRunOptions {
  prompt: string;
  cwd: string;
  allowedTools?: string[];
  outputFormat?: 'text' | 'json' | 'stream-json';
  maxTurns?: number;
  sessionId?: string;
  timeoutMs?: number;
}

export interface ClaudeRunResult {
  result: string;
  sessionId: string;
  costUsd?: number;
  exitCode: number;
}

export async function runClaudeCode(opts: ClaudeRunOptions): Promise<ClaudeRunResult> {
  const args: string[] = ['-p', opts.prompt, '--output-format', opts.outputFormat ?? 'json'];

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

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`Claude Code timeout after ${opts.timeoutMs ?? 120000}ms`));
    }, opts.timeoutMs ?? 120000);

    proc.on('close', (code: number) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(`Claude Code exited with code ${code}: ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve({
          result: parsed.result ?? stdout,
          sessionId: parsed.session_id ?? '',
          costUsd: parsed.usage?.cost_usd,
          exitCode: code,
        });
      } catch {
        // Try to extract JSON
        const match = stdout.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            resolve({ result: JSON.stringify(parsed), sessionId: '', exitCode: code });
            return;
          } catch {
            // fall through
          }
        }
        reject(new Error(`Failed to parse Claude Code output: ${stdout}`));
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
