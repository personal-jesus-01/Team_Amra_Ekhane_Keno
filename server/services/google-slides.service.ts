import { google } from 'googleapis';
import { SlideContent } from './presentation.service';

interface GoogleSlidesCreateOptions {
  templateId?: string;
}

interface GoogleSlidesResult {
  presentationId: string;
  editUrl: string;
  viewUrl: string;
  slideCount: number;
}

/**
 * Initialize Google Slides API client
 */
function initializeGoogleSlidesClient() {
  try {
    const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
    
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: [
        'https://www.googleapis.com/auth/presentations',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    return google.slides({ version: 'v1', auth });
  } catch (error) {
    console.error('Failed to initialize Google Slides client:', error);
    throw new Error('Google Slides API configuration error');
  }
}

/**
 * Create a Google Slides presentation from slide content
 * @param title Presentation title
 * @param slides Array of slide content
 * @param options Creation options including template
 * @returns Google Slides result with URLs and metadata
 */
export async function createGoogleSlidesPresentation(
  title: string,
  slides: SlideContent[],
  options: GoogleSlidesCreateOptions = {}
): Promise<GoogleSlidesResult> {
  try {
    console.log(`Creating Google Slides presentation: "${title}" with ${slides.length} slides`);

    const slidesApi = initializeGoogleSlidesClient();
    
    // Get the auth client from the slides API instance
    const authClient = await slidesApi.auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });

    // Create the presentation
    const createResponse = await slidesApi.presentations.create({
      requestBody: {
        title: title,
      },
    });

    const presentationId = createResponse.data.presentationId!;
    console.log(`Created presentation with ID: ${presentationId}`);

    // Get the default slide ID to remove it later
    const presentation = await slidesApi.presentations.get({
      presentationId,
    });

    const defaultSlideId = presentation.data.slides?.[0]?.objectId;

    // Prepare batch requests for all slides
    const requests: any[] = [];

    // Add slides (except the first one since it already exists)
    for (let i = 1; i < slides.length; i++) {
      requests.push({
        createSlide: {
          objectId: `slide_${i}`,
          insertionIndex: i,
          slideLayoutReference: {
            predefinedLayout: getLayoutForSlideType(slides[i].slide_type)
          }
        }
      });
    }

    // Update the first slide (replace default)
    if (slides.length > 0 && defaultSlideId) {
      const firstSlide = slides[0];
      requests.push({
        replaceAllText: {
          containsText: {
            text: '{{title}}',
            matchCase: false
          },
          replaceText: firstSlide.title
        }
      });

      // Add content to title slide
      requests.push({
        insertText: {
          objectId: defaultSlideId,
          insertionIndex: 0,
          text: firstSlide.content
        }
      });
    }

    // Add content to all slides
    slides.forEach((slide, index) => {
      const slideId = index === 0 ? defaultSlideId : `slide_${index}`;
      
      // Add slide title
      requests.push({
        insertText: {
          objectId: slideId,
          insertionIndex: 0,
          text: slide.title
        }
      });

      // Add slide content
      if (slide.content) {
        requests.push({
          insertText: {
            objectId: slideId,
            insertionIndex: slide.title.length + 1,
            text: `\n\n${slide.content}`
          }
        });
      }

      // Add speaker notes if available
      if (slide.speaker_notes) {
        requests.push({
          createParagraphBullets: {
            objectId: slideId,
            textRange: {
              startIndex: 0,
              endIndex: slide.speaker_notes.length
            }
          }
        });
      }
    });

    // Apply template styling if specified
    if (options.templateId) {
      const templateRequests = getTemplateStyleRequests(options.templateId);
      requests.push(...templateRequests);
    }

    // Execute all requests in batch
    if (requests.length > 0) {
      await slidesApi.presentations.batchUpdate({
        presentationId,
        requestBody: {
          requests
        }
      });
    }

    // Set presentation to be editable
    await drive.permissions.create({
      fileId: presentationId,
      requestBody: {
        role: 'writer',
        type: 'anyone'
      }
    });

    // Generate URLs
    const editUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
    const viewUrl = `https://docs.google.com/presentation/d/${presentationId}/preview`;

    console.log(`Successfully created Google Slides presentation with ${slides.length} slides`);

    return {
      presentationId,
      editUrl,
      viewUrl,
      slideCount: slides.length
    };

  } catch (error) {
    console.error('Error creating Google Slides presentation:', error);
    throw new Error('Failed to create Google Slides presentation');
  }
}

/**
 * Get appropriate layout for slide type
 * @param slideType Type of slide
 * @returns Google Slides layout type
 */
function getLayoutForSlideType(slideType: string): string {
  switch (slideType.toLowerCase()) {
    case 'title':
      return 'TITLE_AND_BODY';
    case 'content':
      return 'TITLE_AND_BODY';
    case 'section':
      return 'SECTION_HEADER';
    case 'two_column':
      return 'TITLE_AND_TWO_COLUMNS';
    case 'image':
      return 'TITLE_ONLY';
    case 'chart':
      return 'TITLE_AND_BODY';
    default:
      return 'TITLE_AND_BODY';
  }
}

/**
 * Get template-specific styling requests
 * @param templateId Template identifier
 * @returns Array of Google Slides API requests for styling
 */
function getTemplateStyleRequests(templateId: string): any[] {
  const requests: any[] = [];

  switch (templateId) {
    case 'modern-business':
      requests.push({
        updatePageProperties: {
          objectId: 'master',
          pageProperties: {
            colorScheme: {
              colors: [
                { type: 'THEME_COLOR_TYPE1', color: { rgbColor: { red: 0.118, green: 0.251, blue: 0.686 } } },
                { type: 'THEME_COLOR_TYPE2', color: { rgbColor: { red: 0.231, green: 0.510, blue: 0.961 } } }
              ]
            }
          },
          fields: 'colorScheme'
        }
      });
      break;

    case 'creative-portfolio':
      requests.push({
        updatePageProperties: {
          objectId: 'master',
          pageProperties: {
            colorScheme: {
              colors: [
                { type: 'THEME_COLOR_TYPE1', color: { rgbColor: { red: 0.486, green: 0.227, blue: 0.929 } } },
                { type: 'THEME_COLOR_TYPE2', color: { rgbColor: { red: 0.659, green: 0.333, blue: 0.969 } } }
              ]
            }
          },
          fields: 'colorScheme'
        }
      });
      break;

    case 'corporate-blue':
      requests.push({
        updatePageProperties: {
          objectId: 'master',
          pageProperties: {
            colorScheme: {
              colors: [
                { type: 'THEME_COLOR_TYPE1', color: { rgbColor: { red: 0.118, green: 0.227, blue: 0.541 } } },
                { type: 'THEME_COLOR_TYPE2', color: { rgbColor: { red: 0.231, green: 0.510, blue: 0.961 } } }
              ]
            }
          },
          fields: 'colorScheme'
        }
      });
      break;

    case 'startup-pitch':
      requests.push({
        updatePageProperties: {
          objectId: 'master',
          pageProperties: {
            colorScheme: {
              colors: [
                { type: 'THEME_COLOR_TYPE1', color: { rgbColor: { red: 0.020, green: 0.588, blue: 0.412 } } },
                { type: 'THEME_COLOR_TYPE2', color: { rgbColor: { red: 0.063, green: 0.725, blue: 0.506 } } }
              ]
            }
          },
          fields: 'colorScheme'
        }
      });
      break;
  }

  return requests;
}

/**
 * Validate Google Slides API configuration
 * @returns Configuration status
 */
export function validateGoogleSlidesConfig(): { valid: boolean; error?: string } {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return { valid: false, error: 'Google Service Account Key not configured' };
    }

    const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    
    if (!serviceAccountKey.client_email || !serviceAccountKey.private_key) {
      return { valid: false, error: 'Invalid Google Service Account Key format' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Failed to parse Google Service Account Key' };
  }
}