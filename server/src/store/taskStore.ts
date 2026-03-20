import { pool } from './db';
import { Task, ColumnId } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

// Maps a raw DB row to the Task type used everywhere else
function rowToTask(row: Record<string, unknown>): Task {
  return {
    id:          row.id as string,
    title:       row.title as string,
    description: row.description as string | undefined,
    tags:        row.tags as string[],
    column:      row.column_name as ColumnId,
    progress:    row.progress as number,
    qaItems:     row.qa_items as Task['qaItems'],
    prNumber:    row.pr_number as number | undefined,
    prUrl:       row.pr_url as string | undefined,
    error:       row.error as string | undefined,
    createdAt:   (row.created_at as Date).toISOString(),
    updatedAt:   (row.updated_at as Date).toISOString(),
  };
}

export const taskStore = {
  async getAll(): Promise<Task[]> {
    const { rows } = await pool.query(
      'SELECT * FROM tasks ORDER BY created_at ASC'
    );
    return rows.map(rowToTask);
  },

  async getById(id: string): Promise<Task | undefined> {
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );
    return rows[0] ? rowToTask(rows[0]) : undefined;
  },

  async create(data: Pick<Task, 'title' | 'description' | 'tags'>): Promise<Task> {
    const { rows } = await pool.query(
      `INSERT INTO tasks (id, title, description, tags)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uuidv4(), data.title, data.description ?? null, data.tags ?? []]
    );
    return rowToTask(rows[0]);
  },

  async update(id: string, updates: Partial<Task>): Promise<Task | null> {
    // Build SET clause dynamically from whichever fields are provided
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (updates.title       !== undefined) { fields.push(`title = $${i++}`);       values.push(updates.title); }
    if (updates.description !== undefined) { fields.push(`description = $${i++}`); values.push(updates.description); }
    if (updates.tags        !== undefined) { fields.push(`tags = $${i++}`);        values.push(updates.tags); }
    if (updates.column      !== undefined) { fields.push(`column_name = $${i++}`); values.push(updates.column); }
    if (updates.progress    !== undefined) { fields.push(`progress = $${i++}`);    values.push(updates.progress); }
    if (updates.qaItems     !== undefined) { fields.push(`qa_items = $${i++}`);    values.push(JSON.stringify(updates.qaItems)); }
    if (updates.prNumber    !== undefined) { fields.push(`pr_number = $${i++}`);   values.push(updates.prNumber); }
    if (updates.prUrl       !== undefined) { fields.push(`pr_url = $${i++}`);      values.push(updates.prUrl); }
    if ('error' in updates)               { fields.push(`error = $${i++}`);        values.push(updates.error ?? null); }

    if (fields.length === 0) return (await this.getById(id)) ?? null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return rows[0] ? rowToTask(rows[0]) : null;
  },

  async move(id: string, column: ColumnId): Promise<Task | null> {
    return this.update(id, { column });
  },

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      'DELETE FROM tasks WHERE id = $1',
      [id]
    );
    return (rowCount ?? 0) > 0;
  },
};
