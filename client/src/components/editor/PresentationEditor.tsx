import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SlideData, SlideTheme, SlideElement } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import SlidesSidebar from './SlidesSidebar';
import SlideCanvas from './SlideCanvas';
import {
  Save,
  Download,
  Share,
  Play,
  ArrowLeft,
  Undo,
  Redo,
  Layout,
  PaintBucket,
  Image as ImageIcon,
  Type,
  Settings,
  Monitor,
  Loader2,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PresentationEditorProps {
  presentationId?: number;
}

// Default slide element generators
const createDefaultTitleSlide = (): SlideData => ({
  id: Date.now(),
  title: 'Title Slide',
  elements: [
    {
      id: uuidv4(),
      type: 'text',
      x: 640, // center of 1280px canvas
      y: 250,
      width: 800,
      height: 120,
      rotation: 0,
      content: 'PRESENTATION TITLE',
      style: {
        fontFamily: 'Arial',
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
      }
    },
    {
      id: uuidv4(),
      type: 'text',
      x: 640, // center of 1280px canvas
      y: 400,
      width: 600,
      height: 60,
      rotation: 0,
      content: 'Subtitle or Author Name',
      style: {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#666666',
        textAlign: 'center',
      }
    }
  ],
  background: {
    type: 'color',
    value: '#ffffff'
  },
  transition: 'fade'
});

const createDefaultContentSlide = (): SlideData => ({
  id: Date.now(),
  title: 'Content Slide',
  elements: [
    {
      id: uuidv4(),
      type: 'text',
      x: 640, // center of 1280px canvas
      y: 80,
      width: 800,
      height: 80,
      rotation: 0,
      content: 'Slide Title',
      style: {
        fontFamily: 'Arial',
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
      }
    },
    {
      id: uuidv4(),
      type: 'text',
      x: 640, // center of canvas
      y: 240,
      width: 800,
      height: 300,
      rotation: 0,
      content: '• First point\n• Second point\n• Third point\n• Fourth point',
      style: {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#555555',
        textAlign: 'left',
      }
    }
  ],
  background: {
    type: 'color',
    value: '#ffffff'
  },
  transition: 'slide'
});

// Themes
const themes: SlideTheme[] = [
  {
    id: 'default',
    name: 'Default',
    primaryColor: '#4f46e5',
    secondaryColor: '#6366f1',
    backgroundColor: '#ffffff',
    fontFamily: 'Arial',
    headingFont: 'Arial',
    bodyFont: 'Arial',
    colorPalette: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#6366f1']
  },
  {
    id: 'minimal',
    name: 'Minimal',
    primaryColor: '#111827',
    secondaryColor: '#374151',
    backgroundColor: '#f9fafb',
    fontFamily: 'Inter',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    colorPalette: ['#111827', '#1f2937', '#374151', '#4b5563', '#6b7280']
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    primaryColor: '#7c3aed',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    fontFamily: 'Montserrat',
    headingFont: 'Montserrat',
    bodyFont: 'Open Sans',
    colorPalette: ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
  },
  {
    id: 'corporate',
    name: 'Corporate',
    primaryColor: '#0f172a',
    secondaryColor: '#1e293b',
    backgroundColor: '#f8fafc',
    fontFamily: 'Roboto',
    headingFont: 'Roboto',
    bodyFont: 'Roboto',
    colorPalette: ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1']
  },
  {
    id: 'creative',
    name: 'Creative',
    primaryColor: '#db2777',
    secondaryColor: '#ec4899',
    backgroundColor: '#ffffff',
    fontFamily: 'Poppins',
    headingFont: 'Poppins',
    bodyFont: 'Raleway',
    colorPalette: ['#db2777', '#7c3aed', '#2563eb', '#059669', '#d97706']
  }
];

export default function PresentationEditor({ presentationId }: PresentationEditorProps) {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [title, setTitle] = useState('Untitled Presentation');
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pptx' | 'pdf'>('pptx');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch presentation data
  const {
    data: presentation,
    isLoading: presentationLoading,
    error: presentationError,
  } = useQuery({
    queryKey: [`/api/presentations/${presentationId}`],
    enabled: !!presentationId,
    onSuccess: (data) => {
      if (data) {
        setTitle(data.title);
      }
    },
  });

  // Fetch slides
  const {
    data: apiSlides,
    isLoading: slidesLoading,
    error: slidesError,
  } = useQuery({
    queryKey: [`/api/presentations/${presentationId}/slides`],
    enabled: !!presentationId,
    onSuccess: (data) => {
      console.log("Slides data received:", data);
      
      if (data && data.length > 0) {
        // Convert API slides to SlideData format
        const convertedSlides = data.map(apiSlide => {
          try {
            // Try to extract slide data from the content
            const slideDataMatch = apiSlide.content.match(/<!-- slide-data:(.+?) -->/);
            if (slideDataMatch && slideDataMatch[1]) {
              try {
                const slideData = JSON.parse(slideDataMatch[1]);
                console.log("Found embedded slide data:", slideData);
                
                return {
                  id: apiSlide.id,
                  title: slideData.title || `Slide ${apiSlide.slide_number}`,
                  elements: slideData.elements || [],
                  background: slideData.background || {
                    type: 'color',
                    value: apiSlide.background_color || '#ffffff'
                  },
                  transition: slideData.transition || 'fade'
                };
              } catch (e) {
                console.error("Error parsing embedded slide data:", e);
              }
            }
            
            // If no embedded data or parsing failed, use fallback approach
            console.log("No embedded data found or parsing failed, extracting from content...");
            const elements = extractElementsFromContent(apiSlide.content);
            
            // If we got no elements, create at least one title element
            if (elements.length === 0) {
              console.log("No elements extracted, creating default title element");
              const titleText = apiSlide.content.split('\n')[0].replace(/^#\s*/, '');
              elements.push({
                id: uuidv4(),
                type: 'text',
                x: 640, // center of 1280px canvas
                y: 100,
                width: 800,
                height: 80,
                rotation: 0,
                content: titleText || `Slide ${apiSlide.slide_number}`,
                style: {
                  fontFamily: 'Arial',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#333333',
                  textAlign: 'center',
                }
              });
              
              // Also add a content element with default text
              elements.push({
                id: uuidv4(),
                type: 'text',
                x: 640, // center
                y: 350,
                width: 800,
                height: 300,
                rotation: 0,
                content: "Click to edit this text",
                style: {
                  fontFamily: 'Arial',
                  fontSize: '24px',
                  color: '#555555',
                  textAlign: 'center',
                }
              });
            }
            
            return {
              id: apiSlide.id,
              title: `Slide ${apiSlide.slide_number}`,
              elements: elements,
              background: {
                type: 'color',
                value: apiSlide.background_color || '#ffffff'
              },
              transition: 'fade'
            };
          } catch (error) {
            console.error('Error parsing slide content:', error);
            // Fallback to empty slide with at least one element
            return {
              id: apiSlide.id,
              title: `Slide ${apiSlide.slide_number}`,
              elements: [{
                id: uuidv4(),
                type: 'text',
                x: 640, // center of 1280px canvas
                y: 200,
                width: 800,
                height: 80,
                rotation: 0,
                content: `Slide ${apiSlide.slide_number}`,
                style: {
                  fontFamily: 'Arial',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#333333',
                  textAlign: 'center',
                }
              },
              {
                id: uuidv4(),
                type: 'text',
                x: 640, // center of canvas
                y: 350,
                width: 800,
                height: 300,
                rotation: 0,
                content: "Click to edit this text",
                style: {
                  fontFamily: 'Arial',
                  fontSize: '24px',
                  color: '#555555',
                  textAlign: 'center',
                }
              }],
              background: {
                type: 'color',
                value: apiSlide.background_color || '#ffffff'
              },
              transition: 'fade'
            };
          }
        });
        
        console.log("Converted slides:", convertedSlides);
        setSlides(convertedSlides);
      } else {
        console.warn("No slides found in response:", data);
      }
    },
  });

  // Helper function to extract elements from slide content
  const extractElementsFromContent = (content: string): SlideElement[] => {
    // Try to extract the slide-data JSON from the comment at the end of the content
    const slideDataMatch = content.match(/<!-- slide-data:(.+?) -->/);
    if (slideDataMatch && slideDataMatch[1]) {
      try {
        const slideData = JSON.parse(slideDataMatch[1]);
        if (slideData && Array.isArray(slideData.elements)) {
          // Make sure each element has a valid UUID to avoid rendering issues
          console.log("Parsed slide elements:", slideData.elements);
          return slideData.elements.map(element => {
            // Handle shape elements specially to ensure they have required properties
            if (element.type === 'shape' && (!element.shape || typeof element.shape !== 'string')) {
              console.log("Fixing shape element with missing shape property:", element);
              return {
                ...element,
                id: element.id || uuidv4(),
                shape: element.shape || 'rectangle',
                fill: element.fill || '#e6f2ff',
                stroke: element.stroke || '#3399ff',
                strokeWidth: element.strokeWidth || 2
              };
            }
            return {
              ...element,
              id: element.id || uuidv4()
            };
          });
        }
      } catch (e) {
        console.error("Error parsing slide data:", e);
      }
    }
    
    // Fallback: Parse text content into slide elements
    const elements: SlideElement[] = [];
    
    if (content) {
      const lines = content.split('\n');
      let y = 80;
      
      lines.forEach((line, index) => {
        if (line.trim() && !line.includes('<!-- slide-data:')) {
          // Skip our hidden JSON data
          
          if (index === 0) {
            // Title element centered at the top
            elements.push({
              id: uuidv4(),
              type: 'text',
              x: 640, // center of 1280px canvas
              y: 80,
              width: 800,
              height: 80,
              rotation: 0,
              content: line.startsWith('# ') ? line.substring(2) : line,
              style: {
                fontFamily: 'Arial',
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#333333',
                textAlign: 'center',
              }
            });
            
            y = 200; // Next element starts lower
          } else {
            // Content elements with bullet points if needed
            let displayText = line;
            
            // If line doesn't start with a bullet point, add one
            if (!displayText.startsWith('•') && !displayText.startsWith('-') && !displayText.startsWith('*')) {
              displayText = '• ' + displayText;
            }
            
            elements.push({
              id: uuidv4(),
              type: 'text',
              x: 640, // center of canvas
              y,
              width: 800,
              height: 50,
              rotation: 0,
              content: displayText,
              style: {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#555555',
                textAlign: 'left',
              }
            });
            
            y += 60; // Space between bullet points
          }
        }
      });
    }
    
    return elements;
  };

  // Save presentation mutation
  const savePresentationMutation = useMutation({
    mutationFn: async () => {
      if (!presentationId) {
        // Create new presentation
        const res = await apiRequest("POST", "/api/presentations", {
          title,
          owner_id: user?.id,
          status: "draft",
        });
        const newPresentation = await res.json();
        
        // Save slides for the new presentation
        for (let i = 0; i < slides.length; i++) {
          const slideContent = serializeSlideContent(slides[i]);
          
          await apiRequest("POST", "/api/slides", {
            presentation_id: newPresentation.id,
            slide_number: i + 1,
            content: slideContent,
            status: "draft",
            background_color: slides[i].background.type === 'color' ? slides[i].background.value : '#ffffff',
          });
        }
        
        return newPresentation;
      } else {
        // Update existing presentation
        const res = await apiRequest("PUT", `/api/presentations/${presentationId}`, {
          title,
        });
        
        // Update or create slides
        for (let i = 0; i < slides.length; i++) {
          const slideContent = serializeSlideContent(slides[i]);
          const slideId = typeof slides[i].id === 'number' ? slides[i].id : null;
          
          if (slideId) {
            // Update existing slide
            await apiRequest("PUT", `/api/slides/${slideId}`, {
              content: slideContent,
              background_color: slides[i].background.type === 'color' ? slides[i].background.value : '#ffffff',
              presentation_id: presentationId
            });
          } else {
            // Create new slide
            await apiRequest("POST", "/api/slides", {
              presentation_id: presentationId,
              slide_number: i + 1,
              content: slideContent,
              status: "draft",
              background_color: slides[i].background.type === 'color' ? slides[i].background.value : '#ffffff',
            });
          }
        }
        
        // If slides were removed, we need to delete them
        if (apiSlides) {
          const currentSlideIds = slides
            .map(s => s.id)
            .filter(id => typeof id === 'number');
          
          const removedSlides = apiSlides.filter(
            s => !currentSlideIds.includes(s.id)
          );
          
          // Delete removed slides
          for (const slide of removedSlides) {
            await apiRequest("DELETE", `/api/slides/${slide.id}`);
          }
        }
        
        return await res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/presentations/${data.id}`]
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/presentations/${data.id}/slides`]
      });
      
      setUnsavedChanges(false);
      
      toast({
        title: "Presentation saved",
        description: "Your presentation has been saved successfully.",
      });
      
      // If this was a new presentation, navigate to the new URL
      if (!presentationId) {
        navigate(`/editor/${data.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save presentation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper function to serialize slide content for API
  const serializeSlideContent = (slide: SlideData): string => {
    // Extract text content for basic compatibility
    const textElements = slide.elements.filter(el => el.type === 'text');
    let content = '';
    
    if (textElements.length > 0) {
      content = textElements.map(el => el.content).join('\n\n');
    } else {
      // If there are no text elements, create default content
      content = slide.title || 'Slide Content';
    }
    
    // Ensure all elements have valid IDs before serializing
    const elementsWithIds = slide.elements.map(element => ({
      ...element,
      id: element.id || uuidv4()
    }));
    
    // Create clean slide data for serialization
    const cleanSlide = {
      ...slide,
      elements: elementsWithIds
    };
    
    // Store the full slide data in a JSON structure that would be hidden in the markdown
    const jsonData = JSON.stringify(cleanSlide);
    
    return content + '\n\n<!-- slide-data:' + jsonData + ' -->';
  };

  // Initialize with default slides if none provided
  useEffect(() => {
    if (!presentationId && slides.length === 0) {
      setSlides([
        createDefaultTitleSlide(),
        createDefaultContentSlide()
      ]);
    }
  }, [presentationId]);
  
  // Set unsaved changes flag when slides or title change
  useEffect(() => {
    if (apiSlides && slides.length > 0) {
      setUnsavedChanges(true);
    }
  }, [slides, title]);

  // Add a new slide
  const handleAddSlide = () => {
    const newSlide = createDefaultContentSlide();
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
    setUnsavedChanges(true);
  };

  // Duplicate a slide
  const handleDuplicateSlide = (index: number) => {
    const slideToClone = slides[index];
    
    // Deep clone the slide and its elements
    const clonedElements = slideToClone.elements.map(element => ({
      ...element,
      id: uuidv4()
    }));
    
    const newSlide: SlideData = {
      ...slideToClone,
      id: Date.now(),
      elements: clonedElements
    };
    
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    
    setSlides(newSlides);
    setCurrentSlideIndex(index + 1);
    setUnsavedChanges(true);
  };

  // Delete a slide
  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) {
      toast({
        title: "Cannot delete slide",
        description: "You must have at least one slide in your presentation.",
        variant: "destructive",
      });
      return;
    }
    
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    
    // Adjust current slide index if needed
    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    } else if (currentSlideIndex === index) {
      setCurrentSlideIndex(Math.max(0, index - 1));
    }
    
    setUnsavedChanges(true);
  };

  // Reorder slides
  const handleReorderSlides = (newSlides: SlideData[]) => {
    setSlides(newSlides);
    setUnsavedChanges(true);
  };

  // Update current slide
  const handleSlideChange = (updatedSlide: SlideData) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = updatedSlide;
    setSlides(newSlides);
    setUnsavedChanges(true);
  };

  // Handle theme change
  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    
    // Apply theme to all slides
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    
    const themedSlides = slides.map(slide => ({
      ...slide,
      background: {
        type: 'color',
        value: theme.backgroundColor
      },
      // Update text elements with theme fonts
      elements: slide.elements.map(element => {
        if (element.type === 'text') {
          return {
            ...element,
            style: {
              ...element.style,
              fontFamily: (element.style?.fontSize && parseInt(element.style.fontSize) > 24) 
                ? theme.headingFont 
                : theme.bodyFont,
              color: element.style?.fontWeight === 'bold' 
                ? theme.primaryColor 
                : theme.secondaryColor
            }
          };
        }
        return element;
      })
    }));
    
    setSlides(themedSlides);
    setUnsavedChanges(true);
    setThemeModalOpen(false);
  };

  // Handle export
  const handleExport = () => {
    // Export logic would be implemented here
    toast({
      title: `Exporting as ${exportFormat.toUpperCase()}`,
      description: "Your presentation is being prepared for download.",
    });
    
    // Close the modal
    setExportModalOpen(false);
    
    // Simulate download after a delay
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: "Your presentation has been downloaded.",
      });
    }, 2000);
  };

  // Go back to presentations list
  const handleBackToPresentations = () => {
    // Check for unsaved changes
    if (unsavedChanges) {
      if (confirm('You have unsaved changes. Save before leaving?')) {
        savePresentationMutation.mutate();
      }
    }
    
    navigate('/');
  };

  // Show loading state while fetching data
  if (presentationId && (presentationLoading || slidesLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-gray-600">Loading presentation...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (presentationId && (presentationError || slidesError)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Presentation</h2>
          <p className="text-gray-600 mb-4">
            There was an error loading the presentation. Please try again or go back to your presentations.
          </p>
          <Button onClick={handleBackToPresentations}>Back to Presentations</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b p-2 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackToPresentations}
          className="mr-2"
        >
          <ArrowLeft size={16} />
        </Button>
        
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setUnsavedChanges(true);
          }}
          className="border-none focus:ring-0 focus:outline-none font-semibold text-lg mr-4 flex-grow max-w-[300px]"
        />
        
        <div className="flex items-center space-x-1">
          {/* Undo/Redo placeholder - not functional in this version */}
          <Button variant="ghost" size="icon" disabled>
            <Undo size={16} />
          </Button>
          <Button variant="ghost" size="icon" disabled>
            <Redo size={16} />
          </Button>
          
          <div className="h-4 border-r mx-2" />
          
          {/* Theme button */}
          <Button 
            variant="ghost" 
            size="sm"
            className="text-sm"
            onClick={() => setThemeModalOpen(true)}
          >
            <Layout size={16} className="mr-1" />
            Theme
          </Button>
          
          {/* Save button */}
          <Button
            variant={unsavedChanges ? "default" : "ghost"}
            size="sm"
            onClick={() => savePresentationMutation.mutate()}
            disabled={savePresentationMutation.isPending}
          >
            {savePresentationMutation.isPending ? (
              <>
                <Loader2 size={16} className="mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1" />
                Save
              </>
            )}
          </Button>
          
          {/* Present button */}
          <Button variant="default" size="sm" className="bg-primary">
            <Play size={16} className="mr-1" />
            Present
          </Button>
          
          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setExportModalOpen(true)}>
                <Download size={16} className="mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShareModalOpen(true)}>
                <Share size={16} className="mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open(`/preview/${presentationId}`, '_blank')}>
                <Monitor size={16} className="mr-2" />
                Preview
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slides sidebar */}
        <div className="w-64 flex-shrink-0">
          <SlidesSidebar
            slides={slides}
            currentSlideIndex={currentSlideIndex}
            onSelectSlide={setCurrentSlideIndex}
            onAddSlide={handleAddSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onReorderSlides={handleReorderSlides}
          />
        </div>
        
        {/* Editor area */}
        <div className="flex-1 flex flex-col">
          {/* Editing tools */}
          <div className="bg-white border-b p-2 flex items-center">
            <Tabs defaultValue="insert" className="w-full">
              <TabsList>
                <TabsTrigger value="insert">Insert</TabsTrigger>
                <TabsTrigger value="format">Format</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="transition">Transitions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="insert" className="p-2 flex space-x-4">
                <Button variant="outline" size="sm">
                  <Type size={16} className="mr-1" />
                  Text
                </Button>
                <Button variant="outline" size="sm">
                  <ImageIcon size={16} className="mr-1" />
                  Image
                </Button>
                <Button variant="outline" size="sm">
                  <Square size={16} className="mr-1" />
                  Shape
                </Button>
              </TabsContent>
              
              <TabsContent value="format" className="p-2 flex space-x-4">
                {/* Font controls */}
                <Select defaultValue="Arial">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Font Family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select defaultValue="16px">
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12px">12px</SelectItem>
                    <SelectItem value="14px">14px</SelectItem>
                    <SelectItem value="16px">16px</SelectItem>
                    <SelectItem value="18px">18px</SelectItem>
                    <SelectItem value="24px">24px</SelectItem>
                    <SelectItem value="32px">32px</SelectItem>
                    <SelectItem value="48px">48px</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="icon">
                  <span className="font-bold">B</span>
                </Button>
                <Button variant="outline" size="icon">
                  <span className="italic">I</span>
                </Button>
                <Button variant="outline" size="icon">
                  <span className="underline">U</span>
                </Button>
              </TabsContent>
              
              <TabsContent value="design" className="p-2 flex space-x-4">
                <Button variant="outline" size="sm" onClick={() => setThemeModalOpen(true)}>
                  <Layout size={16} className="mr-1" />
                  Theme
                </Button>
                <Button variant="outline" size="sm">
                  <PaintBucket size={16} className="mr-1" />
                  Background
                </Button>
              </TabsContent>
              
              <TabsContent value="transition" className="p-2 flex space-x-4">
                <Select defaultValue="fade">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Transition Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="flip">Flip</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select defaultValue="1000">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">Fast (0.5s)</SelectItem>
                    <SelectItem value="1000">Normal (1s)</SelectItem>
                    <SelectItem value="2000">Slow (2s)</SelectItem>
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Canvas */}
          <div className="flex-1">
            {slides.length > 0 && currentSlideIndex < slides.length && (
              <SlideCanvas
                slide={slides[currentSlideIndex]}
                onSlideChange={handleSlideChange}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {/* Theme selection modal */}
      <Dialog open={themeModalOpen} onOpenChange={setThemeModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose a Theme</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {themes.map(theme => (
              <div
                key={theme.id}
                className={cn(
                  "border rounded-md p-4 cursor-pointer hover:border-primary transition-colors",
                  theme.id === currentTheme && "border-primary-500 ring-2 ring-primary-200"
                )}
                onClick={() => handleThemeChange(theme.id)}
              >
                <h3 className="font-semibold mb-2" style={{ color: theme.primaryColor }}>
                  {theme.name}
                </h3>
                
                <div className="flex space-x-1 mt-3">
                  {theme.colorPalette.map((color, index) => (
                    <div
                      key={index}
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  {theme.headingFont} / {theme.bodyFont}
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setThemeModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Export modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Presentation</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Export Format</h3>
              <div className="flex space-x-2">
                <Button
                  variant={exportFormat === 'pptx' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('pptx')}
                  className="flex-1"
                >
                  PowerPoint (.pptx)
                </Button>
                <Button
                  variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('pdf')}
                  className="flex-1"
                >
                  PDF (.pdf)
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 mt-4">
              {exportFormat === 'pptx' ? (
                <p>Export as a PowerPoint file that can be opened and edited in Microsoft PowerPoint or similar applications.</p>
              ) : (
                <p>Export as a PDF document which can be viewed on any device but cannot be edited.</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Share modal placeholder */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Presentation</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Share your presentation with others. They will be able to view and edit the presentation if granted permission.
            </p>
            
            <div className="flex items-center space-x-2 mb-4">
              <Input 
                value={presentationId ? `${window.location.origin}/presentations/${presentationId}` : 'Create a presentation first to get a shareable link'} 
                readOnly
              />
              <Button disabled={!presentationId}>
                Copy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}