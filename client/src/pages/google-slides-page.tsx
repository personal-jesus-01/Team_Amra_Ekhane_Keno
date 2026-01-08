import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { 
  FileText, 
  Upload, 
  Plus, 
  Loader2, 
  ExternalLink,
  Presentation,
  ChevronRight
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function GoogleSlidesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    prompt: "",
    audience: "general",
    tone: "professional",
    slides: "10",
    file: null as File | null
  });

  // Create presentation mutation
  const createPresentationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (data.file) {
        // Use document-based endpoint
        const formDataToSend = new FormData();
        formDataToSend.append('title', data.title);
        formDataToSend.append('numberOfSlides', data.slides);
        formDataToSend.append('audience', data.audience);
        formDataToSend.append('tone', data.tone);
        formDataToSend.append('file', data.file);

        const response = await fetch('/api/google-slides/from-document', {
          method: 'POST',
          body: formDataToSend,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create presentation');
        }

        return response.json();
      } else {
        // Use prompt-based endpoint
        const response = await apiRequest('POST', '/api/google-slides/generate', {
          title: data.title,
          prompt: data.prompt,
          numberOfSlides: parseInt(data.slides),
          audience: data.audience,
          tone: data.tone,
          presentationType: 'business'
        });

        return response.json();
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Google Slides presentation created",
        description: "Your presentation has been created and is ready to edit in Google Slides.",
      });

      // Open the presentation in Google Slides
      if (data.googleSlides?.editUrl) {
        window.open(data.googleSlides.editUrl, '_blank');
      } else if (data.editUrl) {
        window.open(data.editUrl, '_blank');
      }

      // Reset form
      setFormData({
        title: "",
        prompt: "",
        audience: "general",
        tone: "professional",
        slides: "10",
        file: null
      });

      // Refresh presentations list
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create presentation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your presentation.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.prompt.trim() && !formData.file) {
      toast({
        title: "Content required",
        description: "Please enter a topic or upload a PDF document.",
        variant: "destructive",
      });
      return;
    }

    createPresentationMutation.mutate(formData);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <span>Dashboard</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-900">Google Slides</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Google Slides Presentation</h1>
              <p className="text-gray-600">Generate presentations directly in Google Slides using AI</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Creation Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Presentation className="h-5 w-5 mr-2" />
                      New Presentation
                    </CardTitle>
                    <CardDescription>
                      Create a new presentation using AI. Upload a PDF for content extraction or describe your topic.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Title */}
                      <div>
                        <Label htmlFor="title">Presentation Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Enter presentation title..."
                          required
                        />
                      </div>

                      {/* File Upload */}
                      <div>
                        <Label htmlFor="file">Upload PDF (Optional)</Label>
                        <div className="mt-1">
                          <input
                            id="file"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {formData.file && (
                            <p className="text-sm text-gray-600 mt-1">
                              Selected: {formData.file.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Topic/Prompt */}
                      <div>
                        <Label htmlFor="prompt">Topic or Description *</Label>
                        <Textarea
                          id="prompt"
                          value={formData.prompt}
                          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                          placeholder="Describe your presentation topic, key points, or objectives..."
                          rows={4}
                          required={!formData.file}
                        />
                      </div>

                      {/* Preferences */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="audience">Target Audience</Label>
                          <Select value={formData.audience} onValueChange={(value) => setFormData({ ...formData, audience: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General Audience</SelectItem>
                              <SelectItem value="business">Business Professionals</SelectItem>
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="technical">Technical Experts</SelectItem>
                              <SelectItem value="students">Students</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="tone">Presentation Tone</Label>
                          <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="formal">Formal</SelectItem>
                              <SelectItem value="friendly">Friendly</SelectItem>
                              <SelectItem value="persuasive">Persuasive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="slides">Number of Slides</Label>
                          <Select value={formData.slides} onValueChange={(value) => setFormData({ ...formData, slides: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 slides</SelectItem>
                              <SelectItem value="10">10 slides</SelectItem>
                              <SelectItem value="15">15 slides</SelectItem>
                              <SelectItem value="20">20 slides</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={createPresentationMutation.isPending}
                      >
                        {createPresentationMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Presentation...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Google Slides Presentation
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Info Panel */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How it works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                        <Upload className="h-3 w-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Upload or Describe</p>
                        <p className="text-gray-600">Upload a PDF document or describe your presentation topic</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 rounded-full p-1 mt-0.5">
                        <FileText className="h-3 w-3 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">AI Generation</p>
                        <p className="text-gray-600">AI creates a detailed outline and slide content</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                        <ExternalLink className="h-3 w-3 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Google Slides Creation</p>
                        <p className="text-gray-600">Presentation opens directly in Google Slides for editing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Credits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{user?.credits || 0}</div>
                      <p className="text-sm text-gray-600">Available credits</p>
                      <p className="text-xs text-gray-500 mt-2">Each presentation uses 1 credit</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}