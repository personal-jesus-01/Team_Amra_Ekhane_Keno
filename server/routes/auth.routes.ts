import { Express } from 'express';
import { setupAuth } from '../auth';

/**
 * Sets up authentication-related routes
 * @param app Express application
 */
export function setupAuthRoutes(app: Express): void {
  setupAuth(app);
}