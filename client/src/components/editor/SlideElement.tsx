import { useState, useRef, useEffect } from 'react';
import { SlideElement as SlideElementType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SlideElementProps {
  element: SlideElementType;
  isSelected: boolean;
  isEditing: boolean;
  canvasScale: number;
  onSelect: (id: string) => void;
  onUpdate: (element: SlideElementType) => void;
  onDoubleClick: (id: string) => void;
}

export default function SlideElement({
  element,
  isSelected,
  isEditing,
  canvasScale,
  onSelect,
  onUpdate,
  onDoubleClick
}: SlideElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<string | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && elementRef.current) {
        e.preventDefault();
        const newX = e.clientX / canvasScale - dragOffset.x;
        const newY = e.clientY / canvasScale - dragOffset.y;
        
        onUpdate({
          ...element,
          x: newX,
          y: newY
        });
      } else if (resizing && elementRef.current) {
        e.preventDefault();
        
        const rect = elementRef.current.getBoundingClientRect();
        const containerRect = elementRef.current.parentElement?.getBoundingClientRect();
        
        if (!containerRect) return;
        
        let newWidth = element.width;
        let newHeight = element.height;
        let newX = element.x;
        let newY = element.y;
        
        // Calculate new dimensions based on which handle is being dragged
        switch (resizing) {
          case 'e': // East
            newWidth = (e.clientX - containerRect.left) / canvasScale - element.x;
            break;
          case 'w': // West
            const deltaX = (e.clientX - containerRect.left) / canvasScale - element.x;
            newWidth = element.width - deltaX;
            newX = element.x + deltaX;
            break;
          case 's': // South
            newHeight = (e.clientY - containerRect.top) / canvasScale - element.y;
            break;
          case 'n': // North
            const deltaY = (e.clientY - containerRect.top) / canvasScale - element.y;
            newHeight = element.height - deltaY;
            newY = element.y + deltaY;
            break;
          case 'se': // South East
            newWidth = (e.clientX - containerRect.left) / canvasScale - element.x;
            newHeight = (e.clientY - containerRect.top) / canvasScale - element.y;
            break;
          case 'sw': // South West
            const deltaXSW = (e.clientX - containerRect.left) / canvasScale - element.x;
            newWidth = element.width - deltaXSW;
            newX = element.x + deltaXSW;
            newHeight = (e.clientY - containerRect.top) / canvasScale - element.y;
            break;
          case 'ne': // North East
            newWidth = (e.clientX - containerRect.left) / canvasScale - element.x;
            const deltaYNE = (e.clientY - containerRect.top) / canvasScale - element.y;
            newHeight = element.height - deltaYNE;
            newY = element.y + deltaYNE;
            break;
          case 'nw': // North West
            const deltaXNW = (e.clientX - containerRect.left) / canvasScale - element.x;
            newWidth = element.width - deltaXNW;
            newX = element.x + deltaXNW;
            const deltaYNW = (e.clientY - containerRect.top) / canvasScale - element.y;
            newHeight = element.height - deltaYNW;
            newY = element.y + deltaYNW;
            break;
        }
        
        // Make sure dimensions are not negative
        if (newWidth > 10 && newHeight > 10) {
          onUpdate({
            ...element,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setResizing(null);
    };

    if (isDragging || resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, resizing, element, canvasScale, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isSelected) {
      onSelect(element.id);
    }
    
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setDragOffset({
        x: (e.clientX - rect.left) / canvasScale,
        y: (e.clientY - rect.top) / canvasScale
      });
      setIsDragging(true);
    }
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, handle: string) => {
    e.stopPropagation();
    setResizing(handle);
  };

  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <div 
            className={cn(
              "w-full h-full overflow-hidden",
              isEditing ? "cursor-text" : "cursor-move"
            )}
            style={{
              fontFamily: element.style?.fontFamily || 'inherit',
              fontSize: element.style?.fontSize || 'inherit',
              fontWeight: element.style?.fontWeight || 'inherit',
              fontStyle: element.style?.fontStyle || 'inherit',
              color: element.style?.color || 'inherit',
              backgroundColor: element.style?.backgroundColor || 'transparent',
              textAlign: element.style?.textAlign as any || 'left',
              padding: element.style?.padding || '0',
              lineHeight: '1.4',
              outline: 'none',
              whiteSpace: 'pre-wrap',
              userSelect: isEditing ? 'text' : 'none'
            }}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => {
              if (isEditing) {
                onUpdate({
                  ...element,
                  content: e.currentTarget.textContent || ''
                });
              }
            }}
          >
            {element.content}
          </div>
        );
      
      case 'image':
        return (
          <img 
            src={element.src} 
            alt={element.alt || "Slide image"} 
            className="w-full h-full object-contain cursor-move"
            style={{
              filter: element.filter || 'none',
              opacity: element.style?.opacity !== undefined ? element.style.opacity : 1
            }}
            draggable={false}
          />
        );
        
      case 'shape':
        // Add additional logging to debug shape rendering
        console.log("Rendering shape element:", element);
        return (
          <div 
            className="w-full h-full cursor-move flex items-center justify-center"
            style={{
              backgroundColor: 'transparent'
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              {element.shape === 'rectangle' && (
                <rect
                  x="0" y="0" width="100" height="100"
                  fill={element.fill || "#3399ff"}
                  stroke={element.stroke || "#0066cc"}
                  strokeWidth={element.strokeWidth || 2}
                  rx={element.style?.borderRadius ? parseInt(element.style.borderRadius) : 0}
                  ry={element.style?.borderRadius ? parseInt(element.style.borderRadius) : 0}
                />
              )}
              {element.shape === 'circle' && (
                <circle
                  cx="50" cy="50" r="50"
                  fill={element.fill || "#3399ff"}
                  stroke={element.stroke || "#0066cc"}
                  strokeWidth={element.strokeWidth || 2}
                />
              )}
              {element.shape === 'triangle' && (
                <polygon
                  points="50,0 100,100 0,100"
                  fill={element.fill || "#3399ff"}
                  stroke={element.stroke || "#0066cc"}
                  strokeWidth={element.strokeWidth || 2}
                />
              )}
              {element.shape === 'star' && (
                <polygon
                  points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35"
                  fill={element.fill || "#3399ff"}
                  stroke={element.stroke || "#0066cc"}
                  strokeWidth={element.strokeWidth || 2}
                />
              )}
              {/* Make arrow element more visible with better defaults */}
              {element.shape === 'arrow' && (
                <polygon
                  points="0,40 80,40 80,20 100,50 80,80 80,60 0,60"
                  fill={element.fill || "#3399ff"}
                  stroke={element.stroke || "#0066cc"}
                  strokeWidth={element.strokeWidth || 2}
                />
              )}
              {/* Fallback case if shape type isn't specified properly */}
              {(!element.shape || typeof element.shape !== 'string') && (
                <rect
                  x="0" y="0" width="100" height="100"
                  fill="#e6f2ff" 
                  stroke="#3399ff"
                  strokeWidth={2}
                />
              )}
            </svg>
            {element.content && (
              <div className="absolute inset-0 flex items-center justify-center text-center text-sm p-2">
                {element.content}
              </div>
            )}
          </div>
        );
        
      case 'chart':
        return (
          <div className="w-full h-full cursor-move flex items-center justify-center bg-gray-100 rounded-md">
            <div className="text-sm text-gray-500 text-center p-2">
              {(element.chartType || "Bar") + " Chart"}
              <p className="text-xs mt-1">
                {(element.data && element.data.labels && `${element.data.labels.length} data points`) || "Sample Chart Data"}
              </p>
            </div>
          </div>
        );
        
      default:
        return <div className="w-full h-full bg-gray-200 cursor-move" />;
    }
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        "absolute",
        isSelected && "outline outline-2 outline-blue-500"
      )}
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: isSelected ? 10 : 1
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.id);
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(element.id);
      }}
    >
      {renderContent()}
      
      {/* Resize handles - only shown when selected */}
      {isSelected && !isEditing && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 bg-white border-2 border-blue-500 -mt-1 -ml-1 cursor-nw-resize" 
               onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="absolute top-0 right-0 w-2 h-2 bg-white border-2 border-blue-500 -mt-1 -mr-1 cursor-ne-resize" 
               onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-white border-2 border-blue-500 -mb-1 -ml-1 cursor-sw-resize" 
               onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-white border-2 border-blue-500 -mb-1 -mr-1 cursor-se-resize" 
               onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-white border-2 border-blue-500 -mt-1 -ml-1 cursor-n-resize" 
               onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="absolute left-0 top-1/2 w-2 h-2 bg-white border-2 border-blue-500 -ml-1 -mt-1 cursor-w-resize" 
               onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="absolute right-0 top-1/2 w-2 h-2 bg-white border-2 border-blue-500 -mr-1 -mt-1 cursor-e-resize" 
               onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-white border-2 border-blue-500 -mb-1 -ml-1 cursor-s-resize" 
               onMouseDown={(e) => handleResizeStart(e, 's')} />
        </>
      )}
    </div>
  );
}