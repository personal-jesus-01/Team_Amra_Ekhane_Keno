import { Request, Response } from 'express';
import multer from 'multer';
import { extractTextFromDocument } from './ocr';

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * Direct OCR handler that doesn't require authentication
 * This is used for the OCR test page
 * 
 * @param req Express request
 * @param res Express response
 */
export async function handleDirectOcr(req: Request, res: Response) {
  try {
    // Use multer to handle file upload
    upload.single('file')(req, res, async (err: any) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ 
          error: true, 
          message: `File upload error: ${err.message}` 
        });
      }
      
      if (!req.file) {
        return res.status(400).json({ 
          error: true, 
          message: 'No file uploaded' 
        });
      }
      
      try {
        // Extract text from document using OCR
        const text = await extractTextFromDocument(
          req.file.buffer,
          req.file.mimetype
        );
        
        // Return extracted text
        return res.json({ 
          success: true,
          text,
          length: text.length,
          fileType: req.file.mimetype
        });
      } catch (ocrError) {
        console.error('OCR extraction error:', ocrError);
        const errorMessage = ocrError instanceof Error ? ocrError.message : 'Unknown OCR error';
        return res.status(500).json({
          error: true,
          message: `Failed to extract text: ${errorMessage}`
        });
      }
    });
  } catch (error) {
    console.error('Unexpected OCR error:', error);
    return res.status(500).json({ 
      error: true, 
      message: 'An unexpected error occurred processing your request' 
    });
  }
}