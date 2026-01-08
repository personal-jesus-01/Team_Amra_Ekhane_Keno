import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Slide, PresentationWithMeta } from '@/lib/types';
import { ChevronRight, Presentation, LucideLoader } from 'lucide-react';
import { generateSuggestedSpeech } from '@/services/coach.service';

export type SlideSelectionProps = {
  presentation: PresentationWithMeta;
  slides: Slide[];
  isLoading: boolean;
  onSelectSlide: (slide: Slide, suggestedSpeech: string) => void;
  onBack: () => void;
};

export default function SlideSelection({
  presentation,
  slides,
  isLoading,
  onSelectSlide,
  onBack
}: SlideSelectionProps) {
  const { toast } = useToast();
  const [selectedSlideId, setSelectedSlideId] = useState<number | null>(null);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  
  // Filter slides for the presentation and sort by slide number
  const presentationSlides = slides
    .filter(slide => slide.presentation_id === presentation.id)
    .sort((a, b) => a.slide_number - b.slide_number);
  
  // Handle slide selection
  const handleSlideClick = (slideId: number) => {
    setSelectedSlideId(slideId);
  };

  // Handle continue button click
  const handleContinue = async () => {
    if (!selectedSlideId) {
      toast({
        title: "No slide selected",
        description: "Please select a slide to practice with",
        variant: "destructive",
      });
      return;
    }
    
    const selectedSlide = presentationSlides.find(slide => slide.id === selectedSlideId);
    if (!selectedSlide) {
      toast({
        title: "Selected slide not found",
        description: "Please select a different slide",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGeneratingSpeech(true);
      
      // Generate suggested speech for the slide
      const response = await generateSuggestedSpeech(
        selectedSlide.content,
        selectedSlide.title || `Slide ${selectedSlide.slide_number}`,
        `Presentation: ${presentation.title}`
      );
      
      // Pass the selected slide and suggested speech to the parent component
      onSelectSlide(selectedSlide, response.suggestedSpeech);
    } catch (error) {
      console.error('Error generating suggested speech:', error);
      toast({
        title: "Speech generation failed",
        description: "Could not generate suggested speech for this slide. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSpeech(false);
    }
  };
  
  // Show loading skeleton if data is still loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  // Show message if no slides are available
  if (presentationSlides.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <Presentation className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Slides Available</h3>
        <p className="text-sm text-gray-500 mb-6">
          This presentation doesn't have any slides. Please select a different presentation.
        </p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{presentation.title}</h2>
          <p className="text-sm text-gray-500">
            Select a slide to practice your delivery
          </p>
        </div>
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presentationSlides.map((slide) => (
          <Card 
            key={slide.id}
            className={`cursor-pointer hover:border-primary transition-colors ${
              selectedSlideId === slide.id ? 'border-primary ring-2 ring-primary/20' : ''
            }`}
            onClick={() => handleSlideClick(slide.id)}
          >
            <CardContent className="p-4">
              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-3 rounded">
                <div className="text-center p-4">
                  <h3 className="font-medium">
                    {slide.title || `Slide ${slide.slide_number}`}
                  </h3>
                  <p className="text-sm truncate mt-2">
                    {slide.content?.substring(0, 100)}
                    {slide.content?.length > 100 ? "..." : ""}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Slide {slide.slide_number}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!selectedSlideId || isGeneratingSpeech}
          className="flex items-center gap-2"
        >
          {isGeneratingSpeech ? (
            <>
              <LucideLoader className="h-4 w-4 animate-spin" />
              Generating Speech...
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}