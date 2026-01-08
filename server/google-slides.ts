import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { Request, Response } from 'express';
import { requireAuth } from './auth';
import { SLIDE_TEMPLATES, getTemplateById, SlideTemplate } from './templates/slide-templates';

// Initialize Google Slides API
const slides = google.slides('v1');

// Service account authentication
let auth: JWT | null = null;

function initializeAuth() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.warn('Google Slides API: No service account key provided - using development mode');
    return null;
  }

  try {
    const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    auth = new JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: [
        'https://www.googleapis.com/auth/presentations',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });
    
    console.log('Google Slides API authentication initialized successfully');
    console.log('Service account email:', serviceAccountKey.client_email);
    return auth;
  } catch (error) {
    console.error('Failed to initialize Google Slides auth:', error);
    console.error('GOOGLE_SERVICE_ACCOUNT_KEY format error - check JSON validity');
    return null;
  }
}

// Development mode fallback for Google Slides creation
function createMockGoogleSlidesResponse(title: string, slideCount: number) {
  const presentationId = `mock_presentation_${Date.now()}`;
  return {
    presentationId,
    editUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    publishUrl: `https://docs.google.com/presentation/d/${presentationId}/pub`,
    title,
    slideCount,
    status: 'created_in_development_mode'
  };
}

// Create a new presentation
export async function createPresentation(title: string, slideContents: any[]) {
  const authClient = initializeAuth();
  if (!authClient) {
    throw new Error('Google Slides API requires valid service account credentials. Please configure GOOGLE_SERVICE_ACCOUNT_KEY.');
  }

  try {
    // Create the presentation
    const presentation = await slides.presentations.create({
      auth: authClient,
      requestBody: {
        title: title
      }
    });

    const presentationId = presentation.data.presentationId;
    if (!presentationId) {
      throw new Error('Failed to create presentation');
    }

    // Get the default slide ID to replace it
    const existingPresentation = await slides.presentations.get({
      auth: authClient,
      presentationId: presentationId
    });

    const defaultSlideId = existingPresentation.data.slides?.[0]?.objectId;

    // Prepare batch update requests
    const requests: any[] = [];

    // Delete the default slide and create our own slides
    if (defaultSlideId) {
      requests.push({
        deleteObject: {
          objectId: defaultSlideId
        }
      });
    }

    // Create all slides with content
    for (let i = 0; i < slideContents.length; i++) {
      const slideContent = slideContents[i];
      
      // Create new slide
      const slideId = `slide_${i}_${Date.now()}`;
      
      requests.push({
        createSlide: {
          objectId: slideId,
          slideLayoutReference: {
            predefinedLayout: getLayoutType(slideContent.slide_type)
          }
        }
      });

      // Wait for slide creation, then add text elements
      const titleElementId = `title_element_${i}_${Date.now()}`;
      const bodyElementId = `body_element_${i}_${Date.now()}`;
      
      // Create title text box
      requests.push({
        createShape: {
          objectId: titleElementId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              height: { magnitude: 60, unit: 'PT' },
              width: { magnitude: 600, unit: 'PT' }
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 50,
              translateY: 50,
              unit: 'PT'
            }
          }
        }
      });

      // Insert title text
      requests.push({
        insertText: {
          objectId: titleElementId,
          text: slideContent.title || 'Untitled Slide',
          insertionIndex: 0
        }
      });

      if (slideContent.content) {
        // Use OpenAI content exactly as generated
        let textContent = slideContent.content;
        if (Array.isArray(textContent)) {
          textContent = textContent.join('\n');
        }
        textContent = String(textContent);
        
        // Create content text box
        requests.push({
          createShape: {
            objectId: bodyElementId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                height: { magnitude: 300, unit: 'PT' },
                width: { magnitude: 600, unit: 'PT' }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 50,
                translateY: 120,
                unit: 'PT'
              }
            }
          }
        });

        // Insert body text
        requests.push({
          insertText: {
            objectId: bodyElementId,
            text: textContent,
            insertionIndex: 0
          }
        });
      }
    }

    // Execute batch update
    if (requests.length > 0) {
      await slides.presentations.batchUpdate({
        auth: authClient,
        presentationId: presentationId,
        requestBody: {
          requests: requests
        }
      });
    }

    // Make the presentation publicly viewable and editable
    const drive = google.drive('v3');
    await drive.permissions.create({
      auth: authClient,
      fileId: presentationId,
      requestBody: {
        role: 'writer',
        type: 'anyone'
      }
    });

    console.log(`Presentation created successfully: ${presentationId}`);

    return {
      presentationId,
      editUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      viewUrl: `https://docs.google.com/presentation/d/${presentationId}/preview`,
      title: title
    };

  } catch (error) {
    console.error('Error creating Google Slides presentation:', error);
    throw new Error('Failed to create presentation with Google Slides API');
  }
}

// Map slide types to Google Slides layouts
function getLayoutType(slideType: string) {
  switch (slideType) {
    case 'title':
      return 'TITLE';
    case 'section':
      return 'SECTION_HEADER';
    case 'content':
      return 'TITLE_AND_BODY';
    case 'quote':
      return 'TITLE_AND_BODY';
    case 'conclusion':
      return 'TITLE_AND_BODY';
    default:
      return 'TITLE_AND_BODY';
  }
}

// Enhanced slide creation with professional templates
export async function createEnhancedPresentation(
  title: string, 
  slideContents: any[], 
  options: {
    templateId?: string;
    theme?: string;
    backgroundColor?: string;
    textColor?: string;
  } = {}
) {
  const authClient = initializeAuth();
  if (!authClient) {
    console.error('Google Slides API not configured - missing service account key');
    return createMockGoogleSlidesResponse(title, slideContents.length);
  }

  console.log(`Creating Google Slides presentation: "${title}" with ${slideContents.length} slides`);

  try {
    console.log('Creating presentation via Google Slides API...');
    
    // Create presentation with modern business template by default
    const presentation = await slides.presentations.create({
      auth: authClient,
      requestBody: {
        title: title
      }
    });

    console.log('Presentation created successfully:', presentation.data.presentationId);

    const presentationId = presentation.data.presentationId;
    if (!presentationId) {
      throw new Error('Failed to create presentation');
    }

    const requests: any[] = [];

    // Remove the default blank slide first, then create slides for our content
    const deleteRequests = [];
    const createRequests = [];
    
    // Get the default slide to delete it
    const initialPresentation = await slides.presentations.get({
      auth: authClient,
      presentationId: presentationId
    });
    
    const defaultSlides = initialPresentation.data.slides || [];
    if (defaultSlides.length > 0) {
      deleteRequests.push({
        deleteObject: {
          objectId: defaultSlides[0].objectId
        }
      });
    }
    
    // Create slides for each piece of content (avoiding duplication)
    for (let i = 0; i < slideContents.length; i++) {
      const slideContent = slideContents[i];
      const slideId = `slide_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      createRequests.push({
        createSlide: {
          objectId: slideId,
          slideLayoutReference: {
            predefinedLayout: getLayoutType(slideContent.slide_type)
          }
        }
      });
    }
    
    // Combine delete and create requests
    requests.push(...deleteRequests, ...createRequests);

    // Execute initial batch update to create slides
    if (requests.length > 0) {
      await slides.presentations.batchUpdate({
        auth: authClient,
        presentationId: presentationId,
        requestBody: {
          requests: requests
        }
      });
    }

    // Get the updated presentation to work with actual slide IDs
    const updatedPresentation = await slides.presentations.get({
      auth: authClient,
      presentationId: presentationId
    });

    const actualSlides = updatedPresentation.data.slides || [];
    const contentRequests: any[] = [];

    // Add content directly to each slide by creating text boxes
    console.log(`Processing ${slideContents.length} slides with ${actualSlides.length} actual slides`);
    
    for (let i = 0; i < slideContents.length && i < actualSlides.length; i++) {
      const slideContent = slideContents[i];
      const slide = actualSlides[i];
      const slideId = slide.objectId;
      
      console.log(`Slide ${i + 1}: Title="${slideContent.title}", Content length=${slideContent.content?.length || 0}`);
      
      if (!slideId) continue;

      // Create title text box
      if (slideContent.title) {
        const titleElementId = `title_${i}_${Date.now()}`;
        
        contentRequests.push({
          createShape: {
            objectId: titleElementId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                height: { magnitude: 80, unit: 'PT' },
                width: { magnitude: 640, unit: 'PT' }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 40,
                translateY: 40,
                unit: 'PT'
              }
            }
          }
        });

        contentRequests.push({
          insertText: {
            objectId: titleElementId,
            text: slideContent.title,
            insertionIndex: 0
          }
        });

        // Style the title text
        contentRequests.push({
          updateTextStyle: {
            objectId: titleElementId,
            style: {
              bold: true,
              fontSize: { magnitude: 32, unit: 'PT' },
              foregroundColor: {
                opaqueColor: { rgbColor: { red: 0.2, green: 0.2, blue: 0.2 } }
              }
            },
            textRange: { type: 'ALL' },
            fields: 'bold,fontSize,foregroundColor'
          }
        });
      }

      // Create content text box  
      if (slideContent.content) {
        let textContent = slideContent.content;
        if (Array.isArray(textContent)) {
          textContent = textContent.join('\n\n');
        }
        textContent = String(textContent);

        const bodyElementId = `body_${i}_${Date.now()}`;
        
        contentRequests.push({
          createShape: {
            objectId: bodyElementId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                height: { magnitude: 400, unit: 'PT' },
                width: { magnitude: 640, unit: 'PT' }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 40,
                translateY: 140,
                unit: 'PT'
              }
            }
          }
        });

        contentRequests.push({
          insertText: {
            objectId: bodyElementId,
            text: textContent,
            insertionIndex: 0
          }
        });

        // Style the body text
        contentRequests.push({
          updateTextStyle: {
            objectId: bodyElementId,
            style: {
              fontSize: { magnitude: 16, unit: 'PT' },
              foregroundColor: {
                opaqueColor: { rgbColor: { red: 0.3, green: 0.3, blue: 0.3 } }
              }
            },
            textRange: { type: 'ALL' },
            fields: 'fontSize,foregroundColor'
          }
        });

        console.log(`Added content for slide ${i + 1}: "${textContent.substring(0, 100)}..."`);
      }
    }

    console.log(`Total content requests: ${contentRequests.length}`);

    // Execute content updates
    if (contentRequests.length > 0) {
      await slides.presentations.batchUpdate({
        auth: authClient,
        presentationId: presentationId,
        requestBody: {
          requests: contentRequests
        }
      });
    }

    // Make the presentation publicly viewable
    const drive = google.drive('v3');
    await drive.permissions.create({
      auth: authClient,
      fileId: presentationId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    return {
      presentationId,
      editUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      viewUrl: `https://docs.google.com/presentation/d/${presentationId}/preview`,
      embedUrl: `https://docs.google.com/presentation/d/${presentationId}/embed`,
      title: title
    };

  } catch (error) {
    console.error('Error creating enhanced Google Slides presentation:', error);
    throw new Error('Failed to create enhanced presentation');
  }
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    red: parseInt(result[1], 16) / 255,
    green: parseInt(result[2], 16) / 255,
    blue: parseInt(result[3], 16) / 255
  } : { red: 1, green: 1, blue: 1 };
}

// Setup Google Slides routes
export function setupGoogleSlidesRoutes(app: any) {
  // Import required functions
  const { generatePresentationSlides } = require('./openai');
  const { extractTextFromDocument } = require('./ocr');
  const { storage } = require('./storage');
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage() });

  // Create presentation from form data (PDF + prompt)
  app.post('/api/google-slides/create', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const { title, prompt, audience, tone, slides } = req.body;
      const file = req.file;
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      if (!prompt && !file) {
        return res.status(400).json({ error: 'Either prompt or PDF file is required' });
      }

      console.log(`Creating Google Slides presentation: "${title}"`);

      // Extract text from PDF if provided
      let pdfContent = '';
      if (file) {
        console.log('Extracting text from uploaded PDF...');
        pdfContent = await extractTextFromDocument(file.buffer, file.mimetype);
      }

      // Generate slide content using AI
      console.log('Generating slide content with AI...');
      const slideContents = await generatePresentationSlides(
        prompt,
        parseInt(slides) || 10,
        1, // design variants
        [], // brand colors
        'professional', // style
        {
          audience: audience || 'general',
          tone: tone || 'professional',
          pdfKnowledgeBase: pdfContent
        }
      );

      // Create Google Slides presentation
      console.log('Creating Google Slides presentation...');
      const result = await createEnhancedPresentation(title, slideContents, {
        templateId: 'modern-business'
      });

      // Create presentation record in database
      console.log('Saving presentation to database...');
      console.log('Slide contents length:', slideContents.length);
      const presentation = await storage.createPresentation({
        title: title,
        owner_id: req.user!.id,
        status: 'published',
        external_url: result.editUrl,
        slides_count: slideContents.length
      });
      console.log('Presentation saved to database with ID:', presentation.id);
      console.log('Saved slides_count:', presentation.slides_count);

      // Slide records are created by the Google Slides controller, not here
      // to avoid duplication

      console.log(`Google Slides presentation created successfully: ${result.presentationId}`);
      console.log(`Database presentation saved with ID: ${presentation.id}`);

      res.json({
        success: true,
        title: title,
        presentationId: result.presentationId,
        editUrl: result.editUrl,
        databaseId: presentation.id
      });
    } catch (error) {
      console.error('Error in Google Slides creation:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to create presentation' 
      });
    }
  });

  // Create presentation from AI-generated content (legacy endpoint)
  app.post('/api/google-slides/create-from-slides', requireAuth, async (req: Request, res: Response) => {
    try {
      const { title, slideContents, options = {} } = req.body;
      
      if (!title || !slideContents || !Array.isArray(slideContents)) {
        return res.status(400).json({ 
          error: 'Title and slideContents array are required' 
        });
      }

      const result = await createEnhancedPresentation(title, slideContents, options);
      res.json(result);
    } catch (error) {
      console.error('Error in Google Slides creation:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to create presentation' 
      });
    }
  });

  // Get presentation info
  app.get('/api/google-slides/:presentationId', requireAuth, async (req: Request, res: Response) => {
    try {
      const { presentationId } = req.params;
      const authClient = initializeAuth();
      
      if (!authClient) {
        return res.status(500).json({ error: 'Google Slides API not configured' });
      }

      const presentation = await slides.presentations.get({
        auth: authClient,
        presentationId: presentationId
      });

      res.json({
        title: presentation.data.title,
        slideCount: presentation.data.slides?.length || 0,
        editUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
        viewUrl: `https://docs.google.com/presentation/d/${presentationId}/preview`
      });
    } catch (error) {
      console.error('Error getting Google Slides presentation:', error);
      res.status(500).json({ 
        error: 'Failed to get presentation info' 
      });
    }
  });
}