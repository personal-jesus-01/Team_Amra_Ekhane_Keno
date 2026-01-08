import OpenAI from 'openai';

/**
 * Service for AI operations using OpenAI
 */
export class AiService {
  private openai: OpenAI;
  
  /**
   * Creates a new instance of AiService
   */
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Map tone values to valid presentation service types
   */
  private mapToneToValidType(tone: string | undefined): 'professional' | 'academic' | 'creative' | 'casual' {
    const toneMap: Record<string, 'professional' | 'academic' | 'creative' | 'casual'> = {
      'professional': 'professional',
      'technical': 'academic',
      'educational': 'academic',
      'conversational': 'casual',
      'enthusiastic': 'creative',
      'academic': 'academic',
      'creative': 'creative',
      'casual': 'casual'
    };
    if (!tone) return 'professional';
    return toneMap[tone] || 'professional';
  }

  /**
   * Map presentation type values to valid presentation service types
   */
  private mapPresentationTypeToValidType(type: string | undefined): 'business' | 'academic' | 'corporate' | 'analytical' | 'historical' {
    const typeMap: Record<string, 'business' | 'academic' | 'corporate' | 'analytical' | 'historical'> = {
      'business': 'business',
      'technical': 'analytical',
      'academic': 'academic',
      'creative': 'corporate',
      'corporate': 'corporate',
      'analytical': 'analytical',
      'historical': 'historical'
    };
    if (!type) return 'business';
    return typeMap[type] || 'business';
  }
  
  /**
   * Generate a summary from OCR extracted text
   * @param text The OCR extracted text to summarize
   * @returns Summarized text
   */
  async summarizeText(text: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes text clearly and concisely."
          },
          {
            role: "user", 
            content: `Please summarize the following text extracted from a document:\n\n${text}`
          }
        ]
      });
      
      return response.choices[0].message.content || "No summary generated";
    } catch (error) {
      console.error("Error summarizing text:", error);
      throw new Error("Failed to generate summary: " + (error as Error).message);
    }
  }
  
  /**
   * Generate presentation slides based on content
   * @param prompt Description of the presentation to generate
   * @param numberOfSlides Number of slides to generate
   * @param style Visual style preference
   * @returns Generated slides content
   */
  async generatePresentationSlides(
    prompt: string,
    numberOfSlides: number = 5,
    style: string = 'professional',
    brandColors: string[] = []
  ): Promise<any> {
    try {
      const colorInstruction = brandColors.length > 0 
        ? `Use these brand colors: ${brandColors.join(', ')}` 
        : 'Use professional color schemes';
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert presentation designer with skills in visual design, content structuring, and audience engagement.
            
            Create a professional ${numberOfSlides}-slide presentation based on the provided prompt.
            ${colorInstruction}. Apply a ${style} visual style.
            
            For each slide, condense and format text for maximum readability and impact. 
            Include appropriate icons, charts, and image descriptions where applicable.
            
            Include these slide types as needed: title slide, section dividers, content layouts, 
            quote/statistic formats, and conclusion slides.
            
            Return a JSON object with this structure:
            {
              "title": "Presentation Title",
              "style": "${style}",
              "color_palette": ["hex1", "hex2", "hex3"],
              "slides": [
                {
                  "slide_number": number,
                  "slide_type": "title|section|content|quote|conclusion",
                  "title": "string",
                  "content": "string with bullet points using * as markers",
                  "background_color": "hex color code",
                  "suggested_visuals": "description of recommended images, icons, or charts",
                  "layout_type": "string describing the layout (e.g., 'two-column', 'centered', etc.)"
                }
              ]
            }`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 3000
      });
      
      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Ensure the result has the expected structure
      if (!result.slides || !Array.isArray(result.slides)) {
        result.slides = [];
      }
      
      return result;
    } catch (error) {
      console.error("Error generating presentation slides:", error);
      throw new Error("Failed to generate presentation: " + (error as Error).message);
    }
  }
  
  /**
   * Generate AI coach feedback for presentation
   * @param presentationText The text content of the presentation
   * @returns Coaching feedback with scores and suggestions
   */
  /**
   * Generate comprehensive coach feedback for presentation practice
   * 
   * @param presentationText The text of the presentation to analyze
   * @param videoData Optional base64 video data for visual analysis
   * @param slidesContent Optional content from the presentation slides for comparison
   * @param presentationId Optional ID of the presentation for accessing outline data
   * @returns Detailed presentation analysis and feedback
   */
  async generateCoachFeedback(
    presentationText: string, 
    videoData?: string,
    slidesContent?: string,
    presentationId?: number
  ): Promise<any> {
    try {
      // If we have a presentation ID, try to fetch its outline
      let outlineData = "";
      
      if (presentationId) {
        try {
          const { storage } = await import('../storage');
          
          // Get the presentation to check if it was generated by SlideBanai
          const presentation = await storage.getPresentationById(presentationId);
          
          if (presentation) {
            // Get all slides from this presentation to reconstruct the outline
            const slides = await storage.getSlidesByPresentationId(presentationId);
            
            if (slides && slides.length > 0) {
              // Organize slides by slide_number
              slides.sort((a, b) => a.slide_number - b.slide_number);
              
              // Construct meaningful outline from slides
              outlineData = slides.map(slide => {
                // Extract a title-like text from the content if possible
                let slideTitle = "";
                try {
                  // Try to parse content as JSON to extract a meaningful title
                  const content = JSON.parse(slide.content);
                  slideTitle = content.title || content.heading || "Slide Content";
                } catch (e) {
                  // If content is not JSON or doesn't have a title, create a title from first line
                  slideTitle = slide.content.split('\n')[0].substring(0, 50);
                  if (slideTitle.length === 50) slideTitle += "...";
                }
                return `Slide ${slide.slide_number}: "${slideTitle}"\n${slide.content}`;
              }).join('\n\n');
              
              console.log(`Using structured outline from ${slides.length} slides for coaching`);
            }
          }
        } catch (error) {
          console.warn("Error fetching presentation outline for coaching:", error);
          // Continue without outline data if there was an error
        }
      }
      
      // Prepare the base prompt for text analysis
      const systemPrompt = `You are an expert presentation coach with years of experience coaching executives and TED speakers.
      Analyze the provided presentation content and provide detailed, constructive feedback.
      
      ${slidesContent ? 'Compare the spoken content with the slide content to evaluate content coverage.' : ''}
      ${outlineData ? 'Compare the spoken content with the presentation outline to evaluate how well the expected structure was covered. The outline is from a SlideBanai-generated presentation, so it has a very specific structure that should be followed.' : ''}
      
      Return a detailed JSON object with the following structure:
      {
        "content_coverage": number from 0-100 indicating how well the key points were covered,
        "pace_score": number from 0-100 indicating appropriate speaking pace (not too fast or slow),
        "clarity_score": number from 0-100 indicating clarity of speech and ideas,
        "eye_contact_score": number from 0-100 indicating effective eye contact,
        "feedback": "Detailed constructive feedback on the overall presentation",
        "improvement_tips": [
          {
            "area": "Area name (e.g., 'Pacing', 'Structure', 'Clarity')",
            "tip": "Actionable specific tip to improve this area",
            "importance": number from 1-10 indicating priority
          }
        ],
        "strengths": ["Array of presentation strengths"],
        "practice_exercises": ["Specific exercises the presenter can practice to improve"],
        "summary": "Short summary of the overall assessment",
        ${outlineData ? `"slide_by_slide_feedback": [
          {
            "slide_number": number,
            "slide_title": "The title of the slide",
            "coverage_score": number from 0-100,
            "recommendations": "Specific recommendations for this slide",
            "key_points_missed": ["Array of key points that were missed in the presentation"],
            "delivery_notes": "Notes on how this slide content was delivered"
          }
        ],
        "structure_analysis": {
          "adherence_to_outline": number from 0-100,
          "transitions": "Feedback on transitions between slides",
          "logical_flow": "Assessment of the logical flow of the presentation",
          "recommendations": "Recommendations for better structure"
        },
        "coach_script": "A detailed script that a professional presentation coach would use to guide the presenter through improvements, referencing specific slides and content from the outline",` : ""}
        "delivery_recommendations": {
          "pace": "Specific recommendations about speaking pace",
          "emphasis": "Guidance on emphasizing key points",
          "vocal_variety": "Tips for improving vocal variety",
          "body_language": "Suggestions for body language improvements"
        }
      }`;
      
      // Construct user content based on available data
      let userContent = `Please analyze this presentation: \n\n${presentationText}`;
      
      // Add reference materials if available
      if (slidesContent) {
        userContent += `\n\nFor reference, here is the content of the slides:\n\n${slidesContent}`;
      }
      
      if (outlineData) {
        userContent += `\n\nFor reference, here is the expected presentation outline from SlideBanai:\n\n${outlineData}`;
      }
      
      // Create an array of content for multimodal analysis if video is provided
      let messages;
      
      if (videoData) {
        try {
          // Create multimodal message with image
          messages = [
            {
              role: "system" as const,
              content: systemPrompt
            },
            {
              role: "user" as const,
              content: [
                { 
                  type: "text" as const, 
                  text: `${userContent}\n\nThe video of the presentation is also attached for visual cues analysis.` 
                },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: videoData.startsWith('data:') ? videoData : `data:image/png;base64,${videoData}`
                  }
                }
              ]
            }
          ];
          console.log("Using multimodal analysis with video data");
        } catch (err) {
          console.warn("Error adding video data to OpenAI request, falling back to text-only analysis:", err);
          // Fall back to text-only analysis
          messages = [
            {
              role: "system" as const,
              content: systemPrompt
            },
            {
              role: "user" as const,
              content: userContent
            }
          ];
        }
      } else {
        // Text-only analysis
        messages = [
          {
            role: "system" as const,
            content: systemPrompt
          },
          {
            role: "user" as const,
            content: userContent
          }
        ];
      }
      
      // Get analysis from OpenAI
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: outlineData ? 3000 : 1500 // Allow more tokens when using outline data
      });
      
      // Parse and validate the response
      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Ensure required properties exist
      const defaultedResult = {
        content_coverage: result.content_coverage || 50,
        pace_score: result.pace_score || 50,
        clarity_score: result.clarity_score || 50,
        eye_contact_score: result.eye_contact_score || 
          (videoData ? 50 : 0), // Only give eye contact score if video was provided
        feedback: result.feedback || "Analysis completed. Practice regularly to improve your presentation skills.",
        improvement_tips: result.improvement_tips || [],
        strengths: result.strengths || [],
        practice_exercises: result.practice_exercises || [],
        summary: result.summary || "Additional practice recommended",
        delivery_recommendations: result.delivery_recommendations || {
          pace: "Focus on maintaining a consistent pace throughout your presentation.",
          emphasis: "Emphasize key points by pausing briefly before and after them.",
          vocal_variety: "Vary your tone and volume to keep the audience engaged.",
          body_language: "Maintain open posture and use purposeful gestures."
        }
      };
      
      // Include outline-specific feedback if outline data was provided
      if (outlineData) {
        return {
          ...defaultedResult,
          slide_by_slide_feedback: result.slide_by_slide_feedback || [],
          structure_analysis: result.structure_analysis || {
            adherence_to_outline: 50,
            transitions: "Work on smoother transitions between slides.",
            logical_flow: "The presentation followed a generally logical structure.",
            recommendations: "Review the outline and ensure all key points are covered in order."
          },
          coach_script: result.coach_script || 
            "Thank you for your presentation. I've analyzed your delivery against the SlideBanai outline. " +
            "Let's review the key areas where you can improve alignment with your prepared slides and enhance your overall delivery."
        };
      }
      
      return defaultedResult;
    } catch (error) {
      console.error("Error generating coach feedback:", error);
      throw new Error("Failed to generate coach feedback: " + (error as Error).message);
    }
  }
  
  /**
   * Generate presentation content with OpenAI
   * @param prompt The presentation topic or description
   * @param options Configuration options for generation
   * @returns Generated slide content
   */
  async generatePresentationContent(
    prompt: string,
    options: {
      numberOfSlides?: number;
      audience?: string;
      tone?: string;
      presentationType?: string;
    } = {}
  ): Promise<any[]> {
    try {
      const { generatePresentationContent } = await import('../services/presentation.service');
      
      // Map string values to proper types
      const typedOptions = {
        numberOfSlides: options.numberOfSlides || 10,
        audience: (options.audience as 'general' | 'executive' | 'technical' | 'sales' | 'educational' | 'business') || 'general',
        tone: this.mapToneToValidType(options.tone || 'professional'),
        presentationType: this.mapPresentationTypeToValidType(options.presentationType || 'business'),
        includeImages: false
      };
      
      return await generatePresentationContent(prompt, typedOptions);
    } catch (error) {
      console.error("Error generating presentation content:", error);
      throw new Error("Failed to generate presentation content: " + (error as Error).message);
    }
  }

  /**
   * Moderate content for appropriateness
   * @param slideContent Array of slide content to moderate
   * @returns Moderation result
   */
  async moderateContent(slideContent: any[]): Promise<{ approved: boolean; details?: any }> {
    try {
      // Use OpenAI's moderation API to check content
      const textToModerate = slideContent
        .map(slide => `${slide.title}\n${slide.content}`)
        .join('\n\n');

      const response = await this.openai.moderations.create({
        input: textToModerate
      });

      const result = response.results[0];
      
      return {
        approved: !result.flagged,
        details: result.flagged ? {
          categories: result.categories,
          category_scores: result.category_scores
        } : undefined
      };
    } catch (error) {
      console.error("Error moderating content:", error);
      // If moderation fails, allow content but log the error
      return { approved: true };
    }
  }

  /**
   * Extract key topics from presentation content
   * @param content The text content to analyze for topics
   * @returns Structured topic modeling results
   */
  async extractContentTopics(content: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: `You are an expert content analyst. Analyze the provided text to identify main topics and themes.
            Extract key topics, keywords related to each topic, and suggest a logical structure for organizing this content in a presentation.
            
            Return a JSON object with this structure:
            {
              "topics": [
                {
                  "name": "Topic name/title",
                  "keywords": ["keyword1", "keyword2", "keyword3"],
                  "relevance": 0.95 // Number between 0-1 indicating relevance
                }
              ],
              "suggestedStructure": ["section1", "section2", "section3"],
              "mainThemes": ["theme1", "theme2", "theme3"]
            }`
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });
      
      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error analyzing content topics:", error);
      throw new Error("Failed to analyze content topics: " + (error as Error).message);
    }
  }
  
  /**
   * Generate actual presentable slide content using PDF knowledge base
   * @param outline The presentation outline
   * @param presentationTitle The title of the presentation
   * @param options Generation options including PDF content and preferences
   * @returns Actual slide content ready for Google Slides
   */
  async generateActualSlideContent(
    outline: any,
    presentationTitle: string,
    options: { 
      topic: string;
      audienceType: string;
      presentationTone: string;
      numberOfSlides: number;
      pdfKnowledgeBase?: string;
    }
  ): Promise<any[]> {
    try {
      const { topic, audienceType, presentationTone, numberOfSlides, pdfKnowledgeBase } = options;
      
      const knowledgeBasePrompt = pdfKnowledgeBase 
        ? `Use this knowledge base from the uploaded document as your primary source:\n\n${pdfKnowledgeBase.substring(0, 6000)}\n\n`
        : '';
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert presentation designer creating ACTUAL PRESENTABLE SLIDES with complete, detailed content.

${knowledgeBasePrompt}

Topic: ${topic}
Audience: ${audienceType}
Tone: ${presentationTone}

Create ${numberOfSlides} complete slides with ACTUAL CONTENT that can be directly presented, not just pointers or suggestions.

For each slide, provide:
- slide_number: Sequential number starting from 1
- slide_type: "title", "section", "content", "quote", or "conclusion"
- title: Complete, engaging slide title
- content: FULL PRESENTABLE CONTENT with complete sentences, detailed explanations, statistics, examples, and actionable insights (not bullet points or suggestions)
- speaker_notes: Complete script of what presenter should say (4-5 sentences)
- suggested_visuals: Specific visual elements to include
- background_color: Professional hex color
- layout_type: Appropriate layout for the content

The content should be presentation-ready with real information, examples, data points, and complete explanations that audiences can understand and act upon.

Respond with valid JSON: {"slides": [...]}`
          },
          {
            role: "user",
            content: `Based on the outline and knowledge base, create complete presentable slides for: ${presentationTitle}

Outline structure:
${JSON.stringify(outline, null, 2)}

Generate ACTUAL SLIDE CONTENT that is ready to present to a ${audienceType} audience using a ${presentationTone} tone.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 4000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      if (!result.slides || !Array.isArray(result.slides)) {
        throw new Error('Invalid response format from OpenAI');
      }

      return result.slides;
    } catch (error) {
      console.error("Error generating actual slide content:", error);
      throw new Error("Failed to generate actual slide content: " + (error as Error).message);
    }
  }

  /**
   * Generate detailed slide content from an outline
   * @param outline The presentation outline
   * @param presentationTitle The title of the presentation
   * @param options Generation options
   * @returns Detailed slide content for Google Slides
   */
  async generateDetailedSlidesFromOutline(
    outline: any,
    presentationTitle: string,
    options: { numberOfSlides?: number; designVariants?: number } = {}
  ): Promise<any[]> {
    try {
      const { numberOfSlides = 8 } = options;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert presentation designer. Convert the provided outline into detailed, engaging slide content for Google Slides.

For each slide in the outline, create comprehensive content including:
- slide_number: Sequential number starting from 1
- slide_type: "title", "section", "content", "quote", or "conclusion"
- title: Clear, compelling slide title
- content: Detailed bullet points and content (as a string with newlines)
- speaker_notes: What the presenter should say (2-3 sentences)
- suggested_visuals: Description of relevant images/graphics
- background_color: Hex color code
- layout_type: Layout style for the slide

Make the content professional, engaging, and suitable for a business presentation.
Each slide should have substantial, meaningful content that expands on the outline points.

Respond with valid JSON: {"slides": [...]}`
          },
          {
            role: "user",
            content: `Presentation title: ${presentationTitle}

Outline to expand:
${JSON.stringify(outline, null, 2)}

Create ${numberOfSlides} detailed slides based on this outline.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      if (!result.slides || !Array.isArray(result.slides)) {
        throw new Error('Invalid response format from OpenAI');
      }

      return result.slides;
    } catch (error) {
      console.error("Error generating detailed slides from outline:", error);
      throw new Error("Failed to generate detailed slides from outline: " + (error as Error).message);
    }
  }

  /**
   * Generate suggested speech for a presentation slide
   * @param slideContent The content of the slide
   * @param slideTitle The title of the slide
   * @param presentationContext Optional additional context about the presentation
   * @returns Suggested speech script for the slide
   */
  async generateSuggestedSpeech(slideContent: string, slideTitle: string, presentationContext?: string): Promise<string> {
    try {
      const context = presentationContext || "Professional presentation";
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert speech writer and presentation coach. 
            Your task is to create a natural-sounding speech script for a presenter to deliver when presenting a slide.
            The speech should:
            1. Sound conversational and engaging
            2. Expand on the slide content with relevant details
            3. Include appropriate transitions and emphasis
            4. Be appropriately timed (30-60 seconds for a typical slide)
            5. Include speaker notes that indicate where to pause, emphasize, or gesture
            
            Format your response as a clean speech script without explanations or meta-commentary.`
          },
          {
            role: "user",
            content: `Create a speech script for a slide with:
            
            Title: ${slideTitle}
            
            Content: ${slideContent}
            
            Presentation Context: ${context}
            
            Please provide just the speech script without any explanations or formatting notes.`
          }
        ],
        temperature: 0.7
      });
      
      return response.choices[0].message.content || "No speech script generated.";
    } catch (error) {
      console.error("Error generating suggested speech:", error);
      throw new Error("Failed to generate speech script: " + (error as Error).message);
    }
  }

  /**
   * Generate a presentation outline based on prompt or uploaded content
   * @param params Parameters for outline generation
   * @returns Structured presentation outline
   */
  async generateOutline(params: {
    prompt?: string;
    numberOfSlides: number;
    sourceType: string;
    language: string;
    audienceType?: string;
    presentationTone?: string;
    audienceKnowledge?: string;
    timePeriod?: string;
    projectType?: string;
    pdfKnowledgeBase?: string;
  }): Promise<any> {
    try {
      // Extract parameters with defaults
      const {
        prompt = '',
        numberOfSlides = 10,
        sourceType = 'prompt',
        language = 'english',
        audienceType = 'general',
        presentationTone = 'professional',
        audienceKnowledge = 'general',
        timePeriod = '',
        projectType = 'business',
        pdfKnowledgeBase = ''
      } = params;
      
      // Construct the system prompt with PDF knowledge base
      const knowledgeBasePrompt = pdfKnowledgeBase 
        ? `Use this document as your primary knowledge source:\n\n${pdfKnowledgeBase.substring(0, 4000)}\n\n`
        : '';
      
      const systemPrompt = `You are an expert presentation designer with skills in content structuring and audience engagement.
      
      ${knowledgeBasePrompt}
      
      Create a comprehensive, detailed outline for a ${numberOfSlides}-slide presentation in ${language}.
      Topic: ${prompt}
      Audience: ${audienceType}
      Tone: ${presentationTone}
      Audience knowledge level: ${audienceKnowledge}.
      Project type: ${projectType}.
      ${timePeriod ? `Time period: ${timePeriod}.` : ''}
      
      Create a substantive presentation with real insights, data, examples, and actionable content. Each slide should have meaningful, detailed content that provides value to the audience.
      
      Structure the presentation with:
      1. A compelling title slide with clear value proposition
      2. An engaging introduction that hooks the audience
      3. Clear main sections with logical flow and detailed content
      4. Supporting slides with specific examples, data, and insights
      5. A strong conclusion with actionable takeaways
      
      For each slide, provide substantial content - not just topic headings but actual detailed information, examples, statistics, and insights that can be directly used in the presentation.
      
      Return a JSON object with this structure:
      {
        "title": "Overall Presentation Title",
        "theme": "Brief theme description",
        "outline": [
          {
            "slide_number": 1,
            "title": "Detailed Slide Title",
            "type": "title|intro|section|content|conclusion",
            "key_points": ["Detailed key point 1 with specific information, concrete examples, and measurable outcomes", "Detailed key point 2 with real-world applications and implementation steps", "Detailed key point 3 with data, statistics, and actionable insights"],
            "content": "Comprehensive paragraph content that explains the slide topic in detail with specific examples, data points, statistics, real-world case studies, and actionable insights. Include concrete implementation steps, measurable outcomes, and practical applications. Each slide must contain substantial text content with multiple sentences providing genuine value.",
            "notes": "Detailed presenter notes with specific talking points and additional context"
          }
        ],
        "sections": [
          {
            "title": "Section Title",
            "slide_numbers": [2, 3, 4],
            "key_message": "Core message of this section with specific details"
          }
        ],
        "estimated_duration": "XX minutes",
        "audience_takeaways": ["Specific actionable takeaway with concrete implementation steps and measurable outcomes", "Practical insight with real-world application examples and success metrics", "Strategic recommendation with detailed execution plan and expected results"]
      }`;
      
      // Create the completion request
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Create a detailed, comprehensive outline for: ${prompt}

Generate substantial content for each slide with:
- Specific examples and data points
- Actionable insights and recommendations 
- Real-world applications and case studies
- Detailed explanations that provide genuine value
- Complete sentences and paragraphs, not just bullet points

Make this a presentation worth attending with meaningful content that audiences can immediately apply. Each slide should have enough content for 2-3 minutes of speaking time.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000
      });
      
      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error generating presentation outline:", error);
      throw new Error("Failed to generate outline: " + (error as Error).message);
    }
  }
}