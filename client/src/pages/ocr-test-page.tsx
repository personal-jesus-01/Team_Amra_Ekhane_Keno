import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function OcrTestPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Use fetch directly as apiRequest doesn't support FormData
      // Use the direct OCR endpoint which doesn't require auth
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process the document");
      }

      const data = await response.json();
      setResult(data);
      toast({
        title: "Document processed successfully",
        description: "Text extracted from the document",
      });
    } catch (error) {
      console.error("Error processing document:", error);
      setError(error instanceof Error ? error.message : "Failed to process the document");
      toast({
        title: "Error processing document",
        description: error instanceof Error ? error.message : "Failed to process the document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFileTypeSupport = () => {
    return (
      <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
        <li>PDF documents (.pdf)</li>
        <li>Word documents (.docx)</li>
        <li>PowerPoint presentations (.pptx)</li>
        <li>Images (.jpg, .jpeg, .png)</li>
      </ul>
    );
  };

  // No authentication required for OCR test

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">OCR Test Page</h1>
      <p className="mb-8">Upload a document and extract text using OCR</p>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload a file to extract text using OCR
          </CardDescription>
          {getFileTypeSupport()}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
              <Label htmlFor="file">File</Label>
              <input
                id="file"
                type="file"
                accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button type="submit" disabled={isLoading || !file}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Extract Text
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Text</CardTitle>
            <CardDescription>Text extracted from the document</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-sm">
              {result.text}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}