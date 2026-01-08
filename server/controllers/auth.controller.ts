import { Request, Response } from 'express';
import { storage } from '../storage';

/**
 * Controller for authentication operations
 */
export class AuthController {
  /**
   * Handle Google authentication
   * Verifies Firebase token and creates or retrieves user
   */
  async handleGoogleAuth(req: Request, res: Response) {
    try {
      const { uid, email, displayName, photoURL } = req.body;
      
      if (!uid || !email) {
        return res.status(400).json({ message: "Missing required user data" });
      }
      
      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          username: email.split('@')[0], // Use part of email as username
          email: email,
          password: `firebase_${uid}`, // We won't use this password for login
          name: displayName || email.split('@')[0],
          avatar_url: photoURL || undefined,
          firebase_uid: uid
        });
      } else if (!user.firebase_uid) {
        // Update existing user with Firebase UID if they don't have one
        user = await storage.updateUser(user.id, {
          firebase_uid: uid,
          avatar_url: photoURL || user.avatar_url
        });
      }
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to log in user" });
        }
        
        // Return user info
        return res.status(200).json(user);
      });
    } catch (error) {
      console.error('Google auth error:', error);
      return res.status(500).json({ message: "Authentication failed" });
    }
  }
  
  /**
   * Log out the current user
   */
  async logoutUser(req: Request, res: Response) {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  }
  
  /**
   * Get current user data
   */
  getCurrentUser(req: Request, res: Response) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.status(200).json(req.user);
  }
  
  /**
   * Register routes for auth controller
   */
  registerRoutes(app: any) {
    app.post('/api/auth/google', this.handleGoogleAuth.bind(this));
    app.post('/api/logout', this.logoutUser.bind(this));
    app.get('/api/user', this.getCurrentUser.bind(this));
  }
}