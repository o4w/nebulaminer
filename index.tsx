
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
  Loader2,
  Info,
  User,
  Mail,
  Lock,
  Camera,
  Save,
  ShieldCheck,
  Compass,
  Flame,
  MessageSquare,
  Bot,
  BrainCircuit,
  Timer,
  ChevronRight,
  Shield,
  Crosshair,
  Map as MapIcon,
  Sword,
  Activity,
  Box,
  ZapOff,
  ChevronUp,
  HardDrive,
  Handshake,
  Search,
  Check,
  X,
  History,
  UserPlus,
  LogIn,
  Gem,
  LockKeyhole,
  Radar,
  ChevronDown,
  Waves,
  Zap as PowerIcon,
  FastForward,
  ShieldAlert,
  Fingerprint,
  Medal,
  Terminal
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// --- Başlatma ---
const SUPABASE_URL = 'https://slfxijiowcbqzhzlnhhh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VJ4oUTpjq-KbKecplM7mog_RR2lhNCz';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Tipler ---
interface Ship {
  id: string;
  type: 'miner' | 'defender' | 'hauler' | 'scout' | 'cruiser' | 'mothership';
  name: string;
  cost: { credits: number; iron: number; plasma: number; crystal: number };
  power: number; 
  description: string;
  ability: string;
}

interface Sector {
  id: string;
  name: string;
  type: 'core' | 'frontier' | 'void' | 'nebula' | 'anomaly';
  resourceMultiplier: number;
  risk: number;
  controlled: boolean;
  minLevel: number;
  deployedShips: { [key: string]: number };
}

interface GameState {
  credits: number;
  xp: number;
  level: number;
  resources: { iron: number; plasma: number; crystal: number; dataBits: number; darkMatter: number };
  upgrades: {
    pickaxePower: number;
    autoMiners: number;
    plasmaExtractors: number;
    crystalRefineries: number;
    researchHubs: number;
    storageLevel: number;
  };
  fleet: { [key: string]: number };
  sectors: Sector[];
  threatLevel: number; 
  lastUpdate: number;
  market: { [key: string]: { price: number; prevPrice: number; trend: 'up' | 'down' | 'stable' } };
  profile?: {
    callsign: string;
    motto: string;
    avatarId: string;
    joinedDate: number;
  };
  stats?: {
    totalCreditsEarned: number;
    totalShipsBuilt: number;
    sectorsLiberated: number;
  };
}

interface UserData {
  id: string;
  password: string;
  gameState: GameState;
}

interface TradeProposal {
  id: string;
  sender_id: string;
  receiver_id: string;
  offer: { credits: number; iron: number; plasma: number };
  request: { credits: number; iron: number; plasma: number };
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

// --- Sabitler ---
const SHIP_TYPES: Ship[] = [
  { id: 'scout', type: 'scout', name: 'Keşif İHA', cost: { credits: 500, iron: 200, plasma: 0, crystal: 0 }, power: 2, description: "Hızlı ve ucuz gözlem aracı.", ability: "Düşük maliyetli XP kaynağı." },
  { id: 'miner', type: 'miner', name: 'Madenci Fırkateyni', cost: { credits: 1500, iron: 800, plasma: 200, crystal: 50 }, power: 8, description: "Sektörlerde kaynak toplama birimi.", ability: "Sektör demir üretimini artırır." },
  { id: 'defender', type: 'defender', name: 'Kalkan Muhribi', cost: { credits: 3000, iron: 1500, plasma: 500, crystal: 150 }, power: 25, description: "Standart savunma ve işgal gemisi.", ability: "Tehdit seviyesini dengeler." },
  { id: 'hauler', type: 'hauler', name: 'Ağır Nakliye Gemisi', cost: { credits: 2500, iron: 1000, plasma: 150, crystal: 200 }, power: 5, description: "Lojistik destek gemisi.", ability: "Sektör verimliliğini %20 artırır." },
  { id: 'cruiser', type: 'cruiser', name: 'Ağır Kruvazör', cost: { credits: 8000, iron: 4000, plasma: 2000, crystal: 800 }, power: 120, description: "Yüksek ateş gücüne sahip savaş gemisi.", ability: "Sektör fetihlerinde %50 daha etkili." },
  { id: 'mothership', type: 'mothership', name: 'Ana Gemi (Dreadnought)', cost: { credits: 35000, iron: 15000, plasma: 8000, crystal: 3000 }, power: 650, description: "Galaktik hakimiyet sembolü.", ability: "Bulunduğu sektörde riskleri minimize eder." },
];

const SECTORS_LIST: Sector[] = [
  { id: 's1', name: 'Alfa Merkezi', type: 'core', resourceMultiplier: 1.0, risk: 5, controlled: true, minLevel: 1, deployedShips: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } },
  { id: 's2', name: 'Asteroid Kuşağı', type: 'nebula', resourceMultiplier: 1.5, risk: 15, controlled: false, minLevel: 3, deployedShips: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } },
  { id: 's3', name: 'Delta Sınırı', type: 'frontier', resourceMultiplier: 2.5, risk: 25, controlled: false, minLevel: 7, deployedShips: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } },
  { id: 's4', name: 'Pulsar Bölgesi', type: 'nebula', resourceMultiplier: 4.0, risk: 40, controlled: false, minLevel: 12, deployedShips: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } },
  { id: 's5', name: 'Omega Boşluğu', type: 'void', resourceMultiplier: 6.0, risk: 65, controlled: false, minLevel: 20, deployedShips: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } },
  { id: 's6', name: 'Olay Ufku', type: 'anomaly', resourceMultiplier: 12.0, risk: 85, controlled: false, minLevel: 35, deployedShips: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } },
];

const INITIAL_GAME_STATE: GameState = {
  credits: 5000,
  xp: 0,
  level: 1,
  resources: { iron: 1000, plasma: 200, crystal: 50, dataBits: 0, darkMatter: 0 },
  upgrades: { pickaxePower: 1, autoMiners: 0, plasmaExtractors: 0, crystalRefineries: 0, researchHubs: 0, storageLevel: 1 },
  fleet: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 },
  sectors: SECTORS_LIST,
  threatLevel: 10,
  lastUpdate: Date.now(),
  market: {
    iron: { price: 2, prevPrice: 2, trend: 'stable' },
    plasma: { price: 15, prevPrice: 15, trend: 'stable' },
    crystal: { price: 50, prevPrice: 50, trend: 'stable' },
    darkMatter: { price: 500, prevPrice: 500, trend: 'stable' }
  },
  profile: {
    callsign: 'Bilinmeyen Amiral',
    motto: 'Yıldızlar rehberimiz olsun.',
    avatarId: 'shield',
    joinedDate: Date.now()
  },
  stats: {
    totalCreditsEarned: 0,
    totalShipsBuilt: 0,
    sectorsLiberated: 0
  }
};

const DBService = {
  getUser: async (userId: string): Promise<UserData | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) return null;
    return { id: data.id, password: data.password, gameState: data.game_state };
  },
  createUser: async (userId: string, pass: string, state: GameState): Promise<boolean> => {
    const { error } = await supabase.from('users').insert([{ id: userId, password: pass, game_state: state }]);
    return !error;
  },
  updateGameState: async (userId: string, state: GameState) => {
    await supabase.from('users').update({ game_state: state }).eq('id', userId);
  },
  sendTrade: async (trade: Partial<TradeProposal>) => {
    const { error } = await supabase.from('trades').insert([trade]);
    return !error;
  },
  getTrades: async (userId: string): Promise<TradeProposal[]> => {
    const { data, error } = await supabase.from('trades')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    return data || [];
  },
  updateTradeStatus: async (tradeId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase.from('trades').update({ status }).eq('id', tradeId);
    return !error;
  }
};

// --- Yardımcı Fonksiyonlar ---
const getXPToNextLevel = (level: number) => Math.floor(1000 * level * Math.pow(1.5, level - 1));
const getMaxStorage = (level: number) => 5000 * level;
const getStorageUpgradeCost = (level: number) => Math.floor(2500 * Math.pow(1.8, level - 1));
const getAutoMinerCost = (level: number) => Math.floor(500 * Math.pow(1.5, level));
const getPlasmaExtractorCost = (level: number) => Math.floor(2000 * Math.pow(1.7, level));
const getCrystalRefineryCost = (level: number) => Math.floor(5000 * Math.pow(2.0, level));

// --- Ana Uygulama ---
const App = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [activeTab, setActiveTab] = useState<'command' | 'shipyard' | 'starmap' | 'market' | 'ai' | 'profile'>('command');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Profil düzenleme durumları
  const [tempProfile, setTempProfile] = useState(INITIAL_GAME_STATE.profile!);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem('nebula_pilot_id');
    if (savedId) DBService.getUser(savedId).then(u => u && handleLogin(u));
  }, []);

  const handleLogin = (user: UserData) => {
    localStorage.setItem('nebula_pilot_id', user.id);
    setCurrentUser(user);
    const mergedSectors = SECTORS_LIST.map(s => {
        const existing = user.gameState.sectors?.find(es => es.id === s.id);
        return existing ? { ...s, controlled: existing.controlled, deployedShips: existing.deployedShips || { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } } : s;
    });
    const loadedState = { 
        ...INITIAL_GAME_STATE, 
        ...user.gameState, 
        sectors: mergedSectors,
        profile: { ...INITIAL_GAME_STATE.profile, ...(user.gameState.profile || {}) },
        stats: { ...INITIAL_GAME_STATE.stats, ...(user.gameState.stats || {}) }
    };
    setGameState(loadedState);
    setTempProfile(loadedState.profile!);
  };

  const handleAuth = async () => {
    const pid = (document.getElementById('pid') as HTMLInputElement).value;
    const pass = (document.getElementById('pass') as HTMLInputElement).value;
    if (!pid || !pass) return alert("Lütfen tüm alanları doldurun.");
    setAuthLoading(true);
    if (authMode === 'login') {
        const user = await DBService.getUser(pid);
        if (user && user.password === pass) handleLogin(user);
        else alert("Kimlik bilgileri hatalı.");
    } else {
        const existing = await DBService.getUser(pid);
        if (existing) alert("Bu Pilot Kimliği zaten kullanımda.");
        else {
            const success = await DBService.createUser(pid, pass, INITIAL_GAME_STATE);
            if (success) handleLogin({ id: pid, password: pass, gameState: INITIAL_GAME_STATE });
        }
    }
    setAuthLoading(false);
  };

  const addXP = useCallback((amount: number) => {
    setGameState(prev => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      let xpRequired = getXPToNextLevel(newLevel);
      while (newXP >= xpRequired) {
        newXP -= xpRequired;
        newLevel += 1;
        xpRequired = getXPToNextLevel(newLevel);
      }
      return { ...prev, xp: newXP, level: newLevel };
    });
  }, []);

  // --- Geliştirme İşlemleri (Fix: Implement missing handleUpgrade function) ---
  const handleUpgrade = (type: 'storage' | 'autoMiner') => {
    setGameState(prev => {
      let cost = 0;
      const nextUpgrades = { ...prev.upgrades };
      
      if (type === 'storage') {
        cost = getStorageUpgradeCost(prev.upgrades.storageLevel);
        if (prev.credits < cost) return prev;
        nextUpgrades.storageLevel += 1;
      } else if (type === 'autoMiner') {
        cost = getAutoMinerCost(prev.upgrades.autoMiners);
        if (prev.credits < cost) return prev;
        nextUpgrades.autoMiners += 1;
      } else {
        return prev;
      }
      
      return {
        ...prev,
        credits: prev.credits - cost,
        upgrades: nextUpgrades
      };
    });
    addXP(100);
  };

  // --- Oyun Çekirdek Döngüsü ---
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      setGameState(prev => {
        const delta = 1;
        const maxCap = getMaxStorage(prev.upgrades.storageLevel);
        
        const globalMinerPower = (prev.fleet.miner || 0) * 2;
        const sectorBonuses = prev.sectors
          .filter(s => s.controlled)
          .reduce((acc, s) => {
              const sectorMiners = s.deployedShips?.miner || 0;
              const sectorHaulers = s.deployedShips?.hauler || 0;
              const sectorMotherships = s.deployedShips?.mothership || 0;
              const efficiency = 1 + (sectorHaulers * 0.2) + (sectorMotherships * 0.5);
              return acc + (s.resourceMultiplier * (sectorMiners * 3 + 1) * efficiency);
          }, 0);

        const cruiserPower = (prev.fleet.cruiser || 0) * 80;
        const mothershipPower = (prev.fleet.mothership || 0) * 500;
        const defensePower = (prev.fleet.defender || 0) * 10 + cruiserPower + mothershipPower;

        const baseThreat = 5 + (prev.credits / 10000);
        const threatReduced = Math.max(0, baseThreat - (defensePower / 25));

        // Market Fiyatları
        let updatedMarket = prev.market;
        if (Math.floor(Date.now() / 1000) % 15 === 0) {
            updatedMarket = (Object.entries(prev.market) as [string, any][]).reduce((acc, [key, data]) => {
                const change = (Math.random() - 0.45) * 0.2;
                const newPrice = Math.max(1, Math.round(data.price * (1 + change) * 100) / 100);
                acc[key] = { price: newPrice, prevPrice: data.price, trend: newPrice > data.price ? 'up' : 'down' };
                return acc;
            }, {} as any);
        }

        const newState = {
          ...prev,
          market: updatedMarket,
          resources: {
            ...prev.resources,
            iron: Math.min(maxCap, prev.resources.iron + (prev.upgrades.autoMiners * 0.5 + globalMinerPower + sectorBonuses) * delta),
            plasma: Math.min(maxCap, prev.resources.plasma + (prev.upgrades.plasmaExtractors * 0.1 + (globalMinerPower * 0.1) + (sectorBonuses * 0.05)) * delta),
            crystal: Math.min(maxCap, prev.resources.crystal + (prev.upgrades.crystalRefineries * 0.02 + (sectorBonuses * 0.01)) * delta),
          },
          threatLevel: Math.min(100, threatReduced),
          lastUpdate: Date.now()
        };

        if (Math.floor(Date.now() / 1000) % 20 === 0) DBService.updateGameState(currentUser.id, newState);
        return newState;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const deployShipsToSector = (sectorId: string, shipType: string, amount: number) => {
    setGameState(prev => {
        const sector = prev.sectors.find(s => s.id === sectorId);
        if (!sector || !sector.controlled) return prev;
        const availableInFleet = prev.fleet[shipType] || 0;
        const toMove = Math.min(availableInFleet, amount);
        if (toMove <= 0) return prev;
        return {
            ...prev,
            fleet: { ...prev.fleet, [shipType]: availableInFleet - toMove },
            sectors: prev.sectors.map(s => s.id === sectorId ? {
                ...s,
                deployedShips: {
                    ...s.deployedShips,
                    [shipType]: (s.deployedShips?.[shipType] || 0) + toMove
                }
            } : s)
        };
    });
  };

  const recallShipsFromSector = (sectorId: string, shipType: string, amount: number) => {
    setGameState(prev => {
        const sector = prev.sectors.find(s => s.id === sectorId);
        if (!sector) return prev;
        const inSector = sector.deployedShips?.[shipType] || 0;
        const toMove = Math.min(inSector, amount);
        if (toMove <= 0) return prev;
        return {
            ...prev,
            fleet: { ...prev.fleet, [shipType]: (prev.fleet[shipType] || 0) + toMove },
            sectors: prev.sectors.map(s => s.id === sectorId ? {
                ...s,
                deployedShips: {
                    ...s.deployedShips,
                    [shipType]: inSector - toMove
                }
            } : s)
        };
    });
  };

  const handleCaptureSector = (sectorId: string) => {
    const sector = gameState.sectors.find(s => s.id === sectorId)!;
    if (gameState.level < sector.minLevel) return alert(`Seviye ${sector.minLevel} gereklidir.`);
    const cruiserPower = (gameState.fleet.cruiser || 0) * 80;
    const mothershipPower = (gameState.fleet.mothership || 0) * 500;
    const totalPower = (gameState.fleet.defender || 0) * 10 + cruiserPower + mothershipPower;
    const requiredPower = sector.risk * 15;
    if (totalPower >= requiredPower) {
        const lossRatio = Math.max(0.05, (requiredPower / totalPower) * 0.4);
        setGameState(prev => ({
            ...prev,
            fleet: { 
                ...prev.fleet, 
                defender: Math.floor(prev.fleet.defender * (1 - lossRatio)),
                cruiser: Math.floor((prev.fleet.cruiser || 0) * (1 - (lossRatio * 0.5))),
                mothership: Math.floor((prev.fleet.mothership || 0) * (1 - (lossRatio * 0.1)))
            },
            sectors: prev.sectors.map(s => s.id === sectorId ? { ...s, controlled: true } : s),
            stats: {
                ...prev.stats!,
                sectorsLiberated: (prev.stats?.sectorsLiberated || 0) + 1
            }
        }));
        addXP(8000 * sector.resourceMultiplier);
        alert(`${sector.name} ele geçirildi!`);
    } else {
        alert(`Gerekli Güç: ${requiredPower}, Mevcut Güç: ${totalPower}`);
    }
  };

  const buildShip = (shipId: string) => {
    const ship = SHIP_TYPES.find(s => s.id === shipId)!;
    if (gameState.credits >= ship.cost.credits && 
        gameState.resources.iron >= ship.cost.iron && 
        gameState.resources.plasma >= ship.cost.plasma &&
        gameState.resources.crystal >= ship.cost.crystal) {
      setGameState(prev => ({
        ...prev,
        credits: prev.credits - ship.cost.credits,
        resources: {
          ...prev.resources,
          iron: prev.resources.iron - ship.cost.iron,
          plasma: prev.resources.plasma - ship.cost.plasma,
          crystal: prev.resources.crystal - ship.cost.crystal
        },
        fleet: { ...prev.fleet, [shipId]: (prev.fleet[shipId] || 0) + 1 },
        stats: {
            ...prev.stats!,
            totalShipsBuilt: (prev.stats?.totalShipsBuilt || 0) + 1
        }
      }));
      addXP(Math.floor(ship.cost.credits / 10));
    } else {
        alert("Yetersiz kaynak!");
    }
  };

  const sellResources = (key: string, data: any) => {
    const amt = (gameState.resources as any)[key];
    if (amt <= 0) return;
    const creditsEarned = amt * data.price;
    setGameState(prev => ({
      ...prev,
      credits: prev.credits + creditsEarned,
      resources: { ...prev.resources, [key]: 0 },
      stats: {
          ...prev.stats!,
          totalCreditsEarned: (prev.stats?.totalCreditsEarned || 0) + creditsEarned
      }
    }));
    addXP(Math.floor(creditsEarned / 10));
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSavingProfile(true);
    const updatedState = { ...gameState, profile: tempProfile };
    setGameState(updatedState);
    await DBService.updateGameState(currentUser.id, updatedState);
    setIsSavingProfile(false);
    alert("Pilot profili güncellendi.");
  };

  const getStrategicAdvice = async () => {
    setAiLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Amiral ${gameState.profile?.callsign} olarak davran. Rütbe: ${gameState.level}. Filo: ${JSON.stringify(gameState.fleet)}. Tehdit: %${gameState.threatLevel}. Kredi: ${gameState.credits}. Türkçe, sert ve otoriter bir tonda 2 cümlelik askeri emir ver.`,
      });
      setAiAdvice(response.text || "Sektör taranıyor...");
    } catch (e) { setAiAdvice("İletişim koptu."); }
    finally { setAiLoading(false); }
  };

  if (!currentUser) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden text-left">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="glass p-12 rounded-[3.5rem] border border-cyan-500/20 text-center max-w-md w-full shadow-2xl relative z-10">
        <Globe className="w-20 h-20 text-cyan-400 mx-auto mb-8 animate-pulse" />
        <h1 className="orbitron text-3xl font-black text-white mb-2 uppercase italic">Nebula <span className="text-cyan-400">Komutanlığı</span></h1>
        <div className="flex bg-slate-900/80 p-1 rounded-2xl mb-8 border border-white/5">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-3 rounded-xl orbitron text-[10px] font-black uppercase transition-all ${authMode === 'login' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>Giriş</button>
            <button onClick={() => setAuthMode('signup')} className={`flex-1 py-3 rounded-xl orbitron text-[10px] font-black uppercase transition-all ${authMode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Üye Ol</button>
        </div>
        <div className="space-y-4">
           <input id="pid" type="text" placeholder="Pilot Kimliği" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-cyan-50 outline-none font-mono text-sm" />
           <input id="pass" type="password" placeholder="Erişim Kodu" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-cyan-50 outline-none font-mono text-sm" />
           <button onClick={handleAuth} disabled={authLoading} className="w-full py-5 rounded-2xl font-black orbitron text-white uppercase bg-gradient-to-r from-cyan-600 to-blue-700 shadow-2xl">
              {authLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Sistemi Başlat"}
           </button>
        </div>
      </div>
    </div>
  );

  const xpProgress = (gameState.xp / getXPToNextLevel(gameState.level)) * 100;
  const currentMaxStorage = getMaxStorage(gameState.upgrades.storageLevel);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* HUD */}
        <header className="glass rounded-[2rem] p-8 border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900/50">
             <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${xpProgress}%` }} />
          </div>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/10 text-white">
                <ShipIcon type={gameState.profile?.avatarId as any || 'shield'} size={32} />
            </div>
            <div className="text-left">
                <h1 className="orbitron text-xl font-black uppercase tracking-tighter italic">
                    <span className="text-slate-400 text-xs font-mono mr-2">[{currentUser.id}]</span>
                    {gameState.profile?.callsign}
                </h1>
                <p className="text-[10px] font-mono text-cyan-400 uppercase">Amiral Seviyesi {gameState.level} | Tehdit: %{gameState.threatLevel.toFixed(1)}</p>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-900/80 px-8 py-4 rounded-3xl border border-yellow-500/20 text-right">
                <p className="text-[10px] font-black text-yellow-600 uppercase mb-1">Kredi Bakiyesi</p>
                <p className="orbitron text-2xl font-bold text-yellow-400">{Math.floor(gameState.credits).toLocaleString()}</p>
             </div>
             <button onClick={() => { localStorage.removeItem('nebula_pilot_id'); window.location.reload(); }} className="p-5 bg-slate-800 text-slate-400 rounded-2xl hover:text-red-400 transition-all">
                <LogOut size={24} />
             </button>
          </div>
        </header>

        {/* Kaynak Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           <QuickStat icon={<Database />} label="Demir" val={gameState.resources.iron} max={currentMaxStorage} color="text-slate-400" />
           <QuickStat icon={<Zap />} label="Plazma" val={gameState.resources.plasma} max={currentMaxStorage} color="text-purple-400" />
           <QuickStat icon={<Gem />} label="Kristal" val={gameState.resources.crystal} max={currentMaxStorage} color="text-emerald-400" />
           <QuickStat icon={<Rocket />} label="Donanma" val={(Object.values(gameState.fleet) as number[]).reduce((a, b) => a + b, 0)} color="text-cyan-400" />
           <QuickStat icon={<Crosshair />} label="Hakimiyet" val={gameState.sectors.filter(s => s.controlled).length} color="text-green-400" />
        </div>

        {/* Navigasyon */}
        <nav className="flex bg-slate-900/50 p-1 rounded-2xl self-start border border-white/5 overflow-x-auto no-scrollbar shadow-xl">
           <NavBtn active={activeTab === 'command'} onClick={() => setActiveTab('command')} icon={<Activity />} label="Karargah" />
           <NavBtn active={activeTab === 'shipyard'} onClick={() => setActiveTab('shipyard')} icon={<Cpu />} label="Tersane" />
           <NavBtn active={activeTab === 'starmap'} onClick={() => setActiveTab('starmap')} icon={<Radar />} label="Taktik Harita" />
           <NavBtn active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<BarChart3 />} label="Ticaret" />
           <NavBtn active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<Bot />} label="Amiral AI" />
           <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User />} label="Profil" />
        </nav>

        {/* İçerik */}
        <main className="min-h-[500px]">
           {activeTab === 'command' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="glass rounded-[2.5rem] p-10 flex flex-col items-center justify-center border border-cyan-500/10 min-h-[400px] relative overflow-hidden">
                        <button onClick={() => { setGameState(prev => ({ ...prev, credits: prev.credits + 100 })); addXP(50); }} className="relative w-64 h-64 glass border-2 border-cyan-500/40 rounded-full flex flex-col items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl group">
                            <Target size={64} className="text-cyan-400 group-hover:animate-ping" />
                            <span className="orbitron text-xs font-black uppercase tracking-widest">Sinyal Gönder</span>
                        </button>
                    </div>
                    <div className="glass rounded-[2.5rem] p-8 border border-white/5 bg-slate-900/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <UpgradeCard icon={<HardDrive />} title="Lojistik Depo" level={gameState.upgrades.storageLevel} cost={getStorageUpgradeCost(gameState.upgrades.storageLevel)} canAfford={gameState.credits >= getStorageUpgradeCost(gameState.upgrades.storageLevel)} onUpgrade={() => handleUpgrade('storage')} color="cyan" />
                            <UpgradeCard icon={<Pickaxe />} title="Otonom Madenci" level={gameState.upgrades.autoMiners} cost={getAutoMinerCost(gameState.upgrades.autoMiners)} canAfford={gameState.credits >= getAutoMinerCost(gameState.upgrades.autoMiners)} onUpgrade={() => handleUpgrade('autoMiner')} color="slate" />
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                   <h3 className="orbitron text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Aktif Rezervler</h3>
                   {Object.entries(gameState.fleet).map(([id, count]) => {
                     const shipInfo = SHIP_TYPES.find(s => s.id === id);
                     if (!shipInfo) return null;
                     return (
                     <div key={id} className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-cyan-500/20 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 text-cyan-400">
                                <ShipIcon type={shipInfo.type as any} />
                            </div>
                            <div className="text-left">
                                <p className="orbitron text-[10px] font-black text-white">{shipInfo.name}</p>
                                <p className="text-[8px] font-mono text-slate-500 uppercase">Filo Birimi</p>
                            </div>
                        </div>
                        <span className="orbitron text-xl font-black text-cyan-400">{count}</span>
                     </div>
                   )})}
                </div>
             </div>
           )}

           {activeTab === 'profile' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-12 duration-500">
                {/* Profil Düzenleme */}
                <div className="glass p-10 rounded-[3rem] border border-cyan-500/20 text-left">
                    <div className="flex items-center gap-4 mb-10">
                        <Terminal className="text-cyan-400" size={32} />
                        <h3 className="orbitron text-xl font-black text-white uppercase italic tracking-tighter">Pilot <span className="text-cyan-400">Kimlik Kartı</span></h3>
                    </div>
                    
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Çağrı Adı (Callsign)</label>
                            <input 
                                type="text" 
                                value={tempProfile.callsign} 
                                onChange={(e) => setTempProfile({...tempProfile, callsign: e.target.value})}
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-sm font-mono text-cyan-50 focus:border-cyan-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Amiral Mottosu</label>
                            <textarea 
                                value={tempProfile.motto} 
                                onChange={(e) => setTempProfile({...tempProfile, motto: e.target.value})}
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-sm font-mono text-cyan-50 focus:border-cyan-500 outline-none transition-all h-24 resize-none"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Avatar Protokolü</label>
                            <div className="grid grid-cols-5 gap-4">
                                {['shield', 'zap', 'target', 'rocket', 'radar'].map(iconId => (
                                    <button 
                                        key={iconId}
                                        onClick={() => setTempProfile({...tempProfile, avatarId: iconId})}
                                        className={`p-4 rounded-xl border transition-all flex items-center justify-center ${tempProfile.avatarId === iconId ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-slate-950 border-white/5 text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <ShipIcon type={iconId as any} size={24} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveProfile} 
                            disabled={isSavingProfile}
                            className="w-full py-5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white orbitron font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all"
                        >
                            {isSavingProfile ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Kimliği Güncelle</>}
                        </button>
                    </div>
                </div>

                {/* Başarılar ve İstatistikler */}
                <div className="space-y-6">
                    <div className="glass p-10 rounded-[3rem] border border-white/5 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Medal size={120} className="text-yellow-500" />
                        </div>
                        <h3 className="orbitron text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Hizmet Kayıtları</h3>
                        <div className="space-y-6">
                            <StatDisplay label="Toplam Kazanılan Kredi" val={Math.floor(gameState.stats?.totalCreditsEarned || 0).toLocaleString()} icon={<Trophy className="text-yellow-500" />} />
                            <StatDisplay label="İnşa Edilen Gemiler" val={(gameState.stats?.totalShipsBuilt || 0).toString()} icon={<Rocket className="text-cyan-500" />} />
                            <StatDisplay label="Kurtarılan Sektörler" val={(gameState.stats?.sectorsLiberated || 0).toString()} icon={<Globe className="text-green-500" />} />
                            <div className="pt-6 border-t border-white/5">
                                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Hizmete Giriş Tarihi</p>
                                <p className="text-xs font-mono text-slate-400 mt-1">{new Date(gameState.profile?.joinedDate || Date.now()).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border border-indigo-500/10 text-left bg-gradient-to-br from-indigo-900/10 to-transparent">
                        <div className="flex items-center gap-4 mb-4">
                            <ShieldCheck className="text-indigo-400" size={24} />
                            <p className="orbitron text-[10px] font-black text-white uppercase tracking-widest">Galaktik İtibar</p>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 italic">"Amiral {gameState.profile?.callsign}, galaksi genelinde {gameState.level > 10 ? 'saygın bir stratejist' : 'yükselen bir lider'} olarak tanınıyor."</p>
                    </div>
                </div>
             </div>
           )}

           {activeTab === 'starmap' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in zoom-in duration-500">
                {gameState.sectors.map(sector => (
                   <SectorTacticalCard 
                      key={sector.id} 
                      sector={sector} 
                      userLevel={gameState.level}
                      onCapture={handleCaptureSector}
                      onDeploy={deployShipsToSector}
                      onRecall={recallShipsFromSector}
                      availableFleet={gameState.fleet}
                   />
                ))}
             </div>
           )}

           {activeTab === 'market' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-12 duration-500">
                {(Object.entries(gameState.market) as [string, any][]).map(([key, data]) => (
                   <div key={key} className="glass p-8 rounded-[2.5rem] border border-white/5 text-left relative group">
                      <p className="orbitron text-sm font-black text-white uppercase mb-4 italic">{key.toUpperCase()}</p>
                      <div className="mb-6">
                        <p className={`orbitron text-3xl font-black ${data.trend === 'up' ? 'text-yellow-500' : 'text-red-400'}`}>
                            {data.price.toFixed(2)} <span className="text-sm">CR</span>
                        </p>
                        <p className={`text-[10px] font-mono ${data.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                            {data.trend === 'up' ? '▲ ARTIŞTA' : '▼ DÜŞÜŞTE'}
                        </p>
                      </div>
                      <button onClick={() => sellResources(key, data)} disabled={(gameState.resources as any)[key] <= 0} className="w-full py-4 rounded-xl text-[10px] font-black uppercase bg-green-600 hover:bg-green-500 transition-all disabled:opacity-30">Satış Yap</button>
                   </div>
                ))}
             </div>
           )}

           {activeTab === 'shipyard' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-12 duration-500">
                {SHIP_TYPES.map(ship => {
                    const canAfford = gameState.credits >= ship.cost.credits && 
                                     gameState.resources.iron >= ship.cost.iron && 
                                     gameState.resources.plasma >= ship.cost.plasma && 
                                     gameState.resources.crystal >= ship.cost.crystal;
                    return (
                        <div key={ship.id} className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 text-left group hover:border-cyan-500/30 transition-all shadow-xl bg-slate-900/40">
                            <div className="flex justify-between items-start">
                                <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/10 text-cyan-500 shadow-inner group-hover:scale-110 transition-transform">
                                    <ShipIcon type={ship.type} size={32} />
                                </div>
                                <div className="text-right">
                                    <p className="orbitron text-[8px] font-black text-slate-500 uppercase tracking-widest">Sınıf</p>
                                    <p className="orbitron text-xs font-black text-white">{ship.type.toUpperCase()}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="orbitron text-xl font-black text-white mb-2">{ship.name}</h4>
                                <p className="text-[11px] text-slate-400 font-mono italic leading-relaxed h-8 mb-2">{ship.description}</p>
                                <div className="flex items-center gap-2 py-1 px-3 bg-cyan-900/20 border border-cyan-500/20 rounded-lg">
                                    <PowerIcon size={12} className="text-yellow-400" />
                                    <span className="text-[9px] font-black orbitron text-cyan-400">YETENEK: {ship.ability}</span>
                                </div>
                            </div>

                            <div className="space-y-3 py-4 border-y border-white/5">
                                <div className="flex justify-between text-[10px] font-mono uppercase">
                                    <span className="text-slate-500">Savaş Gücü</span>
                                    <span className="text-red-400 font-bold">{ship.power} GÜÇ</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <CostRow label="Kredi" val={ship.cost.credits} has={gameState.credits >= ship.cost.credits} />
                                    <CostRow label="Demir" val={ship.cost.iron} has={gameState.resources.iron >= ship.cost.iron} />
                                    <CostRow label="Plazma" val={ship.cost.plasma} has={gameState.resources.plasma >= ship.cost.plasma} />
                                    <CostRow label="Kristal" val={ship.cost.crystal} has={gameState.resources.crystal >= ship.cost.crystal} />
                                </div>
                            </div>

                            <button 
                                onClick={() => buildShip(ship.id)} 
                                disabled={!canAfford} 
                                className={`w-full py-4 rounded-xl orbitron text-[10px] font-black uppercase transition-all shadow-lg ${
                                    canAfford 
                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white' 
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                }`}
                            >
                                {canAfford ? 'İnşayı Başlat' : 'Yetersiz Kaynak'}
                            </button>
                        </div>
                    );
                })}
             </div>
           )}

           {activeTab === 'ai' && (
             <div className="max-w-2xl mx-auto glass p-12 rounded-[3.5rem] border border-cyan-500/20 text-left">
                <div className="flex items-center gap-8 mb-12">
                   <div className="w-24 h-24 bg-cyan-950 rounded-[2rem] flex items-center justify-center border border-cyan-500/30">
                      <BrainCircuit className="text-cyan-400 w-12 h-12" />
                   </div>
                   <h2 className="orbitron text-2xl font-black text-white uppercase italic text-left">Stratejik İstihbarat Merkezi</h2>
                </div>
                <div className="p-10 rounded-[2.5rem] bg-slate-950/90 border border-white/5 min-h-[180px] mb-10 font-mono text-cyan-50 italic text-sm">
                   {aiLoading ? <Loader2 className="animate-spin text-cyan-400 mx-auto" size={40} /> : aiAdvice || "Emir bekliyorum Amiral."}
                </div>
                <button onClick={getStrategicAdvice} className="w-full py-6 bg-gradient-to-r from-cyan-600 to-blue-700 text-white orbitron font-black text-xs rounded-2xl">BRİFİNG AL</button>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

// --- Alt Bileşenler ---

const StatDisplay = ({ label, val, icon }: { label: string, val: string, icon: React.ReactNode }) => (
    <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-center">
            {icon}
        </div>
        <div className="text-left">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
            <p className="orbitron text-sm font-black text-white">{val}</p>
        </div>
    </div>
);

const ShipIcon = ({ type, size = 18 }: { type: Ship['type'] | string, size?: number }) => {
    switch (type) {
        case 'scout': return <Radar size={size} />;
        case 'miner': return <Pickaxe size={size} />;
        case 'defender': 
        case 'shield': return <Shield size={size} />;
        case 'hauler': return <Box size={size} />;
        case 'cruiser': return <Sword size={size} />;
        case 'mothership': return <Waves size={size} />;
        case 'zap': return <Zap size={size} />;
        case 'target': return <Target size={size} />;
        case 'rocket': return <Rocket size={size} />;
        case 'radar': return <Radar size={size} />;
        default: return <Rocket size={size} />;
    }
};

const CostRow = ({ label, val, has }: { label: string, val: number, has: boolean }) => (
    <div className="flex justify-between items-center text-[9px] font-mono">
        <span className="text-slate-500 uppercase">{label}</span>
        <span className={has ? 'text-green-400' : 'text-red-500'}>{val.toLocaleString()}</span>
    </div>
);

const SectorTacticalCard = ({ sector, userLevel, onCapture, onDeploy, onRecall, availableFleet }: any) => {
    const isLocked = userLevel < sector.minLevel;
    const [isManaging, setIsManaging] = useState(false);

    return (
        <div className={`glass rounded-[2.5rem] border relative overflow-hidden transition-all duration-500 text-left flex flex-col ${isLocked ? 'grayscale opacity-60 border-slate-700' : sector.controlled ? 'border-green-500/30' : 'border-red-500/20'}`}>
            {isLocked && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-4">
                    <LockKeyhole className="text-slate-500" size={32} />
                    <p className="orbitron text-xs font-black text-slate-400">ERİŞİM İÇİN SEVİYE {sector.minLevel}</p>
                </div>
            )}

            <div className="p-8 pb-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sector.controlled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} border border-current opacity-60`}>
                        <Radar size={24} />
                    </div>
                    <span className={`orbitron text-[8px] font-black px-3 py-1 rounded-full uppercase border ${sector.controlled ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {sector.controlled ? 'KONTROL ALTINDA' : 'KEŞİF BEKLİYOR'}
                    </span>
                </div>
                <h3 className="orbitron text-xl font-black text-white">{sector.name}</h3>
            </div>

            <div className="px-8 space-y-3 mb-6">
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase">
                        <span>Risk Seviyesi</span>
                        <span>%{sector.risk}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600" style={{ width: `${sector.risk}%` }} />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase">
                        <span>Getiri Çarpanı</span>
                        <span>x{sector.resourceMultiplier}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${(sector.resourceMultiplier / 12) * 100}%` }} />
                    </div>
                </div>
            </div>

            {sector.controlled && (
                <div className="px-8 mb-6 grid grid-cols-3 gap-2">
                    <ShipMiniStat type="miner" count={sector.deployedShips?.miner || 0} icon={<Pickaxe size={12}/>} />
                    <ShipMiniStat type="defender" count={sector.deployedShips?.defender || 0} icon={<Shield size={12}/>} />
                    <ShipMiniStat type="hauler" count={sector.deployedShips?.hauler || 0} icon={<Box size={12}/>} />
                    <ShipMiniStat type="cruiser" count={sector.deployedShips?.cruiser || 0} icon={<Sword size={12}/>} />
                    <ShipMiniStat type="mothership" count={sector.deployedShips?.mothership || 0} icon={<Waves size={12}/>} />
                    <ShipMiniStat type="scout" count={sector.deployedShips?.scout || 0} icon={<Radar size={12}/>} />
                </div>
            )}

            <div className="mt-auto p-4 bg-slate-950/40 border-t border-white/5">
                {!sector.controlled ? (
                    <button onClick={() => onCapture(sector.id)} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white orbitron text-[10px] font-black uppercase rounded-2xl shadow-xl transition-all">Sektörü Fethet</button>
                ) : (
                    <div className="flex flex-col gap-2">
                        <button onClick={() => setIsManaging(!isManaging)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white orbitron text-[10px] font-black uppercase rounded-2xl transition-all flex items-center justify-center gap-2">
                           <Rocket size={14} /> Filoyu Yönet {isManaging ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                        
                        {isManaging && (
                            <div className="p-4 bg-slate-900/50 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                                {SHIP_TYPES.map(s => (
                                    <FleetRow 
                                        key={s.id}
                                        label={s.name} 
                                        shipType={s.id} 
                                        inSector={sector.deployedShips?.[s.id] || 0} 
                                        inFleet={availableFleet[s.id] || 0} 
                                        onSend={(amt: number) => onDeploy(sector.id, s.id, amt)} 
                                        onRecall={(amt: number) => onRecall(sector.id, s.id, amt)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const FleetRow = ({ label, shipType, inSector, inFleet, onSend, onRecall }: any) => (
    <div className="flex flex-col gap-2 border-b border-white/5 pb-2 last:border-0">
        <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 uppercase">
            <span>{label}</span>
            <span>Konuşlanmış: {inSector} | Rezerv: {inFleet}</span>
        </div>
        <div className="flex gap-2">
            <button onClick={() => onRecall(1)} disabled={inSector <= 0} className="flex-1 py-1 bg-slate-800 text-[8px] font-black uppercase rounded hover:bg-red-900/40 transition-colors">Geri Al (-1)</button>
            <button onClick={() => onSend(1)} disabled={inFleet <= 0} className="flex-1 py-1 bg-cyan-900/40 text-[8px] font-black uppercase rounded hover:bg-cyan-600 transition-colors">Gönder (+1)</button>
            <button onClick={() => onSend(5)} disabled={inFleet < 5} className="flex-1 py-1 bg-cyan-700 text-[8px] font-black uppercase rounded hover:bg-cyan-600 transition-colors">+5</button>
        </div>
    </div>
);

const ShipMiniStat = ({ count, icon, type }: any) => (
    <div className={`flex flex-col items-center p-2 rounded-xl bg-slate-900 border border-white/5 transition-all ${count > 0 ? 'text-cyan-400 border-cyan-500/20' : 'text-slate-600'}`}>
        {icon}
        <span className="orbitron text-[9px] font-black mt-1">{count}</span>
    </div>
);

const QuickStat = ({ icon, label, val, max, color }: any) => (
  <div className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-5 bg-slate-900/20 text-left group hover:border-white/10 transition-all shadow-lg overflow-hidden">
    <div className={`p-4 bg-slate-950 rounded-2xl ${color} shadow-inner border border-white/5 group-hover:scale-110 transition-transform`}>{React.cloneElement(icon as React.ReactElement, { size: 20 })}</div>
    <div className="flex flex-col flex-1 overflow-hidden">
       <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</span>
            {max && <span className={`text-[8px] font-mono ${val >= max ? 'text-red-500' : 'text-slate-600'}`}>{val >= max ? 'DOLU' : `%${Math.floor((val / max) * 100)}`}</span>}
       </div>
       <div className="flex items-baseline gap-1">
            <span className={`orbitron text-base font-black truncate ${color}`}>{Math.floor(val).toLocaleString()}</span>
            {max && <span className="text-[9px] font-mono text-slate-600 uppercase">/ {max.toLocaleString()}</span>}
       </div>
    </div>
  </div>
);

const UpgradeCard = ({ icon, title, level, cost, canAfford, onUpgrade, color }: any) => (
    <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 flex flex-col gap-4 group hover:border-white/20 transition-all text-left">
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl bg-slate-950 text-${color}-400 border border-white/5`}>{React.cloneElement(icon as React.ReactElement, { size: 24 })}</div>
            <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase">Seviye</p>
                <p className="orbitron text-sm font-black text-white">{level}</p>
            </div>
        </div>
        <div>
            <p className="orbitron text-[11px] font-black text-white uppercase">{title}</p>
            <p className="text-[9px] font-mono text-slate-500 uppercase">Maliyet: {cost.toLocaleString()} CR</p>
        </div>
        <button onClick={onUpgrade} disabled={!canAfford} className={`w-full py-4 rounded-xl orbitron text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${canAfford ? 'bg-slate-800 hover:bg-white/10 text-white' : 'bg-slate-950 text-slate-700 cursor-not-allowed'}`}>Geliştir</button>
    </div>
);

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-8 py-6 rounded-2xl transition-all orbitron text-[10px] font-black shrink-0 tracking-widest ${active ? 'bg-cyan-600 text-white shadow-2xl' : 'text-slate-500 hover:text-slate-300'}`}>
    {React.cloneElement(icon as React.ReactElement, { size: 18 })}
    {label.toUpperCase()}
  </button>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
