import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, FileText, Upload, Lightbulb, Eye, CreditCard, Smartphone, Edit3, Plus, Trash2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { NumberInput } from "@/components/ui/number-input";

interface PresentationCreationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Form schemas for each step
const methodSelectionSchema = z.object({
  method: z.enum(["prompt", "upload"]),
});

const promptBasicsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  audienceType: z.enum(["Business", "Academic", "Corporate", "Analytical", "Historical"]),
  numberOfSlides: z.number().min(5).max(50),
  audienceKnowledge: z.enum(["Novice", "Amateur", "Experienced", "Master"]),
  includeGraphs: z.boolean().default(false),
  includeCharts: z.boolean().default(false),
  includeImages: z.boolean().default(false),
  includeAnalytics: z.boolean().default(false),
});

const uploadBasicsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  audienceType: z.enum(["Business", "Academic", "Corporate", "Analytical", "Historical"]),
  numberOfSlides: z.number().min(5).max(50),
  audienceKnowledge: z.enum(["Novice", "Amateur", "Experienced", "Master"]),
  includeGraphs: z.boolean().default(false),
  includeCharts: z.boolean().default(false),
  includeImages: z.boolean().default(false),
  includeAnalytics: z.boolean().default(false),
});

const templateSelectionSchema = z.object({
  templateId: z.string().min(1, "Please select a template"),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(["mobile", "card"]),
  // Mobile banking fields
  mobileProvider: z.enum(["bkash", "nagad", "upay"]).optional(),
  phoneNumber: z.string().optional(),
  otp: z.string().optional(),
  // Card fields
  cardNumber: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvc: z.string().optional(),
  cardholderName: z.string().optional(),
}).refine((data) => {
  if (data.paymentMethod === "mobile") {
    return data.phoneNumber === "01731295678" && data.otp === "000000";
  }
  if (data.paymentMethod === "card") {
    return data.cardNumber === "4242424242424242" && 
           data.cvc === "888" && 
           data.cardholderName && 
           data.expiryMonth && 
           data.expiryYear;
  }
  return false;
}, {
  message: "Please enter the correct test credentials",
});

type MethodSelectionValues = z.infer<typeof methodSelectionSchema>;
type PromptBasicsValues = z.infer<typeof promptBasicsSchema>;
type UploadBasicsValues = z.infer<typeof uploadBasicsSchema>;
type TemplateSelectionValues = z.infer<typeof templateSelectionSchema>;
type PaymentValues = z.infer<typeof paymentSchema>;

// Steps in the flow
const STEPS = {
  METHOD_SELECTION: "method-selection",
  PROMPT_BASICS: "prompt-basics",
  UPLOAD_BASICS: "upload-basics",
  FILE_UPLOAD: "file-upload",
  OUTLINE_CONFIRMATION: "outline-confirmation",
  PRESENTATION_EDITING: "presentation-editing",
  TEMPLATE_SELECTION: "template-selection",
  PAYMENT: "payment",
  GENERATING: "generating",
};

// Google Slides templates with visual previews
const GOOGLE_SLIDES_TEMPLATES = [
  {
    id: "business-modern",
    name: "Modern Business",
    description: "Clean and professional design perfect for business presentations",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-white rounded-lg overflow-hidden border">
        <div className="h-8 bg-blue-600 flex items-center px-3">
          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
          <div className="w-16 h-1 bg-blue-200 rounded"></div>
        </div>
        <div className="p-3 space-y-2">
          <div className="w-3/4 h-2 bg-gray-800 rounded"></div>
          <div className="w-1/2 h-1 bg-gray-400 rounded"></div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="h-6 bg-blue-100 rounded"></div>
            <div className="h-6 bg-blue-100 rounded"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "academic-classic",
    name: "Academic Classic", 
    description: "Traditional academic layout with serif fonts and formal styling",
    preview: (
      <div className="w-full h-full bg-white rounded-lg overflow-hidden border">
        <div className="h-6 bg-gray-100 border-b flex items-center px-2">
          <div className="w-12 h-1 bg-gray-600 rounded"></div>
        </div>
        <div className="p-3 space-y-2">
          <div className="w-full h-2 bg-gray-800 rounded-sm"></div>
          <div className="w-5/6 h-1 bg-gray-600 rounded-sm"></div>
          <div className="w-4/5 h-1 bg-gray-600 rounded-sm"></div>
          <div className="mt-3 space-y-1">
            <div className="w-1/3 h-1 bg-gray-400 rounded-sm"></div>
            <div className="w-1/2 h-1 bg-gray-400 rounded-sm"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "corporate-sleek",
    name: "Corporate Sleek",
    description: "Sophisticated corporate design with bold colors and charts",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
        <div className="h-6 bg-orange-500 flex items-center px-2">
          <div className="w-1 h-1 bg-white rounded-full mr-1"></div>
          <div className="w-8 h-0.5 bg-orange-200 rounded"></div>
        </div>
        <div className="p-2 space-y-2">
          <div className="w-3/4 h-1.5 bg-white rounded"></div>
          <div className="flex space-x-1 mt-2">
            <div className="w-4 h-3 bg-orange-400 rounded-sm"></div>
            <div className="w-3 h-2 bg-orange-300 rounded-sm mt-1"></div>
            <div className="w-5 h-4 bg-orange-500 rounded-sm"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "analytical-data",
    name: "Data Analytics",
    description: "Optimized for data presentation with chart-friendly layouts",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 rounded-lg overflow-hidden">
        <div className="h-5 bg-white/20 flex items-center px-2">
          <div className="w-6 h-0.5 bg-white rounded"></div>
        </div>
        <div className="p-2 space-y-1">
          <div className="w-2/3 h-1.5 bg-white rounded"></div>
          <div className="w-1/2 h-1 bg-white/80 rounded"></div>
          <div className="grid grid-cols-3 gap-1 mt-2">
            <div className="h-2 bg-yellow-300 rounded-full"></div>
            <div className="h-2 bg-green-300 rounded-full"></div>
            <div className="h-2 bg-blue-300 rounded-full"></div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function PresentationCreationFlow({ 
  open, 
  onOpenChange 
}: PresentationCreationFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(STEPS.METHOD_SELECTION);
  const [selectedMethod, setSelectedMethod] = useState<"prompt" | "upload" | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [generatedOutline, setGeneratedOutline] = useState<any>(null);
  const [editedSlides, setEditedSlides] = useState<any[]>([]);
  const [cachedData, setCachedData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Forms for each step
  const methodForm = useForm<MethodSelectionValues>({
    resolver: zodResolver(methodSelectionSchema),
    defaultValues: { method: "prompt" },
  });

  const promptForm = useForm<PromptBasicsValues>({
    resolver: zodResolver(promptBasicsSchema),
    defaultValues: {
      title: "",
      description: "",
      audienceType: "Business",
      numberOfSlides: 10,
      audienceKnowledge: "Amateur",
      includeGraphs: false,
      includeCharts: false,
      includeImages: false,
      includeAnalytics: false,
    },
  });

  const uploadForm = useForm<UploadBasicsValues>({
    resolver: zodResolver(uploadBasicsSchema),
    defaultValues: {
      title: "",
      description: "",
      audienceType: "Business",
      numberOfSlides: 10,
      audienceKnowledge: "Amateur",
      includeGraphs: false,
      includeCharts: false,
      includeImages: false,
      includeAnalytics: false,
    },
  });

  const templateForm = useForm<TemplateSelectionValues>({
    resolver: zodResolver(templateSelectionSchema),
    defaultValues: { templateId: "" },
  });

  const paymentForm = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { 
      paymentMethod: "mobile",
      mobileProvider: "bkash",
    },
  });

  // Generate outline mutation
  const generateOutlineMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/generate-outline", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedOutline(data);
      setCurrentStep(STEPS.OUTLINE_CONFIRMATION);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate outline",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create Google Slides presentation mutation
  const createGoogleSlidesMutation = useMutation({
    mutationFn: async (data: {
      outline: any;
      templateId: string;
      formData: any;
      fileContent?: string;
    }) => {
      if (uploadedFile && extractedText) {
        // Use file-based Google Slides creation
        const formData = new FormData();
        formData.append('title', data.outline.title);
        formData.append('slides', JSON.stringify(data.outline.slides));
        formData.append('templateId', data.templateId);
        formData.append('file', uploadedFile);
        formData.append('extractedText', extractedText);

        const response = await fetch('/api/google-slides/create', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to create Google Slides presentation');
        }
        return await response.json();
      } else {
        // Convert outline format to slides format if needed
        const slidesData = data.outline.slides || data.outline.outline || [];
        
        // Use prompt-based Google Slides creation
        const response = await apiRequest('POST', '/api/google-slides/create-from-slides', {
          title: data.outline.title,
          slides: slidesData,
          templateId: data.templateId,
          formData: data.formData,
        });
        return await response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      
      // Open Google Slides in new tab with edit access
      if (data.editUrl) {
        window.open(data.editUrl, '_blank');
      }
      
      toast({
        title: "Presentation created successfully!",
        description: "Your Google Slides presentation is ready with edit access.",
      });
      
      onOpenChange(false);
      resetFlow();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create presentation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (30MB limit)
    if (file.size > 30 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 30MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadedFile(file);

    // Auto-fill title from filename
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
      setExtractedText(data.text);
      
      toast({
        title: "File processed successfully",
        description: "Text extracted from your file, including handwriting if present.",
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

  // Navigation handlers
  const handleNext = () => {
    switch (currentStep) {
      case STEPS.METHOD_SELECTION:
        const method = methodForm.getValues().method;
        setSelectedMethod(method);
        if (method === "prompt") {
          setCurrentStep(STEPS.PROMPT_BASICS);
        } else {
          setCurrentStep(STEPS.UPLOAD_BASICS);
        }
        break;
      
      case STEPS.PROMPT_BASICS:
        const promptData = promptForm.getValues();
        if (promptData.title && promptData.description) {
          generateOutlineMutation.mutate({
            prompt: promptData.description, // Map description to prompt for API
            numberOfSlides: promptData.numberOfSlides,
            audienceType: promptData.audienceType,
            audienceKnowledge: promptData.audienceKnowledge,
            sourceType: "prompt",
            language: "english",
            presentationTone: "professional",
            includeGraphs: promptData.includeGraphs,
            includeCharts: promptData.includeCharts,
            includeImages: promptData.includeImages,
            includeAnalytics: promptData.includeAnalytics,
          });
        }
        break;
      
      case STEPS.UPLOAD_BASICS:
        setCurrentStep(STEPS.FILE_UPLOAD);
        break;
      
      case STEPS.FILE_UPLOAD:
        if (uploadedFile && extractedText) {
          const uploadData = uploadForm.getValues();
          generateOutlineMutation.mutate({
            topic: uploadData.description, // Map description to topic for API
            numberOfSlides: uploadData.numberOfSlides,
            audienceType: uploadData.audienceType,
            audienceKnowledge: uploadData.audienceKnowledge,
            sourceType: "upload",
            language: "english",
            presentationTone: "professional",
            pdfContent: extractedText,
            includeGraphs: uploadData.includeGraphs,
            includeCharts: uploadData.includeCharts,
            includeImages: uploadData.includeImages,
            includeAnalytics: uploadData.includeAnalytics,
          });
        } else {
          toast({
            title: "File Required",
            description: "Please upload and process a file before continuing",
            variant: "destructive",
          });
        }
        break;
      
      case STEPS.OUTLINE_CONFIRMATION:
        setCurrentStep(STEPS.PRESENTATION_EDITING);
        break;
      
      case STEPS.PRESENTATION_EDITING:
        setCurrentStep(STEPS.TEMPLATE_SELECTION);
        break;
      
      case STEPS.TEMPLATE_SELECTION:
        const templateId = templateForm.getValues().templateId;
        if (templateId) {
          setCurrentStep(STEPS.PAYMENT);
        }
        break;
      
      case STEPS.PAYMENT:
        // Store data in cache before payment
        const formData = selectedMethod === "prompt" ? promptForm.getValues() : uploadForm.getValues();
        setCachedData({
          outline: generatedOutline,
          templateId: templateForm.getValues().templateId,
          formData,
          method: selectedMethod,
        });
        
        // Simulate payment process
        handlePaymentComplete();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case STEPS.PROMPT_BASICS:
      case STEPS.UPLOAD_BASICS:
        setCurrentStep(STEPS.METHOD_SELECTION);
        break;
      case STEPS.FILE_UPLOAD:
        setCurrentStep(STEPS.UPLOAD_BASICS);
        break;
      case STEPS.OUTLINE_CONFIRMATION:
        setCurrentStep(selectedMethod === "prompt" ? STEPS.PROMPT_BASICS : STEPS.FILE_UPLOAD);
        break;
      case STEPS.TEMPLATE_SELECTION:
        setCurrentStep(STEPS.OUTLINE_CONFIRMATION);
        break;
      case STEPS.PAYMENT:
        setCurrentStep(STEPS.TEMPLATE_SELECTION);
        break;
    }
  };

  const handlePaymentComplete = () => {
    setCurrentStep(STEPS.GENERATING);
    
    // Create Google Slides presentation
    const data = cachedData || {
      outline: generatedOutline,
      templateId: templateForm.getValues().templateId,
      formData: selectedMethod === "prompt" ? promptForm.getValues() : uploadForm.getValues(),
    };

    const finalSlides = editedSlides.length > 0 ? editedSlides : (generatedOutline?.slides || generatedOutline?.outline || []);
    
    createGoogleSlidesMutation.mutate({
      outline: {
        title: generatedOutline?.title || "Generated Presentation",
        slides: finalSlides
      },
      templateId: data.templateId,
      formData: selectedMethod === "prompt" ? promptForm.getValues() : uploadForm.getValues(),
      fileContent: extractedText ?? undefined,
    });
  };

  const resetFlow = () => {
    setCurrentStep(STEPS.METHOD_SELECTION);
    setSelectedMethod(null);
    setUploadedFile(null);
    setExtractedText(null);
    setGeneratedOutline(null);
    setCachedData(null);
    methodForm.reset();
    promptForm.reset();
    uploadForm.reset();
    templateForm.reset();
    paymentForm.reset();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.METHOD_SELECTION:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Choose Creation Method</h3>
              <p className="text-gray-400">How would you like to create your presentation?</p>
            </div>
            
            <Form {...methodForm}>
              <div className="flex flex-col items-center space-y-8 animate-in fade-in-50 duration-700">
                {/* Slider Toggle */}
                <div className="relative overflow-hidden group">
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-green-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-1000 animate-pulse"></div>
                  
                  <div className="relative flex items-center space-x-8 bg-gray-800/60 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-md shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:scale-[1.02] hover:border-gray-600/70">
                    {/* Left Option */}
                    <div className={`flex items-center space-x-4 transition-all duration-500 transform ${
                      methodForm.watch('method') === 'prompt' 
                        ? 'opacity-100 scale-110 text-blue-400' 
                        : 'opacity-60 scale-95 text-gray-400 hover:opacity-80'
                    }`}>
                      <div className={`p-3 rounded-xl transition-all duration-500 ${
                        methodForm.watch('method') === 'prompt'
                          ? 'bg-blue-500/20 shadow-lg shadow-blue-500/25 animate-pulse'
                          : 'bg-gray-700/30'
                      }`}>
                        <Lightbulb className="h-7 w-7" />
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-lg block">Start with Prompt</span>
                        <span className="text-xs opacity-70">AI-powered creation</span>
                      </div>
                    </div>
                    
                    {/* Enhanced Switch */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full blur-md opacity-30 animate-pulse"></div>
                      <Switch
                        checked={methodForm.watch('method') === 'upload'}
                        onCheckedChange={(checked) => {
                          methodForm.setValue('method', checked ? 'upload' : 'prompt');
                          setSelectedMethod(checked ? 'upload' : 'prompt');
                        }}
                        className="relative data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600 data-[state=unchecked]:bg-gradient-to-r data-[state=unchecked]:from-blue-500 data-[state=unchecked]:to-indigo-600 shadow-lg scale-125 transition-all duration-300 hover:scale-130"
                      />
                    </div>
                    
                    {/* Right Option */}
                    <div className={`flex items-center space-x-4 transition-all duration-500 transform ${
                      methodForm.watch('method') === 'upload' 
                        ? 'opacity-100 scale-110 text-green-400' 
                        : 'opacity-60 scale-95 text-gray-400 hover:opacity-80'
                    }`}>
                      <div className={`p-3 rounded-xl transition-all duration-500 ${
                        methodForm.watch('method') === 'upload'
                          ? 'bg-green-500/20 shadow-lg shadow-green-500/25 animate-pulse'
                          : 'bg-gray-700/30'
                      }`}>
                        <Upload className="h-7 w-7" />
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-lg block">Upload Document</span>
                        <span className="text-xs opacity-70">Transform existing content</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Description Card */}
                <Card className="bg-gradient-to-br from-gray-800/40 via-gray-800/60 to-gray-900/40 border-gray-700/50 backdrop-blur-xl w-full max-w-lg shadow-2xl hover:shadow-purple-500/10 transition-all duration-700 hover:scale-[1.02] group overflow-hidden">
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                  
                  <CardContent className="relative pt-8 pb-6">
                    <div className="overflow-hidden">
                      {methodForm.watch('method') === 'prompt' ? (
                        <div className="text-center space-y-4 animate-in slide-in-from-left-5 duration-500">
                          <div className="relative mx-auto w-16 h-16">
                            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-lg animate-pulse"></div>
                            <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500/30 to-indigo-600/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-blue-400/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                              <Lightbulb className="h-8 w-8 text-blue-400 animate-pulse" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                              AI-Powered Creation
                            </h4>
                            <p className="text-gray-300 text-sm leading-relaxed max-w-md mx-auto">
                              Describe your presentation topic and let our AI generate professional slides with intelligent content and design recommendations.
                            </p>
                          </div>
                          <div className="flex items-center justify-center space-x-6 text-xs text-blue-300/80 mt-6">
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                              <span>Smart content generation</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
                              <span>Professional templates</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4 animate-in slide-in-from-right-5 duration-500">
                          <div className="relative mx-auto w-16 h-16">
                            <div className="absolute inset-0 bg-green-500/30 rounded-full blur-lg animate-pulse"></div>
                            <div className="relative w-16 h-16 bg-gradient-to-br from-green-500/30 to-emerald-600/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-green-400/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                              <Upload className="h-8 w-8 text-green-400 animate-pulse" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                              Document Transformation
                            </h4>
                            <p className="text-gray-300 text-sm leading-relaxed max-w-md mx-auto">
                              Upload your PDF, images, or documents (up to 30MB) and transform them into engaging presentations with handwriting recognition.
                            </p>
                          </div>
                          <div className="flex items-center justify-center space-x-6 text-xs text-green-300/80 mt-6">
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                              <span>OCR & handwriting support</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                              <span>30MB file limit</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Form>
          </div>
        );

      case STEPS.PROMPT_BASICS:
        return (
          <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-700">
            <div className="text-center relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
              </div>
              <div className="relative p-4 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-2xl backdrop-blur-sm border border-blue-400/20 inline-block shadow-xl hover:scale-105 transition-transform duration-500">
                <Lightbulb className="mx-auto h-14 w-14 text-blue-400 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-white mt-6 mb-3 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Tell Us About Your Presentation
              </h3>
              <p className="text-gray-300 max-w-md mx-auto leading-relaxed">Provide details to help us create the perfect slides tailored to your audience</p>
            </div>
            
            <Form {...promptForm}>
              <div className="space-y-6 bg-gradient-to-br from-gray-800/30 via-gray-800/20 to-gray-900/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group">
                <FormField
                  control={promptForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="group/field">
                      <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider mb-3 block group-hover/field:text-blue-300 transition-colors duration-300">Title</FormLabel>
                      <FormControl>
                        <div className="relative overflow-hidden rounded-xl">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                          <Input 
                            placeholder="Enter presentation title"
                            className="relative bg-gray-800/70 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 h-12 text-lg"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={promptForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="group/field">
                      <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider mb-3 block group-hover/field:text-blue-300 transition-colors duration-300">What should the presentation cover?</FormLabel>
                      <FormControl>
                        <div className="relative overflow-hidden rounded-xl">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                          <Textarea 
                            placeholder="Describe the main topics, goals, and key points..."
                            className="relative bg-gray-800/70 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 min-h-24 resize-none"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={promptForm.control}
                    name="audienceType"
                    render={({ field }) => (
                      <FormItem className="group/field">
                        <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider mb-3 block group-hover/field:text-blue-300 transition-colors duration-300">Presentation Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <div className="relative overflow-hidden rounded-xl">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                              <SelectTrigger className="relative bg-gray-800/70 border-gray-600/50 text-white focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 h-12">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </div>
                          </FormControl>
                          <SelectContent className="bg-gray-800/95 border-gray-600/50 backdrop-blur-xl">
                            <SelectItem value="Business" className="hover:bg-blue-600/20 focus:bg-blue-600/20">Business</SelectItem>
                            <SelectItem value="Academic" className="hover:bg-blue-600/20 focus:bg-blue-600/20">Academic</SelectItem>
                            <SelectItem value="Corporate" className="hover:bg-blue-600/20 focus:bg-blue-600/20">Corporate</SelectItem>
                            <SelectItem value="Analytical" className="hover:bg-blue-600/20 focus:bg-blue-600/20">Analytical</SelectItem>
                            <SelectItem value="Historical" className="hover:bg-blue-600/20 focus:bg-blue-600/20">Historical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={promptForm.control}
                    name="numberOfSlides"
                    render={({ field }) => (
                      <FormItem className="group/field">
                        <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider mb-3 block group-hover/field:text-blue-300 transition-colors duration-300">Number of Slides</FormLabel>
                        <FormControl>
                          <div className="relative overflow-hidden rounded-xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                            <NumberInput
                              value={field.value || 10}
                              onChange={field.onChange}
                              min={5}
                              max={50}
                              className="relative"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={promptForm.control}
                  name="audienceKnowledge"
                  render={({ field }) => (
                    <FormItem className="group/field">
                      <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider mb-3 block group-hover/field:text-blue-300 transition-colors duration-300">Audience Knowledge Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <div className="relative overflow-hidden rounded-xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                            <SelectTrigger className="relative bg-gray-800/70 border-gray-600/50 text-white focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 h-12">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent className="bg-gray-800/95 border-gray-600/50 backdrop-blur-xl">
                          <SelectItem value="Novice" className="hover:bg-blue-600/20 focus:bg-blue-600/20">Novice</SelectItem>
                          <SelectItem value="Amateur" className="hover:bg-blue-600/20 focus:bg-blue-600/20">Amateur</SelectItem>
                          <SelectItem value="Experienced" className="hover:bg-blue-600/20 focus:bg-blue-600/20">Experienced</SelectItem>
                          <SelectItem value="Master" className="hover:bg-blue-600/20 focus:bg-blue-600/20">Master</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Label className="text-gray-200 font-medium text-sm uppercase tracking-wider">Add-ons (Optional)</Label>
                  <div className="grid grid-cols-2 gap-4 p-6 bg-gradient-to-br from-gray-700/20 to-gray-800/30 rounded-xl border border-gray-600/30 backdrop-blur-sm group hover:bg-gradient-to-br hover:from-gray-700/30 hover:to-gray-800/40 transition-all duration-500">
                    <FormField
                      control={promptForm.control}
                      name="includeGraphs"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 group/checkbox hover:scale-105 transition-transform duration-300">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover/checkbox:border-blue-400 transition-all duration-300 shadow-lg"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-gray-300 text-sm group-hover/checkbox:text-blue-300 transition-colors duration-300 cursor-pointer">
                              Include Graphs
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={promptForm.control}
                      name="includeCharts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 group/checkbox hover:scale-105 transition-transform duration-300">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover/checkbox:border-blue-400 transition-all duration-300 shadow-lg"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-gray-300 text-sm group-hover/checkbox:text-blue-300 transition-colors duration-300 cursor-pointer">
                              Include Charts
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={promptForm.control}
                      name="includeImages"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 group/checkbox hover:scale-105 transition-transform duration-300">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover/checkbox:border-blue-400 transition-all duration-300 shadow-lg"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-gray-300 text-sm group-hover/checkbox:text-blue-300 transition-colors duration-300 cursor-pointer">
                              Include Images
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={promptForm.control}
                      name="includeAnalytics"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 group/checkbox hover:scale-105 transition-transform duration-300">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover/checkbox:border-blue-400 transition-all duration-300 shadow-lg"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-gray-300 text-sm group-hover/checkbox:text-blue-300 transition-colors duration-300 cursor-pointer">
                              Include Analytics
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </Form>
          </div>
        );

      case STEPS.UPLOAD_BASICS:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Document Upload Details</h3>
              <p className="text-gray-400">Tell us about your document before uploading</p>
            </div>
            
            <Form {...uploadForm}>
              <div className="space-y-4">
                <FormField
                  control={uploadForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter presentation title"
                          className="bg-gray-800 border-gray-600 text-white"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={uploadForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">What should the presentation cover?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe how the document content should be presented..."
                          className="bg-gray-800 border-gray-600 text-white min-h-20"
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
                    name="audienceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Presentation Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-600">
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
                    name="numberOfSlides"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 font-medium">Number of Slides</FormLabel>
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
                  name="audienceKnowledge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Audience Knowledge Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-600">
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

                <div>
                  <Label className="text-gray-300 text-sm font-medium">Add-ons (Optional)</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {/* Same checkbox fields as prompt form */}
                    <FormField
                      control={uploadForm.control}
                      name="includeGraphs"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-gray-600"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-gray-300 text-sm">
                              Include Graphs
                            </FormLabel>
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
                              className="border-gray-600"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-gray-300 text-sm">
                              Include Charts
                            </FormLabel>
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
                              className="border-gray-600"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-gray-300 text-sm">
                              Include Images
                            </FormLabel>
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
                              className="border-gray-600"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-gray-300 text-sm">
                              Include Analytics
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </Form>
          </div>
        );

      case STEPS.FILE_UPLOAD:
        return (
          <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-700">
            <div className="text-center relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
              </div>
              <div className="relative p-4 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-2xl backdrop-blur-sm border border-green-400/20 inline-block shadow-xl hover:scale-105 transition-transform duration-500">
                <Upload className="mx-auto h-14 w-14 text-green-400 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-white mt-6 mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Upload Your Document
              </h3>
              <p className="text-gray-300 max-w-md mx-auto leading-relaxed">Upload PDF or image files (up to 30MB) with handwriting recognition support</p>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
              
              <div className="relative border-2 border-dashed border-gray-600/50 hover:border-green-500/50 rounded-2xl p-12 text-center bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-green-500/10">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label 
                  htmlFor="file-upload" 
                  className="cursor-pointer block"
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500/30 rounded-full blur-md animate-pulse"></div>
                        <Loader2 className="relative h-12 w-12 animate-spin text-green-400" />
                      </div>
                      <div>
                        <span className="text-white font-medium text-lg block">Processing file...</span>
                        <span className="text-green-300 text-sm">Extracting content with AI</span>
                      </div>
                    </div>
                  ) : uploadedFile ? (
                    <div className="space-y-4">
                      <div className="relative mx-auto w-16 h-16">
                        <div className="absolute inset-0 bg-green-500/30 rounded-full blur-lg animate-pulse"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-br from-green-500/30 to-emerald-600/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-green-400/20 shadow-xl">
                          <FileText className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">{uploadedFile.name}</p>
                        <p className="text-green-300 text-sm mt-1">File processed successfully</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 group-hover:scale-105 transition-transform duration-300">
                      <div className="relative mx-auto w-16 h-16">
                        <div className="absolute inset-0 bg-gray-500/20 rounded-full blur-lg group-hover:bg-green-500/20 transition-colors duration-500"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-br from-gray-600/20 to-gray-700/20 group-hover:from-green-500/20 group-hover:to-emerald-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-gray-500/20 group-hover:border-green-400/20 shadow-xl transition-all duration-500">
                          <Upload className="h-8 w-8 text-gray-400 group-hover:text-green-400 transition-colors duration-500" />
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-300 group-hover:text-white font-medium text-lg transition-colors duration-300">Click to upload file</p>
                        <p className="text-gray-500 group-hover:text-green-300 text-sm mt-1 transition-colors duration-300">PDF, Images, Documents up to 30MB</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {extractedText && (
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/50 rounded-2xl p-6 backdrop-blur-sm animate-in slide-in-from-bottom-3 duration-500">
                <h4 className="text-white font-semibold text-lg mb-3 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                  Extracted Content Preview
                </h4>
                <div className="bg-gray-900/50 rounded-xl p-4 max-h-40 overflow-y-auto">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {extractedText.substring(0, 500)}
                    {extractedText.length > 500 && "..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case STEPS.OUTLINE_CONFIRMATION:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Eye className="mx-auto h-12 w-12 text-indigo-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Review Your Presentation Outline</h3>
              <p className="text-gray-400">Check the generated outline and make any adjustments</p>
            </div>
            
            {generatedOutline && (
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                <h4 className="text-white font-semibold text-lg mb-4">{generatedOutline.title}</h4>
                
                {generatedOutline.summary && (
                  <div className="mb-6">
                    <h5 className="text-gray-300 font-medium mb-2">Summary:</h5>
                    <p className="text-gray-400 text-sm">{generatedOutline.summary}</p>
                  </div>
                )}
                
                {(generatedOutline.slides || generatedOutline.outline) && (
                  <div>
                    <h5 className="text-gray-300 font-medium mb-3">
                      Slides ({(generatedOutline.slides || generatedOutline.outline).length}):
                    </h5>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {(generatedOutline.slides || generatedOutline.outline).map((slide: any, index: number) => (
                        <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                          <h6 className="text-white font-medium text-sm">
                            Slide {index + 1}: {slide.title}
                          </h6>
                          <p className="text-gray-400 text-xs mt-1">
                            {slide.content || slide.key_points?.join(", ") || slide.notes || "Content to be generated"}
                          </p>
                          {slide.type && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                              {slide.type}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case STEPS.PRESENTATION_EDITING:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Edit3 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Edit Your Presentation</h3>
              <p className="text-gray-400">Modify slides, add content, or adjust the structure</p>
            </div>
            
            {generatedOutline && (
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold text-lg">{generatedOutline.title}</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const slides = generatedOutline.slides || generatedOutline.outline || [];
                      setEditedSlides([...slides, {
                        title: "New Slide",
                        content: "Add your content here...",
                        type: "content"
                      }]);
                    }}
                    className="bg-emerald-600/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slide
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {(editedSlides.length > 0 ? editedSlides : (generatedOutline.slides || generatedOutline.outline || [])).map((slide: any, index: number) => (
                    <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 group hover:border-gray-600 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => {
                            const updatedSlides = [...(editedSlides.length > 0 ? editedSlides : (generatedOutline.slides || generatedOutline.outline || []))];
                            updatedSlides[index] = { ...updatedSlides[index], title: e.target.value };
                            setEditedSlides(updatedSlides);
                          }}
                          className="bg-transparent text-white font-medium text-sm border-none outline-none flex-1 hover:bg-gray-800/50 rounded px-2 py-1 transition-colors"
                          placeholder="Slide title..."
                        />
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedSlides = [...(editedSlides.length > 0 ? editedSlides : (generatedOutline.slides || generatedOutline.outline || []))];
                              updatedSlides.splice(index, 1);
                              setEditedSlides(updatedSlides);
                            }}
                            className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <textarea
                        value={slide.content || slide.key_points?.join(", ") || slide.notes || ""}
                        onChange={(e) => {
                          const updatedSlides = [...(editedSlides.length > 0 ? editedSlides : (generatedOutline.slides || generatedOutline.outline || []))];
                          updatedSlides[index] = { ...updatedSlides[index], content: e.target.value };
                          setEditedSlides(updatedSlides);
                        }}
                        className="w-full bg-gray-800/50 text-gray-300 text-sm border border-gray-700 rounded p-3 resize-none transition-colors focus:border-gray-600 focus:outline-none"
                        rows={3}
                        placeholder="Add slide content..."
                      />
                      
                      {slide.type && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                          {slide.type}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    💡 Tip: Click on slide titles and content to edit them. Use the + button to add new slides or the trash icon to remove slides.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case STEPS.TEMPLATE_SELECTION:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Eye className="mx-auto h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Choose Your Google Slides Template</h3>
              <p className="text-gray-400">Select from 4 professional templates with preview</p>
            </div>
            
            <Form {...templateForm}>
              <FormField
                control={templateForm.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {GOOGLE_SLIDES_TEMPLATES.map((template) => (
                          <div key={template.id} className="space-y-2">
                            <Card 
                              className={`bg-gray-800/50 border-gray-700 cursor-pointer transition-colors ${
                                field.value === template.id ? 'border-indigo-500 bg-indigo-500/10' : 'hover:bg-gray-800/70'
                              }`}
                              onClick={() => field.onChange(template.id)}
                            >
                              <CardHeader className="p-4">
                                <div className="aspect-video rounded-lg mb-3 overflow-hidden">
                                  {template.preview}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value={template.id} id={template.id} />
                                  <div>
                                    <CardTitle className="text-white text-sm">{template.name}</CardTitle>
                                    <CardDescription className="text-gray-400 text-xs">
                                      {template.description}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>
        );

      case STEPS.PAYMENT:
        return (
          <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-700">
            <div className="text-center relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
              </div>
              <div className="relative p-4 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-2xl backdrop-blur-sm border border-green-400/20 inline-block shadow-xl hover:scale-105 transition-transform duration-500">
                <CreditCard className="mx-auto h-14 w-14 text-green-400 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-white mt-6 mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Complete Payment
              </h3>
              <p className="text-gray-300 max-w-md mx-auto leading-relaxed">Secure payment processing with test credentials</p>
            </div>
            
            <Form {...paymentForm}>
              <div className="space-y-6 bg-gradient-to-br from-gray-800/30 via-gray-800/20 to-gray-900/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
                {/* Payment Method Selection */}
                <FormField
                  control={paymentForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-gray-200 font-medium text-lg">Payment Method</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className={`relative p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer group ${
                            field.value === 'mobile' 
                              ? 'border-blue-500 bg-blue-500/10' 
                              : 'border-gray-600/50 hover:border-gray-500/70 hover:bg-gray-800/50'
                          }`}>
                            <RadioGroupItem value="mobile" id="mobile" className="absolute top-3 right-3" />
                            <Label htmlFor="mobile" className="cursor-pointer">
                              <div className="flex flex-col items-center space-y-2 text-center">
                                <Smartphone className="h-8 w-8 text-blue-400" />
                                <span className="text-white font-medium">Mobile Banking</span>
                                <span className="text-gray-400 text-xs">bKash, Nagad, Upay</span>
                              </div>
                            </Label>
                          </div>
                          
                          <div className={`relative p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer group ${
                            field.value === 'card' 
                              ? 'border-green-500 bg-green-500/10' 
                              : 'border-gray-600/50 hover:border-gray-500/70 hover:bg-gray-800/50'
                          }`}>
                            <RadioGroupItem value="card" id="card" className="absolute top-3 right-3" />
                            <Label htmlFor="card" className="cursor-pointer">
                              <div className="flex flex-col items-center space-y-2 text-center">
                                <CreditCard className="h-8 w-8 text-green-400" />
                                <span className="text-white font-medium">Credit Card</span>
                                <span className="text-gray-400 text-xs">Visa, Mastercard</span>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mobile Banking Fields */}
                {paymentForm.watch('paymentMethod') === 'mobile' && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-500">
                    <FormField
                      control={paymentForm.control}
                      name="mobileProvider"
                      render={({ field }) => (
                        <FormItem className="group/field">
                          <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider">Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <div className="relative overflow-hidden rounded-xl">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                                <SelectTrigger className="relative bg-gray-800/70 border-gray-600/50 text-white focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 h-12">
                                  <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                              </div>
                            </FormControl>
                            <SelectContent className="bg-gray-800/95 border-gray-600/50 backdrop-blur-xl">
                              <SelectItem value="bkash">bKash</SelectItem>
                              <SelectItem value="nagad">Nagad</SelectItem>
                              <SelectItem value="upay">Upay</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={paymentForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem className="group/field">
                          <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider">Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative overflow-hidden rounded-xl">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                              <Input 
                                placeholder="01731295678"
                                className="relative bg-gray-800/70 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 h-12 text-lg"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={paymentForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem className="group/field">
                          <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider">OTP</FormLabel>
                          <FormControl>
                            <div className="relative overflow-hidden rounded-xl">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                              <Input 
                                placeholder="000000"
                                className="relative bg-gray-800/70 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 h-12 text-lg"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Card Fields */}
                {paymentForm.watch('paymentMethod') === 'card' && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-500">
                    <FormField
                      control={paymentForm.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem className="group/field">
                          <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider">Card Number</FormLabel>
                          <FormControl>
                            <div className="relative overflow-hidden rounded-xl">
                              <div className="absolute inset-0 bg-gradient-to-r from-green-600/15 to-emerald-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                              <Input 
                                placeholder="4242 4242 4242 4242"
                                className="relative bg-gray-800/70 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-green-500/70 focus:ring-2 focus:ring-green-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 h-12 text-lg"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={paymentForm.control}
                      name="cardholderName"
                      render={({ field }) => (
                        <FormItem className="group/field">
                          <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider">Cardholder Name</FormLabel>
                          <FormControl>
                            <div className="relative overflow-hidden rounded-xl">
                              <div className="absolute inset-0 bg-gradient-to-r from-green-600/15 to-emerald-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                              <Input 
                                placeholder="John Doe"
                                className="relative bg-gray-800/70 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-green-500/70 focus:ring-2 focus:ring-green-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 h-12 text-lg"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="expiryMonth"
                        render={({ field }) => (
                          <FormItem className="group/field">
                            <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider">Month</FormLabel>
                            <FormControl>
                              <div className="relative overflow-hidden rounded-xl">
                                <div className="absolute inset-0 bg-gradient-to-r from-green-600/15 to-emerald-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                                <Input 
                                  placeholder="12"
                                  className="relative bg-gray-800/70 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-green-500/70 focus:ring-2 focus:ring-green-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 h-12 text-lg"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={paymentForm.control}
                        name="expiryYear"
                        render={({ field }) => (
                          <FormItem className="group/field">
                            <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider">Year</FormLabel>
                            <FormControl>
                              <div className="relative overflow-hidden rounded-xl">
                                <div className="absolute inset-0 bg-gradient-to-r from-green-600/15 to-emerald-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                                <Input 
                                  placeholder="2025"
                                  className="relative bg-gray-800/70 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-green-500/70 focus:ring-2 focus:ring-green-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 h-12 text-lg"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={paymentForm.control}
                        name="cvc"
                        render={({ field }) => (
                          <FormItem className="group/field">
                            <FormLabel className="text-gray-200 font-medium text-sm uppercase tracking-wider">CVC</FormLabel>
                            <FormControl>
                              <div className="relative overflow-hidden rounded-xl">
                                <div className="absolute inset-0 bg-gradient-to-r from-green-600/15 to-emerald-600/15 opacity-0 group-hover/field:opacity-100 transition-opacity duration-500"></div>
                                <Input 
                                  placeholder="888"
                                  className="relative bg-gray-800/70 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-green-500/70 focus:ring-2 focus:ring-green-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/90 h-12 text-lg"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Test Credentials Info */}
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/20 rounded-xl p-4 backdrop-blur-sm">
                  <h4 className="text-amber-300 font-medium mb-2 flex items-center">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></div>
                    Test Mode - Use These Credentials
                  </h4>
                  <div className="space-y-1 text-sm">
                    {paymentForm.watch('paymentMethod') === 'mobile' ? (
                      <>
                        <p className="text-gray-300">Phone: <span className="text-white font-mono">01731295678</span></p>
                        <p className="text-gray-300">OTP: <span className="text-white font-mono">000000</span></p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-300">Card: <span className="text-white font-mono">4242424242424242</span></p>
                        <p className="text-gray-300">CVC: <span className="text-white font-mono">888</span></p>
                        <p className="text-gray-300">Name: <span className="text-white font-mono">Any name</span></p>
                        <p className="text-gray-300">Expiry: <span className="text-white font-mono">Any future date</span></p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Form>
          </div>
        );

      case STEPS.GENERATING:
        return (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Creating Your Presentation</h3>
              <p className="text-gray-400">
                Generating Google Slides with your selected template...
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case STEPS.METHOD_SELECTION:
        return true;
      case STEPS.PROMPT_BASICS:
        const promptData = promptForm.getValues();
        return promptData.title && promptData.description;
      case STEPS.UPLOAD_BASICS:
        const uploadData = uploadForm.getValues();
        return uploadData.title && uploadData.description;
      case STEPS.FILE_UPLOAD:
        return uploadedFile && extractedText && !isUploading;
      case STEPS.OUTLINE_CONFIRMATION:
        return !!generatedOutline;
      case STEPS.PRESENTATION_EDITING:
        return true; // Users can always proceed from editing step
      case STEPS.TEMPLATE_SELECTION:
        return !!templateForm.getValues().templateId;
      case STEPS.PAYMENT:
        return true;
      default:
        return false;
    }
  };

  const getNextButtonText = () => {
    switch (currentStep) {
      case STEPS.METHOD_SELECTION:
        return "Continue";
      case STEPS.PROMPT_BASICS:
      case STEPS.UPLOAD_BASICS:
        return generateOutlineMutation.isPending ? "Generating..." : "Generate Outline";
      case STEPS.FILE_UPLOAD:
        return "Generate Outline";
      case STEPS.OUTLINE_CONFIRMATION:
        return "Choose Template";
      case STEPS.TEMPLATE_SELECTION:
        return "Proceed to Payment";
      case STEPS.PAYMENT:
        return "Complete Payment & Generate";
      default:
        return "Next";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-gray-900/95 via-gray-900/98 to-black/95 border border-gray-700/50 backdrop-blur-xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-600/5 rounded-lg"></div>
        <DialogHeader className="relative space-y-4 pb-6 border-b border-gray-700/30">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-blue-600/20 rounded-xl backdrop-blur-sm border border-indigo-400/20 shadow-lg">
              <Lightbulb className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Create New Presentation
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-1 text-base">
                Follow our guided process to create your perfect presentation with AI assistance
              </DialogDescription>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 pt-2">
            {Object.values(STEPS).map((step, index) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  Object.values(STEPS).indexOf(currentStep) >= index
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25'
                    : 'bg-gray-700/50'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="relative py-6">
          {renderStepContent()}
        </div>

        <DialogFooter className="relative flex justify-between pt-6 mt-6 border-t border-gray-700/30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/10 to-transparent opacity-50"></div>
          
          {currentStep !== STEPS.METHOD_SELECTION && currentStep !== STEPS.GENERATING && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
              className="relative border-gray-600/50 text-gray-300 hover:bg-gray-800/70 hover:border-gray-500/70 backdrop-blur-sm transition-all duration-300 hover:scale-105 h-12 px-8 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 to-gray-600/20 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300"></div>
              <span className="relative font-medium">Back</span>
            </Button>
          )}
          
          {currentStep !== STEPS.GENERATING && (
            <Button 
              onClick={handleNext}
              disabled={!canProceed() || generateOutlineMutation.isPending || createGoogleSlidesMutation.isPending}
              className="relative bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium h-12 px-8 shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                {(generateOutlineMutation.isPending || createGoogleSlidesMutation.isPending) ? (
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                ) : null}
                <span>{getNextButtonText()}</span>
              </div>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}