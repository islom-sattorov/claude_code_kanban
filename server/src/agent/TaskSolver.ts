import { Task } from '../../../shared/types';
import { runClaudeCode } from '../claude/claudeCodeRunner';
import { getConfig } from '../routes/config';

export interface SolverResult {
  filesChanged: string[];
  commitMessage: string;
  rationale: string;
}

export async function solveTask(task: Task): Promise<SolverResult> {
  const config = getConfig();

  const solvePrompt = `You are an autonomous developer agent. Your task is:
  Title: ${task.title}
  Description: ${task.description ?? 'none'}
  Tags: ${task.tags.join(', ')}

Instructions:
1. Read the relevant files in this repository to understand context.
2. Implement the minimal code change that satisfies the task.
3. Write the changes to disk (do NOT just describe them).
4. Respond ONLY with a JSON object:
   {
     "files_changed": ["list", "of", "relative", "file", "paths"],
     "commit_message": "feat: conventional commits format",
     "rationale": "1-2 sentence explanation"
   }
Do NOT include markdown fences. Output valid JSON only.`;

  const result = await runClaudeCode({
    prompt: solvePrompt,
    cwd: config.repoPath,
    allowedTools: ['Read', 'Write', 'Edit', 'Bash(npm *)', 'Bash(git status)'],
    maxTurns: Number(process.env.CLAUDE_MAX_TURNS) || 10,
    outputFormat: 'json',
    timeoutMs: Number(process.env.CLAUDE_TIMEOUT_MS) || 120000,
  });

  let parsed: SolverResult;
  try {
    const raw = JSON.parse(result.result);
    parsed = {
      filesChanged: raw.files_changed || [],
      commitMessage: raw.commit_message || `feat: ${task.title}`,
      rationale: raw.rationale || '',
    };
  } catch {
    const match = result.result.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('TaskSolver: invalid JSON from Claude');
    const raw = JSON.parse(match[0]);
    parsed = {
      filesChanged: raw.files_changed || [],
      commitMessage: raw.commit_message || `feat: ${task.title}`,
      rationale: raw.rationale || '',
    };
  }

  return parsed;
}
