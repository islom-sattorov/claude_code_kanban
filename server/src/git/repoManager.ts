import { execFileSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { getConfig } from '../routes/config';

const REPO_DIR = '/repo';

function buildCloneUrl(): string {
  const { githubPat, repoOwner, repoName } = getConfig();
  if (githubPat) {
    return `https://${githubPat}@github.com/${repoOwner}/${repoName}.git`;
  }
  return `https://github.com/${repoOwner}/${repoName}.git`;
}

export function isRepoCloned(): boolean {
  return existsSync(`${REPO_DIR}/.git`);
}

export function cloneRepo(): void {
  const { repoOwner, repoName } = getConfig();
  if (!repoOwner || !repoName) {
    throw new Error('GITHUB_REPO_OWNER and GITHUB_REPO_NAME must be set before cloning');
  }

  const url = buildCloneUrl();
  console.log(`Cloning ${repoOwner}/${repoName} into ${REPO_DIR}...`);
  execFileSync('git', ['clone', url, REPO_DIR], { stdio: 'inherit' });
  console.log('Clone complete.');
}

export function pullRepo(): void {
  console.log('Pulling latest changes...');
  execFileSync('git', ['-C', REPO_DIR, 'pull'], { stdio: 'inherit' });
}

export function cloneOrPull(): void {
  if (isRepoCloned()) {
    pullRepo();
  } else {
    cloneRepo();
  }
}

export function reclone(): void {
  // Wipe contents and re-clone (used when config changes)
  rmSync(REPO_DIR, { recursive: true, force: true });
  cloneRepo();
}

export const REPO_PATH = REPO_DIR;
