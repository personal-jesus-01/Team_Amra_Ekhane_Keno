import { Request, Response } from 'express';
import { createMockGooglePresentation } from '../services/mock-google-slides.service';
import { generatePresentationContent } from '../services/presentation.service';
import { extractTextFromDocument } from '../ocr';
import { storage } from '../storage.js';
import { createPresentation, createEnhancedPresentation } from '../google-slides';
import { createSimplePresentation } from '../google-slides-simple';

// Generate presentation with Google Slides integration
export async function generatePresentationWithGoogleSlides(req: Request, res: Response) {
  try {
    const { 
      title, 
      prompt, 
      numberOfSlides = 8,
      audience = 'general',
      tone = 'professional',
      presentationType = 'business',
      theme = {}
    } = req.body;

    if (!title || !prompt) {
      return res.status(400).json({ 
        error: 'Title and prompt are required' 
      });
    }

    // Generate presentation content using the service
    const slides = await generatePresentationContent(prompt, {
      numberOfSlides,
      audience: audience as any,
      tone: tone as any,
      presentationType: presentationType as any,
      includeImages: true
    });

    // Create Google Slides presentation with text replacement fix
    const googleSlidesResult = await createEnhancedPresentation(title, slides);

    // Save presentation to database if Google Slides was created
    let savedPresentation = null;
    if (googleSlidesResult) {
      savedPresentation = await storage.createPresentation({
        title: title,
        owner_id: req.user!.id,
        status: 'published',
        external_url: googleSlidesResult.editUrl,
        slides_count: slides.length
      });

      // Create slide records
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        await storage.createSlide({
          presentation_id: savedPresentation.id,
          slide_number: i + 1,
          content: slide.content || slide.title,
          background_color: '#ffffff'
        });
      }
    }

    res.json({
      success: true,
      title,
      slideCount: slides.length,
      slides: slides,
      googleSlides: googleSlidesResult,
      presentationId: savedPresentation?.id,
      message: googleSlidesResult 
        ? 'Presentation created successfully with Google Slides'
        : 'Presentation content generated (Google Slides creation unavailable)'
    });

  } catch (error) {
    console.error('Error generating presentation with Google Slides:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to generate presentation' 
    });
  }
}

// Generate presentation from uploaded document
export async function generateFromDocument(req: Request, res: Response) {
  try {
    const { 
      title,
      numberOfSlides = 10,
      audience = 'general',
      tone = 'professional',
      theme = {}
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Document file is required' });
    }

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Extract text from the uploaded document
    const documentText = await extractTextFromDocument(req.file.buffer, req.file.mimetype);
    
    if (!documentText || documentText.trim().length < 100) {
      return res.status(400).json({ 
        error: 'Could not extract sufficient text from the document. Please try a different file.' 
      });
    }

    // Generate presentation content from document text
    const slides = await generatePresentationContent(documentText, {
      numberOfSlides,
      audience: audience as any,
      tone: tone as any,
      presentationType: 'business',
      includeImages: true
    });

    // Create Google Slides presentation with text replacement fix
    const googleSlidesResult = await createEnhancedPresentation(title, slides);

    // Save presentation to database if Google Slides was created
    let savedPresentation = null;
    if (googleSlidesResult) {
      savedPresentation = await storage.createPresentation({
        title: title,
        owner_id: req.user!.id,
        status: 'published',
        external_url: googleSlidesResult.editUrl,
        slides_count: slides.length
      });

      // Create slide records
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        await storage.createSlide({
          presentation_id: savedPresentation.id,
          slide_number: i + 1,
          content: slide.content || slide.title,
          background_color: '#ffffff'
        });
      }
    }

    res.json({
      success: true,
      title,
      slideCount: slides.length,
      slides: slides,
      googleSlides: googleSlidesResult,
      editUrl: googleSlidesResult?.editUrl,
      presentationId: googleSlidesResult?.presentationId || savedPresentation?.id,
      extractedTextLength: documentText.length,
      message: googleSlidesResult 
        ? 'Presentation created successfully from document with Google Slides'
        : 'Presentation content generated from document (Google Slides creation unavailable)'
    });

  } catch (error) {
    console.error('Error generating presentation from document:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to generate presentation from document' 
    });
  }
}

// Create Google Slides from existing slide content
export async function createSlidesFromContent(req: Request, res: Response) {
  try {
    const { title, slides, templateId, formData } = req.body;

    console.log('Creating slides from content:', { title, slidesCount: slides?.length, templateId });

    if (!title || !slides || !Array.isArray(slides)) {
      return res.status(400).json({ 
        error: 'Title and slides array are required' 
      });
    }

    // Create Google Slides presentation using the simplified reliable service
    const result = await createSimplePresentation(title, slides);

    // Save presentation to database
    try {
      const presentationData = {
        title: title,
        description: formData?.description || 'AI-generated presentation',
        slides_count: slides.length,
        template_id: templateId || 'business-modern',
        owner_id: req.user!.id,
        external_url: result.editUrl,
        google_slides_id: result.presentationId,
        edit_url: result.editUrl,
        view_url: result.viewUrl || result.editUrl
      };

      const savedPresentation = await storage.createPresentation(presentationData);
      console.log('Presentation saved to database:', savedPresentation.id);

      // Also save individual slides
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const content = `${slide.title || `Slide ${i + 1}`}\n\n${slide.content || slide.key_points?.join('\n') || slide.notes || ''}`;
        await storage.createSlide({
          presentation_id: savedPresentation.id,
          slide_number: i + 1,
          content: content,
          background_color: slide.background_color || '#ffffff'
        });
      }

    } catch (dbError) {
      console.error('Error saving to database:', dbError);
      // Continue even if database save fails - user still gets Google Slides
    }

    res.json({
      success: true,
      googleSlides: result,
      editUrl: result?.editUrl,
      presentationId: result?.presentationId,
      slideCount: slides.length,
      message: 'Google Slides presentation created successfully'
    });

  } catch (error) {
    console.error('Error creating Google Slides from content:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create Google Slides presentation' 
    });
  }
}

// Get presentation status and URLs
export async function getPresentationInfo(req: Request, res: Response) {
  try {
    const { presentationId } = req.params;

    if (!presentationId) {
      return res.status(400).json({ error: 'Presentation ID is required' });
    }

    // Return the URLs for the presentation
    res.json({
      presentationId,
      editUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      viewUrl: `https://docs.google.com/presentation/d/${presentationId}/preview`,
      embedUrl: `https://docs.google.com/presentation/d/${presentationId}/embed`
    });

  } catch (error) {
    console.error('Error getting presentation info:', error);
    res.status(500).json({ 
      error: 'Failed to get presentation information' 
    });
  }
}