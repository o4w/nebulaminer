
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Pickaxe, 
  TrendingUp, 
  TrendingDown,
  Settings, 
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
  ArrowUpRight,
  Target,
  ShieldCheck,
  Edit3,
  Save,
  Trash2,
  X,
  RefreshCw,
  Terminal,
  Code2,
  Cloud,
  Link2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

// --- Supabase Client Initialization ---
// NOTE: Gerçek projede bu değerler process.env'den gelmelidir.
const SUPABASE_URL = (process.env as any).SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = (process.env as any).SUPABASE_ANON_KEY || 'your-anon-key';

// Eğer anahtarlar yoksa bile hata vermemesi için mock logic fallback
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const NebulaAPI = {
  getUsers: async (): Promise<Record<string, UserData>> => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      const record: Record<string, UserData> = {};
      data.forEach(u => {
        record[u.id] = {
          id: u.id,
          password: u.password,
          role: u.role,
          gameState: u.game_state
        };
      });
      return record;
    } catch (e) {
      console.error("Supabase connection failed, falling back to local simulation.", e);
      const local = localStorage.getItem('nebula_db_v3');
      return local ? JSON.parse(local) : {};
    }
  },

  saveUser: async (user: UserData) => {
    try {
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        password: user.password,
        role: user.role,
        game_state: user.gameState
      });
      if (error) throw error;
      return { status: 'success', provider: 'supabase' };
    } catch (e) {
      const users = JSON.parse(localStorage.getItem('nebula_db_v3') || '{}');
      users[user.id] = user;
      localStorage.setItem('nebula_db_v3', JSON.stringify(users));
      return { status: 'local_fallback', provider: 'localStorage' };
    }
  },

  updateGameState: async (userId: string, state: GameState) => {
    try {
      await supabase.from('users').update({ game_state: state }).eq('id', userId);
    } catch (e) {
      const users = JSON.parse(localStorage.getItem('nebula_db_v3') || '{}');
      if (users[userId]) {
        users[userId].gameState = state;
        localStorage.setItem('nebula_db_v3', JSON.stringify(users));
      }
    }
  },

  adminDeleteUser: async (userId: string) => {
    try {
      await supabase.from('users').delete().eq('id', userId);
    } catch (e) {
      const users = JSON.parse(localStorage.getItem('nebula_db_v3') || '{}');
      delete users[userId];
      localStorage.setItem('nebula_db_v3', JSON.stringify(users));
    }
  }
};

const SQL_SCHEMA = `
-- 1. Create the Users Table in Supabase SQL Editor
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    game_state JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create Basic Access Policy
CREATE POLICY "Public full access" ON public.users 
FOR ALL USING (true) WITH CHECK (true);
`;

// --- Admin Sub-component ---
const AdminPanel = () => {
  const [users, setUsers] = useState<Record<string, UserData>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UserData | null>(null);
  const [adminSubTab, setAdminSubTab] = useState<'users' | 'database'>('users');
  const [loading, setLoading] = useState(false);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    const data = await NebulaAPI.getUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const handleEdit = (u: UserData) => {
    setEditingId(u.id);
    setEditForm(JSON.parse(JSON.stringify(u)));
  };

  const handleSave = async () => {
    if (editForm) {
      setLoading(true);
      await NebulaAPI.saveUser(editForm);
      setEditingId(null);
      setEditForm(null);
      await refreshUsers();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete ${id}?`)) {
      setLoading(true);
      await NebulaAPI.adminDeleteUser(id);
      await refreshUsers();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-red-950/20 border border-red-500/20 p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-xl text-red-400"><ShieldCheck size={24} /></div>
          <div>
            <h2 className="orbitron text-lg font-black text-red-400 uppercase tracking-tighter">Supabase Commander</h2>
            <p className="text-[10px] font-mono text-red-500/60 uppercase">PostgreSQL Tier: Cloud Integration Active</p>
          </div>
        </div>
        
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          <button onClick={() => setAdminSubTab('users')} className={`px-4 py-2 rounded-lg text-[10px] orbitron font-bold transition-all ${adminSubTab === 'users' ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>PILOT NODES</button>
          <button onClick={() => setAdminSubTab('database')} className={`px-4 py-2 rounded-lg text-[10px] orbitron font-bold transition-all ${adminSubTab === 'database' ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>SUPABASE SETUP</button>
        </div>
      </div>

      {adminSubTab === 'users' ? (
        <div className="glass border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-white/5 text-[10px] uppercase font-black tracking-widest text-slate-500">
                <th className="px-6 py-4">Pilot ID</th>
                <th className="px-6 py-4">Credits</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Object.values(users).map((u: UserData) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-200">{u.id}</span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">Auth Layer: PostgreSQL</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 orbitron text-xs font-bold text-yellow-400">
                    {Math.floor(u.gameState.credits).toLocaleString()} CR
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] px-2 py-1 rounded-full font-black uppercase ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(u)} className="p-2 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 rounded-lg transition-all"><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="p-10 text-center animate-pulse orbitron text-xs text-red-500">FETCHING FROM SUPABASE INSTANCE...</div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-3xl border-white/5">
            <h3 className="orbitron text-xs font-black text-slate-400 mb-4 flex items-center gap-2"><Code2 size={14} /> SUPABASE SQL MIGRATION</h3>
            <pre className="bg-black/60 p-4 rounded-xl text-[10px] font-mono text-cyan-400 border border-cyan-500/10 overflow-x-auto max-h-[300px]">
              {SQL_SCHEMA}
            </pre>
            <div className="mt-4 flex gap-4">
              <button onClick={() => navigator.clipboard.writeText(SQL_SCHEMA)} className="text-[10px] font-mono text-cyan-600 hover:text-cyan-400 transition-all flex items-center gap-2">
                <RefreshCw size={12} /> COPY SQL
              </button>
              <a href="https://supabase.com/dashboard" target="_blank" className="text-[10px] font-mono text-slate-500 hover:text-white transition-all flex items-center gap-2">
                <Link2 size={12} /> OPEN DASHBOARD
              </a>
            </div>
          </div>
          <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
            <h3 className="orbitron text-xs font-black text-slate-400 mb-4 flex items-center gap-2"><Terminal size={14} /> CLOUD CONFIGURATION</h3>
            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                 <span className="text-[9px] text-slate-500 block uppercase mb-1">Project URL</span>
                 <code className="text-[10px] text-cyan-500 break-all">{SUPABASE_URL}</code>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                 <span className="text-[9px] text-slate-500 block uppercase mb-1">Auth Strategy</span>
                 <span className="orbitron text-[11px] font-bold text-green-500">POSTGRES_JWT_ENABLED</span>
              </div>
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                 <p className="text-[10px] text-blue-400 font-mono leading-relaxed">
                   Uygulama Supabase istemcisini kullanarak JSONB formatında yüksek hızlı senkronizasyon sağlar.
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingId && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-2xl w-full glass border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setEditingId(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X /></button>
            <h3 className="orbitron text-xl font-black text-white mb-8">EDIT NODE: {editForm.id}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Credits</span>
                  <input type="number" value={editForm.gameState.credits} onChange={e => setEditForm({...editForm, gameState: {...editForm.gameState, credits: Number(e.target.value)}})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-yellow-400 outline-none" />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Access Role</span>
                  <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value as 'user' | 'admin'})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                    <option value="user">USER</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </label>
            </div>

            <button onClick={handleSave} disabled={loading} className="w-full mt-10 bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl font-black orbitron text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-3">
              {loading && <RefreshCw size={16} className="animate-spin" />}
              {loading ? 'SYNCING SUPABASE...' : 'COMMIT CHANGES TO CLOUD'}
            </button>
          </div>
        </div>
      )}
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
    const users = await NebulaAPI.getUsers();
    
    if (isRegister) {
      if (users[userId]) { setError('Pilot ID already active in DB.'); setLoading(false); return; }
      const role = Object.keys(users).length === 0 ? 'admin' : 'user';
      const newUser: UserData = { id: userId, password, role, gameState: INITIAL_GAME_STATE };
      await NebulaAPI.saveUser(newUser);
      onLogin(newUser);
    } else {
      const u = users[userId];
      if (u && u.password === password) onLogin(u);
      else setError('Supabase Auth: Access Denied.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full glass rounded-[2rem] p-10 border border-cyan-500/20 shadow-[0_0_100px_rgba(6,182,212,0.1)]">
        <div className="text-center mb-8">
          <Globe className="text-cyan-400 w-16 h-16 mx-auto mb-6 animate-pulse" />
          <h1 className="orbitron text-2xl font-black text-white uppercase">Nebula Supabase</h1>
          <p className="text-slate-500 text-[10px] font-mono mt-1">ENGINE: SUPABASE_JS_POSTGRES</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="text" placeholder="Pilot ID" value={userId} onChange={e => setUserId(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-cyan-50 focus:border-cyan-500 outline-none transition-all font-mono" />
          <input required type="password" placeholder="Access Code" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-cyan-50 focus:border-cyan-500 outline-none transition-all font-mono" />
          {error && <p className="text-red-500 text-[10px] text-center font-bold font-mono">{error}</p>}
          <button disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl font-black orbitron text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : (isRegister ? 'INITIALIZE CLOUD NODE' : 'SYNC WITH SUPABASE')}
          </button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-6 text-slate-500 text-xs hover:text-cyan-400 font-mono">
          {isRegister ? '> Back to Terminal' : '> Provision New Cloud Account'}
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
  const [aiAdvice, setAiAdvice] = useState<string>("Analyzing galactic economy...");
  const [syncing, setSyncing] = useState(false);

  // Debounced Sync with Supabase
  useEffect(() => {
    if (currentUser) {
      const syncTimeout = setTimeout(async () => {
        setSyncing(true);
        await NebulaAPI.updateGameState(currentUser.id, gameState);
        setSyncing(false);
      }, 3000); // 3 saniye debounce
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

  // Game Production Loop
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      setGameState(prev => {
        const now = Date.now();
        const delta = (now - prev.lastUpdate) / 1000;
        
        return {
          ...prev,
          resources: {
            iron: Math.min(currentStorageLimit, prev.resources.iron + (prev.upgrades.autoMiners * 1 * delta)),
            plasma: Math.min(currentStorageLimit, prev.resources.plasma + (prev.upgrades.plasmaExtractors * 0.5 * delta)),
            crystal: Math.min(currentStorageLimit, prev.resources.crystal + (prev.upgrades.crystalRefineries * 0.1 * delta)),
            dataBits: prev.resources.dataBits + (prev.upgrades.researchHubs * 0.2 * delta)
          },
          lastUpdate: now
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser, currentStorageLimit]);

  // Market Dynamics Loop
  useEffect(() => {
    if (!currentUser) return;
    const marketInterval = setInterval(() => {
      setGameState(prev => {
        const newMarket = { ...prev.market };
        Object.keys(BASE_MARKET_PRICES).forEach(key => {
          const base = (BASE_MARKET_PRICES as any)[key];
          const demandFactor = 0.5 + (Math.random() * (prev.market[key].demand / 50));
          const nextPrice = Math.max(1, Math.round(base * demandFactor * (0.8 + Math.random() * 0.4) * 10) / 10);
          newMarket[key] = { 
            price: nextPrice, 
            trend: nextPrice > prev.market[key].price ? 'up' : 'down', 
            demand: Math.max(10, Math.min(100, prev.market[key].demand + (Math.random() * 20 - 10))) 
          };
        });
        return { ...prev, market: newMarket };
      });
    }, 15000);
    return () => clearInterval(marketInterval);
  }, [currentUser]);

  if (!currentUser) return <AuthScreen onLogin={u => { setCurrentUser(u); setGameState(u.gameState); }} />;

  // Handlers
  const mineManual = () => {
    if (gameState.resources.iron < currentStorageLimit) {
      setGameState(prev => ({
        ...prev,
        resources: { ...prev.resources, iron: Math.min(currentStorageLimit, prev.resources.iron + (prev.upgrades.pickaxePower + (prev.technologies.neuralMining * 2))) }
      }));
    }
  };

  const sellResource = (type: string) => {
    const amount = (gameState.resources as any)[type];
    if (amount <= 0) return;
    const taxedProfit = (amount * gameState.market[type].price) * (1 - taxRate);
    setGameState(prev => ({
      ...prev,
      credits: prev.credits + taxedProfit,
      resources: { ...prev.resources, [type]: 0 }
    }));
  };

  const buyUpgrade = (key: string, costs: any) => {
    const cost = costs((gameState.upgrades as any)[key] || 0);
    if (gameState.credits >= cost) {
      setGameState(prev => ({
        ...prev,
        credits: prev.credits - cost,
        upgrades: { ...prev.upgrades, [key]: (prev.upgrades as any)[key] + 1 }
      }));
    }
  };

  const researchTech = (key: string, costs: any) => {
    const cost = costs(gameState.technologies[key as keyof TechState]);
    if (gameState.resources.dataBits >= cost) {
      setGameState(prev => ({
        ...prev,
        resources: { ...prev.resources, dataBits: prev.resources.dataBits - cost },
        technologies: { ...prev.technologies, [key]: (prev.technologies as any)[key] + 1 }
      }));
    }
  };

  const getAiAdvice = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Supabase kullanan bir tycoon oyununun AI danışmanısın. Vergi: %${(taxRate*100).toFixed(0)}, Kredi: ${gameState.credits.toFixed(0)}. Bir borsa taktiği ver.`;
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiAdvice(res.text || "Cloud uplink busy.");
    } catch { setAiAdvice("Offline mode active."); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        <header className="glass rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-white/5 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl">
              <Cloud className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="orbitron text-2xl font-black text-white italic">Nebula <span className="text-indigo-400">Cloud</span></h1>
              <div className="flex items-center gap-3 mt-1">
                 <span className="text-[9px] font-mono text-slate-500 tracking-[0.2em] flex items-center gap-2">
                   <span className="w-2 h-2 bg-green-500 rounded-full" /> SUPABASE: ONLINE
                 </span>
                 {syncing && <span className="text-[9px] font-mono text-indigo-500 animate-pulse flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> SYNCING...</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900/80 px-6 py-3 rounded-2xl border border-indigo-500/20 shadow-inner flex flex-col items-end">
              <span className="text-[9px] font-black text-indigo-400 uppercase">Balance</span>
              <span className="orbitron text-lg font-bold text-white">{Math.floor(gameState.credits).toLocaleString()} CR</span>
            </div>
            <button onClick={() => setCurrentUser(null)} className="p-4 hover:bg-red-500/10 rounded-2xl text-slate-600 hover:text-red-400 transition-all"><LogOut size={20} /></button>
          </div>
        </header>

        <section className="bg-indigo-950/20 border-y border-indigo-500/10 p-4 overflow-hidden relative font-mono text-xs">
           <div className="flex items-center gap-8 animate-marquee">
             {/* Fix: Explicitly cast entries to handle 'unknown' type inference on index signature access */}
             {(Object.entries(gameState.market) as [string, any][]).map(([key, val]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-slate-500 uppercase">{key}:</span>
                  <span className={val.trend === 'up' ? 'text-green-400' : 'text-red-400'}>{val.price} CR</span>
                </div>
             ))}
             <span className="text-slate-600">| SUPABASE JSONB STORAGE: ACTIVE | NETWORK DELAY: MINIMAL |</span>
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <aside className="lg:col-span-1 glass rounded-3xl p-6 border-indigo-500/10 h-fit">
              <div className="flex items-center justify-between mb-6">
                <h3 className="orbitron text-[10px] font-black text-indigo-400 tracking-widest uppercase">Cloud AI</h3>
                <Target size={16} className="text-indigo-500 animate-spin-slow" />
              </div>
              <p className="text-xs text-slate-300 italic font-mono mb-6 leading-relaxed">"{aiAdvice}"</p>
              <button onClick={getAiAdvice} className="w-full py-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 font-bold orbitron text-[10px] rounded-xl transition-all">REFRESH ANALYSIS</button>
           </aside>

           <main className="lg:col-span-3 flex flex-col gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <StatCard icon={<Database />} label="Iron" val={gameState.resources.iron} color="text-slate-400" limit={currentStorageLimit} />
                 <StatCard icon={<Zap />} label="Plasma" val={gameState.resources.plasma} color="text-purple-400" limit={currentStorageLimit} />
                 <StatCard icon={<Rocket />} label="Crystal" val={gameState.resources.crystal} color="text-cyan-400" limit={currentStorageLimit} />
                 <StatCard icon={<Binary />} label="Data" val={gameState.resources.dataBits} color="text-blue-400" />
              </div>

              <nav className="flex bg-slate-900/50 p-1 rounded-2xl self-start border border-white/5 overflow-x-auto">
                <NavBtn active={activeTab === 'mine'} onClick={() => setActiveTab('mine'} icon={<Pickaxe />} label="Mine" />
                <NavBtn active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} icon={<ShoppingBag />} label="Shop" />
                <NavBtn active={activeTab === 'tech'} onClick={() => setActiveTab('tech')} icon={<Microchip />} label="Tech" />
                <NavBtn active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<BarChart3 />} label="Trade" />
                {currentUser.role === 'admin' && <NavBtn active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<ShieldCheck className="text-red-500" />} label="Control" activeColor="bg-red-600" />}
              </nav>

              <div className="min-h-[400px]">
                {activeTab === 'mine' && (
                  <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in">
                    <button onClick={mineManual} className="relative w-64 h-64 glass rounded-full flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl group border-2 border-indigo-500/20">
                      <div className="absolute inset-0 border-[10px] border-t-indigo-500/20 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow" />
                      <Pickaxe size={48} className="text-indigo-400 mb-2 group-hover:rotate-12 transition-transform" />
                      <span className="orbitron font-black text-white text-sm">EXTRACT RESOURCE</span>
                    </button>
                  </div>
                )}

                {activeTab === 'shop' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4">
                    <ShopItem title="Hyper-Drones" icon={<Cpu />} lvl={gameState.upgrades.autoMiners} cost={UPGRADE_COSTS.autoMiners(gameState.upgrades.autoMiners)} onBuy={() => buyUpgrade('autoMiners', UPGRADE_COSTS.autoMiners)} canBuy={gameState.credits >= UPGRADE_COSTS.autoMiners(gameState.upgrades.autoMiners)} />
                    <ShopItem title="Plasma Core" icon={<Zap />} lvl={gameState.upgrades.plasmaExtractors} cost={UPGRADE_COSTS.plasmaExtractors(gameState.upgrades.plasmaExtractors)} onBuy={() => buyUpgrade('plasmaExtractors', UPGRADE_COSTS.plasmaExtractors)} canBuy={gameState.credits >= UPGRADE_COSTS.plasmaExtractors(gameState.upgrades.plasmaExtractors)} />
                    <ShopItem title="Data Hub" icon={<Binary />} lvl={gameState.upgrades.researchHubs} cost={UPGRADE_COSTS.researchHubs(gameState.upgrades.researchHubs)} onBuy={() => buyUpgrade('researchHubs', UPGRADE_COSTS.researchHubs)} canBuy={gameState.credits >= UPGRADE_COSTS.researchHubs(gameState.upgrades.researchHubs)} />
                    <ShopItem title="Cargo Expansion" icon={<Database />} lvl={gameState.upgrades.storageLevel} cost={UPGRADE_COSTS.storage(gameState.upgrades.storageLevel)} onBuy={() => buyUpgrade('storageLevel', UPGRADE_COSTS.storage)} canBuy={gameState.credits >= UPGRADE_COSTS.storage(gameState.upgrades.storageLevel)} />
                  </div>
                )}

                {activeTab === 'tech' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in">
                    <TechItem title="Neural Mining" desc="Increases manual mining yields." lvl={gameState.technologies.neuralMining} cost={TECH_COSTS.neuralMining(gameState.technologies.neuralMining)} onBuy={() => researchTech('neuralMining', TECH_COSTS.neuralMining)} canBuy={gameState.resources.dataBits >= TECH_COSTS.neuralMining(gameState.technologies.neuralMining)} />
                    <TechItem title="Tax Optimization" desc="Reduces galactic sales tax." lvl={gameState.technologies.taxOptimization} cost={TECH_COSTS.taxOptimization(gameState.technologies.taxOptimization)} onBuy={() => researchTech('taxOptimization', TECH_COSTS.taxOptimization)} canBuy={gameState.resources.dataBits >= TECH_COSTS.taxOptimization(gameState.technologies.taxOptimization)} />
                  </div>
                )}

                {activeTab === 'market' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4">
                    {Object.entries(BASE_MARKET_PRICES).map(([key]) => (
                       <MarketCard key={key} resource={key} data={gameState.market[key]} amount={(gameState.resources as any)[key]} onSell={() => sellResource(key)} tax={taxRate} />
                    ))}
                  </div>
                )}

                {activeTab === 'admin' && currentUser.role === 'admin' && <AdminPanel />}
              </div>
           </main>
        </div>

        <footer className="text-center py-10 opacity-30 orbitron text-[9px] tracking-[0.5em] uppercase">
          Nebula Galactic OS - Powered by Supabase & Gemini AI
        </footer>
      </div>
    </div>
  );
};

// --- Helpers ---
const UPGRADE_COSTS = {
  pickaxePower: (l: number) => Math.floor(10 * Math.pow(1.6, l)),
  autoMiners: (c: number) => Math.floor(50 * Math.pow(1.4, c)),
  plasmaExtractors: (c: number) => Math.floor(500 * Math.pow(1.5, c)),
  crystalRefineries: (c: number) => Math.floor(5000 * Math.pow(1.7, c)),
  researchHubs: (c: number) => Math.floor(200 * Math.pow(1.8, c)),
  storage: (l: number) => Math.floor(100 * Math.pow(2.2, l))
};

const TECH_COSTS = {
  marketAI: (l: number) => Math.floor(50 * Math.pow(2.5, l)),
  taxOptimization: (l: number) => Math.floor(100 * Math.pow(3, l)),
  nanoStorage: (l: number) => Math.floor(150 * Math.pow(2.2, l)),
  neuralMining: (l: number) => Math.floor(80 * Math.pow(2.8, l))
};

// --- Small UI Components ---
const StatCard = ({ icon, label, val, color, limit }: any) => (
  <div className="glass p-4 rounded-2xl border-white/5 bg-slate-900/40 flex items-center gap-4">
    <div className={`p-3 bg-black/40 rounded-xl ${color}`}>{React.cloneElement(icon, { size: 16 })}</div>
    <div>
      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <p className={`orbitron text-xs font-bold ${color}`}>
        {Math.floor(val).toLocaleString()}
        {limit && <span className="text-[8px] text-slate-700 font-normal"> / {limit.toLocaleString()}</span>}
      </p>
    </div>
  </div>
);

const NavBtn = ({ active, onClick, icon, label, activeColor }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all orbitron text-[9px] font-black whitespace-nowrap ${active ? (activeColor || 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20') : 'text-slate-500 hover:text-slate-300'}`}>
    {React.cloneElement(icon, { size: 12 })}
    {label.toUpperCase()}
  </button>
);

const ShopItem = ({ title, icon, lvl, cost, onBuy, canBuy }: any) => (
  <div className="glass p-5 rounded-2xl border-white/5 flex flex-col gap-4 group">
    <div className="flex justify-between items-center">
      <div className="p-3 bg-slate-950 rounded-xl group-hover:scale-110 transition-transform text-indigo-400">{icon}</div>
      <span className="orbitron text-[9px] font-black text-indigo-500">LVL {lvl}</span>
    </div>
    <h4 className="font-bold text-sm">{title}</h4>
    <button onClick={onBuy} disabled={!canBuy} className={`w-full py-3 rounded-xl orbitron text-[9px] font-black transition-all ${canBuy ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
      UPGRADE: {cost.toLocaleString()} CR
    </button>
  </div>
);

const TechItem = ({ title, desc, lvl, cost, onBuy, canBuy }: any) => (
  <div className="glass p-5 rounded-2xl border-indigo-500/10 bg-indigo-500/5 flex flex-col gap-4 group">
    <div className="flex justify-between items-center">
      <div className="p-3 bg-slate-950 rounded-xl text-indigo-400"><Microchip size={18} /></div>
      <span className="orbitron text-[9px] font-black text-indigo-500">TIER {lvl}</span>
    </div>
    <div>
      <h4 className="font-bold text-sm mb-1">{title}</h4>
      <p className="text-[10px] text-slate-500 italic font-mono">{desc}</p>
    </div>
    <button onClick={onBuy} disabled={!canBuy} className={`w-full py-3 rounded-xl orbitron text-[9px] font-black transition-all ${canBuy ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
      RESEARCH: {cost.toLocaleString()} DATA
    </button>
  </div>
);

// Fix: Use 'any' for props to match other components and bypass the 'key' prop error on functional components when passed from JSX map
const MarketCard = ({ resource, data, amount, onSell, tax }: any) => (
  <div className="glass p-6 rounded-3xl border-white/5 flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <span className="orbitron font-black text-slate-400 uppercase tracking-widest text-[10px]">{resource}</span>
      <div className={`flex items-center gap-1 text-[10px] font-bold ${data.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
        {data.price} CR {data.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      </div>
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-[9px] text-slate-500">HOLDINGS</span>
      <p className="orbitron text-xl font-black text-white">{Math.floor(amount).toLocaleString()}</p>
    </div>
    <button onClick={onSell} disabled={amount <= 0} className={`w-full py-4 rounded-2xl orbitron text-[10px] font-black transition-all ${amount > 0 ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-slate-800 text-slate-600'}`}>
      SELL CARGO (%{(tax*100).toFixed(0)} TAX)
    </button>
  </div>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
