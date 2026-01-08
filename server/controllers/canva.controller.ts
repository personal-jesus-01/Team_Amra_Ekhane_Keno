import { Request, Response } from 'express';
import { CanvaService } from '../services/canva.service';

/**
 * Controller class for handling Canva-related API requests
 */
export class CanvaController {
  private canvaService: CanvaService;

  /**
   * Creates a new instance of CanvaController
   */
  constructor() {
    this.canvaService = new CanvaService();
  }

  /**
   * Middleware to require authentication
   */
  requireAuth(req: Request, res: Response, next: Function) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  }

  /**
   * Handle error responses consistently
   */
  handleError(error: unknown, res: Response, message: string) {
    console.error(`Canva API Error - ${message}:`, error);
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(statusCode).json({
      error: true,
      message: `${message}: ${errorMessage}`
    });
  }

  /**
   * Get Canva templates
   */
  async getTemplates(req: Request, res: Response) {
    try {
      const { category, limit = 10 } = req.query;
      const templates = await this.canvaService.getTemplates(
        category as string | undefined, 
        parseInt(limit as string, 10)
      );
      res.json({ success: true, data: templates });
    } catch (error: unknown) {
      this.handleError(error, res, 'Failed to fetch Canva templates');
    }
  }

  /**
   * Create a presentation in Canva
   */
  async createPresentation(req: Request, res: Response) {
    try {
      const { title, slides, templateId } = req.body;
      
      if (!title || !slides || !Array.isArray(slides)) {
        return res.status(400).json({ 
          error: true, 
          message: 'Missing required parameters: title and slides array' 
        });
      }
      
      const presentation = await this.canvaService.generatePresentation(
        title, 
        slides, 
        templateId
      );
      
      res.json(presentation);
    } catch (error: unknown) {
      this.handleError(error, res, 'Failed to create Canva presentation');
    }
  }

  /**
   * Get design details
   */
  async getDesignDetails(req: Request, res: Response) {
    try {
      const { designId } = req.params;
      const design = await this.canvaService.getDesignDetails(designId);
      res.json(design);
    } catch (error: unknown) {
      this.handleError(error, res, 'Failed to get design details');
    }
  }

  /**
   * Register all routes
   */
  registerRoutes(app: any) {
    // Bind methods to the instance
    const requireAuth = this.requireAuth.bind(this);
    const getTemplates = this.getTemplates.bind(this);
    const createPresentation = this.createPresentation.bind(this);
    const getDesignDetails = this.getDesignDetails.bind(this);

    // Register routes
    app.get('/api/canva/templates', requireAuth, getTemplates);
    app.post('/api/canva/presentations', requireAuth, createPresentation);
    app.get('/api/canva/designs/:designId', requireAuth, getDesignDetails);
  }
}