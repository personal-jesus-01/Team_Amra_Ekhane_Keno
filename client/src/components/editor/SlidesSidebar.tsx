import { useState } from 'react';
import { SlideData } from '@/lib/types';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { 
  Plus, 
  Copy, 
  Trash, 
  ChevronUp, 
  ChevronDown, 
  MoreVertical 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface SlidesSidebarProps {
  slides: SlideData[];
  currentSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onReorderSlides: (slides: SlideData[]) => void;
}

export default function SlidesSidebar({
  slides,
  currentSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlides
}: SlidesSidebarProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag end event for reordering slides
  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    
    // Reorder the slides array
    const reorderedSlides = Array.from(slides);
    const [removed] = reorderedSlides.splice(result.source.index, 1);
    reorderedSlides.splice(result.destination.index, 0, removed);
    
    // Update slides in parent component
    onReorderSlides(reorderedSlides);
    
    // Update current slide index if necessary
    if (currentSlideIndex === result.source.index) {
      onSelectSlide(result.destination.index);
    } else if (
      currentSlideIndex >= result.destination.index && 
      currentSlideIndex < result.source.index
    ) {
      onSelectSlide(currentSlideIndex + 1);
    } else if (
      currentSlideIndex <= result.destination.index && 
      currentSlideIndex > result.source.index
    ) {
      onSelectSlide(currentSlideIndex - 1);
    }
  };

  // Render slide thumbnail
  const renderThumbnail = (slide: SlideData, index: number) => {
    const isActive = index === currentSlideIndex;
    
    return (
      <div 
        className={cn(
          "flex items-center group",
          "border rounded-md mb-2 p-1",
          isActive ? "border-primary bg-primary/10" : "border-gray-200 hover:border-gray-300"
        )}
      >
        {/* Slide number */}
        <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium text-gray-500">
          {index + 1}
        </div>

        {/* Thumbnail */}
        <div 
          className="flex-1 mx-2 h-14 bg-white rounded border border-gray-200 overflow-hidden"
          onClick={() => onSelectSlide(index)}
        >
          {/* Preview of the slide */}
          <div
            className="relative w-full h-full"
            style={{
              backgroundColor: slide.background.type === 'color' ? slide.background.value : 'white',
              backgroundImage: slide.background.type === 'image' ? `url(${slide.background.value})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Simple representation of elements */}
            {slide.elements.map(element => {
              if (element.type === 'text') {
                return (
                  <div
                    key={element.id}
                    className="absolute bg-gray-300"
                    style={{
                      left: `${(element.x / 1280) * 100}%`,
                      top: `${(element.y / 720) * 100}%`,
                      width: `${(element.width / 1280) * 100}%`,
                      height: `${(element.height / 720) * 100}%`,
                      transform: `rotate(${element.rotation}deg)`
                    }}
                  />
                );
              } else if (element.type === 'image') {
                return (
                  <div
                    key={element.id}
                    className="absolute bg-blue-200"
                    style={{
                      left: `${(element.x / 1280) * 100}%`,
                      top: `${(element.y / 720) * 100}%`,
                      width: `${(element.width / 1280) * 100}%`,
                      height: `${(element.height / 720) * 100}%`,
                      transform: `rotate(${element.rotation}deg)`
                    }}
                  />
                );
              } else if (element.type === 'shape') {
                return (
                  <div
                    key={element.id}
                    className="absolute bg-green-200"
                    style={{
                      left: `${(element.x / 1280) * 100}%`,
                      top: `${(element.y / 720) * 100}%`,
                      width: `${(element.width / 1280) * 100}%`,
                      height: `${(element.height / 720) * 100}%`,
                      transform: `rotate(${element.rotation}deg)`
                    }}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100">
              <MoreVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDuplicateSlide(index)}>
              <Copy size={14} className="mr-2" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteSlide(index)} disabled={slides.length <= 1}>
              <Trash size={14} className="mr-2" /> Delete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => index > 0 && onReorderSlides([...slides.slice(0, index - 1), slides[index], slides[index - 1], ...slides.slice(index + 1)])} disabled={index === 0}>
              <ChevronUp size={14} className="mr-2" /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => index < slides.length - 1 && onReorderSlides([...slides.slice(0, index), slides[index + 1], slides[index], ...slides.slice(index + 2)])} disabled={index === slides.length - 1}>
              <ChevronDown size={14} className="mr-2" /> Move down
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-1">Slides</h2>
        <p className="text-sm text-gray-500">{slides.length} slides</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <DragDropContext 
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
        >
          <Droppable droppableId="slides-list">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  isDragging && "bg-blue-50 rounded-md"
                )}
              >
                {slides.map((slide, index) => (
                  <Draggable key={slide.id.toString()} draggableId={slide.id.toString()} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {renderThumbnail(slide, index)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      
      <div className="p-4 border-t">
        <Button 
          onClick={onAddSlide} 
          className="w-full"
          variant="outline"
        >
          <Plus size={16} className="mr-2" /> Add Slide
        </Button>
      </div>
    </div>
  );
}