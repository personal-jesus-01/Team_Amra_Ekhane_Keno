import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { CanvaService } from '@/services/canva.service';
import { CanvaTemplate, CanvaSlide, CreatePresentationRequest } from '@/models/canva.model';
import { CanvaTemplateList } from './CanvaTemplateList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Main component for Canva Integration
 */
export function CanvaIntegration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('create');
  const [title, setTitle] = useState('');
  const [slides, setSlides] = useState<CanvaSlide[]>([{ title: '', content: '' }]);
  const [selectedTemplate, setSelectedTemplate] = useState<CanvaTemplate | null>(null);
  const [createdDesign, setCreatedDesign] = useState<{ designId: string; editUrl: string } | null>(null);
  
  // Mutation for creating a presentation
  const createMutation = useMutation({
    mutationFn: (data: CreatePresentationRequest) => CanvaService.createPresentation(data),
    onSuccess: (data) => {
      setCreatedDesign({
        designId: data.designId,
        editUrl: data.editUrl
      });
      
      toast({
        title: 'Success!',
        description: 'Your presentation has been created in Canva.',
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create presentation',
        description: error.message,
        variant: 'destructive',
        duration: 5000,
      });
    }
  });

  // Handle adding a new slide
  const handleAddSlide = () => {
    setSlides([...slides, { title: '', content: '' }]);
  };

  // Handle removing a slide
  const handleRemoveSlide = (index: number) => {
    const updatedSlides = [...slides];
    updatedSlides.splice(index, 1);
    setSlides(updatedSlides);
  };

  // Handle slide content change
  const handleSlideChange = (index: number, field: keyof CanvaSlide, value: string) => {
    const updatedSlides = [...slides];
    updatedSlides[index] = { ...updatedSlides[index], [field]: value };
    setSlides(updatedSlides);
  };

  // Handle template selection
  const handleSelectTemplate = (template: CanvaTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('create');
    
    toast({
      title: 'Template Selected',
      description: `Using template: ${template.name}`,
      duration: 3000,
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast({
        title: 'Missing Title',
        description: 'Please provide a title for your presentation.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    
    if (slides.length === 0) {
      toast({
        title: 'No Slides',
        description: 'Please add at least one slide to your presentation.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    
    // Check if all slides have content
    const emptySlides = slides.filter(slide => !slide.title || !slide.content);
    if (emptySlides.length > 0) {
      toast({
        title: 'Empty Slides',
        description: `You have ${emptySlides.length} slides with missing title or content.`,
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    
    // Create the presentation
    createMutation.mutate({
      title,
      slides,
      templateId: selectedTemplate?.id
    });
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="create">Create Presentation</TabsTrigger>
          <TabsTrigger value="templates">Browse Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-6">
          {/* Template Info */}
          {selectedTemplate && (
            <Alert className="bg-blue-50 border-blue-200">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <AlertDescription>
                  Using template: <strong>{selectedTemplate.name}</strong>
                  <Button 
                    variant="link" 
                    className="text-blue-600 p-0 h-auto ml-2"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    Change
                  </Button>
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          {/* Creation Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Create a New Presentation</CardTitle>
                <CardDescription>
                  Enter your presentation details below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Presentation Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Presentation Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter your presentation title"
                    required
                  />
                </div>
                
                {/* Slides */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Slides</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSlide}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Slide
                    </Button>
                  </div>
                  
                  {slides.map((slide, index) => (
                    <Card key={index} className="border-dashed">
                      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
                        <CardTitle className="text-base">
                          Slide {index + 1}
                        </CardTitle>
                        {slides.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSlide(index)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor={`slide-${index}-title`}>Slide Title</Label>
                          <Input
                            id={`slide-${index}-title`}
                            value={slide.title}
                            onChange={e => handleSlideChange(index, 'title', e.target.value)}
                            placeholder="Enter slide title"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`slide-${index}-content`}>Content</Label>
                          <Textarea
                            id={`slide-${index}-content`}
                            value={slide.content}
                            onChange={e => handleSlideChange(index, 'content', e.target.value)}
                            placeholder="Enter slide content"
                            className="min-h-[120px]"
                            required
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Presentation...
                    </>
                  ) : (
                    'Create in Canva'
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
          
          {/* Success State */}
          {createdDesign && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Presentation Created!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Your presentation has been created in Canva. You can now edit it there.</p>
                <a 
                  href={createdDesign.editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full">
                    Open in Canva Editor
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="templates">
          <CanvaTemplateList onSelectTemplate={handleSelectTemplate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}