import { pool } from './db';
import { Project } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { isProjectCloned, getProjectPath } from '../git/repoManager';

function rowToProject(row: Record<string, unknown>): Project {
  const id = row.id as string;
  return {
    id,
    name:      row.name as string,
    repoUrl:   row.repo_url as string,
    localPath: row.local_path as string,
    branch:    row.branch as string,
    cloned:    isProjectCloned(id),
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export const projectStore = {
  async getAll(): Promise<Project[]> {
    const { rows } = await pool.query('SELECT * FROM projects ORDER BY created_at ASC');
    return rows.map(rowToProject);
  },

  async getById(id: string): Promise<Project | undefined> {
    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return rows[0] ? rowToProject(rows[0]) : undefined;
  },

  async create(data: { name: string; repoUrl: string; branch?: string }): Promise<Project> {
    const id = uuidv4();
    const localPath = getProjectPath(id);
    const { rows } = await pool.query(
      `INSERT INTO projects (id, name, repo_url, local_path, branch)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, data.name, data.repoUrl, localPath, data.branch || 'main']
    );
    return rowToProject(rows[0]);
  },

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
