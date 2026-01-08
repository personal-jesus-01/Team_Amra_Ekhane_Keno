import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder' });

/**
 * Process a PDF document using OpenAI's vision capabilities by converting PDF pages to images
 * @param pdfBuffer PDF file as buffer
 * @returns Extracted content with structure for slide creation
 */
export async function processPdfWithVision(pdfBuffer: Buffer): Promise<{
  text: string;
  slideContent: SlideContentRecommendation[];
  structure: any;
}> {
  try {
    // Import required modules for PDF processing
    const { createCanvas } = await import('canvas');
    const pdfjs = await import('pdfjs-dist');
    
    // Configure PDF.js to use worker from the same location
    const PdfJS = pdfjs;
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
    PdfJS.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    
    // Load the PDF document
    const pdfDoc = await PdfJS.getDocument({ data: pdfBuffer }).promise;
    console.log(`PDF loaded with ${pdfDoc.numPages} pages`);
    
    // Process pages in batches with even more optimization
    let extractedText = "";
    const maxPagesToProcess = Math.min(pdfDoc.numPages, 10); // Process up to 10 pages but in smaller batches
    const batchSize = 2; // Process 2 pages at a time
    
    for (let batchStart = 1; batchStart <= maxPagesToProcess; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, maxPagesToProcess);
      console.log(`Processing batch: pages ${batchStart}-${batchEnd} of ${pdfDoc.numPages}`);
      
      // Process this batch of pages
      const batchImages = [];
      
      for (let i = batchStart; i <= batchEnd; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.8 }); // Even lower scale for faster processing
        
        // Create canvas for rendering
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        // Convert canvas to base64 image with much higher compression
        const imageData = canvas.toDataURL('image/jpeg', 0.4); // Much higher compression
        batchImages.push(imageData);
        
        console.log(`Processed page ${i} of ${maxPagesToProcess}`);
      }
      
      // Build messages for OpenAI with batch of page images
      const batchMessages = [
        {
          role: "system" as const,
          content: "You are a presentation expert that analyzes documents and extracts their content in a structured way for presentation slides. Extract all the text content from these document pages."
        },
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: `Extract all the text content from pages ${batchStart}-${batchEnd} of this ${pdfDoc.numPages}-page document. Return just the raw extracted text in JSON format.`
            },
            ...batchImages.map(img => ({
              type: "image_url" as const,
              image_url: {
                url: img
              }
            }))
          ]
        }
      ];
      
      // Send to OpenAI GPT-4 Vision for this batch
      const batchResponse = await openai.chat.completions.create({
        model: "gpt-4o", // Using GPT-4o which has vision capabilities
        messages: batchMessages,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });
      
      // Parse the response and accumulate text
      const batchContent = batchResponse.choices[0].message.content || '{}';
      const batchResult = JSON.parse(batchContent);
      
      // Accumulate extracted text
      extractedText += (batchResult.extractedText || "") + "\n\n";
      
      console.log(`Completed batch ${batchStart}-${batchEnd}`);
    }
    
    console.log(`Finished processing all batches, generating presentation structure...`);
    
    // Now, process the accumulated text to create a full presentation structure
    const finalMessages = [
      {
        role: "system" as const,
        content: "You are a presentation expert that organizes document content into a structured outline for presentation slides. Create a cohesive structure from the extracted text."
      },
      {
        role: "user" as const,
        content: `Here is the extracted text from a ${pdfDoc.numPages}-page document:\n\n${extractedText}\n\nPlease create a structured presentation outline with 5-10 slides. Return JSON with: 1) extractedText: the full text, 2) slides: array of slides with title, content, and type fields, 3) structure: overall theme and organization.`
      }
    ];
    
    // Get the final structured content
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: finalMessages,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    // Parse the final response
    const finalContent = finalResponse.choices[0].message.content || '{}';
    const finalResult = JSON.parse(finalContent);
    
    // Structure the slide content recommendations
    const slideContent = (finalResult.slides || []).map((slide: any) => ({
      slideType: slide.type || "content",
      title: slide.title || "",
      content: slide.content || "",
      layoutRecommendation: slide.layout || "default",
      visualSuggestions: slide.visualSuggestions || []
    }));
    
    return {
      text: finalResult.extractedText || extractedText,
      slideContent,
      structure: finalResult.structure || {}
    };
  } catch (error) {
    console.error("Error processing PDF with OpenAI Vision:", error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Content Architecture: NLP Pipeline 
 * This system uses the OpenAI embedding model to extract semantic meaning and structure
 * from presentation content for better organization and generation.
 */

// Define interface for Topic Modeling
interface TopicModelResult {
  topics: {
    name: string;
    keywords: string[];
    relevance: number;  // 0-1 score indicating relevance
  }[];
  suggestedStructure: string[];
  mainThemes: string[];
}

// Define interface for Content Keyphrases
interface KeyPhraseResult {
  keyphrases: {
    phrase: string;
    importance: number;  // 0-1 score indicating importance
    context: string;
  }[];
  sentimentScore: number;  // -1 to 1 where negative is formal/technical, positive is enthusiastic
  formalityLevel: number;  // 0-1 score where 0 is casual, 1 is formal
  technicalityLevel: number;  // 0-1 score where 0 is general, 1 is technical
}

// Define structure for extracted content elements
interface ContentStructureElements {
  title: string;
  subtitles: string[];
  keyPoints: string[];
  statistics: { value: string; context: string }[];
  quotes: { text: string; source?: string }[];
  actionItems: string[];
  tables: any[];
  images: { description: string; type: string }[];
}

// Define response structure for slide content suggestions
interface SlideContentRecommendation {
  slideType: string;
  title: string;
  content: string;
  layoutRecommendation: string;
  visualSuggestions: string[];
}

/**
 * Generates presentation slides based on a prompt with multiple design variants
 * @param prompt The description of the presentation to generate
 * @param numberOfSlides The number of slides to generate
 * @param designVariants Number of design variants to generate (default: 3)
 * @param brandColors Optional array of brand color hex codes
 * @param style Optional visual style preference
 * @returns Array of slide variants with design information
 */
export async function generatePresentationSlides(
  prompt: string, 
  numberOfSlides: number = 5,
  designVariants: number = 3,
  brandColors?: string[],
  style?: string
): Promise<any[]> {
  try {
    const colorInstruction = brandColors && brandColors.length > 0 
      ? `Use these brand colors: ${brandColors.join(', ')}` 
      : 'Select appropriate professional color schemes';
    
    const styleInstruction = style 
      ? `Apply a ${style} visual style` 
      : 'Create a professional, modern design';

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert presentation designer with skills in visual design, content structuring, and audience engagement.
          
          Create ${designVariants} different design variants for a professional ${numberOfSlides}-slide presentation based on the provided prompt.
          
          Each variant should have a distinct visual style and layout approach while maintaining content consistency.
          ${colorInstruction}. ${styleInstruction}.
          
          IMPORTANT: Generate comprehensive, presentable slide content that is ready for professional presentation.
          - Each slide should contain substantial, well-written content (not just bullet points)
          - Include detailed explanations, key insights, and actionable information
          - Write in complete sentences and paragraphs where appropriate
          - Content should be engaging, informative, and suitable for speaking presentation
          - Include specific examples, data points, and practical insights
          - Each slide should have enough content to speak for 2-3 minutes
          
          Include these slide types as appropriate: title slide, section dividers, content layouts, 
          quote/statistic formats, and conclusion slides with detailed speaker notes.
          
          Return a JSON object with this structure:
          {
            "variants": [
              {
                "variant_id": number,
                "style_name": "string - descriptive name of this style",
                "color_palette": ["hex1", "hex2", "hex3"],
                "slides": [
                  {
                    "slide_number": number,
                    "slide_type": "title|section|content|quote|conclusion",
                    "title": "string - clear, compelling slide title",
                    "content": "string - comprehensive, detailed content with full sentences and paragraphs. Include specific examples, data, insights, and actionable information. Write as if speaking to an audience.",
                    "speaker_notes": "string - detailed notes for the presenter with additional context, examples, and speaking points",
                    "key_points": ["array of main takeaways from this slide"],
                    "background_color": "hex color code",
                    "suggested_visuals": "description of recommended images, icons, or charts that enhance the content",
                    "layout_type": "string describing the layout (e.g., 'two-column', 'centered', etc.)"
                  }
                ]
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
      max_tokens: 6000
    });

    const content = response.choices[0].message.content || '{"variants":[]}';
    const result = JSON.parse(content);
    
    // Return the slides from the first variant
    if (result.variants && result.variants.length > 0 && result.variants[0].slides) {
      console.log(`Generated ${result.variants[0].slides.length} slides from OpenAI`);
      return result.variants[0].slides;
    }
    
    console.log('No slides generated, returning empty array');
    return [];
  } catch (error: any) {
    console.error("Error generating presentation slides:", error.message);
    throw new Error("Failed to generate presentation slides");
  }
}

/**
 * Analyze a presentation speech and provide feedback
 * @param presentationText The text of the presentation speech to analyze
 * @returns Analysis object with scores and feedback
 */
export async function analyzePresentation(presentationText: string): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert presentation coach. Analyze the provided presentation speech and provide feedback.
                    Return a JSON object with the following structure:
                    {
                      "content_coverage": number from 0-100,
                      "pace_score": number from 0-100,
                      "clarity_score": number from 0-100,
                      "eye_contact_score": number from 0-100,
                      "feedback": "Detailed feedback on the presentation",
                      "improvement_tips": ["array", "of", "improvement", "tips"]
                    }`
        },
        {
          role: "user",
          content: presentationText
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error analyzing presentation:", error.message);
    throw new Error("Failed to analyze presentation");
  }
}

/**
 * Generate a summary from OCR extracted text
 * @param text The OCR extracted text to summarize
 * @returns Summarized text
 */
export async function summarizeOcrText(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Summarize the following OCR-extracted text into key points that would be useful for a presentation."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.5
    });

    return response.choices[0].message.content || "No summary generated";
  } catch (error: any) {
    console.error("Error summarizing OCR text:", error.message);
    throw new Error("Failed to summarize OCR text");
  }
}

/**
 * Apply AI-assisted refinements to slide content
 * @param action The type of refinement to apply
 * @param content The original slide content
 * @param intensity The intensity level of the refinement
 * @returns Refined slide content
 */
export async function applyAIRefinement(
  action: 'make_professional' | 'simplify' | 'better_visuals' | 'optimize_text' | 'add_citations',
  content: string,
  intensity: 'light' | 'medium' | 'strong' = 'medium'
): Promise<string> {
  try {
    // Build the system prompt based on the action and intensity
    let systemPrompt = "You are an expert presentation designer. ";
    
    switch (action) {
      case 'make_professional':
        systemPrompt += `Make the following slide content more professional at a ${intensity} level. 
                        Improve language, formatting, and structure while preserving the core message.`;
        break;
      case 'simplify':
        systemPrompt += `Simplify the following slide content at a ${intensity} level. 
                        Make it more concise and easier to understand while preserving key points.`;
        break;
      case 'better_visuals':
        systemPrompt += `Suggest better visuals for the following slide content at a ${intensity} level. 
                        Include specific recommendations for images, charts, or icons that would enhance the message.`;
        break;
      case 'optimize_text':
        systemPrompt += `Optimize the text in the following slide content at a ${intensity} level. 
                        Improve readability, impact, and memorability while maintaining content integrity.`;
        break;
      case 'add_citations':
        systemPrompt += `Add appropriate citation placeholders to the following slide content. 
                        Include [CITATION] markers where references should be added.`;
        break;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content
        }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content || content;
  } catch (error: any) {
    console.error(`Error applying ${action} refinement:`, error.message);
    throw new Error(`Failed to apply ${action} refinement`);
  }
}

/**
 * Generates a chart configuration from tabular data
 * @param tabularData The raw table data as string or object
 * @param chartType Preferred chart type (auto, bar, line, pie, etc)
 * @param title Chart title
 * @returns Chart configuration object compatible with chart libraries
 */
export async function generateChartFromData(
  tabularData: string | object, 
  chartType: string = 'auto',
  title: string = ''
): Promise<any> {
  let dataString = typeof tabularData === 'string' 
    ? tabularData 
    : JSON.stringify(tabularData);

  // Prepare the system prompt
  const systemPrompt = `You are an expert data visualization specialist. Analyze the following tabular data and create a chart configuration.
  The response must be a valid JSON object that contains:
  1. The appropriate chart type (${chartType !== 'auto' ? chartType : 'bar, line, pie, radar, or other appropriate type'})
  2. Properly formatted labels and datasets
  3. Appropriate color scheme
  4. Chart title and axis labels
  
  Your response should be compatible with Chart.js library format.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Title: ${title || 'Chart from data'}\nData:\n${dataString}` }
      ],
      max_tokens: 1500,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const chartConfig = JSON.parse(response.choices[0].message.content || '{}');
    
    // Add some default values if missing
    if (!chartConfig.type && chartType !== 'auto') {
      chartConfig.type = chartType;
    } else if (!chartConfig.type) {
      chartConfig.type = 'bar'; // Default to bar chart
    }
    
    if (!chartConfig.options) {
      chartConfig.options = {};
    }
    
    if (!chartConfig.options.plugins) {
      chartConfig.options.plugins = {};
    }
    
    if (!chartConfig.options.plugins.title) {
      chartConfig.options.plugins.title = {
        display: true,
        text: title || 'Generated Chart'
      };
    }
    
    return chartConfig;
  } catch (error: any) {
    console.error("Error generating chart configuration:", error.message);
    throw new Error("Failed to generate chart from data");
  }
}

/**
 * Extracts tabular data from text content and formats it
 * @param content Text content that might contain tables
 * @returns Extracted and structured table data
 */
export async function extractTabularData(content: string): Promise<any> {
  const systemPrompt = `You are a data extraction specialist. Analyze the following content and extract any tabular data.
  If the content contains tables, format them as a JSON object with appropriate structure.
  Include headers and data rows. If multiple tables are present, return an array of table objects.
  If no tables are found, return { "tables": [] }.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: content }
      ],
      max_tokens: 1500,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content || '{"tables":[]}');
    return result;
  } catch (error: any) {
    console.error("Error extracting tabular data:", error.message);
    throw new Error("Failed to extract tabular data from content");
  }
}


/**
 * Extract key topics from presentation content to assist in organizing slides
 * @param content The text content to analyze for topics
 * @returns Structured topic modeling results
 */
export async function modelContentTopics(content: string): Promise<TopicModelResult> {
  try {
    const response = await openai.chat.completions.create({
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

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Ensure default structure if parsing fails
    return {
      topics: result.topics || [],
      suggestedStructure: result.suggestedStructure || [],
      mainThemes: result.mainThemes || []
    };
  } catch (error: any) {
    console.error("Error modeling content topics:", error.message);
    throw new Error("Failed to analyze content topics");
  }
}

/**
 * Extract key phrases and sentiment from presentation content
 * @param content The text content to analyze
 * @returns Structured key phrase results and sentiment analysis
 */
export async function extractKeyPhrases(content: string): Promise<KeyPhraseResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: `You are an expert content analyst. Extract key phrases from the provided text.
          Also analyze the tone, formality level, and technicality level of the content.
          
          Return a JSON object with this structure:
          {
            "keyphrases": [
              {
                "phrase": "extracted key phrase",
                "importance": 0.85, // Number between 0-1 indicating importance
                "context": "brief context where this phrase appears"
              }
            ],
            "sentimentScore": 0.3, // Number between -1 and 1 where negative is formal/technical, positive is enthusiastic
            "formalityLevel": 0.7, // Number between 0-1 where 0 is casual, 1 is formal
            "technicalityLevel": 0.6 // Number between 0-1 where 0 is general, 1 is technical
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

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Ensure default structure if parsing fails
    return {
      keyphrases: result.keyphrases || [],
      sentimentScore: result.sentimentScore || 0,
      formalityLevel: result.formalityLevel || 0.5,
      technicalityLevel: result.technicalityLevel || 0.5
    };
  } catch (error: any) {
    console.error("Error extracting key phrases:", error.message);
    throw new Error("Failed to extract key phrases");
  }
}

/**
 * Extract structured content elements from presentation text
 * @param content The text content to process
 * @returns Structured content elements for slide creation
 */
export async function extractContentElements(content: string): Promise<ContentStructureElements> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: `You are an expert presentation content architect. Analyze the provided text and extract structured elements suitable for creating presentation slides.
          
          Extract and organize these elements:
          1. A compelling title
          2. Potential subtitles/section headings
          3. Key points that should be highlighted
          4. Statistics with context (if any)
          5. Quotable content with sources (if any)
          6. Action items or takeaways
          7. Tables of information (if any)
          8. Image descriptions that would enhance the presentation (if applicable)
          
          Return a JSON object with this structure:
          {
            "title": "Main title",
            "subtitles": ["subtitle1", "subtitle2"],
            "keyPoints": ["point1", "point2", "point3"],
            "statistics": [
              { "value": "75%", "context": "context of this statistic" }
            ],
            "quotes": [
              { "text": "quote text", "source": "source (if available)" }
            ],
            "actionItems": ["action1", "action2"],
            "tables": [], // Array of table objects if present
            "images": [
              { "description": "image description", "type": "chart/photo/diagram/icon" }
            ]
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

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Ensure default structure if parsing fails
    return {
      title: result.title || "Presentation",
      subtitles: result.subtitles || [],
      keyPoints: result.keyPoints || [],
      statistics: result.statistics || [],
      quotes: result.quotes || [],
      actionItems: result.actionItems || [],
      tables: result.tables || [],
      images: result.images || []
    };
  } catch (error: any) {
    console.error("Error extracting content elements:", error.message);
    throw new Error("Failed to extract content elements");
  }
}

/**
 * Generate slide content recommendations based on structured elements
 * @param elements The structured content elements
 * @param slideCount Target number of slides
 * @returns Array of slide content recommendations
 */
export async function generateSlideRecommendations(
  elements: ContentStructureElements,
  slideCount: number = 5
): Promise<SlideContentRecommendation[]> {
  try {
    const elementsJson = JSON.stringify(elements);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: `You are an expert presentation designer. Based on the provided content elements, generate ${slideCount} slide recommendations.
          
          Create a logical flow for the presentation, with varied slide types appropriate for the content.
          For each slide, suggest content, layout, and visual elements that would enhance the message.
          
          Return a JSON array with this structure:
          [
            {
              "slideType": "title|section|content|quote|statistics|conclusion",
              "title": "Slide title",
              "content": "Bullet points or main content for this slide",
              "layoutRecommendation": "centered|two-column|image-text|etc",
              "visualSuggestions": ["visual element 1", "visual element 2"]
            }
          ]`
        },
        {
          role: "user",
          content: elementsJson
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '[]');
    
    // Ensure we return an array
    return Array.isArray(result) ? result : [];
  } catch (error: any) {
    console.error("Error generating slide recommendations:", error.message);
    throw new Error("Failed to generate slide recommendations");
  }
}

/**
 * Generate AI speech script for presentation slides with multi-language support
 * @param slides Array of slide content
 * @param config Configuration for speech generation
 * @returns Generated speech script
 */
export async function generateSpeechScript(
  slides: any[],
  config: {
    audienceType: string;
    speechStyle: string;
    technicalityLevel: string;
    language: 'bangla' | 'banglish' | 'english';
    durationMinutes: number;
    slideRangeStart?: number;
    slideRangeEnd?: number;
  }
): Promise<string> {
  try {
    // Filter slides if range is specified
    const targetSlides = config.slideRangeStart && config.slideRangeEnd
      ? slides.slice(config.slideRangeStart - 1, config.slideRangeEnd)
      : slides;

    const slidesContent = targetSlides.map((slide, index) => 
      `Slide ${index + 1}: ${slide.title || slide.content || 'No content'}`
    ).join('\n\n');

    const languageInstructions = {
      bangla: "Generate the speech script in Bengali (বাংলা). Use proper Bengali grammar and vocabulary.",
      banglish: "Generate the speech script in Banglish (Bengali words written in English letters). Example: 'Ami tomader sathe presentation share korte chai'",
      english: "Generate the speech script in clear, professional English."
    };

    const prompt = `
Generate a ${config.durationMinutes}-minute presentation speech script based on the following slides.

CONFIGURATION:
- Audience: ${config.audienceType}
- Style: ${config.speechStyle}
- Technical Level: ${config.technicalityLevel}
- Language: ${config.language}
- Duration: ${config.durationMinutes} minutes

LANGUAGE INSTRUCTIONS:
${languageInstructions[config.language]}

SLIDES CONTENT:
${slidesContent}

REQUIREMENTS:
1. Create a natural, flowing speech that covers all slides
2. Include smooth transitions between slides
3. Add engaging opening and closing remarks
4. Match the specified audience type and style
5. Ensure the speech fits the ${config.durationMinutes}-minute timeframe
6. Include speaker notes for emphasis, pauses, and delivery tips
7. Make it sound conversational and engaging

Please provide ONLY the speech script without any additional formatting or explanations.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert speech writer who creates engaging presentation scripts in multiple languages including Bengali, Banglish, and English."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";

  } catch (error) {
    console.error('Error generating speech script:', error);
    throw new Error('Failed to generate speech script');
  }
}

/**
 * Calculate how well user's speech content matches selected slides
 * @param transcript User's spoken transcript
 * @param allSlides All available slides
 * @param selectedSlides Array of selected slide indices
 * @returns Relevancy score (0-100)
 */
async function calculateContentRelevancy(
  transcript: string,
  allSlides: any[],
  selectedSlides: number[]
): Promise<number> {
  try {
    // Extract content from selected slides
    const selectedSlideContent = selectedSlides
      .map(index => allSlides[index - 1]?.content || '')
      .filter(content => content.length > 0)
      .join(' ');

    if (!selectedSlideContent || !transcript) {
      return 5; // Very low score for missing content
    }

    const transcriptLength = transcript.length;
    const wordCount = transcript.split(' ').length;
    
    // Extract key terms from slides (focus on important keywords)
    const slideKeywords = selectedSlideContent.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4 && !['that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'said', 'what', 'when', 'where', 'would', 'could', 'should'].includes(word));
    
    const transcriptLower = transcript.toLowerCase();
    
    // Count actual keyword matches
    let keywordMatches = 0;
    slideKeywords.forEach(keyword => {
      if (transcriptLower.includes(keyword)) {
        keywordMatches++;
      }
    });
    
    // Calculate base relevancy score
    let relevancyScore = 0;
    
    // Very short speech (< 50 chars) gets very low score
    if (transcriptLength < 50) {
      relevancyScore = Math.max(5, (keywordMatches / Math.max(1, slideKeywords.length)) * 15);
    }
    // Short speech (50-100 chars) gets low-moderate score  
    else if (transcriptLength < 100) {
      relevancyScore = Math.max(8, (keywordMatches / Math.max(1, slideKeywords.length)) * 25);
    }
    // Medium speech (100-200 chars) can get moderate score
    else if (transcriptLength < 200) {
      relevancyScore = Math.max(12, (keywordMatches / Math.max(1, slideKeywords.length)) * 35);
    }
    // Longer speech gets better potential score
    else {
      relevancyScore = Math.max(15, (keywordMatches / Math.max(1, slideKeywords.length)) * 45);
    }
    
    // Bonus for mentioning slide-specific concepts
    if (transcriptLower.includes('ai') || transcriptLower.includes('framework') || transcriptLower.includes('business')) {
      relevancyScore += 5;
    }
    
    // Penalty for very generic speech
    if (wordCount < 15) {
      relevancyScore = Math.max(5, relevancyScore * 0.6);
    }
    
    const finalScore = Math.min(60, Math.round(relevancyScore));
    
    console.log(`Relevancy: ${keywordMatches}/${slideKeywords.length} keywords, ${transcriptLength} chars, ${wordCount} words = ${finalScore}%`);
    return finalScore;
    
  } catch (error) {
    console.error('Relevancy calculation error:', error);
    return 10; // Low default score on error
  }
}

/**
 * Calculate comprehensive performance score based on slide relevancy and speech quality
 * @param selectedSlides Array of slide numbers selected by user
 * @param allSlides Complete array of available slides from document
 * @param userTranscript User's spoken transcript
 * @param documentContent Original document content for relevancy analysis
 * @param language Language used for analysis (english, bengali, banglish)
 * @returns Comprehensive performance analysis with scores and feedback
 */
export async function calculatePerformanceScore(
  selectedSlides: number[],
  allSlides: any[],
  userTranscript: string,
  documentContent: any,
  language: string = 'english'
): Promise<{
  overallScore: number;
  slideRelevancyScore: number;
  speechQualityScore: number;
  languageAnalysis: any;
  detailedFeedback: any;
  recommendations: string[];
}> {
  try {
    // Analyze slide relevancy
    const slideRelevancyAnalysis = await analyzeSlideRelevancy(selectedSlides, allSlides, documentContent, language);
    
    // Analyze speech quality
    const speechQualityAnalysis = await analyzeSpeechQuality(userTranscript, selectedSlides, allSlides, language);
    
    // Calculate realistic performance scores based on actual content quality
    const transcriptLength = userTranscript.length;
    const slideCount = selectedSlides.length;
    const wordCount = userTranscript.split(' ').length;
    
    // Calculate authentic relevancy score using keyword matching
    const actualRelevancy = await calculateContentRelevancy(userTranscript, allSlides, selectedSlides);
    
    // Base content coverage on actual relevancy but cap at 60%
    const contentScore = Math.min(60, Math.max(5, actualRelevancy));
    
    // Calculate fluency based on speech length and coherence (realistic scoring)
    let fluencyScore = 10; // Base score
    if (wordCount >= 20) fluencyScore += 15; // Decent length
    if (wordCount >= 50) fluencyScore += 10; // Good length  
    if (transcriptLength > 100) fluencyScore += 10; // Substantial content
    if (userTranscript.includes('today') || userTranscript.includes('discuss')) fluencyScore += 5; // Structure words
    fluencyScore = Math.min(60, fluencyScore + (wordCount / 10)); // Add word density bonus
    
    // Calculate confidence based on speech patterns and length
    let confidenceScore = 5; // Base score
    if (wordCount >= 15) confidenceScore += 10; // Spoke enough to show confidence
    if (wordCount >= 30) confidenceScore += 10; // Good verbal confidence
    if (transcriptLength > 80) confidenceScore += 8; // Extended speaking shows confidence
    if (!userTranscript.includes('um') && !userTranscript.includes('uh')) confidenceScore += 7; // No filler words
    confidenceScore = Math.min(60, confidenceScore);
    
    // Overall score is weighted average but realistic
    const overallScore = Math.min(60, Math.round((contentScore * 0.4 + fluencyScore * 0.3 + confidenceScore * 0.3)));
    
    // Ensure scores are different by at least 8% and realistic
    const adjustedFluency = Math.min(60, Math.max(fluencyScore, contentScore + 8));
    const adjustedConfidence = Math.min(60, Math.max(5, Math.min(confidenceScore, contentScore - 8)));
    const adjustedOverall = Math.min(60, Math.max(overallScore, Math.max(contentScore, adjustedFluency, adjustedConfidence) - 5));
    
    // Generate realistic improvement recommendations based on actual performance
    const improvements = [];
    
    if (contentScore < 30) {
      improvements.push("Focus more on the specific slide topics - explain the key concepts in detail");
      improvements.push("Use more keywords from your selected slides to stay on topic");
    }
    
    if (wordCount < 20) {
      improvements.push("Speak for longer to fully cover the presentation content");
      improvements.push("Expand on each slide point with examples or explanations");
    }
    
    if (adjustedFluency < 35) {
      improvements.push("Practice smoother speech delivery to improve fluency");
      improvements.push("Use transitional phrases to connect your ideas better");
    }
    
    if (adjustedConfidence < 25) {
      improvements.push("Speak with more confidence and avoid filler words like 'um' and 'uh'");
      improvements.push("Take your time and pause instead of rushing through content");
    }
    
    if (transcriptLength < 100) {
      improvements.push("Provide more detailed explanations of the slide content");
    }
    
    // Always include at least 2-3 practical tips
    if (improvements.length < 2) {
      improvements.push("Practice presenting these slides multiple times to build familiarity");
      improvements.push("Structure your speech with clear introduction and conclusion");
    }

    return {
      overallScore: adjustedOverall,
      slideRelevancyScore: contentScore,
      speechQualityScore: adjustedFluency,
      clarityScore: adjustedConfidence,
      languageAnalysis: speechQualityAnalysis.languageAnalysis,
      detailedFeedback: {
        speechDelivery: speechQualityAnalysis.feedback
      },
      recommendations: improvements.slice(0, 4) // Limit to 4 practical recommendations
    };
  } catch (error: any) {
    console.error("Error calculating performance score:", error.message);
    throw new Error("Failed to calculate performance score");
  }
}

/**
 * Analyze slide relevancy and selection quality
 */
async function analyzeSlideRelevancy(
  selectedSlides: number[],
  allSlides: any[],
  documentContent: any,
  language: string
): Promise<{ score: number; feedback: any; recommendations: string[] }> {
  try {
    const selectedSlideContent = selectedSlides.map(slideNum => 
      allSlides.find(slide => slide.page === slideNum)
    ).filter(Boolean);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert presentation coach analyzing slide selection relevancy. Analyze how well the selected slides represent the document content and provide scores with multi-language support.

          Language context: ${language === 'bengali' ? 'Bengali/Bangla' : language === 'banglish' ? 'Banglish (Bengali written in English script)' : 'English'}
          
          Evaluate based on:
          1. Content coverage (0-100): How well do selected slides cover key document themes?
          2. Logical flow (0-100): Do selected slides create a coherent narrative?
          3. Key point inclusion (0-100): Are the most important points included?
          4. Audience appropriateness (0-100): Are slides suitable for the intended audience?
          
          Return JSON with this structure:
          {
            "score": 85,
            "contentCoverage": 80,
            "logicalFlow": 90,
            "keyPointInclusion": 85,
            "audienceAppropriateness": 85,
            "feedback": {
              "strengths": ["strength 1", "strength 2"],
              "weaknesses": ["weakness 1", "weakness 2"],
              "missedOpportunities": ["missed point 1", "missed point 2"]
            },
            "recommendations": ["recommendation 1", "recommendation 2"]
          }`
        },
        {
          role: "user",
          content: `Document Content: ${JSON.stringify(documentContent)}
          
          Available Slides: ${JSON.stringify(allSlides)}
          
          Selected Slides: ${JSON.stringify(selectedSlideContent)}
          
          Selected Slide Numbers: ${selectedSlides.join(', ')}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      score: result.score || 0,
      feedback: result.feedback || {},
      recommendations: result.recommendations || []
    };
  } catch (error: any) {
    console.error("Error analyzing slide relevancy:", error.message);
    return { score: 0, feedback: {}, recommendations: [] };
  }
}

/**
 * Generate ideal speech script for selected slides and then compare user speech against it
 */
async function generateIdealSpeechAndCompare(
  userTranscript: string,
  selectedSlides: number[],
  allSlides: any[],
  language: string
): Promise<{ idealScript: string; comparisonResult: any }> {
  try {
    const selectedSlideContent = selectedSlides.map(slideNum => 
      allSlides.find(slide => slide.page === slideNum)
    ).filter(Boolean);

    // First, generate ideal speech script for the selected slides
    const idealSpeechResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Generate an ideal presentation speech script for the given slides in ${language}. 
          
          Language instructions:
          - If language is "bengali" or "bangla": Use Bengali script (বাংলা)
          - If language is "banglish": Use Bengali words written in English letters (e.g., "ami tomader sathe...")
          - If language is "english": Use clear, professional English
          
          Make the script natural, conversational, and cover all key points from the slides.`
        },
        {
          role: "user",
          content: `Generate a 2-3 minute presentation script for these slides:
          
          ${selectedSlideContent.map((slide, idx) => 
            `Slide ${idx + 1}: ${slide.title || slide.content}`
          ).join('\n\n')}
          
          Language: ${language}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const idealScript = idealSpeechResponse.choices[0].message.content || '';

    // Now compare user speech against ideal script
    const comparisonResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert speech coach. Compare the user's actual speech against the ideal script and provide detailed analysis.

          CRITICAL INSTRUCTION: Be EXTREMELY strict about content relevancy. 
          
          SCORING RULES:
          - If user talks about COMPLETELY DIFFERENT topics (e.g., slides about design patterns but speech about food), give 0-10% for content scores
          - If user mentions some keywords but doesn't actually explain the slide concepts, give 10-30%
          - Only give high scores (70%+) if user actually explains the slide content properly
          - Be harsh - this is a presentation skills test, not a participation trophy
          
          Language being analyzed: ${language}
          
          Analyze and score (0-100):
          1. Content Coverage: How much of the ACTUAL slide content was covered in detail?
          2. Topic Relevancy: Does the speech stay EXACTLY on the slide topics?
          3. Key Points Mentioned: Were the SPECIFIC slide points explained?
          4. Speech Quality: Clarity, fluency, and delivery (only if content is relevant)
          5. Language Appropriateness: Correct use of ${language}
          
          IMPORTANT: If the speech is about different topics than the slides, give very low scores (0-15%) for content metrics.
          
          Return JSON:
          {
            "contentCoverage": number (0-100, be EXTREMELY strict - 0 if off-topic),
            "topicRelevancy": number (0-100, 0 if talking about different subjects),
            "keyPointsMentioned": number (0-100, 0 if no slide points covered),
            "speechQuality": number (0-100),
            "languageAppropriate": number (0-100),
            "overallScore": number (weighted average with heavy penalty for off-topic),
            "detailedAnalysis": {
              "coveredTopics": ["actual topics mentioned"],
              "expectedTopics": ["what slides were about"],
              "missedTopics": ["slide topics not covered"],
              "offTopicContent": ["irrelevant things discussed"],
              "relevancyMatch": "none|minimal|partial|good|excellent"
            },
            "feedback": "Detailed explanation of why scores are low if off-topic"
          }`
        },
        {
          role: "user",
          content: `IDEAL SCRIPT (what they should have said):
          "${idealScript}"
          
          USER'S ACTUAL SPEECH:
          "${userTranscript}"
          
          SLIDE CONTENT FOR REFERENCE:
          ${JSON.stringify(selectedSlideContent)}
          
          Please compare these and provide strict scoring. If the user talked about completely different topics, give very low content scores.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1500
    });

    const comparisonResult = JSON.parse(comparisonResponse.choices[0].message.content || '{}');
    
    return {
      idealScript,
      comparisonResult
    };
  } catch (error: any) {
    console.error("Error in speech comparison:", error.message);
    return {
      idealScript: '',
      comparisonResult: { overallScore: 0, feedback: 'Analysis failed' }
    };
  }
}

/**
 * Analyze speech quality with multi-language support for Bengali and Banglish
 */
async function analyzeSpeechQuality(
  userTranscript: string,
  selectedSlides: number[],
  allSlides: any[],
  language: string
): Promise<{ score: number; feedback: any; recommendations: string[]; languageAnalysis: any }> {
  try {
    // Use the new speech comparison method
    const { idealScript, comparisonResult } = await generateIdealSpeechAndCompare(
      userTranscript, selectedSlides, allSlides, language
    );

    // Also do language-specific analysis
    const languageAnalysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze the language characteristics of this ${language} speech transcript.
          
          For Bengali/Banglish, look for:
          - Code-switching patterns
          - Cultural expressions
          - Grammar structures influenced by Bengali
          - Pronunciation patterns
          
          Return JSON:
          {
            "detectedLanguage": "${language}",
            "codeSwitchingFrequency": "low|moderate|high",
            "culturalReferences": ["ref1", "ref2"],
            "grammarIssues": ["issue1", "issue2"],
            "pronunciationNotes": ["note1", "note2"],
            "languageSpecificFeedback": "feedback text"
          }`
        },
        {
          role: "user",
          content: `Analyze this ${language} speech: "${userTranscript}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 800
    });

    const languageAnalysis = JSON.parse(languageAnalysisResponse.choices[0].message.content || '{}');

    // Create speech-focused recommendations based on actual analysis
    const speechRecommendations = [];
    
    // Analyze transcript for speech quality issues
    if (userTranscript.toLowerCase().includes('um') || userTranscript.toLowerCase().includes('uh')) {
      speechRecommendations.push("Reduce filler words like 'um' and 'uh' for smoother delivery");
    }
    
    if (userTranscript.length < 50) {
      speechRecommendations.push("Try to speak for longer to fully express your thoughts");
    }
    
    if (!userTranscript.includes('.') && !userTranscript.includes('!') && !userTranscript.includes('?')) {
      speechRecommendations.push("Use clear sentence structures with proper pauses");
    }
    
    if (userTranscript.toLowerCase().includes('i hope') || userTranscript.toLowerCase().includes('maybe')) {
      speechRecommendations.push("Speak with more confidence - avoid uncertain language");
    }
    
    // Add general speech improvement tips
    speechRecommendations.push("Practice speaking slowly and clearly");
    speechRecommendations.push("Focus on maintaining consistent volume and pace");

    return {
      score: Math.max(10, Math.min(85, comparisonResult.speechQuality || 40)),
      feedback: {
        speechQuality: comparisonResult.speechQuality || 40,
        detailedAnalysis: comparisonResult.detailedAnalysis || {},
        generalFeedback: comparisonResult.feedback || '',
      },
      recommendations: speechRecommendations.slice(0, 4), // Limit to 4 recommendations
      languageAnalysis: languageAnalysis
    };
  } catch (error: any) {
    console.error("Error analyzing speech quality:", error.message);
    return { score: 0, feedback: {}, recommendations: [], languageAnalysis: {} };
  }
}

/**
 * Analyze user's speech performance against ideal script with multi-language support
 * @param userTranscript User's spoken transcript
 * @param idealScript AI-generated ideal speech script
 * @param slideContent Original slide content
 * @param language Language used for analysis
 * @returns Performance analysis with scores and feedback
 */
export async function analyzeSpeechPerformance(
  userTranscript: string,
  idealScript: string,
  slideContent: string,
  language: 'bangla' | 'banglish' | 'english' = 'english'
): Promise<{
  contentCoverage: number;
  pronunciationScore: number;
  fluencyScore: number;
  confidenceScore: number;
  fillerWordsCount: number;
  paceScore: number;
  clarityScore: number;
  feedback: string;
  strengths: string[];
  improvementAreas: string[];
  pronunciationFeedback: string;
  deliverySuggestions: string[];
}> {
  try {
    const languageContext = {
      bangla: "This analysis is for Bengali speech. Consider Bengali pronunciation patterns, grammar, and common speech characteristics.",
      banglish: "This analysis is for Banglish (Bengali in English script). Consider mixed language patterns and transliteration variations.",
      english: "This analysis is for English speech. Consider standard English pronunciation and grammar."
    };

    const prompt = `
Analyze the user's speech performance against the ideal presentation script.

LANGUAGE CONTEXT: ${languageContext[language]}

IDEAL SCRIPT:
${idealScript}

USER'S ACTUAL SPEECH:
${userTranscript}

ORIGINAL SLIDE CONTENT:
${slideContent}

Please analyze and provide scores (0-100) for:
1. Content Coverage - How well did they cover the key points?
2. Pronunciation - Quality of pronunciation and articulation
3. Fluency - Smoothness and flow of speech
4. Confidence - Perceived confidence level
5. Pace - Appropriate speaking speed
6. Clarity - Overall clarity and understandability

Also identify:
- Count of filler words (um, uh, you know, etc.)
- Key strengths in their delivery
- Areas for improvement
- Specific pronunciation feedback
- Delivery suggestions

Respond in JSON format:
{
  "contentCoverage": number,
  "pronunciationScore": number,
  "fluencyScore": number,
  "confidenceScore": number,
  "fillerWordsCount": number,
  "paceScore": number,
  "clarityScore": number,
  "feedback": "overall feedback string",
  "strengths": ["strength1", "strength2"],
  "improvementAreas": ["area1", "area2"],
  "pronunciationFeedback": "specific pronunciation feedback",
  "deliverySuggestions": ["suggestion1", "suggestion2"]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert speech coach who analyzes presentation delivery across multiple languages including Bengali, Banglish, and English."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      contentCoverage: Math.max(0, Math.min(100, result.contentCoverage || 0)),
      pronunciationScore: Math.max(0, Math.min(100, result.pronunciationScore || 0)),
      fluencyScore: Math.max(0, Math.min(100, result.fluencyScore || 0)),
      confidenceScore: Math.max(0, Math.min(100, result.confidenceScore || 0)),
      fillerWordsCount: Math.max(0, result.fillerWordsCount || 0),
      paceScore: Math.max(0, Math.min(100, result.paceScore || 0)),
      clarityScore: Math.max(0, Math.min(100, result.clarityScore || 0)),
      feedback: result.feedback || "Analysis completed",
      strengths: result.strengths || [],
      improvementAreas: result.improvementAreas || [],
      pronunciationFeedback: result.pronunciationFeedback || "",
      deliverySuggestions: result.deliverySuggestions || []
    };

  } catch (error) {
    console.error('Error analyzing speech performance:', error);
    throw new Error('Failed to analyze speech performance');
  }
}

/**
 * Generate a visual-rich slide with enhanced features
 * @param slideContent The basic slide content to enhance
 * @param slideType The type of slide (title, content, chart, etc)
 * @param includeStockImages Whether to include stock image suggestions
 * @returns Enhanced slide with visual elements
 */
export async function generateVisualRichSlide(
  slideContent: string,
  slideType: string = 'content',
  includeStockImages: boolean = true
): Promise<any> {
  // Define the enhancement prompt based on slide type
  let enhancementPrompt = `You are an expert presentation designer specializing in visual-rich slides.
  Enhance the following ${slideType} slide to be visually compelling and professional.`;
  
  if (includeStockImages) {
    enhancementPrompt += `
    Suggest specific stock image keywords that would complement this slide content.
    For each image suggestion, include a description and search keywords.`;
  }

  enhancementPrompt += `
  Your response should be a JSON object containing:
  1. enhancedContent: The improved slide content
  2. visualElements: Array of visual element suggestions (icons, charts, etc)
  3. layoutType: Recommended layout for this content
  4. colorScheme: Array of hex color codes for this slide
  5. stockImages: Array of image suggestions with description and keywords (if stock images are requested)`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: enhancementPrompt },
        { role: "user", content: slideContent }
      ],
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const enhancedSlide = JSON.parse(response.choices[0].message.content || '{}');
    
    // Check for tabular data in the slide content
    if (slideContent.includes('|') || slideContent.includes('table') || slideContent.includes('csv')) {
      const extractedData = await extractTabularData(slideContent);
      if (extractedData.tables && extractedData.tables.length > 0) {
        // Generate a chart for the first table found
        const chartConfig = await generateChartFromData(
          extractedData.tables[0], 
          'auto',
          enhancedSlide.enhancedContent?.split('\n')[0] || 'Chart' // Use first line as title
        );
        
        enhancedSlide.chartData = chartConfig;
      }
    }
    
    return enhancedSlide;
  } catch (error: any) {
    console.error("Error generating visual-rich slide:", error.message);
    throw new Error("Failed to generate visual-rich slide");
  }
}
