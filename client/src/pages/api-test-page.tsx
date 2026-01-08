import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ApiTestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [inputText, setInputText] = useState("Presentations.ai is a revolutionary platform that transforms how users design and deliver presentations. It leverages AI to analyze content, generate slide designs, and provide coaching feedback. The platform follows a five-phase workflow: Input (text, documents), AI Processing (NLP analysis), Slide Generation (multiple designs), Editing (user refinements), and Output (export options). Key features include real-time collaboration, AI-powered suggestions, and presentation coaching metrics.");

  const handleAnalyzeTopics = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/content/analyze-topics", { content: inputText });
      const data = await response.json();
      setResult(data);
      toast({
        title: "Topics analyzed successfully",
        description: `Found ${data.topics?.length || 0} topics`,
      });
    } catch (error) {
      console.error("Error analyzing topics:", error);
      toast({
        title: "Error analyzing topics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractKeyPhrases = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/content/extract-key-phrases", { content: inputText });
      const data = await response.json();
      setResult(data);
      toast({
        title: "Key phrases extracted successfully",
        description: `Found ${data.keyphrases?.length || 0} key phrases`,
      });
    } catch (error) {
      console.error("Error extracting key phrases:", error);
      toast({
        title: "Error extracting key phrases",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractStructure = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/content/extract-structure", { content: inputText });
      const data = await response.json();
      setResult(data);
      toast({
        title: "Content structure extracted successfully",
        description: `Found multiple content elements`,
      });
    } catch (error) {
      console.error("Error extracting content structure:", error);
      toast({
        title: "Error extracting content structure",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeOcr = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/content/summarize-ocr", { text: inputText });
      const data = await response.json();
      setResult(data);
      toast({
        title: "OCR text summarized successfully",
        description: "Summary generated",
      });
    } catch (error) {
      console.error("Error summarizing OCR text:", error);
      toast({
        title: "Error summarizing OCR text",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>API Test Page</CardTitle>
            <CardDescription>You need to login to test the API endpoints</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.href = "/auth"}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">API Test Page</h1>
      <p className="mb-8">Use this page to test the Content Analysis API endpoints</p>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Input</CardTitle>
          <CardDescription>Enter text to analyze</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            placeholder="Enter text to analyze"
            className="mb-4"
          />
          <p className="text-sm text-gray-500">Current credits: {user.credits}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="topics">
        <TabsList className="mb-4">
          <TabsTrigger value="topics">Analyze Topics</TabsTrigger>
          <TabsTrigger value="phrases">Extract Key Phrases</TabsTrigger>
          <TabsTrigger value="structure">Extract Structure</TabsTrigger>
          <TabsTrigger value="ocr">Summarize OCR</TabsTrigger>
        </TabsList>
        
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>Topic Analysis</CardTitle>
              <CardDescription>Analyze content to extract topics and suggested structure (costs 1 credit)</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button disabled={isLoading} onClick={handleAnalyzeTopics}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze Topics'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="phrases">
          <Card>
            <CardHeader>
              <CardTitle>Key Phrase Extraction</CardTitle>
              <CardDescription>Extract key phrases and sentiment from content (costs 1 credit)</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button disabled={isLoading} onClick={handleExtractKeyPhrases}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting...</> : 'Extract Key Phrases'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="structure">
          <Card>
            <CardHeader>
              <CardTitle>Content Structure Extraction</CardTitle>
              <CardDescription>Extract structured content elements for slide creation (costs 2 credits)</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button disabled={isLoading} onClick={handleExtractStructure}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting...</> : 'Extract Structure'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="ocr">
          <Card>
            <CardHeader>
              <CardTitle>OCR Text Summarization</CardTitle>
              <CardDescription>Summarize OCR-extracted text into key points (costs 1 credit)</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button disabled={isLoading} onClick={handleSummarizeOcr}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Summarizing...</> : 'Summarize OCR Text'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {result && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>API Result</CardTitle>
            <CardDescription>Remaining credits: {result.creditsRemaining}</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}