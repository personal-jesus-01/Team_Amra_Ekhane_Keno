import { createWorker } from 'tesseract.js';
// Don't directly import pdf-parse to avoid test file issues
import * as mammoth from 'mammoth';

/**
 * Service for OCR and document processing
 */
export class OcrService {
  /**
   * Extracts text from a document based on its type
   * @param buffer Document buffer
   * @param mimetype Document mimetype
   * @returns Extracted text
   */
  async extractTextFromDocument(buffer: Buffer, mimetype: string): Promise<string> {
    try {
      // Determine the file type
      if (mimetype === 'application/pdf') {
        return await this.extractTextFromPdf(buffer);
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.extractTextFromDocx(buffer);
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        return await this.extractTextFromPptx(buffer);
      } else if (mimetype.startsWith('image/')) {
        return await this.extractTextFromImage(buffer);
      } else {
        throw new Error(`Unsupported file type: ${mimetype}`);
      }
    } catch (error) {
      console.error("Error extracting text:", error);
      throw new Error(`Failed to extract text: ${(error as Error).message}`);
    }
  }
  
  /**
   * Extracts text from a PDF document
   * @param buffer The PDF file buffer
   * @returns Extracted text
   */
  private async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      // Dynamically import pdf-parse to avoid test file issues during initialization
      const pdfParse = await import('pdf-parse/lib/pdf-parse.js');
      
      const data = await pdfParse.default(buffer, {
        // These options help avoid errors related to test files
        max: 0, // No page limit
        version: 'default'
      });
      
      return data.text;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error(`Failed to extract text from PDF: ${(error as Error).message}`);
    }
  }
  
  /**
   * Extracts text from an image using Tesseract OCR
   * @param buffer The image file buffer
   * @returns Extracted text
   */
  private async extractTextFromImage(buffer: Buffer): Promise<string> {
    let worker = null;
    
    try {
      console.log("Starting OCR image processing...");
      
      // Create a Tesseract worker
      worker = await createWorker();
      
      // Extract text from the image
      const result = await worker.recognize(buffer);
      const extractedText = result.data?.text || '';
      
      console.log("OCR completed successfully");
      return extractedText;
    } catch (error) {
      console.error("Error extracting text from image:", error);
      throw new Error(`Failed to extract text from image: ${(error as Error).message}`);
    } finally {
      // Always terminate the worker to free up resources
      if (worker) {
        try {
          await worker.terminate();
        } catch (e) {
          console.error("Failed to terminate tesseract worker:", e);
        }
      }
    }
  }
  
  /**
   * Extracts text from a PPTX presentation file
   * @param buffer The PPTX file buffer
   * @returns Extracted text
   */
  private async extractTextFromPptx(buffer: Buffer): Promise<string> {
    // This is a simplified implementation
    // For a complete solution, use a library that can parse PPTX files
    try {
      // Simple converter - just converts to text
      // In a real implementation, you would use a more robust solution
      return "PPTX extraction functionality is limited. Consider converting to PDF first.";
    } catch (error) {
      console.error("Error extracting text from PPTX:", error);
      throw new Error(`Failed to extract text from PPTX: ${(error as Error).message}`);
    }
  }
  
  /**
   * Extracts text from a DOCX document
   * @param buffer The DOCX file buffer
   * @returns Extracted text
   */
  private async extractTextFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error("Error extracting text from DOCX:", error);
      throw new Error(`Failed to extract text from DOCX: ${(error as Error).message}`);
    }
  }
}