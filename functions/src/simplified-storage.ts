/**
 * Simplified storage implementation for Firebase Functions deployment
 * Uses in-memory storage with session support
 */

import session from "express-session";
import createMemoryStore from "memorystore";
import { User } from "@shared/schema";

// Create memory store for sessions
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// Simple in-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  sessionStore: session.SessionStore;
  
  constructor() {
    this.users = new Map<number, User>();
    
    // Initialize with demo user
    this.users.set(1, {
      id: 1,
      username: "demo",
      email: "demo@example.com",
      password: "password-hash.salt",
      name: "Demo User",
      role: "user",
      credits: 100,
      subscription: "free",
      subscriptionExpiry: null,
      firebaseUid: "firebase-demo-uid",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24 hours
    });
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => 
      user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => 
      user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => 
      user.firebaseUid === firebaseUid
    );
  }
}

// Export singleton instance
export const storage = new MemStorage();