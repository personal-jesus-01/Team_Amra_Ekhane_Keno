import { Router } from 'express';
import { Request, Response } from 'express';
import { requireAuth } from '../auth';
import { generatePresentationContent } from '../services/presentation.service';
import { createMockGooglePresentation } from '../services/mock-google-slides.service';
import { extractTextFromDocument, fileUploadMiddleware } from '../ocr';
import { storage } from '../storage';

const router = Router();

// Enhanced presentation generation endpoint
router.post('/generate-enhanced-presentation', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      numberOfSlides = 10,
      audienceType = 'general',
      presentationType = 'Business',
      audienceKnowledge = 'Amateur',
      includeGraphs = false,
      includeCharts = false,
      includeImages = false,
      includeAnalytics = false,
      templateId = 'modern-business',
      sourceType,
      prompt,
      documentContent
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ 
        error: 'Title and description are required' 
      });
    }

    console.log(`Generating enhanced presentation: "${title}" (${numberOfSlides} slides)`);

    // Prepare enhanced prompt with all the details
    let enhancedPrompt = `Title: ${title}\n\nDescription: ${description}\n\n`;
    
    if (sourceType === 'upload' && documentContent) {
      enhancedPrompt += `Based on the following document content:\n${documentContent}\n\n`;
    } else if (sourceType === 'prompt' && prompt) {
      enhancedPrompt += `Additional context: ${prompt}\n\n`;
    }

    enhancedPrompt += `Presentation Requirements:
- Audience Type: ${audienceType}
- Presentation Type: ${presentationType}  
- Audience Knowledge Level: ${audienceKnowledge}
- Number of Slides: ${numberOfSlides}`;

    if (includeGraphs || includeCharts || includeImages || includeAnalytics) {
      enhancedPrompt += `\n\nInclude the following visual elements:`;
      if (includeGraphs) enhancedPrompt += `\n- Graphs and data visualizations`;
      if (includeCharts) enhancedPrompt += `\n- Pie charts and statistical charts`;
      if (includeImages) enhancedPrompt += `\n- Relevant images and visuals`;
      if (includeAnalytics) enhancedPrompt += `\n- Analytics and performance metrics`;
    }

    // Generate actual slide content using OpenAI
    const { generatePresentationSlides } = await import('../openai');
    console.log('Generating AI slide content...');
    const slides = await generatePresentationSlides(
      enhancedPrompt,
      numberOfSlides,
      1, // design variants
      [], // brand colors
      'professional' // style
    );

    console.log(`Generated ${slides.length} slides with AI content`);

    // Create real Google Slides presentation with AI content
    const { createEnhancedPresentation } = await import('../google-slides');
    console.log('Creating Google Slides with AI content...');
    const googleSlidesResult = await createEnhancedPresentation(title, slides, {
      templateId: templateId || 'modern-business'
    });

    // Save presentation to database
    const savedPresentation = await storage.createPresentation({
      title,
      owner_id: req.user!.id,
      slides_count: slides.length,
      external_url: googleSlidesResult.editUrl,
      thumbnail_url: `https://docs.google.com/presentation/d/${googleSlidesResult.presentationId}/preview`,
      status: 'published'
    });

    // Save individual slide records with AI-generated content
    console.log('Saving slide records to database...');
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      await storage.createSlide({
        presentation_id: savedPresentation.id,
        slide_number: i + 1,
        content: slide.content || '',
        background_color: slide.background_color || '#ffffff'
      });
    }

    console.log(`Enhanced presentation created successfully: ${savedPresentation.id} with ${slides.length} slides`);

    res.json({
      success: true,
      presentation: savedPresentation,
      googleSlides: googleSlidesResult,
      editUrl: googleSlidesResult.editUrl,
      slideCount: slides.length,
      message: 'Enhanced presentation created successfully with Google Slides integration'
    });

  } catch (error) {
    console.error('Error generating enhanced presentation:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to generate enhanced presentation' 
    });
  }
});

// Enhanced file upload with 30MB support
router.post('/upload-large-file', requireAuth, fileUploadMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Check file size (30MB limit)
    const maxSize = 30 * 1024 * 1024; // 30MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        error: 'File size exceeds 30MB limit' 
      });
    }

    console.log(`Processing large file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Extract text with enhanced OCR
    const extractedText = await extractTextFromDocument(req.file.buffer, req.file.mimetype);
    
    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({ 
        error: 'Could not extract sufficient text from the document. Please ensure the file contains readable content.' 
      });
    }

    res.json({
      success: true,
      text: extractedText,
      length: extractedText.length,
      filename: req.file.originalname,
      message: 'File processed successfully with enhanced OCR'
    });

  } catch (error) {
    console.error('Error processing large file:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process file' 
    });
  }
});

// Get template previews
router.get('/templates/preview/:templateId', (req: Request, res: Response) => {
  const { templateId } = req.params;
  
  const templates: Record<string, any> = {
    'modern-business': {
      id: 'modern-business',
      name: 'Modern Business',
      description: 'Clean, professional design perfect for business presentations',
      preview: '/templates/modern-business-preview.jpg',
      features: ['Professional layouts', 'Clean typography', 'Consistent branding'],
      colors: ['#1E40AF', '#3B82F6', '#F8FAFC'],
      layouts: ['Title Slide', 'Content Slide', 'Two Column', 'Chart Slide']
    },
    'creative-portfolio': {
      id: 'creative-portfolio',
      name: 'Creative Portfolio',
      description: 'Vibrant design ideal for creative presentations',
      preview: '/templates/creative-portfolio-preview.jpg',
      features: ['Bold colors', 'Creative layouts', 'Visual emphasis'],
      colors: ['#7C3AED', '#A855F7', '#F3E8FF'],
      layouts: ['Title Slide', 'Portfolio Grid', 'Image Focus', 'Creative Layout']
    },
    'corporate-blue': {
      id: 'corporate-blue',
      name: 'Corporate Blue',
      description: 'Traditional corporate style with blue accents',
      preview: '/templates/corporate-blue-preview.jpg',
      features: ['Corporate branding', 'Blue color scheme', 'Professional layouts'],
      colors: ['#1E3A8A', '#3B82F6', '#EFF6FF'],
      layouts: ['Executive Summary', 'Data Presentation', 'Timeline', 'Results']
    },
    'startup-pitch': {
      id: 'startup-pitch',
      name: 'Startup Pitch',
      description: 'Dynamic design for startup and investor presentations',
      preview: '/templates/startup-pitch-preview.jpg',
      features: ['Dynamic layouts', 'Investor-focused', 'Modern design'],
      colors: ['#059669', '#10B981', '#ECFDF5'],
      layouts: ['Problem/Solution', 'Market Size', 'Business Model', 'Financial Projections']
    }
  };

  const template = templates[templateId];
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json(template);
});

export { router as enhancedPresentationsRouter };