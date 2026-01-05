
import React, { useRef, useEffect, useState } from 'react';
import { TextSettings, CharConfig, Decoration } from '../types';

interface EditorProps {
  bgUrl: string;
  settings: TextSettings;
  setSettings: (s: TextSettings) => void;
  decorations: Decoration[];
  setDecorations: (d: Decoration[]) => void;
  selectedId: string | 'text' | null;
  setSelectedId: (id: string | 'text' | null) => void;
}

const Editor: React.FC<EditorProps> = ({ 
  bgUrl, 
  settings, 
  setSettings, 
  decorations, 
  setDecorations,
  selectedId,
  setSelectedId 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Using a heavier arrow character for better visibility and a solid "pillar" feel
  const getSymbolText = (type: Decoration['type']) => {
    switch(type) {
      case 'arrow': return '➡'; 
      case 'star': return '★';
      default: return type;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = bgUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 1. Draw Text
      ctx.save();
      ctx.font = `900 ${settings.fontSize}px '${settings.fontFamily}', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const lines: CharConfig[][] = [[]];
      settings.chars.forEach(c => {
        if (c.char === '\n') lines.push([]);
        else lines[lines.length - 1].push(c);
      });

      const verticalOffsetStart = settings.y - ((lines.length - 1) * settings.fontSize * settings.lineHeight) / 2;

      lines.forEach((lineChars, lineIndex) => {
        if (lineChars.length === 0) return;
        const lineWidth = lineChars.reduce((acc, c) => acc + ctx.measureText(c.char).width, 0);
        let currentX = settings.x - lineWidth / 2;
        const currentY = verticalOffsetStart + lineIndex * settings.fontSize * settings.lineHeight;

        lineChars.forEach((c) => {
          const charWidth = ctx.measureText(c.char).width;
          const targetX = currentX + charWidth / 2;
          ctx.save();
          if (settings.shadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 8;
            ctx.shadowOffsetY = 8;
          }
          ctx.strokeStyle = settings.strokeColor;
          ctx.lineWidth = settings.strokeWidth;
          ctx.strokeText(c.char, targetX, currentY);
          ctx.fillStyle = c.color;
          ctx.shadowColor = 'transparent';
          ctx.fillText(c.char, targetX, currentY);
          ctx.restore();
          currentX += charWidth;
        });
      });
      ctx.restore();

      // 2. Draw Decorations
      decorations.forEach(dec => {
        ctx.save();
        ctx.translate(dec.x, dec.y);
        ctx.rotate((dec.rotation * Math.PI) / 180);
        
        ctx.font = `900 ${dec.size}px 'Black Han Sans', 'Arial Black', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const symbol = getSymbolText(dec.type);
        
        if (settings.shadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 8;
          ctx.shadowOffsetY = 8;
        }

        ctx.strokeStyle = dec.strokeColor || '#000000';
        ctx.lineWidth = dec.size * 0.15;
        ctx.strokeText(symbol, 0, 0);
        
        ctx.fillStyle = dec.color;
        ctx.shadowColor = 'transparent';
        ctx.fillText(symbol, 0, 0);

        if (selectedId === dec.id) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 5]);
          ctx.strokeRect(-dec.size/2 - 10, -dec.size/2 - 10, dec.size + 20, dec.size + 20);
        }
        
        ctx.restore();
      });

      if (selectedId === 'text') {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(settings.x - 320, settings.y - 120, 640, 240);
        ctx.restore();
      }
    };
  }, [bgUrl, settings, decorations, selectedId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (let i = decorations.length - 1; i >= 0; i--) {
      const dec = decorations[i];
      const dist = Math.sqrt(Math.pow(x - dec.x, 2) + Math.pow(y - dec.y, 2));
      if (dist < dec.size / 2 + 30) {
        setSelectedId(dec.id);
        setIsDragging(true);
        setDragOffset({ x: x - dec.x, y: y - dec.y });
        return;
      }
    }

    if (Math.abs(x - settings.x) < 320 && Math.abs(y - settings.y) < 120) {
      setSelectedId('text');
      setIsDragging(true);
      setDragOffset({ x: x - settings.x, y: y - settings.y });
      return;
    }

    setSelectedId(null);
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (selectedId === 'text') {
      setSettings({
        ...settings,
        x: mouseX - dragOffset.x,
        y: mouseY - dragOffset.y
      });
    } else {
      setDecorations(decorations.map(d => 
        d.id === selectedId 
          ? { ...d, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y }
          : d
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl bg-black aspect-video max-w-full">
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className={`w-full h-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white pointer-events-none flex items-center gap-2 border border-white/10">
        <div className={`w-2 h-2 rounded-full ${isDragging ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
        {isDragging ? '객체 이동 중' : '클릭하여 선택 후 드래그'}
      </div>
    </div>
  );
};

export default Editor;
