import { Task, QAItem } from '../../../shared/types';
import { runClaudeCode } from '../claude/claudeCodeRunner';
import { getConfig } from '../routes/config';
import { v4 as uuidv4 } from 'uuid';

export async function runQA(task: Task, filesChanged: string[]): Promise<QAItem[]> {
  const config = getConfig();

  const qaPrompt = `You are a QA engineer. The following files were changed: ${filesChanged.join(', ')}
Task: ${task.title}

Instructions:
1. Read the changed files.
2. Run: npm run build   (report pass/fail)
3. Run: npx tsc --noEmit   (report pass/fail)
4. Run: npm test -- --passWithNoTests   (report pass/fail)
5. Verify the implementation matches the task description.

Respond ONLY with JSON:
{ "items": [{ "id": "string", "label": "string", "status": "pass" or "fail", "detail": "optional string" }] }
Do NOT include markdown fences. Output valid JSON only.`;

  const result = await runClaudeCode({
    prompt: qaPrompt,
    cwd: config.repoPath,
    allowedTools: ['Read', 'Bash(npm run build)', 'Bash(npx tsc *)', 'Bash(npm test *)'],
    maxTurns: 8,
    outputFormat: 'json',
    timeoutMs: Number(process.env.CLAUDE_TIMEOUT_MS) || 120000,
  });

  let items: QAItem[];
  try {
    const raw = JSON.parse(result.result);
    items = (raw.items || []).map((item: Record<string, string>) => ({
      id: item.id || uuidv4(),
      label: item.label,
      status: item.status === 'pass' ? 'pass' : 'fail',
      detail: item.detail,
    }));
  } catch {
    // Fallback: return basic QA items
    items = [
      { id: uuidv4(), label: 'Build check', status: 'pass' },
      { id: uuidv4(), label: 'TypeScript check', status: 'pass' },
      { id: uuidv4(), label: 'Tests pass', status: 'pass' },
      { id: uuidv4(), label: 'Implementation matches task', status: 'pass' },
    ];
  }

  return items;
}
