import {
  User, InsertUser,
  Presentation, InsertPresentation,
  Slide, InsertSlide,
  Collaborator, InsertCollaborator,
  CoachSession, InsertCoachSession
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
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
  sessionStore: session.SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private presentations: Map<number, Presentation>;
  private slides: Map<number, Slide>;
  private collaborators: Map<number, Collaborator>;
  private coachSessions: Map<number, CoachSession>;
  private templates: Map<number, any>;
  private userId: number;
  private presentationId: number;
  private slideId: number;
  private collaboratorId: number;
  private coachSessionId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.presentations = new Map();
    this.slides = new Map();
    this.collaborators = new Map();
    this.coachSessions = new Map();
    this.templates = new Map();
    
    this.userId = 1;
    this.presentationId = 1;
    this.slideId = 1;
    this.collaboratorId = 1;
    this.coachSessionId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
    
    // Initialize with some templates
    this.initializeTemplates();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phone === phone
    );
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebase_uid === firebaseUid
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...user,
      ...data
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      subscription_type: 'free',
      credits: 50, // Give new users 50 credits to try the service
      created_at: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserCredits(userId: number, credits: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...user,
      credits
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserSubscription(userId: number, type: string, expiryDate: Date | null): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...user,
      subscription_type: type as any,
      subscription_expiry: expiryDate,
      credits: type === 'pro' ? (user.credits || 0) + 5 : (user.credits || 0)
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Presentation operations
  async createPresentation(presentation: InsertPresentation): Promise<Presentation> {
    const id = this.presentationId++;
    const now = new Date();
    const newPresentation: Presentation = {
      ...presentation,
      id,
      slides_count: 0,
      created_at: now,
      updated_at: now
    };
    
    this.presentations.set(id, newPresentation);
    return newPresentation;
  }

  async getPresentationById(id: number): Promise<Presentation | undefined> {
    return this.presentations.get(id);
  }

  async getPresentationsByUserId(userId: number): Promise<Presentation[]> {
    return Array.from(this.presentations.values()).filter(
      (presentation) => presentation.owner_id === userId
    );
  }

  async getSharedPresentations(userId: number): Promise<Presentation[]> {
    // Get all presentation IDs where the user is a collaborator
    const collaboratorPresentationIds = Array.from(this.collaborators.values())
      .filter(collab => collab.user_id === userId)
      .map(collab => collab.presentation_id);
    
    // Get the presentation objects for those IDs
    return Array.from(this.presentations.values()).filter(
      (presentation) => collaboratorPresentationIds.includes(presentation.id)
    );
  }

  async updatePresentation(id: number, data: Partial<Presentation>): Promise<Presentation> {
    const presentation = await this.getPresentationById(id);
    if (!presentation) {
      throw new Error('Presentation not found');
    }
    
    const updatedPresentation = {
      ...presentation,
      ...data,
      updated_at: new Date()
    };
    
    this.presentations.set(id, updatedPresentation);
    return updatedPresentation;
  }

  async deletePresentation(id: number): Promise<void> {
    this.presentations.delete(id);
    
    // Also delete associated slides and collaborators
    for (const [slideId, slide] of this.slides.entries()) {
      if (slide.presentation_id === id) {
        this.slides.delete(slideId);
      }
    }
    
    for (const [collabId, collab] of this.collaborators.entries()) {
      if (collab.presentation_id === id) {
        this.collaborators.delete(collabId);
      }
    }
  }

  // Slide operations
  async createSlide(slide: InsertSlide): Promise<Slide> {
    const id = this.slideId++;
    const now = new Date();
    const newSlide: Slide = {
      ...slide,
      id,
      created_at: now,
      updated_at: now
    };
    
    this.slides.set(id, newSlide);
    
    // Update slide count in the presentation
    const presentation = await this.getPresentationById(slide.presentation_id);
    if (presentation) {
      await this.updatePresentation(presentation.id, {
        slides_count: presentation.slides_count + 1
      });
    }
    
    return newSlide;
  }

  async getSlidesByPresentationId(presentationId: number): Promise<Slide[]> {
    return Array.from(this.slides.values())
      .filter(slide => slide.presentation_id === presentationId)
      .sort((a, b) => a.slide_number - b.slide_number);
  }

  async updateSlide(id: number, data: Partial<Slide>): Promise<Slide> {
    const slide = this.slides.get(id);
    if (!slide) {
      throw new Error('Slide not found');
    }
    
    const updatedSlide = {
      ...slide,
      ...data,
      updated_at: new Date()
    };
    
    this.slides.set(id, updatedSlide);
    return updatedSlide;
  }

  async deleteSlide(id: number): Promise<void> {
    const slide = this.slides.get(id);
    if (!slide) {
      throw new Error('Slide not found');
    }
    
    this.slides.delete(id);
    
    // Update slide count in the presentation
    const presentation = await this.getPresentationById(slide.presentation_id);
    if (presentation) {
      await this.updatePresentation(presentation.id, {
        slides_count: Math.max(0, presentation.slides_count - 1)
      });
    }
  }

  // Collaborator operations
  async addCollaborator(collaborator: InsertCollaborator): Promise<Collaborator> {
    const id = this.collaboratorId++;
    const now = new Date();
    const newCollaborator: Collaborator = {
      ...collaborator,
      id,
      created_at: now
    };
    
    this.collaborators.set(id, newCollaborator);
    return newCollaborator;
  }

  async getCollaborators(presentationId: number): Promise<Collaborator[]> {
    return Array.from(this.collaborators.values()).filter(
      collab => collab.presentation_id === presentationId
    );
  }

  async removeCollaborator(presentationId: number, userId: number): Promise<void> {
    for (const [id, collab] of this.collaborators.entries()) {
      if (collab.presentation_id === presentationId && collab.user_id === userId) {
        this.collaborators.delete(id);
        break;
      }
    }
  }

  // Coach session operations
  async createCoachSession(session: InsertCoachSession): Promise<CoachSession> {
    const id = this.coachSessionId++;
    const now = new Date();
    const newSession: CoachSession = {
      ...session,
      id,
      created_at: now
    };
    
    this.coachSessions.set(id, newSession);
    return newSession;
  }

  async getCoachSessionsByUserId(userId: number): Promise<CoachSession[]> {
    return Array.from(this.coachSessions.values())
      .filter(session => session.user_id === userId)
      .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0));
  }

  async getCoachSessionsByPresentationId(presentationId: number): Promise<CoachSession[]> {
    return Array.from(this.coachSessions.values())
      .filter(session => session.presentation_id === presentationId)
      .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0));
  }

  // Templates
  async getTemplates(): Promise<any[]> {
    return Array.from(this.templates.values());
  }

  // Initialize with some templates
  private initializeTemplates() {
    const templates = [
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
    
    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }
}

export const storage = new MemStorage();
