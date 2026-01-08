import { useState, useRef, useEffect } from 'react';
import { SlideData, SlideElement } from '@/lib/types';
import SlideElementComponent from './SlideElement';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import {
  Text,
  Image,
  Square,
  Circle,
  Triangle,
  Star,
  BarChart,
} from 'lucide-react';

interface SlideCanvasProps {
  slide: SlideData;
  onSlideChange: (slide: SlideData) => void;
}

export default function SlideCanvas({ slide, onSlideChange }: SlideCanvasProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [isDraggingTool, setIsDraggingTool] = useState<string | null>(null);
  const [toolDragPosition, setToolDragPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle tool drag start from toolbar
  const handleToolDragStart = (e: React.DragEvent, tool: string) => {
    e.dataTransfer.setData('tool', tool);
    setIsDraggingTool(tool);
  };

  // Handle drop of new elements
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tool = e.dataTransfer.getData('tool');
    
    if (!tool || !canvasRef.current) return;
    
    // Get canvas coordinates
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Create a new element
    let newElement: SlideElement;
    
    switch (tool) {
      case 'text':
        newElement = {
          id: uuidv4(),
          type: 'text',
          x,
          y,
          width: 200,
          height: 100,
          rotation: 0,
          content: 'Double-click to edit text',
          style: {
            fontFamily: 'sans-serif',
            fontSize: '16px',
            color: '#000000',
            textAlign: 'left',
          }
        };
        break;
        
      case 'image':
        newElement = {
          id: uuidv4(),
          type: 'image',
          x,
          y,
          width: 300,
          height: 200,
          rotation: 0,
          content: '',
          src: 'https://via.placeholder.com/300x200',
          alt: 'Placeholder image',
        };
        break;
        
      case 'rectangle':
        newElement = {
          id: uuidv4(),
          type: 'shape',
          shape: 'rectangle',
          x,
          y,
          width: 150,
          height: 100,
          rotation: 0,
          content: '',
          fill: '#4f46e5',
          stroke: '#312e81',
          strokeWidth: 0,
        };
        break;
        
      case 'circle':
        newElement = {
          id: uuidv4(),
          type: 'shape',
          shape: 'circle',
          x,
          y,
          width: 100,
          height: 100,
          rotation: 0,
          content: '',
          fill: '#f97316',
          stroke: '#9a3412',
          strokeWidth: 0,
        };
        break;
        
      case 'triangle':
        newElement = {
          id: uuidv4(),
          type: 'shape',
          shape: 'triangle',
          x,
          y,
          width: 100,
          height: 100,
          rotation: 0,
          content: '',
          fill: '#22c55e',
          stroke: '#166534',
          strokeWidth: 0,
        };
        break;
        
      case 'star':
        newElement = {
          id: uuidv4(),
          type: 'shape',
          shape: 'star',
          x,
          y,
          width: 100,
          height: 100,
          rotation: 0,
          content: '',
          fill: '#eab308',
          stroke: '#854d0e',
          strokeWidth: 0,
        };
        break;
        
      case 'chart':
        newElement = {
          id: uuidv4(),
          type: 'chart',
          x,
          y,
          width: 300,
          height: 200,
          rotation: 0,
          content: '',
          chartConfig: {
            type: 'bar',
            data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
              datasets: [{
                label: 'Sample Data',
                data: [65, 59, 80, 81, 56]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false
            }
          }
        };
        break;
      
      default:
        return;
    }
    
    // Update the slide with the new element
    onSlideChange({
      ...slide,
      elements: [...slide.elements, newElement]
    });
    
    // Select the newly created element
    setSelectedElementId(newElement.id);
    
    // If it's a text element, set it to editing mode
    if (tool === 'text') {
      setEditingElementId(newElement.id);
    }
    
    setIsDraggingTool(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (isDraggingTool && canvasRef.current) {
      // Update drag position for visual feedback
      const rect = canvasRef.current.getBoundingClientRect();
      setToolDragPosition({
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale
      });
    }
  };

  // Update element properties on change
  const handleElementUpdate = (updatedElement: SlideElement) => {
    const updatedElements = slide.elements.map(element => 
      element.id === updatedElement.id ? updatedElement : element
    );
    
    onSlideChange({
      ...slide,
      elements: updatedElements
    });
  };

  // Handle element selection
  const handleElementSelect = (id: string) => {
    setSelectedElementId(id);
    setEditingElementId(null);
  };

  // Handle canvas click (deselect elements)
  const handleCanvasClick = () => {
    setSelectedElementId(null);
    setEditingElementId(null);
  };

  // Handle element double click (for text editing)
  const handleElementDoubleClick = (id: string) => {
    const element = slide.elements.find(e => e.id === id);
    if (element && element.type === 'text') {
      setEditingElementId(id);
    }
  };

  // Delete selected element
  const handleDeleteElement = () => {
    if (!selectedElementId) return;
    
    const updatedElements = slide.elements.filter(element => 
      element.id !== selectedElementId
    );
    
    onSlideChange({
      ...slide,
      elements: updatedElements
    });
    
    setSelectedElementId(null);
    setEditingElementId(null);
  };
  
  // Reset selection when slide changes
  useEffect(() => {
    setSelectedElementId(null);
    setEditingElementId(null);
  }, [slide.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-white border-b p-2 flex space-x-2">
        <div 
          className="p-2 rounded hover:bg-gray-100 cursor-grab"
          draggable
          onDragStart={(e) => handleToolDragStart(e, 'text')}
        >
          <Text size={20} />
        </div>
        <div 
          className="p-2 rounded hover:bg-gray-100 cursor-grab"
          draggable
          onDragStart={(e) => handleToolDragStart(e, 'image')}
        >
          <Image size={20} />
        </div>
        <div 
          className="p-2 rounded hover:bg-gray-100 cursor-grab"
          draggable
          onDragStart={(e) => handleToolDragStart(e, 'rectangle')}
        >
          <Square size={20} />
        </div>
        <div 
          className="p-2 rounded hover:bg-gray-100 cursor-grab"
          draggable
          onDragStart={(e) => handleToolDragStart(e, 'circle')}
        >
          <Circle size={20} />
        </div>
        <div 
          className="p-2 rounded hover:bg-gray-100 cursor-grab"
          draggable
          onDragStart={(e) => handleToolDragStart(e, 'triangle')}
        >
          <Triangle size={20} />
        </div>
        <div 
          className="p-2 rounded hover:bg-gray-100 cursor-grab"
          draggable
          onDragStart={(e) => handleToolDragStart(e, 'star')}
        >
          <Star size={20} />
        </div>
        <div 
          className="p-2 rounded hover:bg-gray-100 cursor-grab"
          draggable
          onDragStart={(e) => handleToolDragStart(e, 'chart')}
        >
          <BarChart size={20} />
        </div>
        
        <div className="ml-auto flex items-center space-x-2">
          <select 
            className="border rounded p-1 text-sm"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
          >
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1">100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
          </select>
          
          {selectedElementId && (
            <button 
              className="p-2 rounded hover:bg-red-100 text-red-600"
              onClick={handleDeleteElement}
            >
              Delete
            </button>
          )}
        </div>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center">
        <div className="relative" style={{ margin: 'auto' }}>
          <div
            ref={canvasRef}
            className={cn(
              "relative overflow-hidden bg-white shadow-lg transition-transform",
              "w-[1280px] h-[720px]" // 16:9 aspect ratio
            )}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              backgroundImage: slide.background.type === 'image' 
                ? `url(${slide.background.value})` 
                : slide.background.type === 'gradient'
                  ? slide.background.value
                  : 'none',
              backgroundColor: slide.background.type === 'color' 
                ? slide.background.value 
                : 'white'
            }}
            onClick={handleCanvasClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {/* Render all slide elements */}
            {slide.elements.map(element => (
              <SlideElementComponent
                key={element.id}
                element={element}
                isSelected={selectedElementId === element.id}
                isEditing={editingElementId === element.id}
                canvasScale={scale}
                onSelect={handleElementSelect}
                onUpdate={handleElementUpdate}
                onDoubleClick={handleElementDoubleClick}
              />
            ))}
            
            {/* Visual feedback for dragging tools */}
            {isDraggingTool && (
              <div 
                className="absolute border-2 border-dashed border-blue-500 rounded-md bg-blue-100 bg-opacity-30"
                style={{
                  left: `${toolDragPosition.x}px`,
                  top: `${toolDragPosition.y}px`,
                  width: '150px',
                  height: '100px',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}