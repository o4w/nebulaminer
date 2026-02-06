
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Pickaxe, 
  TrendingUp, 
  TrendingDown,
  LogOut,
  Binary,
  BarChart3,
  Microchip,
  Globe,
  Target,
  Database,
  Zap,
  Rocket,
  ShoppingBag,
  Cpu,
  Settings,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client Initialization ---
const SUPABASE_URL = 'https://slfxijiowcbqzhzlnhhh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VJ4oUTpjq-KbKecplM7mog_RR2lhNCz';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    nextPriceHint?: number;
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

const UPGRADE_COSTS = {
  pickaxePower: (l: number) => Math.floor(10 * Math.pow(1.6, l - 1)),
  autoMiners: (c: number) => Math.floor(50 * Math.pow(1.4, c)),
  plasmaExtractors: (c: number) => Math.floor(500 * Math.pow(1.5, c)),
  crystalRefineries: (c: number) => Math.floor(5000 * Math.pow(1.7, c)),
  researchHubs: (c: number) => Math.floor(200 * Math.pow(1.8, c)),
  storage: (l: number) => Math.floor(100 * Math.pow(2.2, l - 1))
};

const TECH_COSTS = {
  marketAI: (l: number) => Math.floor(50 * Math.pow(2.5, l)),
  taxOptimization: (l: number) => Math.floor(100 * Math.pow(3, l)),
  nanoStorage: (l: number) => Math.floor(150 * Math.pow(2.2, l)),
  neuralMining: (l: number) => Math.floor(80 * Math.pow(2.8, l))
};

const STORAGE_LIMITS = (level: number, techLevel: number) => 
  Math.floor((level * 1000) * (1 + (techLevel * 0.5)));

// --- Database Service (Supabase) ---
const DBService = {
  getUser: async (userId: string): Promise<UserData | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return {
      id: data.id,
      password: data.password,
      gameState: data.game_state
    };
  },
  saveUser: async (user: UserData) => {
    await supabase.from('users').upsert({
      id: user.id,
      password: user.password,
      game_state: user.gameState
    });
  },
  updateGameState: async (userId: string, state: GameState) => {
    await supabase.from('users').update({ game_state: state }).eq('id', userId);
  }
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
      const user = await DBService.getUser(userId);
      if (isRegister) {
        if (user) {
          setError('ID mevcut.');
        } else {
          const newUser = { id: userId, password, gameState: INITIAL_GAME_STATE };
          await DBService.saveUser(newUser);
          onLogin(newUser);
        }
      } else {
        if (user && user.password === password) {
          onLogin(user);
        } else {
          setError('Geçersiz kimlik.');
        }
      }
    } catch (err) {
      setError('Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full glass rounded-[2rem] p-10 border border-cyan-500/20 shadow-[0_0_100px_rgba(6,182,212,0.1)]">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl mx-auto flex items-center justify-center border border-cyan-500/30 mb-6 rotate-3 hover:rotate-0 transition-transform">
            <Globe className="text-cyan-400 w-10 h-10 animate-pulse" />
          </div>
          <h1 className="orbitron text-2xl font-black text-white tracking-tighter uppercase">Nebula OS v2.1</h1>
          <p className="text-slate-500 text-xs mt-2 font-mono">Cloud-Synced Persistence Node</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="text" placeholder="Pilot ID" value={userId} onChange={e => setUserId(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-cyan-50 focus:border-cyan-500 outline-none transition-all font-mono" />
          <input required type="password" placeholder="Access Code" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-cyan-50 focus:border-cyan-500 outline-none transition-all font-mono" />
          {error && <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-widest">{error}</p>}
          <button disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl font-black orbitron text-white shadow-lg shadow-cyan-900/20 active:scale-95 transition-all flex items-center justify-center">
            {loading ? <RefreshCw className="animate-spin" size={20} /> : (isRegister ? 'INITIALIZE CORE' : 'ESTABLISH LINK')}
          </button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-6 text-slate-500 text-xs hover:text-cyan-400 font-mono">
          {isRegister ? '> Back to Login' : '> Create New Profile'}
        </button>
      </div>
    </div>
  );
};

// --- Main App ---
const App = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [activeTab, setActiveTab] = useState<'mine' | 'shop' | 'tech' | 'market'>('mine');
  const [aiAdvice, setAiAdvice] = useState<string>("Ekonomik veriler analiz ediliyor...");
  const [isSaving, setIsSaving] = useState(false);

  const taxRate = useMemo(() => 
    Math.max(0.05, MARKET_TAX_BASE - (gameState.technologies.taxOptimization * 0.03)), 
    [gameState.technologies.taxOptimization]
  );

  const currentStorageLimit = useMemo(() => 
    STORAGE_LIMITS(gameState.upgrades.storageLevel, gameState.technologies.nanoStorage),
    [gameState.upgrades.storageLevel, gameState.technologies.nanoStorage]
  );

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

  useEffect(() => {
    if (!currentUser) return;
    const marketInterval = setInterval(() => {
      setGameState(prev => {
        const newMarket = { ...prev.market };
        (Object.keys(BASE_MARKET_PRICES) as Array<keyof typeof BASE_MARKET_PRICES>).forEach(key => {
          const base = (BASE_MARKET_PRICES as any)[key];
          const current = prev.market[key].price;
          const demandFactor = 0.5 + (Math.random() * (prev.market[key].demand / 50));
          const nextPrice = Math.max(1, Math.round(base * demandFactor * (0.8 + Math.random() * 0.4) * 10) / 10);
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (nextPrice > current) trend = 'up';
          else if (nextPrice < current) trend = 'down';
          newMarket[key] = { 
            price: nextPrice, 
            trend, 
            demand: Math.max(10, Math.min(100, prev.market[key].demand + (Math.random() * 20 - 10))) 
          };
        });
        return { ...prev, market: newMarket };
      });
    }, 15000);
    return () => clearInterval(marketInterval);
  }, [currentUser]);

  // Debounced Auto-Save to Supabase
  useEffect(() => {
    if (currentUser) {
      const saveTimeout = setTimeout(async () => {
        setIsSaving(true);
        await DBService.updateGameState(currentUser.id, gameState);
        setIsSaving(false);
      }, 5000);
      return () => clearTimeout(saveTimeout);
    }
  }, [gameState, currentUser]);

  if (!currentUser) return <AuthScreen onLogin={u => { setCurrentUser(u); setGameState(u.gameState); }} />;

  const mineManual = () => {
    if (gameState.resources.iron < currentStorageLimit) {
      const power = gameState.upgrades.pickaxePower + (gameState.technologies.neuralMining * 2);
      setGameState(prev => ({
        ...prev,
        resources: { ...prev.resources, iron: Math.min(currentStorageLimit, prev.resources.iron + power) }
      }));
    }
  };

  const sellResource = (type: keyof typeof BASE_MARKET_PRICES) => {
    const amount = (gameState.resources as any)[type];
    if (amount <= 0) return;
    const taxedProfit = amount * gameState.market[type].price * (1 - taxRate);
    setGameState(prev => ({
      ...prev,
      credits: prev.credits + taxedProfit,
      resources: { ...prev.resources, [type]: 0 }
    }));
  };

  const buyUpgrade = (key: keyof typeof gameState.upgrades) => {
    const cost = (UPGRADE_COSTS as any)[key]((gameState.upgrades as any)[key]);
    if (gameState.credits >= cost) {
      setGameState(prev => ({
        ...prev,
        credits: prev.credits - cost,
        upgrades: { ...prev.upgrades, [key]: (prev.upgrades as any)[key] + 1 }
      }));
    }
  };

  const researchTech = (key: keyof TechState) => {
    const cost = (TECH_COSTS as any)[key](gameState.technologies[key]);
    if (gameState.resources.dataBits >= cost) {
      setGameState(prev => ({
        ...prev,
        resources: { ...prev.resources, dataBits: prev.resources.dataBits - cost },
        technologies: { ...prev.technologies, [key]: prev.technologies[key] + 1 }
      }));
    }
  };

  const getAiStrategy = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Sen Nebula Miner ekonomi danışmanısın. Vergi Oranı: %${(taxRate*100).toFixed(0)}, Kredi: ${gameState.credits}, Demir Talebi: ${gameState.market.iron.demand}. Oyuncuya kısa, teknolojik terimlerle dolu bir borsa taktiği ver.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiAdvice(response.text || "Veri hattı meşgul.");
    } catch { setAiAdvice("Derin uzay sinyal kaybı."); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <header className="glass rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-white/5 shadow-2xl relative">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl shadow-lg shadow-cyan-900/20">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="orbitron text-2xl font-black tracking-tight text-white uppercase italic">Nebula <span className="text-cyan-400">Trading Hub</span></h1>
              <p className="text-[10px] font-mono text-slate-500 tracking-[0.2em] flex items-center gap-2">
                <span className={`w-2 h-2 ${isSaving ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} rounded-full`} /> 
                {isSaving ? 'SYNCING...' : 'CLOUD SYNCED'} | PILOT: {currentUser.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900/80 px-6 py-3 rounded-2xl border border-yellow-500/20 shadow-inner flex flex-col items-end">
              <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Global Balance</span>
              <span className="orbitron text-lg font-bold text-yellow-400">{Math.floor(gameState.credits).toLocaleString()} <span className="text-[10px]">CR</span></span>
            </div>
            <button onClick={() => setCurrentUser(null)} className="p-4 hover:bg-red-500/10 rounded-2xl text-slate-600 hover:text-red-400 transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <section className="bg-cyan-950/20 border-y border-cyan-500/10 p-4 overflow-hidden relative">
          <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
            {(Object.entries(gameState.market) as [string, MarketState[string]][]).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3 font-mono text-xs uppercase tracking-tighter">
                <span className="text-slate-500">{key}:</span>
                <span className={val.trend === 'up' ? 'text-green-400' : 'text-red-400'}>
                  {val.price} CR {val.trend === 'up' ? '↑' : '↓'}
                </span>
                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500/50" style={{ width: `${val.demand}%` }} />
                </div>
              </div>
            ))}
            <span className="text-slate-600 ml-10">| CLOUD CONNECTED | SECTOR STABILITY: NOMINAL |</span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 flex flex-col gap-6">
             <div className="glass rounded-3xl p-6 border border-purple-500/20 bg-purple-500/5 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="orbitron text-xs font-black text-purple-400 uppercase tracking-widest">AI Consultant</h3>
                  <Target size={16} className="text-purple-500 animate-spin-slow" />
                </div>
                <div className="bg-black/40 p-4 rounded-xl mb-4 border border-purple-500/10 min-h-[120px]">
                  <p className="text-xs text-slate-300 italic font-mono leading-relaxed">"{aiAdvice}"</p>
                </div>
                <button onClick={getAiStrategy} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black orbitron text-[10px] rounded-xl transition-all shadow-lg shadow-purple-900/20 active:scale-95">
                  RUN ANALYSIS
                </button>
             </div>
          </aside>

          <main className="lg:col-span-3 flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <ResourceCard icon={<Database />} label="Iron" val={gameState.resources.iron} color="text-slate-400" limit={currentStorageLimit} />
               <ResourceCard icon={<Zap />} label="Plasma" val={gameState.resources.plasma} color="text-purple-400" limit={currentStorageLimit} />
               <ResourceCard icon={<Rocket />} label="Crystal" val={gameState.resources.crystal} color="text-cyan-400" limit={currentStorageLimit} />
               <ResourceCard icon={<Binary />} label="Data Bits" val={gameState.resources.dataBits} color="text-blue-400" />
            </div>

            <nav className="flex bg-slate-900/50 p-1 rounded-2xl self-start border border-white/5">
              <NavBtn active={activeTab === 'mine'} onClick={() => setActiveTab('mine')} icon={<Pickaxe />} label="Mine" />
              <NavBtn active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} icon={<ShoppingBag />} label="Upgrades" />
              <NavBtn active={activeTab === 'tech'} onClick={() => setActiveTab('tech')} icon={<Microchip />} label="Research" />
              <NavBtn active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<BarChart3 />} label="Market" />
            </nav>

            <div className="flex-1">
              {activeTab === 'mine' && (
                <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in duration-500">
                  <div className="relative group mb-12">
                     <div className="absolute -inset-10 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all animate-pulse" />
                     <button onClick={mineManual} className="relative w-56 h-56 md:w-72 md:h-72 glass border-4 border-slate-700/50 rounded-full flex flex-col items-center justify-center gap-3 hover:scale-105 active:scale-90 transition-all shadow-2xl">
                        <div className="absolute inset-0 border-[20px] border-t-cyan-500/20 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow" />
                        <Pickaxe size={48} className="text-cyan-400" />
                        <span className="orbitron text-sm font-black text-white tracking-widest">ASTEROID CORE</span>
                        <span className="font-mono text-[10px] text-cyan-600">CORE FRAGMENTS DETECTED</span>
                     </button>
                  </div>
                  <div className="grid grid-cols-3 gap-8 text-center">
                    <ProductionStat label="Iron" val={gameState.upgrades.autoMiners} />
                    <ProductionStat label="Plasma" val={gameState.upgrades.plasmaExtractors * 0.5} />
                    <ProductionStat label="Data" val={gameState.upgrades.researchHubs * 0.2} />
                  </div>
                </div>
              )}

              {activeTab === 'shop' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                  <ShopItem title="Hyper-Pickaxe" lvl={gameState.upgrades.pickaxePower} cost={UPGRADE_COSTS.pickaxePower(gameState.upgrades.pickaxePower)} canBuy={gameState.credits >= UPGRADE_COSTS.pickaxePower(gameState.upgrades.pickaxePower)} onBuy={() => buyUpgrade('pickaxePower')} icon={<Pickaxe className="text-cyan-400" />} />
                  <ShopItem title="Mining Drones" lvl={gameState.upgrades.autoMiners} cost={UPGRADE_COSTS.autoMiners(gameState.upgrades.autoMiners)} canBuy={gameState.credits >= UPGRADE_COSTS.autoMiners(gameState.upgrades.autoMiners)} onBuy={() => buyUpgrade('autoMiners')} icon={<Cpu className="text-slate-400" />} />
                  <ShopItem title="Plasma Collector" lvl={gameState.upgrades.plasmaExtractors} cost={UPGRADE_COSTS.plasmaExtractors(gameState.upgrades.plasmaExtractors)} canBuy={gameState.credits >= UPGRADE_COSTS.plasmaExtractors(gameState.upgrades.plasmaExtractors)} onBuy={() => buyUpgrade('plasmaExtractors')} icon={<Zap className="text-purple-400" />} />
                  <ShopItem title="Research Node" lvl={gameState.upgrades.researchHubs} cost={UPGRADE_COSTS.researchHubs(gameState.upgrades.researchHubs)} canBuy={gameState.credits >= UPGRADE_COSTS.researchHubs(gameState.upgrades.researchHubs)} onBuy={() => buyUpgrade('researchHubs')} icon={<Binary className="text-blue-400" />} />
                  <ShopItem title="Cargo Terminal" lvl={gameState.upgrades.storageLevel} cost={UPGRADE_COSTS.storage(gameState.upgrades.storageLevel)} canBuy={gameState.credits >= UPGRADE_COSTS.storage(gameState.upgrades.storageLevel)} onBuy={() => buyUpgrade('storageLevel')} icon={<Database className="text-orange-400" />} />
                </div>
              )}

              {activeTab === 'tech' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in duration-500">
                  <TechItem title="Market AI Interface" desc="Reveals demand sensitivity metrics." lvl={gameState.technologies.marketAI} cost={TECH_COSTS.marketAI(gameState.technologies.marketAI)} canBuy={gameState.resources.dataBits >= TECH_COSTS.marketAI(gameState.technologies.marketAI)} onBuy={() => researchTech('marketAI')} icon={<TrendingUp />} />
                  <TechItem title="Trade Tax Optimization" desc="Reduces galactic sales tax by 3%." lvl={gameState.technologies.taxOptimization} cost={TECH_COSTS.taxOptimization(gameState.technologies.taxOptimization)} canBuy={gameState.resources.dataBits >= TECH_COSTS.taxOptimization(gameState.technologies.taxOptimization)} onBuy={() => researchTech('taxOptimization')} icon={<ArrowUpRight />} />
                  <TechItem title="Nano-Storage Clusters" desc="Increases capacity via compression." lvl={gameState.technologies.nanoStorage} cost={TECH_COSTS.nanoStorage(gameState.technologies.nanoStorage)} canBuy={gameState.resources.dataBits >= TECH_COSTS.nanoStorage(gameState.technologies.nanoStorage)} onBuy={() => researchTech('nanoStorage')} icon={<Settings />} />
                  <TechItem title="Neural Click Link" desc="Massive boost to manual mining." lvl={gameState.technologies.neuralMining} cost={TECH_COSTS.neuralMining(gameState.technologies.neuralMining)} canBuy={gameState.resources.dataBits >= TECH_COSTS.neuralMining(gameState.technologies.neuralMining)} onBuy={() => researchTech('neuralMining')} icon={<Target />} />
                </div>
              )}

              {activeTab === 'market' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
                  <MarketCard resource="iron" data={gameState.market.iron} amount={gameState.resources.iron} onSell={() => sellResource('iron')} icon={<Database />} tax={taxRate} showDemand={gameState.technologies.marketAI > 0} />
                  <MarketCard resource="plasma" data={gameState.market.plasma} amount={gameState.resources.plasma} onSell={() => sellResource('plasma')} icon={<Zap />} tax={taxRate} showDemand={gameState.technologies.marketAI > 0} />
                  <MarketCard resource="crystal" data={gameState.market.crystal} amount={gameState.resources.crystal} onSell={() => sellResource('crystal')} icon={<Rocket />} tax={taxRate} showDemand={gameState.technologies.marketAI > 0} />
                </div>
              )}
            </div>
          </main>
        </div>

        <footer className="text-center py-12 border-t border-slate-900">
           <p className="orbitron text-[9px] font-black text-slate-700 uppercase tracking-[0.5em]">Nebula Galactic Trading Protocol | Cloud Persistence Active</p>
        </footer>
      </div>
    </div>
  );
};

// --- Subcomponents ---
const ResourceCard = ({ icon, label, val, color, limit }: any) => (
  <div className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-4 bg-slate-900/20">
    <div className={`p-3 bg-slate-950 rounded-xl shadow-inner ${color}`}>{React.cloneElement(icon, { size: 18 })}</div>
    <div className="flex flex-col">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <span className={`orbitron text-xs font-bold ${color}`}>
        {Math.floor(val).toLocaleString()}
        {limit && <span className="text-[9px] text-slate-700 font-normal"> / {limit.toLocaleString()}</span>}
      </span>
    </div>
  </div>
);

const ProductionStat = ({ label, val }: any) => (
  <div className="flex flex-col">
    <span className="text-[9px] text-slate-600 uppercase font-bold mb-1 tracking-tighter">{label} / sec</span>
    <span className="orbitron text-lg font-black text-white">+{val.toFixed(1)}</span>
  </div>
);

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all orbitron text-[10px] font-black ${active ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-900/20' : 'text-slate-500 hover:text-slate-300'}`}>
    {React.cloneElement(icon, { size: 14 })}
    {label.toUpperCase()}
  </button>
);

const ShopItem = ({ title, lvl, cost, canBuy, onBuy, icon }: any) => (
  <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-4 group hover:border-cyan-500/20 transition-all bg-slate-900/20">
    <div className="flex justify-between items-center">
      <div className="p-3 bg-slate-950 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
      <span className="orbitron text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full">LVL {lvl}</span>
    </div>
    <h4 className="font-bold text-slate-200 text-sm">{title}</h4>
    <button onClick={onBuy} disabled={!canBuy} className={`w-full py-3 rounded-xl font-black orbitron text-[10px] transition-all ${canBuy ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
      UPGRADE: {cost.toLocaleString()} CR
    </button>
  </div>
);

const TechItem = ({ title, desc, lvl, cost, canBuy, onBuy, icon }: any) => (
  <div className="glass p-5 rounded-2xl border border-blue-500/10 flex flex-col gap-4 group hover:border-blue-500/30 transition-all bg-blue-500/5">
    <div className="flex justify-between items-center">
      <div className="p-3 bg-slate-950 rounded-xl group-hover:rotate-12 transition-transform text-blue-400">{React.cloneElement(icon, { size: 20 })}</div>
      <span className="orbitron text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">TIER {lvl}</span>
    </div>
    <div>
      <h4 className="font-bold text-slate-100 text-sm mb-1">{title}</h4>
      <p className="text-[10px] text-slate-500 leading-relaxed font-mono">{desc}</p>
    </div>
    <button onClick={onBuy} disabled={!canBuy} className={`w-full py-3 rounded-xl font-black orbitron text-[10px] transition-all ${canBuy ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
      RESEARCH: {cost.toLocaleString()} BITS
    </button>
  </div>
);

const MarketCard = ({ resource, data, amount, onSell, icon, tax, showDemand }: any) => (
  <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col gap-6 bg-slate-900/20">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-slate-950 rounded-2xl text-slate-400">{icon}</div>
      <span className="orbitron font-black text-slate-100 uppercase tracking-tighter">{resource}</span>
    </div>
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-500 uppercase font-black">Price / Unit</span>
          <div className="flex items-center gap-2">
            <span className={`orbitron text-xl font-black ${data.trend === 'up' ? 'text-green-400' : data.trend === 'down' ? 'text-red-400' : 'text-yellow-500'}`}>
              {data.price} <span className="text-[10px]">CR</span>
            </span>
            {data.trend === 'up' ? <TrendingUp size={16} className="text-green-400" /> : <TrendingDown size={16} className="text-red-400" />}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-slate-500 uppercase font-black">Holdings</span>
          <p className="orbitron font-bold text-white text-sm">{Math.floor(amount).toLocaleString()}</p>
        </div>
      </div>
      {showDemand && (
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-mono text-slate-400">
            <span>MARKET DEMAND</span>
            <span>{Math.floor(data.demand)}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${data.demand}%` }} />
          </div>
        </div>
      )}
    </div>
    <div className="pt-4 border-t border-white/5">
      <div className="flex justify-between text-[10px] font-mono mb-4 text-slate-500">
        <span>EST. NET REVENUE:</span>
        <span className="text-green-400 font-black">+{(amount * data.price * (1-tax)).toFixed(0)} CR</span>
      </div>
      <button onClick={onSell} disabled={amount <= 0} className={`w-full py-4 rounded-2xl font-black orbitron text-[11px] transition-all ${amount > 0 ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
        SELL ALL CARGO
      </button>
      <p className="text-[8px] text-center mt-2 text-slate-600 font-mono uppercase tracking-widest italic">Includes {(tax*100).toFixed(0)}% Galactic Tax</p>
    </div>
  </div>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
