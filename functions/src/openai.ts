import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder' });

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
          
          For each slide, condense and format text for maximum readability and impact. Select appropriate icons, 
          and suggest relevant images or charts where applicable.
          
          Include these slide types as appropriate: title slide, section dividers, content layouts, 
          quote/statistic formats, and conclusion slides.
          
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
                    "title": "string",
                    "content": "string with bullet points using * as markers",
                    "background_color": "hex color code",
                    "suggested_visuals": "description of recommended images, icons, or charts",
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
      max_tokens: 3000
    });

    const result = JSON.parse(response.choices[0].message.content);
    // Return the first variant's slides if we can't get variants array
    return result.variants || [];
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

    return JSON.parse(response.choices[0].message.content);
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
