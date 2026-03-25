import { execFileSync } from 'child_process';
import { getConfig } from '../routes/config';
import { REPO_PATH } from '../git/repoManager';

// Never let git prompt for credentials — fail immediately if PAT is wrong
const GIT_ENV = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: 'echo' };

function git(repoPath: string, ...args: string[]): void {
  execFileSync('git', ['-C', repoPath, ...args], { stdio: 'pipe', env: GIT_ENV });
}

function gitOut(repoPath: string, ...args: string[]): string {
  return execFileSync('git', ['-C', repoPath, ...args], { encoding: 'utf-8', env: GIT_ENV }).trim();
}

function ensureGitIdentity(repoPath: string): void {
  try { gitOut(repoPath, 'config', 'user.email'); } catch {
    git(repoPath, 'config', 'user.email', 'ai-kanban-bot@localhost');
  }
  try { gitOut(repoPath, 'config', 'user.name'); } catch {
    git(repoPath, 'config', 'user.name', 'AI Kanban Bot');
  }
}

function setRemoteWithPat(repoPath: string, repoUrl?: string): void {
  const { githubPat } = getConfig();
  if (!githubPat || !repoUrl) return;

  const url = repoUrl.startsWith('https://')
    ? repoUrl.replace('https://', `https://${githubPat.trim()}@`)
    : repoUrl;
  git(repoPath, 'remote', 'set-url', 'origin', url);
}

/** Checkout base branch and pull latest so we start clean. */
export function syncBase(repoPath?: string, branch?: string, repoUrl?: string): void {
  const path = repoPath || REPO_PATH;
  const base = branch || 'main';
  setRemoteWithPat(path, repoUrl);
  git(path, 'checkout', base);
  git(path, 'pull', 'origin', base);
}

/**
 * Create a feature branch, stage all changes Claude made, commit, and push.
 * Returns the actual branch name used (may have a suffix if name was taken).
 */
export function commitAndPush(
  branchName: string,
  commitMessage: string,
  repoPath?: string,
  repoUrl?: string,
  branch?: string,
): string {
  const path = repoPath || REPO_PATH;
  ensureGitIdentity(path);
  setRemoteWithPat(path, repoUrl);

  const status = gitOut(path, 'status', '--porcelain');
  if (!status) {
    throw new Error('No changes detected in the repository after solving the task.');
  }

  let finalBranch = branchName;
  try {
    git(path, 'checkout', '-b', finalBranch);
  } catch {
    finalBranch = `${branchName}-${Date.now()}`;
    git(path, 'checkout', '-b', finalBranch);
  }

  git(path, 'add', '-A');
  git(path, 'commit', '-m', commitMessage);
  git(path, 'push', 'origin', finalBranch);

  // Return to base branch
  const base = branch || 'main';
  git(path, 'checkout', base);

  return finalBranch;
}
