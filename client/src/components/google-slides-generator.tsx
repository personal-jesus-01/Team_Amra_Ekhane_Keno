import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, FileText, Upload, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generatePresentationWithGoogleSlides, generatePresentationFromDocument } from '@/services/google-slides.service';
import type { GoogleSlidesResult, GoogleSlidesOptions } from '@/services/google-slides.service';

interface GoogleSlidesGeneratorProps {
  onPresentationCreated?: (result: GoogleSlidesResult) => void;
  onClose?: () => void;
}

export default function GoogleSlidesGenerator({ onPresentationCreated, onClose }: GoogleSlidesGeneratorProps) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<GoogleSlidesOptions>({
    numberOfSlides: 8,
    audience: 'general',
    tone: 'professional',
    presentationType: 'business'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GoogleSlidesResult | null>(null);
  const [activeTab, setActiveTab] = useState('prompt');

  const { toast } = useToast();

  const handleGenerateFromPrompt = async () => {
    if (!title.trim() || !prompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and description for your presentation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generatePresentationWithGoogleSlides(title, prompt, options);
      setResult(response);
      
      toast({
        title: "Presentation created!",
        description: response.googleSlides 
          ? "Your Google Slides presentation has been created successfully."
          : "Presentation content generated. Google Slides creation is currently unavailable.",
      });

      if (onPresentationCreated) {
        onPresentationCreated(response);
      }
    } catch (error) {
      console.error('Error generating presentation:', error);
      toast({
        title: "Generation failed",
        description: "There was an error creating your presentation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromDocument = async () => {
    if (!title.trim() || !file) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and upload a document.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generatePresentationFromDocument(title, file, options);
      setResult(response);
      
      toast({
        title: "Presentation created!",
        description: response.googleSlides 
          ? "Your Google Slides presentation has been created from the document."
          : "Presentation content generated from document. Google Slides creation is currently unavailable.",
      });

      if (onPresentationCreated) {
        onPresentationCreated(response);
      }
    } catch (error) {
      console.error('Error generating presentation from document:', error);
      toast({
        title: "Generation failed",
        description: "There was an error creating your presentation from the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOCX, PPTX, or TXT file.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  if (result) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Presentation Created Successfully!
          </CardTitle>
          <CardDescription>
            Your presentation "{result.title}" has been generated with {result.slideCount} slides.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {result.googleSlides && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Google Slides Presentation</h3>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href={result.googleSlides.editUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Edit in Google Slides
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={result.googleSlides.viewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Presentation
                  </a>
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Generated Content</h3>
            <div className="max-h-64 overflow-y-auto space-y-3">
              {result.slides.map((slide, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{slide.title}</h4>
                    <Badge variant="outline">{slide.slide_type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{slide.content}</p>
                  {slide.suggested_visuals && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      Visual suggestion: {slide.suggested_visuals}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setResult(null)} variant="outline">
              Create Another
            </Button>
            {onClose && (
              <Button onClick={onClose}>
                Done
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Create Presentation with Google Slides
        </CardTitle>
        <CardDescription>
          Generate professional presentations using AI and automatically create them in Google Slides
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prompt" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              From Description
            </TabsTrigger>
            <TabsTrigger value="document" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              From Document
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Presentation Title</Label>
              <Input
                id="title"
                placeholder="Enter your presentation title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slides">Number of Slides</Label>
                <Select value={String(options.numberOfSlides)} onValueChange={(value) => setOptions({...options, numberOfSlides: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 slides</SelectItem>
                    <SelectItem value="8">8 slides</SelectItem>
                    <SelectItem value="10">10 slides</SelectItem>
                    <SelectItem value="15">15 slides</SelectItem>
                    <SelectItem value="20">20 slides</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select value={options.audience} onValueChange={(value) => setOptions({...options, audience: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Presentation Tone</Label>
                <Select value={options.tone} onValueChange={(value) => setOptions({...options, tone: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <TabsContent value="prompt" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Presentation Description</Label>
              <Textarea
                id="prompt"
                placeholder="Describe what your presentation should be about. Include key topics, main points, and any specific information you want to cover..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
              />
            </div>

            <Button 
              onClick={handleGenerateFromPrompt} 
              disabled={isGenerating || !title.trim() || !prompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Presentation...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Presentation
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="document" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Upload Document</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file"
                  className="hidden"
                  accept=".pdf,.docx,.pptx,.txt"
                  onChange={handleFileUpload}
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {file ? file.name : 'Click to upload PDF, DOCX, PPTX, or TXT file'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum file size: 10MB
                  </p>
                </label>
              </div>
            </div>

            <Button 
              onClick={handleGenerateFromDocument} 
              disabled={isGenerating || !title.trim() || !file}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating from Document...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate from Document
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {onClose && (
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}