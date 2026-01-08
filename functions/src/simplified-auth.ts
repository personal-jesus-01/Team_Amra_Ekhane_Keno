/**
 * Simplified Firebase Functions authentication implementation
 * For SlideBanai production deployment
 */

import { Request, Response, NextFunction, Express } from "express";
import session from "express-session";
import { storage } from "./simplified-storage";

/**
 * Simple middleware to check if user is authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
  return;
}

/**
 * Setup authentication routes
 */
export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.use(session(sessionSettings));

  // Basic user session endpoints
  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({
      id: 1,
      username: "firebase-user",
      email: "demo@example.com",
      name: "Firebase Demo User",
      role: "user"
    });
    return;
  });

  app.post("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err: any) => {
      if (err) return next(err);
      res.sendStatus(200);
      return;
    });
  });
}