import multer from "multer";
import { createWorker } from "tesseract.js";
import { summarizeOcrText } from "./openai";
import * as mammoth from 'mammoth';
import * as officeGen from 'officegen';
// Import pdf-parse with a dynamic import to be used later
// This prevents the issue with the missing test file

// TypeScript interfaces for specific packages
interface TesseractWorker {
  loadLanguage(lang: string): Promise<any>;
  initialize(lang: string): Promise<any>;
  recognize(buffer: Buffer): Promise<{ data: { text: string } }>;
  terminate(): Promise<any>;
}

// Configure multer storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  }
});

// Middleware for file upload
export const fileUploadMiddleware = upload.single('file');

/**
 * Determines the file type and routes to the appropriate extraction method
 * @param buffer The file buffer
 * @param mimetype The file's mimetype
 * @returns Extracted text
 */
export async function extractTextFromDocument(buffer: Buffer, mimetype: string): Promise<string> {
  try {
    if (mimetype === 'application/pdf') {
      return await extractTextFromPdf(buffer);
    } else if (mimetype.startsWith('image/')) {
      return await extractTextFromImage(buffer);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      // Handle PPTX files
      return await extractTextFromPptx(buffer);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Handle DOCX files 
      return await extractTextFromDocx(buffer);
    } else {
      throw new Error(`Unsupported file type: ${mimetype}`);
    }
  } catch (error) {
    console.error("Document processing error:", error);
    throw new Error("Failed to process document");
  }
}

/**
 * Extracts text from a PDF document
 * @param buffer The PDF file buffer
 * @returns Extracted text
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Create a custom PDF parser function that doesn't rely on the default import
    // which tries to access test files
    const fs = await import('fs');
    const PDF = await import('pdf-parse/lib/pdf-parse.js');
    
    // Extract text from the PDF using the pdf-parse library
    // We're using the library's internal functions directly to avoid test file issues
    const data = await PDF.default(buffer, {
      // These options help avoid errors related to test files
      max: 0, // No page limit
      version: 'default'
    });
    
    const extractedText = data.text || '';
    
    // Process extracted text using OpenAI to clean and structure it
    const summarizedText = await summarizeOcrText(extractedText);
    
    return summarizedText;
  } catch (error) {
    console.error("PDF processing error:", error);
    throw new Error("Failed to process PDF document");
  }
}

/**
 * Extracts text from an image using Tesseract OCR
 * @param buffer The image file buffer
 * @returns Extracted text
 */
async function extractTextFromImage(buffer: Buffer): Promise<string> {
  let worker: any = null;
  
  try {
    worker = await createWorker();
    
    // Using worker as any to bypass TypeScript strictness
    const result = await worker.recognize(buffer);
    const text = result.data?.text || '';
    
    // Process extracted text using OpenAI to clean and structure it
    const summarizedText = await summarizeOcrText(text);
    
    if (worker) {
      await worker.terminate();
    }
    
    return summarizedText;
  } catch (error) {
    if (worker) {
      await worker.terminate();
    }
    console.error("OCR processing error:", error);
    throw new Error("Failed to process image with OCR");
  }
}

/**
 * Extracts text from a PPTX presentation file
 * @param buffer The PPTX file buffer
 * @returns Extracted text
 */
async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  try {
    // Create a temporary file path for processing
    const fs = await import('fs');
    const os = await import('os');
    const path = await import('path');
    const { promisify } = await import('util');
    
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `presentation-${Date.now()}.pptx`);
    const writeFileAsync = promisify(fs.writeFile);
    const unlinkAsync = promisify(fs.unlink);
    
    // Write buffer to temporary file
    await writeFileAsync(tempFilePath, buffer);
    
    // Process the PPTX file
    let extractedText = '';
    
    // Note: This is a simplified approach for PPTX extraction
    // For a more robust solution, we'd use a dedicated library
    // that can parse the PPTX format directly
    
    try {
      // Load the JSZip library to parse PPTX (which is a ZIP archive)
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      
      // Load the PPTX file (which is a ZIP archive)
      const zipData = await zip.loadAsync(buffer);
      
      // Extract slide content from the ppt/slides/ directory
      const slideKeys = Object.keys(zipData.files).filter(key => 
        key.startsWith('ppt/slides/slide') && key.endsWith('.xml')
      );
      
      // Sort slides by number
      slideKeys.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''));
        const numB = parseInt(b.replace(/\D/g, ''));
        return numA - numB;
      });
      
      // Process each slide
      for (const slideKey of slideKeys) {
        const slideContent = await zipData.files[slideKey].async('text');
        
        // Extract text using regex for basic text extraction
        // This is simplified and doesn't handle all PPTX content types
        const textMatches = slideContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
        
        if (textMatches) {
          for (const match of textMatches) {
            const text = match.replace(/<[^>]*>/g, '').trim();
            if (text.length > 0) {
              extractedText += text + '\n';
            }
          }
          extractedText += '\n\n';
        }
      }
    } catch (err) {
      console.error('Error processing PPTX content:', err);
    }
    
    // Clean up temporary file
    try {
      await unlinkAsync(tempFilePath);
    } catch (err) {
      console.error('Error cleaning up temporary PPTX file:', err);
    }
    
    // Process extracted text using OpenAI to clean and structure it
    if (extractedText.trim().length > 0) {
      const summarizedText = await summarizeOcrText(extractedText);
      return summarizedText;
    } else {
      throw new Error('Could not extract text from PPTX file');
    }
  } catch (error) {
    console.error('PPTX processing error:', error);
    throw new Error('Failed to process PPTX document');
  }
}

/**
 * Extracts text from a DOCX document
 * @param buffer The DOCX file buffer
 * @returns Extracted text
 */
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    // Use mammoth to extract text from DOCX
    const result = await mammoth.extractRawText({ buffer });
    const extractedText = result.value || '';
    
    // Process extracted text using OpenAI to clean and structure it
    const summarizedText = await summarizeOcrText(extractedText);
    
    return summarizedText;
  } catch (error) {
    console.error('DOCX processing error:', error);
    throw new Error('Failed to process DOCX document');
  }
}