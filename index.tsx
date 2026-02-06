
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
  LockKeyhole
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
  type: 'miner' | 'defender' | 'hauler';
  name: string;
  count: number;
  cost: { credits: number; iron: number; plasma: number };
  power: number; 
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
  { id: 'miner', type: 'miner', name: 'Madenci Fırkateyni', count: 0, cost: { credits: 1000, iron: 500, plasma: 100 }, power: 5 },
  { id: 'defender', type: 'defender', name: 'Kalkan Muhribi', count: 0, cost: { credits: 2000, iron: 1000, plasma: 300 }, power: 15 },
  { id: 'hauler', type: 'hauler', name: 'Ağır Nakliye Gemisi', count: 0, cost: { credits: 1500, iron: 400, plasma: 50 }, power: 2 },
];

const SECTORS: Sector[] = [
  { id: 's1', name: 'Alfa Merkezi', type: 'core', resourceMultiplier: 1.0, risk: 5, controlled: true, minLevel: 1, deployedShips: {} },
  { id: 's2', name: 'Asteroid Kuşağı', type: 'nebula', resourceMultiplier: 1.5, risk: 15, controlled: false, minLevel: 3, deployedShips: {} },
  { id: 's3', name: 'Delta Sınırı', type: 'frontier', resourceMultiplier: 2.5, risk: 25, controlled: false, minLevel: 7, deployedShips: {} },
  { id: 's4', name: 'Pulsar Bölgesi', type: 'nebula', resourceMultiplier: 4.0, risk: 40, controlled: false, minLevel: 12, deployedShips: {} },
  { id: 's5', name: 'Omega Boşluğu', type: 'void', resourceMultiplier: 6.0, risk: 65, controlled: false, minLevel: 20, deployedShips: {} },
  { id: 's6', name: 'Olay Ufku', type: 'anomaly', resourceMultiplier: 12.0, risk: 85, controlled: false, minLevel: 35, deployedShips: {} },
];

const INITIAL_GAME_STATE: GameState = {
  credits: 5000,
  xp: 0,
  level: 1,
  resources: { iron: 1000, plasma: 200, crystal: 50, dataBits: 0, darkMatter: 0 },
  upgrades: { pickaxePower: 1, autoMiners: 0, plasmaExtractors: 0, crystalRefineries: 0, researchHubs: 0, storageLevel: 1 },
  fleet: { miner: 0, defender: 0, hauler: 0 },
  sectors: SECTORS,
  threatLevel: 10,
  lastUpdate: Date.now(),
  market: {
    iron: { price: 2, prevPrice: 2, trend: 'stable' },
    plasma: { price: 15, prevPrice: 15, trend: 'stable' },
    crystal: { price: 50, prevPrice: 50, trend: 'stable' },
    darkMatter: { price: 500, prevPrice: 500, trend: 'stable' }
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
  const [activeTab, setActiveTab] = useState<'command' | 'shipyard' | 'starmap' | 'market' | 'ai' | 'diplomacy'>('command');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Giriş Ekranı Durumu
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Takas Durumu
  const [trades, setTrades] = useState<TradeProposal[]>([]);
  const [targetPilotId, setTargetPilotId] = useState('');
  const [tradeOffer, setTradeOffer] = useState({ credits: 0, iron: 0, plasma: 0 });
  const [tradeRequest, setTradeRequest] = useState({ credits: 0, iron: 0, plasma: 0 });
  const [isTrading, setIsTrading] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem('nebula_pilot_id');
    if (savedId) DBService.getUser(savedId).then(u => u && handleLogin(u));
  }, []);

  const handleLogin = (user: UserData) => {
    localStorage.setItem('nebula_pilot_id', user.id);
    setCurrentUser(user);
    const mergedSectors = SECTORS.map(s => {
        const existing = user.gameState.sectors?.find(es => es.id === s.id);
        return existing ? { ...s, controlled: existing.controlled } : s;
    });
    setGameState({ ...INITIAL_GAME_STATE, ...user.gameState, sectors: mergedSectors });
  };

  const handleAuth = async () => {
    const pid = (document.getElementById('pid') as HTMLInputElement).value;
    const pass = (document.getElementById('pass') as HTMLInputElement).value;
    
    if (!pid || !pass) {
        alert("Lütfen tüm alanları doldurun.");
        return;
    }

    setAuthLoading(true);
    if (authMode === 'login') {
        const user = await DBService.getUser(pid);
        if (user && user.password === pass) {
            handleLogin(user);
        } else {
            alert("Kimlik bilgileri hatalı veya kullanıcı bulunamadı.");
        }
    } else {
        const existing = await DBService.getUser(pid);
        if (existing) {
            alert("Bu Pilot Kimliği zaten kullanımda.");
        } else {
            const success = await DBService.createUser(pid, pass, INITIAL_GAME_STATE);
            if (success) {
                alert("Pilot kaydı başarılı! Sisteme giriş yapılıyor.");
                handleLogin({ id: pid, password: pass, gameState: INITIAL_GAME_STATE });
            } else {
                alert("Kayıt sırasında bir hata oluştu.");
            }
        }
    }
    setAuthLoading(false);
  };

  // --- XP Kazanma ve Seviye Atlama Mantığı ---
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

  // --- Takasları Güncelleme ---
  const refreshTrades = async () => {
    if (!currentUser) return;
    const data = await DBService.getTrades(currentUser.id);
    setTrades(data);
  };

  useEffect(() => {
    if (activeTab === 'diplomacy') {
      refreshTrades();
    }
  }, [activeTab]);

  // --- Oyun Çekirdek Döngüsü ---
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      setGameState(prev => {
        const delta = 1;
        const maxCap = getMaxStorage(prev.upgrades.storageLevel);
        
        const miningBonus = (prev.fleet.miner || 0) * 2;
        const defensePower = (prev.fleet.defender || 0) * 10;
        
        const baseThreat = 5 + (prev.credits / 10000);
        const threatReduced = Math.max(0, baseThreat - (defensePower / 5));

        const sectorBonus = prev.sectors
          .filter(s => s.controlled)
          .reduce((acc, s) => acc + (s.resourceMultiplier * 0.5), 0);

        // Dinamik Market Fiyat Dalgalanması (her 10 saniyede bir)
        let updatedMarket = prev.market;
        if (Math.floor(Date.now() / 1000) % 10 === 0) {
            // Fix: Cast Object.entries to correct type to resolve 'unknown' property access errors
            updatedMarket = (Object.entries(prev.market) as [string, { price: number; prevPrice: number; trend: 'up' | 'down' | 'stable' }][]).reduce((acc, [key, data]) => {
                const change = (Math.random() - 0.45) * 0.15; // -%6.75 ile +%8.25 arası
                const newPrice = Math.max(1, Math.round(data.price * (1 + change) * 100) / 100);
                acc[key] = {
                    price: newPrice,
                    prevPrice: data.price,
                    trend: newPrice > data.price ? 'up' : newPrice < data.price ? 'down' : 'stable'
                };
                return acc;
            }, {} as GameState['market']);
        }

        const newState = {
          ...prev,
          market: updatedMarket,
          resources: {
            ...prev.resources,
            iron: Math.min(maxCap, prev.resources.iron + (prev.upgrades.autoMiners * 0.5 + miningBonus + sectorBonus) * delta),
            plasma: Math.min(maxCap, prev.resources.plasma + (prev.upgrades.plasmaExtractors * 0.1 + (miningBonus * 0.1)) * delta),
            crystal: Math.min(maxCap, prev.resources.crystal + (prev.upgrades.crystalRefineries * 0.02) * delta),
          },
          threatLevel: Math.min(100, threatReduced),
          lastUpdate: Date.now()
        };

        if (Math.floor(Date.now() / 1000) % 15 === 0) {
            DBService.updateGameState(currentUser.id, newState);
        }

        return newState;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleSendTrade = async () => {
    if (!currentUser || !targetPilotId) return;
    if (targetPilotId === currentUser.id) {
        alert("Kendinizle takas yapamazsınız.");
        return;
    }

    if (gameState.credits < tradeOffer.credits || gameState.resources.iron < tradeOffer.iron || gameState.resources.plasma < tradeOffer.plasma) {
        alert("Yetersiz kaynak.");
        return;
    }

    setIsTrading(true);
    const success = await DBService.sendTrade({
        sender_id: currentUser.id,
        receiver_id: targetPilotId,
        offer: tradeOffer,
        request: tradeRequest,
        status: 'pending'
    });

    if (success) {
        setGameState(prev => ({
            ...prev,
            credits: prev.credits - tradeOffer.credits,
            resources: {
                ...prev.resources,
                iron: prev.resources.iron - tradeOffer.iron,
                plasma: prev.resources.plasma - tradeOffer.plasma
            }
        }));
        alert("Takas teklifi gönderildi.");
        setTradeOffer({ credits: 0, iron: 0, plasma: 0 });
        setTradeRequest({ credits: 0, iron: 0, plasma: 0 });
        setTargetPilotId('');
        refreshTrades();
    } else {
        alert("Teklif gönderilemedi. Pilot ID hatalı olabilir.");
    }
    setIsTrading(false);
  };

  const handleAcceptTrade = async (trade: TradeProposal) => {
    if (!currentUser) return;
    
    if (gameState.credits < trade.request.credits || gameState.resources.iron < trade.request.iron || gameState.resources.plasma < trade.request.plasma) {
        alert("Yetersiz kaynak. Karşı tarafın istediği kaynaklara sahip değilsiniz.");
        return;
    }

    setIsTrading(true);
    const success = await DBService.updateTradeStatus(trade.id, 'accepted');
    if (success) {
        setGameState(prev => ({
            ...prev,
            credits: prev.credits - trade.request.credits + trade.offer.credits,
            resources: {
                ...prev.resources,
                iron: prev.resources.iron - trade.request.iron + trade.offer.iron,
                plasma: prev.resources.plasma - trade.request.plasma + trade.offer.plasma
            }
        }));
        addXP(1000);
        alert("Takas kabul edildi ve kaynaklar aktarıldı!");
        refreshTrades();
    }
    setIsTrading(false);
  };

  const handleRejectTrade = async (trade: TradeProposal) => {
    if (!currentUser) return;
    const success = await DBService.updateTradeStatus(trade.id, 'rejected');
    if (success) {
        if (trade.sender_id === currentUser.id) {
            setGameState(prev => ({
                ...prev,
                credits: prev.credits + trade.offer.credits,
                resources: {
                    ...prev.resources,
                    iron: prev.resources.iron + trade.offer.iron,
                    plasma: prev.resources.plasma + trade.offer.plasma
                }
            }));
        }
        alert("Takas işlemi sonlandırıldı.");
        refreshTrades();
    }
  };

  const buildShip = (shipId: string) => {
    const ship = SHIP_TYPES.find(s => s.id === shipId)!;
    if (gameState.credits >= ship.cost.credits && gameState.resources.iron >= ship.cost.iron && gameState.resources.plasma >= ship.cost.plasma) {
      setGameState(prev => ({
        ...prev,
        credits: prev.credits - ship.cost.credits,
        resources: {
          ...prev.resources,
          iron: prev.resources.iron - ship.cost.iron,
          plasma: prev.resources.plasma - ship.cost.plasma
        },
        fleet: { ...prev.fleet, [shipId]: (prev.fleet[shipId] || 0) + 1 }
      }));
      addXP(ship.type === 'defender' ? 500 : 300);
    }
  };

  // --- Yükseltme İşleyicileri ---
  const handleUpgrade = (type: 'storage' | 'autoMiner' | 'plasma' | 'crystal') => {
    let cost = 0;
    switch(type) {
        case 'storage': cost = getStorageUpgradeCost(gameState.upgrades.storageLevel); break;
        case 'autoMiner': cost = getAutoMinerCost(gameState.upgrades.autoMiners); break;
        case 'plasma': cost = getPlasmaExtractorCost(gameState.upgrades.plasmaExtractors); break;
        case 'crystal': cost = getCrystalRefineryCost(gameState.upgrades.crystalRefineries); break;
    }

    if (gameState.credits >= cost) {
        setGameState(prev => ({
            ...prev,
            credits: prev.credits - cost,
            upgrades: {
                ...prev.upgrades,
                storageLevel: type === 'storage' ? prev.upgrades.storageLevel + 1 : prev.upgrades.storageLevel,
                autoMiners: type === 'autoMiner' ? prev.upgrades.autoMiners + 1 : prev.upgrades.autoMiners,
                plasmaExtractors: type === 'plasma' ? prev.upgrades.plasmaExtractors + 1 : prev.upgrades.plasmaExtractors,
                crystalRefineries: type === 'crystal' ? prev.upgrades.crystalRefineries + 1 : prev.upgrades.crystalRefineries,
            }
        }));
        addXP(Math.floor(cost / 10));
    }
  };

  const deployToSector = (sectorId: string) => {
    const sector = gameState.sectors.find(s => s.id === sectorId)!;
    
    if (gameState.level < sector.minLevel) {
        alert(`Bu sektöre erişmek için en az Seviye ${sector.minLevel} olmalısınız.`);
        return;
    }

    if (gameState.fleet.defender >= 5 && !sector.controlled) {
      setGameState(prev => ({
        ...prev,
        sectors: prev.sectors.map(s => s.id === sectorId ? { ...s, controlled: true } : s),
        fleet: { ...prev.fleet, defender: prev.fleet.defender - 5 } 
      }));
      addXP(2500 * (sector.minLevel || 1));
      alert(`Sektör ${sector.name} temizlendi ve ele geçirildi! Komuta Rütbesi arttı.`);
    } else if (sector.controlled) {
      alert("Sektör zaten kontrol altında.");
    } else {
      alert("Başarılı bir işgal için en az 5 Kalkan Muhribi gereklidir.");
    }
  };

  const sellResources = (key: string, data: any) => {
    const amt = (gameState.resources as any)[key];
    if (amt <= 0) return;
    
    const creditsEarned = amt * data.price;
    setGameState(prev => ({
      ...prev,
      credits: prev.credits + creditsEarned,
      resources: { ...prev.resources, [key]: 0 }
    }));
    
    addXP(Math.floor(creditsEarned / 10));
  };

  const getStrategicAdvice = async () => {
    setAiLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `Amiral Nebula olarak davran. Mevcut Komuta Rütbesi: ${gameState.level}. Filo Durumu: ${JSON.stringify(gameState.fleet)}. 
      Otomasyon Durumu: ${gameState.upgrades.autoMiners} madenci, ${gameState.upgrades.plasmaExtractors} plazma çıkarıcı.
      Tehdit Seviyesi: %${gameState.threatLevel}. Kredi: ${gameState.credits}. 
      Lütfen Türkçe olarak, sert bir komutan edasıyla 2 cümlelik yüksek öncelikli askeri hedef ver.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiAdvice(response.text || "Sektör taranıyor... sinyal yok.");
    } catch (e) {
      setAiAdvice("Korsan sinyalleri nedeniyle iletişim kesildi.");
    } finally {
      setAiLoading(false);
    }
  };

  if (!currentUser) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="glass p-10 md:p-14 rounded-[3.5rem] border border-cyan-500/20 text-center max-w-md w-full shadow-[0_0_80px_rgba(6,182,212,0.1)] relative z-10">
        <Globe className="w-20 h-20 text-cyan-400 mx-auto mb-8 animate-pulse" />
        <h1 className="orbitron text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Nebula <span className="text-cyan-400">Komutanlığı</span></h1>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.5em] mb-10">Sektör 4-B | Galaktik Erişim</p>
        
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl mb-8 border border-white/5 shadow-inner">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-3 rounded-xl orbitron text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${authMode === 'login' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                <LogIn size={14}/> Giriş Yap
            </button>
            <button onClick={() => setAuthMode('signup')} className={`flex-1 py-3 rounded-xl orbitron text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${authMode === 'signup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                <UserPlus size={14}/> Üye Ol
            </button>
        </div>

        <div className="space-y-5">
           <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input id="pid" type="text" placeholder="Pilot Kimliği" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-cyan-50 focus:border-cyan-500 outline-none font-mono transition-all text-sm" />
           </div>
           <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input id="pass" type="password" placeholder="Erişim Kodu" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-cyan-50 focus:border-cyan-500 outline-none font-mono transition-all text-sm" />
           </div>
           
           <button onClick={handleAuth} disabled={authLoading} className={`w-full py-5 rounded-2xl font-black orbitron text-white uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${authMode === 'login' ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600' : 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600'}`}>
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : authMode === 'login' ? <><LogIn size={20}/> Sistemi Başlat</> : <><UserPlus size={20}/> Pilot Kaydı Oluştur</>}
           </button>
        </div>
      </div>
    </div>
  );

  const xpProgress = (gameState.xp / getXPToNextLevel(gameState.level)) * 100;
  const currentMaxStorage = getMaxStorage(gameState.upgrades.storageLevel);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* HUD */}
        <header className="glass rounded-[2rem] p-8 border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900/50">
             <div className="h-full bg-cyan-500 transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: `${xpProgress}%` }} />
          </div>

          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/10">
                <Shield className="text-white w-10 h-10" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-cyan-500 text-slate-950 text-[10px] font-black w-8 h-8 rounded-full border-4 border-slate-950 flex items-center justify-center orbitron shadow-xl">
                 {gameState.level}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 text-left">
                 <h1 className="orbitron text-2xl font-black uppercase italic tracking-tighter">Amiral <span className="text-cyan-400">{currentUser.id}</span></h1>
                 <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10 text-slate-400 font-black uppercase">Rütbe {gameState.level}</span>
              </div>
              
              <div className="flex flex-col gap-2 mt-3 text-left">
                 <div className="flex justify-between items-end text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    <span>XP: {gameState.xp.toLocaleString()} / {getXPToNextLevel(gameState.level).toLocaleString()}</span>
                    <span>Tehdit: %{gameState.threatLevel.toFixed(1)}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="h-2 w-48 bg-slate-900 rounded-full overflow-hidden border border-white/5 p-[1px]">
                       <div className="h-full bg-red-600 transition-all duration-1000 shadow-[0_0_10px_rgba(220,38,38,0.5)]" style={{ width: `${gameState.threatLevel}%` }} />
                    </div>
                    <div className={`w-2 h-2 rounded-full ${gameState.threatLevel > 50 ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
                 </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
             <div className="bg-slate-900/80 px-8 py-4 rounded-3xl border border-yellow-500/20 text-right shadow-inner">
                <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">Savaş Kasası</p>
                <p className="orbitron text-2xl font-bold text-yellow-400">{Math.floor(gameState.credits).toLocaleString()} <span className="text-xs">CR</span></p>
             </div>
             <button onClick={() => { localStorage.removeItem('nebula_pilot_id'); window.location.reload(); }} className="p-5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-2xl transition-all border border-white/5">
                <LogOut size={24} />
             </button>
          </div>
        </header>

        {/* Kaynak Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           <QuickStat icon={<Database />} label="Demir" val={gameState.resources.iron} max={currentMaxStorage} color="text-slate-400" />
           <QuickStat icon={<Zap />} label="Plazma" val={gameState.resources.plasma} max={currentMaxStorage} color="text-purple-400" />
           <QuickStat icon={<Gem />} label="Kristal" val={gameState.resources.crystal} max={currentMaxStorage} color="text-emerald-400" />
           <QuickStat icon={<Rocket />} label="Gemiler" val={(Object.values(gameState.fleet) as number[]).reduce((a, b) => (a as number) + (b as number), 0)} color="text-cyan-400" />
           <QuickStat icon={<Crosshair />} label="Sektörler" val={gameState.sectors.filter(s => s.controlled).length} color="text-green-400" />
        </div>

        {/* Navigasyon */}
        <nav className="flex bg-slate-900/50 p-1 rounded-2xl self-start border border-white/5 overflow-x-auto no-scrollbar shadow-xl">
           <NavBtn active={activeTab === 'command'} onClick={() => setActiveTab('command')} icon={<Activity />} label="Karargah" />
           <NavBtn active={activeTab === 'shipyard'} onClick={() => setActiveTab('shipyard')} icon={<Cpu />} label="Tersane" />
           <NavBtn active={activeTab === 'starmap'} onClick={() => setActiveTab('starmap')} icon={<MapIcon />} label="Harita" />
           <NavBtn active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<BarChart3 />} label="Ticaret" />
           <NavBtn active={activeTab === 'diplomacy'} onClick={() => setActiveTab('diplomacy')} icon={<Handshake />} label="Diplomasi" />
           <NavBtn active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<Bot />} label="Amiral AI" />
        </nav>

        {/* İçerik */}
        <main className="min-h-[500px]">
           {activeTab === 'command' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="glass rounded-[2.5rem] p-10 flex flex-col items-center justify-center border border-cyan-500/10 min-h-[400px] relative overflow-hidden text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent)] pointer-events-none" />
                    <div className="relative w-80 h-80">
                        <div className="absolute inset-0 border-[3px] border-dashed border-cyan-500/10 rounded-full animate-spin-slow" />
                        <div className="absolute inset-12 border-[1px] border-cyan-500/30 rounded-full animate-pulse" />
                        <button 
                            onClick={() => {
                                const maxCap = getMaxStorage(gameState.upgrades.storageLevel);
                                setGameState(prev => ({ 
                                    ...prev, 
                                    credits: prev.credits + 50,
                                    resources: { ...prev.resources, iron: Math.min(maxCap, prev.resources.iron + 10) }
                                }));
                                addXP(25);
                            }}
                            className="absolute inset-20 glass border-2 border-cyan-500/40 rounded-full flex flex-col items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-[0_0_80px_rgba(6,182,212,0.3)] group"
                        >
                            <Target size={56} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                            <div className="text-center">
                                <span className="orbitron text-[10px] font-black text-white tracking-widest uppercase block mb-1">Komut Ver</span>
                                <span className="text-[8px] font-mono text-cyan-500 uppercase">+25 XP / +50 CR / +10 Demir</span>
                            </div>
                        </button>
                    </div>
                    </div>

                    {/* Yükseltme Merkezi */}
                    <div className="glass rounded-[2.5rem] p-8 border border-white/5 bg-slate-900/20">
                        <h3 className="orbitron text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2 text-left">
                           <Zap size={14} className="text-yellow-500" /> Teknolojik Otomasyon Merkezi
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UpgradeCard 
                                icon={<HardDrive />} 
                                title="Depo Kapasitesi" 
                                level={gameState.upgrades.storageLevel} 
                                val={`${currentMaxStorage.toLocaleString()} Birim`}
                                cost={getStorageUpgradeCost(gameState.upgrades.storageLevel)} 
                                canAfford={gameState.credits >= getStorageUpgradeCost(gameState.upgrades.storageLevel)}
                                onUpgrade={() => handleUpgrade('storage')}
                                color="cyan"
                            />
                            <UpgradeCard 
                                icon={<Pickaxe />} 
                                title="Otomatik Madenci" 
                                level={gameState.upgrades.autoMiners} 
                                val={`+${(gameState.upgrades.autoMiners * 0.5).toFixed(1)} Demir/sn`}
                                cost={getAutoMinerCost(gameState.upgrades.autoMiners)} 
                                canAfford={gameState.credits >= getAutoMinerCost(gameState.upgrades.autoMiners)}
                                onUpgrade={() => handleUpgrade('autoMiner')}
                                color="slate"
                            />
                            <UpgradeCard 
                                icon={<Zap />} 
                                title="Plazma Çıkarıcı" 
                                level={gameState.upgrades.plasmaExtractors} 
                                val={`+${(gameState.upgrades.plasmaExtractors * 0.1).toFixed(1)} Plazma/sn`}
                                cost={getPlasmaExtractorCost(gameState.upgrades.plasmaExtractors)} 
                                canAfford={gameState.credits >= getPlasmaExtractorCost(gameState.upgrades.plasmaExtractors)}
                                onUpgrade={() => handleUpgrade('plasma')}
                                color="purple"
                            />
                            <UpgradeCard 
                                icon={<Gem />} 
                                title="Kristal Rafinerisi" 
                                level={gameState.upgrades.crystalRefineries} 
                                val={`+${(gameState.upgrades.crystalRefineries * 0.02).toFixed(2)} Kristal/sn`}
                                cost={getCrystalRefineryCost(gameState.upgrades.crystalRefineries)} 
                                canAfford={gameState.credits >= getCrystalRefineryCost(gameState.upgrades.crystalRefineries)}
                                onUpgrade={() => handleUpgrade('crystal')}
                                color="emerald"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                   <h3 className="orbitron text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-left">Filo Yapısı</h3>
                   {SHIP_TYPES.map(s => (
                     <div key={s.id} className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-cyan-500/20 transition-all">
                        <div className="flex items-center gap-5">
                           <div className="p-4 bg-slate-950 rounded-xl group-hover:scale-110 transition-transform border border-white/5">
                              {s.type === 'miner' ? <Pickaxe className="text-slate-400" size={20} /> : s.type === 'defender' ? <Shield className="text-blue-400" size={20} /> : <Box className="text-yellow-400" size={20} />}
                           </div>
                           <div className="text-left">
                              <p className="orbitron text-[11px] font-black text-white uppercase">{s.name}</p>
                              <p className="text-[9px] font-mono text-slate-500 uppercase">Aktif Rezerv</p>
                           </div>
                        </div>
                        <span className="orbitron text-xl font-black text-cyan-400">{gameState.fleet[s.id] || 0}</span>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeTab === 'market' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-12 duration-500">
                {/* Fix: Cast Object.entries to correct type to resolve 'unknown' property access errors */}
                {(Object.entries(gameState.market) as [string, { price: number; prevPrice: number; trend: 'up' | 'down' | 'stable' }][]).map(([key, data]) => {
                    const priceDiff = data.price - data.prevPrice;
                    const percentChange = data.prevPrice !== 0 ? ((priceDiff / data.prevPrice) * 100).toFixed(2) : "0.00";
                    const isPositive = priceDiff >= 0;

                    return (
                        <div key={key} className="glass p-8 rounded-[2.5rem] border border-white/5 text-left relative group">
                            <p className="orbitron text-sm font-black text-white uppercase mb-4 italic">{key.toUpperCase()}</p>
                            
                            {/* Fiyat ve Tooltip */}
                            <div className="relative inline-block cursor-help mb-6">
                                <div className="flex items-baseline gap-2">
                                    <p className={`orbitron text-3xl font-black ${isPositive ? 'text-yellow-500' : 'text-red-400'}`}>
                                        {data.price.toFixed(2)} <span className="text-sm">CR</span>
                                    </p>
                                    {data.trend !== 'stable' && (
                                        <div className={`text-[10px] font-mono flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                            {isPositive ? <ArrowUpRight size={14}/> : <TrendingDown size={14}/>}
                                            %{Math.abs(Number(percentChange))}
                                        </div>
                                    )}
                                </div>

                                {/* Özel Tooltip */}
                                <div className="absolute bottom-full left-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover:translate-y-0 z-30">
                                    <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl min-w-[140px]">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Fiyat Analizi</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-mono">
                                                <span className="text-slate-400">ÖNCEKİ:</span>
                                                <span className="text-white">{data.prevPrice.toFixed(2)} CR</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-mono border-t border-white/5 pt-2">
                                                <span className="text-slate-400">DEĞİŞİM:</span>
                                                <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                                                    {isPositive ? '+' : ''}{percentChange}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="absolute top-full left-6 w-3 h-3 bg-slate-900 border-r border-b border-white/10 rotate-45 -mt-1.5" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
                                    <span>Envanter:</span>
                                    <span className="text-white">{(gameState.resources as any)[key] || 0}</span>
                                </div>
                                <button 
                                    onClick={() => sellResources(key, data)} 
                                    disabled={(gameState.resources as any)[key] <= 0}
                                    className={`w-full py-4 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg ${
                                        (gameState.resources as any)[key] > 0 
                                        ? 'bg-green-600 hover:bg-green-500 text-white' 
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    Kaynağı Boşalt (CR Al)
                                </button>
                            </div>
                        </div>
                    );
                })}
             </div>
           )}

           {activeTab === 'diplomacy' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-8 duration-500">
                <div className="glass p-10 rounded-[2.5rem] border border-cyan-500/20 bg-slate-900/10 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <Handshake className="text-cyan-400" size={32} />
                        <h3 className="orbitron text-xl font-black text-white uppercase tracking-tighter italic text-left">Yeni Takas <span className="text-cyan-400">Protokolü</span></h3>
                    </div>
                    <div className="space-y-6">
                        <div className="flex flex-col gap-2 text-left">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alıcı Pilot Kimliği</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input type="text" value={targetPilotId} onChange={(e) => setTargetPilotId(e.target.value)} placeholder="Pilot ID girin..." className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono focus:border-cyan-500 outline-none transition-all"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest text-left">Teklifiniz</p>
                                <TradeInput icon={<Database size={14}/>} label="Demir" val={tradeOffer.iron} onChange={(v) => setTradeOffer({...tradeOffer, iron: v})} />
                                <TradeInput icon={<Zap size={14}/>} label="Plazma" val={tradeOffer.plasma} onChange={(v) => setTradeOffer({...tradeOffer, plasma: v})} />
                                <TradeInput icon={<Trophy size={14}/>} label="Kredi" val={tradeOffer.credits} onChange={(v) => setTradeOffer({...tradeOffer, credits: v})} />
                            </div>
                            <div className="space-y-4 text-left">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">İstediğiniz</p>
                                <TradeInput icon={<Database size={14}/>} label="Demir" val={tradeRequest.iron} onChange={(v) => setTradeRequest({...tradeRequest, iron: v})} />
                                <TradeInput icon={<Zap size={14}/>} label="Plazma" val={tradeRequest.plasma} onChange={(v) => setTradeRequest({...tradeRequest, plasma: v})} />
                                <TradeInput icon={<Trophy size={14}/>} label="Kredi" val={tradeRequest.credits} onChange={(v) => setTradeRequest({...tradeRequest, credits: v})} />
                            </div>
                        </div>
                        <button onClick={handleSendTrade} disabled={isTrading || !targetPilotId} className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white orbitron font-black text-xs rounded-2xl shadow-xl transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                            {isTrading ? <Loader2 className="animate-spin" size={16} /> : <><Handshake size={18} /> Teklifi Gönder</>}
                        </button>
                    </div>
                </div>
                <div className="space-y-6">
                    <h3 className="orbitron text-xs font-black text-slate-500 uppercase tracking-[0.3em] text-left">Aktif Talepler</h3>
                    <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 text-left">
                        {trades.length === 0 && <p className="text-center py-20 text-slate-600 text-xs font-mono italic">Bekleyen takas kaydı bulunamadı.</p>}
                        {trades.map(trade => (
                            <div key={trade.id} className="glass p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
                                <p className="orbitron text-[10px] font-black text-white uppercase italic">{trade.sender_id === currentUser.id ? `Hedef: ${trade.receiver_id}` : `Gönderen: ${trade.sender_id}`}</p>
                                <div className="flex gap-4 text-[10px] font-mono">
                                    <span className="text-green-400">Teklif: {trade.offer.credits} CR</span>
                                    <span className="text-red-400">İstek: {trade.request.credits} CR</span>
                                </div>
                                {trade.status === 'pending' && trade.receiver_id === currentUser.id && (
                                    <button onClick={() => handleAcceptTrade(trade)} className="py-2 bg-green-600 rounded-lg text-[9px] font-black uppercase">Kabul Et</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
             </div>
           )}

           {activeTab === 'shipyard' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-500">
                {SHIP_TYPES.map(ship => (
                  <div key={ship.id} className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 text-left group">
                     <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-colors shadow-inner">
                        <Rocket size={32} className="text-cyan-500" />
                     </div>
                     <h4 className="orbitron text-xl font-black text-white mb-2 uppercase">{ship.name}</h4>
                     <p className="text-[11px] text-slate-400 font-mono leading-relaxed italic">Gemi sınıfı: {ship.type.toUpperCase()}</p>
                     <div className="space-y-3 py-6 border-y border-white/5">
                        <ShipCost label="Kredi" val={ship.cost.credits} has={gameState.credits >= ship.cost.credits} />
                        <ShipCost label="Demir" val={ship.cost.iron} has={gameState.resources.iron >= ship.cost.iron} />
                        <ShipCost label="Plazma" val={ship.cost.plasma} has={gameState.resources.plasma >= ship.cost.plasma} />
                     </div>
                     <button onClick={() => buildShip(ship.id)} className="w-full py-5 rounded-2xl orbitron text-[11px] font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500">Üretime Başla</button>
                  </div>
                ))}
             </div>
           )}

           {activeTab === 'ai' && (
             <div className="max-w-2xl mx-auto glass p-12 rounded-[3.5rem] border border-cyan-500/20 text-left">
                <div className="flex items-center gap-8 mb-12">
                   <div className="w-24 h-24 bg-cyan-950 rounded-[2rem] flex items-center justify-center border border-cyan-500/30">
                      <BrainCircuit className="text-cyan-400 w-12 h-12" />
                   </div>
                   <h2 className="orbitron text-2xl font-black text-white uppercase italic tracking-tighter text-left">Stratejik İstihbarat <span className="text-cyan-400">Merkezi</span></h2>
                </div>
                <div className="p-10 rounded-[2.5rem] bg-slate-950/90 border border-white/5 min-h-[180px] mb-10 font-mono text-cyan-50 leading-relaxed text-sm italic shadow-inner">
                   {aiLoading ? <Loader2 className="animate-spin text-cyan-400 mx-auto" size={40} /> : aiAdvice || "Amiral AI talimat bekliyor."}
                </div>
                <button onClick={getStrategicAdvice} className="w-full py-6 bg-gradient-to-r from-cyan-600 to-blue-700 text-white orbitron font-black text-xs rounded-2xl">BRİFİNG İSTE</button>
             </div>
           )}

           {activeTab === 'starmap' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in zoom-in duration-500">
                {gameState.sectors.map(sector => {
                    const isLocked = gameState.level < sector.minLevel;
                    return (
                   <div key={sector.id} className={`glass p-8 rounded-[2.5rem] border relative overflow-hidden group text-left transition-all duration-500 ${isLocked ? 'grayscale border-slate-700 opacity-60' : sector.controlled ? 'border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.05)]' : 'border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.05)]'}`}>
                      {isLocked && (
                          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-4">
                              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-white/10 shadow-xl">
                                  <LockKeyhole className="text-slate-500" size={32} />
                              </div>
                              <p className="orbitron text-xs font-black text-slate-400 uppercase tracking-widest">KİLİTLİ: SEVİYE {sector.minLevel}</p>
                          </div>
                      )}
                      
                      {sector.controlled && <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-500/10 rounded-full blur-3xl animate-pulse" />}
                      
                      <div className="flex justify-between items-center mb-8 relative z-10">
                         <div className={`p-4 rounded-2xl ${isLocked ? 'bg-slate-800 text-slate-500' : sector.controlled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} border border-current opacity-50 group-hover:opacity-100 transition-opacity`}>
                            <MapIcon size={32} />
                         </div>
                         <span className={`orbitron text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${isLocked ? 'bg-slate-800 text-slate-500' : sector.controlled ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {isLocked ? 'ERİŞİM YOK' : sector.controlled ? 'HUZURLU' : 'DÜŞMAN BÖLGESİ'}
                         </span>
                      </div>

                      <h4 className="orbitron text-2xl font-black text-white mb-2 relative z-10">{sector.name}</h4>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6 relative z-10">Bölge Ödülü: <span className="text-cyan-400">+{2500 * sector.minLevel} XP</span></p>
                      
                      <div className="space-y-4 mb-10 relative z-10">
                         <div className="flex justify-between text-[11px] font-mono uppercase">
                            <span className="text-slate-500">Getiri Çarpanı</span>
                            <span className="text-cyan-400 font-bold">x{sector.resourceMultiplier.toFixed(1)}</span>
                         </div>
                         <div className="flex justify-between text-[11px] font-mono uppercase">
                            <span className="text-slate-500">Yerel Tehdit</span>
                            <span className="text-red-500 font-bold">%{sector.risk}</span>
                         </div>
                      </div>

                      <button 
                        onClick={() => deployToSector(sector.id)}
                        disabled={isLocked || sector.controlled}
                        className={`w-full py-5 rounded-2xl orbitron text-[11px] font-black uppercase tracking-widest transition-all relative z-10 ${
                          isLocked ? 'bg-slate-900 text-slate-700 cursor-not-allowed' :
                          sector.controlled ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 
                          'bg-red-600 hover:bg-red-500 text-white shadow-2xl shadow-red-900/40 hover:scale-[1.02]'
                        }`}
                      >
                         {isLocked ? `SEVİYE ${sector.minLevel} GEREKLİ` : sector.controlled ? 'SEKTÖR GÜVENDE' : 'OPERASYON BAŞLAT'}
                      </button>
                   </div>
                )})}
             </div>
           )}
        </main>

        <footer className="py-20 text-center border-t border-slate-900/50">
           <p className="orbitron text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] mb-3">Nebula Galaktik Protokolü | v4.8 Dinamik Ticaret Güncellemesi</p>
           <p className="text-[9px] font-mono text-slate-800 uppercase tracking-widest">Amiral Seviyesi Senkronize Edildi</p>
        </footer>
      </div>
    </div>
  );
};

// --- Yardımcı Bileşenler ---
const QuickStat = ({ icon, label, val, max, color }: any) => (
  <div className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-5 bg-slate-900/20 text-left group hover:border-white/10 transition-all shadow-lg overflow-hidden">
    <div className={`p-4 bg-slate-950 rounded-2xl ${color} shadow-inner border border-white/5 group-hover:scale-110 transition-transform`}>{React.cloneElement(icon, { size: 20 })}</div>
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

const UpgradeCard = ({ icon, title, level, val, cost, canAfford, onUpgrade, color }: any) => {
    const colorMap: {[key: string]: string} = {
        cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
        slate: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
        purple: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
        emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    };
    return (
        <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 flex flex-col gap-4 group hover:border-white/20 transition-all text-left">
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${colorMap[color]}`}>{React.cloneElement(icon, { size: 24 })}</div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Teknoloji Seviyesi</p>
                    <p className="orbitron text-sm font-black text-white">{level}</p>
                </div>
            </div>
            <div>
                <p className="orbitron text-[11px] font-black text-white uppercase mb-1">{title}</p>
                <p className="text-[9px] font-mono text-slate-500 uppercase">Verimlilik: {val}</p>
            </div>
            <button 
                onClick={onUpgrade}
                disabled={!canAfford}
                className={`w-full py-4 rounded-xl orbitron text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    canAfford ? 'bg-slate-800 hover:bg-white/10 text-white border border-white/10' : 'bg-slate-950 text-slate-700 cursor-not-allowed border border-white/5'
                }`}
            >
                <ChevronUp size={14} /> Geliştir ({cost.toLocaleString()} CR)
            </button>
        </div>
    );
};

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-8 py-6 rounded-2xl transition-all orbitron text-[11px] font-black shrink-0 tracking-[0.3em] ${active ? 'bg-cyan-600 text-white shadow-2xl scale-105 z-10 border border-white/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}`}>
    {React.cloneElement(icon, { size: 18 })}
    {label.toUpperCase()}
  </button>
);

const ShipCost = ({ label, val, has }: { label: string, val: number, has: boolean }) => (
  <div className="flex justify-between text-[11px] font-mono uppercase text-left">
     <span className="text-slate-500">{label}</span>
     <span className={has ? 'text-green-400 font-bold' : 'text-red-500'}>{val.toLocaleString()}</span>
  </div>
);

const TradeInput = ({ icon, label, val, onChange }: any) => (
    <div className="flex flex-col gap-1 text-left">
        <label className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter flex items-center gap-1">{icon} {label}</label>
        <input type="number" min="0" value={val} onChange={(e) => onChange(parseInt(e.target.value) || 0)} className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 px-3 text-[10px] font-mono focus:border-cyan-500 outline-none"/>
    </div>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
