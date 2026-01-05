
import React, { useRef, useEffect, useState } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.17, '#ffff00');
    gradient.addColorStop(0.33, '#00ff00');
    gradient.addColorStop(0.5, '#00ffff');
    gradient.addColorStop(0.67, '#0000ff');
    gradient.addColorStop(0.83, '#ff00ff');
    gradient.addColorStop(1, '#ff0000');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add white-to-black vertical gradient overlay for brightness/saturation control if needed, 
    // but a simple hue slider is often best for quick thumbnail work.
  }, []);

  const pickColor = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width - 1));
    
    const imageData = ctx.getImageData(x, canvas.height / 2, 1, 1).data;
    const hex = "#" + ("000000" + ((imageData[0] << 16) | (imageData[1] << 8) | imageData[2]).toString(16)).slice(-6);
    onChange(hex);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    pickColor(e);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) pickColor(e);
    };
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs text-slate-500 font-medium">{label}</label>
        <div 
          className="w-4 h-4 rounded-sm border border-slate-700" 
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={300}
          height={24}
          onMouseDown={handleMouseDown}
          className="w-full h-6 rounded-lg cursor-crosshair shadow-inner"
        />
        <div className="absolute inset-0 pointer-events-none rounded-lg border border-white/10" />
      </div>
    </div>
  );
};

export default ColorPicker;
