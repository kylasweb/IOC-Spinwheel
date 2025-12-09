
import React, { useState, useRef } from 'react';
import { Prize, UserProfile, GameConfig, PrizeCategory } from '../types';
import { 
  Upload, Trash2, Plus, Save, Users, Gift, Settings, 
  FileSpreadsheet, PieChart, Droplet
} from 'lucide-react';

interface AdminPanelProps {
  prizes: Prize[];
  users: Record<string, UserProfile>;
  config: GameConfig;
  onUpdatePrizes: (prizes: Prize[]) => void;
  onUpdateConfig: (config: GameConfig) => void;
  onClose: () => void;
}

// Helper to access global XLSX
declare global {
  interface Window {
    XLSX: any;
  }
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  prizes, 
  users, 
  config, 
  onUpdatePrizes, 
  onUpdateConfig,
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'users' | 'settings' | 'odds'>('rewards');
  const [localPrizes, setLocalPrizes] = useState<Prize[]>(prizes);
  const [localConfig, setLocalConfig] = useState<GameConfig>(config);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- REWARD LOGIC ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (evt) => {
      const data = evt.target?.result;
      
      try {
        let newPrizes: Prize[] = [];

        if (file.name.endsWith('.csv')) {
          // Simple CSV Parser
          const text = data as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',');
            const prize: any = { id: Date.now().toString() + i, category: PrizeCategory.TRY_AGAIN };
            
            headers.forEach((h, index) => {
              if (h === 'label') prize.label = values[index]?.trim();
              if (h === 'color') prize.color = values[index]?.trim();
              if (h === 'textcolor') prize.textColor = values[index]?.trim();
              if (h === 'icon') prize.icon = values[index]?.trim();
              if (h === 'description') prize.description = values[index]?.trim();
              if (h === 'category') prize.category = values[index]?.trim();
            });

            if (prize.label) newPrizes.push(prize as Prize);
          }

        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Excel Parser using SheetJS
          if (window.XLSX) {
            const workbook = window.XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = window.XLSX.utils.sheet_to_json(worksheet);
            
            newPrizes = json.map((row: any, i: number) => ({
              id: Date.now().toString() + i,
              label: row.Label || row.label || 'Prize',
              color: row.Color || row.color || '#F37021',
              textColor: row.TextColor || row.textColor || '#ffffff',
              icon: row.Icon || row.icon || 'gift',
              description: row.Description || row.description || '',
              category: row.Category || PrizeCategory.TRY_AGAIN
            }));
          } else {
            alert("XLSX library not loaded. Please refresh.");
            return;
          }
        }

        if (newPrizes.length > 0) {
          setLocalPrizes([...localPrizes, ...newPrizes]);
          alert(`Successfully imported ${newPrizes.length} prizes.`);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse file.");
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const removePrize = (id: string) => {
    setLocalPrizes(localPrizes.filter(p => p.id !== id));
  };

  const addNewPrize = () => {
    const newPrize: Prize = {
      id: Date.now().toString(),
      label: 'New Prize',
      color: '#0054A6',
      textColor: '#ffffff',
      icon: 'gift',
      description: 'Prize description goes here.',
      category: PrizeCategory.TRY_AGAIN
    };
    setLocalPrizes([...localPrizes, newPrize]);
  };

  const updatePrizeField = (id: string, field: keyof Prize, value: string) => {
    setLocalPrizes(localPrizes.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const saveRewards = () => {
    onUpdatePrizes(localPrizes);
    alert("Rewards updated successfully!");
  };

  // --- SETTINGS LOGIC ---
  
  const saveConfig = () => {
    const totalOdds = localConfig.odds.grand + localConfig.odds.tryAgain + localConfig.odds.droplets;
    if (totalOdds !== 100) {
        alert(`Error: Odds must sum to 100%. Current sum: ${totalOdds}%`);
        return;
    }
    onUpdateConfig(localConfig);
    alert("Configuration saved!");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Manage Indian Oil XtraRewards Campaign</p>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Exit Admin
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* SIDEBAR */}
          <div className="col-span-3 bg-white rounded-xl shadow-md p-4 h-fit">
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('rewards')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'rewards' ? 'bg-iocl-orange text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Gift size={20} />
                <span className="font-semibold">Rewards</span>
              </button>
              <button 
                onClick={() => setActiveTab('odds')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'odds' ? 'bg-iocl-orange text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <PieChart size={20} />
                <span className="font-semibold">Odds Management</span>
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-iocl-orange text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Users size={20} />
                <span className="font-semibold">User Management</span>
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-iocl-orange text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Settings size={20} />
                <span className="font-semibold">Settings</span>
              </button>
            </nav>
          </div>

          {/* MAIN CONTENT */}
          <div className="col-span-9 bg-white rounded-xl shadow-md p-6">
            
            {/* REWARDS TAB */}
            {activeTab === 'rewards' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Prize Configuration</h2>
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      accept=".csv, .xlsx, .xls"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <FileSpreadsheet size={16} />
                      Import CSV/Excel
                    </button>
                    <button 
                      onClick={addNewPrize}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Plus size={16} />
                      Add Prize
                    </button>
                    <button 
                      onClick={saveRewards}
                      className="flex items-center gap-2 px-3 py-2 bg-iocl-orange text-white rounded-lg hover:bg-orange-600 text-sm"
                    >
                      <Save size={16} />
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3">Label</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Color</th>
                        <th className="px-4 py-3">Icon</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localPrizes.map((prize) => (
                        <tr key={prize.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input 
                              value={prize.label}
                              onChange={(e) => updatePrizeField(prize.id, 'label', e.target.value)}
                              className="bg-transparent border-b border-transparent focus:border-iocl-blue outline-none w-full"
                            />
                            <input 
                              value={prize.description || ''}
                              onChange={(e) => updatePrizeField(prize.id, 'description', e.target.value)}
                              className="bg-transparent text-xs text-gray-500 mt-1 w-full"
                              placeholder="Description..."
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select 
                                value={prize.category || PrizeCategory.TRY_AGAIN}
                                onChange={(e) => updatePrizeField(prize.id, 'category', e.target.value)}
                                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                            >
                                <option value={PrizeCategory.GRAND}>Grand Prize</option>
                                <option value={PrizeCategory.DROPLETS}>Fuel Droplets</option>
                                <option value={PrizeCategory.TRY_AGAIN}>Try Again</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: prize.color }}></div>
                            <input 
                              value={prize.color}
                              onChange={(e) => updatePrizeField(prize.id, 'color', e.target.value)}
                              className="bg-transparent border-b border-transparent focus:border-iocl-blue outline-none w-16 font-mono text-xs"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              value={prize.icon}
                              onChange={(e) => updatePrizeField(prize.id, 'icon', e.target.value)}
                              className="bg-transparent border-b border-transparent focus:border-iocl-blue outline-none w-16"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => removePrize(prize.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ODDS TAB */}
            {activeTab === 'odds' && (
              <div className="space-y-8 max-w-xl">
                 <h2 className="text-xl font-bold text-gray-800">Odds Configuration</h2>
                 <p className="text-gray-500 text-sm">Configure the winning probability for each prize category. Total must equal 100%.</p>

                 <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="font-bold text-gray-700">Grand Prize</label>
                            <span className="text-blue-600 font-bold">{localConfig.odds.grand}%</span>
                        </div>
                        <input 
                           type="range" min="0" max="100" 
                           value={localConfig.odds.grand}
                           onChange={(e) => setLocalConfig({...localConfig, odds: {...localConfig.odds, grand: parseInt(e.target.value)}})}
                           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-xs text-gray-500 mt-1">Probability of winning High Value items (Fuel Vouchers, Oil).</p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="font-bold text-gray-700">Fuel Droplets</label>
                            <span className="text-green-600 font-bold">{localConfig.odds.droplets}%</span>
                        </div>
                        <input 
                           type="range" min="0" max="100" 
                           value={localConfig.odds.droplets}
                           onChange={(e) => setLocalConfig({...localConfig, odds: {...localConfig.odds, droplets: parseInt(e.target.value)}})}
                           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                        <p className="text-xs text-gray-500 mt-1">Probability of winning 1-98 Fuel Droplets.</p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="font-bold text-gray-700">Try Again / Low Value</label>
                            <span className="text-gray-600 font-bold">{localConfig.odds.tryAgain}%</span>
                        </div>
                        <input 
                           type="range" min="0" max="100" 
                           value={localConfig.odds.tryAgain}
                           onChange={(e) => setLocalConfig({...localConfig, odds: {...localConfig.odds, tryAgain: parseInt(e.target.value)}})}
                           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Probability of "Try Again".</p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-100 flex justify-between items-center font-bold">
                        <span>Total:</span>
                        <span className={localConfig.odds.grand + localConfig.odds.droplets + localConfig.odds.tryAgain === 100 ? "text-green-600" : "text-red-600"}>
                            {localConfig.odds.grand + localConfig.odds.droplets + localConfig.odds.tryAgain}%
                        </span>
                    </div>

                    <button 
                        onClick={saveConfig}
                        className="w-full py-3 bg-iocl-blue text-white font-bold rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        Update Odds
                    </button>
                 </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Total Users: {Object.keys(users).length}
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3">User Details</th>
                        <th className="px-6 py-3">Stats</th>
                        <th className="px-6 py-3">Win History & Codes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.values(users).map((user: UserProfile) => (
                        <tr key={user.mobile} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{user.mobile}</div>
                            {user.name && <div className="text-xs text-gray-500">{user.name}</div>}
                            {user.email && <div className="text-xs text-gray-400">{user.email}</div>}
                            {user.vehicleNumber && <div className="text-xs text-blue-600 font-mono mt-1">{user.vehicleNumber}</div>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-block w-fit px-2 py-1 rounded text-xs font-bold ${user.attempts >= config.maxRetries ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {user.attempts} / {config.maxRetries} Tries
                              </span>
                              <span className="text-xs font-bold text-iocl-orange flex items-center gap-1">
                                <Droplet size={10} fill="currentColor" />
                                {user.dropletsBalance} Droplets
                              </span>
                              <span className="text-xs text-gray-400">{new Date(user.lastLogin).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              {user.history.map((record, i) => (
                                <div key={i} className="bg-gray-50 p-2 rounded border border-gray-100 flex justify-between items-center gap-4">
                                  <span className="font-medium text-gray-700">{record.prize.overrideValue || record.prize.label}</span>
                                  {record.claimCode ? (
                                    <code className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-mono border border-green-200">
                                      {record.claimCode}
                                    </code>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">Not Claimed</span>
                                  )}
                                </div>
                              ))}
                              {user.history.length === 0 && <span className="text-gray-400 text-xs">-</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {Object.keys(users).length === 0 && (
                     <div className="text-center py-12 text-gray-400">No user data available yet.</div>
                  )}
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-8 max-w-lg">
                <h2 className="text-xl font-bold text-gray-800">Game Logic Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Retries Per User</label>
                    <input 
                      type="number" 
                      min="1"
                      value={localConfig.maxRetries}
                      onChange={(e) => setLocalConfig({...localConfig, maxRetries: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iocl-orange outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Limit</label>
                    <input 
                      type="number" 
                      min="1"
                      value={localConfig.dailyLimit}
                      onChange={(e) => setLocalConfig({...localConfig, dailyLimit: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iocl-orange outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-900">Enable Game Access</h4>
                      <p className="text-xs text-gray-500">Turn off to show maintenance mode.</p>
                    </div>
                    <button 
                      onClick={() => setLocalConfig({...localConfig, enableGame: !localConfig.enableGame})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localConfig.enableGame ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localConfig.enableGame ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <button 
                    onClick={saveConfig}
                    className="w-full py-3 bg-iocl-blue text-white font-bold rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Update Settings
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
