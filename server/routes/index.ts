import { Express, Request, Response } from 'express';
import { createServer, Server } from 'http';
import { WebSocketServer } from 'ws';
import swaggerUi from 'swagger-ui-express';
import { specs } from '../swagger';
import { setupCanvaRoutes } from './canva.routes';
import { setupPresentationRoutes } from './presentation.routes';
import { setupAiRoutes } from './ai.routes';
import { setupOcrRoutes } from './ocr.routes';
import { setupCoachRoutes } from './coach.routes';
import { googleSlidesRoutes } from './google-slides.routes';
import { templatesRouter } from './templates.routes';
import { enhancedPresentationsRouter } from './enhanced-presentations.routes';
import analyticsRouter from './analytics.routes';
import collaborationRouter from './collaboration.routes';
import adaptiveLearningRouter from './adaptive-learning.routes';
import { setupAuth } from '../auth';
import { log } from '../vite';
import { storage } from '../storage';
import { handleDirectOcr } from '../direct-ocr';

/**
 * Master route registration function
 * @param app Express application
 * @returns HTTP server
 */
export function registerAllRoutes(app: Express): Server {
  // Set up authentication routes
  setupAuth(app);
  
  // Swagger UI documentation
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(specs, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  }));
  
  // Health check endpoint
  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Health check endpoint
   *     tags:
   *       - Health
   *     responses:
   *       200:
   *         description: Server is healthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthCheck'
   */
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Set up feature routes
  setupPresentationRoutes(app);
  setupCanvaRoutes(app);
  setupAiRoutes(app);
  setupOcrRoutes(app);
  setupCoachRoutes(app);
  
  // Google Slides integration
  app.use('/api/google-slides', googleSlidesRoutes);
  
  // Add a direct OCR endpoint for backward compatibility without auth requirement
  app.post('/api/ocr', handleDirectOcr);
  
  // Google Slides template routes
  app.use('/api/templates', templatesRouter);
  
  // Enhanced presentation routes
  app.use('/api', enhancedPresentationsRouter);

  // Analytics routes (NEW FEATURE)
  app.use('/api/analytics', analyticsRouter);

  // Collaboration routes (NEW FEATURE)
  app.use('/api/collaboration', collaborationRouter);

  // Adaptive Learning routes (NEW FEATURE - AGENTIC AI)
  app.use('/api/adaptive-learning', adaptiveLearningRouter);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server (on a distinct path to avoid conflicts with Vite HMR)
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws'
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws) => {
    log('WebSocket connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        log(`Received WebSocket message: ${data.type}`);
        
        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
            
          default:
            log(`Unknown WebSocket message type: ${data.type}`);
        }
      } catch (error) {
        log(`WebSocket error: ${error}`);
      }
    });
    
    ws.on('close', () => {
      log('WebSocket disconnected');
    });
  });
  
  return httpServer;
}