import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface Annotation {
  id: string;
  type: 'pen' | 'text' | 'highlight';
  data: {
    path?: {x: number, y: number}[];
    x?: number;
    y?: number;
    text?: string;
    color?: string;
    width?: number;
    fontSize?: number;
    height?: number;
  };
  timestamp: number;
}

interface AnnotationCanvasProps {
  width: number;
  height: number;
  tool: 'pen' | 'text' | 'highlight';
  isActive: boolean;
  annotations: Annotation[];
  onAnnotationAdd: (annotation: Annotation) => void;
  onAnnotationUpdate: (id: string, data: Annotation['data']) => void;
  zoom: number;
  panX: number;
  panY: number;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  width,
  height,
  tool,
  isActive,
  annotations,
  onAnnotationAdd,
  zoom,
  panX,
  panY
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  const [textInput, setTextInput] = useState<{x: number, y: number, text: string} | null>(null);

  // Redraw all annotations when they change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all annotations
    annotations.forEach(annotation => {
      switch (annotation.type) {
        case 'pen':
          drawPenAnnotation(ctx, annotation.data);
          break;
        case 'text':
          drawTextAnnotation(ctx, annotation.data);
          break;
        case 'highlight':
          drawHighlightAnnotation(ctx, annotation.data);
          break;
      }
    });
  }, [annotations]);

  const drawPenAnnotation = (ctx: CanvasRenderingContext2D, data: {path?: {x: number, y: number}[], color?: string, width?: number}) => {
    if (!data.path || data.path.length < 2) return;

    ctx.strokeStyle = data.color || '#ff0000';
    ctx.lineWidth = data.width || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(data.path[0].x, data.path[0].y);
    for (let i = 1; i < data.path.length; i++) {
      ctx.lineTo(data.path[i].x, data.path[i].y);
    }
    ctx.stroke();
  };

  const drawTextAnnotation = (ctx: CanvasRenderingContext2D, data: {x?: number, y?: number, text?: string, color?: string, fontSize?: number}) => {
    if (!data.x || !data.y || !data.text) return;
    
    ctx.fillStyle = data.color || '#ff0000';
    ctx.font = `${data.fontSize || 16}px Arial`;
    ctx.fillText(data.text, data.x, data.y);
  };

  const drawHighlightAnnotation = (ctx: CanvasRenderingContext2D, data: {x?: number, y?: number, width?: number, height?: number, color?: string}) => {
    if (!data.x || !data.y || !data.width || !data.height) return;
    
    ctx.fillStyle = data.color || '#ffff00';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(data.x, data.y, data.width, data.height);
    ctx.globalAlpha = 1.0;
  };

  const getCanvasCoordinates = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom - panX / zoom,
      y: (e.clientY - rect.top) / zoom - panY / zoom
    };
  }, [zoom, panX, panY]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive) return;

    const coords = getCanvasCoordinates(e);

    if (tool === 'pen') {
      setIsDrawing(true);
      setCurrentPath([coords]);
    } else if (tool === 'text') {
      setTextInput({ x: coords.x, y: coords.y, text: '' });
    }
  }, [isActive, tool, getCanvasCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isActive || !isDrawing || tool !== 'pen') return;

    const coords = getCanvasCoordinates(e);
    setCurrentPath(prev => [...prev, coords]);

    // Draw current path in real-time
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentPath.length > 1) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const lastPoint = currentPath[currentPath.length - 2];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  }, [isActive, isDrawing, tool, currentPath, getCanvasCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (!isActive || tool !== 'pen') return;

    if (isDrawing && currentPath.length > 1) {
      const annotation: Annotation = {
        id: Date.now().toString(),
        type: 'pen',
        data: {
          path: currentPath,
          color: '#ff0000',
          width: 2
        },
        timestamp: Date.now()
      };
      onAnnotationAdd(annotation);
    }

    setIsDrawing(false);
    setCurrentPath([]);
  }, [isActive, tool, isDrawing, currentPath, onAnnotationAdd]);

  const handleTextSubmit = useCallback((text: string) => {
    if (!textInput || !text.trim()) {
      setTextInput(null);
      return;
    }

    const annotation: Annotation = {
      id: Date.now().toString(),
      type: 'text',
      data: {
        x: textInput.x,
        y: textInput.y,
        text: text.trim(),
        color: '#ff0000',
        fontSize: 16
      },
      timestamp: Date.now()
    };

    onAnnotationAdd(annotation);
    setTextInput(null);
  }, [textInput, onAnnotationAdd]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`absolute inset-0 ${isActive ? 'cursor-crosshair' : 'pointer-events-none'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
          transformOrigin: '0 0'
        }}
      />

      {/* Text Input */}
      {textInput && (
        <div
          className="absolute bg-white border border-gray-300 rounded p-2 shadow-lg z-50"
          style={{
            left: textInput.x * zoom + panX,
            top: textInput.y * zoom + panY
          }}
        >
          <input
            type="text"
            value={textInput.text}
            onChange={(e) => setTextInput(prev => prev ? { ...prev, text: e.target.value } : null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTextSubmit(textInput.text);
              } else if (e.key === 'Escape') {
                setTextInput(null);
              }
            }}
            onBlur={() => handleTextSubmit(textInput.text)}
            autoFocus
            className="border-none outline-none bg-transparent text-red-600 font-medium"
            placeholder="Enter text..."
          />
        </div>
      )}
    </div>
  );
};

export default AnnotationCanvas;