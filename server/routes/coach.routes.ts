import { Express } from 'express';
import { CoachController } from '../controllers/coach.controller';

/**
 * Sets up coaching-related routes
 * @param app Express application
 */
export function setupCoachRoutes(app: Express): void {
  const coachController = new CoachController();
  coachController.registerRoutes(app);
}