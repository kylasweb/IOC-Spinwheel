
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import SpinWheel from './components/SpinWheel';
import ScratchCard from './components/ScratchCard';
import AdminPanel from './components/AdminPanel';
import ClaimModal from './components/ClaimModal';
import RewardsHistoryModal from './components/RewardsHistoryModal';
import { GameState, Prize, UserProfile, GameConfig, WinRecord, PrizeCategory } from './types';
import { generateCongratulatoryMessage } from './services/geminiService';
import { Phone, Play, Repeat, CheckCheck, Loader2, Disc, Sparkles, AlertCircle, Copy, Ticket, Droplet, ShoppingBag, RotateCcw, Frown, Calendar, Gift } from 'lucide-react';

const DEFAULT_PRIZES: Prize[] = [
  { 
    id: '1', 
    label: '10% Cashback', 
    color: '#F37021', 
    textColor: '#ffffff', 
    icon: 'percent',
    category: PrizeCategory.GRAND,
    description: 'Enjoy 10% cashback on your next premium fuel purchase. Valid at all participating IndianOil outlets.' 
  },
  { 
    id: '2', 
    label: 'Free Car Wash', 
    color: '#0054A6', 
    textColor: '#ffffff', 
    icon: 'droplet',
    category: PrizeCategory.GRAND,
    description: 'Get a sparkling clean car with our complimentary car wash service. Redeemable on weekends.'
  },
  { 
    id: '3', 
    label: 'Servo Oil 1L', 
    color: '#FFCD00', 
    textColor: '#000000', 
    icon: 'oil',
    category: PrizeCategory.GRAND,
    description: 'Keep your engine running smoothly with a free 1L pack of Servo lubricant.'
  },
  { 
    id: '4', 
    label: 'Fuel Droplets', 
    color: '#009845', 
    textColor: '#ffffff', 
    icon: 'droplet',
    category: PrizeCategory.DROPLETS,
    description: 'Collect Fuel Droplets! 100 Droplets = 1 Litre of Free Fuel.'
  },
  { 
    id: '5', 
    label: 'Try Again', 
    color: '#666666', 
    textColor: '#ffffff', 
    icon: 'frown',
    category: PrizeCategory.TRY_AGAIN,
    description: 'Better luck next time! Don\'t worry, you can spin again tomorrow.'
  },
  { 
    id: '6', 
    label: '₹100 Fuel', 
    color: '#F37021', 
    textColor: '#ffffff', 
    icon: 'fuel',
    category: PrizeCategory.GRAND,
    description: 'Win a fuel voucher worth ₹100. Drive more, save more with IndianOil.'
  },
];

const App: React.FC = () => {
  // --- GLOBAL STATE ---
  const [gameState, setGameState] = useState<GameState>(GameState.WELCOME);
  const [prizes, setPrizes] = useState<Prize[]>(DEFAULT_PRIZES);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [config, setConfig] = useState<GameConfig>({
    maxRetries: 3,
    enableGame: true,
    dailyLimit: 1,
    odds: {
      grand: 12,
      tryAgain: 70, 
      droplets: 18
    }
  });

  // --- LOCAL SESSION STATE ---
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [currentWinId, setCurrentWinId] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Claim Logic State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
  const [showRedeemSection, setShowRedeemSection] = useState(false);
  
  // Scratch Card State
  const [scratchKey, setScratchKey] = useState(0);
  const winTimeoutRef = useRef<number | null>(null);

  // Form State
  const [mobile, setMobile] = useState(() => {
    const randomDigits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `98${randomDigits}`;
  });

  // Cleanup timeout on unmount or state change
  useEffect(() => {
    return () => {
      if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
    };
  }, []);

  // --- ACTIONS ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length < 10) return;

    if (!config.enableGame) {
      setErrorMsg("The contest is currently paused for maintenance. Please check back later.");
      return;
    }

    // Register User if new
    setUsers(prev => {
      if (!prev[mobile]) {
        return {
          ...prev,
          [mobile]: {
            mobile,
            attempts: 0,
            dropletsBalance: 0,
            history: [],
            lastLogin: new Date().toISOString()
          }
        };
      }
      return {
        ...prev,
        [mobile]: { ...prev[mobile], lastLogin: new Date().toISOString() }
      };
    });

    setGameState(GameState.DASHBOARD);
    setErrorMsg('');
  };

  const checkEligibility = () => {
    const user = users[mobile];
    if (!user) return false;
    
    if (user.attempts >= config.maxRetries) {
      setErrorMsg(`You have reached the maximum limit of ${config.maxRetries} attempts.`);
      return false;
    }
    return true;
  };

  /**
   * Core Logic for Fair Game & Odds
   * Returns a promise resolving to the winning prize object.
   */
  const calculateWinningPrize = async (): Promise<Prize> => {
    const random = Math.random() * 100;
    const { grand, tryAgain, droplets } = config.odds;
    
    let targetCategory: PrizeCategory;

    // Determine category based on odds
    if (random < grand) {
      targetCategory = PrizeCategory.GRAND;
    } else if (random < (grand + tryAgain)) {
      targetCategory = PrizeCategory.TRY_AGAIN;
    } else {
      targetCategory = PrizeCategory.DROPLETS;
    }

    // Filter prizes by category
    const categoryPrizes = prizes.filter(p => p.category === targetCategory);
    
    // Fallback: If no prizes in category, try droplets, then try again
    let finalPrize: Prize;
    if (categoryPrizes.length > 0) {
      const randomIndex = Math.floor(Math.random() * categoryPrizes.length);
      finalPrize = { ...categoryPrizes[randomIndex] }; // Clone to avoid mutation
    } else {
      // Fallback to any Try Again prize
      const fallbackPrizes = prizes.filter(p => p.category === PrizeCategory.TRY_AGAIN);
      if (fallbackPrizes.length > 0) {
        finalPrize = { ...fallbackPrizes[0] };
      } else {
        // Ultimate fallback
        finalPrize = { ...prizes[0] };
      }
    }

    // Process Droplets Logic (1-20) - Capped at 20
    if (finalPrize.category === PrizeCategory.DROPLETS) {
      const dropletsWon = Math.floor(Math.random() * 20) + 1;
      finalPrize.overrideValue = `${dropletsWon} Droplets`;
      finalPrize.value = dropletsWon.toString(); // Store numerical value in value field
      finalPrize.description = `You have collected ${dropletsWon} Fuel Droplets! Collect 100 to get 1 Litre Free Fuel.`;
    }

    return finalPrize;
  };

  const startSpinGame = () => {
    if (!checkEligibility()) return;
    setSelectedPrize(null);
    setRedemptionCode(null);
    setGameState(GameState.SPINNING);
    setErrorMsg('');
  };

  const startScratchGame = async () => {
    if (!checkEligibility()) return;
    setRedemptionCode(null);
    setErrorMsg('');
    setScratchKey(0);
    if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
    
    // Determine prize immediately for scratch card
    const prize = await calculateWinningPrize();
    setSelectedPrize(prize);
    setGameState(GameState.SCRATCHING);
  };

  const processWin = async (prize: Prize) => {
    const winId = Date.now().toString();
    setCurrentWinId(winId);

    const newWinRecord: WinRecord = {
      id: winId,
      prize: prize,
      wonAt: new Date().toISOString()
    };

    let dropletsToAdd = 0;
    if (prize.category === PrizeCategory.DROPLETS && prize.value) {
      dropletsToAdd = parseInt(prize.value);
    }

    // Update User Stats
    setUsers(prev => {
      const currentUser = prev[mobile];
      return {
        ...prev,
        [mobile]: {
          ...currentUser,
          attempts: currentUser.attempts + 1,
          dropletsBalance: currentUser.dropletsBalance + dropletsToAdd,
          history: [...currentUser.history, newWinRecord]
        }
      };
    });

    setGameState(GameState.RESULT);
    
    // Only generate AI message for actual wins
    if (prize.category !== PrizeCategory.TRY_AGAIN) {
      setIsLoadingAi(true);
      const displayLabel = prize.overrideValue || prize.label;
      const msg = await generateCongratulatoryMessage(displayLabel);
      setAiMessage(msg);
      setIsLoadingAi(false);
    } else {
      setAiMessage('');
    }
  };

  const handleSpinEnd = (prize: Prize) => {
    setSelectedPrize(prize);
    setTimeout(() => {
      processWin(prize);
    }, 1000);
  };

  const handleScratchReveal = () => {
    if (selectedPrize) {
      if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
      winTimeoutRef.current = setTimeout(() => {
        processWin(selectedPrize);
      }, 1500);
    }
  };

  const handleReloadScratch = () => {
    if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
    setScratchKey(prev => prev + 1);
  };

  const handleClaimClick = () => {
    setShowClaimModal(true);
  };

  const handleClaimSubmit = (data: { name: string; email: string; vehicleNumber: string }) => {
    const code = 'IOCL-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setRedemptionCode(code);
    
    // Update user with personal info and add code to history
    setUsers(prev => {
      const currentUser = prev[mobile];
      const updatedHistory = currentUser.history.map(record => {
        if (record.id === currentWinId) {
          return { ...record, claimCode: code };
        }
        return record;
      });

      return {
        ...prev,
        [mobile]: {
          ...currentUser,
          name: data.name,
          email: data.email,
          vehicleNumber: data.vehicleNumber,
          history: updatedHistory
        }
      };
    });

    setShowClaimModal(false);
  };

  const redeemDroplets = (cost: number, rewardName: string) => {
    if (users[mobile].dropletsBalance < cost) {
      alert(`Insufficient droplets! You need ${cost - users[mobile].dropletsBalance} more.`);
      return;
    }

    if(!window.confirm(`Redeem ${cost} Droplets for ${rewardName}?`)) return;

    setUsers(prev => {
      const user = prev[mobile];
      const redemptionRecord: WinRecord = {
        id: Date.now().toString(),
        prize: {
          id: 'redeem-' + Date.now(),
          label: rewardName,
          category: PrizeCategory.GRAND,
          color: '#009845',
          textColor: '#fff',
          icon: 'fuel',
          description: 'Redeemed via Fuel Droplets'
        },
        wonAt: new Date().toISOString(),
        claimCode: 'RED-' + Math.random().toString(36).substr(2, 6).toUpperCase()
      };

      return {
        ...prev,
        [mobile]: {
          ...user,
          dropletsBalance: user.dropletsBalance - cost,
          history: [...user.history, redemptionRecord]
        }
      };
    });

    alert(`Success! You redeemed ${rewardName}. Check your history for the code.`);
  };

  const resetGame = () => {
    setGameState(GameState.DASHBOARD);
    setSelectedPrize(null);
    setAiMessage('');
    setRedemptionCode(null);
    setCurrentWinId(null);
    if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
  };

  const logout = () => {
    setGameState(GameState.WELCOME);
    setSelectedPrize(null);
    setAiMessage('');
    setErrorMsg('');
    setRedemptionCode(null);
    setCurrentWinId(null);
    if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
    const randomDigits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    setMobile(`98${randomDigits}`);
  };

  // --- ADMIN HANDLERS ---
  const handleAdminUpdatePrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
  };

  const handleAdminUpdateConfig = (newConfig: GameConfig) => {
    setConfig(newConfig);
  };

  if (gameState === GameState.ADMIN) {
    return (
      <AdminPanel 
        prizes={prizes}
        users={users}
        config={config}
        onUpdatePrizes={handleAdminUpdatePrizes}
        onUpdateConfig={handleAdminUpdateConfig}
        onClose={() => setGameState(GameState.WELCOME)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header onAdminClick={() => setGameState(GameState.ADMIN)} />

      {showClaimModal && (
        <ClaimModal 
          onClose={() => setShowClaimModal(false)}
          onSubmit={handleClaimSubmit}
        />
      )}

      {showRewardsModal && users[mobile] && (
        <RewardsHistoryModal 
          history={users[mobile].history}
          onClose={() => setShowRewardsModal(false)}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* WELCOME SCREEN */}
        {gameState === GameState.WELCOME && (
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto border-t-4 border-iocl-orange">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
              <p className="text-gray-500">Enter your mobile number to access XtraRewards Games.</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="tel" 
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iocl-orange focus:border-iocl-orange outline-none transition-all"
                    placeholder="98765 43210"
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-iocl-blue hover:bg-blue-800 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <span>Login</span>
                <Play size={20} fill="currentColor" />
              </button>
            </form>
            
            <p className="text-xs text-center text-gray-400 mt-6">
              By continuing, you agree to the Terms & Conditions of the Indian Oil XtraRewards program.
            </p>
          </div>
        )}

        {/* DASHBOARD SCREEN */}
        {gameState === GameState.DASHBOARD && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Choose Your Game</h2>
              <p className="text-gray-500">Select a game to play and win exciting rewards!</p>
              
              {users[mobile] && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                    <span>Attempts: {users[mobile].attempts}/{config.maxRetries}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-iocl-yellow/10 text-iocl-orange rounded-lg font-bold">
                    <Droplet size={18} fill="currentColor" />
                    <span>Balance: {users[mobile].dropletsBalance} Droplets</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1">
                    <button 
                        onClick={() => setShowRedeemSection(!showRedeemSection)}
                        className="text-xs text-iocl-blue hover:text-iocl-orange transition-colors font-medium flex items-center gap-1"
                    >
                        <ShoppingBag size={14} />
                        {showRedeemSection ? 'Hide Rewards' : 'Redeem Droplets'}
                    </button>
                    <div className="w-px h-3 bg-gray-300"></div>
                    <button 
                        onClick={() => setShowRewardsModal(true)}
                        className="text-xs text-iocl-blue hover:text-iocl-orange transition-colors font-medium flex items-center gap-1"
                    >
                        <Gift size={14} />
                        My Winnings
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showRedeemSection && (
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6 animate-fade-in">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                   <ShoppingBag size={20} className="text-iocl-blue"/>
                   Redeem Your Droplets
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: '1 Litre Petrol', cost: 100, icon: 'fuel', desc: 'Get 1L Petrol Free' },
                    { name: '1 Litre Diesel', cost: 100, icon: 'fuel', desc: 'Get 1L Diesel Free' },
                    { name: 'XP95 Premium', cost: 110, icon: 'fuel', desc: '1L XP95 Premium Fuel' }
                  ].map((item) => (
                    <div key={item.name} className="border rounded-lg p-4 flex flex-col items-center text-center relative overflow-hidden group">
                      <div className="font-bold text-gray-800 z-10">{item.name}</div>
                      <p className="text-[10px] text-gray-500 mb-2 z-10">{item.desc}</p>
                      <div className="text-iocl-orange font-bold text-sm mb-3 z-10 bg-white/80 px-2 rounded-full border border-orange-100 flex items-center gap-1">
                        <Droplet size={12} fill="currentColor" />
                        {item.cost}
                      </div>
                      <button 
                        onClick={() => redeemDroplets(item.cost, item.name)}
                        disabled={users[mobile].dropletsBalance < item.cost}
                        className="text-xs w-full bg-gray-900 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors z-10"
                      >
                        Redeem
                      </button>
                      <div className="absolute -bottom-4 -right-4 text-gray-100 z-0 transform group-hover:scale-110 transition-transform">
                          <Droplet size={80} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle size={24} className="shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Spin Wheel Card */}
              <button 
                onClick={startSpinGame}
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-iocl-orange transition-all duration-300 p-8 flex flex-col items-center text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="bg-orange-50 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Disc size={64} className="text-iocl-orange" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Spin & Win</h3>
                <p className="text-gray-500">Spin the lucky wheel to unlock exclusive fuel vouchers and droplets.</p>
                <div className="mt-6 flex items-center text-iocl-blue font-semibold group-hover:gap-2 transition-all">
                  <span>Play Now</span>
                  <Play size={16} className="ml-1" />
                </div>
              </button>

              {/* Scratch Card Card */}
              <button 
                onClick={startScratchGame}
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-iocl-blue transition-all duration-300 p-8 flex flex-col items-center text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="bg-blue-50 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles size={64} className="text-iocl-blue" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Scratch Card</h3>
                <p className="text-gray-500">Scratch the digital card to reveal hidden Fuel Droplets instantly.</p>
                <div className="mt-6 flex items-center text-iocl-blue font-semibold group-hover:gap-2 transition-all">
                  <span>Play Now</span>
                  <Play size={16} className="ml-1" />
                </div>
              </button>
            </div>
            
            <div className="text-center mt-8">
              <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600 underline">
                Back to Login
              </button>
            </div>
          </div>
        )}

        {/* SPINNING SCREEN */}
        {gameState === GameState.SPINNING && (
          <div className="flex flex-col items-center animate-fade-in">
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 relative">
               <button 
                 onClick={() => setGameState(GameState.DASHBOARD)}
                 className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 font-medium text-sm flex items-center gap-1"
               >
                 ← Back
               </button>
               <h2 className="text-2xl font-bold text-center text-iocl-blue mb-4">Spin the Wheel!</h2>
               <SpinWheel 
                  prizes={prizes} 
                  onSpinRequest={calculateWinningPrize} 
                  onSpinComplete={handleSpinEnd} 
               />
             </div>
          </div>
        )}

        {/* SCRATCHING SCREEN */}
        {gameState === GameState.SCRATCHING && selectedPrize && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border-2 border-iocl-yellow max-w-lg w-full flex flex-col items-center relative">
              <button 
                 onClick={() => setGameState(GameState.DASHBOARD)}
                 className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 font-medium text-sm flex items-center gap-1"
               >
                 ← Back
               </button>
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Scratch & Win!</h2>
              <ScratchCard 
                key={scratchKey}
                prize={selectedPrize} 
                onReveal={handleScratchReveal} 
              />
              <div className="flex flex-col items-center gap-4 mt-6 w-full">
                  <p className="text-sm text-gray-400 text-center">Use your mouse or finger to scratch off the silver area.</p>
                  <button 
                    onClick={handleReloadScratch}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                      <RotateCcw size={14} />
                      Reload Card
                  </button>
              </div>
            </div>
          </div>
        )}

        {/* RESULT SCREEN */}
        {gameState === GameState.RESULT && selectedPrize && (
          <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 animate-fade-in-up">
             
             {redemptionCode ? (
               // TICKET VIEW
               <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                 <div className="relative z-10 text-center space-y-6">
                    <div className="bg-white/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center border border-white/20">
                      <Ticket size={40} className="text-iocl-yellow" />
                    </div>
                    
                    <div>
                      <h2 className="text-2xl font-bold tracking-wide">REDEMPTION TICKET</h2>
                      <p className="text-gray-400 text-sm mt-1">Show this code at the station</p>
                    </div>

                    <div className="bg-white text-gray-900 rounded-xl p-6 shadow-inner border-2 border-dashed border-gray-300 relative group cursor-pointer" onClick={() => navigator.clipboard.writeText(redemptionCode)}>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Your Code</p>
                      <h3 className="text-3xl font-mono font-bold text-iocl-blue tracking-wider">{redemptionCode}</h3>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Copy size={16} className="text-gray-400" />
                      </div>
                    </div>

                    <div className="text-left space-y-2 text-sm text-gray-300 bg-white/5 p-4 rounded-lg">
                       <div className="flex justify-between">
                         <span>Prize:</span>
                         <span className="font-bold text-white">{selectedPrize.overrideValue || selectedPrize.label}</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Name:</span>
                         <span className="text-white">{users[mobile]?.name || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Mobile:</span>
                         <span className="text-white">{mobile}</span>
                       </div>
                    </div>

                    <button 
                      onClick={resetGame}
                      className="w-full bg-iocl-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Repeat size={18} />
                      <span>Play Another Game</span>
                    </button>
                 </div>
               </div>
             ) : (
               // DEFAULT OR TRY AGAIN VIEW
               selectedPrize.category === PrizeCategory.TRY_AGAIN ? (
                 // TRY AGAIN VIEW
                 <>
                   <div className="bg-gray-200 p-8 text-center text-gray-800 relative overflow-hidden">
                      <h2 className="text-3xl font-bold mb-2">Better Luck Next Time!</h2>
                      <p className="text-gray-500">Don't lose hope, you can always try again.</p>
                   </div>
                   
                   <div className="p-8 text-center space-y-6">
                      <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
                        <Frown size={48} className="text-gray-400" />
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          {selectedPrize.label}
                        </h3>
                        <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto">{selectedPrize.description}</p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-center gap-2 text-iocl-blue">
                        <Calendar size={18} />
                        <span className="font-medium">Next Attempt: Tomorrow</span>
                      </div>

                      <button 
                        onClick={resetGame}
                        className="w-full bg-iocl-blue text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <Repeat size={18} />
                        <span>Back to Dashboard</span>
                      </button>
                   </div>
                 </>
               ) : (
                 // CONGRATULATIONS VIEW
                 <>
                  <div className="bg-gradient-to-r from-iocl-orange to-red-500 p-8 text-center text-white relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                      <h2 className="text-4xl font-black mb-2 tracking-tight">CONGRATULATIONS!</h2>
                      <div className="text-xl font-medium opacity-90">You have won</div>
                  </div>
                  
                  <div className="p-8 text-center space-y-6">
                      <div className="w-24 h-24 mx-auto bg-iocl-yellow rounded-full flex items-center justify-center shadow-inner">
                        <span className="text-4xl">
                          {selectedPrize.category === PrizeCategory.DROPLETS ? '💧' : '🎁'}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-3xl font-bold text-gray-800 mb-2">
                          {selectedPrize.overrideValue || selectedPrize.label}
                        </h3>
                        <div className="h-1 w-20 bg-gray-200 mx-auto rounded-full"></div>
                        <p className="text-gray-500 mt-4 text-sm">{selectedPrize.description}</p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-left">
                        <div className="flex gap-3">
                          <div className="mt-1">
                              {isLoadingAi ? (
                                <Loader2 className="animate-spin text-iocl-blue" size={20}/>
                              ) : (
                                <div className="bg-iocl-blue p-1 rounded-full">
                                  <CheckCheck size={14} className="text-white" />
                                </div>
                              )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-iocl-blue mb-1">Message from Indian Oil:</p>
                            <p className="text-gray-700 text-sm italic">
                              {isLoadingAi ? "Generating your personalized message..." : `"${aiMessage}"`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {selectedPrize.category !== PrizeCategory.DROPLETS && (
                          <button 
                              onClick={handleClaimClick}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
                          >
                              Claim Prize
                          </button>
                        )}
                        
                        <button 
                          onClick={resetGame}
                          className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Repeat size={18} />
                          <span>Play Another Game</span>
                        </button>
                      </div>
                  </div>
                 </>
               )
             )}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
