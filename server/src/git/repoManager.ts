import { execFileSync } from 'child_process';
import { existsSync, rmSync } from 'fs';

// Legacy single-repo path (kept for backward compatibility)
const REPO_DIR = '/repo';
export const REPO_PATH = REPO_DIR;

// Multi-project repos directory
export const REPOS_DIR = '/repos';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCloneUrl(repoUrl: string, pat?: string): string {
  if (!pat) return repoUrl;
  if (repoUrl.startsWith('https://')) {
    return repoUrl.replace('https://', `https://${pat.trim()}@`);
  }
  return repoUrl;
}

// ─── Legacy single-repo functions ────────────────────────────────────────────

export function isRepoCloned(): boolean {
  return existsSync(`${REPO_DIR}/.git`);
}

export function cloneRepo(repoOwner: string, repoName: string, githubPat?: string): void {
  if (!repoOwner.trim() || !repoName.trim()) {
    throw new Error('GITHUB_REPO_OWNER and GITHUB_REPO_NAME must be set before cloning');
  }
  const url = buildCloneUrl(
    `https://github.com/${repoOwner.trim()}/${repoName.trim()}.git`,
    githubPat,
  );
  console.log(`Cloning ${repoOwner.trim()}/${repoName.trim()} into ${REPO_DIR}...`);
  execFileSync('git', ['clone', url, REPO_DIR], { stdio: 'inherit' });
  console.log('Clone complete.');
}

export function pullRepo(): void {
  console.log('Pulling latest changes...');
  execFileSync('git', ['-C', REPO_DIR, 'pull'], { stdio: 'inherit' });
}

export function cloneOrPull(repoOwner: string, repoName: string, githubPat?: string): void {
  if (isRepoCloned()) {
    pullRepo();
  } else {
    cloneRepo(repoOwner, repoName, githubPat);
  }
}

export function reclone(repoOwner: string, repoName: string, githubPat?: string): void {
  rmSync(REPO_DIR, { recursive: true, force: true });
  cloneRepo(repoOwner, repoName, githubPat);
}

// ─── Multi-project functions ──────────────────────────────────────────────────

export function getProjectPath(projectId: string): string {
  return `${REPOS_DIR}/${projectId}`;
}

export function isProjectCloned(projectId: string): boolean {
  return existsSync(`${getProjectPath(projectId)}/.git`);
}

export function cloneProject(projectId: string, repoUrl: string, pat?: string, branch?: string): void {
  const targetPath = getProjectPath(projectId);
  const cloneUrl = buildCloneUrl(repoUrl, pat);
  const branchArgs = branch && branch !== 'main' ? ['--branch', branch] : [];

  console.log(`Cloning ${repoUrl} into ${targetPath}...`);
  execFileSync('git', ['clone', ...branchArgs, cloneUrl, targetPath], { stdio: 'inherit' });
  console.log('Clone complete.');
}

export function pullProject(projectId: string): void {
  const targetPath = getProjectPath(projectId);
  console.log(`Pulling latest changes for project ${projectId}...`);
  execFileSync('git', ['-C', targetPath, 'pull'], { stdio: 'inherit' });
}

export function recloneProject(projectId: string, repoUrl: string, pat?: string, branch?: string): void {
  const targetPath = getProjectPath(projectId);
  rmSync(targetPath, { recursive: true, force: true });
  cloneProject(projectId, repoUrl, pat, branch);
}
