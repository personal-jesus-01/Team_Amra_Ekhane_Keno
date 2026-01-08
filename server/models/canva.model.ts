/**
 * Models for Canva integration
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

export interface CanvaPage {
  pageId: string;
  title?: string;
  content?: string;
  thumbnailUrl?: string;
}

export interface CanvaError {
  statusCode: number;
  message: string;
  source?: string;
}