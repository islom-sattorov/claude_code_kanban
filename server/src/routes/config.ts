import { Router, Request, Response } from 'express';
import { Config } from '../../../shared/types';
import * as dotenv from 'dotenv';
import { REPO_PATH, reclone, cloneRepo, isRepoCloned } from '../git/repoManager';
dotenv.config();

let config: Config = {
  githubPat:  process.env.GITHUB_PAT            || '',
  repoOwner:  process.env.GITHUB_REPO_OWNER     || '',
  repoName:   process.env.GITHUB_REPO_NAME      || '',
  repoPath:   REPO_PATH,                            // always /repo inside the container
  baseBranch: process.env.GITHUB_BASE_BRANCH    || 'main',
};

export function getConfig(): Config {
  return config;
}

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    repoOwner:  config.repoOwner,
    repoName:   config.repoName,
    baseBranch: config.baseBranch,
    hasPat:     !!config.githubPat,
    repoCloned: isRepoCloned(),
  });
});

router.put('/', (req: Request, res: Response) => {
  const { githubPat, repoOwner, repoName, baseBranch } = req.body;
  if (repoOwner   !== undefined) config.repoOwner   = repoOwner;
  if (repoName    !== undefined) config.repoName    = repoName;
  if (baseBranch  !== undefined) config.baseBranch  = baseBranch;
  if (githubPat   !== undefined) config.githubPat   = githubPat;
  config.repoPath = REPO_PATH; // always fixed
  res.json({ success: true });
});

// Trigger a fresh clone (or re-clone) of the configured repository
router.post('/clone', async (_req: Request, res: Response) => {
  try {
    if (isRepoCloned()) {
      reclone();
    } else {
      cloneRepo();
    }
    res.json({ success: true, message: 'Repository cloned successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
