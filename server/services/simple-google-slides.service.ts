import { google } from 'googleapis';

export interface SimpleGoogleSlidesResult {
  presentationId: string;
  editUrl: string;
  viewUrl: string;
  slideCount: number;
}

/**
 * Initialize Google Slides API client
 */
function initializeAuth() {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required');
    }

    const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: [
        'https://www.googleapis.com/auth/presentations',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    return auth;
  } catch (error) {
    console.error('Failed to initialize Google auth:', error);
    throw new Error('Google API configuration error');
  }
}

/**
 * Create a simple Google Slides presentation
 * @param title Presentation title
 * @param slides Array of slide content
 * @returns Google Slides result with URLs and metadata
 */
export async function createSimpleGooglePresentation(
  title: string,
  slides: any[]
): Promise<SimpleGoogleSlidesResult> {
  try {
    console.log(`Creating Google Slides presentation: "${title}" with ${slides.length} slides`);

    const auth = await initializeAuth().getClient();
    const slidesApi = google.slides({ version: 'v1', auth: auth });
    const drive = google.drive({ version: 'v3', auth: auth });

    // Create the presentation
    const createResponse = await slidesApi.presentations.create({
      requestBody: {
        title: title,
      },
    });

    const presentationId = createResponse.data.presentationId!;
    console.log(`Created presentation with ID: ${presentationId}`);

    // Get the presentation to find proper element IDs
    const presentationData = await slidesApi.presentations.get({
      presentationId,
    });

    const defaultSlide = presentationData.data.slides![0];
    
    // Build requests for slide creation and content
    const requests: any[] = [];
    
    // First, delete the default slide and create our custom slides
    requests.push({
      deleteObject: {
        objectId: defaultSlide.objectId
      }
    });

    // Create slides for each piece of content
    for (let i = 0; i < slides.length && i < 10; i++) {
      const slideId = `slide_${i}_${Date.now()}`;
      
      requests.push({
        createSlide: {
          objectId: slideId,
          insertionIndex: i,
          slideLayoutReference: {
            predefinedLayout: i === 0 ? 'TITLE_ONLY' : 'TITLE_AND_BODY'
          }
        }
      });
    }

    // Execute slide creation first
    if (requests.length > 0) {
      await slidesApi.presentations.batchUpdate({
        presentationId,
        requestBody: {
          requests
        }
      });
    }

    // Now get the updated presentation to add content to the newly created slides
    const updatedPresentation = await slidesApi.presentations.get({
      presentationId,
    });

    const actualSlides = updatedPresentation.data.slides || [];
    const contentRequests: any[] = [];

    // Add content to each slide
    for (let i = 0; i < slides.length && i < actualSlides.length; i++) {
      const slide = slides[i];
      const slideData = actualSlides[i];
      
      if (!slideData.pageElements) continue;

      // Find text boxes in the slide
      let titleElementId = '';
      let bodyElementId = '';
      
      for (const element of slideData.pageElements) {
        if (element.shape?.shapeType === 'TEXT_BOX') {
          if (!titleElementId) {
            titleElementId = element.objectId || '';
          } else if (!bodyElementId) {
            bodyElementId = element.objectId || '';
          }
        }
      }

      // Insert title
      if (titleElementId && slide.title) {
        contentRequests.push({
          insertText: {
            objectId: titleElementId,
            text: slide.title,
            insertionIndex: 0
          }
        });
      }

      // Insert content
      if (bodyElementId && (slide.content || slide.key_points || slide.notes)) {
        let content = slide.content || slide.key_points?.join('\n• ') || slide.notes || '';
        if (slide.key_points && !slide.content) {
          content = '• ' + content;
        }
        
        contentRequests.push({
          insertText: {
            objectId: bodyElementId,
            text: content,
            insertionIndex: 0
          }
        });
      }
    }

    // Apply content updates
    if (contentRequests.length > 0) {
      await slidesApi.presentations.batchUpdate({
        presentationId,
        requestBody: {
          requests: contentRequests
        }
      });
    }

    // Make presentation publicly viewable
    await drive.permissions.create({
      fileId: presentationId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    const editUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
    const viewUrl = `https://docs.google.com/presentation/d/${presentationId}/preview`;

    console.log(`Presentation created successfully. Edit URL: ${editUrl}`);

    return {
      presentationId,
      editUrl,
      viewUrl,
      slideCount: slides.length
    };

  } catch (error) {
    console.error('Error creating Google Slides presentation:', error);
    throw new Error(`Failed to create presentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Google Slides API configuration
 * @returns Configuration status
 */
export function validateConfig(): { valid: boolean; error?: string } {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return { valid: false, error: 'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is missing' };
    }

    JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid GOOGLE_SERVICE_ACCOUNT_KEY format' };
  }
}