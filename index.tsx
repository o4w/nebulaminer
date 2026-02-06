
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  RefreshCw,
  Trophy,
  AlertCircle,
  Star,
  Users,
  PlusCircle,
  XCircle,
  ArrowRightLeft,
  CloudOff,
  Loader2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

/**
 * --- SUPABASE KURULUM TALİMATI ---
 * Supabase Dashboard -> SQL Editor kısmına aşağıdaki kodları yapıştırıp 'Run' butonuna basın:
 * 
 * create table if not exists users (
 *   id text primary key,
 *   password text not null,
 *   game_state jsonb default '{}'::jsonb,
 *   updated_at timestamp with time zone default now()
 * );
 * 
 * create table if not exists market_listings (
 *   id uuid default gen_random_uuid() primary key,
 *   seller_id text references users(id) on delete cascade,
 *   resource_type text not null,
 *   amount double precision not null,
 *   price double precision not null,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * alter table users disable row level security;
 * alter table market_listings disable row level security;
 */

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
  };
}

interface CosmicEvent {
  id: string;
  name: string;
  description: string;
  effect: 'plasma_boost' | 'iron_crash' | 'research_surge' | 'none';
  duration: number;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  requirement: { type: keyof ResourceState | 'credits'; amount: number };
  reward: number;
  completed: boolean;
}

interface MarketListing {
  id: string;
  seller_id: string;
  resource_type: keyof typeof BASE_MARKET_PRICES;
  amount: number;
  price: number;
  created_at: string;
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
  missions: Mission[];
  lastUpdate: number;
}

interface UserData {
  id: string;
  password: string;
  gameState: GameState;
}

interface LeaderboardEntry {
  id: string;
  credits: number;
}

// --- Constants ---
const BASE_MARKET_PRICES = { iron: 2, plasma: 15, crystal: 50 };
const MARKET_TAX_BASE = 0.20;

const INITIAL_MISSIONS: Mission[] = [
  { id: '1', title: 'İlk Adım', description: '500 Demir topla.', requirement: { type: 'iron', amount: 500 }, reward: 250, completed: false },
  { id: '2', title: 'Enerji Ağı', description: '100 Plazma topla.', requirement: { type: 'plasma', amount: 100 }, reward: 1000, completed: false },
  { id: '3', title: 'Kripto Tüccarı', description: '5000 Kredi biriktir.', requirement: { type: 'credits', amount: 5000 }, reward: 2000, completed: false }
];

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
  missions: INITIAL_MISSIONS,
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
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) {
        console.error("Supabase GetUser Error:", error.message);
        return null;
      }
      return {
        id: data.id,
        password: data.password,
        gameState: data.game_state
      };
    } catch (e) {
      return null;
    }
  },
  saveUser: async (user: UserData) => {
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      password: user.password,
      game_state: user.gameState
    }, { onConflict: 'id' });
    if (error) {
      console.error("Supabase SaveUser Error:", error.message);
    }
  },
  updateGameState: async (userId: string, state: GameState) => {
    const { error } = await supabase.from('users').upsert({ id: userId, game_state: state }, { onConflict: 'id' });
    if (error) {
      console.error("Supabase UpdateGameState Error:", error.message);
      return error;
    }
    return null;
  },
  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, game_state->credits')
      .order('game_state->credits', { ascending: false })
      .limit(10);
    
    if (error) return [];
    return (data || []).map(u => ({ id: u.id, credits: Number(u.credits || 0) }));
  },
  getListings: async (): Promise<MarketListing[]> => {
    const { data, error } = await supabase
      .from('market_listings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },
  postListing: async (listing: Omit<MarketListing, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('market_listings').insert(listing);
    if (error) console.error("Supabase PostListing Error:", error.message);
  },
  cancelListing: async (listingId: string) => {
    const { error } = await supabase.from('market_listings').delete().eq('id', listingId);
    if (error) console.error("Supabase CancelListing Error:", error.message);
  },
  purchaseListing: async (listing: MarketListing, buyerId: string) => {
    const seller = await DBService.getUser(listing.seller_id);
    if (!seller) throw new Error("Satıcı bulunamadı.");
    const sellerState = seller.gameState;
    sellerState.credits += listing.price;
    await DBService.updateGameState(listing.seller_id, sellerState);
    await DBService.cancelListing(listing.id);
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
          setError('Geçersiz kimlik veya şifre.');
        }
      }
    } catch (err) {
      setError('Veritabanı bağlantısı kurulamadı.');
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
          <h1 className="orbitron text-2xl font-black text-white tracking-tighter uppercase">Nebula OS v2.7</h1>
          <p className="text-slate-500 text-xs mt-2 font-mono italic">Persistence Engine Enabled</p>
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const gameStateRef = useRef(gameState);
  const [activeTab, setActiveTab] = useState<'mine' | 'shop' | 'tech' | 'market' | 'social' | 'trade'>('mine');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<CosmicEvent | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number, text: string, x: number, y: number }[]>([]);

  // Oturum Restorasyonu
  useEffect(() => {
    const restoreSession = async () => {
      const savedPilotId = localStorage.getItem('nebula_pilot_id');
      if (savedPilotId) {
        const user = await DBService.getUser(savedPilotId);
        if (user) {
          handleLogin(user);
        }
      }
      setIsInitializing(false);
    };
    restoreSession();
  }, []);

  const handleLogin = (user: UserData) => {
    localStorage.setItem('nebula_pilot_id', user.id);
    setCurrentUser(user); 
    const safeState = {
      ...INITIAL_GAME_STATE,
      ...user.gameState,
      resources: { ...INITIAL_GAME_STATE.resources, ...(user.gameState?.resources || {}) },
      upgrades: { ...INITIAL_GAME_STATE.upgrades, ...(user.gameState?.upgrades || {}) },
      technologies: { ...INITIAL_GAME_STATE.technologies, ...(user.gameState?.technologies || {}) },
      market: { ...INITIAL_GAME_STATE.market, ...(user.gameState?.market || {}) },
      missions: user.gameState?.missions || INITIAL_MISSIONS
    };
    setGameState(safeState); 
  };

  const handleLogout = () => {
    localStorage.removeItem('nebula_pilot_id');
    setCurrentUser(null);
  };

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const [p2pForm, setP2pForm] = useState<{ resource: keyof typeof BASE_MARKET_PRICES, amount: number, price: number }>({
    resource: 'iron',
    amount: 0,
    price: 0
  });

  const taxRate = useMemo(() => 
    Math.max(0.05, MARKET_TAX_BASE - (gameState.technologies.taxOptimization * 0.03)), 
    [gameState.technologies.taxOptimization]
  );

  const currentStorageLimit = useMemo(() => 
    STORAGE_LIMITS(gameState.upgrades.storageLevel, gameState.technologies.nanoStorage),
    [gameState.upgrades.storageLevel, gameState.technologies.nanoStorage]
  );

  // --- Olay Sistemi ---
  useEffect(() => {
    if (!currentUser) return;
    const eventInterval = setInterval(() => {
      if (activeEvent) return;
      if (Math.random() < 0.2) { 
        const events: CosmicEvent[] = [
          { id: '1', name: 'Güneş Fırtınası', description: 'Plazma üretimi %100 arttı!', effect: 'plasma_boost', duration: 30 },
          { id: '2', name: 'Meteor Yağmuru', description: 'Demir fiyatları dip yaptı!', effect: 'iron_crash', duration: 30 },
          { id: '3', name: 'Araştırma Patlaması', description: 'Veri üretimi %200 arttı!', effect: 'research_surge', duration: 30 }
        ];
        const selected = events[Math.floor(Math.random() * events.length)];
        setActiveEvent(selected);
        setTimeout(() => setActiveEvent(null), selected.duration * 1000);
      }
    }, 45000);
    return () => clearInterval(eventInterval);
  }, [currentUser, activeEvent]);

  // --- Üretim Döngüsü ---
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      setGameState(prev => {
        const now = Date.now();
        const delta = (now - prev.lastUpdate) / 1000;
        let plasmaMult = 1;
        let researchMult = 1;
        if (activeEvent?.effect === 'plasma_boost') plasmaMult = 2;
        if (activeEvent?.effect === 'research_surge') researchMult = 3;

        return {
          ...prev,
          resources: {
            iron: Math.min(currentStorageLimit, prev.resources.iron + (prev.upgrades.autoMiners * 1 * delta)),
            plasma: Math.min(currentStorageLimit, prev.resources.plasma + (prev.upgrades.plasmaExtractors * 0.5 * delta * plasmaMult)),
            crystal: Math.min(currentStorageLimit, prev.resources.crystal + (prev.upgrades.crystalRefineries * 0.1 * delta)),
            dataBits: prev.resources.dataBits + (prev.upgrades.researchHubs * 0.2 * delta * researchMult)
          },
          lastUpdate: now
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser, currentStorageLimit, activeEvent]);

  // --- Market Döngüsü ---
  useEffect(() => {
    if (!currentUser) return;
    const marketInterval = setInterval(() => {
      setGameState(prev => {
        const newMarket = { ...prev.market };
        (Object.keys(BASE_MARKET_PRICES) as Array<keyof typeof BASE_MARKET_PRICES>).forEach(key => {
          const base = (BASE_MARKET_PRICES as any)[key];
          const current = prev.market[key]?.price || base;
          let eventModifier = 1;
          if (activeEvent?.effect === 'iron_crash' && key === 'iron') eventModifier = 0.4;
          const demandFactor = 0.5 + (Math.random() * ((prev.market[key]?.demand || 50) / 50));
          const nextPrice = Math.max(0.5, Math.round(base * demandFactor * (0.8 + Math.random() * 0.4) * eventModifier * 10) / 10);
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (nextPrice > current) trend = 'up';
          else if (nextPrice < current) trend = 'down';
          newMarket[key] = { price: nextPrice, trend, demand: Math.max(10, Math.min(100, (prev.market[key]?.demand || 50) + (Math.random() * 20 - 10))) };
        });
        return { ...prev, market: newMarket };
      });
    }, 15000);
    return () => clearInterval(marketInterval);
  }, [currentUser, activeEvent]);

  // --- Market Sync ---
  const syncGlobalData = useCallback(() => {
    if (activeTab === 'social') DBService.getLeaderboard().then(setLeaderboard);
    if (activeTab === 'trade') DBService.getListings().then(setMarketListings);
  }, [activeTab]);

  useEffect(() => {
    syncGlobalData();
    const syncInterval = setInterval(syncGlobalData, 15000);
    return () => clearInterval(syncInterval);
  }, [activeTab, syncGlobalData]);

  // --- Auto-Save Fix ---
  useEffect(() => {
    if (!currentUser) return;
    const saveInterval = setInterval(async () => {
      setIsSaving(true);
      const error = await DBService.updateGameState(currentUser.id, gameStateRef.current);
      setIsSaving(false);
      if (error) {
        setSaveError(true);
      } else {
        setSaveError(false);
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 15000);
    return () => clearInterval(saveInterval);
  }, [currentUser]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <div className="w-24 h-24 bg-cyan-500/10 rounded-full border border-cyan-500/30 flex items-center justify-center animate-pulse">
           <Globe className="text-cyan-400 w-12 h-12" />
        </div>
        <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-[0.3em]">
          <Loader2 className="animate-spin" size={16} /> Connecting to Nebula Grid...
        </div>
      </div>
    );
  }

  if (!currentUser) return <AuthScreen onLogin={handleLogin} />;

  const mineManual = (e: React.MouseEvent) => {
    if (gameState.resources.iron < currentStorageLimit) {
      const power = gameState.upgrades.pickaxePower + (gameState.technologies.neuralMining * 2);
      const newText = { id: Date.now(), text: `+${power} Demir`, x: e.clientX, y: e.clientY };
      setFloatingTexts(prev => [...prev, newText]);
      setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== newText.id)), 1000);
      setGameState(prev => ({
        ...prev,
        resources: { ...prev.resources, iron: Math.min(currentStorageLimit, prev.resources.iron + power) }
      }));
    }
  };

  const sellResource = (type: keyof typeof BASE_MARKET_PRICES) => {
    const amount = (gameState.resources as any)[type];
    if (amount <= 0) return;
    const taxedProfit = amount * (gameState.market[type]?.price || 0) * (1 - taxRate);
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

  const handlePostTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const { resource, amount, price } = p2pForm;
    if (gameState.resources[resource] < amount || amount <= 0 || price <= 0) return;
    setGameState(prev => ({
      ...prev,
      resources: { ...prev.resources, [resource]: prev.resources[resource] - amount }
    }));
    await DBService.postListing({ seller_id: currentUser.id, resource_type: resource, amount, price });
    syncGlobalData();
    setP2pForm(prev => ({ ...prev, amount: 0, price: 0 }));
  };

  const handleBuyListing = async (listing: MarketListing) => {
    if (gameState.credits < listing.price) return;
    if (gameState.resources[listing.resource_type] + listing.amount > currentStorageLimit) {
      alert("Depo dolu! Kapasiteyi artır.");
      return;
    }
    try {
      await DBService.purchaseListing(listing, currentUser.id);
      setGameState(prev => ({
        ...prev,
        credits: prev.credits - listing.price,
        resources: { ...prev.resources, [listing.resource_type]: prev.resources[listing.resource_type] + listing.amount }
      }));
      syncGlobalData();
    } catch (err) {
      alert("Hata: " + (err as Error).message);
    }
  };

  const handleCancelListing = async (listing: MarketListing) => {
    await DBService.cancelListing(listing.id);
    setGameState(prev => ({
      ...prev,
      resources: { ...prev.resources, [listing.resource_type]: prev.resources[listing.resource_type] + listing.amount }
    }));
    syncGlobalData();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      {floatingTexts.map(t => (
        <div key={t.id} className="fixed pointer-events-none animate-bounce text-cyan-400 orbitron text-xs font-black z-50" style={{ left: t.x, top: t.y }}>
          {t.text}
        </div>
      ))}

      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <header className="glass rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-white/5 shadow-2xl relative">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl shadow-lg shadow-cyan-900/20">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="orbitron text-2xl font-black tracking-tight text-white uppercase italic">Nebula <span className="text-cyan-400">Trading Hub</span></h1>
              <div className="text-[10px] font-mono text-slate-500 tracking-[0.2em] flex flex-col gap-1 mt-1">
                <p className="flex items-center gap-2">
                  <span className={`w-2 h-2 ${saveError ? 'bg-red-500 animate-pulse' : isSaving ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} rounded-full`} /> 
                  {saveError ? 'CLOUD SYNC FAILED!' : isSaving ? 'DATABASE SYNCING...' : 'DATABASE PERSISTENT'} | PILOT: {currentUser.id}
                </p>
                {lastSaved && <p className="text-[8px] text-slate-600 uppercase">Last Success: {lastSaved}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/80 px-6 py-3 rounded-2xl border border-yellow-500/20 shadow-inner flex flex-col items-end">
              <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Global Balance</span>
              <span className="orbitron text-lg font-bold text-yellow-400">{Math.floor(gameState.credits).toLocaleString()} <span className="text-[10px]">CR</span></span>
            </div>
            <button onClick={handleLogout} className="p-4 hover:bg-red-500/10 rounded-2xl text-slate-600 hover:text-red-400 transition-all flex items-center gap-2 group">
              <LogOut size={20} />
              <span className="hidden group-hover:inline text-[10px] orbitron font-bold">DISCONNECT</span>
            </button>
          </div>
        </header>

        <section className="bg-cyan-950/20 border-y border-cyan-500/10 p-4 overflow-hidden relative">
          <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
            {(Object.entries(gameState.market || {}) as [string, MarketState[string]][]).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3 font-mono text-xs uppercase tracking-tighter">
                <span className="text-slate-500">{key}:</span>
                <span className={val?.trend === 'up' ? 'text-green-400' : 'text-red-400'}>
                  {val?.price || 0} CR {val?.trend === 'up' ? '↑' : '↓'}
                </span>
                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500/50" style={{ width: `${val?.demand || 50}%` }} />
                </div>
              </div>
            ))}
            <span className="text-slate-600 ml-10">| CLOUD PERSISTENCE ACTIVE | SECTOR STATUS: {saveError ? 'CONNECTION ERROR' : 'OPTIMAL'} |</span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 flex flex-col gap-6">
             <div className="glass rounded-3xl p-6 border border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="orbitron text-xs font-black text-yellow-500 uppercase tracking-widest">Active Missions</h3>
                  <Target size={16} className="text-yellow-500" />
                </div>
                <div className="space-y-3">
                  {(gameState.missions || []).map(m => (
                    <div key={m.id} className={`p-3 rounded-xl border ${m.completed ? 'bg-green-500/10 border-green-500/20 opacity-50' : 'bg-black/40 border-white/5'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black orbitron text-white">{m.title}</span>
                        {m.completed && <Star size={10} className="text-yellow-400 fill-yellow-400" />}
                      </div>
                      <p className="text-[8px] text-slate-500 font-mono italic">{m.description}</p>
                    </div>
                  ))}
                </div>
             </div>
             
             <div className="glass rounded-3xl p-6 border border-cyan-500/10 text-center">
                <p className="text-[9px] font-mono text-slate-500 uppercase mb-2">Diagnostic Tools</p>
                <button 
                  onClick={async () => {
                    setIsSaving(true);
                    const error = await DBService.updateGameState(currentUser.id, gameStateRef.current);
                    setIsSaving(false);
                    if (error) {
                      setSaveError(true);
                      alert(`Kayıt Hatası: ${error.message}`);
                    } else {
                      setSaveError(false);
                      setLastSaved(new Date().toLocaleTimeString());
                      alert("Başarıyla buluta kaydedildi.");
                    }
                  }}
                  className={`w-full py-2 rounded-xl border transition-colors text-[10px] orbitron font-bold flex items-center justify-center gap-2 ${saveError ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-slate-900 border-slate-700 text-cyan-400 hover:bg-slate-800'}`}
                >
                  {saveError ? <CloudOff size={14} /> : <RefreshCw size={14} className={isSaving ? 'animate-spin' : ''} />} 
                  FORCE SYNC
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

            <nav className="flex bg-slate-900/50 p-1 rounded-2xl self-start border border-white/5 overflow-x-auto max-w-full">
              <NavBtn active={activeTab === 'mine'} onClick={() => setActiveTab('mine')} icon={<Pickaxe />} label="Mine" />
              <NavBtn active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} icon={<ShoppingBag />} label="Upgrades" />
              <NavBtn active={activeTab === 'tech'} onClick={() => setActiveTab('tech')} icon={<Microchip />} label="Research" />
              <NavBtn active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<BarChart3 />} label="Market" />
              <NavBtn active={activeTab === 'trade'} onClick={() => setActiveTab('trade')} icon={<ArrowRightLeft />} label="Trade" />
              <NavBtn active={activeTab === 'social'} onClick={() => setActiveTab('social')} icon={<Trophy />} label="Social" />
            </nav>

            <div className="flex-1 min-h-[500px]">
              {activeTab === 'mine' && (
                <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in duration-500">
                  <div className="relative group mb-12">
                     <div className="absolute -inset-10 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all animate-pulse" />
                     <button onClick={mineManual} className="relative w-56 h-56 md:w-72 md:h-72 glass border-4 border-slate-700/50 rounded-full flex flex-col items-center justify-center gap-3 hover:scale-105 active:scale-90 transition-all shadow-2xl overflow-hidden">
                        <div className="absolute inset-0 border-[20px] border-t-cyan-500/20 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow" />
                        <Pickaxe size={48} className="text-cyan-400" />
                        <span className="orbitron text-sm font-black text-white tracking-widest uppercase">Asteroid Core</span>
                        <span className="font-mono text-[10px] text-cyan-600 uppercase tracking-widest">Manual Node</span>
                     </button>
                  </div>
                  <div className="grid grid-cols-3 gap-8 text-center">
                    <ProductionStat label="Iron" val={gameState.upgrades.autoMiners} />
                    <ProductionStat label="Plasma" val={gameState.upgrades.plasmaExtractors * 0.5 * (activeEvent?.effect === 'plasma_boost' ? 2 : 1)} />
                    <ProductionStat label="Data" val={gameState.upgrades.researchHubs * 0.2 * (activeEvent?.effect === 'research_surge' ? 3 : 1)} />
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

              {activeTab === 'trade' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                  <div className="glass p-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/5">
                    <h2 className="orbitron text-sm font-black text-cyan-400 mb-6 flex items-center gap-2 uppercase tracking-widest">
                      <PlusCircle size={16} /> Create Trade Offer
                    </h2>
                    <form onSubmit={handlePostTrade} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] orbitron font-bold text-slate-500 tracking-widest uppercase">Resource</label>
                        <select value={p2pForm.resource} onChange={e => setP2pForm(p => ({...p, resource: e.target.value as any}))} className="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-cyan-50 focus:border-cyan-500 outline-none font-mono text-sm">
                          <option value="iron">Iron</option>
                          <option value="plasma">Plasma</option>
                          <option value="crystal">Crystal</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] orbitron font-bold text-slate-500 tracking-widest uppercase">Amount</label>
                        <input type="number" placeholder="0" value={p2pForm.amount || ''} onChange={e => setP2pForm(p => ({...p, amount: Number(e.target.value)}))} className="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-cyan-50 focus:border-cyan-500 outline-none font-mono text-sm" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] orbitron font-bold text-slate-500 tracking-widest uppercase">Price (CR)</label>
                        <input type="number" placeholder="0" value={p2pForm.price || ''} onChange={e => setP2pForm(p => ({...p, price: Number(e.target.value)}))} className="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-cyan-50 focus:border-cyan-500 outline-none font-mono text-sm" />
                      </div>
                      <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-black orbitron text-[11px] h-[46px] rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-widest">List Offer</button>
                    </form>
                  </div>

                  <div className="glass p-6 rounded-3xl border border-white/5">
                    <h2 className="orbitron text-sm font-black text-slate-100 mb-6 flex items-center gap-2 uppercase tracking-widest">
                      <Globe size={16} className="text-cyan-400" /> Galactic Market Board
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {marketListings.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-slate-600 font-mono text-xs uppercase tracking-widest">No active listings in sector.</div>
                      ) : marketListings.map(listing => (
                        <div key={listing.id} className={`p-5 rounded-2xl border transition-all ${listing.seller_id === currentUser.id ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-slate-900/50 border-white/5'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-950 rounded-lg text-cyan-400">
                                {listing.resource_type === 'iron' ? <Database size={16} /> : listing.resource_type === 'plasma' ? <Zap size={16} /> : <Rocket size={16} />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black orbitron uppercase">{listing.resource_type}</span>
                                <span className="text-[8px] font-mono text-slate-500 tracking-tighter">Pilot: {listing.seller_id}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-600">{new Date(listing.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">OFFER</span>
                              <span className="orbitron text-lg font-bold text-white">{listing.amount.toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">PRICE</span>
                              <span className="orbitron text-lg font-bold text-yellow-500">{listing.price.toLocaleString()} <span className="text-[10px]">CR</span></span>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/5">
                            {listing.seller_id === currentUser.id ? (
                              <button onClick={() => handleCancelListing(listing)} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 orbitron font-black text-[10px] rounded-xl flex items-center justify-center gap-2 tracking-widest uppercase"><XCircle size={14} /> Cancel Listing</button>
                            ) : (
                              <button onClick={() => handleBuyListing(listing)} disabled={gameState.credits < listing.price} className={`w-full py-3 orbitron font-black text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all tracking-widest uppercase ${gameState.credits >= listing.price ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}><ShoppingBag size={14} /> Accept Offer</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'market' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
                  <MarketCard resource="iron" data={gameState.market.iron} amount={gameState.resources.iron} onSell={() => sellResource('iron')} icon={<Database />} tax={taxRate} showDemand={gameState.technologies.marketAI > 0} />
                  <MarketCard resource="plasma" data={gameState.market.plasma} amount={gameState.resources.plasma} onSell={() => sellResource('plasma')} icon={<Zap />} tax={taxRate} showDemand={gameState.technologies.marketAI > 0} />
                  <MarketCard resource="crystal" data={gameState.market.crystal} amount={gameState.resources.crystal} onSell={() => sellResource('crystal')} icon={<Rocket />} tax={taxRate} showDemand={gameState.technologies.marketAI > 0} />
                </div>
              )}

              {activeTab === 'social' && (
                <div className="glass rounded-3xl p-8 border border-white/5 animate-in fade-in duration-500">
                   <div className="flex items-center gap-4 mb-8">
                     <Trophy size={32} className="text-yellow-400" />
                     <h2 className="orbitron text-xl font-black italic uppercase tracking-widest">Global Leaderboard</h2>
                   </div>
                   <div className="space-y-4">
                      {(leaderboard || []).length === 0 ? (
                        <div className="text-center py-10 text-slate-500 font-mono uppercase tracking-widest italic opacity-50">Establishing connection to persistence grid...</div>
                      ) : (leaderboard || []).map((entry, idx) => (
                        <div key={entry.id} className={`flex items-center justify-between p-4 rounded-2xl border ${entry.id === currentUser.id ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-900/50 border-white/5'}`}>
                           <div className="flex items-center gap-4">
                             <span className="orbitron text-xs font-black text-slate-500 tracking-tighter">#{idx + 1}</span>
                             <div className="flex flex-col">
                               <span className="orbitron text-sm font-bold text-white uppercase tracking-tighter">{entry.id} {entry.id === currentUser.id && <span className="text-[10px] text-cyan-400 tracking-normal">(YOU)</span>}</span>
                               <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Certified Pilot</span>
                             </div>
                           </div>
                           <span className="orbitron font-black text-yellow-500">{Math.floor(entry.credits || 0).toLocaleString()} <span className="text-[9px]">CR</span></span>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </main>
        </div>

        <footer className="text-center py-12 border-t border-slate-900">
           <p className="orbitron text-[9px] font-black text-slate-700 uppercase tracking-[0.5em]">Nebula Galactic Protocol | Persistence v2.7 Enabled</p>
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
        {Math.floor(val || 0).toLocaleString()}
        {limit && <span className="text-[9px] text-slate-700 font-normal italic"> / {limit.toLocaleString()}</span>}
      </span>
    </div>
  </div>
);

const ProductionStat = ({ label, val }: any) => (
  <div className="flex flex-col">
    <span className="text-[9px] text-slate-600 uppercase font-bold mb-1 tracking-tighter">{label} / SEC</span>
    <span className="orbitron text-lg font-black text-white">+{(val || 0).toFixed(1)}</span>
  </div>
);

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all orbitron text-[10px] font-black shrink-0 tracking-widest ${active ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-900/20' : 'text-slate-500 hover:text-slate-300'}`}>
    {React.cloneElement(icon, { size: 14 })}
    {label.toUpperCase()}
  </button>
);

const ShopItem = ({ title, lvl, cost, canBuy, onBuy, icon }: any) => (
  <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-4 group hover:border-cyan-500/20 transition-all bg-slate-900/20">
    <div className="flex justify-between items-center">
      <div className="p-3 bg-slate-950 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
      <span className="orbitron text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full uppercase tracking-tighter">LVL {lvl}</span>
    </div>
    <h4 className="font-bold text-slate-200 text-sm uppercase tracking-tight">{title}</h4>
    <button onClick={onBuy} disabled={!canBuy} className={`w-full py-3 rounded-xl font-black orbitron text-[10px] transition-all tracking-widest ${canBuy ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
      UPGRADE: {(cost || 0).toLocaleString()} CR
    </button>
  </div>
);

const TechItem = ({ title, desc, lvl, cost, canBuy, onBuy, icon }: any) => (
  <div className="glass p-5 rounded-2xl border border-blue-500/10 flex flex-col gap-4 group hover:border-blue-500/30 transition-all bg-blue-500/5">
    <div className="flex justify-between items-center">
      <div className="p-3 bg-slate-950 rounded-xl group-hover:rotate-12 transition-transform text-blue-400">{React.cloneElement(icon, { size: 20 })}</div>
      <span className="orbitron text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full uppercase tracking-tighter">TIER {lvl}</span>
    </div>
    <div>
      <h4 className="font-bold text-slate-100 text-sm mb-1 uppercase tracking-tight">{title}</h4>
      <p className="text-[10px] text-slate-500 leading-relaxed font-mono italic">{desc}</p>
    </div>
    <button onClick={onBuy} disabled={!canBuy} className={`w-full py-3 rounded-xl font-black orbitron text-[10px] transition-all tracking-widest ${canBuy ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
      RESEARCH: {(cost || 0).toLocaleString()} BITS
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
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Price / Unit</span>
          <div className="flex items-center gap-2">
            <span className={`orbitron text-xl font-black ${data?.trend === 'up' ? 'text-green-400' : data?.trend === 'down' ? 'text-red-400' : 'text-yellow-500'}`}>
              {data?.price || 0} <span className="text-[10px]">CR</span>
            </span>
            {data?.trend === 'up' ? <TrendingUp size={16} className="text-green-400" /> : <TrendingDown size={16} className="text-red-400" />}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Holdings</span>
          <p className="orbitron font-bold text-white text-sm">{Math.floor(amount || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
    <div className="pt-4 border-t border-white/5">
      <div className="flex justify-between text-[10px] font-mono mb-4 text-slate-500 uppercase tracking-widest italic opacity-60">
        <span>Est. Net Revenue:</span>
        <span className="text-green-400 font-black">+{((amount || 0) * (data?.price || 0) * (1-tax)).toFixed(0)} CR</span>
      </div>
      <button onClick={onSell} disabled={!amount || amount <= 0} className={`w-full py-4 rounded-2xl font-black orbitron text-[11px] transition-all tracking-widest uppercase ${amount > 0 ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
        Sell All Cargo
      </button>
      <p className="text-[8px] text-center mt-2 text-slate-600 font-mono uppercase tracking-widest italic opacity-40">Tax: {(tax*100).toFixed(0)}%</p>
    </div>
  </div>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
