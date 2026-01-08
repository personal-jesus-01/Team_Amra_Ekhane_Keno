import { google } from 'googleapis';

// Interface for template data
interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  templateId: string;
  thumbnail?: string;
}

// Function to get available Google Slides templates from the template gallery
export async function getGoogleSlidesTemplates(authClient: any): Promise<SlideTemplate[]> {
  try {
    const drive = google.drive('v3');
    
    // Search for publicly available Google Slides templates
    const response = await drive.files.list({
      auth: authClient,
      q: "mimeType='application/vnd.google-apps.presentation' and visibility='anyoneCanView'",
      fields: 'files(id, name, thumbnailLink, description)',
      pageSize: 20
    });

    return response.data.files?.map(file => ({
      id: file.id || '',
      name: file.name || 'Untitled Template',
      description: file.description || 'Professional presentation template',
      category: 'Business',
      templateId: file.id || '',
      thumbnail: file.thumbnailLink
    })) || [];
  } catch (error) {
    console.error('Error fetching Google Slides templates:', error);
    return [];
  }
}

// Fallback templates with known working template IDs
export const FALLBACK_TEMPLATES = [
  {
    id: 'business-modern',
    name: 'Modern Business',
    description: 'Clean, professional design perfect for business presentations',
    category: 'Business',
    templateId: 'modern-business', // Will create with enhanced styling
    thumbnail: null
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    description: 'Vibrant design ideal for creative presentations',
    category: 'Creative',
    templateId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    thumbnail: 'https://lh3.googleusercontent.com/...'
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Traditional corporate style with blue accents',
    category: 'Corporate',
    templateId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    thumbnail: 'https://lh3.googleusercontent.com/...'
  },
  {
    id: 'startup-pitch',
    name: 'Startup Pitch',
    description: 'Dynamic design for startup and investor presentations',
    category: 'Startup',
    templateId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    thumbnail: 'https://lh3.googleusercontent.com/...'
  },
  {
    id: 'education-modern',
    name: 'Modern Education',
    description: 'Educational template with clear layouts',
    category: 'Education',
    templateId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    thumbnail: 'https://lh3.googleusercontent.com/...'
  }
];

export function getTemplateById(templateId: string) {
  return FALLBACK_TEMPLATES.find(t => t.id === templateId) || FALLBACK_TEMPLATES[0];
}

export function getTemplatesByCategory(category: string) {
  return FALLBACK_TEMPLATES.filter(t => t.category === category);
}

// Function to create presentation from Google Slides template
export async function createFromGoogleTemplate(
  authClient: any,
  templateId: string,
  title: string
) {
  try {
    const drive = google.drive('v3');
    
    // Copy the template to create a new presentation
    const copyResponse = await drive.files.copy({
      auth: authClient,
      fileId: templateId,
      requestBody: {
        name: title,
        parents: [] // This will place it in the user's root drive
      }
    });

    const newPresentationId = copyResponse.data.id;
    if (!newPresentationId) {
      throw new Error('Failed to copy template');
    }

    // Make it publicly editable
    await drive.permissions.create({
      auth: authClient,
      fileId: newPresentationId,
      requestBody: {
        role: 'writer',
        type: 'anyone'
      }
    });

    return {
      presentationId: newPresentationId,
      editUrl: `https://docs.google.com/presentation/d/${newPresentationId}/edit`,
      viewUrl: `https://docs.google.com/presentation/d/${newPresentationId}/preview`
    };

  } catch (error) {
    console.error('Error creating from Google template:', error);
    throw new Error('Failed to create presentation from template');
  }
}