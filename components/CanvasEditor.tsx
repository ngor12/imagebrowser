import React, { useRef, useEffect } from 'react';
import { CanvasState, TextLayer } from '../types';

interface CanvasEditorProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasState: CanvasState;
  textLayers: TextLayer[];
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ canvasRef, canvasState, textLayers }) => {
  
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Background Fill
    ctx.fillStyle = canvasState.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Background Image
    if (canvasState.backgroundImage) {
      const img = new Image();
      img.src = canvasState.backgroundImage;
      // Note: In a real production app, we would load this once or handle async loading better.
      // For this simplified version, we rely on the browser cache if redrawing frequently.
      // However, to ensure it draws immediately if loaded:
      if (img.complete) {
        drawImageProp(ctx, img, 0, 0, canvas.width, canvas.height);
        drawOverlay(ctx);
        drawText(ctx);
      } else {
        img.onload = () => {
          drawImageProp(ctx, img, 0, 0, canvas.width, canvas.height);
          drawOverlay(ctx);
          drawText(ctx);
        };
      }
    } else {
        drawOverlay(ctx);
        drawText(ctx);
    }
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D) => {
    if (canvasState.overlayOpacity > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${canvasState.overlayOpacity})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  };

  const drawText = (ctx: CanvasRenderingContext2D) => {
    textLayers.forEach(layer => {
      ctx.save();
      ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
      ctx.fillStyle = layer.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (layer.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
      }

      // Convert relative % position to pixels
      const xPos = (layer.x / 100) * ctx.canvas.width;
      const yPos = (layer.y / 100) * ctx.canvas.height;

      ctx.fillText(layer.text, xPos, yPos);
      ctx.restore();
    });
  };

  // Helper to cover/contain image
  const drawImageProp = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, offsetX = 0.5, offsetY = 0.5) => {
    // default offset is center
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    // keep bounds [0.0, 1.0]
    if (offsetX < 0) offsetX = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY < 0) offsetY = 0;
    if (offsetY > 1) offsetY = 1;

    let iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r,   // new prop. width
        nh = ih * r,   // new prop. height
        cx, cy, cw, ch, ar = 1;

    // decide which gap to fill    
    if (nw < w) ar = w / nw;                             
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
    nw *= ar;
    nh *= ar;

    // calc source rectangle
    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    // make sure source rectangle is valid
    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    ctx.drawImage(img, cx, cy, cw, ch,  x, y, w, h);
  }

  useEffect(() => {
    draw();
    // We add a small timeout to ensure fonts are loaded or images are ready in some edge cases
    const timer = setTimeout(draw, 100);
    return () => clearTimeout(timer);
  }, [canvasState, textLayers, canvasRef]); // Re-run when these change

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 shadow-inner p-4 relative">
       {/* Container to handle responsive scaling of the canvas without changing internal resolution */}
       <div style={{ 
         width: '100%', 
         height: '100%', 
         display: 'flex', 
         alignItems: 'center', 
         justifyContent: 'center',
         overflow: 'hidden'
       }}>
          <canvas
            ref={canvasRef}
            width={canvasState.width}
            height={canvasState.height}
            className="max-w-full max-h-full shadow-2xl object-contain bg-white"
            style={{ aspectRatio: `${canvasState.width}/${canvasState.height}` }}
          />
       </div>
       <div className="absolute bottom-4 right-4 bg-black/60 text-xs px-2 py-1 rounded text-white backdrop-blur-sm pointer-events-none">
          {canvasState.width} x {canvasState.height} px
       </div>
    </div>
  );
};