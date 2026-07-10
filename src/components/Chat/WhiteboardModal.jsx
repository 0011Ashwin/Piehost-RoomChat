import React, { useRef, useEffect, useState } from 'react';
import { X, Eraser, Palette } from 'lucide-react';

export default function WhiteboardModal({ channel, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3b82f6'); // default brush color

  // Set up canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
  }, []);

  // Listen to remote draw events
  useEffect(() => {
    if (!channel) return;

    let isActive = true;

    const drawLine = (canvas, ctx, line) => {
      ctx.beginPath();
      ctx.moveTo(line.x0 * canvas.width, line.y0 * canvas.height);
      ctx.lineTo(line.x1 * canvas.width, line.y1 * canvas.height);
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();
    };

    const handleDraw = (data) => {
      if (!isActive) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      drawLine(canvas, ctx, data);
    };

    const handleDrawBatch = (data) => {
      if (!isActive) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      data.lines.forEach((line) => {
        drawLine(canvas, ctx, line);
      });
    };

    const handleClear = () => {
      if (!isActive) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    channel.listen('whiteboard_draw', handleDraw);
    channel.listen('whiteboard_draw_batch', handleDrawBatch);
    channel.listen('whiteboard_clear', handleClear);

    return () => {
      isActive = false;
    };
  }, [channel]);

  // Drawing logic
  const currentPos = useRef({ x: 0, y: 0 });
  const drawQueue = useRef([]);

  // Batch send draw events to reduce WebSocket message load and latency
  useEffect(() => {
    if (!isDrawing || !channel) return;

    const interval = setInterval(() => {
      if (drawQueue.current.length > 0) {
        channel.publish('whiteboard_draw_batch', {
          lines: drawQueue.current
        });
        drawQueue.current = [];
      }
    }, 25); // 25ms flush interval (40fps updates)

    return () => {
      clearInterval(interval);
      // Flush any remaining lines on draw stop
      if (drawQueue.current.length > 0) {
        channel.publish('whiteboard_draw_batch', {
          lines: drawQueue.current
        });
        drawQueue.current = [];
      }
    };
  }, [isDrawing, channel]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    currentPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(currentPos.current.x, currentPos.current.y);
    ctx.lineTo(newX, newY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();

    // Buffer for batch broadcast
    drawQueue.current.push({
      x0: currentPos.current.x / canvas.width,
      y0: currentPos.current.y / canvas.height,
      x1: newX / canvas.width,
      y1: newY / canvas.height,
      color
    });

    currentPos.current = { x: newX, y: newY };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (channel) {
      channel.publish('whiteboard_clear', {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-200 dark:border-slate-800">
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand-500" /> Shared Whiteboard
          </h3>
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)} 
              className="w-8 h-8 cursor-pointer rounded-full border-0 p-0 shadow-sm" 
              title="Brush Color" 
            />
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button 
              onClick={clearCanvas} 
              className="p-1.5 px-3 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <Eraser className="w-4 h-4" /> Clear
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div 
          className="flex-1 relative bg-white dark:bg-slate-950 touch-none" 
          onPointerDown={startDrawing} 
          onPointerMove={draw} 
          onPointerUp={stopDrawing} 
          onPointerLeave={stopDrawing}
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair" />
        </div>
      </div>
    </div>
  );
}
