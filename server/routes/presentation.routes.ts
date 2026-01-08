import { Express } from 'express';
import { PresentationController } from '../controllers/presentation.controller';

/**
 * Sets up presentation-related routes
 * @param app Express application
 */
export function setupPresentationRoutes(app: Express): void {
  const presentationController = new PresentationController();
  presentationController.registerRoutes(app);
}