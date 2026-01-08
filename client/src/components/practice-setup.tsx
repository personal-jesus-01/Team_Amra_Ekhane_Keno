import { useState, useEffect, useRef } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PresentationWithMeta, Slide, PracticeConfig } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Clock, Cog, ScreenShare, FileUp, Upload, Plus, Presentation } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = z.object({
  presentationId: z.number({
    required_error: "Please select a presentation",
  }),
  practiceMode: z.enum(['full', 'single'], {
    required_error: "Please select a practice mode",
  }),
  selectedSlideIds: z.array(z.number()).optional(),
  timerSettings: z.object({
    totalDuration: z.number().min(1).max(60),
    perSlideDuration: z.number().min(10).max(300),
    strictTiming: z.boolean(),
  }),
  displaySettings: z.object({
    showNotes: z.boolean(),
    notesPosition: z.enum(['side', 'bottom', 'overlay']),
    fontSize: z.enum(['small', 'medium', 'large']),
    showProgress: z.boolean(),
  }),
  recordingSettings: z.object({
    quality: z.enum(['standard', 'high']),
    backgroundBlur: z.boolean(),
  }),
});

export type PracticeSetupProps = {
  presentations: PresentationWithMeta[];
  slides: Slide[];
  isLoading: boolean;
  onComplete: (config: PracticeConfig) => void;
};

export default function PracticeSetup({
  presentations, 
  slides,
  isLoading,
  onComplete
}: PracticeSetupProps) {
  const [activeTab, setActiveTab] = useState("presentation");
  const [selectedPracticeMode, setSelectedPracticeMode] = useState<'full' | 'single'>('full');
  const [selectedSlides, setSelectedSlides] = useState<number[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      
      // In a real implementation, we would upload the file here
      // For now, just simulate a successful upload
      toast({
        title: "File selected",
        description: `${file.name} is ready to upload`,
      });
    }
  };
  
  const handleFileUpload = async () => {
    if (!uploadFileName) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setUploadingFile(true);
    
    try {
      // Get the file from the input
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        throw new Error("File not found");
      }
      
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, "")); // Remove extension
      
      try {
        // Send file to server
        console.log('Processing file:', file.name);
        
        // Use the API request function from your query client
        const response = await fetch('/api/presentations/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        let newPresentationId;
        try {
          const result = await response.json();
          console.log('Upload successful:', result);
          newPresentationId = result.id;
        } catch (e) {
          console.log('Could not parse response, using mock presentation ID');
          // Fallback to mock ID if response parsing fails
          newPresentationId = Math.floor(Math.random() * 10000) + 1;
        }
        
        // Close dialog
        setUploadDialogOpen(false);
        
        toast({
          title: "Upload successful",
          description: "Your presentation has been processed and is ready for practice",
        });
        
        // Reload page if no presentations exist
        if (presentations.length === 0) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        console.error('Server upload error:', error);
        throw error;
      }
      
      // Clear file input
      setUploadFileName('');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };
  
  const clearFileSelection = () => {
    setUploadFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      presentationId: presentations[0]?.id || 0,
      practiceMode: 'full',
      selectedSlideIds: [],
      timerSettings: {
        totalDuration: 10, // 10 minutes
        perSlideDuration: 60, // 60 seconds per slide
        strictTiming: false,
      },
      displaySettings: {
        showNotes: true,
        notesPosition: 'side',
        fontSize: 'medium',
        showProgress: true,
      },
      recordingSettings: {
        quality: 'standard',
        backgroundBlur: false,
      },
    },
  });
  
  // Get values from form
  const watchPresentationId = form.watch('presentationId');
  const watchPracticeMode = form.watch('practiceMode');
  
  // Update selected practice mode
  useEffect(() => {
    setSelectedPracticeMode(watchPracticeMode);
  }, [watchPracticeMode]);
  
  // Reset selected slides when presentation changes
  useEffect(() => {
    setSelectedSlides([]);
    form.setValue('selectedSlideIds', []);
  }, [watchPresentationId, form]);
  
  // Toggle slide selection
  const toggleSlideSelection = (slideId: number) => {
    const newSelection = selectedSlides.includes(slideId)
      ? selectedSlides.filter(id => id !== slideId)
      : [...selectedSlides, slideId];
    
    setSelectedSlides(newSelection);
    form.setValue('selectedSlideIds', newSelection);
  };
  
  // Find the selected presentation
  const selectedPresentation = presentations.find(p => p.id === watchPresentationId);
  
  // Filter slides for the selected presentation
  const presentationSlides = slides.filter(slide => slide.presentation_id === watchPresentationId);
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onComplete(values);
  };
  
  // Render loading state for initial data fetch
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }
  
  // Loading indicator for file upload/processing
  if (uploadingFile) {
    return (
      <div className="p-8 border rounded-lg text-center">
        <div className="animate-pulse">
          <Presentation className="h-12 w-12 mx-auto text-primary mb-4" />
          <h3 className="text-lg font-medium mb-2">Processing Presentation</h3>
          <p className="text-sm text-gray-500 mb-6">
            Your presentation is being analyzed. This may take a few moments...
          </p>
          <div className="flex justify-center">
            <div className="relative w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute top-0 h-full bg-primary rounded-full animate-progress-indeterminate"></div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            We're extracting content and preparing your slides for practice
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Presentation Selection */}
        <div className="space-y-4">
          {presentations.length > 0 ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Presentation Setup</h3>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <FileUp className="h-4 w-4" />
                      Upload Presentation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Presentation</DialogTitle>
                      <DialogDescription>
                        Upload a PowerPoint, PDF or Word file to practice with
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                           onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm font-medium mb-1">Click to upload a file</p>
                        <p className="text-xs text-gray-500">or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Supports PPTX, PDF, DOCX files
                        </p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept=".pptx,.pdf,.docx"
                          onChange={handleFileChange}
                        />
                      </div>
                      
                      {uploadFileName && (
                        <div className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex items-center gap-2">
                            <Presentation className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{uploadFileName}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearFileSelection}
                            disabled={uploadingFile}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setUploadDialogOpen(false)}
                        disabled={uploadingFile}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleFileUpload}
                        disabled={!uploadFileName || uploadingFile}
                      >
                        {uploadingFile ? 'Uploading...' : 'Upload'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <FormField
                control={form.control}
                name="presentationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Presentation</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a presentation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {presentations.map((presentation) => (
                          <SelectItem key={presentation.id} value={presentation.id.toString()}>
                            {presentation.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the presentation you want to practice with.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : (
            <div className="text-center p-8 border rounded-lg">
              <Presentation className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Presentations Available</h3>
              <p className="text-sm text-gray-500 mb-6">
                Upload a presentation to start practicing your delivery skills
              </p>
              
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Upload Presentation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Presentation</DialogTitle>
                    <DialogDescription>
                      Upload a PowerPoint, PDF or Word file to practice with
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                         onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-medium mb-1">Click to upload a file</p>
                      <p className="text-xs text-gray-500">or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Supports PPTX, PDF, DOCX files
                      </p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pptx,.pdf,.docx"
                        onChange={handleFileChange}
                      />
                    </div>
                    
                    {uploadFileName && (
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Presentation className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{uploadFileName}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearFileSelection}
                          disabled={uploadingFile}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setUploadDialogOpen(false)}
                      disabled={uploadingFile}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleFileUpload}
                      disabled={!uploadFileName || uploadingFile}
                    >
                      {uploadingFile ? 'Uploading...' : 'Upload'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Alert className="mt-8">
                <AlertDescription>
                  You'll need to create or upload a presentation before you can practice. Go to the Dashboard to create a new presentation.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {/* Tabs navigation for settings */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="presentation" className="flex items-center gap-2">
                <ScreenShare className="h-4 w-4" />
                Presentation
              </TabsTrigger>
              <TabsTrigger value="timer" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timer
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Cog className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            {/* Presentation Tab */}
            <TabsContent value="presentation" className="pt-4 space-y-4">
              <FormField
                control={form.control}
                name="practiceMode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Practice Mode</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value as 'full' | 'single')}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="full" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Full Presentation (all slides)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="single" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Selected Slides Only
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Slide selection (visible only in 'single' mode) */}
              {selectedPracticeMode === 'single' && (
                <div className="space-y-3 mt-4">
                  <FormLabel>Select Slides to Practice</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {presentationSlides.map((slide) => (
                      <Card 
                        key={slide.id} 
                        className={`cursor-pointer transition-all ${
                          selectedSlides.includes(slide.id) 
                            ? 'ring-2 ring-primary' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => toggleSlideSelection(slide.id)}
                      >
                        <CardContent className="p-3">
                          <div 
                            className="aspect-video mb-2 rounded overflow-hidden"
                            style={{ 
                              backgroundColor: slide.background_color || '#ffffff'
                            }}
                          >
                            <div className="p-2 text-xs line-clamp-2 font-medium">
                              {slide.title || `Slide ${slide.slide_number}`}
                            </div>
                          </div>
                          <div className="text-xs text-center">
                            Slide {slide.slide_number}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {selectedSlides.length === 0 && (
                    <FormMessage>Please select at least one slide</FormMessage>
                  )}
                </div>
              )}
            </TabsContent>
            
            {/* Timer Tab */}
            <TabsContent value="timer" className="pt-4 space-y-6">
              <FormField
                control={form.control}
                name="timerSettings.totalDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Practice Duration (minutes)</FormLabel>
                    <div className="space-y-1">
                      <Slider
                        min={1}
                        max={60}
                        step={1}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1 min</span>
                        <span>{field.value} min</span>
                        <span>60 min</span>
                      </div>
                    </div>
                    <FormDescription>
                      Set the total time for your practice session.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timerSettings.perSlideDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time per Slide (seconds)</FormLabel>
                    <div className="space-y-1">
                      <Slider
                        min={10}
                        max={300}
                        step={5}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>10 sec</span>
                        <span>{field.value} sec</span>
                        <span>5 min</span>
                      </div>
                    </div>
                    <FormDescription>
                      Recommended time to spend on each slide.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timerSettings.strictTiming"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Strict Timing</FormLabel>
                      <FormDescription>
                        Automatically advance slides according to the per-slide timing.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="pt-4 space-y-6">
              {/* Display Settings Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Display Settings</h3>
                
                <FormField
                  control={form.control}
                  name="displaySettings.showNotes"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Show Speaker Notes</FormLabel>
                        <FormDescription>
                          Display your speaker notes during practice.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="displaySettings.notesPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes Position</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="side">Side Panel</SelectItem>
                          <SelectItem value="bottom">Bottom Panel</SelectItem>
                          <SelectItem value="overlay">Overlay on Slides</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose where to display speaker notes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="displaySettings.fontSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Font Size</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select font size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Adjust the font size for notes and content.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="displaySettings.showProgress"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Show Progress Bar</FormLabel>
                        <FormDescription>
                          Display progress indicators during practice.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Recording Settings Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium">Recording Settings</h3>
                
                <FormField
                  control={form.control}
                  name="recordingSettings.quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recording Quality</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select quality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Higher quality uses more bandwidth and processing power.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="recordingSettings.backgroundBlur"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Background Blur</FormLabel>
                        <FormDescription>
                          Blur your background during video recording.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={selectedPracticeMode === 'single' && selectedSlides.length === 0}
          >
            Start Practice Session
          </Button>
        </div>
      </form>
    </Form>
  );
}