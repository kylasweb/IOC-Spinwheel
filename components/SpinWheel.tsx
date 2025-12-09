
import React, { useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Prize } from '../types';
import { ChevronDown, X, Gift, Percent, Droplet, Fuel, Star, Frown, Info } from 'lucide-react';

interface SpinWheelProps {
  prizes: Prize[];
  onSpinRequest: () => Promise<Prize>;
  onSpinComplete: (prize: Prize) => void;
}

const iconMap: Record<string, React.ElementType> = {
  'percent': Percent,
  'droplet': Droplet,
  'oil': Fuel, 
  'fuel': Fuel,
  'star': Star,
  'frown': Frown,
  'default': Gift
};

const SpinWheel: React.FC<SpinWheelProps> = ({ prizes, onSpinRequest, onSpinComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [previewPrize, setPreviewPrize] = useState<Prize | null>(null);
  const controls = useAnimation();
  
  const totalPrizes = prizes.length;
  const segmentAngle = 360 / totalPrizes;

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setPreviewPrize(null); // Close modal if open

    try {
        // 1. Request the result from the parent (Logic determines outcome based on odds)
        const resultPrize = await onSpinRequest();
        
        // Find the index of the result prize on the wheel
        const prizeIndex = prizes.findIndex(p => p.id === resultPrize.id);
        
        if (prizeIndex === -1) {
            console.error("Prize not found in wheel segments");
            setIsSpinning(false);
            return;
        }

        // 2. Calculate rotation to land on this specific prize
        // The center of the segment is at (index * segmentAngle) + (segmentAngle / 2)
        // To bring it to 0 (top), we rotate backwards by that amount.
        // We add full rotations (spinCount * 360) for effect.
        
        const spinCount = 5;
        const baseRotation = 360 * spinCount;
        
        // Target angle logic:
        // We want the wheel to end such that the winning segment is at the top (0 degrees).
        // If segment 0 is 0-60 deg. Center is 30. To bring 30 to 0, rotate -30 (or 330).
        // Formula: 360 - (segmentCenter)
        const segmentCenter = (prizeIndex * segmentAngle) + (segmentAngle / 2);
        const targetRotation = baseRotation + (360 - segmentCenter);

        await controls.start({
            rotate: targetRotation,
            transition: {
                duration: 4,
                ease: [0.15, 0.85, 0.35, 1], // Cubic bezier for realistic deceleration
            },
        });

        setTimeout(() => {
            setIsSpinning(false);
            onSpinComplete(resultPrize);
        }, 500);

    } catch (e) {
        console.error("Spin error", e);
        setIsSpinning(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || iconMap['default'];
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8 relative">
      
      {/* Detail Modal */}
      <AnimatePresence>
        {previewPrize && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewPrize(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setPreviewPrize(null)}
                className="absolute top-3 right-3 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-gray-700"
              >
                <X size={20} />
              </button>
              
              <div 
                className="h-24 flex items-center justify-center"
                style={{ backgroundColor: previewPrize.color }}
              >
                {React.createElement(getIconComponent(previewPrize.icon), { 
                  size: 40, 
                  className: previewPrize.textColor === '#ffffff' ? 'text-white' : 'text-gray-900' 
                })}
              </div>
              
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{previewPrize.label}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {previewPrize.description || "Spin to win this amazing prize!"}
                </p>
                <button 
                  onClick={() => setPreviewPrize(null)}
                  className="mt-6 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-80 h-80 sm:w-96 sm:h-96">
        {/* Pointer */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 text-iocl-orange drop-shadow-lg">
          <ChevronDown fill="currentColor" size={48} />
        </div>

        {/* Wheel Border */}
        <div className="absolute inset-0 rounded-full border-8 border-white shadow-2xl z-10 pointer-events-none"></div>
        <div className="absolute -inset-2 rounded-full border-4 border-iocl-orange z-0 shadow-lg"></div>

        {/* The Rotating Wheel */}
        <motion.div
          className="w-full h-full rounded-full overflow-hidden relative"
          animate={controls}
          initial={{ rotate: 0 }}
          style={{ transformOrigin: 'center' }}
        >
           {/* SVG Wheel Implementation for perfect geometry */}
           <svg
              viewBox="0 0 100 100"
              className="w-full h-full transform -rotate-90" // Start 0 at top
            >
              {prizes.map((prize, index) => {
                // Calculate path for arc
                const startAngle = (index * segmentAngle * Math.PI) / 180;
                const endAngle = ((index + 1) * segmentAngle * Math.PI) / 180;
                const x1 = 50 + 50 * Math.cos(startAngle);
                const y1 = 50 + 50 * Math.sin(startAngle);
                const x2 = 50 + 50 * Math.cos(endAngle);
                const y2 = 50 + 50 * Math.sin(endAngle);

                return (
                  <g 
                    key={prize.id} 
                    onClick={() => !isSpinning && setPreviewPrize(prize)}
                    className={`transition-opacity ${!isSpinning ? 'cursor-pointer hover:opacity-90' : ''}`}
                  >
                    <path
                      d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                      fill={prize.color}
                      stroke="white"
                      strokeWidth="0.5"
                    />
                    {/* Text placement */}
                    <text
                      x="50"
                      y="50"
                      fill={prize.textColor}
                      fontSize="4"
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      transform={`rotate(${(index * segmentAngle) + (segmentAngle / 2)}, 50, 50) translate(28, 0)`}
                      className="pointer-events-none select-none"
                    >
                      {prize.label}
                    </text>
                  </g>
                );
              })}
            </svg>
        </motion.div>

        {/* Center Cap */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-inner flex items-center justify-center z-10 border-4 border-gray-100">
           <div className="w-10 h-10 bg-iocl-blue rounded-full flex items-center justify-center text-white font-bold select-none">
             IOCL
           </div>
        </div>
      </div>

      <button
        onClick={handleSpin}
        disabled={isSpinning}
        className={`
          px-12 py-4 rounded-full text-xl font-bold uppercase tracking-wider shadow-lg transform transition-all select-none
          ${isSpinning 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-iocl-orange to-red-600 text-white hover:scale-105 active:scale-95 ring-4 ring-orange-200'}
        `}
      >
        {isSpinning ? 'Spinning...' : 'Spin Now'}
      </button>
      
      {!isSpinning && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Info size={16} />
          <span>Tap any prize segment for details!</span>
        </div>
      )}
    </div>
  );
};

export default SpinWheel;
