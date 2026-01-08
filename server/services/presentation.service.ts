import { generatePresentationSlides } from '../openai';

export interface GeneratePresentationOptions {
  numberOfSlides: number;
  audience: 'general' | 'executive' | 'technical' | 'sales' | 'educational' | 'business';
  tone: 'professional' | 'casual' | 'academic' | 'creative';
  presentationType: 'business' | 'academic' | 'corporate' | 'analytical' | 'historical';
  includeImages: boolean;
}

export interface SlideContent {
  title: string;
  content: string;
  slide_type: string;
  layout?: string;
  visual_elements?: string[];
  speaker_notes?: string;
}

/**
 * Generate enhanced presentation content using AI
 * @param prompt The enhanced prompt with all user requirements
 * @param options Generation options including audience, tone, etc.
 * @returns Array of slide content objects
 */
export async function generatePresentationContent(
  prompt: string, 
  options: GeneratePresentationOptions
): Promise<SlideContent[]> {
  try {
    console.log(`Generating presentation content for ${options.numberOfSlides} slides`);
    console.log(`Audience: ${options.audience}, Type: ${options.presentationType}`);

    // Use the OpenAI service to generate slides
    const slides = await generatePresentationSlides(
      prompt,
      options.numberOfSlides,
      1, // Single design variant for now
      undefined, // No specific brand colors
      options.tone
    );

    // Transform the OpenAI response to our expected format
    const transformedSlides: SlideContent[] = slides.map((slide: any, index: number) => ({
      title: slide.title || `Slide ${index + 1}`,
      content: slide.content || slide.bullet_points?.join('\n') || '',
      slide_type: slide.slide_type || (index === 0 ? 'title' : 'content'),
      layout: slide.layout_recommendation || 'default',
      visual_elements: slide.visual_suggestions || [],
      speaker_notes: slide.speaker_notes || ''
    }));

    console.log(`Successfully generated ${transformedSlides.length} slides`);
    return transformedSlides;

  } catch (error) {
    console.error('Error generating presentation content:', error);
    throw new Error('Failed to generate presentation content');
  }
}

/**
 * Validate presentation generation request
 * @param data Request data to validate
 * @returns Validation result
 */
export function validatePresentationRequest(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }

  if (!data.numberOfSlides || data.numberOfSlides < 5 || data.numberOfSlides > 50) {
    errors.push('Number of slides must be between 5 and 50');
  }

  const validTypes = ['Business', 'Academic', 'Corporate', 'Analytical', 'Historical'];
  if (!data.presentationType || !validTypes.includes(data.presentationType)) {
    errors.push('Invalid presentation type');
  }

  const validKnowledge = ['Novice', 'Amateur', 'Experienced', 'Master'];
  if (!data.audienceKnowledge || !validKnowledge.includes(data.audienceKnowledge)) {
    errors.push('Invalid audience knowledge level');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Build enhanced AI prompt from user inputs
 * @param data User form data
 * @returns Enhanced prompt string for AI generation
 */
export function buildEnhancedPrompt(data: any): string {
  let prompt = `Create a ${data.presentationType.toLowerCase()} presentation titled "${data.title}"\n\n`;
  prompt += `Description: ${data.description}\n\n`;
  
  if (data.documentContent) {
    prompt += `Based on the following source material:\n${data.documentContent}\n\n`;
  }

  prompt += `Presentation Requirements:\n`;
  prompt += `- Target Audience: ${data.audienceType} (${data.audienceKnowledge} level)\n`;
  prompt += `- Presentation Type: ${data.presentationType}\n`;
  prompt += `- Number of Slides: ${data.numberOfSlides}\n`;
  prompt += `- Professional tone appropriate for ${data.audienceKnowledge.toLowerCase()} audience\n\n`;

  if (data.includeGraphs || data.includeCharts || data.includeImages || data.includeAnalytics) {
    prompt += `Visual Elements to Include:\n`;
    if (data.includeGraphs) prompt += `- Data graphs and visualizations\n`;
    if (data.includeCharts) prompt += `- Pie charts and statistical representations\n`;
    if (data.includeImages) prompt += `- Relevant images and visual aids\n`;
    if (data.includeAnalytics) prompt += `- Analytics and performance metrics\n`;
    prompt += `\n`;
  }

  prompt += `Please create comprehensive slide content with:\n`;
  prompt += `1. Clear, engaging titles for each slide\n`;
  prompt += `2. Well-structured content appropriate for the audience level\n`;
  prompt += `3. Logical flow and progression\n`;
  prompt += `4. Speaker notes for each slide\n`;
  prompt += `5. Suggestions for visual elements where appropriate\n`;

  return prompt;
}