/**
 * Mock Google Slides service for development and testing
 * Returns mock responses that simulate Google Slides API behavior
 */

export interface MockGoogleSlidesResult {
  presentationId: string;
  editUrl: string;
  viewUrl: string;
  slideCount: number;
}

/**
 * Create a mock Google Slides presentation
 * @param title Presentation title
 * @param slides Array of slide content
 * @returns Mock Google Slides result with URLs and metadata
 */
export async function createMockGooglePresentation(
  title: string,
  slides: any[]
): Promise<MockGoogleSlidesResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate mock presentation ID
  const presentationId = `mock_presentation_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  console.log(`[MOCK] Creating Google Slides presentation: "${title}" with ${slides.length} slides`);

  return {
    presentationId,
    editUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    viewUrl: `https://docs.google.com/presentation/d/${presentationId}/preview`,
    slideCount: slides.length
  };
}

/**
 * Validate mock configuration (always returns valid for development)
 * @returns Configuration status
 */
export function validateMockConfig(): { valid: boolean; error?: string } {
  return { valid: true };
}