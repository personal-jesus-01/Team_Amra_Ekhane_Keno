import { Express } from 'express';
import { OcrController } from '../controllers/ocr.controller';

/**
 * Sets up OCR-related routes
 * @param app Express application
 */
export function setupOcrRoutes(app: Express): void {
  const ocrController = new OcrController();
  ocrController.registerRoutes(app);
}