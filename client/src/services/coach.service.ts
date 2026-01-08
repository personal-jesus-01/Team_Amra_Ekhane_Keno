import { ImprovementTip, PresentationAnalysis, SpeechComparisonResult } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

// Generate a suggested speech script for a slide
export async function generateSuggestedSpeech(
  slideContent: string,
  slideTitle: string,
  presentationContext?: string
): Promise<{ suggestedSpeech: string }> {
  try {
    const response = await apiRequest('POST', '/api/coach/generate-speech', {
      slideContent,
      slideTitle,
      presentationContext
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error generating suggested speech:', error);
    throw new Error('Failed to generate suggested speech');
  }
}

// Compare actual speech with suggested speech
export async function compareSpeech(
  suggestedSpeech: string,
  slideTitle: string,
  transcript?: string,
  videoBlob?: Blob
): Promise<SpeechComparisonResult> {
  try {
    // Prepare form data if video is provided
    if (videoBlob) {
      const formData = new FormData();
      formData.append('suggestedSpeech', suggestedSpeech);
      formData.append('slideTitle', slideTitle);
      
      if (transcript) {
        formData.append('transcript', transcript);
      }
      
      formData.append('videoFile', videoBlob, 'recording.webm');
      
      const response = await apiRequest('POST', '/api/coach/compare-speech', formData, {
        isFormData: true
      });
      
      return await response.json();
    } else {
      // Send JSON if only transcript is provided
      const response = await apiRequest('POST', '/api/coach/compare-speech', {
        suggestedSpeech,
        slideTitle,
        transcript
      });
      
      return await response.json();
    }
  } catch (error) {
    console.error('Error comparing speech:', error);
    throw new Error('Failed to compare speech');
  }
}

// Analyze a practice session
export async function analyzePractice(
  presentationId: number,
  transcript: string,
  videoBlob: Blob | null,
  duration: number
): Promise<PresentationAnalysis> {
  // Prepare form data to send video file if available
  const formData = new FormData();
  formData.append('presentationId', presentationId.toString());
  formData.append('transcript', transcript);
  formData.append('duration', duration.toString());
  
  if (videoBlob) {
    formData.append('videoFile', videoBlob, 'recording.webm');
  }
  
  try {
    const response = await apiRequest('POST', '/api/coach/analyze', formData, {
      isFormData: true
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error analyzing practice:', error);
    throw new Error('Failed to analyze practice session');
  }
}

// Save a practice session
export async function savePracticeSession(
  presentationId: number,
  analysisResult: PresentationAnalysis,
  transcript: string,
  duration: number,
  screenshotUrl?: string
): Promise<{ id: number }> {
  try {
    const response = await apiRequest('POST', '/api/coach/sessions', {
      presentation_id: presentationId,
      content_coverage: analysisResult.content_coverage,
      pace_score: analysisResult.pace_score,
      clarity_score: analysisResult.clarity_score,
      eye_contact_score: analysisResult.eye_contact_score,
      overall_score: analysisResult.overall_score,
      feedback: analysisResult.feedback,
      transcript: transcript,
      duration: duration,
      screenshot_url: screenshotUrl || null
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error saving practice session:', error);
    throw new Error('Failed to save practice session');
  }
}

// This function is disabled - demo mode is no longer supported
export async function generateDemoAnalysis(
  transcript: string,
  presentationId: number
): Promise<PresentationAnalysis> {
  console.error('Demo mode is no longer supported');
  throw new Error('Demo mode is disabled. Please use the real AI analysis.');
}

// Export all functions as a service
const coachService = {
  analyzePractice,
  savePracticeSession,
  generateDemoAnalysis,
  generateSuggestedSpeech,
  compareSpeech
};

export default coachService;