import { pool } from "./db";
import {
  type User,
  type InsertUser,
  type InsertPresentation,
  type Presentation,
  type InsertSlide,
  type Slide,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, patch: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  // Presentations
  listPresentations(): Promise<Presentation[]>;
  getPresentation(id: number): Promise<Presentation | undefined>;
  createPresentation(p: InsertPresentation): Promise<Presentation>;
  updatePresentation(id: number, patch: Partial<InsertPresentation>): Promise<Presentation | undefined>;
  deletePresentation(id: number): Promise<void>;

  // Slides
  listSlides(presentationId: number): Promise<Slide[]>;
  createSlide(s: InsertSlide): Promise<Slide>;
  updateSlide(id: number, patch: Partial<InsertSlide>): Promise<Slide | undefined>;
  deleteSlide(id: number): Promise<void>;
}

export class PgStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return res.rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const res = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    return res.rows[0];
  }

  async listUsers(): Promise<User[]> {
    const res = await pool.query("SELECT * FROM users ORDER BY id DESC");
    return res.rows;
  }

  async createUser(user: InsertUser): Promise<User> {
    const res = await pool.query(
      `INSERT INTO users (username, email, password, name, avatar_url, firebase_uid)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [user.username, (user as any).email ?? null, user.password, (user as any).name ?? null, (user as any).avatar_url ?? null, (user as any).firebase_uid ?? null],
    );
    return res.rows[0];
  }

  async updateUser(id: number, patch: Partial<InsertUser>): Promise<User | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const key of Object.keys(patch)) {
      fields.push(`${key} = $${idx}`);
      values.push((patch as any)[key]);
      idx++;
    }
    if (fields.length === 0) return this.getUser(id);
    values.push(id);
    const res = await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, values);
    return res.rows[0];
  }

  async deleteUser(id: number): Promise<void> {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
  }

  // Presentations
  async listPresentations(): Promise<Presentation[]> {
    const res = await pool.query("SELECT * FROM presentations ORDER BY id DESC");
    return res.rows;
  }

  async getPresentation(id: number): Promise<Presentation | undefined> {
    const res = await pool.query("SELECT * FROM presentations WHERE id = $1", [id]);
    return res.rows[0];
  }

  async createPresentation(p: InsertPresentation): Promise<Presentation> {
    const res = await pool.query(
      `INSERT INTO presentations (owner_id, title, description, status, slides_count)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [p.owner_id, p.title, p.description ?? null, p.status ?? 'draft', p.slides_count ?? 0],
    );
    return res.rows[0];
  }

  async updatePresentation(id: number, patch: Partial<InsertPresentation>): Promise<Presentation | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const key of Object.keys(patch)) {
      fields.push(`${key} = $${idx}`);
      values.push((patch as any)[key]);
      idx++;
    }
    if (fields.length === 0) return this.getPresentation(id);
    values.push(id);
    const res = await pool.query(`UPDATE presentations SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, values);
    return res.rows[0];
  }

  async deletePresentation(id: number): Promise<void> {
    await pool.query("DELETE FROM presentations WHERE id = $1", [id]);
  }

  // Slides
  async listSlides(presentationId: number): Promise<Slide[]> {
    const res = await pool.query("SELECT * FROM slides WHERE presentation_id = $1 ORDER BY slide_number", [presentationId]);
    return res.rows;
  }

  async createSlide(s: InsertSlide): Promise<Slide> {
    const res = await pool.query(
      `INSERT INTO slides (presentation_id, slide_number, content, background_color)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [s.presentation_id, s.slide_number, s.content, s.background_color ?? null],
    );
    return res.rows[0];
  }

  async updateSlide(id: number, patch: Partial<InsertSlide>): Promise<Slide | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const key of Object.keys(patch)) {
      fields.push(`${key} = $${idx}`);
      values.push((patch as any)[key]);
      idx++;
    }
    if (fields.length === 0) {
      const res = await pool.query("SELECT * FROM slides WHERE id = $1", [id]);
      return res.rows[0];
    }
    values.push(id);
    const res = await pool.query(`UPDATE slides SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, values);
    return res.rows[0];
  }

  async deleteSlide(id: number): Promise<void> {
    await pool.query("DELETE FROM slides WHERE id = $1", [id]);
  }
}

export const storage: IStorage = new PgStorage();
