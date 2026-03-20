import { Task, QAItem } from '../../../shared/types';
import { runClaudeCode } from '../claude/claudeCodeRunner';
import { getConfig } from '../routes/config';

export interface PRDescription {
  title: string;
  body: string;
}

export async function describePR(task: Task, filesChanged: string[], rationale: string, qaItems: QAItem[]): Promise<PRDescription> {
  const config = getConfig();

  const prPrompt = `Generate a GitHub pull request description for this change.
Task: ${task.title}
Files changed: ${filesChanged.join(', ')}
Rationale: ${rationale}
QA results: ${JSON.stringify(qaItems)}

Respond ONLY with JSON:
{
  "title": "feat(scope): short description in Conventional Commits format",
  "body": "## Summary\\n- bullet points\\n\\n## QA Checklist\\n- [x] items"
}
Do NOT include markdown fences. Output valid JSON only.`;

  const result = await runClaudeCode({
    prompt: prPrompt,
    cwd: config.repoPath,
    allowedTools: ['Read'],
    maxTurns: 3,
    outputFormat: 'json',
    timeoutMs: 60000,
  });

  try {
    const raw = JSON.parse(result.result);
    return {
      title: raw.title || `feat: ${task.title}`,
      body: raw.body || `## Summary\n\n${task.title}\n\n## QA Checklist\n\n${qaItems.map(i => `- [${i.status === 'pass' ? 'x' : ' '}] ${i.label}`).join('\n')}`,
    };
  } catch {
    return {
      title: `feat: ${task.title}`,
      body: `## Summary\n\n${task.title}\n\n## Rationale\n\n${rationale}\n\n## QA Checklist\n\n${qaItems.map(i => `- [${i.status === 'pass' ? 'x' : ' '}] ${i.label}`).join('\n')}`,
    };
  }
}
