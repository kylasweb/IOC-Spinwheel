import React from 'react';
import { Fuel, Menu, Lock } from 'lucide-react';

interface HeaderProps {
  onAdminClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAdminClick }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Simulated Logo using text and icon since we don't have the SVG asset */}
          <div className="bg-iocl-orange p-1.5 rounded-full">
            <Fuel className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-iocl-blue font-extrabold text-xl tracking-tight leading-none">
              IndianOil
            </h1>
            <span className="text-xs text-iocl-orange font-bold tracking-widest uppercase">
              XtraRewards
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {onAdminClick && (
                <button onClick={onAdminClick} className="p-2 text-gray-300 hover:text-gray-500 transition-colors" title="Admin Access">
                    <Lock size={16} />
                </button>
            )}
            <button className="text-gray-600 hover:text-iocl-blue transition-colors">
            <Menu className="w-6 h-6" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;