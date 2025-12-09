
import React, { useState } from 'react';
import { User, Mail, Car, X, CheckCircle2 } from 'lucide-react';

interface ClaimFormData {
  name: string;
  email: string;
  vehicleNumber: string;
}

interface ClaimModalProps {
  onClose: () => void;
  onSubmit: (data: ClaimFormData) => void;
}

const ClaimModal: React.FC<ClaimModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ClaimFormData>({
    name: '',
    email: '',
    vehicleNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-iocl-blue px-6 py-4 flex justify-between items-center">
          <h3 className="text-white text-lg font-bold">Claim Your Reward</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-gray-600 text-sm mb-4">
            Please provide your details to generate your unique redemption code.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iocl-orange focus:border-iocl-orange outline-none"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iocl-orange focus:border-iocl-orange outline-none"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iocl-orange focus:border-iocl-orange outline-none"
                placeholder="DL 01 AB 1234"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-gradient-to-r from-iocl-orange to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Generate Code</span>
            <CheckCircle2 size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClaimModal;
