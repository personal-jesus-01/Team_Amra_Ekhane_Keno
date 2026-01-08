import { Express } from 'express';
import { AiController } from '../controllers/ai.controller';

/**
 * Sets up AI-related routes
 * @param app Express application
 */
export function setupAiRoutes(app: Express): void {
  const aiController = new AiController();
  aiController.registerRoutes(app);
}