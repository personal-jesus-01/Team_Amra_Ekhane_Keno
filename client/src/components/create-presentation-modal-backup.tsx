import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { Template } from "@/lib/types";
import { Loader2, FileText, Upload, Lightbulb, Globe, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OutlineEditor from "@/components/outline-editor";

interface CreatePresentationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates?: Template[];
}

// Prompt step form schema
const promptFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  numberOfSlides: z.number().min(1).max(30).default(10),
  language: z.string().default("english"),
  templateId: z.string().default("modern-business"),
  prompt: z.string().min(1, { message: "Please describe your presentation" }),
});

// Upload step form schema
const uploadFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  numberOfSlides: z.number().min(1).max(30).default(10),
  language: z.string().default("english"),
  topic: z.string().min(1, { message: "Topic is required" }),
  audienceType: z.string().default("general"),
  presentationTone: z.string().default("professional"),
});

// Refine step form schema
const refineFormSchema = z.object({
  timePeriod: z.string().optional(),
  audienceKnowledge: z.string().default("general"),
  projectType: z.string().default("business"),
});

type PromptFormValues = z.infer<typeof promptFormSchema>;
type UploadFormValues = z.infer<typeof uploadFormSchema>;
type RefineFormValues = z.infer<typeof refineFormSchema>;

// Main creation steps
const STEPS = {
  SELECT_METHOD: 'select-method',
  PROMPT_INPUT: 'prompt-input',
  FILE_UPLOAD: 'file-upload',
  REFINE: 'refine',
  EDIT_OUTLINE: 'edit-outline',
};

export default function CreatePresentationModal({ 
  open, 
  onOpenChange,
  templates = [] 
}: CreatePresentationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedText, setUploadedText] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_METHOD);
  const [generatedOutline, setGeneratedOutline] = useState<any>(null);
  const [creationMethod, setCreationMethod] = useState<'idea' | 'upload'>('idea');

  // Form for AI-based creation from prompt
  const promptForm = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      title: "",
      numberOfSlides: 10,
      language: "english",
      prompt: "",
    },
  });

  // Form for file upload creation
  const uploadForm = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      numberOfSlides: 10,
      language: "english",
    },
  });

  // Form for refining presentation settings
  const refineForm = useForm<RefineFormValues>({
    resolver: zodResolver(refineFormSchema),
    defaultValues: {
      timePeriod: "",
      audienceKnowledge: "general",
      projectType: "business",
    },
  });

  // First create the presentation
  const createPresentationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/presentations", {
        title: data.title,
        owner_id: user?.id,
        status: "draft",
      });
      return await res.json();
    },
    onSuccess: (presentation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      
      // After creating the presentation, generate slides based on the method and outline
      const numberOfSlides = 
        creationMethod === 'idea' 
          ? promptForm.getValues('numberOfSlides') 
          : uploadForm.getValues('numberOfSlides');
      
      // If we have a generated outline, use that for slide generation
      if (generatedOutline) {
        // Pass all the presentation parameters to slide generation
        const presentationParams = {
          topic: creationMethod === 'upload' ? uploadForm.getValues('topic') : promptForm.getValues('prompt'),
          audienceType: creationMethod === 'upload' ? uploadForm.getValues('audienceType') : 'general',
          presentationTone: creationMethod === 'upload' ? uploadForm.getValues('presentationTone') : 'professional',
          pdfContent: creationMethod === 'upload' ? uploadedText : undefined
        };

        // Convert the outline to a slides-compatible format if needed
        const convertedOutline = {
          title: generatedOutline.title,
          slides: generatedOutline.outline?.map((slide: {
            slide_number?: number;
            title?: string;
            key_points?: string[];
            type?: string;
            notes?: string;
          }) => ({
            slide_number: slide.slide_number || 0,
            title: slide.title || '',
            content: Array.isArray(slide.key_points) ? slide.key_points.join('\n* ') : '',
            slide_type: slide.type || 'content',
            notes: slide.notes || '',
            background_color: '#ffffff',
            layout_type: slide.type === 'title' ? 'title' : 
                        slide.type === 'conclusion' ? 'conclusion' : 'standard'
          })) || []
        };
        
        generateSlidesFromOutlineMutation.mutate({
          presentationId: presentation.id,
          outline: convertedOutline,
          designVariants: 3,
          ...presentationParams
        });
      } else if (creationMethod === 'idea') {
        // For idea-based presentations, use Google Slides API directly
        const prompt = promptForm.getValues('prompt');
        const title = presentation.title;
        
        directGoogleSlidesMutation.mutate({
          title,
          prompt,
          numberOfSlides,
          audience: 'general',
          tone: 'professional'
        });
      } else {
        // For file-based presentations, use the uploaded text
        const prompt = uploadedText || `Create a presentation titled ${uploadForm.getValues('title')}`;
          
        generateSlidesMutation.mutate({
          presentationId: presentation.id,
          prompt,
          numberOfSlides,
          sourceType: 'upload',
          designVariants: 3
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create presentation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate slides using the outline and create Google Slides
  const generateSlidesFromOutlineMutation = useMutation({
    mutationFn: async (data: {
      presentationId: number;
      outline: any;
      designVariants?: number;
    }) => {
      // Use the outline content to create Google Slides presentation
      if (uploadedFile) {
        // Use document-based Google Slides endpoint
        const formData = new FormData();
        formData.append('title', data.outline.title);
        formData.append('numberOfSlides', String(data.outline.slides?.length || 10));
        formData.append('audience', 'general');
        formData.append('tone', 'professional');
        formData.append('file', uploadedFile);

        const response = await fetch('/api/google-slides/from-document', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create presentation');
        }

        return await response.json();
      } else {
        // Use prompt-based Google Slides endpoint with outline content
        const promptText = `${data.outline.title}\n\n${data.outline.summary}\n\nKey points:\n${data.outline.slides?.map((slide: any) => `- ${slide.title}: ${slide.content}`).join('\n') || ''}`;
        
        const response = await apiRequest('POST', '/api/google-slides/generate', {
          title: data.outline.title,
          prompt: promptText,
          numberOfSlides: data.outline.slides?.length || 10,
          audience: 'general',
          tone: 'professional',
          presentationType: 'business'
        });

        return await response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      
      toast({
        title: "Presentation created successfully",
        description: "Your Google Slides presentation is ready. You can view and edit it directly.",
      });
      
      // Open Google Slides in new tab if URL is available
      if (data.googleSlides?.editUrl) {
        window.open(data.googleSlides.editUrl, '_blank');
      } else if (data.editUrl) {
        window.open(data.editUrl, '_blank');
      }
      
      // Close the modal and refresh presentations
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Google Slides generation error:', error);
      toast({
        title: "Failed to create Google Slides presentation",
        description: error.message,
        variant: "destructive",
      });
      
      // Don't close modal so user can try again
    },
  });

  // Direct Google Slides creation mutation
  const directGoogleSlidesMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      prompt: string;
      numberOfSlides: number;
      audience: string;
      tone: string;
    }) => {
      const response = await apiRequest('POST', '/api/google-slides/generate', {
        title: data.title,
        prompt: data.prompt,
        numberOfSlides: data.numberOfSlides,
        audience: data.audience,
        tone: data.tone,
        presentationType: 'business'
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      
      // Automatically open the Google Slides presentation
      if (data.editUrl) {
        window.open(data.editUrl, '_blank');
      }
      
      toast({
        title: "Google Slides presentation created",
        description: "Your presentation has been created and opened in a new tab.",
      });
      
      // Close the modal
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create Google Slides presentation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate slides using AI
  const generateSlidesMutation = useMutation({
    mutationFn: async (data: {
      presentationId: number;
      prompt: string;
      numberOfSlides: number;
      sourceType: string;
      designVariants?: number;
    }) => {
      // First, generate slide content with AI
      const generateRes = await apiRequest("POST", "/api/generate-slides", {
        prompt: data.prompt,
        numberOfSlides: data.numberOfSlides,
        designVariants: data.designVariants || 3,
        sourceType: data.sourceType
      });
      
      const slidesData = await generateRes.json();
      
      // Then create slides in the presentation
      if (slidesData.variants && slidesData.variants.length > 0) {
        // We'll use the first variant by default
        const variant = slidesData.variants[0];
        
        // Create each slide in the presentation
        for (const slide of variant.slides) {
          await apiRequest("POST", "/api/slides", {
            presentation_id: data.presentationId,
            slide_number: slide.slide_number,
            title: slide.title,
            content: slide.content,
            slide_type: slide.slide_type,
            status: "draft",
            background_color: slide.background_color,
            layout_type: slide.layout_type || "standard"
          });
        }
      }
      
      return data.presentationId;
    },
    onSuccess: (presentationId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      
      // Navigate to the editor with the new presentation
      navigate(`/editor/${presentationId}`);
      
      toast({
        title: "Presentation created",
        description: "Your new presentation has been created with AI-generated slides.",
      });
      
      // Close the modal
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate slides",
        description: "The presentation was created but we couldn't generate slides. You can add them manually.",
        variant: "destructive",
      });
      
      // Still navigate to the editor, but they'll need to add slides manually
      const presentationId = createPresentationMutation.data?.id;
      if (presentationId) {
        navigate(`/editor/${presentationId}`);
        onOpenChange(false);
      }
    },
  });

  // Generate outline mutation
  const generateOutlineMutation = useMutation({
    mutationFn: async (data: any) => {
      // The extra parameters for refinement
      const refinementParams = refineForm.getValues();
      
      // Create the proper API payload for both prompt and PDF-based generation
      const payload = {
        prompt: creationMethod === 'idea' ? promptForm.getValues('prompt') : undefined,
        topic: creationMethod === 'upload' ? uploadForm.getValues('topic') : undefined,
        numberOfSlides: creationMethod === 'idea' 
          ? promptForm.getValues('numberOfSlides') 
          : uploadForm.getValues('numberOfSlides'),
        sourceType: creationMethod === 'idea' ? 'prompt' : 'upload',
        language: creationMethod === 'idea' 
          ? promptForm.getValues('language') 
          : uploadForm.getValues('language'),
        audienceType: creationMethod === 'upload' ? uploadForm.getValues('audienceType') : 'general',
        presentationTone: creationMethod === 'upload' ? uploadForm.getValues('presentationTone') : 'professional',
        pdfContent: creationMethod === 'upload' ? uploadedText : undefined,
        ...refinementParams
      };
      
      const res = await apiRequest("POST", "/api/generate-outline", payload);
      return await res.json();
    },
    onSuccess: (data) => {
      setGeneratedOutline(data);
      setCurrentStep(STEPS.EDIT_OUTLINE);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate outline",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFile(file);
    
    // Auto-fill title from filename if not set
    if (!uploadForm.getValues('title')) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      uploadForm.setValue('title', fileName);
    }
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to process the file");
      }

      const data = await response.json();
      setUploadedText(data.text);
      
      toast({
        title: "File processed successfully",
        description: "We've extracted the content from your file.",
      });
      
    } catch (error) {
      toast({
        title: "OCR Processing Failed",
        description: "Unable to extract text from the uploaded file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Method selection handlers
  const handleMethodSelect = (method: 'idea' | 'upload') => {
    setCreationMethod(method);
    setCurrentStep(method === 'idea' ? STEPS.PROMPT_INPUT : STEPS.FILE_UPLOAD);
  };

  // Create presentation from refined data
  const handleCreatePresentation = () => {
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a presentation",
        variant: "destructive",
      });
      
      // Redirect to auth page or close modal
      navigate('/auth');
      onOpenChange(false);
      return;
    }
    
    const data = {
      title: creationMethod === 'idea' 
        ? promptForm.getValues('title') 
        : uploadForm.getValues('title'),
    };
    
    createPresentationMutation.mutate(data);
  };

  // Handle back navigation between steps
  const handleBack = () => {
    if (currentStep === STEPS.PROMPT_INPUT || currentStep === STEPS.FILE_UPLOAD) {
      setCurrentStep(STEPS.SELECT_METHOD);
    } else if (currentStep === STEPS.REFINE) {
      setCurrentStep(creationMethod === 'idea' ? STEPS.PROMPT_INPUT : STEPS.FILE_UPLOAD);
    } else if (currentStep === STEPS.EDIT_OUTLINE) {
      setCurrentStep(STEPS.REFINE);
    }
  };

  // Handle next/continue between steps
  const handleNext = async () => {
    if (currentStep === STEPS.PROMPT_INPUT) {
      const valid = await promptForm.trigger();
      if (valid) {
        setCurrentStep(STEPS.REFINE);
      }
    } else if (currentStep === STEPS.FILE_UPLOAD) {
      const valid = await uploadForm.trigger();
      if (valid && uploadedFile) {
        setCurrentStep(STEPS.REFINE);
      } else if (valid) {
        toast({
          title: "Missing file",
          description: "Please upload a file before continuing",
          variant: "destructive"
        });
      }
    } else if (currentStep === STEPS.REFINE) {
      const valid = await refineForm.trigger();
      if (valid) {
        // Generate outline based on prompt/file + refinements
        generateOutlineMutation.mutate({});
      }
    }
  };

  // Render different step content
  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.SELECT_METHOD:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleMethodSelect('idea')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                  Start from an idea
                </CardTitle>
                <CardDescription>
                  Create a presentation by describing what you need
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Our AI will generate a complete presentation based on your description
                </p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleMethodSelect('upload')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-primary" />
                  Upload a file
                </CardTitle>
                <CardDescription>
                  Create from PDF, images, DOCX, or TXT
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  We'll extract content from your file and create slides
                </p>
              </CardContent>
            </Card>
          </div>
        );
        
      case STEPS.PROMPT_INPUT:
        return (
          <Form {...promptForm}>
            <form className="space-y-4 py-4">
              <FormField
                control={promptForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presentation Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={promptForm.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe your presentation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="E.g., A marketing presentation for our new product launch targeting young professionals"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Be specific about the purpose, audience, and key points you want to cover
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={promptForm.control}
                  name="numberOfSlides"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Slides</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={promptForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Language</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="german">German</SelectItem>
                          <SelectItem value="chinese">Chinese</SelectItem>
                          <SelectItem value="japanese">Japanese</SelectItem>
                          <SelectItem value="hindi">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={promptForm.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="modern-business">Modern Business</SelectItem>
                        <SelectItem value="creative-portfolio">Creative Portfolio</SelectItem>
                        <SelectItem value="corporate-blue">Corporate Blue</SelectItem>
                        <SelectItem value="startup-pitch">Startup Pitch</SelectItem>
                        <SelectItem value="education-modern">Modern Education</SelectItem>
                        <SelectItem value="tech-presentation">Tech Presentation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose a professional template design for your presentation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Upload Step Content */}
          <TabsContent value={STEPS.FILE_UPLOAD} className="space-y-4">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Upload Document</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload a PDF, DOCX, or PPTX file to create your presentation
              </p>
            </div>
            
            <div className="space-y-4">
              <FormField
                control={uploadForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presentation Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={uploadForm.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Topic</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="What is the main topic of your presentation?" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={uploadForm.control}
                  name="numberOfSlides"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Slides</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={uploadForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="german">German</SelectItem>
                          <SelectItem value="chinese">Chinese</SelectItem>
                          <SelectItem value="japanese">Japanese</SelectItem>
                          <SelectItem value="hindi">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={uploadForm.control}
                  name="audienceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="educational">Educational</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={uploadForm.control}
                  name="presentationTone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Presentation Tone</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                          <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="educational">Educational</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept=".pdf,.docx,.pptx,.doc,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400" />
                  )}
                  <span className="mt-2 text-sm font-medium text-gray-900">
                    {uploadedFile ? uploadedFile.name : 'Click to upload file'}
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, DOCX, PPTX up to 10MB
                  </span>
                </label>
              </div>
              
              {uploadedText && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ File processed successfully. Content extracted and ready for processing.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Refinement Step */}
          <TabsContent value={STEPS.REFINE} className="space-y-4">
            <div className="text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Refine Your Presentation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add additional context to customize your presentation
              </p>
            </div>
            
            <div className="space-y-4">
              <FormField
                control={refineForm.control}
                name="timePeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Period (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Q4 2024, Last 6 months, etc." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Specify any time frame relevant to your presentation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={refineForm.control}
                name="audienceKnowledge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience Knowledge Level</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select knowledge level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                        <SelectItem value="mixed">Mixed Audience</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={refineForm.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Outline Editor Step */}
          <TabsContent value={STEPS.EDIT_OUTLINE} className="space-y-4">
            {generatedOutline && (
              <OutlineEditor
                outline={generatedOutline}
                onOutlineChange={setGeneratedOutline}
              />
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          {currentStep !== STEPS.SELECT_METHOD && (
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={createPresentationMutation.isPending || 
                       generateSlidesFromOutlineMutation.isPending ||
                       generateOutlineMutation.isPending}
            >
              Back
            </Button>
          )}
          
          <div className="flex gap-2">
            {currentStep === STEPS.SELECT_METHOD && (
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            )}
            
            {currentStep === STEPS.EDIT_OUTLINE && (
              <Button 
                onClick={handleCreatePresentation}
                disabled={createPresentationMutation.isPending || 
                         generateSlidesFromOutlineMutation.isPending}
              >
                {createPresentationMutation.isPending || generateSlidesFromOutlineMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Presentation'
                )}
              </Button>
            )}
            
            {(currentStep === STEPS.PROMPT_INPUT || currentStep === STEPS.FILE_UPLOAD || currentStep === STEPS.REFINE) && (
              <Button 
                onClick={handleNext}
                disabled={generateOutlineMutation.isPending}
              >
                {generateOutlineMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Next'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Helper functions
  function handleBack() {
    switch (currentStep) {
      case STEPS.PROMPT_INPUT:
        setCurrentStep(STEPS.SELECT_METHOD);
        break;
      case STEPS.FILE_UPLOAD:
        setCurrentStep(STEPS.SELECT_METHOD);
        break;
      case STEPS.REFINE:
        setCurrentStep(creationMethod === 'idea' ? STEPS.PROMPT_INPUT : STEPS.FILE_UPLOAD);
        break;
      case STEPS.EDIT_OUTLINE:
        setCurrentStep(STEPS.REFINE);
        break;
      default:
        setCurrentStep(STEPS.SELECT_METHOD);
    }
  }

  function handleNext() {
    switch (currentStep) {
      case STEPS.PROMPT_INPUT:
        if (promptForm.trigger()) {
          setCurrentStep(STEPS.REFINE);
        }
        break;
      case STEPS.FILE_UPLOAD:
        if (uploadForm.trigger() && uploadedText && !isUploading) {
          setCurrentStep(STEPS.REFINE);
        } else if (!uploadedText) {
          toast({
            title: "File Required",
            description: "Please upload and process a file before continuing",
            variant: "destructive",
          });
        }
        break;
      case STEPS.REFINE:
        // Generate outline based on current method
        generateOutlineMutation.mutate({});
        break;
    }
  }
}
          <Form {...uploadForm}>
            <form className="space-y-4 py-4">
              <FormField
                control={uploadForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presentation Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={uploadForm.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="What is your presentation about?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Upload Document</FormLabel>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.docx,.txt"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <Label 
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-primary"
                  >
                    <FileText className="h-10 w-10 mb-2" />
                    <span className="text-sm font-medium">
                      {uploadedFile ? uploadedFile.name : "Choose a file or drag & drop"}
                    </span>
                    <span className="text-xs mt-1">
                      PDF, DOCX, JPG, PNG, or TXT (max 10MB)
                    </span>
                  </Label>
                </div>
                
                {isUploading && (
                  <div className="flex items-center justify-center text-sm text-primary-600 mt-2">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing document...
                  </div>
                )}
                
                {uploadedText && (
                  <div className="text-sm text-green-600 mt-2 flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-600 mr-2" />
                    Document processed successfully!
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={uploadForm.control}
                  name="numberOfSlides"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Slides</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={uploadForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Language</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="german">German</SelectItem>
                          <SelectItem value="chinese">Chinese</SelectItem>
                          <SelectItem value="japanese">Japanese</SelectItem>
                          <SelectItem value="hindi">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        );
        
      case STEPS.REFINE:
        return (
          <Form {...refineForm}>
            <form className="space-y-4 py-4">
              <h3 className="text-lg font-medium">Refine Your Presentation</h3>
              <p className="text-sm text-gray-500 mb-4">
                Add additional details to make your presentation more tailored
              </p>

              <FormField
                control={refineForm.control}
                name="timePeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      Time Period (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 2024 Q2, Last 5 years, Historical" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Specify a time frame if your presentation covers a specific period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={refineForm.control}
                name="audienceKnowledge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      Audience Knowledge
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="novice" id="audience-novice" />
                          <Label htmlFor="audience-novice">Novice - Explain concepts in simple terms</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="general" id="audience-general" />
                          <Label htmlFor="audience-general">General - Assume basic familiarity</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="expert" id="audience-expert" />
                          <Label htmlFor="audience-expert">Expert - Use technical language and concepts</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={refineForm.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      Project Type
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="business">Business / Corporate</SelectItem>
                        <SelectItem value="academic">Academic / Educational</SelectItem>
                        <SelectItem value="marketing">Marketing / Sales</SelectItem>
                        <SelectItem value="technical">Technical / Engineering</SelectItem>
                        <SelectItem value="creative">Creative / Design</SelectItem>
                        <SelectItem value="research">Research / Scientific</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        );
        
      case STEPS.EDIT_OUTLINE:
        // Show the generated outline with editable fields and navigation
        return generatedOutline ? (
          <div className="py-4">
            <OutlineEditor 
              outline={generatedOutline} 
              setOutline={setGeneratedOutline}
              promptForm={promptForm}
              uploadForm={uploadForm}
              creationMethod={creationMethod}
            />
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Generating your presentation outline...</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Modal header based on current step
  const renderModalHeader = () => {
    let title = "Create New Presentation";
    let description = "Create a presentation using AI or uploaded content.";
    
    switch (currentStep) {
      case STEPS.SELECT_METHOD:
        title = "Create New Presentation";
        description = "Choose how you want to create your presentation";
        break;
      case STEPS.PROMPT_INPUT:
        title = "Start from an idea";
        description = "Describe the goal of your presentation";
        break;
      case STEPS.FILE_UPLOAD:
        title = "Upload a file";
        description = "Create a presentation from your document";
        break;
      case STEPS.REFINE:
        title = "Refine your presentation";
        description = "Add additional details to enhance your presentation";
        break;
      case STEPS.EDIT_OUTLINE:
        title = "Edit Outline";
        description = "Review and edit before creating your presentation";
        break;
    }
    
    return (
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
    );
  };

  // Modal footer based on current step
  const renderModalFooter = () => {
    const isPending = createPresentationMutation.isPending || 
                      generateSlidesMutation.isPending || 
                      generateOutlineMutation.isPending ||
                      generateSlidesFromOutlineMutation.isPending;
    
    // For the edit outline step, only show the create button
    if (currentStep === STEPS.EDIT_OUTLINE) {
      return (
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isPending}
          >
            Back
          </Button>
          
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            
            <Button
              type="button"
              onClick={handleCreatePresentation}
              disabled={isPending}
            >
              {createPresentationMutation.isPending || generateSlidesFromOutlineMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create my presentation"
              )}
            </Button>
          </div>
        </DialogFooter>
      );
    }
    
    // For the outline generation step (when we're generating the outline), don't show navigation buttons
    if (generateOutlineMutation.isPending) {
      return (
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      );
    }
    
    // For other steps
    return (
      <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
        {currentStep !== STEPS.SELECT_METHOD && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isPending}
          >
            Back
          </Button>
        )}
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={
              isPending || 
              (currentStep === STEPS.FILE_UPLOAD && isUploading)
            }
          >
            {currentStep === STEPS.REFINE ? "Generate outline" : "Continue"}
          </Button>
        </div>
      </DialogFooter>
    );
  };

  // Add aria-labelledby and aria-describedby to fix accessibility warnings
  const dialogTitleId = "create-presentation-dialog-title";
  const dialogDescriptionId = "create-presentation-dialog-description";
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-2xl"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
      >
        <DialogHeader>
          <DialogTitle id={dialogTitleId}>{renderModalHeader().props.children[0].props.children}</DialogTitle>
          <DialogDescription id={dialogDescriptionId}>{renderModalHeader().props.children[1].props.children}</DialogDescription>
        </DialogHeader>
        {renderStepContent()}
        {renderModalFooter()}
      </DialogContent>
    </Dialog>
  );
}
