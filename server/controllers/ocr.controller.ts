import { Request, Response } from 'express';
import { OcrService } from '../services/ocr.service';
import { AiService } from '../services/ai.service';
import { requireAuth } from '../middleware/auth.middleware';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * Controller for OCR operations
 */
export class OcrController {
  private ocrService: OcrService;
  private aiService: AiService;
  
  /**
   * Creates a new instance of OcrController
   */
  constructor() {
    this.ocrService = new OcrService();
    this.aiService = new AiService();
  }
  
  /**
   * Handle error responses consistently
   */
  private handleError(error: unknown, res: Response, message: string) {
    console.error(`OCR Error - ${message}:`, error);
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(statusCode).json({
      error: true,
      message: `${message}: ${errorMessage}`
    });
  }
  
  /**
   * Process uploaded document and extract text
   */
  async extractText(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: true, 
          message: 'No file uploaded' 
        });
      }
      
      const text = await this.ocrService.extractTextFromDocument(
        req.file.buffer,
        req.file.mimetype
      );
      
      res.json({ 
        success: true,
        text,
        length: text.length,
        fileType: req.file.mimetype
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to extract text');
    }
  }
  
  /**
   * Extract text and generate a summary
   */
  async extractAndSummarize(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: true, 
          message: 'No file uploaded' 
        });
      }
      
      // Extract text from document
      const text = await this.ocrService.extractTextFromDocument(
        req.file.buffer,
        req.file.mimetype
      );
      
      // Generate summary using AI service
      const summary = await this.aiService.summarizeText(text);
      
      res.json({ 
        success: true,
        originalText: text,
        summary,
        textLength: text.length,
        summaryLength: summary.length,
        fileType: req.file.mimetype
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to extract and summarize text');
    }
  }
  
  /**
   * Register all routes
   */
  registerRoutes(app: any) {
    // Prepare middleware for file uploads
    const fileUploadMiddleware = upload.single('file');
    
    // Bind methods to the instance
    const extractText = this.extractText.bind(this);
    const extractAndSummarize = this.extractAndSummarize.bind(this);
    
    // Register routes
    app.post('/api/ocr/extract', requireAuth, fileUploadMiddleware, extractText);
    app.post('/api/ocr/summarize', requireAuth, fileUploadMiddleware, extractAndSummarize);
  }
}