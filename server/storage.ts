<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
import { users, type User, type InsertUser, presentations, type Presentation, type InsertPresentation, slides, type Slide, type InsertSlide, collaborators, type Collaborator, type InsertCollaborator, coachSessions, type CoachSession, type InsertCoachSession } from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateUserCredits(userId: number, credits: number): Promise<User>;
  updateUserSubscription(userId: number, type: string, expiryDate: Date | null): Promise<User>;

  // Presentation operations
  createPresentation(presentation: InsertPresentation): Promise<Presentation>;
  getPresentationById(id: number): Promise<Presentation | undefined>;
  getPresentationsByUserId(userId: number): Promise<Presentation[]>;
  getSharedPresentations(userId: number): Promise<Presentation[]>;
  updatePresentation(id: number, data: Partial<Presentation>): Promise<Presentation>;
  deletePresentation(id: number): Promise<void>;

  // Slide operations
  createSlide(slide: InsertSlide): Promise<Slide>;
  getSlidesByPresentationId(presentationId: number): Promise<Slide[]>;
  updateSlide(id: number, data: Partial<Slide>): Promise<Slide>;
  deleteSlide(id: number): Promise<void>;

  // Collaborator operations
  addCollaborator(collaborator: InsertCollaborator): Promise<Collaborator>;
  getCollaborators(presentationId: number): Promise<Collaborator[]>;
  removeCollaborator(presentationId: number, userId: number): Promise<void>;

  // Coach session operations
  createCoachSession(session: InsertCoachSession): Promise<CoachSession>;
  getCoachSessionsByUserId(userId: number): Promise<CoachSession[]>;
  getCoachSessionsByPresentationId(presentationId: number): Promise<CoachSession[]>;

  // Templates
  getTemplates(): Promise<any[]>;

  // Session store
  sessionStore: session.Store;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
=======
import { users, type User, type InsertUser, presentations, type Presentation, type InsertPresentation, slides, type Slide, type InsertSlide, collaborators, type Collaborator, type InsertCollaborator, coachSessions, type CoachSession, type InsertCoachSession } from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateUserCredits(userId: number, credits: number): Promise<User>;
  updateUserSubscription(userId: number, type: string, expiryDate: Date | null): Promise<User>;

  // Presentation operations
  createPresentation(presentation: InsertPresentation): Promise<Presentation>;
  getPresentationById(id: number): Promise<Presentation | undefined>;
  getPresentationsByUserId(userId: number): Promise<Presentation[]>;
  getSharedPresentations(userId: number): Promise<Presentation[]>;
  updatePresentation(id: number, data: Partial<Presentation>): Promise<Presentation>;
  deletePresentation(id: number): Promise<void>;

  // Slide operations
  createSlide(slide: InsertSlide): Promise<Slide>;
  getSlidesByPresentationId(presentationId: number): Promise<Slide[]>;
  updateSlide(id: number, data: Partial<Slide>): Promise<Slide>;
  deleteSlide(id: number): Promise<void>;

  // Collaborator operations
  addCollaborator(collaborator: InsertCollaborator): Promise<Collaborator>;
  getCollaborators(presentationId: number): Promise<Collaborator[]>;
  removeCollaborator(presentationId: number, userId: number): Promise<void>;

  // Coach session operations
  createCoachSession(session: InsertCoachSession): Promise<CoachSession>;
  getCoachSessionsByUserId(userId: number): Promise<CoachSession[]>;
  getCoachSessionsByPresentationId(presentationId: number): Promise<CoachSession[]>;

  // Templates
  getTemplates(): Promise<any[]>;

  // Session store
  sessionStore: session.Store;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
>>>>>>> Stashed changes
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    if (!firebaseUid) return undefined;
    const [user] = await db.select().from(users).where(eq(users.firebase_uid, firebaseUid));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      subscription_type: 'free', 
      credits: 50
    }).returning();
    return user;
>>>>>>> Stashed changes
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserCredits(userId: number, credits: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ credits })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSubscription(userId: number, type: string, expiryDate: Date | null): Promise<User> {
    const [user] = await db.update(users)
      .set({ 
        subscription_type: type as any,
        subscription_expiry: expiryDate
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Presentation operations
  async createPresentation(presentation: InsertPresentation): Promise<Presentation> {
    const [newPresentation] = await db.insert(presentations)
      .values({
        ...presentation,
        slides_count: presentation.slides_count || 0
      })
      .returning();
    return newPresentation;
  }

  async getPresentationById(id: number): Promise<Presentation | undefined> {
    const [presentation] = await db.select().from(presentations).where(eq(presentations.id, id));
    return presentation;
  }

  async getPresentationsByUserId(userId: number): Promise<Presentation[]> {
    return await db.select().from(presentations)
      .where(eq(presentations.owner_id, userId))
      .orderBy(desc(presentations.created_at));
  }

  async getSharedPresentations(userId: number): Promise<Presentation[]> {
    // Get all presentation IDs where the user is a collaborator
    const collaborations = await db.select({
      presentationId: collaborators.presentation_id
    })
    .from(collaborators)
    .where(eq(collaborators.user_id, userId));
    
    if (collaborations.length === 0) return [];
    
    // Get the presentation objects for those IDs
    const presentationIds = collaborations.map(c => c.presentationId);
    
    return await db.select()
      .from(presentations)
      .where(inArray(presentations.id, presentationIds));
  }

  async updatePresentation(id: number, data: Partial<Presentation>): Promise<Presentation> {
    const [updatedPresentation] = await db.update(presentations)
      .set({
        ...data,
        updated_at: new Date()
      })
      .where(eq(presentations.id, id))
      .returning();
    return updatedPresentation;
  }

  async deletePresentation(id: number): Promise<void> {
    // Delete associated slides and collaborators first
    await db.delete(slides).where(eq(slides.presentation_id, id));
    await db.delete(collaborators).where(eq(collaborators.presentation_id, id));
    // Delete the presentation
    await db.delete(presentations).where(eq(presentations.id, id));
  }

  // Slide operations
  async createSlide(slide: InsertSlide): Promise<Slide> {
    const [newSlide] = await db.insert(slides)
      .values(slide)
      .returning();
    
    // Update slide count in the presentation
    const presentation = await this.getPresentationById(slide.presentation_id);
    if (presentation) {
      const currentCount = presentation.slides_count || 0;
      await this.updatePresentation(presentation.id, {
        slides_count: currentCount + 1
      });
    }
    
    return newSlide;
  }

  async getSlidesByPresentationId(presentationId: number): Promise<Slide[]> {
    return await db.select()
      .from(slides)
      .where(eq(slides.presentation_id, presentationId))
      .orderBy(slides.slide_number);
  }

  async updateSlide(id: number, data: Partial<Slide>): Promise<Slide> {
    const [updatedSlide] = await db.update(slides)
      .set({
        ...data,
        updated_at: new Date()
      })
      .where(eq(slides.id, id))
      .returning();
    return updatedSlide;
  }

  async deleteSlide(id: number): Promise<void> {
    const [slide] = await db.select().from(slides).where(eq(slides.id, id));
    if (!slide) {
      throw new Error('Slide not found');
    }
    
    // Delete the slide
    await db.delete(slides).where(eq(slides.id, id));
    
    // Update slide count in the presentation
    const presentation = await this.getPresentationById(slide.presentation_id);
    if (presentation) {
      const currentCount = presentation.slides_count || 0;
      await this.updatePresentation(presentation.id, {
        slides_count: Math.max(0, currentCount - 1)
      });
    }
  }

  // Collaborator operations
  async addCollaborator(collaborator: InsertCollaborator): Promise<Collaborator> {
    const [newCollaborator] = await db.insert(collaborators)
      .values(collaborator)
      .returning();
    return newCollaborator;
  }

  async getCollaborators(presentationId: number): Promise<Collaborator[]> {
    return await db.select()
      .from(collaborators)
      .where(eq(collaborators.presentation_id, presentationId));
  }

  async removeCollaborator(presentationId: number, userId: number): Promise<void> {
    await db.delete(collaborators)
      .where(
        and(
          eq(collaborators.presentation_id, presentationId),
          eq(collaborators.user_id, userId)
        )
      );
  }

  // Coach session operations
  async createCoachSession(session: InsertCoachSession): Promise<CoachSession> {
    const [newSession] = await db.insert(coachSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getCoachSessionsByUserId(userId: number): Promise<CoachSession[]> {
    return await db.select()
      .from(coachSessions)
      .where(eq(coachSessions.user_id, userId))
      .orderBy(desc(coachSessions.created_at));
  }

  async getCoachSessionsByPresentationId(presentationId: number): Promise<CoachSession[]> {
    return await db.select()
      .from(coachSessions)
      .where(eq(coachSessions.presentation_id, presentationId))
      .orderBy(desc(coachSessions.created_at));
  }

  // Templates
  async getTemplates(): Promise<any[]> {
    // This would be ideally implemented with a template table, but for now returning hardcoded templates
    return [
      {
        id: 1,
        name: 'Business Pitch',
        description: 'Perfect for fundraising and investor pitches',
        thumbnail_url: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
        category: 'Business',
        created_at: new Date()
      },
      {
        id: 2,
        name: 'Marketing Plan',
        description: 'Showcase your marketing strategy effectively',
        thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
        category: 'Marketing',
        created_at: new Date()
      },
      {
        id: 3,
        name: 'Educational',
        description: 'Ideal for academic presentations and lectures',
        thumbnail_url: 'https://images.unsplash.com/photo-1613608788129-11938423088f?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
        category: 'Education',
        created_at: new Date()
      },
      {
        id: 4,
        name: 'Portfolio',
        description: 'Showcase your work and achievements',
        thumbnail_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
        category: 'Portfolio',
        created_at: new Date()
      }
    ];
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserCredits(userId: number, credits: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ credits })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSubscription(userId: number, type: string, expiryDate: Date | null): Promise<User> {
    const [user] = await db.update(users)
      .set({ 
        subscription_type: type as any,
        subscription_expiry: expiryDate
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Presentation operations
  async createPresentation(presentation: InsertPresentation): Promise<Presentation> {
    const [newPresentation] = await db.insert(presentations)
      .values({
        ...presentation,
        slides_count: presentation.slides_count || 0
      })
      .returning();
    return newPresentation;
  }

  async getPresentationById(id: number): Promise<Presentation | undefined> {
    const [presentation] = await db.select().from(presentations).where(eq(presentations.id, id));
    return presentation;
  }

  async getPresentationsByUserId(userId: number): Promise<Presentation[]> {
    return await db.select().from(presentations)
      .where(eq(presentations.owner_id, userId))
      .orderBy(desc(presentations.created_at));
  }

  async getSharedPresentations(userId: number): Promise<Presentation[]> {
    // Get all presentation IDs where the user is a collaborator
    const collaborations = await db.select({
      presentationId: collaborators.presentation_id
    })
    .from(collaborators)
    .where(eq(collaborators.user_id, userId));
    
    if (collaborations.length === 0) return [];
    
    // Get the presentation objects for those IDs
    const presentationIds = collaborations.map(c => c.presentationId);
    
    return await db.select()
      .from(presentations)
      .where(inArray(presentations.id, presentationIds));
  }

  async updatePresentation(id: number, data: Partial<Presentation>): Promise<Presentation> {
    const [updatedPresentation] = await db.update(presentations)
      .set({
        ...data,
        updated_at: new Date()
      })
      .where(eq(presentations.id, id))
      .returning();
    return updatedPresentation;
  }

  async deletePresentation(id: number): Promise<void> {
    // Delete associated slides and collaborators first
    await db.delete(slides).where(eq(slides.presentation_id, id));
    await db.delete(collaborators).where(eq(collaborators.presentation_id, id));
    // Delete the presentation
    await db.delete(presentations).where(eq(presentations.id, id));
  }

  // Slide operations
  async createSlide(slide: InsertSlide): Promise<Slide> {
    const [newSlide] = await db.insert(slides)
      .values(slide)
      .returning();
    
    // Update slide count in the presentation
    const presentation = await this.getPresentationById(slide.presentation_id);
    if (presentation) {
      const currentCount = presentation.slides_count || 0;
      await this.updatePresentation(presentation.id, {
        slides_count: currentCount + 1
      });
    }
    
    return newSlide;
  }

  async getSlidesByPresentationId(presentationId: number): Promise<Slide[]> {
    return await db.select()
      .from(slides)
      .where(eq(slides.presentation_id, presentationId))
      .orderBy(slides.slide_number);
  }

  async updateSlide(id: number, data: Partial<Slide>): Promise<Slide> {
    const [updatedSlide] = await db.update(slides)
      .set({
        ...data,
        updated_at: new Date()
      })
      .where(eq(slides.id, id))
      .returning();
    return updatedSlide;
  }

  async deleteSlide(id: number): Promise<void> {
    const [slide] = await db.select().from(slides).where(eq(slides.id, id));
    if (!slide) {
      throw new Error('Slide not found');
    }
    
    // Delete the slide
    await db.delete(slides).where(eq(slides.id, id));
    
    // Update slide count in the presentation
    const presentation = await this.getPresentationById(slide.presentation_id);
    if (presentation) {
      const currentCount = presentation.slides_count || 0;
      await this.updatePresentation(presentation.id, {
        slides_count: Math.max(0, currentCount - 1)
      });
    }
  }

  // Collaborator operations
  async addCollaborator(collaborator: InsertCollaborator): Promise<Collaborator> {
    const [newCollaborator] = await db.insert(collaborators)
      .values(collaborator)
      .returning();
    return newCollaborator;
  }

  async getCollaborators(presentationId: number): Promise<Collaborator[]> {
    return await db.select()
      .from(collaborators)
      .where(eq(collaborators.presentation_id, presentationId));
  }

  async removeCollaborator(presentationId: number, userId: number): Promise<void> {
    await db.delete(collaborators)
      .where(
        and(
          eq(collaborators.presentation_id, presentationId),
          eq(collaborators.user_id, userId)
        )
      );
  }

  // Coach session operations
  async createCoachSession(session: InsertCoachSession): Promise<CoachSession> {
    const [newSession] = await db.insert(coachSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getCoachSessionsByUserId(userId: number): Promise<CoachSession[]> {
    return await db.select()
      .from(coachSessions)
      .where(eq(coachSessions.user_id, userId))
      .orderBy(desc(coachSessions.created_at));
  }

  async getCoachSessionsByPresentationId(presentationId: number): Promise<CoachSession[]> {
    return await db.select()
      .from(coachSessions)
      .where(eq(coachSessions.presentation_id, presentationId))
      .orderBy(desc(coachSessions.created_at));
  }

  // Templates
  async getTemplates(): Promise<any[]> {
    // This would be ideally implemented with a template table, but for now returning hardcoded templates
    return [
      {
        id: 1,
        name: 'Business Pitch',
        description: 'Perfect for fundraising and investor pitches',
        thumbnail_url: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
        category: 'Business',
        created_at: new Date()
      },
      {
        id: 2,
        name: 'Marketing Plan',
        description: 'Showcase your marketing strategy effectively',
        thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
        category: 'Marketing',
        created_at: new Date()
      },
      {
        id: 3,
        name: 'Educational',
        description: 'Ideal for academic presentations and lectures',
        thumbnail_url: 'https://images.unsplash.com/photo-1613608788129-11938423088f?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
        category: 'Education',
        created_at: new Date()
      },
      {
        id: 4,
        name: 'Portfolio',
        description: 'Showcase your work and achievements',
        thumbnail_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
        category: 'Portfolio',
        created_at: new Date()
      }
    ];
  }
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
export const storage: IStorage = new PgStorage();
=======
export const storage = new DatabaseStorage();
>>>>>>> Stashed changes
=======
export const storage = new DatabaseStorage();
>>>>>>> Stashed changes
