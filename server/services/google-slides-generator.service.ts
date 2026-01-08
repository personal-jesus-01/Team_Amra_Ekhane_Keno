import OpenAI from 'openai';
import { createEnhancedPresentation } from '../google-slides';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DetailedSlide {
  slide_number: number;
  slide_type: 'title' | 'section' | 'content' | 'quote' | 'conclusion';
  title: string;
  content: string;
  speaker_notes: string;
  suggested_visuals: string;
  background_color: string;
  layout_type: string;
}

/**
 * Generate complete slide content from outline and create Google Slides presentation
 */
export async function generatePresentationFromOutline(
  outline: any,
  presentationTitle: string,
  options: {
    templateId?: string;
    numberOfSlides?: number;
  } = {}
): Promise<{
  slides: DetailedSlide[];
  googleSlidesResult: any;
}> {
  try {
    // Step 1: Generate detailed slide content from outline
    const detailedSlides = await generateDetailedSlidesFromOutline(outline, presentationTitle, options);
    
    // Step 2: Create Google Slides presentation
    const googleSlidesResult = await createGoogleSlidesFromContent(
      presentationTitle, 
      detailedSlides, 
      options.templateId || 'modern-business'
    );

    return {
      slides: detailedSlides,
      googleSlidesResult
    };
  } catch (error) {
    console.error('Error generating presentation from outline:', error);
    throw new Error('Failed to generate presentation from outline');
  }
}

/**
 * Convert outline into detailed slide content using AI
 */
async function generateDetailedSlidesFromOutline(
  outline: any,
  presentationTitle: string,
  options: { numberOfSlides?: number } = {}
): Promise<DetailedSlide[]> {
  try {
    const { numberOfSlides = outline.slides?.length || 8 } = options;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert presentation designer. Transform the provided outline into detailed, engaging slide content for a professional business presentation.

For each slide in the outline, create comprehensive content with:
- slide_number: Sequential number starting from 1
- slide_type: "title", "section", "content", "quote", or "conclusion"
- title: Clear, compelling slide title
- content: Detailed bullet points and explanations (as a string with \\n for line breaks)
- speaker_notes: What the presenter should say (3-4 sentences)
- suggested_visuals: Specific description of relevant images, charts, or graphics
- background_color: Professional hex color code
- layout_type: "title_slide", "two_column", "bullet_points", "image_with_text", or "full_text"

Make each slide substantial with meaningful content that expands on the outline points.
Use professional language and ensure logical flow between slides.

Respond with valid JSON: {"slides": [...]}`
        },
        {
          role: "user",
          content: `Presentation Title: ${presentationTitle}

Outline to expand into ${numberOfSlides} detailed slides:
${JSON.stringify(outline, null, 2)}

Create engaging, professional slide content with substantial detail for each slide.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.slides || !Array.isArray(result.slides)) {
      throw new Error('Invalid slide content generated');
    }

    // Ensure each slide has all required fields
    return result.slides.map((slide: any, index: number) => ({
      slide_number: slide.slide_number || index + 1,
      slide_type: slide.slide_type || 'content',
      title: slide.title || `Slide ${index + 1}`,
      content: slide.content || '',
      speaker_notes: slide.speaker_notes || '',
      suggested_visuals: slide.suggested_visuals || '',
      background_color: slide.background_color || '#ffffff',
      layout_type: slide.layout_type || 'bullet_points'
    }));
  } catch (error) {
    console.error('Error generating detailed slides:', error);
    throw new Error('Failed to generate detailed slides from outline');
  }
}

/**
 * Create Google Slides presentation from detailed content
 */
async function createGoogleSlidesFromContent(
  title: string,
  slides: DetailedSlide[],
  templateId: string
): Promise<any> {
  try {
    // Format slides for Google Slides API
    const formattedSlides = slides.map(slide => ({
      slide_type: slide.slide_type,
      title: slide.title,
      content: slide.content,
      background_color: slide.background_color,
      layout_type: slide.layout_type,
      speaker_notes: slide.speaker_notes
    }));

    // Create the presentation using Google Slides API
    const result = await createEnhancedPresentation(title, formattedSlides, {
      templateId,
      backgroundColor: '#ffffff',
      textColor: '#333333'
    });

    return {
      presentationId: result.presentationId,
      editUrl: result.editUrl,
      embedUrl: `https://docs.google.com/presentation/d/${result.presentationId}/embed`,
      previewUrl: `https://docs.google.com/presentation/d/${result.presentationId}/preview`
    };
  } catch (error) {
    console.error('Error creating Google Slides presentation:', error);
    throw new Error('Failed to create Google Slides presentation');
  }
}

/**
 * Generate slide content variations for design options
 */
export async function generateSlideVariations(
  baseSlide: DetailedSlide,
  variations: number = 3
): Promise<DetailedSlide[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Create ${variations} different variations of the provided slide content. 
          Each variation should have the same core message but different:
          - Presentation style (bullet points, paragraphs, quotes, etc.)
          - Visual approach
          - Emphasis and structure
          
          Maintain the same slide_number and slide_type. Return as JSON array.`
        },
        {
          role: "user",
          content: `Create ${variations} variations of this slide:
          ${JSON.stringify(baseSlide, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.variations || [baseSlide];
  } catch (error) {
    console.error('Error generating slide variations:', error);
    return [baseSlide]; // Return original slide if variations fail
  }
}