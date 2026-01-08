import { Request, Response } from 'express';
import { AiService } from '../services/ai.service';
import { requireAuth } from '../middleware/auth.middleware';

/**
 * Controller for AI operations
 */
export class AiController {
  private aiService: AiService;
  
  /**
   * Creates a new instance of AiController
   */
  constructor() {
    this.aiService = new AiService();
  }
  
  /**
   * Handle error responses consistently
   */
  private handleError(error: unknown, res: Response, message: string) {
    console.error(`AI Error - ${message}:`, error);
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(statusCode).json({
      error: true,
      message: `${message}: ${errorMessage}`
    });
  }
  
  /**
   * Generate a summary from OCR extracted text
   */
  async summarizeText(req: Request, res: Response) {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ 
          error: true, 
          message: 'Text is required' 
        });
      }
      
      const summary = await this.aiService.summarizeText(text);
      res.json({ summary });
    } catch (error) {
      this.handleError(error, res, 'Failed to summarize text');
    }
  }
  
  /**
   * Generate presentation slides
   */
  async generateSlides(req: Request, res: Response) {
    try {
      const { prompt, numberOfSlides, style, brandColors } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ 
          error: true, 
          message: 'Prompt is required' 
        });
      }
      
      const slides = await this.aiService.generatePresentationSlides(
        prompt,
        numberOfSlides || 5,
        style || 'professional',
        brandColors || []
      );
      
      res.json(slides);
    } catch (error) {
      this.handleError(error, res, 'Failed to generate slides');
    }
  }
  
  /**
   * Generate coach feedback for presentations with optional video analysis
   */
  async generateCoachFeedback(req: Request, res: Response) {
    try {
      const { presentationText, videoData, slidesContent, presentationId } = req.body;
      
      if (!presentationText) {
        return res.status(400).json({ 
          error: true, 
          message: 'Presentation text is required' 
        });
      }
      
      // If presentation ID is provided, fetch the slides to provide context
      let slidesFromPresentation = '';
      if (presentationId && !slidesContent) {
        try {
          // Import storage here to avoid circular dependencies
          const { storage } = require('../storage');
          const slides = await storage.getSlidesByPresentationId(parseInt(presentationId));
          if (slides && slides.length > 0) {
            slidesFromPresentation = slides.map((slide: any) => 
              `Slide ${slide.slide_number}: ${slide.content}`
            ).join('\n\n');
          }
        } catch (err) {
          console.warn('Could not fetch slides for presentation context:', err);
          // Continue without slides data
        }
      }
      
      // Generate feedback with all available data
      const feedback = await this.aiService.generateCoachFeedback(
        presentationText, 
        videoData,
        slidesContent || slidesFromPresentation,
        presentationId ? parseInt(presentationId) : undefined
      );
      
      res.json(feedback);
    } catch (error) {
      this.handleError(error, res, 'Failed to generate coach feedback');
    }
  }
  
  /**
   * Extract content topics from text
   */
  async extractContentTopics(req: Request, res: Response) {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ 
          error: true, 
          message: 'Content is required' 
        });
      }
      
      const topicsResult = await this.aiService.extractContentTopics(content);
      res.json(topicsResult);
    } catch (error) {
      this.handleError(error, res, 'Failed to extract content topics');
    }
  }
  
  /**
   * Generate a presentation outline based on prompt/PDF and preferences
   */
  async generateOutline(req: Request, res: Response) {
    try {
      const { 
        prompt, 
        topic,
        numberOfSlides, 
        sourceType, 
        language,
        audienceType,
        presentationTone,
        audienceKnowledge,
        timePeriod,
        projectType,
        pdfContent
      } = req.body;
      
      if (!prompt && !topic && sourceType === 'prompt') {
        return res.status(400).json({ 
          error: true, 
          message: 'Topic or prompt is required' 
        });
      }
      
      const outline = await this.aiService.generateOutline({
        prompt: prompt || topic,
        numberOfSlides,
        sourceType,
        language,
        audienceType,
        presentationTone,
        audienceKnowledge,
        timePeriod,
        projectType,
        pdfKnowledgeBase: pdfContent
      });
      
      res.json(outline);
    } catch (error) {
      this.handleError(error, res, 'Failed to generate outline');
    }
  }

  /**
   * Generate complete presentation from PDF knowledge base, topic, and preferences
   */
  async generateSlidesFromOutline(req: Request, res: Response) {
    try {
      const { 
        presentationId, 
        outline, 
        topic,
        audienceType = 'general',
        presentationTone = 'professional',
        numberOfSlides = 8,
        pdfContent = null
      } = req.body;
      
      if (!presentationId) {
        return res.status(400).json({ 
          error: true, 
          message: 'Presentation ID is required' 
        });
      }
      
      if (!outline) {
        return res.status(400).json({ 
          error: true, 
          message: 'Outline is required' 
        });
      }

      // Get presentation details from database
      const { storage } = await import('../storage');
      const presentation = await storage.getPresentationById(presentationId);
      
      if (!presentation) {
        return res.status(404).json({
          error: true,
          message: 'Presentation not found'
        });
      }

      // Generate actual presentable slide content using PDF knowledge base
      const actualSlideContent = await this.aiService.generateActualSlideContent(
        outline,
        presentation.title,
        {
          topic,
          audienceType,
          presentationTone,
          numberOfSlides,
          pdfKnowledgeBase: pdfContent
        }
      );

      // Create Google Slides presentation with actual content
      const { createEnhancedPresentation } = await import('../google-slides');
      const googleSlidesResult = await createEnhancedPresentation(
        presentation.title, 
        actualSlideContent, 
        {
          templateId: 'modern-business'
        }
      );

      console.log('Google Slides creation result:', googleSlidesResult);

      // Update the presentation record with Google Slides info
      await storage.updatePresentation(presentationId, {
        status: 'published',
        external_url: googleSlidesResult?.editUrl
      });

      // Create slide records in the database with actual content
      for (let i = 0; i < actualSlideContent.length; i++) {
        const slide = actualSlideContent[i];
        await storage.createSlide({
          presentation_id: presentationId,
          slide_number: slide.slide_number || (i + 1),
          content: slide.content,
          background_color: slide.background_color || '#ffffff'
        });
      }

      res.json({ 
        presentationId,
        slides: actualSlideContent,
        googleSlides: googleSlidesResult,
        embedUrl: `https://docs.google.com/presentation/d/${googleSlidesResult.presentationId}/embed`,
        success: true
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to generate presentation from outline');
    }
  }

  /**
   * Generate presentation from prompt with complete workflow (outline -> slides -> Google Slides)
   */
  async generatePresentationFromPrompt(req: Request, res: Response) {
    try {
      const { 
        title, 
        prompt, 
        numberOfSlides = 10, 
        audienceType = 'general',
        presentationTone = 'professional',
        templateId = 'modern-business'
      } = req.body;
      
      if (!title || !prompt) {
        return res.status(400).json({ 
          error: 'Title and prompt are required' 
        });
      }

      console.log(`Generating presentation from prompt: "${title}" with ${numberOfSlides} slides`);

      // Step 1: Generate outline from prompt
      const outline = await this.aiService.generateOutline({
        prompt,
        numberOfSlides,
        sourceType: 'text',
        audienceType,
        presentationTone,
        language: 'english'
      });

      console.log('Generated outline:', outline);

      // Step 2: Create presentation record in database
      const { storage } = await import('../storage');
      console.log('User from request:', req.user);
      console.log('User ID being used:', req.user!.id);
      
      const presentation = await storage.createPresentation({
        title,
        owner_id: req.user!.id,
        status: 'draft',
        slides_count: numberOfSlides
      });

      console.log('Created presentation record:', presentation.id);

      // Step 3: Generate comprehensive slide content using the outline
      const actualSlideContent = await this.aiService.generateActualSlideContent(
        outline,
        title,
        {
          topic: prompt,
          audienceType,
          presentationTone,
          numberOfSlides
        }
      );

      console.log(`Generated ${actualSlideContent.length} slides with comprehensive content`);

      // Step 4: Create Google Slides presentation
      const { createEnhancedPresentation } = await import('../google-slides');
      const googleSlidesResult = await createEnhancedPresentation(
        title, 
        actualSlideContent, 
        {
          templateId
        }
      );

      console.log('Google Slides creation result:', googleSlidesResult);

      // Step 5: Update presentation record with Google Slides info
      await storage.updatePresentation(presentation.id, {
        status: 'published',
        external_url: googleSlidesResult?.editUrl,
        slides_count: actualSlideContent.length
      });

      // Step 6: Create slide records in database
      for (let i = 0; i < actualSlideContent.length; i++) {
        const slide = actualSlideContent[i];
        await storage.createSlide({
          presentation_id: presentation.id,
          slide_number: slide.slide_number || (i + 1),
          content: slide.content,
          background_color: slide.background_color || '#ffffff'
        });
      }

      console.log(`Presentation saved to database: ${presentation.id}`);

      res.json({
        success: true,
        title,
        slideCount: actualSlideContent.length,
        slides: actualSlideContent,
        googleSlides: googleSlidesResult,
        editUrl: googleSlidesResult?.editUrl,
        presentationId: presentation.id,
        outline,
        message: 'Presentation created successfully from prompt with Google Slides'
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to generate presentation from prompt');
    }
  }

  /**
   * Enhanced presentation generation with Google Slides integration and content moderation
   */
  async generatePresentationWithSlides(req: Request, res: Response) {
    try {
      const { 
        title, 
        prompt, 
        numberOfSlides = 8, 
        templateId = 'modern-business',
        audience = 'general', 
        tone = 'professional', 
        presentationType = 'business',
        moderateContent = true 
      } = req.body;
      
      if (!title || !prompt) {
        return res.status(400).json({ 
          error: true, 
          message: 'Title and prompt are required' 
        });
      }

      // Step 1: Generate slide content with OpenAI (Content Moderation)
      const slideContent = await this.aiService.generatePresentationContent(prompt, {
        numberOfSlides,
        audience,
        tone,
        presentationType
      });

      // Step 2: Content moderation check (if enabled)
      if (moderateContent) {
        const moderationResult = await this.aiService.moderateContent(slideContent);
        if (!moderationResult.approved) {
          return res.status(400).json({
            error: true,
            message: 'Content did not pass moderation',
            moderationDetails: moderationResult
          });
        }
      }

      // Step 3: Create Google Slides presentation with template
      const { createEnhancedPresentation } = require('../google-slides');
      const googleSlidesResult = await createEnhancedPresentation(title, slideContent, {
        templateId
      });

      // Step 4: Create presentation record in database
      const { storage } = require('../storage');
      const presentation = await storage.createPresentation({
        title,
        owner_id: req.user?.id!,
        status: "published",
        google_slides_id: googleSlidesResult.presentationId,
        google_slides_url: googleSlidesResult.editUrl
      });

      // Step 5: Create slide records
      for (const slide of slideContent) {
        await storage.createSlide({
          presentation_id: presentation.id,
          slide_number: slide.slide_number,
          title: slide.title,
          content: slide.content,
          slide_type: slide.slide_type,
          status: "published",
          background_color: "#ffffff",
          layout_type: slide.slide_type === 'title' ? 'title' : 'standard'
        });
      }

      res.json({
        success: true,
        presentation,
        googleSlides: googleSlidesResult,
        slidesGenerated: slideContent.length,
        embedUrl: `https://docs.google.com/presentation/d/${googleSlidesResult.presentationId}/embed`,
        moderationPassed: moderateContent
      });

    } catch (error) {
      this.handleError(error, res, 'Failed to generate presentation with slides');
    }
  }

  /**
   * Register all routes
   */
  registerRoutes(app: any) {
    // Bind methods to the instance
    const summarizeText = this.summarizeText.bind(this);
    const generateSlides = this.generateSlides.bind(this);
    const generateCoachFeedback = this.generateCoachFeedback.bind(this);
    const extractContentTopics = this.extractContentTopics.bind(this);
    const generateOutline = this.generateOutline.bind(this);
    const generateSlidesFromOutline = this.generateSlidesFromOutline.bind(this);
    const generatePresentationFromPrompt = this.generatePresentationFromPrompt.bind(this);
    const generatePresentationWithSlides = this.generatePresentationWithSlides.bind(this);
    
    // Register routes
    app.post('/api/ai/summarize', requireAuth, summarizeText);
    app.post('/api/ai/generate-slides', requireAuth, generateSlides);
    app.post('/api/ai/coach-feedback', requireAuth, generateCoachFeedback);
    app.post('/api/analyze-presentation', requireAuth, generateCoachFeedback); // Additional endpoint for coach-feedback
    app.post('/api/ai/extract-topics', requireAuth, extractContentTopics);
    app.post('/api/generate-outline', requireAuth, generateOutline); // Outline generation with auth
    app.post('/api/generate-slides-from-outline', requireAuth, generateSlidesFromOutline); // Slides from outline with auth
    app.post('/api/generate-presentation-from-prompt', requireAuth, generatePresentationFromPrompt); // Complete prompt-based workflow
    app.post('/api/ai/create-presentation-from-prompt', requireAuth, generatePresentationFromPrompt); // Alternative endpoint
    app.post('/api/presentations/generate-with-slides', requireAuth, generatePresentationWithSlides); // Enhanced presentation generation
  }
}