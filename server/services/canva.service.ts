import axios, { AxiosError, AxiosInstance } from 'axios';
import { CanvaDesign, CanvaTemplate, CanvaPage } from '../models/canva.model';

/**
 * Service class for handling Canva API interactions
 */
export class CanvaService {
  private apiClient: AxiosInstance;
  private apiUrl: string;
  private apiKey: string;
  private appId: string;

  /**
   * Creates a new instance of CanvaService
   */
  constructor() {
    this.apiUrl = 'https://api.canva.com/v1';
    this.apiKey = process.env.CANVA_API_KEY || '';
    this.appId = process.env.CANVA_APP_ID || '';

    // Create axios instance with default config
    this.apiClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Canva-App-Id': this.appId
      }
    });

    // Add response interceptor for logging
    this.apiClient.interceptors.response.use(
      response => response,
      error => {
        console.error(`Canva API Error (${error.config?.url || 'unknown'}):`, 
          error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Gets available templates from Canva
   * @param category Optional category to filter templates
   * @param limit Maximum number of templates to return
   * @returns List of Canva templates
   */
  async getTemplates(category?: string, limit: number = 10): Promise<CanvaTemplate[]> {
    try {
      const response = await this.apiClient.get('/templates', {
        params: { category, limit }
      });
      return response.data.templates || [];
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        throw new Error(`Failed to fetch templates: ${error.response.data.message || error.message}`);
      }
      throw new Error(`Failed to fetch templates: ${(error as Error).message}`);
    }
  }

  /**
   * Creates a new design from a template
   * @param templateId Template ID to use
   * @param title Title of the new design
   * @param brandKit Optional brand kit to apply
   * @returns The newly created design
   */
  async createDesignFromTemplate(
    templateId: string, 
    title: string, 
    brandKit?: string
  ): Promise<CanvaDesign> {
    try {
      const response = await this.apiClient.post('/designs', {
        templateId,
        title,
        brandKit
      });
      
      const data = response.data;
      return {
        designId: data.designId,
        title: title,
        editUrl: data.editUrl || '',
        thumbnailUrl: data.thumbnailUrl,
        createdAt: new Date()
      };
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        throw new Error(`Failed to create design: ${error.response.data.message || error.message}`);
      }
      throw new Error(`Failed to create design: ${(error as Error).message}`);
    }
  }

  /**
   * Creates a blank design
   * @param title Title of the new design
   * @returns The newly created design
   */
  async createBlankDesign(title: string): Promise<CanvaDesign> {
    try {
      const response = await this.apiClient.post('/designs', { title });
      
      const data = response.data;
      return {
        designId: data.designId,
        title: title,
        editUrl: data.editUrl || '',
        thumbnailUrl: data.thumbnailUrl,
        createdAt: new Date()
      };
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        throw new Error(`Failed to create blank design: ${error.response.data.message || error.message}`);
      }
      throw new Error(`Failed to create blank design: ${(error as Error).message}`);
    }
  }

  /**
   * Adds a page to a design
   * @param designId Design ID to add page to
   * @param title Title of the page
   * @param content Content for the page
   * @returns The newly created page
   */
  async addPageToDesign(
    designId: string, 
    title: string, 
    content: string
  ): Promise<CanvaPage> {
    try {
      const response = await this.apiClient.post(`/designs/${designId}/pages`, {
        title,
        content
      });
      
      return {
        pageId: response.data.pageId,
        title,
        content,
        thumbnailUrl: response.data.thumbnailUrl
      };
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        throw new Error(`Failed to add page: ${error.response.data.message || error.message}`);
      }
      throw new Error(`Failed to add page: ${(error as Error).message}`);
    }
  }

  /**
   * Gets details for a design
   * @param designId Design ID to get details for
   * @returns Design details
   */
  async getDesignDetails(designId: string): Promise<CanvaDesign> {
    try {
      const response = await this.apiClient.get(`/designs/${designId}`);
      
      const data = response.data;
      return {
        designId: data.designId,
        title: data.title || '',
        editUrl: data.editUrl || '',
        thumbnailUrl: data.thumbnailUrl,
        createdAt: new Date(data.createdAt || Date.now())
      };
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        throw new Error(`Failed to get design details: ${error.response.data.message || error.message}`);
      }
      throw new Error(`Failed to get design details: ${(error as Error).message}`);
    }
  }

  /**
   * Generates a presentation in Canva
   * @param title Title for the presentation
   * @param slides Array of slide content
   * @param templateId Optional template ID to use
   * @returns The created presentation
   */
  async generatePresentation(
    title: string, 
    slides: Array<{ title: string; content: string }>, 
    templateId?: string
  ): Promise<CanvaDesign> {
    try {
      // Create the design (from template or blank)
      const design = templateId 
        ? await this.createDesignFromTemplate(templateId, title)
        : await this.createBlankDesign(title);
      
      // Add each slide as a page
      for (const slide of slides) {
        await this.addPageToDesign(
          design.designId,
          slide.title,
          slide.content
        );
      }
      
      // Get the updated design details with editUrl
      return await this.getDesignDetails(design.designId);
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response) {
        throw new Error(`Failed to generate presentation: ${error.response.data.message || error.message}`);
      }
      throw new Error(`Failed to generate presentation: ${(error as Error).message}`);
    }
  }
}