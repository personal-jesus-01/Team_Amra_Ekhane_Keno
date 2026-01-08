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
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { Loader2, FileText, Upload, Lightbulb, CreditCard, Smartphone, Eye } from "lucide-react";
import { NumberInput } from "@/components/ui/number-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EnhancedPresentationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Enhanced form schemas
const promptFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(10, { message: "Please provide a detailed description (minimum 10 characters)" }),
  numberOfSlides: z.number().min(5).max(50).default(10),
  audienceType: z.enum(["general", "executive", "technical", "sales", "educational", "business"]).default("general"),
  presentationType: z.enum(["Business", "Academic", "Corporate", "Analytical", "Historical"]).default("Business"),
  audienceKnowledge: z.enum(["Novice", "Amateur", "Experienced", "Master"]).default("Amateur"),
  includeGraphs: z.boolean().default(false),
  includeCharts: z.boolean().default(false),
  includeImages: z.boolean().default(false),
  includeAnalytics: z.boolean().default(false),
});

const uploadFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(10, { message: "Please provide a detailed description (minimum 10 characters)" }),
  numberOfSlides: z.number().min(5).max(50).default(10),
  audienceType: z.enum(["general", "executive", "technical", "sales", "educational", "business"]).default("general"),
  presentationType: z.enum(["Business", "Academic", "Corporate", "Analytical", "Historical"]).default("Business"),
  audienceKnowledge: z.enum(["Novice", "Amateur", "Experienced", "Master"]).default("Amateur"),
  includeGraphs: z.boolean().default(false),
  includeCharts: z.boolean().default(false),
  includeImages: z.boolean().default(false),
  includeAnalytics: z.boolean().default(false),
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

type PromptFormValues = z.infer<typeof promptFormSchema>;
type UploadFormValues = z.infer<typeof uploadFormSchema>;
type TemplateFormValues = z.infer<typeof templateFormSchema>;
type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const STEPS = {
  SELECT_METHOD: 'select-method',
  PROMPT_INPUT: 'prompt-input',
  FILE_UPLOAD: 'file-upload',
  TEMPLATE_SELECTION: 'template-selection',
  PAYMENT: 'payment',
  GENERATING: 'generating',
};

const GOOGLE_SLIDES_TEMPLATES = [
  {
    id: 'modern-business',
    name: 'Modern Business',
    description: 'Clean, professional design perfect for business presentations',
    preview: '/templates/modern-business-preview.jpg',
    features: ['Professional layouts', 'Clean typography', 'Consistent branding']
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    description: 'Vibrant design ideal for creative presentations',
    preview: '/templates/creative-portfolio-preview.jpg',
    features: ['Bold colors', 'Creative layouts', 'Visual emphasis']
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Traditional corporate style with blue accents',
    preview: '/templates/corporate-blue-preview.jpg',
    features: ['Corporate branding', 'Blue color scheme', 'Professional layouts']
  },
  {
    id: 'startup-pitch',
    name: 'Startup Pitch',
    description: 'Dynamic design for startup and investor presentations',
    preview: '/templates/startup-pitch-preview.jpg',
    features: ['Dynamic layouts', 'Investor-focused', 'Modern design']
  }
];

export default function EnhancedPresentationModal({ 
  open, 
  onOpenChange 
}: EnhancedPresentationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedText, setUploadedText] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_METHOD);
  const [creationMethod, setCreationMethod] = useState<'prompt' | 'upload'>('prompt');
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

  // File upload handler with enhanced OCR support
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (30MB limit)
    if (file.size > 30 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 30MB",
        variant: "destructive",
      });
      return;
    }

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
        description: "Content extracted and ready for presentation creation.",
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

  // Generate presentation mutation
  const generatePresentationMutation = useMutation({
    mutationFn: async () => {
      if (!paymentCompleted) {
        throw new Error('Payment required to generate presentation');
      }

      const formData = creationMethod === 'prompt' 
        ? promptForm.getValues() 
        : uploadForm.getValues();

      let payload: any = {
        title: formData.title,
        description: formData.description,
        numberOfSlides: formData.numberOfSlides,
        audienceType: formData.audienceType,
        presentationType: formData.presentationType,
        audienceKnowledge: formData.audienceKnowledge,
        includeGraphs: formData.includeGraphs,
        includeCharts: formData.includeCharts,
        includeImages: formData.includeImages,
        includeAnalytics: formData.includeAnalytics,
        templateId: selectedTemplate,
        sourceType: creationMethod
      };

      if (creationMethod === 'prompt') {
        // Use comprehensive prompt-based workflow
        const promptPayload = {
          title: formData.title,
          prompt: formData.description,
          numberOfSlides: formData.numberOfSlides || 10,
          audienceType: formData.audienceType || 'general',
          presentationTone: formData.presentationType || 'professional',
          templateId: selectedTemplate || 'modern-business'
        };

        const response = await apiRequest("POST", "/api/ai/create-presentation-from-prompt", promptPayload);
        return await response.json();
      } else if (creationMethod === 'upload' && uploadedText) {
        // Use document-based workflow
        const formDataObj = new FormData();
        formDataObj.append('title', formData.title);
        formDataObj.append('numberOfSlides', String(formData.numberOfSlides || 10));
        formDataObj.append('audience', formData.audienceType || 'general');
        formDataObj.append('tone', formData.presentationType || 'professional');
        if (uploadedFile) {
          formDataObj.append('file', uploadedFile);
        }

        const response = await fetch('/api/google-slides/create', {
          method: 'POST',
          body: formDataObj,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create presentation from document');
        }

        return await response.json();
      }

      throw new Error('Invalid creation method or missing data');
    },
    onSuccess: async (data) => {
      setCurrentStep(STEPS.GENERATING);
      
      // Auto-open Google Slides presentation - check multiple possible URL fields
      const editUrl = data.editUrl || data.googleSlides?.editUrl || data.googleSlidesResult?.editUrl;
      if (editUrl) {
        setTimeout(() => {
          window.open(editUrl, '_blank');
        }, 500);
      }
      
      // Force complete cache refresh to show new presentation immediately
      queryClient.removeQueries({ queryKey: ["/api/presentations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      
      // Trigger immediate refetch and then reload page to ensure visibility
      queryClient.refetchQueries({ queryKey: ["/api/presentations"] }).then(() => {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      });
      
      toast({
        title: "Presentation created successfully!",
        description: "Your Google Slides presentation has been created and the page will refresh to show it.",
      });
      
      setTimeout(() => {
        onOpenChange(false);
        resetModal();
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create presentation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Payment processing
  const processPayment = () => {
    const paymentData = paymentForm.getValues();
    
    // Cache current data before payment
    setCachedData({
      formData: creationMethod === 'prompt' ? promptForm.getValues() : uploadForm.getValues(),
      selectedTemplate,
      creationMethod,
      uploadedText,
      uploadedFile
    });

    // Simulate payment processing
    setTimeout(() => {
      setPaymentCompleted(true);
      toast({
        title: "Payment successful!",
        description: "You can now generate your presentation.",
      });
      generatePresentationMutation.mutate();
    }, 2000);
  };

  const resetModal = () => {
    setCurrentStep(STEPS.SELECT_METHOD);
    setCreationMethod('prompt');
    setSelectedTemplate('');
    setPaymentCompleted(false);
    setCachedData(null);
    setUploadedFile(null);
    setUploadedText(null);
    promptForm.reset();
    uploadForm.reset();
    templateForm.reset();
    paymentForm.reset();
  };

  const handleNext = () => {
    switch (currentStep) {
      case STEPS.PROMPT_INPUT:
        if (promptForm.trigger()) {
          setCurrentStep(STEPS.TEMPLATE_SELECTION);
        }
        break;
      case STEPS.FILE_UPLOAD:
        if (uploadForm.trigger() && uploadedText) {
          setCurrentStep(STEPS.TEMPLATE_SELECTION);
        } else if (!uploadedText) {
          toast({
            title: "File Required",
            description: "Please upload and process a file before continuing",
            variant: "destructive",
          });
        }
        break;
      case STEPS.TEMPLATE_SELECTION:
        if (selectedTemplate) {
          setCurrentStep(STEPS.PAYMENT);
        } else {
          toast({
            title: "Template Required",
            description: "Please select a template before continuing",
            variant: "destructive",
          });
        }
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case STEPS.PROMPT_INPUT:
      case STEPS.FILE_UPLOAD:
        setCurrentStep(STEPS.SELECT_METHOD);
        break;
      case STEPS.TEMPLATE_SELECTION:
        setCurrentStep(creationMethod === 'prompt' ? STEPS.PROMPT_INPUT : STEPS.FILE_UPLOAD);
        break;
      case STEPS.PAYMENT:
        setCurrentStep(STEPS.TEMPLATE_SELECTION);
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto modal-content bg-gray-900 border-gray-700">
        <DialogHeader className="animate-slide-up">
          <DialogTitle className="text-white text-xl">Create Enhanced Presentation</DialogTitle>
          <DialogDescription className="text-gray-300">
            Professional slide generation with advanced templates and payment integration
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} className="w-full">
          {/* Method Selection */}
          <TabsContent value={STEPS.SELECT_METHOD} className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className="cursor-pointer card-interactive hover:bg-gray-800/50 border-gray-700 bg-gray-800/30 group animate-slide-up"
                style={{ animationDelay: '0.1s' }}
                onClick={() => {
                  setCreationMethod('prompt');
                  setCurrentStep(STEPS.PROMPT_INPUT);
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 smooth-transition">
                      <Lightbulb className="h-8 w-8 text-blue-400 smooth-transition group-hover:scale-105" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white group-hover:text-blue-300 smooth-transition">Start with a Prompt</CardTitle>
                      <CardDescription className="text-gray-400 group-hover:text-gray-300 smooth-transition">
                        Describe your presentation and let AI create it
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 smooth-transition">
                    Perfect for creating presentations from scratch with AI assistance
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer card-interactive hover:bg-gray-800/50 border-gray-700 bg-gray-800/30 group animate-slide-up"
                style={{ animationDelay: '0.2s' }}
                onClick={() => {
                  setCreationMethod('upload');
                  setCurrentStep(STEPS.FILE_UPLOAD);
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-600/20 rounded-lg group-hover:bg-green-600/30 smooth-transition">
                      <Upload className="h-8 w-8 text-green-400 smooth-transition group-hover:scale-105" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white group-hover:text-green-300 smooth-transition">Upload Document</CardTitle>
                      <CardDescription className="text-gray-400 group-hover:text-gray-300 smooth-transition">
                        Transform existing content into slides
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 smooth-transition">
                    Upload PDF, images, or documents up to 30MB with OCR support
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Prompt Input Step */}
          <TabsContent value={STEPS.PROMPT_INPUT} className="space-y-4">
            <div className="text-center mb-6">
              <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">Describe Your Presentation</h3>
              <p className="text-sm text-muted-foreground">
                Provide detailed information for the best results
              </p>
            </div>
            
            <Form {...promptForm}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={promptForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presentation Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a compelling title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={promptForm.control}
                    name="numberOfSlides"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Number of Slides (5-50)</FormLabel>
                        <FormControl>
                          <NumberInput
                            value={field.value || 10}
                            onChange={field.onChange}
                            min={5}
                            max={50}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={promptForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What should the presentation cover?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of your presentation content, key points, and objectives..."
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={promptForm.control}
                    name="audienceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audience Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    control={promptForm.control}
                    name="presentationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presentation Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Business">Business</SelectItem>
                            <SelectItem value="Academic">Academic</SelectItem>
                            <SelectItem value="Corporate">Corporate</SelectItem>
                            <SelectItem value="Analytical">Analytical</SelectItem>
                            <SelectItem value="Historical">Historical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={promptForm.control}
                    name="audienceKnowledge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audience Knowledge</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Novice">Novice</SelectItem>
                            <SelectItem value="Amateur">Amateur</SelectItem>
                            <SelectItem value="Experienced">Experienced</SelectItem>
                            <SelectItem value="Master">Master</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Add-on Features</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={promptForm.control}
                      name="includeGraphs"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Graphs</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={promptForm.control}
                      name="includeCharts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Pie Charts</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={promptForm.control}
                      name="includeImages"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Images</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={promptForm.control}
                      name="includeAnalytics"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Analytics</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </Form>
          </TabsContent>

          {/* File Upload Step */}
          <TabsContent value={STEPS.FILE_UPLOAD} className="space-y-4">
            <div className="text-center mb-6">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">Upload Your Document</h3>
              <p className="text-sm text-muted-foreground">
                PDF, images, or documents up to 30MB with OCR support
              </p>
            </div>
            
            <Form {...uploadForm}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={uploadForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presentation Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a compelling title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={uploadForm.control}
                    name="numberOfSlides"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Number of Slides (5-50)</FormLabel>
                        <FormControl>
                          <NumberInput
                            value={field.value || 10}
                            onChange={field.onChange}
                            min={5}
                            max={50}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={uploadForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What should the presentation cover?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the main topics and key points you want to highlight from the uploaded document..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx,.doc,.txt,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="enhanced-file-upload"
                  />
                  <label
                    htmlFor="enhanced-file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    {isUploading ? (
                      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="h-12 w-12 text-gray-400" />
                    )}
                    <span className="mt-4 text-lg font-medium text-gray-900">
                      {uploadedFile ? uploadedFile.name : 'Click to upload file'}
                    </span>
                    <span className="text-sm text-gray-500 mt-2">
                      PDF, DOCX, PPTX, Images up to 30MB
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Supports handwriting recognition with advanced OCR
                    </span>
                  </label>
                </div>
                
                {uploadedText && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ File processed successfully. {uploadedText.length} characters extracted and ready for processing.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={uploadForm.control}
                    name="audienceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audience Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    name="presentationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presentation Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Business">Business</SelectItem>
                            <SelectItem value="Academic">Academic</SelectItem>
                            <SelectItem value="Corporate">Corporate</SelectItem>
                            <SelectItem value="Analytical">Analytical</SelectItem>
                            <SelectItem value="Historical">Historical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={uploadForm.control}
                    name="audienceKnowledge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audience Knowledge</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Novice">Novice</SelectItem>
                            <SelectItem value="Amateur">Amateur</SelectItem>
                            <SelectItem value="Experienced">Experienced</SelectItem>
                            <SelectItem value="Master">Master</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Add-on Features</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={uploadForm.control}
                      name="includeGraphs"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Graphs</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={uploadForm.control}
                      name="includeCharts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Pie Charts</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={uploadForm.control}
                      name="includeImages"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Images</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={uploadForm.control}
                      name="includeAnalytics"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Analytics</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </Form>
          </TabsContent>

          {/* Template Selection Step */}
          <TabsContent value={STEPS.TEMPLATE_SELECTION} className="space-y-4">
            <div className="text-center mb-6">
              <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">Choose Your Template</h3>
              <p className="text-sm text-muted-foreground">
                Select from 4 professional Google Slides templates
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GOOGLE_SLIDES_TEMPLATES.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === template.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {selectedTemplate === template.id && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Template Preview</span>
                    </div>
                    <div className="space-y-2">
                      {template.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Payment Step */}
          <TabsContent value={STEPS.PAYMENT} className="space-y-4">
            <div className="text-center mb-6">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">Complete Payment</h3>
              <p className="text-sm text-muted-foreground">
                Choose your preferred payment method
              </p>
            </div>
            
            <Form {...paymentForm}>
              <div className="space-y-6">
                <FormField
                  control={paymentForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                          <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="mobile" id="mobile" />
                            <Label htmlFor="mobile" className="flex items-center cursor-pointer">
                              <Smartphone className="mr-2 h-4 w-4" />
                              Mobile Banking
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="visa" id="visa" />
                            <Label htmlFor="visa" className="flex items-center cursor-pointer">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Visa
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="mastercard" id="mastercard" />
                            <Label htmlFor="mastercard" className="flex items-center cursor-pointer">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Mastercard
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {paymentForm.watch("paymentMethod") === "mobile" && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">Mobile Banking Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Mobile:</strong> 01731295678</p>
                      <p><strong>Providers:</strong> Bkash / Nagad / UPay</p>
                      <p><strong>OTP:</strong> 000000</p>
                    </div>
                    <FormField
                      control={paymentForm.control}
                      name="mobileProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="bkash">Bkash</SelectItem>
                              <SelectItem value="nagad">Nagad</SelectItem>
                              <SelectItem value="upay">UPay</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {(paymentForm.watch("paymentMethod") === "visa" || paymentForm.watch("paymentMethod") === "mastercard") && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">Card Details</h4>
                    <div className="space-y-2 text-sm mb-4">
                      <p><strong>Card Number:</strong> 4242 4242 4242 4242</p>
                      <p><strong>Expiry:</strong> Any valid date</p>
                      <p><strong>CVC:</strong> 888</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl>
                              <Input placeholder="4242 4242 4242 4242" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input placeholder="MM/YY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="cvc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVC</FormLabel>
                            <FormControl>
                              <Input placeholder="888" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Form>
          </TabsContent>

          {/* Generating Step */}
          <TabsContent value={STEPS.GENERATING} className="space-y-4">
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-600" />
              <h3 className="mt-4 text-xl font-semibold">Creating Your Presentation</h3>
              <p className="text-muted-foreground mt-2">
                Generating slides with AI and applying your selected template...
              </p>
              <div className="mt-6 max-w-md mx-auto bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          {currentStep !== STEPS.SELECT_METHOD && currentStep !== STEPS.GENERATING && (
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={generatePresentationMutation.isPending}
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
            
            {currentStep === STEPS.PAYMENT && (
              <Button 
                onClick={processPayment}
                disabled={generatePresentationMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {generatePresentationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Complete Payment & Generate'
                )}
              </Button>
            )}
            
            {(currentStep === STEPS.PROMPT_INPUT || currentStep === STEPS.FILE_UPLOAD || currentStep === STEPS.TEMPLATE_SELECTION) && (
              <Button 
                onClick={handleNext}
                disabled={isUploading}
              >
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}