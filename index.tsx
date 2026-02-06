
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Pickaxe, 
  TrendingUp, 
  TrendingDown,
  Zap, 
  ShoppingBag, 
  Cpu, 
  Database, 
  Rocket,
  LogOut, 
  Binary,
  BarChart3,
  Microchip,
  Globe,
  Target,
  ShieldCheck,
  Edit3,
  X,
  RefreshCw,
  Terminal,
  Code2,
  Cloud,
  Link2,
  AlertTriangle,
  Trash2,
  Sparkles,
  FlaskConical,
  Package
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// --- Types ---
interface ResourceState {
  iron: number;
  plasma: number;
  crystal: number;
  dataBits: number;
}

interface TechState {
  marketAI: number;
  taxOptimization: number;
  nanoStorage: number;
  neuralMining: number;
}

interface MarketState {
  [key: string]: { 
    price: number; 
    trend: 'up' | 'down' | 'stable'; 
    demand: number;
  };
}

interface GameState {
  credits: number;
  resources: ResourceState;
  upgrades: {
    pickaxePower: number;
    autoMiners: number;
    plasmaExtractors: number;
    crystalRefineries: number;
    researchHubs: number;
    storageLevel: number;
  };
  technologies: TechState;
  market: MarketState;
  lastUpdate: number;
}

interface UserData {
  id: string;
  password: string;
  role: 'user' | 'admin';
  gameState: GameState;
}

// --- Constants ---
const BASE_MARKET_PRICES = { iron: 2, plasma: 15, crystal: 50 };
const MARKET_TAX_BASE = 0.20;

const INITIAL_GAME_STATE: GameState = {
  credits: 100,
  resources: { iron: 0, plasma: 0, crystal: 0, dataBits: 0 },
  upgrades: {
    pickaxePower: 1,
    autoMiners: 0,
    plasmaExtractors: 0,
    crystalRefineries: 0,
    researchHubs: 0,
    storageLevel: 1
  },
  technologies: {
    marketAI: 0,
    taxOptimization: 0,
    nanoStorage: 0,
    neuralMining: 0
  },
  market: {
    iron: { price: 2, trend: 'stable', demand: 50 },
    plasma: { price: 15, trend: 'stable', demand: 30 },
    crystal: { price: 50, trend: 'stable', demand: 10 }
  },
  lastUpdate: Date.now()
};

// --- Supabase Configuration ---
const SUPABASE_URL = (process.env as any).SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (process.env as any).SUPABASE_ANON_KEY || '';

const isConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';
const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const NebulaAPI = {
  getUsers: async (): Promise<Record<string, UserData>> => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    const record: Record<string, UserData> = {};
    data?.forEach(u => {
      record[u.id] = {
        id: u.id,
        password: u.password,
        role: u.role,
        gameState: u.game_state
      };
    });
    return record;
  },

  saveUser: async (user: UserData) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      password: user.password,
      role: user.role,
      game_state: user.gameState
    });
    if (error) throw error;
    return { status: 'success' };
  },

  updateGameState: async (userId: string, state: GameState) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('users')
      .update({ game_state: state })
      .eq('id', userId);
    if (error) console.error("Sync failure:", error);
  },

  adminDeleteUser: async (userId: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
  }
};

// --- Admin Panel ---
const AdminPanel = () => {
  const [users, setUsers] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(false);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await NebulaAPI.getUsers();
      setUsers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refreshUsers(); }, [refreshUsers]);

  const handleDelete = async (id: string) => {
    if (confirm(`Terminate access for ${id}?`)) {
      setLoading(true);
      try { await NebulaAPI.adminDeleteUser(id); refreshUsers(); }
      catch (e) { alert("Action failed"); setLoading(false); }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-4 bg-indigo-950/20 border border-indigo-500/20 p-6 rounded-3xl">
        <ShieldCheck className="text-indigo-400" size={32} />
        <div>
          <h2 className="orbitron text-lg font-black text-white uppercase tracking-tighter">Command Center</h2>
          <p className="text-[10px] font-mono text-indigo-500/60">Cloud Node Oversight Active</p>
        </div>
      </div>

      <div className="glass border-white/5 rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-white/5 text-[10px] uppercase font-black tracking-widest text-slate-500">
              <th className="px-6 py-4">Pilot</th>
              <th className="px-6 py-4">Credits</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Object.values(users).map((u: UserData) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-slate-200">{u.id}</span>
                </td>
                <td className="px-6 py-4 orbitron text-xs text-yellow-400">
                  {Math.floor(u.gameState.credits).toLocaleString()} CR
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-500 hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-10 text-center animate-pulse orbitron text-[10px] text-indigo-500 uppercase">Updating Cloud State...</div>}
      </div>
    </div>
  );
};

// --- Auth Screen ---
const AuthScreen = ({ onLogin }: { onLogin: (user: UserData) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const users = await NebulaAPI.getUsers();
      
      if (userId === 'admin' && password === 'admin' && !users['admin']) {
        const adminUser: UserData = { id: 'admin', password: 'admin', role: 'admin', gameState: INITIAL_GAME_STATE };
        await NebulaAPI.saveUser(adminUser);
        onLogin(adminUser);
        return;
      }

      if (isRegister) {
        if (users[userId]) {
          setError('Pilot ID already registered.');
        } else {
          const newUser: UserData = { id: userId, password, role: 'user', gameState: INITIAL_GAME_STATE };
          await NebulaAPI.saveUser(newUser);
          onLogin(newUser);
        }
      } else {
        const u = users[userId];
        if (u && u.password === password) {
          onLogin(u);
        } else {
          setError('Invalid Identification Credentials.');
        }
      }
    } catch (e: any) {
      setError(isConfigured ? (e.message || 'Database link error.') : 'Supabase is not configured in Vercel settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-black to-black">
      <div className="max-w-md w-full glass rounded-[2rem] p-10 border border-indigo-500/20 shadow-2xl">
        <div className="text-center mb-8">
          <Globe className="text-indigo-400 w-16 h-16 mx-auto mb-6 animate-pulse" />
          <h1 className="orbitron text-2xl font-black text-white uppercase italic tracking-tighter">Nebula <span className="text-indigo-500">Cloud</span></h1>
          <p className="text-slate-500 text-[9px] font-mono mt-2 uppercase tracking-widest">Distributed Database Persistence</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="text" placeholder="Pilot ID" value={userId} onChange={e => setUserId(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-indigo-50 focus:border-indigo-500 outline-none transition-all font-mono text-sm" />
          <input required type="password" placeholder="Access Key" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-indigo-50 focus:border-indigo-500 outline-none transition-all font-mono text-sm" />
          {error && <div className="p-3 bg-red-500/10 text-red-400 text-[10px] font-mono border border-red-500/20 rounded-lg">{error}</div>}
          <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-black orbitron text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-600/20">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : (isRegister ? 'INITIATE NODE' : 'ESTABLISH LINK')}
          </button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-6 text-slate-500 text-[10px] hover:text-indigo-400 font-mono uppercase tracking-widest">
          {isRegister ? '> Return to Login' : '> Register new Pilot Node'}
        </button>
      </div>
    </div>
  );
};

// --- Main App ---
const App = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [activeTab, setActiveTab] = useState<'mine' | 'shop' | 'tech' | 'market' | 'admin'>('mine');
  const [aiAdvice, setAiAdvice] = useState<string>("Analyzing market trends...");
  const [syncing, setSyncing] = useState(false);

  // Gemini Integration
  const fetchAiAdvice = async () => {
    try {
      // Correctly initialize GoogleGenAI with API key from environment
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Act as an elite galactic trader AI. Given the following game state:
      Credits: ${gameState.credits}
      Resources: ${JSON.stringify(gameState.resources)}
      Upgrades: ${JSON.stringify(gameState.upgrades)}
      Market: ${JSON.stringify(gameState.market)}
      Give a short, 1-sentence strategic advice for the player in a cool, sci-fi tone. Focus on what they should do next to grow fastest.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      // Extract text from GenerateContentResponse
      setAiAdvice(response.text || "Scanning sector for opportunities...");
    } catch (e) {
      setAiAdvice("Nebula link unstable. Strategic analysis offline.");
    }
  };

  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(fetchAiAdvice, 30000);
      fetchAiAdvice();
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Sync with Supabase
  useEffect(() => {
    if (currentUser) {
      const syncTimeout = setTimeout(async () => {
        setSyncing(true);
        await NebulaAPI.updateGameState(currentUser.id, gameState);
        setSyncing(false);
      }, 3000); 
      return () => clearTimeout(syncTimeout);
    }
  }, [gameState, currentUser]);

  const taxRate = useMemo(() => 
    Math.max(0.05, MARKET_TAX_BASE - (gameState.technologies.taxOptimization * 0.03)), 
    [gameState.technologies.taxOptimization]
  );

  const currentStorageLimit = useMemo(() => 
    Math.floor((gameState.upgrades.storageLevel * 1000) * (1 + (gameState.technologies.nanoStorage * 0.5))),
    [gameState.upgrades.storageLevel, gameState.technologies.nanoStorage]
  );

  // Passive Generation
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      setGameState(prev => {
        const now = Date.now();
        const delta = (now - prev.lastUpdate) / 1000;
        
        // Passive mining rates
        const ironRate = prev.upgrades.autoMiners * 1;
        const plasmaRate = prev.upgrades.plasmaExtractors * 0.5;
        const crystalRate = prev.upgrades.crystalRefineries * 0.1;
        const dataRate = prev.upgrades.researchHubs * 0.2;

        return {
          ...prev,
          resources: {
            iron: Math.min(currentStorageLimit, prev.resources.iron + (ironRate * delta)),
            plasma: Math.min(currentStorageLimit, prev.resources.plasma + (plasmaRate * delta)),
            crystal: Math.min(currentStorageLimit, prev.resources.crystal + (crystalRate * delta)),
            dataBits: prev.resources.dataBits + (dataRate * delta)
          },
          lastUpdate: now
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser, currentStorageLimit]);

  // Market Fluctuation
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      setGameState(prev => {
        const newMarket = { ...prev.market };
        Object.keys(newMarket).forEach(key => {
          const m = newMarket[key];
          const change = (Math.random() - 0.45) * 2;
          m.price = Math.max(1, m.price + change);
          m.trend = change > 0 ? 'up' : 'down';
        });
        return { ...prev, market: newMarket };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const mineManual = () => {
    setGameState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        iron: Math.min(currentStorageLimit, prev.resources.iron + prev.upgrades.pickaxePower)
      }
    }));
  };

  const sellResource = (res: keyof ResourceState) => {
    const amount = gameState.resources[res];
    if (amount <= 0) return;
    const price = (gameState.market[res]?.price || 1) * (1 - taxRate);
    const earnings = amount * price;

    setGameState(prev => ({
      ...prev,
      credits: prev.credits + earnings,
      resources: { ...prev.resources, [res]: 0 }
    }));
  };

  const buyUpgrade = (key: keyof GameState['upgrades'], cost: number) => {
    if (gameState.credits < cost) return;
    setGameState(prev => ({
      ...prev,
      credits: prev.credits - cost,
      upgrades: { ...prev.upgrades, [key]: prev.upgrades[key] + 1 }
    }));
  };

  const buyTech = (key: keyof TechState, cost: number) => {
    if (gameState.resources.dataBits < cost) return;
    setGameState(prev => ({
      ...prev,
      resources: { ...prev.resources, dataBits: prev.resources.dataBits - cost },
      technologies: { ...prev.technologies, [key]: prev.technologies[key] + 1 }
    }));
  };

  if (!currentUser) return <AuthScreen onLogin={u => { setCurrentUser(u); setGameState(u.gameState); }} />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <header className="glass rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-indigo-500/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
          <div className="flex items-center gap-6">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform duration-500">
              <Cloud className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="orbitron text-2xl font-black text-white italic tracking-tighter">Nebula <span className="text-indigo-400">Cloud</span></h1>
              <div className="flex items-center gap-3 mt-1">
                 <span className="text-[9px] font-mono text-slate-500 tracking-widest flex items-center gap-2">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> SUPABASE LINK ACTIVE
                 </span>
                 {syncing && <span className="text-[9px] font-mono text-indigo-400 animate-pulse flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> SYNCING...</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-slate-900/80 px-6 py-3 rounded-2xl border border-indigo-500/20 flex flex-col items-end min-w-[140px] shadow-inner">
              <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Global Credits</span>
              <span className="orbitron text-lg font-bold text-white tracking-tight">{Math.floor(gameState.credits).toLocaleString()} CR</span>
            </div>
            <button onClick={() => window.location.reload()} className="p-4 hover:bg-red-500/10 rounded-2xl text-slate-600 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20 group">
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </header>

        {/* AI Ticker */}
        <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4 group overflow-hidden">
          <div className="bg-indigo-500 p-2 rounded-lg animate-pulse">
            <Sparkles size={16} className="text-white" />
          </div>
          <p className="text-xs font-mono text-indigo-300 italic tracking-wide truncate">
            {aiAdvice}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex bg-slate-900/50 p-1.5 rounded-2xl self-start border border-white/5 overflow-x-auto no-scrollbar max-w-full">
          <NavBtn active={activeTab === 'mine'} onClick={() => setActiveTab('mine')} icon={<Pickaxe />} label="Extraction" />
          <NavBtn active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} icon={<ShoppingBag />} label="Upgrades" />
          <NavBtn active={activeTab === 'tech'} onClick={() => setActiveTab('tech')} icon={<FlaskConical />} label="Tech Tree" />
          <NavBtn active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<BarChart3 />} label="Exchange" />
          {currentUser.role === 'admin' && <NavBtn active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<ShieldCheck className="text-red-500" />} label="Control" activeColor="bg-red-600" />}
        </nav>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar Stats */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="glass p-6 rounded-3xl border-indigo-500/10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="orbitron text-[10px] font-black text-slate-500 uppercase tracking-widest">Cargo Hold</h3>
                <span className="text-[10px] font-mono text-indigo-400">{Math.floor(gameState.resources.iron + gameState.resources.plasma + gameState.resources.crystal).toLocaleString()} / {currentStorageLimit.toLocaleString()}</span>
              </div>
              
              <div className="space-y-4">
                <ResourceBar label="Iron" amount={gameState.resources.iron} limit={currentStorageLimit} color="bg-slate-400" icon={<Database size={12}/>} />
                <ResourceBar label="Plasma" amount={gameState.resources.plasma} limit={currentStorageLimit} color="bg-indigo-400" icon={<Zap size={12}/>} />
                <ResourceBar label="Crystal" amount={gameState.resources.crystal} limit={currentStorageLimit} color="bg-cyan-400" icon={<Target size={12}/>} />
                <ResourceBar label="Data Bits" amount={gameState.resources.dataBits} limit={Infinity} color="bg-yellow-400" icon={<Binary size={12}/>} />
              </div>
            </div>

            <div className="glass p-6 rounded-3xl border-indigo-500/10 space-y-2">
               <h3 className="orbitron text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Market Index</h3>
               {/* Fixed type errors by adding explicit type for data from Object.entries */}
               {Object.entries(gameState.market).map(([name, data]: [string, any]) => (
                 <div key={name} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                   <span className="text-xs font-bold text-slate-300 uppercase">{name}</span>
                   <div className="flex items-center gap-2">
                     <span className="orbitron text-[10px] text-white">{data.price.toFixed(1)} CR</span>
                     {data.trend === 'up' ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
                   </div>
                 </div>
               ))}
            </div>
          </aside>

          {/* Content Area */}
          <main className="lg:col-span-3 min-h-[600px]">
            {activeTab === 'mine' && (
              <div className="flex flex-col items-center justify-center h-full gap-8 animate-in zoom-in-95 duration-500">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <button 
                    onClick={mineManual}
                    className="relative w-64 h-64 bg-slate-900 rounded-full flex flex-col items-center justify-center border border-white/10 hover:border-indigo-500/50 shadow-2xl transition-all active:scale-95 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent group-hover:from-indigo-500/20 transition-all" />
                    <Pickaxe size={64} className="text-indigo-400 mb-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="orbitron font-black text-white text-[10px] tracking-widest mb-1">EXTRACT ORE</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Yield: {gameState.upgrades.pickaxePower} iron/click</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <StatMini label="Manual Power" value={gameState.upgrades.pickaxePower} sub="IRON / CLICK" />
                  <StatMini label="Auto Yield" value={gameState.upgrades.autoMiners} sub="IRON / SEC" />
                  <StatMini label="Plasma Feed" value={gameState.upgrades.plasmaExtractors} sub="UNIT / SEC" />
                  <StatMini label="Refinery Rank" value={gameState.upgrades.crystalRefineries} sub="UNIT / SEC" />
                </div>
              </div>
            )}

            {activeTab === 'shop' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-right-8 duration-500">
                <ShopItem 
                  title="Mining Drills" 
                  desc="Automated iron extraction units." 
                  lvl={gameState.upgrades.autoMiners} 
                  cost={Math.floor(50 * Math.pow(1.5, gameState.upgrades.autoMiners))} 
                  icon={<Cpu />} 
                  onBuy={() => buyUpgrade('autoMiners', Math.floor(50 * Math.pow(1.5, gameState.upgrades.autoMiners)))}
                  canBuy={gameState.credits >= 50 * Math.pow(1.5, gameState.upgrades.autoMiners)} 
                />
                <ShopItem 
                  title="Hyper Pickaxe" 
                  desc="Boosts manual extraction efficiency." 
                  lvl={gameState.upgrades.pickaxePower} 
                  cost={Math.floor(20 * Math.pow(1.8, gameState.upgrades.pickaxePower - 1))} 
                  icon={<Pickaxe />} 
                  onBuy={() => buyUpgrade('pickaxePower', Math.floor(20 * Math.pow(1.8, gameState.upgrades.pickaxePower - 1)))}
                  canBuy={gameState.credits >= 20 * Math.pow(1.8, gameState.upgrades.pickaxePower - 1)} 
                />
                <ShopItem 
                  title="Plasma Extractors" 
                  desc="Gathers rare plasma from atmosphere." 
                  lvl={gameState.upgrades.plasmaExtractors} 
                  cost={Math.floor(200 * Math.pow(1.6, gameState.upgrades.plasmaExtractors))} 
                  icon={<Zap />} 
                  onBuy={() => buyUpgrade('plasmaExtractors', Math.floor(200 * Math.pow(1.6, gameState.upgrades.plasmaExtractors)))}
                  canBuy={gameState.credits >= 200 * Math.pow(1.6, gameState.upgrades.plasmaExtractors)} 
                />
                <ShopItem 
                  title="Crystal Refineries" 
                  desc="Processes high-value crystals." 
                  lvl={gameState.upgrades.crystalRefineries} 
                  cost={Math.floor(1000 * Math.pow(2, gameState.upgrades.crystalRefineries))} 
                  icon={<Target />} 
                  onBuy={() => buyUpgrade('crystalRefineries', Math.floor(1000 * Math.pow(2, gameState.upgrades.crystalRefineries)))}
                  canBuy={gameState.credits >= 1000 * Math.pow(2, gameState.upgrades.crystalRefineries)} 
                />
                <ShopItem 
                  title="Expansion Modules" 
                  desc="Increases cargo storage capacity." 
                  lvl={gameState.upgrades.storageLevel} 
                  cost={Math.floor(150 * Math.pow(2.2, gameState.upgrades.storageLevel - 1))} 
                  icon={<Package />} 
                  onBuy={() => buyUpgrade('storageLevel', Math.floor(150 * Math.pow(2.2, gameState.upgrades.storageLevel - 1)))}
                  canBuy={gameState.credits >= 150 * Math.pow(2.2, gameState.upgrades.storageLevel - 1)} 
                />
                <ShopItem 
                  title="Research Hubs" 
                  desc="Generates Data Bits for technology." 
                  lvl={gameState.upgrades.researchHubs} 
                  cost={Math.floor(500 * Math.pow(1.8, gameState.upgrades.researchHubs))} 
                  icon={<Binary />} 
                  onBuy={() => buyUpgrade('researchHubs', Math.floor(500 * Math.pow(1.8, gameState.upgrades.researchHubs)))}
                  canBuy={gameState.credits >= 500 * Math.pow(1.8, gameState.upgrades.researchHubs)} 
                />
              </div>
            )}

            {activeTab === 'tech' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-right-8 duration-500">
                <TechItem 
                  title="Tax Optimization" 
                  desc="Reduces market transaction fees." 
                  lvl={gameState.technologies.taxOptimization} 
                  cost={Math.floor(100 * Math.pow(2, gameState.technologies.taxOptimization))} 
                  onBuy={() => buyTech('taxOptimization', Math.floor(100 * Math.pow(2, gameState.technologies.taxOptimization)))}
                  canBuy={gameState.resources.dataBits >= 100 * Math.pow(2, gameState.technologies.taxOptimization)}
                />
                <TechItem 
                  title="Nano Storage" 
                  desc="Massively increases storage efficiency." 
                  lvl={gameState.technologies.nanoStorage} 
                  cost={Math.floor(250 * Math.pow(2.5, gameState.technologies.nanoStorage))} 
                  onBuy={() => buyTech('nanoStorage', Math.floor(250 * Math.pow(2.5, gameState.technologies.nanoStorage)))}
                  canBuy={gameState.resources.dataBits >= 250 * Math.pow(2.5, gameState.technologies.nanoStorage)}
                />
              </div>
            )}

            {activeTab === 'market' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
                <MarketCard 
                  resource="iron" 
                  price={gameState.market.iron.price} 
                  amount={gameState.resources.iron} 
                  onSell={() => sellResource('iron')} 
                  tax={taxRate}
                  icon={<Database />}
                />
                <MarketCard 
                  resource="plasma" 
                  price={gameState.market.plasma.price} 
                  amount={gameState.resources.plasma} 
                  onSell={() => sellResource('plasma')} 
                  tax={taxRate}
                  icon={<Zap />}
                />
                <MarketCard 
                  resource="crystal" 
                  price={gameState.market.crystal.price} 
                  amount={gameState.resources.crystal} 
                  onSell={() => sellResource('crystal')} 
                  tax={taxRate}
                  icon={<Target />}
                />
              </div>
            )}

            {activeTab === 'admin' && currentUser.role === 'admin' && <AdminPanel />}
          </main>
        </div>

        {/* Footer */}
        <footer className="glass p-4 rounded-2xl border-white/5 flex justify-between items-center text-[8px] font-mono text-slate-600 uppercase tracking-widest">
          <span>© 2024 Nebula Distributed Systems</span>
          <span>Core Version 3.4.9-LTS</span>
          <div className="flex gap-4">
            <Link2 size={10} className="hover:text-indigo-400 cursor-pointer" />
            <Terminal size={10} className="hover:text-indigo-400 cursor-pointer" />
          </div>
        </footer>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const NavBtn = ({ active, onClick, icon, label, activeColor }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl transition-all orbitron text-[9px] font-black whitespace-nowrap ${active ? (activeColor || 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20 scale-105') : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
  >
    {React.cloneElement(icon, { size: 14 })}
    {label.toUpperCase()}
  </button>
);

const ResourceBar = ({ label, amount, limit, color, icon }: any) => {
  const percentage = limit === Infinity ? 0 : Math.min(100, (amount / limit) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] items-center">
        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider">
          {icon}
          {label}
        </div>
        <span className="font-mono text-white">{Math.floor(amount).toLocaleString()}</span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden flex">
        <div className={`h-full ${color} transition-all duration-500 shadow-[0_0_8px_rgba(255,255,255,0.1)]`} style={{ width: `${limit === Infinity ? 100 : percentage}%` }} />
      </div>
    </div>
  );
};

const StatMini = ({ label, value, sub }: any) => (
  <div className="glass p-4 rounded-2xl border-white/5 flex flex-col items-center">
    <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</span>
    <span className="orbitron text-sm font-bold text-white">{value}</span>
    <span className="text-[6px] font-mono text-indigo-500/60 mt-0.5">{sub}</span>
  </div>
);

const ShopItem = ({ title, desc, lvl, cost, onBuy, canBuy, icon }: any) => (
  <div className="glass p-6 rounded-3xl border-white/5 flex flex-col gap-4 group hover:bg-white/[0.02] transition-colors relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
      {React.cloneElement(icon, { size: 48 })}
    </div>
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-bold text-sm text-white tracking-tight">{title}</h4>
        <p className="text-[10px] text-slate-500 leading-tight mt-1">{desc}</p>
      </div>
      <div className="bg-indigo-500/10 px-3 py-1 rounded-full">
        <span className="orbitron text-[9px] font-black text-indigo-400">RANK {lvl}</span>
      </div>
    </div>
    <button 
      onClick={onBuy} 
      disabled={!canBuy} 
      className={`w-full py-3.5 rounded-xl orbitron text-[10px] font-black transition-all ${canBuy ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 hover:translate-y-[-2px] active:translate-y-0' : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}
    >
      UPGRADE: {cost.toLocaleString()} CR
    </button>
  </div>
);

const TechItem = ({ title, desc, lvl, cost, onBuy, canBuy }: any) => (
  <div className="glass p-6 rounded-3xl border-yellow-500/10 flex flex-col gap-4 group">
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-bold text-sm text-yellow-50 shadow-yellow-500/20">{title}</h4>
        <p className="text-[10px] text-slate-500 leading-tight mt-1">{desc}</p>
      </div>
      <span className="orbitron text-[9px] font-black text-yellow-500">LEVEL {lvl}</span>
    </div>
    <button 
      onClick={onBuy} 
      disabled={!canBuy} 
      className={`w-full py-3.5 rounded-xl orbitron text-[10px] font-black transition-all ${canBuy ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-lg shadow-yellow-600/10' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
    >
      RESEARCH: {cost.toLocaleString()} DATA
    </button>
  </div>
);

const MarketCard = ({ resource, price, amount, onSell, tax, icon }: any) => (
  <div className="glass p-6 rounded-3xl border-white/5 flex flex-col gap-6 group hover:border-indigo-500/20 transition-all">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-indigo-400 transition-colors">
          {React.cloneElement(icon, { size: 16 })}
        </div>
        <span className="orbitron font-black text-slate-400 uppercase tracking-widest text-[10px]">{resource}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="orbitron text-xs text-green-400">{price.toFixed(1)} CR</span>
        <span className="text-[7px] font-mono text-slate-600">UNIT VALUE</span>
      </div>
    </div>
    
    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
      <p className="text-[8px] font-mono text-slate-500 uppercase mb-1">Held Inventory</p>
      <p className="orbitron text-2xl font-black text-white">{Math.floor(amount).toLocaleString()}</p>
    </div>

    <button 
      onClick={onSell} 
      disabled={amount <= 0} 
      className={`w-full py-4 rounded-2xl orbitron text-[10px] font-black transition-all ${amount > 0 ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
    >
      OFFLOAD STOCKS (%{(tax*100).toFixed(0)} TAX)
    </button>
  </div>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
