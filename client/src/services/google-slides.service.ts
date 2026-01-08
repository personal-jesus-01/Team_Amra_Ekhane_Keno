import { apiRequest } from '../lib/queryClient';

export interface GoogleSlidesOptions {
  numberOfSlides?: number;
  audience?: 'general' | 'executive' | 'technical' | 'sales' | 'educational';
  tone?: 'professional' | 'conversational' | 'enthusiastic' | 'technical';
  presentationType?: 'business' | 'academic' | 'creative' | 'technical';
  theme?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
}

export interface GeneratedSlide {
  slide_number: number;
  slide_type: 'title' | 'section' | 'content' | 'quote' | 'conclusion';
  title: string;
  content: string;
  speaker_notes?: string;
  suggested_visuals?: string;
}

export interface GoogleSlidesResult {
  success: boolean;
  title: string;
  slideCount: number;
  slides: GeneratedSlide[];
  googleSlides?: {
    presentationId: string;
    editUrl: string;
    viewUrl: string;
    embedUrl: string;
    title: string;
  };
  message: string;
}

// Generate presentation with Google Slides from prompt
export async function generatePresentationWithGoogleSlides(
  title: string,
  prompt: string,
  options: GoogleSlidesOptions = {}
): Promise<GoogleSlidesResult> {
  try {
    const response = await apiRequest('POST', '/api/google-slides/generate', {
      title,
      prompt,
      ...options
    });

    return await response.json();
  } catch (error) {
    console.error('Error generating presentation with Google Slides:', error);
    throw new Error('Failed to generate presentation with Google Slides');
  }
}

// Generate presentation from uploaded document
export async function generatePresentationFromDocument(
  title: string,
  file: File,
  options: GoogleSlidesOptions = {}
): Promise<GoogleSlidesResult> {
  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    
    // Add options to form data
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });

    const response = await apiRequest('POST', '/api/google-slides/from-document', formData, {
      isFormData: true
    });

    return await response.json();
  } catch (error) {
    console.error('Error generating presentation from document:', error);
    throw new Error('Failed to generate presentation from document');
  }
}

// Create Google Slides from existing slide content
export async function createGoogleSlidesFromContent(
  title: string,
  slides: GeneratedSlide[],
  theme: GoogleSlidesOptions['theme'] = {}
): Promise<{
  success: boolean;
  googleSlides: {
    presentationId: string;
    editUrl: string;
    viewUrl: string;
    embedUrl: string;
    title: string;
  };
  message: string;
}> {
  try {
    const response = await apiRequest('POST', '/api/google-slides/create-slides', {
      title,
      slides,
      theme
    });

    return await response.json();
  } catch (error) {
    console.error('Error creating Google Slides from content:', error);
    throw new Error('Failed to create Google Slides presentation');
  }
}

// Get presentation information
export async function getPresentationInfo(presentationId: string): Promise<{
  presentationId: string;
  editUrl: string;
  viewUrl: string;
  embedUrl: string;
}> {
  try {
    const response = await apiRequest('GET', `/api/google-slides/${presentationId}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting presentation info:', error);
    throw new Error('Failed to get presentation information');
  }
}