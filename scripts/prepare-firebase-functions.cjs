#!/usr/bin/env node

/**
 * Prepares the Firebase Functions deployment
 * This script copies necessary server code to the functions directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory paths
const SERVER_DIR = path.resolve(__dirname, '../server');
const FUNCTIONS_SRC_DIR = path.resolve(__dirname, '../functions/src');
const SHARED_DIR = path.resolve(__dirname, '../shared');
const FUNCTIONS_SHARED_DIR = path.resolve(__dirname, '../functions/src/shared');

console.log('📦 Preparing Firebase Functions for deployment...');

// Ensure functions/src directory exists
if (!fs.existsSync(FUNCTIONS_SRC_DIR)) {
  fs.mkdirSync(FUNCTIONS_SRC_DIR, { recursive: true });
}

// Create functions/src/shared if it doesn't exist
if (!fs.existsSync(FUNCTIONS_SHARED_DIR)) {
  fs.mkdirSync(FUNCTIONS_SHARED_DIR, { recursive: true });
}

// Create a proper index.ts that adapts our server code to Firebase Functions
const functionIndexContent = `/**
 * Firebase Cloud Functions API entry point
 * Optimized for production deployment
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { Express, Request, Response } from "express";

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    message: "SlideBanai API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production"
  });
  return;
});

// Import auth setup from simplified implementation
import { setupAuth, requireAuth } from "./simplified-auth";

// Setup authentication
setupAuth(app);

// API routes
app.get("/api/test", requireAuth, (req: Request, res: Response) => {
  res.json({ 
    message: "API test successful",
    user: req.user || { guest: true }
  });
  return;
});

// Mock presentation data endpoint for frontend testing
app.get("/api/presentations", requireAuth, (req: Request, res: Response) => {
  res.json([
    {
      id: 1,
      title: "Sample Presentation",
      description: "This is a sample presentation created via Firebase Functions",
      slides: 10,
      createdAt: new Date().toISOString(),
      thumbnail: "https://placekitten.com/300/200"
    }
  ]);
  return;
});

// Canva integration endpoints
app.get("/api/canva/templates", requireAuth, (req: Request, res: Response) => {
  res.json([
    {
      id: "template-1",
      name: "Business Template",
      thumbnailUrl: "https://placekitten.com/200/140",
      category: "business"
    },
    {
      id: "template-2",
      name: "Creative Template",
      thumbnailUrl: "https://placekitten.com/200/141",
      category: "creative"
    }
  ]);
  return;
});

// Import simplified Canva implementation
import { setupCanvaRoutes } from "./simplified-canva";

// Setup Canva routes
setupCanvaRoutes(app);

// Export the API as a Firebase Function
export const api = functions.https.onRequest(app);
`;

// Write the adapter index.ts
fs.writeFileSync(path.join(FUNCTIONS_SRC_DIR, 'index.ts'), functionIndexContent);
console.log('✅ Created functions/src/index.ts');

// Create simplified versions for Firebase Functions
console.log('\n📝 Creating simplified implementations for Firebase Functions...');

// Create simplified-canva.ts file
const simplifiedCanvaContent = `/**
 * Simplified Canva integration for Firebase Functions deployment
 */

import { Request, Response, Express } from "express";
import { requireAuth } from "./simplified-auth";

// Mock Canva templates data
const templateData = [
  {
    id: "template-1",
    name: "Professional Business",
    thumbnailUrl: "https://placekitten.com/300/200",
    category: "business"
  },
  {
    id: "template-2",
    name: "Creative Pitch",
    thumbnailUrl: "https://placekitten.com/300/201",
    category: "creative"
  },
  {
    id: "template-3",
    name: "Educational Presentation",
    thumbnailUrl: "https://placekitten.com/300/202",
    category: "education"
  },
  {
    id: "template-4",
    name: "Modern Minimal",
    thumbnailUrl: "https://placekitten.com/300/203",
    category: "minimal"
  }
];

/**
 * Setup Canva integration routes
 */
export function setupCanvaRoutes(app: Express) {
  // Get available templates
  app.get('/api/canva/templates', requireAuth, (req: Request, res: Response) => {
    const category = req.query.category as string | undefined;
    const limit = parseInt(req.query.limit as string || '10');
    
    let templates = [...templateData];
    
    // Filter by category if provided
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    
    // Apply limit
    templates = templates.slice(0, limit);
    
    res.json(templates);
    return;
  });
  
  // Create presentation from template
  app.post('/api/canva/presentations', requireAuth, (req: Request, res: Response) => {
    const { title, template_id } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Create mock presentation data
    const presentation = {
      id: \`pres-\${Date.now()}\`,
      title,
      description: \`Created from template \${template_id || 'default'}\`,
      edit_url: \`https://www.canva.com/design/demo/edit\`,
      created_at: new Date().toISOString(),
      template_id: template_id || 'default'
    };
    
    res.status(201).json(presentation);
    return;
  });
}`;

// Create simplified-storage.ts file
const simplifiedStorageContent = `/**
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
export const storage = new MemStorage();`;

fs.writeFileSync(path.join(FUNCTIONS_SRC_DIR, 'simplified-canva.ts'), simplifiedCanvaContent);
console.log('✅ Created simplified-canva.ts');

fs.writeFileSync(path.join(FUNCTIONS_SRC_DIR, 'simplified-storage.ts'), simplifiedStorageContent);
console.log('✅ Created simplified-storage.ts');

// Copy any needed server files (optional, we're using simplified versions)
console.log('\n📁 Copying additional server files (if needed)...');
const filesToCopy = [
  'openai.ts',
  'ocr.ts',
];

filesToCopy.forEach(file => {
  const sourcePath = path.join(SERVER_DIR, file);
  const destPath = path.join(FUNCTIONS_SRC_DIR, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${file} to functions/src`);
  } else {
    console.log(`⚠️ Warning: ${file} not found in server directory`);
  }
});

// Copy shared schema.ts to functions/src/shared
const sharedSchemaPath = path.join(SHARED_DIR, 'schema.ts');
const destSharedSchemaPath = path.join(FUNCTIONS_SHARED_DIR, 'schema.ts');

if (fs.existsSync(sharedSchemaPath)) {
  // Modify the schema imports to work in Firebase Functions
  let schemaContent = fs.readFileSync(sharedSchemaPath, 'utf8');
  
  // Replace any import paths if needed
  schemaContent = schemaContent.replace(/from\s+['"]@shared\//g, 'from \'./');
  
  // Write the modified schema
  fs.writeFileSync(destSharedSchemaPath, schemaContent);
  console.log('✅ Copied and adjusted shared/schema.ts to functions/src/shared');
} else {
  console.log('⚠️ Warning: schema.ts not found in shared directory');
}

// Create a tsconfig.functions.json file to help with module resolution
const tsconfigFunctions = {
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": false,
    "outDir": "lib",
    "sourceMap": true,
    "strict": false,
    "target": "es2017",
    "baseUrl": "./",
    "paths": {
      "@shared/*": ["./src/shared/*"]
    },
    "esModuleInterop": true
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
};

fs.writeFileSync(
  path.join(__dirname, '../functions/tsconfig.json'), 
  JSON.stringify(tsconfigFunctions, null, 2)
);
console.log('✅ Created optimized tsconfig.json for Firebase Functions');

// Build the functions
console.log('\n🔨 Building Firebase Functions...');
try {
  execSync('cd functions && npm run build', { stdio: 'inherit' });
  console.log('✅ Functions build complete');
} catch (error) {
  console.error('❌ Functions build failed:', error);
  process.exit(1);
}

console.log('\n✅ Firebase Functions preparation complete!');
console.log('You can now deploy with: firebase deploy');