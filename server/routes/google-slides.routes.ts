import { Router } from 'express';
import { requireAuth } from '../auth';
import { fileUploadMiddleware } from '../ocr';
import { 
  generatePresentationWithGoogleSlides,
  generateFromDocument,
  createSlidesFromContent,
  getPresentationInfo
} from '../controllers/google-slides.controller';

const router = Router();

// Generate presentation with Google Slides from prompt
router.post('/generate', requireAuth, generatePresentationWithGoogleSlides);

// Generate presentation from uploaded document
router.post('/from-document', requireAuth, fileUploadMiddleware, generateFromDocument);

// Create Google Slides from existing content
router.post('/create-slides', requireAuth, createSlidesFromContent);

// Create Google Slides from file upload (used by frontend)
router.post('/create', requireAuth, fileUploadMiddleware, generateFromDocument);

// Create Google Slides from slides array (used by frontend)
router.post('/create-from-slides', requireAuth, createSlidesFromContent);

// Get presentation information
router.get('/:presentationId', requireAuth, getPresentationInfo);

export { router as googleSlidesRoutes };