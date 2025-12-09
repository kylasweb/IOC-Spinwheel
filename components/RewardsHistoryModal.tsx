
import React from 'react';
import { X, Calendar, Gift, Copy, Ticket, Droplet, CheckCircle2 } from 'lucide-react';
import { WinRecord, PrizeCategory } from '../types';

interface RewardsHistoryModalProps {
  history: WinRecord[];
  onClose: () => void;
}

const RewardsHistoryModal: React.FC<RewardsHistoryModalProps> = ({ history, onClose }) => {
  // Filter out Try Again attempts, only show actual winnings
  // Sort by date descending (newest first)
  const winnings = history
    .filter(r => r.prize.category !== PrizeCategory.TRY_AGAIN)
    .sort((a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[80vh]">
        <div className="bg-iocl-blue px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="text-white text-lg font-bold flex items-center gap-2">
            <Gift size={20} />
            My Rewards History
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {winnings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Gift size={48} className="mx-auto mb-4 text-gray-300" />
              <p>You haven't won any rewards yet.</p>
              <p className="text-sm">Play the Spin Wheel or Scratch Card to win!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {winnings.map((record) => (
                <div key={record.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: record.prize.color + '20' }}>
                        <span role="img" aria-label="prize">
                          {record.prize.category === PrizeCategory.DROPLETS ? <Droplet size={20} className="text-iocl-green" color={record.prize.color} /> : <Gift size={20} color={record.prize.color} />}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{record.prize.overrideValue || record.prize.label}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(record.wonAt).toLocaleDateString()} at {new Date(record.wonAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  </div>

                  {record.claimCode ? (
                    <div className="bg-white border border-dashed border-gray-300 rounded-lg p-3 flex justify-between items-center">
                       <div className="overflow-hidden">
                         <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Redemption Code</p>
                         <p className="font-mono font-bold text-iocl-blue text-lg truncate">{record.claimCode}</p>
                       </div>
                       <button 
                        onClick={() => navigator.clipboard.writeText(record.claimCode!)}
                        className="p-2 text-gray-400 hover:text-iocl-blue transition-colors shrink-0"
                        title="Copy Code"
                       >
                         <Copy size={16} />
                       </button>
                    </div>
                  ) : (
                    record.prize.category !== PrizeCategory.DROPLETS && (
                        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg flex items-center gap-2">
                            <Ticket size={14}/>
                            <span>Not claimed.</span>
                        </div>
                    )
                  )}
                  
                  {record.prize.category === PrizeCategory.DROPLETS && (
                       <div className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg flex items-center gap-2">
                           <CheckCircle2 size={14} />
                           Added to Droplets balance.
                       </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
             <button onClick={onClose} className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors">
                 Close
             </button>
        </div>
      </div>
    </div>
  );
};

export default RewardsHistoryModal;
