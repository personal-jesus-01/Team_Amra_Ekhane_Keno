/**
 * Client-side models for Canva integration
 */

export interface CanvaTemplate {
  id: string;
  name: string;
  thumbnail_url?: string;
  category?: string;
  description?: string;
}

export interface CanvaDesign {
  designId: string;
  title: string;
  editUrl: string;
  thumbnailUrl?: string;
  createdAt: Date;
}

export interface CanvaSlide {
  title: string;
  content: string;
}

export interface CreatePresentationRequest {
  title: string;
  slides: CanvaSlide[];
  templateId?: string;
}

export interface CanvaError {
  error: boolean;
  message: string;
}