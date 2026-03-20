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
  body: string
): Promise<{ number: number; html_url: string }> {
  const config = getConfig();
  const client = getClient();

  const { data } = await withRetry(() =>
    client.post(`/repos/${config.repoOwner}/${config.repoName}/pulls`, {
      title,
      body,
      head: branchName,
      base: config.baseBranch || 'main',
    })
  );

  return { number: data.number, html_url: data.html_url };
}
