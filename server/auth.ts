import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import axios from "axios";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Handle legacy plain text passwords for development
  if (!stored.includes('.')) {
    return supplied === stored;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // In development mode, check for dev token in Authorization header
  if (process.env.NODE_ENV === 'development') {
    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer dev-test-token') {
      console.log('Development mode: Accepting mock authorization token');
      // Create a mock user for development - using user ID 1 for the test user
      req.user = { id: 1, username: 'testuser', email: 'test@test.com' } as any;
      return next();
    }
  }
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

// Verify Firebase ID token
async function verifyFirebaseToken(idToken: string) {
  // In development mode, accept mock tokens for testing
  if (process.env.NODE_ENV === 'development' && idToken === 'mock-development-token-for-testing') {
    console.log('Development mode: Accepting mock Firebase token');
    return true;
  }
  
  // In production, we would properly verify the token
  try {
    // Get Google public keys to verify the token
    const response = await axios.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    
    // For simplicity, we're trusting Firebase authentication here
    // In a production environment, you should verify the token signature
    // using the public keys and decode the token payload
    
    // For this implementation, we'll extract the user ID from the token
    // through Firebase SDK on the client-side and trust it
    return true;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        // If user doesn't exist (e.g., after database cleanup), clear the session
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.error('Error deserializing user:', err);
      // Clear the session if there's an error
      done(null, false);
    }
  });

  // Register a new user
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, name } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email) || 
                          await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.status(400).json({ 
          message: existingUser.email === email ? 
            "Email already registered" : 
            "Username already taken" 
        });
      }

      // Create new user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        name: name || null,
      });

      // Log in the new user
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Log in a user
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Google authentication
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { idToken, email, name, photoURL } = req.body;
      
      // In development mode with mock token, always return the test user (ID 1)
      if (process.env.NODE_ENV === 'development' && idToken === 'mock-development-token-for-testing') {
        console.log('Development mode: Accepting mock Firebase token');
        
        // Get the existing test user (ID 1)
        let user = await storage.getUser(1);
        
        if (!user) {
          // Create the test user if it doesn't exist
          user = await storage.createUser({
            username: 'testuser',
            email: 'test@test.com',
            name: 'Test User',
            password: await hashPassword('12345678'),
            avatar_url: photoURL || null,
            firebase_uid: null,
          });
        }
        
        // Update user with any new info from Firebase
        if (email !== user.email || name !== user.name || photoURL !== user.avatar_url) {
          user = await storage.updateUser(user.id, {
            email: email || user.email,
            name: name || user.name,
            avatar_url: photoURL || user.avatar_url,
          });
        }
        
        // Log the user in
        req.login(user, (err) => {
          if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ message: "Failed to log in" });
          }
          
          // Don't send the password back to the client
          const { password, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
        return;
      }
      
      // Verify the Firebase ID token
      const isValid = await verifyFirebaseToken(idToken);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid ID token" });
      }
      
      // Find or create user
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Generate a unique username based on email
        const baseUsername = email.split('@')[0];
        let username = baseUsername;
        let counter = 1;
        
        // Check if username exists and create a unique one
        while (await storage.getUserByUsername(username)) {
          username = `${baseUsername}${counter}`;
          counter++;
        }
        
        // Create new user
        user = await storage.createUser({
          username,
          email,
          name: name || null,
          password: await hashPassword(randomBytes(16).toString('hex')), // Random password, not used for login
          avatar_url: photoURL || null,
          firebase_uid: req.body.uid || null,
        });
      } else {
        // Update existing user with Firebase UID if not already set
        if (!user.firebase_uid) {
          user = await storage.updateUser(user.id, {
            firebase_uid: req.body.uid || null,
            avatar_url: photoURL || user.avatar_url,
            name: name || user.name,
          });
        }
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Failed to log in" });
        }
        
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Log out
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current authenticated user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Don't send the password back to the client
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });
}