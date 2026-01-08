import axios from 'axios';
import { Request, Response } from 'express';

const CANVA_API_KEY = process.env.CANVA_API_KEY;
const CANVA_API_URL = 'https://api.canva.com/v1';

// Helper function to handle API errors consistently
const handleApiError = (error: unknown, res: Response, message: string) => {
  console.error(`Canva API Error - ${message}:`, error);
  const statusCode = axios.isAxiosError(error) && error.response ? error.response.status : 500;
  const errorMessage = axios.isAxiosError(error) && error.response 
    ? error.response.data.message || error.message 
    : 'Unknown error';
  
  res.status(statusCode).json({
    error: true,
    message: `${message}: ${errorMessage}`
  });
};

/**
 * Creates a new design in Canva from template
 * @param templateId The Canva template ID to use
 * @param title The title for the new design
 * @param brandKit Optional brand kit ID to apply
 * @returns The created design data
 */
export async function createDesignFromTemplate(templateId: string, title: string, brandKit?: string) {
  try {
    const response = await axios.post(
      `${CANVA_API_URL}/designs`,
      {
        templateId,
        title,
        brandKit
      },
      {
        headers: {
          'Authorization': `Bearer ${CANVA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error: unknown) {
    console.error('Error creating design from template:', error);
    throw error;
  }
}

/**
 * Get available templates from Canva
 * @param category Optional category to filter templates
 * @param limit Optional limit for number of templates to fetch
 * @returns List of available templates
 */
export async function getCanvaTemplates(category?: string, limit: number = 10) {
  try {
    const response = await axios.get(
      `${CANVA_API_URL}/templates`,
      {
        params: {
          category,
          limit
        },
        headers: {
          'Authorization': `Bearer ${CANVA_API_KEY}`
        }
      }
    );
    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching Canva templates:', error);
    throw error;
  }
}

/**
 * Generate a presentation in Canva based on content
 * @param title Presentation title
 * @param slides Array of slide content
 * @param templateId Optional template ID to use
 * @returns The created presentation data including edit URL
 */
export async function generateCanvaPresentation(title: string, slides: any[], templateId?: string) {
  try {
    // First create a new design (either from template or blank)
    const createResponse = templateId 
      ? await createDesignFromTemplate(templateId, title)
      : await axios.post(
          `${CANVA_API_URL}/designs`,
          { title },
          {
            headers: {
              'Authorization': `Bearer ${CANVA_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        ).then(res => res.data);
    
    const designId = createResponse.designId;
    
    // Now add slides based on content
    for (const slide of slides) {
      await axios.post(
        `${CANVA_API_URL}/designs/${designId}/pages`,
        {
          title: slide.title,
          content: slide.content,
          // Additional slide properties can be added here
        },
        {
          headers: {
            'Authorization': `Bearer ${CANVA_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Get the edit URL
    const detailResponse = await axios.get(
      `${CANVA_API_URL}/designs/${designId}`,
      {
        headers: {
          'Authorization': `Bearer ${CANVA_API_KEY}`
        }
      }
    );
    
    return {
      designId,
      editUrl: detailResponse.data.editUrl,
      title
    };
  } catch (error: unknown) {
    console.error('Error generating Canva presentation:', error);
    throw error;
  }
}

export function setupCanvaRoutes(app: any) {
  // Import requireAuth from routes.ts
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // Get Canva templates
  app.get('/api/canva/templates', requireAuth, async (req: Request, res: Response) => {
    try {
      const { category, limit = 10 } = req.query;
      const templates = await getCanvaTemplates(
        category as string | undefined, 
        parseInt(limit as string, 10)
      );
      res.json({ success: true, data: templates });
    } catch (error: unknown) {
      handleApiError(error, res, 'Failed to fetch Canva templates');
    }
  });

  // Create a presentation in Canva
  app.post('/api/canva/presentations', requireAuth, async (req: Request, res: Response) => {
    try {
      const { title, slides, templateId } = req.body;
      
      if (!title || !slides || !Array.isArray(slides)) {
        return res.status(400).json({ 
          error: true, 
          message: 'Missing required parameters: title and slides array' 
        });
      }
      
      const presentation = await generateCanvaPresentation(title, slides, templateId);
      res.json(presentation);
    } catch (error: unknown) {
      handleApiError(error, res, 'Failed to create Canva presentation');
    }
  });

  // Get design details
  app.get('/api/canva/designs/:designId', requireAuth, async (req: Request, res: Response) => {
    try {
      const { designId } = req.params;
      
      const response = await axios.get(
        `${CANVA_API_URL}/designs/${designId}`,
        {
          headers: {
            'Authorization': `Bearer ${CANVA_API_KEY}`
          }
        }
      );
      
      res.json(response.data);
    } catch (error: unknown) {
      handleApiError(error, res, 'Failed to get design details');
    }
  });
}