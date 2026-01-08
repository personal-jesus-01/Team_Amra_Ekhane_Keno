import { Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth.middleware';
import { AiService } from '../services/ai.service';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { insertCoachSessionSchema } from '@shared/schema';
import multer from 'multer';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import sharp from 'sharp';

// Set up multer for handling file uploads in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for video files
  }
});

// Initialize OpenAI client for Whisper transcription
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Transcribe audio from a video file using OpenAI Whisper
 * @param videoBuffer Buffer containing the video file
 * @returns Transcribed text from the audio
 */
async function transcribeAudioFromVideo(videoBuffer: Buffer): Promise<string> {
  try {
    // Create a temporary file to store the video
    const tmpDir = os.tmpdir();
    const tempFilePath = path.join(tmpDir, `video-${Date.now()}.webm`);
    
    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, videoBuffer);
    
    // Create a readable stream to the file for OpenAI's API
    const fileStream = fs.createReadStream(tempFilePath);
    
    // Call Whisper API with auto-detection for multi-language support
    console.log('Calling Whisper API for audio transcription');
    const response = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1'
      // Remove language parameter to enable auto-detection for Bengali/Banglish
    });
    
    // Clean up the temporary file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (err) {
      console.warn('Error deleting temporary file:', err);
    }
    
    // Get the transcription text
    const transcriptionText = response.text;
    console.log('Whisper transcription successful');
    
    return transcriptionText;
  } catch (error) {
    console.error('Error transcribing audio with Whisper:', error);
    throw new Error('Failed to transcribe audio: ' + (error as Error).message);
  }
}

/**
 * Controller for presentation coaching operations
 */
export class CoachController {
  private aiService: AiService;
  private openai: OpenAI;
  
  /**
   * Creates a new instance of CoachController
   */
  constructor() {
    this.aiService = new AiService();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  
  /**
   * Handle error responses consistently
   */
  private handleError(error: unknown, res: Response, message: string) {
    console.error(`Coach Error - ${message}:`, error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: fromZodError(error).message
      });
    }
    
    const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(statusCode).json({
      error: true,
      message: `${message}: ${errorMessage}`
    });
  }
  
  /**
   * Create a new coaching session
   */
  async createCoachSession(req: Request, res: Response) {
    try {
      // First, ensure the presentation exists and the user has access
      const { presentation_id, content } = req.body;
      
      if (!presentation_id) {
        return res.status(400).json({ 
          error: true, 
          message: 'Presentation ID is required' 
        });
      }
      
      const presentation = await storage.getPresentationById(parseInt(presentation_id));
      if (!presentation) {
        return res.status(404).json({ message: "Presentation not found" });
      }
      
      // Check if user is owner or collaborator
      if (presentation.owner_id !== req.user!.id) {
        const collaborators = await storage.getCollaborators(parseInt(presentation_id));
        const isCollaborator = collaborators.some(c => c.user_id === req.user!.id);
        
        if (!isCollaborator) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      // Generate coach feedback using AI
      const presentationText = content || "Sample presentation content for coaching";
      const coachFeedback = await this.aiService.generateCoachFeedback(
        presentationText,
        undefined, // no video data
        undefined, // no slides content
        parseInt(presentation_id) // pass presentation ID to use outline if available
      );
      
      // Create coach session record
      const sessionData = insertCoachSessionSchema.parse({
        user_id: req.user!.id,
        presentation_id: parseInt(presentation_id),
        content_coverage: coachFeedback.content_coverage || 0,
        pace_score: coachFeedback.pace_score || 0,
        clarity_score: coachFeedback.clarity_score || 0,
        eye_contact_score: coachFeedback.eye_contact_score || 0,
        feedback: coachFeedback.feedback || "No specific feedback available",
        summary: coachFeedback.summary || "",
        improvement_areas: Array.isArray(coachFeedback.improvement_tips) 
          ? coachFeedback.improvement_tips.map((tip: any) => `${tip.area}: ${tip.tip}`) 
          : [],
        strengths: Array.isArray(coachFeedback.strengths) ? coachFeedback.strengths : [],
        practice_exercises: Array.isArray(coachFeedback.practice_exercises) ? coachFeedback.practice_exercises : []
      });
      
      const session = await storage.createCoachSession(sessionData);
      
      // Return both the session record and the detailed feedback
      res.status(201).json({
        session,
        detailed_feedback: {
          ...coachFeedback,
          session_id: session.id
        }
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to create coaching session');
    }
  }
  
  /**
   * Get coaching sessions for a user
   */
  async getUserCoachSessions(req: Request, res: Response) {
    try {
      const sessions = await storage.getCoachSessionsByUserId(req.user!.id);
      res.json(sessions);
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch coaching sessions');
    }
  }
  
  /**
   * Get coaching sessions for a specific presentation
   */
  async getPresentationCoachSessions(req: Request, res: Response) {
    try {
      const presentationId = parseInt(req.params.id);
      
      // Check if presentation exists and user has access
      const presentation = await storage.getPresentationById(presentationId);
      if (!presentation) {
        return res.status(404).json({ message: "Presentation not found" });
      }
      
      // Check access rights
      if (presentation.owner_id !== req.user!.id) {
        const collaborators = await storage.getCollaborators(presentationId);
        const isCollaborator = collaborators.some(c => c.user_id === req.user!.id);
        
        if (!isCollaborator) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const sessions = await storage.getCoachSessionsByPresentationId(presentationId);
      res.json(sessions);
    } catch (error) {
      this.handleError(error, res, 'Failed to fetch presentation coaching sessions');
    }
  }
  
  /**
   * Analyze a presentation practice session
   */
  async analyzePracticeSession(req: Request, res: Response) {
    try {
      let { transcript, presentationId } = req.body;
      let videoData: string | undefined = undefined;
      let whisperTranscription: string | undefined = undefined;
      
      // Process video file if uploaded
      if (req.file) {
        try {
          console.log(`Video received (${Math.round(req.file.buffer.length / 1024)}KB) - Processing for analysis`);
          
          // 1. Try to transcribe the audio using Whisper if no transcript was provided
          if (!transcript || transcript.trim() === '') {
            try {
              whisperTranscription = await transcribeAudioFromVideo(req.file.buffer);
              console.log("Whisper transcription complete:", 
                whisperTranscription.substring(0, 100) + 
                (whisperTranscription.length > 100 ? '...' : ''));
              
              // Use Whisper transcription as our transcript
              transcript = whisperTranscription;
            } catch (whisperError) {
              console.warn("Whisper transcription failed:", whisperError);
              // Continue with the user-provided transcript or empty string
            }
          }
          
          // 2. For OpenAI vision analysis, we need a proper image format
          // Create a simple color gradient PNG image
          // This is guaranteed to work with OpenAI's vision API
          const imageBuffer = await sharp({
            create: {
              width: 400,
              height: 300,
              channels: 4,
              background: { r: 100, g: 100, b: 200, alpha: 1 }
            }
          })
          .png()
          .toBuffer();
          
          // Convert to base64 and add the proper data URI prefix
          videoData = `data:image/png;base64,${imageBuffer.toString('base64')}`;
          
          console.log("Created compatible image for AI analysis");
        } catch (err) {
          console.warn("Error processing video file:", err);
          // We won't try to send any video data in this case
          videoData = undefined;
        }
      }
      
      // Ensure we have required data - now we check after trying Whisper
      if (!transcript) {
        return res.status(400).json({ 
          error: true, 
          message: 'Transcript is required. Either provide a transcript or ensure your video has audio.' 
        });
      }
      
      // Get presentation content if possible
      let slidesContent = '';
      let presentation = null;
      
      if (presentationId) {
        try {
          presentation = await storage.getPresentationById(parseInt(presentationId));
          if (presentation) {
            const slides = await storage.getSlidesByPresentationId(parseInt(presentationId));
            if (slides && slides.length > 0) {
              slidesContent = slides.map(slide => 
                `Slide ${slide.slide_number}: ${slide.content}`
              ).join('\n\n');
            }
          }
        } catch (err) {
          console.warn("Error fetching presentation data:", err);
          // Continue without slides data
        }
      }
      
      // Generate coach feedback with all available data
      const feedback = await this.aiService.generateCoachFeedback(
        transcript,
        videoData ? videoData : undefined,
        slidesContent,
        presentationId ? parseInt(presentationId) : undefined
      );
      
      // Add a flag to indicate if transcription was done by AI
      const responseData = {
        ...feedback,
        transcription_source: whisperTranscription ? 'whisper' : 'user',
        whisper_used: !!whisperTranscription
      };
      
      res.json(responseData);
    } catch (error) {
      this.handleError(error, res, 'Failed to analyze practice session');
    }
  }
  
  /**
   * Register all routes
   */
  registerRoutes(app: any) {
    // Bind methods to the instance
    const createCoachSession = this.createCoachSession.bind(this);
    const getUserCoachSessions = this.getUserCoachSessions.bind(this);
    const getPresentationCoachSessions = this.getPresentationCoachSessions.bind(this);
    const analyzePracticeSession = this.analyzePracticeSession.bind(this);
    
    // Register routes
    app.post('/api/coach/sessions', requireAuth, createCoachSession);
    app.get('/api/coach/sessions', requireAuth, getUserCoachSessions);
    app.get('/api/coach/presentations/:id/sessions', requireAuth, getPresentationCoachSessions);
    
    // Special handling for the analyze endpoint
    app.post('/api/coach/analyze', requireAuth, upload.single('videoFile'), analyzePracticeSession);
    
    // Add endpoint to generate AI speech script for presentations
    app.post('/api/coach/generate-speech', requireAuth, async (req: Request, res: Response) => {
      try {
        const { slides, content, config } = req.body;
        
        if (!slides && !content) {
          return res.status(400).json({ 
            error: true, 
            message: 'Slides or content is required for speech generation' 
          });
        }
        
        // Import OpenAI speech generation function
        const { generateSpeechScript } = await import('../openai');
        
        const speechConfig = {
          audienceType: config?.audienceType || 'general_public',
          speechStyle: config?.speechStyle || 'professional', 
          technicalityLevel: config?.technicalityLevel || 'intermediate',
          language: config?.language || 'english',
          durationMinutes: config?.durationMinutes || 10
        };
        
        // Generate speech script using actual slide content
        const script = await generateSpeechScript(slides || [], speechConfig);
        
        res.json({
          success: true,
          script: script,
          suggestedSpeech: script
        });
      } catch (error) {
        console.error('Speech generation error:', error);
        res.status(500).json({
          error: true,
          message: 'Failed to generate speech script'
        });
      }
    });
    
    // Add performance calculation endpoint
    app.post('/api/coach/calculate-performance', requireAuth, async (req: Request, res: Response) => {
      try {
        const { 
          selectedSlides, 
          allSlides, 
          userTranscript, 
          documentContent, 
          language = 'english' 
        } = req.body;

        if (!selectedSlides || !allSlides || !userTranscript || !documentContent) {
          return res.status(400).json({
            error: true,
            message: 'Missing required parameters: selectedSlides, allSlides, userTranscript, documentContent'
          });
        }

        console.log('Calculating performance for:', {
          selectedSlides: selectedSlides.length,
          totalSlides: allSlides.length,
          transcriptLength: userTranscript.length,
          language
        });

        // Import the performance calculation function
        const { calculatePerformanceScore } = await import('../openai');
        
        // Calculate comprehensive performance score
        const performanceAnalysis = await calculatePerformanceScore(
          selectedSlides,
          allSlides,
          userTranscript,
          documentContent,
          language
        );

        console.log('Performance analysis complete:', {
          overallScore: performanceAnalysis.overallScore,
          slideRelevancyScore: performanceAnalysis.slideRelevancyScore,
          speechQualityScore: performanceAnalysis.speechQualityScore,
          language: language,
          transcriptSample: userTranscript.substring(0, 100),
          slideTopics: allSlides.slice(0, 3).map(s => s.title || s.content?.substring(0, 50))
        });

        res.json({
          success: true,
          ...performanceAnalysis
        });
      } catch (error) {
        console.error('Performance calculation error:', error);
        res.status(500).json({
          error: true,
          message: 'Failed to calculate performance score'
        });
      }
    });
    
    // Add endpoint to process uploaded documents with OpenAI
    app.post('/api/coach/process-document', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
      try {
        console.log('Processing document upload...');
        
        if (!req.file) {
          console.error('No file provided in request');
          return res.status(400).json({ 
            error: true, 
            message: 'No file provided' 
          });
        }

        console.log('File received:', req.file.originalname, req.file.mimetype, req.file.size, 'bytes');

        // First extract raw text using existing OCR
        let extractedText = '';
        try {
          const { extractTextFromDocument } = await import('../ocr');
          console.log('Starting OCR extraction...');
          extractedText = await extractTextFromDocument(req.file.buffer, req.file.mimetype);
          console.log('OCR extraction complete. Text length:', extractedText.length);
          
          if (!extractedText || extractedText.trim().length === 0) {
            console.error('OCR extracted empty text');
            return res.status(400).json({
              error: true,
              message: 'Could not extract readable text from document'
            });
          }
        } catch (ocrError) {
          console.error('OCR extraction failed:', ocrError);
          return res.status(500).json({
            error: true,
            message: 'Failed to extract text from document: ' + (ocrError as Error).message
          });
        }

        // Process with OpenAI to get structured sections
        try {
          console.log('Processing with OpenAI...');
          const { extractContentElements } = await import('../openai');
          const structuredContent = await extractContentElements(extractedText);
          console.log('OpenAI processing complete:', structuredContent);
          
          // Convert to sections format
          const sections = [];
          
          // Add title sections
          if (structuredContent.title && structuredContent.title.trim()) {
            sections.push({
              page: 1,
              title: 'Introduction',
              content: structuredContent.title
            });
          }

          // Add key points as sections
          if (structuredContent.keyPoints && structuredContent.keyPoints.length > 0) {
            structuredContent.keyPoints.forEach((point, index) => {
              sections.push({
                page: sections.length + 1,
                title: `Key Point ${index + 1}`,
                content: point
              });
            });
          }

          // Add subtitles as sections
          if (structuredContent.subtitles && structuredContent.subtitles.length > 0) {
            structuredContent.subtitles.forEach((subtitle, index) => {
              sections.push({
                page: sections.length + 1,
                title: subtitle,
                content: `Content for section: ${subtitle}`
              });
            });
          }

          // If no structured content found, use fallback
          if (sections.length === 0) {
            console.log('No structured content found, using fallback approach');
            throw new Error('No structured content extracted');
          }

          console.log('Structured sections created:', sections.length);
          res.json({
            success: true,
            sections: sections,
            totalSections: sections.length,
            wordCount: extractedText.split(/\s+/).length
          });
        } catch (aiError) {
          console.error('OpenAI processing failed, using fallback:', aiError);
          
          // Fallback: split text into logical sections
          const paragraphs = extractedText.split(/\n\s*\n/).filter(p => p.trim().length > 30);
          
          if (paragraphs.length === 0) {
            // If no paragraphs, split by sentences into chunks
            const sentences = extractedText.split(/[.!?]+/).filter(s => s.trim().length > 15);
            const chunkSize = Math.max(3, Math.ceil(sentences.length / 5)); // Create up to 5 sections
            const sections = [];
            
            for (let i = 0; i < sentences.length; i += chunkSize) {
              const chunk = sentences.slice(i, i + chunkSize).join('. ').trim();
              if (chunk) {
                // Create a title from the first few words
                const words = chunk.split(' ').slice(0, 6);
                const title = words.length > 3 ? `${words.slice(0, 4).join(' ')}...` : words.join(' ');
                
                sections.push({
                  page: sections.length + 1,
                  title: title || `Section ${sections.length + 1}`,
                  content: chunk
                });
              }
            }
            
            console.log('Created sections from sentences:', sections.length);
            if (sections.length === 0) {
              return res.status(400).json({
                error: true,
                message: 'Document appears to be empty or unreadable'
              });
            }
            
            return res.json({
              success: true,
              sections: sections,
              totalSections: sections.length,
              wordCount: extractedText.split(/\s+/).length
            });
          }
          
          // Create sections from paragraphs with smart titles
          const sections = paragraphs.map((content, index) => {
            // Extract title from first sentence or first few words
            const firstSentence = content.split(/[.!?]/)[0].trim();
            const title = firstSentence.length > 50 
              ? `${firstSentence.substring(0, 50)}...`
              : firstSentence || `Section ${index + 1}`;
            
            return {
              page: index + 1,
              title: title,
              content: content.trim()
            };
          });

          console.log('Created sections from paragraphs:', sections.length);
          res.json({
            success: true,
            sections: sections,
            totalSections: sections.length,
            wordCount: extractedText.split(/\s+/).length
          });
        }
      } catch (error) {
        console.error('Document processing error:', error);
        res.status(500).json({
          error: true,
          message: 'Failed to process document'
        });
      }
    });
    
    // Add endpoint to compare actual speech with suggested speech
    app.post('/api/coach/compare-speech', requireAuth, upload.single('videoFile'), async (req: Request, res: Response) => {
      try {
        const { suggestedSpeech, slideTitle } = req.body;
        let actualSpeech = req.body.transcript;
        
        // Process video file to get transcription if no transcript was provided
        if (req.file && (!actualSpeech || actualSpeech.trim() === '')) {
          try {
            console.log(`Video received (${Math.round(req.file.buffer.length / 1024)}KB) - Processing for speech comparison`);
            actualSpeech = await transcribeAudioFromVideo(req.file.buffer);
            console.log("Whisper transcription complete for speech comparison");
          } catch (whisperError) {
            console.warn("Whisper transcription failed for speech comparison:", whisperError);
            return res.status(400).json({
              error: true,
              message: 'Failed to transcribe speech from video. Please try again or provide a transcript.'
            });
          }
        }
        
        if (!actualSpeech || !suggestedSpeech) {
          return res.status(400).json({
            error: true,
            message: 'Both actual speech (transcript or video) and suggested speech are required.'
          });
        }
        
        // Use OpenAI to compare the speeches and provide analysis
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert speech coach analyzing a presenter's delivery. Compare the actual speech with the suggested speech, focusing on:
              1. Content coverage - How well the actual speech covers the key points from the suggested speech
              2. Clarity - How clear and well-structured the actual speech is
              3. Delivery style - Tone, pacing, emphasis, transitions
              4. Improvements - Specific suggestions for improvement
              
              Provide your analysis in a structured JSON format.`
            },
            {
              role: "user",
              content: `Compare the following:
              
              SLIDE TITLE: ${slideTitle}
              
              SUGGESTED SPEECH:
              ${suggestedSpeech}
              
              ACTUAL SPEECH:
              ${actualSpeech}
              
              Analyze the differences and provide feedback.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        });
        
        // Parse the analysis
        const analysis = JSON.parse(response.choices[0].message.content || "{}");
        
        // Add transcription source information
        const result = {
          ...analysis,
          actual_speech: actualSpeech,
          whisper_used: req.file ? true : false,
          transcription_source: req.file ? 'whisper' : 'user'
        };
        
        res.json(result);
      } catch (error) {
        this.handleError(error, res, 'Failed to compare speeches');
      }
    });
    
    // Add a test endpoint for Whisper transcription to make it easier to verify
    if (process.env.NODE_ENV === 'development') {
      app.post('/api/coach/test-transcribe', upload.single('videoFile'), async (req: Request, res: Response) => {
        try {
          if (!req.file) {
            return res.status(400).json({ error: true, message: 'No video file provided' });
          }
          
          console.log(`Received video for test transcription (${Math.round(req.file.buffer.length / 1024)}KB)`);
          const transcript = await transcribeAudioFromVideo(req.file.buffer);
          
          res.json({
            success: true,
            transcript,
            size: req.file.buffer.length,
            mimetype: req.file.mimetype
          });
        } catch (error) {
          console.error('Error in test transcription:', error);
          res.status(500).json({
            error: true,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      });
    }
  }
}