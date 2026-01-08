import { Express } from 'express';
import { CanvaController } from '../controllers/canva.controller';

/**
 * Sets up routes for Canva integration
 * @param app Express application
 */
export function setupCanvaRoutes(app: Express): void {
  const canvaController = new CanvaController();
  canvaController.registerRoutes(app);
}