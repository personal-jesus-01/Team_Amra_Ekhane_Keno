import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if a user is authenticated
 * @param req Express request
 * @param res Express response
 * @param next Next function
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): any {
  // In development mode, let requests through with mock user data if using specific test tokens
  if (process.env.NODE_ENV === 'development' && 
      req.headers.authorization === 'Bearer dev-test-token') {
    console.log('Development mode: Accepting mock authorization token');
    
    // Set a mock user for development testing
    req.user = {
      id: 1,
      username: 'testuser',
      email: 'test@test.com',
      password: 'hashed', // Not a real password hash
      name: 'Test User',
      avatar_url: null,
      firebase_uid: null,
      subscription_type: 'free',
      credits: 5,
      subscription_expiry: null,
      created_at: new Date()
    };
    return next();
  }
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}