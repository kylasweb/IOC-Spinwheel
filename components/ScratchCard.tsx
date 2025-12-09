import React, { useRef, useEffect, useState } from 'react';
import { Gift, Award } from 'lucide-react';
import { Prize } from '../types';

interface ScratchCardProps {
  prize: Prize;
  onReveal: () => void;
}

const ScratchCard: React.FC<ScratchCardProps> = ({ prize, onReveal }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Fill with scratchable overlay
    ctx.fillStyle = '#CCCCCC'; // Silver color
    ctx.fillRect(0, 0, width, height);
    
    // Add Pattern/Text to overlay
    ctx.fillStyle = '#999999';
    ctx.font = '24px Inter sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH HERE', width / 2, height / 2);
    
    // Add pattern
    for(let i=0; i<50; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#b3b3b3' : '#e0e0e0';
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
    }

  }, []);

  const getMousePos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (window.TouchEvent && e instanceof TouchEvent) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    checkReveal();
  };

  const checkReveal = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Optimization: Check only every 10th pixel to save perf
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let transparentPixels = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4 * 10) {
      if (data[i + 3] === 0) {
        transparentPixels++;
      }
    }

    // Adjusted for the skipped pixels loop
    if (transparentPixels > (totalPixels / 10) * 0.4) { // 40% revealed
      setIsRevealed(true);
      onReveal();
      // Fully clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    // Prevent scrolling on mobile while scratching
    // e.preventDefault(); // React synthetic events might need passive listener handling for strict mode
    const { x, y } = getMousePos(e.nativeEvent);
    scratch(x, y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xl font-bold text-gray-700 animate-pulse">Scratch to reveal your prize!</h3>
      <div 
        ref={containerRef}
        className="relative w-80 h-48 rounded-xl shadow-xl overflow-hidden cursor-crosshair select-none"
      >
        {/* Underlying Prize Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-iocl-blue to-blue-800 flex flex-col items-center justify-center text-white p-4">
            <div className="bg-white/20 p-3 rounded-full mb-2">
                <Gift size={32} />
            </div>
            <h4 className="text-2xl font-bold text-center">{prize.label}</h4>
            <p className="text-sm opacity-80 mt-1">Visit your nearest station</p>
        </div>

        {/* Scratch Canvas Layer */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 transition-opacity duration-700 ${isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      
      {isRevealed && (
          <div className="text-green-600 font-bold flex items-center gap-2 mt-2">
              <Award size={20} />
              <span>Prize Revealed!</span>
          </div>
      )}
    </div>
  );
};

export default ScratchCard;