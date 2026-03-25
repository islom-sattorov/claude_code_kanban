import { execFileSync } from 'child_process';

export function generateClaudeMd(projectPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      execFileSync('claude', ['/init'], {
        cwd: projectPath,
        stdio: 'pipe',
        env: process.env,
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
