import axios, { AxiosInstance } from 'axios';
import { getConfig } from '../routes/config';

function getClient(): AxiosInstance {
  const config = getConfig();
  return axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `Bearer ${config.githubPat}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
}

/**
 * Parse owner and repo name from a GitHub clone URL.
 * Handles:
 *   https://github.com/owner/repo.git
 *   https://token@github.com/owner/repo.git
 *   git@github.com:owner/repo.git
 */
export function parseGithubRepo(url: string): { owner: string; name: string } | null {
  // Strip embedded PAT: https://TOKEN@github.com/... → https://github.com/...
  const cleaned = url.replace(/https:\/\/[^@]+@/, 'https://');

  const httpsMatch = cleaned.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (httpsMatch) return { owner: httpsMatch[1], name: httpsMatch[2] };

  const sshMatch = url.match(/github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (sshMatch) return { owner: sshMatch[1], name: sshMatch[2] };

  return null;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: Error;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err as Error;
      const axiosErr = err as { response?: { status: number } };
      if (axiosErr.response?.status === 429) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      } else {
        throw err;
      }
    }
  }
  throw lastError!;
}

export async function getDefaultBranchSha(): Promise<string> {
  const config = getConfig();
  const client = getClient();
  const branch = config.baseBranch || 'main';
  const { data } = await withRetry(() =>
    client.get(`/repos/${config.repoOwner}/${config.repoName}/git/ref/heads/${branch}`)
  );
  return data.object.sha;
}

export async function createBranch(branchName: string): Promise<void> {
  const config = getConfig();
  const client = getClient();
  const sha = await getDefaultBranchSha();

  try {
    await withRetry(() =>
      client.post(`/repos/${config.repoOwner}/${config.repoName}/git/refs`, {
        ref: `refs/heads/${branchName}`,
        sha,
      })
    );
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status: number } };
    if (axiosErr.response?.status === 422) {
      // Branch exists, append suffix
      const newBranch = `${branchName}-${Date.now()}`;
      await withRetry(() =>
        client.post(`/repos/${config.repoOwner}/${config.repoName}/git/refs`, {
          ref: `refs/heads/${newBranch}`,
          sha,
        })
      );
    } else {
      throw err;
    }
  }
}

export async function createPR(
  branchName: string,
  title: string,
  body: string,
  repoOwner?: string,
  repoName?: string,
  baseBranch?: string,
): Promise<{ number: number; html_url: string }> {
  const config = getConfig();
  const client = getClient();

  const owner = repoOwner;
  const name  = repoName;
  const base  = baseBranch || 'main';

  if (!owner || !name) {
    throw new Error('No GitHub repo configured for this task. Associate the task with a project.');
  }

  const { data } = await withRetry(() =>
    client.post(`/repos/${owner}/${name}/pulls`, {
      title,
      body,
      head: branchName,
      base,
    })
  );

  return { number: data.number, html_url: data.html_url };
}
