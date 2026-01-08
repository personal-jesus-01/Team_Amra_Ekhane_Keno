import { Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth.middleware';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { insertPresentationSchema, insertSlideSchema } from '@shared/schema';
import { OcrService } from '../services/ocr.service';
import multer from 'multer';

/**
 * Controller for presentation operations
 */
export class PresentationController {
  /**
   * Handle error responses consistently
   */
  private handleError(error: unknown, res: Response, message: string) {
    console.error(`Presentation Error - ${message}:`, error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: fromZodError(error).message
      });
    }
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(statusCode).json({
      error: true,
      message: `${message}: ${errorMessage}`
    });
  }
  
  /**
   * Create a new presentation
   */
  async createPresentation(req: Request, res: Response) {
    try {
      const presentationData = insertPresentationSchema.parse({
        ...req.body,
        owner_id: req.user!.id
      });
      
      const presentation = await storage.createPresentation(presentationData);
      res.status(201).json(presentation);
    } catch (error) {
      this.handleError(error, res, 'Failed to create presentation');
    }
  }
  
  /**
   * Get presentations owned by the current user
   */
  async getUserPresentations(req: Request, res: Response) {
    try {
      const presentations = await storage.getPresentationsByUserId(req.user!.id);
      res.json(presentations);
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch presentations');
    }
  }
  
  /**
   * Get presentations shared with the current user
   */
  async getSharedPresentations(req: Request, res: Response) {
    try {
      const presentations = await storage.getSharedPresentations(req.user!.id);
      res.json(presentations);
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch shared presentations');
    }
  }
  
  /**
   * Get a specific presentation by ID
   */
  async getPresentationById(req: Request, res: Response) {
    try {
      const presentationId = parseInt(req.params.id);
      const presentation = await storage.getPresentationById(presentationId);
      
      if (!presentation) {
        return res.status(404).json({ message: "Presentation not found" });
      }
      
      // Check if user is owner or collaborator
      if (presentation.owner_id !== req.user!.id) {
        const collaborators = await storage.getCollaborators(presentationId);
        const isCollaborator = collaborators.some(c => c.user_id === req.user!.id);
        
        if (!isCollaborator) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.json(presentation);
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch presentation');
    }
  }
  
  /**
   * Update a presentation
   */
  async updatePresentation(req: Request, res: Response) {
    try {
      const presentationId = parseInt(req.params.id);
      const presentation = await storage.getPresentationById(presentationId);
      
      if (!presentation) {
        return res.status(404).json({ message: "Presentation not found" });
      }
      
      // Only owner can update presentation details
      if (presentation.owner_id !== req.user!.id) {
        return res.status(403).json({ message: "Only the owner can update presentation details" });
      }
      
      const updatedPresentation = await storage.updatePresentation(presentationId, req.body);
      res.json(updatedPresentation);
    } catch (error) {
      this.handleError(error, res, 'Failed to update presentation');
    }
  }
  
  /**
   * Delete a presentation
   */
  async deletePresentation(req: Request, res: Response) {
    try {
      const presentationId = parseInt(req.params.id);
      const presentation = await storage.getPresentationById(presentationId);
      
      if (!presentation) {
        return res.status(404).json({ message: "Presentation not found" });
      }
      
      // Only owner can delete presentation
      if (presentation.owner_id !== req.user!.id) {
        return res.status(403).json({ message: "Only the owner can delete this presentation" });
      }
      
      await storage.deletePresentation(presentationId);
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res, 'Failed to delete presentation');
    }
  }
  
  /**
   * Create a new slide
   */
  async createSlide(req: Request, res: Response) {
    try {
      const slideData = insertSlideSchema.parse(req.body);
      
      // Check if user has access to the presentation
      const presentation = await storage.getPresentationById(slideData.presentation_id);
      if (!presentation) {
        return res.status(404).json({ message: "Presentation not found" });
      }
      
      if (presentation.owner_id !== req.user!.id) {
        const collaborators = await storage.getCollaborators(slideData.presentation_id);
        const isEditor = collaborators.some(c => c.user_id === req.user!.id && c.role === 'editor');
        
        if (!isEditor) {
          return res.status(403).json({ message: "You don't have permission to add slides" });
        }
      }
      
      const slide = await storage.createSlide(slideData);
      res.status(201).json(slide);
    } catch (error) {
      this.handleError(error, res, 'Failed to create slide');
    }
  }
  
  /**
   * Get slides for a presentation
   */
  async getPresentationSlides(req: Request, res: Response) {
    try {
      const presentationId = parseInt(req.params.id);
      const presentation = await storage.getPresentationById(presentationId);
      
      if (!presentation) {
        return res.status(404).json({ message: "Presentation not found" });
      }
      
      // Check if user has access
      if (presentation.owner_id !== req.user!.id) {
        const collaborators = await storage.getCollaborators(presentationId);
        const isCollaborator = collaborators.some(c => c.user_id === req.user!.id);
        
        if (!isCollaborator) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const slides = await storage.getSlidesByPresentationId(presentationId);
      res.json(slides);
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch slides');
    }
  }
  
  /**
   * Update a slide
   */
  async updateSlide(req: Request, res: Response) {
    try {
      const slideId = parseInt(req.params.id);
      
      // Get slide by ID
      const slides = await storage.getSlidesByPresentationId(req.body.presentation_id);
      const slide = slides.find(s => s.id === slideId);
      
      if (!slide) {
        // If slide not found by ID, try to get it by slide_number
        const slideByNumber = slides.find(s => s.slide_number === parseInt(req.params.id));
        if (slideByNumber) {
          const updatedSlide = await storage.updateSlide(slideByNumber.id, req.body);
          return res.json(updatedSlide);
        }
        return res.status(404).json({ message: "Slide not found" });
      }
      
      // Check if user has access to edit
      const presentation = await storage.getPresentationById(slide.presentation_id);
      if (!presentation) {
        return res.status(404).json({ message: "Presentation not found" });
      }
      
      if (presentation.owner_id !== req.user?.id) {
        const collaborators = await storage.getCollaborators(slide.presentation_id);
        const isEditor = collaborators.some(c => c.user_id === req.user?.id && c.role === 'editor');
        
        if (!isEditor) {
          return res.status(403).json({ message: "You don't have permission to edit slides" });
        }
      }
      
      const updatedSlide = await storage.updateSlide(slideId, req.body);
      res.json(updatedSlide);
    } catch (error) {
      this.handleError(error, res, 'Failed to update slide');
    }
  }
  
  /**
   * Upload and process a presentation file
   */
  async uploadPresentation(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: true, 
          message: 'No file uploaded' 
        });
      }
      
      console.log('Received file upload:', req.file.originalname, req.file.mimetype);
      
      // Create a title from the filename by removing extension
      const title = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, "");
      
      // Create new presentation record
      const presentationData = insertPresentationSchema.parse({
        title,
        owner_id: req.user!.id,
        description: `Uploaded from ${req.file.originalname}`,
        status: 'draft', // Using 'draft' as it's one of the allowed values
        settings: { theme: 'default' },
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Save the presentation to the database
      const presentation = await storage.createPresentation(presentationData);
      console.log('Created presentation:', presentation.id);
      
      // For PDF files, use direct OpenAI processing
      if (req.file.mimetype === 'application/pdf') {
        try {
          console.log('Processing PDF with OpenAI Vision...');
          
          // Import the OpenAI PDF processing function
          const { processPdfWithVision } = await import('../openai');
          
          // Process the PDF with OpenAI
          const result = await processPdfWithVision(req.file.buffer);
          console.log('OpenAI processing complete. Extracted text length:', result.text.length);
          console.log('Slides detected:', result.slideContent.length);
          
          // Create slides from the OpenAI analysis
          for (let i = 0; i < result.slideContent.length; i++) {
            const slide = result.slideContent[i];
            await storage.createSlide({
              presentation_id: presentation.id,
              slide_number: i + 1,
              content: JSON.stringify({
                title: slide.title,
                content: slide.content,
                type: slide.slideType,
                layout: slide.layoutRecommendation,
                visualSuggestions: slide.visualSuggestions
              }),
              background_color: null,
            });
          }
          
          console.log(`Created ${result.slideContent.length} slides from OpenAI analysis`);
        } catch (extractError) {
          console.error('Error processing PDF with OpenAI:', extractError);
          // If processing fails, still return the presentation
          // but log the error and don't create slides
        }
      } 
      // For other document types, use the original OCR approach
      else if (['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(req.file.mimetype)) {
        try {
          // Create an instance of the OCR service
          const ocrService = new OcrService();
          
          // Extract text from the document
          const text = await ocrService.extractTextFromDocument(req.file.buffer, req.file.mimetype);
          console.log('Extracted text length:', text.length);
          
          // Create slides from extracted text (simple approach - can be enhanced)
          // Split by multiple newlines which likely represent slide breaks
          const sections = text.split(/\n{3,}/g);
          
          for (let i = 0; i < sections.length; i++) {
            if (sections[i].trim().length > 0) {
              // Create a slide for each section
              const slideTitle = sections[i].split('\n')[0].substring(0, 50) || `Slide ${i + 1}`;
              await storage.createSlide({
                presentation_id: presentation.id,
                slide_number: i + 1,
                content: sections[i],
                background_color: null,
              });
            }
          }
          
          console.log(`Created ${sections.length} slides from document`);
        } catch (extractError) {
          console.error('Error processing document content:', extractError);
          // If text extraction fails, still return the presentation
          // but log the error and don't create slides
        }
      }
      
      res.status(201).json({
        id: presentation.id,
        title: presentation.title,
        message: 'Presentation uploaded successfully'
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to upload presentation');
    }
  }

  /**
   * Register all routes
   */
  registerRoutes(app: any) {
    // Setup file upload middleware
    const upload = multer({ 
      storage: multer.memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
    });
    
    // Bind methods to the instance
    const createPresentation = this.createPresentation.bind(this);
    const getUserPresentations = this.getUserPresentations.bind(this);
    const getSharedPresentations = this.getSharedPresentations.bind(this);
    const getPresentationById = this.getPresentationById.bind(this);
    const updatePresentation = this.updatePresentation.bind(this);
    const deletePresentation = this.deletePresentation.bind(this);
    const createSlide = this.createSlide.bind(this);
    const getPresentationSlides = this.getPresentationSlides.bind(this);
    const updateSlide = this.updateSlide.bind(this);
    const uploadPresentation = this.uploadPresentation.bind(this);
    
    // Register presentation routes
    app.post("/api/presentations/upload", requireAuth, upload.single('file'), uploadPresentation);
    app.post("/api/presentations", requireAuth, createPresentation);
    app.get("/api/presentations", requireAuth, getUserPresentations);
    app.get("/api/presentations/shared", requireAuth, getSharedPresentations);
    app.get("/api/presentations/:id", requireAuth, getPresentationById);
    app.put("/api/presentations/:id", requireAuth, updatePresentation);
    app.delete("/api/presentations/:id", requireAuth, deletePresentation);
    
    // Register slide routes
    app.post("/api/slides", requireAuth, createSlide);
    app.get("/api/presentations/:id/slides", requireAuth, getPresentationSlides);
    app.put("/api/slides/:id", requireAuth, updateSlide);
  }
}