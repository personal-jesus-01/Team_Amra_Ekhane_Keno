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
import { NumberInput } from "@/components/ui/number-input";
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

// Enhanced form schemas
const promptFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Please describe what the presentation should cover" }),
  numberOfSlides: z.number().min(5).max(50).default(10),
  audienceType: z.string().default("general"),
  presentationType: z.enum(["Business", "Academic", "Corporate", "Analytical", "Historical"]).default("Business"),
  audienceKnowledge: z.enum(["Novice", "Amateur", "Experienced", "Master"]).default("Amateur"),
  includeGraphs: z.boolean().default(false),
  includeCharts: z.boolean().default(false),
  includeImages: z.boolean().default(false),
  includeAnalytics: z.boolean().default(false),
  prompt: z.string().min(1, { message: "Please describe your presentation" }),
  topic: z.string().optional(),
  language: z.string().default("english"),
  templateId: z.string().optional(),
  presentationTone: z.string().default("professional"),
});

const uploadFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Please describe what the presentation should cover" }),
  numberOfSlides: z.number().min(5).max(50).default(10),
  audienceType: z.string().default("general"),
  presentationType: z.enum(["Business", "Academic", "Corporate", "Analytical", "Historical"]).default("Business"),
  audienceKnowledge: z.enum(["Novice", "Amateur", "Experienced", "Master"]).default("Amateur"),
  includeGraphs: z.boolean().default(false),
  includeCharts: z.boolean().default(false),
  includeImages: z.boolean().default(false),
  includeAnalytics: z.boolean().default(false),
  topic: z.string().min(1, { message: "Please describe the topic" }),
  language: z.string().default("english"),
  templateId: z.string().optional(),
  presentationTone: z.string().default("professional"),
});

const templateFormSchema = z.object({
  selectedTemplate: z.string().min(1, { message: "Please select a template" }),
});

const paymentFormSchema = z.object({
  paymentMethod: z.enum(["mobile", "visa", "mastercard"]),
  mobileProvider: z.string().optional(),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvc: z.string().optional(),
});

const refineFormSchema = z.object({
  timePeriod: z.string().optional(),
  audienceKnowledge: z.enum(["general", "beginner", "intermediate", "advanced"]).default("general"),
  projectType: z.enum(["business", "academic", "personal", "research"]).default("business"),
});

type PromptFormValues = z.infer<typeof promptFormSchema>;
type UploadFormValues = z.infer<typeof uploadFormSchema>;
type TemplateFormValues = z.infer<typeof templateFormSchema>;
type PaymentFormValues = z.infer<typeof paymentFormSchema>;
type RefineFormValues = z.infer<typeof refineFormSchema>;

const STEPS = {
  SELECT_METHOD: 'select-method',
  PROMPT_INPUT: 'prompt-input',
  FILE_UPLOAD: 'file-upload',
  TEMPLATE_SELECTION: 'template-selection',
  PAYMENT: 'payment',
  REFINE: 'refine',
  EDIT_OUTLINE: 'edit-outline',
  GENERATING: 'generating',
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [cachedData, setCachedData] = useState<any>(null);

  // Forms
  const promptForm = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      title: "",
      description: "",
      numberOfSlides: 10,
      audienceType: "general",
      presentationType: "Business",
      audienceKnowledge: "Amateur",
      includeGraphs: false,
      includeCharts: false,
      includeImages: false,
      includeAnalytics: false,
      prompt: "",
      topic: "",
      language: "english",
      templateId: "",
      presentationTone: "professional",
    },
  });

  const uploadForm = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      description: "",
      numberOfSlides: 10,
      audienceType: "general",
      presentationType: "Business",
      audienceKnowledge: "Amateur",
      includeGraphs: false,
      includeCharts: false,
      includeImages: false,
      includeAnalytics: false,
      topic: "",
      language: "english",
      templateId: "",
      presentationTone: "professional",
    },
  });

  const templateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      selectedTemplate: "",
    },
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "mobile",
      mobileProvider: "bkash",
    },
  });

  const refineForm = useForm<RefineFormValues>({
    resolver: zodResolver(refineFormSchema),
    defaultValues: {
      timePeriod: "",
      audienceKnowledge: "general",
      projectType: "business",
    },
  });

  // Mutations
  const createPresentationMutation = useMutation({
    mutationFn: async (data: { title: string; outline?: any }) => {
      const response = await apiRequest("POST", "/api/presentations", {
        title: data.title,
        slides: data.outline?.slides || [],
        source_type: creationMethod,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      
      // Create Google Slides and trigger auto-opening
      if (generatedOutline) {
        generateSlidesFromOutlineMutation.mutate({
          presentationId: data.id,
          outline: generatedOutline,
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

  const generateSlidesFromOutlineMutation = useMutation({
    mutationFn: async (data: { presentationId: number; outline: any }) => {
      if (uploadedFile) {
        const formData = new FormData();
        formData.append('title', data.outline.title);
        formData.append('numberOfSlides', String(data.outline.slides?.length || 10));
        formData.append('audience', 'general');
        formData.append('tone', 'professional');
        formData.append('file', uploadedFile);

        const response = await fetch('/api/google-slides/create', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create presentation');
        }

        return await response.json();
      } else {
        const promptText = `${data.outline.title}\n\n${data.outline.summary}\n\nKey points:\n${data.outline.slides?.map((slide: any) => `- ${slide.title}: ${slide.content}`).join('\n') || ''}`;
        
        const response = await apiRequest('POST', '/api/google-slides/create-from-slides', {
          title: data.outline.title,
          slides: data.outline.slides || [],
          templateId: promptForm.getValues('templateId')
        });

        return await response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      
      // Auto-open the Google Slides presentation
      if (data.editUrl) {
        window.open(data.editUrl, '_blank');
      }
      
      onOpenChange(false);
      toast({
        title: "Presentation created successfully!",
        description: "Your Google Slides presentation is now ready and has been opened in a new tab.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create Google Slides",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateOutlineMutation = useMutation({
    mutationFn: async () => {
      const refinementParams = refineForm.getValues();
      
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
    
    if (!uploadForm.getValues('title')) {
      const fileName = file.name.replace(/\.[^/.]+$/, "");
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

  const handleMethodSelect = (method: 'idea' | 'upload') => {
    setCreationMethod(method);
    setCurrentStep(method === 'idea' ? STEPS.PROMPT_INPUT : STEPS.FILE_UPLOAD);
  };

  const handleCreatePresentation = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a presentation",
        variant: "destructive",
      });
      navigate('/auth');
      onOpenChange(false);
      return;
    }

    if (!generatedOutline) {
      toast({
        title: "No Outline Generated",
        description: "Please generate an outline first",
        variant: "destructive",
      });
      return;
    }

    const title = creationMethod === 'idea' 
      ? promptForm.getValues('title') 
      : uploadForm.getValues('title');

    createPresentationMutation.mutate({
      title,
      outline: generatedOutline,
    });
  };

  const handleBack = () => {
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
  };

  const handleNext = () => {
    switch (currentStep) {
      case STEPS.PROMPT_INPUT:
        const promptValues = promptForm.getValues();
        if (promptValues.title && promptValues.prompt) {
          setCurrentStep(STEPS.REFINE);
        } else {
          toast({
            title: "Required Fields Missing",
            description: "Please fill in the title and description",
            variant: "destructive",
          });
        }
        break;
      case STEPS.FILE_UPLOAD:
        const uploadValues = uploadForm.getValues();
        if (uploadValues.title && uploadedText && !isUploading) {
          setCurrentStep(STEPS.REFINE);
        } else if (!uploadedText) {
          toast({
            title: "File Required",
            description: "Please upload and process a file before continuing",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Required Fields Missing",
            description: "Please fill in the title",
            variant: "destructive",
          });
        }
        break;
      case STEPS.REFINE:
        generateOutlineMutation.mutate();
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Presentation</DialogTitle>
          <DialogDescription>
            Choose how you'd like to create your presentation
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} className="w-full">
          {/* Method Selection */}
          <TabsContent value={STEPS.SELECT_METHOD} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleMethodSelect('idea')}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">Start with an Idea</CardTitle>
                      <CardDescription>
                        Describe your presentation and let AI create it
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Perfect for creating presentations from scratch with AI assistance
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleMethodSelect('upload')}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Upload className="h-8 w-8 text-green-600" />
                    <div>
                      <CardTitle className="text-lg">Upload Document</CardTitle>
                      <CardDescription>
                        Transform existing content into slides
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Upload PDF, DOCX, or PPTX files to convert into presentations
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Idea Input Step */}
          <TabsContent value={STEPS.PROMPT_INPUT} className="space-y-4">
            <div className="text-center">
              <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Describe Your Presentation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tell us about your presentation and we'll create it for you
              </p>
            </div>
            
            <Form {...promptForm}>
              <div className="space-y-4">
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
                        <FormLabel className="font-medium">Number of Slides</FormLabel>
                        <FormControl>
                          <NumberInput
                            value={field.value || 10}
                            onChange={field.onChange}
                            min={1}
                            max={30}
                            className="w-full"
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
                
                <FormField
                  control={promptForm.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Design</FormLabel>
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
            </Form>
          </TabsContent>

          {/* File Upload Step */}
          <TabsContent value={STEPS.FILE_UPLOAD} className="space-y-4">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Upload Document</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload a PDF, DOCX, or PPTX file to create your presentation
              </p>
            </div>
            
            <Form {...uploadForm}>
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
            </Form>
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
            
            <Form {...refineForm}>
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
            </Form>
          </TabsContent>

          {/* Outline Editor Step */}
          <TabsContent value={STEPS.EDIT_OUTLINE} className="space-y-4">
            {generatedOutline && (
              <OutlineEditor
                outline={generatedOutline}
                setOutline={setGeneratedOutline}
                promptForm={promptForm}
                uploadForm={uploadForm}
                creationMethod={creationMethod}
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
}