import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Outline Editor Component
type OutlineEditorProps = {
  outline: any;
  setOutline: (outline: any) => void;
  promptForm: any;
  uploadForm: any;
  creationMethod: 'idea' | 'upload';
};

const OutlineEditor = ({ 
  outline, 
  setOutline, 
  promptForm, 
  uploadForm, 
  creationMethod 
}: OutlineEditorProps) => {
  const [currentView, setCurrentView] = useState<'overview' | 'slides' | 'sections' | 'takeaways' | 'slideList'>('overview');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Get total number of slides
  const totalSlides = outline?.outline?.length || 0;
  
  // Navigate to next slide
  const nextSlide = () => {
    if (outline.outline && currentSlideIndex < outline.outline.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };
  
  // Navigate to previous slide
  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };
  
  // Render the current slide for editing
  const renderCurrentSlide = () => {
    if (!outline.outline || outline.outline.length === 0) {
      return <div className="py-4 text-center">No slides available</div>;
    }
    
    const slide = outline.outline[currentSlideIndex];
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center mb-4">
          <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            {slide.slide_number || currentSlideIndex + 1}
          </div>
          <div className="text-lg font-medium">Edit Slide</div>
          <div className="ml-auto text-sm text-gray-500">
            {currentSlideIndex + 1} of {totalSlides}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Slide Title</Label>
            <Input 
              value={slide.title || ""} 
              onChange={(e) => {
                const newOutline = {...outline};
                if (newOutline.outline && newOutline.outline[currentSlideIndex]) {
                  newOutline.outline[currentSlideIndex].title = e.target.value;
                  setOutline(newOutline);
                }
              }}
              className="font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Key Points</Label>
              <div className="px-2 py-1 bg-gray-100 rounded text-xs">
                {slide.type || "content"}
              </div>
            </div>
            <Textarea 
              value={Array.isArray(slide.key_points) ? slide.key_points.join("\n• ") : slide.key_points || ""} 
              onChange={(e) => {
                const newOutline = {...outline};
                if (newOutline.outline && newOutline.outline[currentSlideIndex]) {
                  // Split by newlines and bullet points
                  const keyPoints = e.target.value
                    .split(/\n[•\-*]?\s*/)
                    .map(point => point.trim())
                    .filter(Boolean);
                  newOutline.outline[currentSlideIndex].key_points = keyPoints;
                  setOutline(newOutline);
                }
              }}
              className="min-h-[120px] text-sm"
              placeholder="• Enter key points here"
            />
          </div>
          
          {slide.notes && (
            <div className="space-y-2">
              <Label>Notes</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {slide.notes}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlideIndex <= 0}
            className="flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Previous Slide
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={nextSlide}
            disabled={currentSlideIndex >= totalSlides - 1}
            className="flex items-center"
          >
            Next Slide
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </Button>
        </div>
      </div>
    );
  };
  
  // Render all slides in a compact overview
  const renderSlideList = () => {
    return (
      <div className="p-2 space-y-2 max-h-[350px] overflow-y-auto">
        {outline.outline?.map((slide: {
          slide_number?: number;
          title?: string;
          type?: string;
        }, index: number) => (
          <div 
            key={index} 
            className={`p-2 border rounded-md cursor-pointer hover:bg-gray-50 flex items-center ${currentSlideIndex === index ? 'border-primary-500 bg-primary-50' : ''}`}
            onClick={() => {
              setCurrentSlideIndex(index);
              setCurrentView('slides');
            }}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${currentSlideIndex === index ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              {slide.slide_number || index + 1}
            </div>
            <div className="flex-1 truncate">{slide.title || `Slide ${index + 1}`}</div>
            <div className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
              {slide.type || "content"}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render sections overview
  const renderSectionsOverview = () => {
    return (
      <div className="p-2 space-y-3 max-h-[350px] overflow-y-auto">
        {outline.sections?.map((section: {
          title?: string;
          slide_numbers?: number[];
          key_message?: string;
        }, index: number) => (
          <div key={index} className="p-3 border rounded-md">
            <div className="font-medium">{section.title}</div>
            <div className="text-sm text-gray-500 mt-1">
              Slides: {section.slide_numbers?.join(', ')}
            </div>
            <div className="text-sm mt-2">{section.key_message}</div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render audience takeaways
  const renderTakeaways = () => {
    return (
      <div className="p-2 max-h-[350px] overflow-y-auto">
        <ul className="list-disc pl-5 space-y-2">
          {outline.audience_takeaways?.map((takeaway: string, index: number) => (
            <li key={index} className="text-sm">{takeaway}</li>
          ))}
        </ul>
      </div>
    );
  };
  
  // Render overview with title and theme
  const renderOverview = () => {
    return (
      <div className="space-y-6 py-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Presentation Title</Label>
            <Input 
              value={outline.title || (
                creationMethod === 'idea' 
                  ? promptForm.getValues('title') 
                  : uploadForm.getValues('title')
              )}
              onChange={(e) => {
                const newOutline = {...outline};
                newOutline.title = e.target.value;
                setOutline(newOutline);
                
                if (creationMethod === 'idea') {
                  promptForm.setValue('title', e.target.value);
                } else {
                  uploadForm.setValue('title', e.target.value);
                }
              }}
              className="font-medium"
            />
          </div>
          
          {outline.theme && (
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {outline.theme}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Estimated duration: {outline.estimated_duration || "Unknown"}
            </div>
            <div className="text-sm text-gray-500">
              Total slides: {totalSlides}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button onClick={() => setCurrentView('slides')} className="flex items-center justify-center" variant="outline">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
              </svg>
              Edit Slides
            </Button>
            <Button onClick={() => setCurrentView('sections')} className="flex items-center justify-center" variant="outline" 
                    disabled={!outline.sections || outline.sections.length === 0}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              View Sections
            </Button>
            <Button onClick={() => setCurrentView('slideList')} className="flex items-center justify-center" variant="outline">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              Slide List
            </Button>
            <Button onClick={() => setCurrentView('takeaways')} className="flex items-center justify-center" variant="outline"
                    disabled={!outline.audience_takeaways || outline.audience_takeaways.length === 0}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Takeaways
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Edit Your Presentation Outline</h3>
        <p className="text-sm text-gray-500">
          Review and edit the generated outline before creating your presentation
        </p>
        
        {/* Navigation tabs */}
        <div className="border-b border-gray-200">
          <div className="flex -mb-px">
            <button
              className={`mr-1 py-2 px-4 text-sm font-medium ${currentView === 'overview' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setCurrentView('overview')}
            >
              Overview
            </button>
            <button
              className={`mr-1 py-2 px-4 text-sm font-medium ${currentView === 'slides' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setCurrentView('slides')}
            >
              Edit Slides
            </button>
            <button
              className={`mr-1 py-2 px-4 text-sm font-medium ${currentView === 'slideList' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setCurrentView('slideList')}
            >
              Slide List
            </button>
            {outline.sections && outline.sections.length > 0 && (
              <button
                className={`mr-1 py-2 px-4 text-sm font-medium ${currentView === 'sections' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setCurrentView('sections')}
              >
                Sections
              </button>
            )}
            {outline.audience_takeaways && outline.audience_takeaways.length > 0 && (
              <button
                className={`mr-1 py-2 px-4 text-sm font-medium ${currentView === 'takeaways' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setCurrentView('takeaways')}
              >
                Takeaways
              </button>
            )}
          </div>
        </div>
        
        {/* Content based on selected view */}
        <div className="pt-2">
          {currentView === 'overview' && renderOverview()}
          {currentView === 'slides' && renderCurrentSlide()}
          {currentView === 'slideList' && renderSlideList()}
          {currentView === 'sections' && renderSectionsOverview()}
          {currentView === 'takeaways' && renderTakeaways()}
        </div>
      </div>
    </div>
  );
};

export default OutlineEditor;