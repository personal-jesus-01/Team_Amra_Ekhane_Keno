import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Service account authentication
let auth: JWT | null = null;

function initializeAuth() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.warn('Google Slides API: No service account key provided');
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
    return auth;
  } catch (error) {
    console.error('Failed to initialize Google Slides auth:', error);
    return null;
  }
}

// Create presentation with reliable content insertion
export async function createSimplePresentation(title: string, slideContents: any[]) {
  const authClient = initializeAuth();
  if (!authClient) {
    // Return a working mock response for development
    const presentationId = `dev_presentation_${Date.now()}`;
    return {
      presentationId,
      editUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      viewUrl: `https://docs.google.com/presentation/d/${presentationId}/preview`,
      title,
      slideCount: slideContents.length,
      status: 'created_in_development_mode'
    };
  }

  try {
    console.log(`Creating presentation: "${title}" with ${slideContents.length} slides`);
    
    const slides = google.slides({ version: 'v1', auth: authClient });
    const drive = google.drive({ version: 'v3', auth: authClient });

    // Create the presentation
    const createResponse = await slides.presentations.create({
      requestBody: {
        title: title
      }
    });

    const presentationId = createResponse.data.presentationId!;
    console.log('Created presentation:', presentationId);

    // Get the presentation structure
    const presentationData = await slides.presentations.get({
      presentationId: presentationId
    });

    const existingSlides = presentationData.data.slides || [];
    const requests: any[] = [];

    // Add additional slides if needed
    for (let i = 1; i < slideContents.length; i++) {
      requests.push({
        createSlide: {
          objectId: `slide_${i}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          slideLayoutReference: {
            predefinedLayout: 'BLANK'
          }
        }
      });
    }

    // Execute slide creation if needed
    if (requests.length > 0) {
      await slides.presentations.batchUpdate({
        presentationId: presentationId,
        requestBody: {
          requests: requests
        }
      });
    }

    // Get updated presentation data
    const updatedPresentationData = await slides.presentations.get({
      presentationId: presentationId
    });

    const allSlides = updatedPresentationData.data.slides || [];

    // Add content to slides using simple text insertion
    const contentRequests: any[] = [];

    for (let i = 0; i < slideContents.length && i < allSlides.length; i++) {
      const slideContent = slideContents[i];
      const slideId = allSlides[i].objectId!;

      // Combine title and content into a single text block for reliability
      let fullContent = '';
      if (slideContent.title) {
        fullContent += slideContent.title + '\n\n';
      }
      if (slideContent.content) {
        let textContent = slideContent.content;
        if (Array.isArray(textContent)) {
          textContent = textContent.join('\n\n');
        }
        fullContent += String(textContent);
      }

      if (fullContent.trim()) {
        const textElementId = `text_${i}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        
        // Create a single text box with all content
        contentRequests.push({
          createShape: {
            objectId: textElementId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                height: { magnitude: 500, unit: 'PT' },
                width: { magnitude: 700, unit: 'PT' }
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

        // Insert the content
        contentRequests.push({
          insertText: {
            objectId: textElementId,
            text: fullContent,
            insertionIndex: 0
          }
        });
      }
    }

    // Execute content creation
    if (contentRequests.length > 0) {
      console.log('Adding content to slides...');
      await slides.presentations.batchUpdate({
        presentationId: presentationId,
        requestBody: {
          requests: contentRequests
        }
      });
      console.log('Content added successfully');
    }

    // Make presentation publicly viewable
    try {
      await drive.permissions.create({
        fileId: presentationId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
    } catch (error) {
      console.warn('Could not make presentation public:', error);
    }

    return {
      presentationId,
      editUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      viewUrl: `https://docs.google.com/presentation/d/${presentationId}/preview`,
      title,
      slideCount: slideContents.length,
      status: 'created_successfully'
    };

  } catch (error) {
    console.error('Error creating Google Slides presentation:', error);
    throw new Error('Failed to create presentation');
  }
}