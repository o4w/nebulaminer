
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Pickaxe, LogOut, BarChart3, Globe, Target, Database, Zap, Rocket, Cpu, Shield, Crosshair, 
  Sword, Activity, Box, HardDrive, Search, User, Gem, Radar, Waves, 
  Skull, Medal, Terminal, Loader2, Flame, Radio, TrendingUp, Trophy, RefreshCcw,
  Map as MapIcon, ChevronRight, Lock, Award, Star, Zap as ZapIcon, Coins
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// --- Başlatma ---
const SUPABASE_URL = 'https://slfxijiowcbqzhzlnhhh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VJ4oUTpjq-KbKecplM7mog_RR2lhNCz';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Tipler ---
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  bonusDescription: string;
  criteria: (state: GameState) => boolean;
}

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

interface BattleReport {
  id: string;
  timestamp: number;
  attackerId: string;
  defenderId: string;
  attackerCallsign: string;
  defenderCallsign: string;
  won: boolean;
  loot: { iron: number; plasma: number; credits: number };
  losses: { attacker: { [key: string]: number }; defender: { [key: string]: number } };
  aiNarrative?: string;
}

interface GameState {
  credits: number;
  xp: number;
  level: number;
  warPoints: number;
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
    shieldUntil?: number;
  };
  stats: {
    totalCreditsEarned: number;
    totalShipsBuilt: number;
    sectorsLiberated: number;
    battlesWon: number;
    battlesLost: number;
    totalIronMined: number;
  };
  battleHistory: BattleReport[];
  unlockedAchievements: string[];
}

// --- Sabitler ---
const SHIP_TYPES: Ship[] = [
  { id: 'scout', type: 'scout', name: 'Keşif İHA', cost: { credits: 500, iron: 200, plasma: 0, crystal: 0 }, power: 2, description: "Hızlı ve ucuz gözlem aracı.", ability: "Casusluk birimi." },
  { id: 'miner', type: 'miner', name: 'Madenci Fırkateyni', cost: { credits: 1500, iron: 800, plasma: 200, crystal: 50 }, power: 8, description: "Kaynak toplama birimi.", ability: "Üretimi artırır." },
  { id: 'defender', type: 'defender', name: 'Kalkan Muhribi', cost: { credits: 3000, iron: 1500, plasma: 500, crystal: 150 }, power: 25, description: "Standart savunma gemisi.", ability: "Savunma sağlar." },
  { id: 'hauler', type: 'hauler', name: 'Ağır Nakliye Gemisi', cost: { credits: 2500, iron: 1000, plasma: 150, crystal: 200 }, power: 5, description: "Lojistik destek gemisi.", ability: "Verimliliği artırır." },
  { id: 'cruiser', type: 'cruiser', name: 'Ağır Kruvazör', cost: { credits: 8000, iron: 4000, plasma: 2000, crystal: 800 }, power: 120, description: "Yüksek ateş gücü.", ability: "Savaş gücü sağlar." },
  { id: 'mothership', type: 'mothership', name: 'Ana Gemi', cost: { credits: 35000, iron: 15000, plasma: 8000, crystal: 3000 }, power: 650, description: "Galaktik amiral gemisi.", ability: "Maksimum güç." },
];

const SECTORS_LIST: Sector[] = [
  { id: 's1', name: 'Alfa Merkezi', type: 'core', resourceMultiplier: 1.0, risk: 5, controlled: true, minLevel: 1, deployedShips: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } },
  { id: 's2', name: 'Asteroid Kuşağı', type: 'nebula', resourceMultiplier: 1.8, risk: 15, controlled: false, minLevel: 3, deployedShips: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } },
  { id: 's3', name: 'Delta Sınırı', type: 'frontier', resourceMultiplier: 3.2, risk: 30, controlled: false, minLevel: 7, deployedShips: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } },
  { id: 's4', name: 'Pulsar Bölgesi', type: 'nebula', resourceMultiplier: 5.5, risk: 50, controlled: false, minLevel: 12, deployedShips: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } },
  { id: 's5', name: 'Omega Boşluğu', type: 'void', resourceMultiplier: 10.0, risk: 80, controlled: false, minLevel: 20, deployedShips: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 } },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: 'miner_1', name: 'Madencilik Başlangıcı', description: 'Toplamda 5.000 Demir topla.', icon: <Database />, bonusDescription: 'Demir üretimi +5/sn', criteria: (s) => s.stats.totalIronMined >= 5000 },
  { id: 'ship_1', name: 'İlk Filo', description: 'Toplamda 10 adet gemi üret.', icon: <Rocket />, bonusDescription: 'Gemi üretim maliyeti -%10', criteria: (s) => s.stats.totalShipsBuilt >= 10 },
  { id: 'war_1', name: 'Acemi Komutan', description: '5 adet savaş kazan.', icon: <Sword />, bonusDescription: 'Savaş Gücü +%10', criteria: (s) => s.stats.battlesWon >= 5 },
  { id: 'level_5', name: 'Yükselen Yıldız', description: '5. Seviyeye ulaş.', icon: <Star />, bonusDescription: 'Kredi geliri +25/sn', criteria: (s) => s.level >= 5 },
  { id: 'sector_3', name: 'Sektör Hakimi', description: '3 adet sektörü kontrol et.', icon: <MapIcon />, bonusDescription: 'XP kazanımı +%20', criteria: (s) => s.sectors.filter(sec => sec.controlled).length >= 3 },
  { id: 'credit_1', name: 'Milyoner Adayı', description: 'Toplamda 100.000 Kredi kazan.', icon: <Coins />, bonusDescription: 'Satış fiyatları +%15', criteria: (s) => s.stats.totalCreditsEarned >= 100000 },
];

const INITIAL_GAME_STATE: GameState = {
  credits: 5000,
  xp: 0,
  level: 1,
  warPoints: 100,
  resources: { iron: 1000, plasma: 200, crystal: 50, dataBits: 0, darkMatter: 0 },
  upgrades: { pickaxePower: 1, autoMiners: 0, plasmaExtractors: 0, crystalRefineries: 0, researchHubs: 0, storageLevel: 1 },
  fleet: { miner: 0, defender: 0, hauler: 0, scout: 0, cruiser: 0, mothership: 0 },
  sectors: SECTORS_LIST,
  threatLevel: 10,
  lastUpdate: Date.now(),
  market: {
    iron: { price: 2.5, prevPrice: 2, trend: 'up' },
    plasma: { price: 18, prevPrice: 15, trend: 'up' },
    crystal: { price: 55, prevPrice: 50, trend: 'up' }
  },
  profile: {
    callsign: 'Bilinmeyen Amiral',
    motto: 'Yıldızlar rehberimiz olsun.',
    avatarId: 'shield',
    joinedDate: Date.now(),
    shieldUntil: Date.now() + (24 * 60 * 60 * 1000)
  },
  stats: {
    totalCreditsEarned: 0,
    totalShipsBuilt: 0,
    sectorsLiberated: 0,
    battlesWon: 0,
    battlesLost: 0,
    totalIronMined: 0
  },
  battleHistory: [],
  unlockedAchievements: []
};

interface UserData {
  id: string;
  password: string;
  gameState: GameState;
}

const DBService = {
  getUser: async (userId: string): Promise<UserData | null> => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) return null;
      return { id: data.id, password: data.password, gameState: data.game_state };
    } catch { return null; }
  },
  createUser: async (userId: string, pass: string, state: GameState): Promise<boolean> => {
    const { error } = await supabase.from('users').insert([{ id: userId, password: pass, game_state: state }]);
    return !error;
  },
  updateGameState: async (userId: string, state: GameState) => {
    await supabase.from('users').update({ game_state: state }).eq('id', userId);
  },
  getLeaderboard: async (): Promise<any[]> => {
    const { data, error } = await supabase.from('users').select('id, game_state').limit(10);
    if (error) return [];
    return data.map(u => ({
        id: u.id,
        callsign: u.game_state.profile?.callsign || u.id,
        warPoints: u.game_state.warPoints || 0,
        level: u.game_state.level || 1
    })).sort((a,b) => b.warPoints - a.warPoints);
  }
};

const getXPToNextLevel = (level: number) => Math.floor(1000 * level * Math.pow(1.5, level - 1));
const getMaxStorage = (level: number) => 5000 * level;
const getStorageUpgradeCost = (level: number) => Math.floor(2500 * Math.pow(1.8, level - 1));
const getAutoMinerCost = (level: number) => Math.floor(500 * Math.pow(1.5, level));

const App = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [activeTab, setActiveTab] = useState<'command' | 'shipyard' | 'starmap' | 'market' | 'war' | 'achievements' | 'profile'>('command');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  
  const [targetId, setTargetId] = useState('');
  const [targetInfo, setTargetInfo] = useState<any>(null);
  const [combatLoading, setCombatLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Veritabanı Senkronizasyonu
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        DBService.updateGameState(currentUser.id, gameState);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState, currentUser]);

  // Otomatik Giriş
  useEffect(() => {
    const savedId = localStorage.getItem('nebula_pilot_id');
    if (savedId) DBService.getUser(savedId).then(u => u && handleLogin(u));
  }, []);

  // Savaş Alanı Sıralaması
  useEffect(() => {
    if (activeTab === 'war') {
        DBService.getLeaderboard().then(setLeaderboard);
    }
  }, [activeTab]);

  // Pazar Fiyat Dalgalanması
  useEffect(() => {
    if (!currentUser) return;
    const marketInterval = setInterval(() => {
        setGameState(prev => {
            const nextMarket = { ...prev.market };
            Object.keys(nextMarket).forEach(key => {
                const change = (Math.random() * 0.4 - 0.2); // -%20 ile +%20 arası
                const newPrice = Math.max(0.5, nextMarket[key].price * (1 + change));
                nextMarket[key] = {
                    price: newPrice,
                    prevPrice: nextMarket[key].price,
                    trend: newPrice > nextMarket[key].price ? 'up' : 'down'
                };
            });
            return { ...prev, market: nextMarket };
        });
    }, 30000); // 30 saniyede bir fiyatlar değişir
    return () => clearInterval(marketInterval);
  }, [currentUser]);

  // Başarımları Kontrol Etme
  useEffect(() => {
    if (!currentUser) return;
    const toUnlock = ACHIEVEMENTS.filter(a => !gameState.unlockedAchievements.includes(a.id) && a.criteria(gameState));
    if (toUnlock.length > 0) {
        setGameState(prev => ({
            ...prev,
            unlockedAchievements: [...prev.unlockedAchievements, ...toUnlock.map(a => a.id)]
        }));
    }
  }, [gameState, currentUser]);

  const handleLogin = (user: UserData) => {
    localStorage.setItem('nebula_pilot_id', user.id);
    setCurrentUser(user);
    const loadedState = { 
        ...INITIAL_GAME_STATE, 
        ...user.gameState,
        warPoints: user.gameState.warPoints || 100,
        battleHistory: user.gameState.battleHistory || [],
        unlockedAchievements: user.gameState.unlockedAchievements || [],
        stats: { ...INITIAL_GAME_STATE.stats, ...user.gameState.stats }
    };
    setGameState(loadedState);
  };

  const handleAuth = async () => {
    const pid = (document.getElementById('pid') as HTMLInputElement)?.value;
    const pass = (document.getElementById('pass') as HTMLInputElement)?.value;
    if (!pid || !pass) return alert("Bilgileri doldurun.");
    setAuthLoading(true);
    if (authMode === 'login') {
        const user = await DBService.getUser(pid);
        if (user && user.password === pass) handleLogin(user);
        else alert("ID veya Şifre hatalı.");
    } else {
        const existing = await DBService.getUser(pid);
        if (existing) alert("ID kullanımda.");
        else {
            const success = await DBService.createUser(pid, pass, INITIAL_GAME_STATE);
            if (success) handleLogin({ id: pid, password: pass, gameState: INITIAL_GAME_STATE });
        }
    }
    setAuthLoading(false);
  };

  const addXP = useCallback((amount: number) => {
    setGameState(prev => {
      const bonusXP = prev.unlockedAchievements.includes('sector_3') ? 1.2 : 1.0;
      let newXP = prev.xp + (amount * bonusXP);
      let newLevel = prev.level;
      let xpReq = getXPToNextLevel(newLevel);
      while (newXP >= xpReq) {
        newXP -= xpReq;
        newLevel += 1;
        xpReq = getXPToNextLevel(newLevel);
      }
      return { ...prev, xp: newXP, level: newLevel };
    });
  }, []);

  const buildShip = (shipId: string) => {
    const ship = SHIP_TYPES.find(s => s.id === shipId);
    if (!ship) return;
    
    const costDiscount = gameState.unlockedAchievements.includes('ship_1') ? 0.9 : 1.0;
    const currentCosts = {
        credits: Math.floor(ship.cost.credits * costDiscount),
        iron: Math.floor(ship.cost.iron * costDiscount),
        plasma: Math.floor(ship.cost.plasma * costDiscount),
        crystal: Math.floor(ship.cost.crystal * costDiscount)
    };

    if (gameState.credits < currentCosts.credits || gameState.resources.iron < currentCosts.iron || gameState.resources.plasma < currentCosts.plasma || gameState.resources.crystal < currentCosts.crystal) return alert("Kaynak yetersiz!");

    setGameState(prev => ({
        ...prev,
        credits: prev.credits - currentCosts.credits,
        resources: {
            ...prev.resources,
            iron: prev.resources.iron - currentCosts.iron,
            plasma: prev.resources.plasma - currentCosts.plasma,
            crystal: prev.resources.crystal - currentCosts.crystal,
        },
        fleet: { ...prev.fleet, [shipId]: (prev.fleet[shipId] || 0) + 1 },
        stats: { ...prev.stats, totalShipsBuilt: prev.stats.totalShipsBuilt + 1 }
    }));
    addXP(Math.floor(ship.power * 10));
  };

  const handleUpgrade = (type: keyof GameState['upgrades']) => {
    let cost = 0;
    if (type === 'storageLevel') cost = getStorageUpgradeCost(gameState.upgrades.storageLevel);
    else if (type === 'autoMiners') cost = getAutoMinerCost(gameState.upgrades.autoMiners);
    if (gameState.credits < cost) return alert("Kredi yetersiz!");

    setGameState(prev => ({
      ...prev,
      credits: prev.credits - cost,
      upgrades: { ...prev.upgrades, [type]: (prev.upgrades[type] as number) + 1 }
    }));
    addXP(150);
  };

  const handleSpy = async () => {
    if (!targetId || targetId === currentUser?.id) return alert("Geçersiz hedef.");
    if ((gameState.fleet.scout || 0) < 1) return alert("Casusluk için Keşif İHA (Scout) gereklidir.");
    setCombatLoading(true);
    const opponent = await DBService.getUser(targetId);
    if (!opponent) {
        alert("Hedef amiral bulunamadı.");
    } else {
        setTargetInfo({
            id: opponent.id,
            callsign: opponent.gameState.profile?.callsign,
            level: opponent.gameState.level,
            resources: opponent.gameState.resources,
            credits: opponent.gameState.credits,
            fleet: opponent.gameState.fleet,
            hasShield: opponent.gameState.profile?.shieldUntil && opponent.gameState.profile.shieldUntil > Date.now()
        });
        addXP(250);
    }
    setCombatLoading(false);
  };

  const handleAttack = async () => {
    if (!targetId || !targetInfo) return;
    setCombatLoading(true);
    const opponent = await DBService.getUser(targetId);
    if (!opponent) return setCombatLoading(false);

    const bonusAttack = gameState.unlockedAchievements.includes('war_1') ? 1.1 : 1.0;
    // Fix: Remove redundant generic type argument from reduce.
    const calcPower = (fleet: any) => SHIP_TYPES.reduce((acc, s) => acc + ((Number(fleet[s.id]) || 0) * s.power), 0);
    const attPower = calcPower(gameState.fleet) * bonusAttack;
    const defPower = calcPower(opponent.gameState.fleet);

    if (attPower < 50) {
        setCombatLoading(false);
        return alert("Saldırı harekatı için en az 50 Savaş Gücü gerekiyor.");
    }

    const won = Math.random() < Math.min(0.9, Math.max(0.1, attPower / (attPower + defPower)));
    const attLosses: any = {};
    const defLosses: any = {};
    
    SHIP_TYPES.forEach(s => {
        if ((gameState.fleet[s.id] || 0) > 0) attLosses[s.id] = Math.floor(gameState.fleet[s.id] * (won ? 0.08 : 0.35));
        if ((opponent.gameState.fleet[s.id] || 0) > 0) defLosses[s.id] = Math.floor(opponent.gameState.fleet[s.id] * (won ? 0.4 : 0.05));
    });

    let ironLoot = 0, plasmaLoot = 0, creditLoot = 0;
    if (won) {
        ironLoot = Math.floor(opponent.gameState.resources.iron * 0.4);
        plasmaLoot = Math.floor(opponent.gameState.resources.plasma * 0.3);
        creditLoot = Math.floor(opponent.gameState.credits * 0.2); 
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let narrative = "İletişim protokolü aktif...";
    try {
        const prompt = `Amiral ${gameState.profile?.callsign} (Güç: ${attPower.toFixed(0)}) ve Amiral ${opponent.gameState.profile?.callsign} (Güç: ${defPower.toFixed(0)}) çarpıştı. Sonuç: ${won ? 'ZAFER' : 'MAĞLUBİYET'}. Türkçe, epik uzay savaşı tadında 2 cümlelik rapor ver.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        narrative = response.text || narrative;
    } catch(e) { console.error(e); }

    const report: BattleReport = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        attackerId: currentUser!.id,
        defenderId: targetId,
        attackerCallsign: gameState.profile?.callsign || currentUser!.id,
        defenderCallsign: opponent.gameState.profile?.callsign || targetId,
        won,
        loot: { iron: ironLoot, plasma: plasmaLoot, credits: creditLoot },
        losses: { attacker: attLosses, defender: defLosses },
        aiNarrative: narrative
    };

    const newAttFleet = { ...gameState.fleet };
    Object.keys(attLosses).forEach(k => newAttFleet[k] = Math.max(0, (newAttFleet[k] || 0) - attLosses[k]));

    const nextState: GameState = {
        ...gameState,
        credits: gameState.credits + creditLoot + (won ? 2500 : 0),
        warPoints: Math.max(0, gameState.warPoints + (won ? 35 : -20)),
        resources: {
            ...gameState.resources,
            iron: gameState.resources.iron + ironLoot,
            plasma: gameState.resources.plasma + plasmaLoot
        },
        fleet: newAttFleet,
        stats: {
            ...gameState.stats,
            battlesWon: won ? gameState.stats.battlesWon + 1 : gameState.stats.battlesWon,
            battlesLost: !won ? gameState.stats.battlesLost + 1 : gameState.stats.battlesLost,
            totalCreditsEarned: gameState.stats.totalCreditsEarned + creditLoot + (won ? 2500 : 0)
        },
        battleHistory: [report, ...gameState.battleHistory].slice(0, 15)
    };

    setGameState(nextState);
    
    const newDefFleet = { ...opponent.gameState.fleet };
    Object.keys(defLosses).forEach(k => newDefFleet[k] = Math.max(0, (newDefFleet[k] || 0) - defLosses[k]));
    const nextDefState: GameState = {
        ...opponent.gameState,
        credits: Math.max(0, opponent.gameState.credits - creditLoot),
        resources: {
            ...opponent.gameState.resources,
            iron: Math.max(0, opponent.gameState.resources.iron - ironLoot),
            plasma: Math.max(0, opponent.gameState.resources.plasma - plasmaLoot)
        },
        fleet: newDefFleet,
        profile: { ...opponent.gameState.profile!, shieldUntil: won ? Date.now() + 8 * 3600000 : opponent.gameState.profile?.shieldUntil }
    };
    await DBService.updateGameState(targetId, nextDefState);

    setCombatLoading(false);
    addXP(won ? 3500 : 1000);
  };

  const captureSector = (sectorId: string) => {
    const sector = gameState.sectors.find(s => s.id === sectorId);
    if (!sector || sector.controlled) return;
    // Fix: Remove redundant generic type argument from reduce.
    const calcPower = (fleet: any) => SHIP_TYPES.reduce((acc, s) => acc + ((Number(fleet[s.id]) || 0) * s.power), 0);
    const power = calcPower(gameState.fleet);
    const reqPower = sector.risk * 15;
    
    if (power < reqPower) return alert(`Bu tehlikeli sektörü ele geçirmek için en az ${reqPower} Savaş Gücü gerekiyor.`);
    
    setGameState(prev => ({
        ...prev,
        sectors: prev.sectors.map(s => s.id === sectorId ? { ...s, controlled: true } : s),
        stats: { ...prev.stats, sectorsLiberated: prev.stats.sectorsLiberated + 1 }
    }));
    addXP(sector.risk * 100);
    alert(`${sector.name} artık amiral geminizin kontrolünde!`);
  };

  const handleTrade = (resType: 'iron' | 'plasma' | 'crystal', action: 'buy' | 'sell') => {
    const bonusSell = gameState.unlockedAchievements.includes('credit_1') ? 1.15 : 1.0;
    const price = gameState.market[resType].price * (action === 'sell' ? bonusSell : 1.0);
    const amount = 100;
    setGameState(prev => {
        let ns = { ...prev };
        if (action === 'buy') {
            if (prev.credits >= price * amount) {
                ns.credits -= price * amount;
                ns.resources[resType] += amount;
            } else alert("Kredi yetersiz.");
        } else {
            if (prev.resources[resType] >= amount) {
                ns.credits += price * amount;
                ns.resources[resType] -= amount;
                ns.stats.totalCreditsEarned += price * amount;
            } else alert("Kaynak yetersiz.");
        }
        return ns;
    });
  };

  // Ana Üretim Döngüsü (Her Saniye)
  useEffect(() => {
    if (!currentUser) return;
    const productionInterval = setInterval(() => {
      setGameState(prev => {
        const maxCap = getMaxStorage(prev.upgrades.storageLevel);
        const autoPower = prev.upgrades.autoMiners * 2.5;
        const globalMinerPower = (prev.fleet.miner || 0) * 5;
        
        const secBonuses = prev.sectors.filter(s => s.controlled).reduce<number>((acc, s) => {
            const eff = 1 + ((s.deployedShips?.hauler || 0) * 0.3);
            return acc + (s.resourceMultiplier * ((s.deployedShips?.miner || 0) * 8 + 4) * eff);
        }, 0);

        const achBonusIron = prev.unlockedAchievements.includes('miner_1') ? 5 : 0;
        const achBonusCredits = prev.unlockedAchievements.includes('level_5') ? 25 : 0;

        const ironGained = (autoPower + globalMinerPower + secBonuses + achBonusIron);

        return {
          ...prev,
          credits: prev.credits + achBonusCredits,
          resources: {
            ...prev.resources,
            iron: Math.min(maxCap, prev.resources.iron + ironGained),
            plasma: Math.min(maxCap, prev.resources.plasma + (globalMinerPower * 0.15 + secBonuses * 0.08)),
            crystal: Math.min(maxCap, prev.resources.crystal + (secBonuses * 0.03)),
          },
          stats: {
            ...prev.stats,
            totalIronMined: prev.stats.totalIronMined + ironGained,
            totalCreditsEarned: prev.stats.totalCreditsEarned + achBonusCredits
          }
        };
      });
    }, 1000);
    return () => clearInterval(productionInterval);
  }, [currentUser]);

  if (!currentUser) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
      <div className="glass p-12 rounded-[3.5rem] border border-cyan-500/20 text-center max-w-md w-full shadow-2xl z-10 animate-in fade-in zoom-in duration-500">
        <Globe className="w-16 h-16 text-cyan-400 mx-auto mb-8 animate-pulse" />
        <h1 className="orbitron text-3xl font-black text-white mb-8 tracking-tighter uppercase italic">Nebula <span className="text-cyan-400">Komutanlığı</span></h1>
        <div className="flex bg-slate-900 p-1 rounded-2xl mb-8 border border-white/5">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-3 rounded-xl orbitron text-[10px] uppercase transition-all ${authMode === 'login' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>Giriş</button>
            <button onClick={() => setAuthMode('signup')} className={`flex-1 py-3 rounded-xl orbitron text-[10px] uppercase transition-all ${authMode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Kayıt</button>
        </div>
        <div className="space-y-4">
           <input id="pid" type="text" placeholder="Pilot ID" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-cyan-50 outline-none font-mono text-sm focus:border-cyan-500 transition-all" />
           <input id="pass" type="password" placeholder="Şifre" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-cyan-50 outline-none font-mono text-sm focus:border-cyan-500 transition-all" />
           <button onClick={handleAuth} disabled={authLoading} className="w-full py-5 rounded-2xl orbitron text-white uppercase bg-gradient-to-r from-cyan-600 to-blue-700 font-black tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
             {authLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Sistemi Başlat'}
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        <header className="glass rounded-[2rem] p-8 border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="flex items-center gap-6 text-left">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-inner">
                <ShipIcon type={gameState.profile?.avatarId || 'shield'} size={32} />
            </div>
            <div>
                <h1 className="orbitron text-xl font-black uppercase italic tracking-tighter">
                    <span className="text-slate-500 text-xs font-mono mr-2">[{currentUser.id}]</span>
                    {gameState.profile?.callsign}
                </h1>
                <p className="text-[10px] font-mono text-cyan-400 uppercase flex items-center gap-2">
                    <Trophy size={10} className="text-yellow-500" /> {gameState.warPoints} P | Sv. {gameState.level}
                </p>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-900/80 px-8 py-4 rounded-3xl border border-yellow-500/20 text-right shadow-inner">
                <p className="text-[10px] font-black text-yellow-600 uppercase mb-1 tracking-widest">Kredi</p>
                <p className="orbitron text-2xl font-bold text-yellow-400">{Math.floor(gameState.credits).toLocaleString()}</p>
             </div>
             <button onClick={() => { localStorage.removeItem('nebula_pilot_id'); window.location.reload(); }} className="p-5 bg-slate-800 text-slate-400 rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/5">
                <LogOut size={24} />
             </button>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           <QuickStat icon={<Database />} label="Demir" val={gameState.resources.iron} max={getMaxStorage(gameState.upgrades.storageLevel)} color="text-slate-400" />
           <QuickStat icon={<Zap />} label="Plazma" val={gameState.resources.plasma} max={getMaxStorage(gameState.upgrades.storageLevel)} color="text-purple-400" />
           <QuickStat icon={<Gem />} label="Kristal" val={gameState.resources.crystal} max={getMaxStorage(gameState.upgrades.storageLevel)} color="text-emerald-400" />
           {/* Fix: Remove redundant generic type argument from reduce. */}
           <QuickStat icon={<Rocket />} label="Donanma" val={Object.values(gameState.fleet).reduce((a, b) => a + (Number(b) || 0), 0)} color="text-cyan-400" />
           {/* Fix: Remove redundant generic type argument from reduce. */}
           <QuickStat icon={<Flame />} label="Güç" val={SHIP_TYPES.reduce((acc, s) => acc + ((gameState.fleet[s.id] || 0) * s.power), 0) * (gameState.unlockedAchievements.includes('war_1') ? 1.1 : 1.0)} color="text-red-500" />
        </div>

        <nav className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar shadow-xl sticky top-4 z-50 backdrop-blur-md">
           <NavBtn active={activeTab === 'command'} onClick={() => setActiveTab('command')} icon={<Activity />} label="Üs" />
           <NavBtn active={activeTab === 'shipyard'} onClick={() => setActiveTab('shipyard')} icon={<Cpu />} label="Tersane" />
           <NavBtn active={activeTab === 'starmap'} onClick={() => setActiveTab('starmap')} icon={<MapIcon />} label="Harita" />
           <NavBtn active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<BarChart3 />} label="Ticaret" />
           <NavBtn active={activeTab === 'war'} onClick={() => setActiveTab('war')} icon={<Sword />} label="Savaş" />
           <NavBtn active={activeTab === 'achievements'} onClick={() => setActiveTab('achievements')} icon={<Award />} label="Başarılar" />
           <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User />} label="Profil" />
        </nav>

        <main className="min-h-[500px]">
           {activeTab === 'command' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass rounded-[2.5rem] p-10 flex flex-col items-center justify-center border border-cyan-500/10 min-h-[350px] bg-gradient-to-b from-slate-900/40 to-transparent">
                        <button onClick={() => { setGameState(prev => ({ ...prev, credits: prev.credits + 75 })); addXP(15); }} className="relative w-56 h-56 glass border-4 border-cyan-500/20 rounded-full flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all group shadow-2xl">
                            <Target size={64} className="text-cyan-400 group-hover:animate-pulse" />
                            <span className="orbitron text-xs font-black uppercase mt-4 text-slate-400 tracking-widest group-hover:text-cyan-400">Sinyal Gönder</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UpgradeCard icon={<HardDrive />} title="Lojistik Depo" level={gameState.upgrades.storageLevel} cost={getStorageUpgradeCost(gameState.upgrades.storageLevel)} canAfford={gameState.credits >= getStorageUpgradeCost(gameState.upgrades.storageLevel)} onUpgrade={() => handleUpgrade('storageLevel')} color="cyan" />
                        <UpgradeCard icon={<Pickaxe />} title="Otonom Madenci" level={gameState.upgrades.autoMiners} cost={getAutoMinerCost(gameState.upgrades.autoMiners)} canAfford={gameState.credits >= getAutoMinerCost(gameState.upgrades.autoMiners)} onUpgrade={() => handleUpgrade('autoMiners')} color="slate" />
                    </div>
                </div>
                <div className="space-y-4 text-left">
                   <h3 className="orbitron text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Donanma Durumu</h3>
                   <div className="flex flex-col gap-3">
                        {Object.entries(gameState.fleet).map(([id, count]) => {
                            const info = SHIP_TYPES.find(s => s.id === id);
                            if (!info || count === 0) return null;
                            return (
                            <div key={id} className="glass p-5 rounded-2xl border border-white/5 flex items-center justify-between hover:border-cyan-500/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-950 rounded-xl text-cyan-400"><ShipIcon type={info.type} /></div>
                                    <p className="orbitron text-[10px] font-black uppercase text-white">{info.name}</p>
                                </div>
                                <span className="orbitron text-lg font-black text-cyan-400">{count}</span>
                            </div>
                        )})}
                        {Object.values(gameState.fleet).every(v => v === 0) && <p className="text-[10px] font-mono text-slate-600 p-8 text-center italic">Henüz geminiz yok. Tersaneye gidin.</p>}
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'market' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-500">
                {Object.entries(gameState.market).map(([key, data]: [any, any]) => (
                    <div key={key} className="glass p-8 rounded-[2.5rem] border border-white/5 text-left flex flex-col gap-6 group hover:border-yellow-500/20 transition-all">
                        <div className="flex justify-between items-center">
                            <h3 className="orbitron text-lg font-black uppercase text-white">{key === 'iron' ? 'Demir' : key === 'plasma' ? 'Plazma' : 'Kristal'}</h3>
                            <div className={`px-3 py-1 rounded-lg text-[9px] font-black orbitron ${data.trend === 'up' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                {data.trend === 'up' ? '▲ YÜKSELİŞ' : '▼ DÜŞÜŞ'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Birim Fiyat</p>
                            <div className="flex items-baseline gap-2">
                                <p className="orbitron text-2xl font-bold text-yellow-400">{data.price.toFixed(2)} CR</p>
                                <span className="text-[10px] text-slate-600 line-through">{data.prevPrice.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleTrade(key, 'buy')} className="py-4 bg-slate-800 hover:bg-green-600 text-white orbitron text-[9px] font-black uppercase rounded-xl transition-all border border-white/5">100 AL</button>
                            <button onClick={() => handleTrade(key, 'sell')} className="py-4 bg-slate-800 hover:bg-red-600 text-white orbitron text-[9px] font-black uppercase rounded-xl transition-all border border-white/5">100 SAT</button>
                        </div>
                    </div>
                ))}
             </div>
           )}

           {activeTab === 'starmap' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-8 duration-500">
                {gameState.sectors.map(sector => (
                    <div key={sector.id} className={`glass p-8 rounded-[2.5rem] text-left relative overflow-hidden transition-all ${sector.controlled ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5 bg-slate-900/40 opacity-80'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="orbitron text-xl font-black text-white">{sector.name}</h3>
                                <p className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">{sector.type} SEKTÖRÜ</p>
                            </div>
                            {sector.controlled ? (
                                <div className="p-3 bg-green-500/10 rounded-xl text-green-400 border border-green-500/20"><Globe size={24}/></div>
                            ) : (
                                <div className="p-3 bg-slate-950 rounded-xl text-slate-700 border border-white/5"><Lock size={24}/></div>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Üretim</p>
                                <p className="orbitron text-[10px] font-black text-green-400">x{sector.resourceMultiplier}</p>
                            </div>
                            <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Konuşlu</p>
                                {/* Fix: Remove redundant generic type argument from reduce. */}
                                <p className="orbitron text-[10px] font-black text-cyan-400">{Object.values(sector.deployedShips || {}).reduce((a, b) => a + (Number(b) || 0), 0)}</p>
                            </div>
                            <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Gereksinim</p>
                                <p className="orbitron text-[10px] font-black text-red-500">{sector.risk * 15} SG</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {sector.controlled ? (
                                <>
                                <button onClick={() => {
                                    if((gameState.fleet.miner || 0) < 1) return alert("Geminiz yok!");
                                    setGameState(p=>({...p, fleet:{...p.fleet, miner:(p.fleet.miner||0)-1}, sectors:p.sectors.map(s=>s.id===sector.id?{...s, deployedShips:{...(s.deployedShips||{}), miner:(Number(s.deployedShips?.miner)||0)+1}}:s)}));
                                }} className="flex-1 py-3 bg-slate-800 hover:bg-cyan-900 text-[9px] font-black orbitron uppercase rounded-xl transition-all border border-white/5">Madenci Gönder</button>
                                <button onClick={() => {
                                    if((gameState.fleet.hauler || 0) < 1) return alert("Geminiz yok!");
                                    setGameState(p=>({...p, fleet:{...p.fleet, hauler:(p.fleet.hauler||0)-1}, sectors:p.sectors.map(s=>s.id===sector.id?{...s, deployedShips:{...(s.deployedShips||{}), hauler:(Number(s.deployedShips?.hauler)||0)+1}}:s)}));
                                }} className="flex-1 py-3 bg-slate-800 hover:bg-indigo-900 text-[9px] font-black orbitron uppercase rounded-xl transition-all border border-white/5">Lojistik Gönder</button>
                                </>
                            ) : (
                                <button onClick={() => captureSector(sector.id)} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white orbitron text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"><Sword size={16}/> SEKTÖRÜ ELE GEÇİR</button>
                            )}
                        </div>
                    </div>
                ))}
             </div>
           )}

           {activeTab === 'achievements' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-12 duration-500">
                {ACHIEVEMENTS.map(ach => {
                    const isUnlocked = gameState.unlockedAchievements.includes(ach.id);
                    return (
                        <div key={ach.id} className={`glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-4 text-left relative overflow-hidden transition-all ${isUnlocked ? 'bg-cyan-900/10 border-cyan-500/30' : 'opacity-50 grayscale'}`}>
                            <div className="flex justify-between items-start">
                                <div className={`p-4 rounded-2xl flex items-center justify-center ${isUnlocked ? 'bg-cyan-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'}`}>
                                    {React.isValidElement(ach.icon) ? React.cloneElement(ach.icon as React.ReactElement, { size: 32 } as any) : ach.icon}
                                </div>
                                {isUnlocked && <Star className="text-yellow-400 fill-yellow-400 animate-pulse" size={24} />}
                            </div>
                            <div>
                                <h4 className="orbitron text-lg font-black text-white">{ach.name}</h4>
                                <p className="text-[10px] text-slate-400 font-mono mt-1 italic">{ach.description}</p>
                            </div>
                            <div className={`mt-4 p-4 rounded-2xl border border-white/10 ${isUnlocked ? 'bg-cyan-950/40' : 'bg-slate-900/50'}`}>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Aktif Bonus</p>
                                <p className={`orbitron text-[11px] font-black ${isUnlocked ? 'text-green-400' : 'text-slate-600'}`}>{ach.bonusDescription}</p>
                            </div>
                        </div>
                    );
                })}
             </div>
           )}

           {activeTab === 'war' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-12 duration-500">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass p-10 rounded-[3rem] border border-red-500/20 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Crosshair size={200} className="text-red-500" /></div>
                        <h3 className="orbitron text-2xl font-black text-white uppercase italic tracking-tighter mb-8">Operasyon <span className="text-red-500">Merkezi</span></h3>
                        
                        <div className="flex gap-4 mb-10">
                            <div className="relative flex-1">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input type="text" placeholder="Hedef Pilot ID" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm font-mono focus:border-red-500 outline-none transition-all shadow-inner" />
                            </div>
                            <button onClick={handleSpy} disabled={combatLoading} className="px-8 bg-slate-800 hover:bg-slate-700 text-cyan-400 orbitron text-[10px] font-black uppercase rounded-2xl transition-all flex items-center gap-2 border border-white/5">
                                {combatLoading ? <Loader2 className="animate-spin" /> : <><Radio size={18}/> İstihbarat</>}
                            </button>
                        </div>

                        {targetInfo && (
                            <div className="p-8 bg-slate-950/50 rounded-[2rem] border border-white/5 space-y-6 animate-in fade-in zoom-in duration-300 shadow-2xl">
                                <div className="flex justify-between items-start">
                                    <div><h4 className="orbitron text-xl font-black text-white">{targetInfo.callsign} <span className="text-slate-600 text-sm italic">[Sv. {targetInfo.level}]</span></h4></div>
                                    <div className={`px-4 py-1.5 rounded-full orbitron text-[8px] font-black border ${targetInfo.hasShield ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-red-500 text-red-400 bg-red-500/10'}`}>{targetInfo.hasShield ? 'KALKAN AKTİF' : 'SALDIRIYA AÇIK'}</div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <SpyStat label="Kredi" val={targetInfo.credits} icon={<Trophy size={14}/>} />
                                    <SpyStat label="Demir" val={targetInfo.resources.iron} icon={<Database size={14}/>} />
                                    {/* Fix: Remove redundant generic type argument from reduce. */}
                                    <SpyStat label="Güç" val={SHIP_TYPES.reduce((acc, s) => acc + ((Number(targetInfo.fleet?.[s.id]) || 0) * s.power), 0)} icon={<Shield size={14}/>} />
                                    <SpyStat label="WP" val={targetInfo.warPoints || 0} icon={<TrendingUp size={14}/>} />
                                </div>
                                <button onClick={handleAttack} disabled={combatLoading || targetInfo.hasShield} className={`w-full py-6 rounded-2xl orbitron font-black text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 ${targetInfo.hasShield ? 'bg-slate-900 text-slate-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_40px_rgba(220,38,38,0.4)]'}`}>
                                    {combatLoading ? <Loader2 className="animate-spin" /> : <><Sword size={22}/> SALDIRIYI BAŞLAT</>}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="glass p-8 rounded-[2.5rem] border border-white/5">
                        <h4 className="orbitron text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6"><Trophy size={14}/> Galaktik Sıralama</h4>
                        <div className="space-y-3">
                            {leaderboard.length === 0 && <p className="text-[10px] text-slate-600 text-center py-4 italic">Sıralama verisi yükleniyor...</p>}
                            {leaderboard.map((player, idx) => (
                                <div key={player.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${player.id === currentUser?.id ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-950 border-white/5 hover:border-white/20'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className="orbitron text-xs font-black text-slate-600">#{idx + 1}</span>
                                        <div className="text-left"><p className="orbitron text-xs font-black text-white">{player.callsign}</p><p className="text-[9px] font-mono text-slate-500 uppercase">Seviye {player.level}</p></div>
                                    </div>
                                    <div className="text-right">
                                        <p className="orbitron text-sm font-black text-cyan-400">{player.warPoints} P</p>
                                        {player.id !== currentUser?.id && <button onClick={() => setTargetId(player.id)} className="text-[8px] font-black text-red-500 hover:text-red-400 uppercase mt-1 tracking-widest transition-all">HEDEFLE</button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="space-y-6 text-left">
                    <h3 className="orbitron text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Savaş Günlüğü</h3>
                    <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scroll">
                        {gameState.battleHistory.length === 0 && <p className="text-center py-20 text-slate-700 font-mono text-xs italic">Savaş kaydı yok.</p>}
                        {gameState.battleHistory.map(report => (
                            <div key={report.id} className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <span className={`orbitron text-[9px] font-black ${report.won ? 'text-green-500' : 'text-red-500'}`}>{report.won ? 'ZAFER' : 'MAĞLUBİYET'}</span>
                                    <span className="text-[8px] font-mono text-slate-600">{new Date(report.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-[11px] font-mono text-slate-300 mb-2 leading-relaxed">{report.aiNarrative || `Operasyon tamamlandı: ${report.defenderCallsign}`}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                                    <span className="text-[9px] font-mono text-green-600">Loot: {report.loot.credits} CR</span>
                                    {/* Fix: Remove redundant generic type argument from reduce. */}
                                    <span className="text-[9px] font-mono text-red-600">Kayıp: {Object.values(report.losses.attacker || {}).reduce((a, b) => a + (Number(b) || 0), 0)} Gemi</span>
                                </div>
                                <button onClick={() => setTargetId(report.defenderId)} className="w-full py-2 bg-slate-900 text-[8px] font-black orbitron uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 border border-white/5"><Target size={10}/> İNTİKAM AL</button>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
           )}

           {activeTab === 'shipyard' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-12 duration-500">
                {SHIP_TYPES.map(ship => {
                    const costDiscount = gameState.unlockedAchievements.includes('ship_1') ? 0.9 : 1.0;
                    const creditsCost = Math.floor(ship.cost.credits * costDiscount);
                    const ironCost = Math.floor(ship.cost.iron * costDiscount);
                    const plasmaCost = Math.floor(ship.cost.plasma * costDiscount);
                    const crystalCost = Math.floor(ship.cost.crystal * costDiscount);

                    const canAfford = gameState.credits >= creditsCost && 
                                     gameState.resources.iron >= ironCost && 
                                     gameState.resources.plasma >= plasmaCost && 
                                     gameState.resources.crystal >= crystalCost;

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
                            <h4 className="orbitron text-xl font-black text-white mb-2">{ship.name}</h4>
                            <div className="space-y-3 py-4 border-y border-white/5">
                                <div className="flex justify-between text-[10px] font-mono uppercase"><span className="text-slate-500">Savaş Gücü</span><span className="text-red-400 font-bold">{ship.power} SG</span></div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <CostRow label="Kredi" val={creditsCost} has={gameState.credits >= creditsCost} />
                                    <CostRow label="Demir" val={ironCost} has={gameState.resources.iron >= ironCost} />
                                </div>
                            </div>
                            <button onClick={() => buildShip(ship.id)} disabled={!canAfford} className={`w-full py-4 rounded-xl orbitron text-[10px] font-black uppercase transition-all shadow-lg ${canAfford ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed grayscale'}`}>Üretimi Başlat</button>
                        </div>
                    );
                })}
             </div>
           )}

           {activeTab === 'profile' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-12 duration-500">
                <div className="glass p-10 rounded-[3rem] border border-cyan-500/20 text-left shadow-2xl">
                    <Terminal className="text-cyan-400 mb-8" size={32} />
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Amiral Çağrı Adı</label>
                            <input type="text" value={gameState.profile?.callsign} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-sm font-mono text-cyan-50 outline-none shadow-inner" disabled />
                        </div>
                        <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 shadow-inner">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Koruma Kalkanı Durumu</p>
                            <p className="text-xs font-mono text-slate-400 italic">
                                {gameState.profile?.shieldUntil && gameState.profile.shieldUntil > Date.now() 
                                    ? `Aktif: ${new Date(gameState.profile.shieldUntil).toLocaleTimeString()} tarihine kadar koruma altındasınız.` 
                                    : "Pasif: Galaktik tehditlere karşı korumanız bulunmamaktadır."}
                            </p>
                        </div>
                        <div className="p-4 flex gap-4">
                            <div className="flex-1 p-4 bg-slate-900 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Katılım</p>
                                <p className="text-[10px] font-mono text-white">{new Date(gameState.profile?.joinedDate || Date.now()).toLocaleDateString()}</p>
                            </div>
                            <div className="flex-1 p-4 bg-slate-900 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Seviye XP</p>
                                <p className="text-[10px] font-mono text-white">{Math.floor(gameState.xp).toLocaleString()} / {getXPToNextLevel(gameState.level).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="glass p-10 rounded-[3rem] border border-white/5 text-left shadow-2xl">
                    <h3 className="orbitron text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 px-2">Hizmet Dökümü</h3>
                    <div className="space-y-6">
                        <StatDisplay label="Savaş Puanı (WP)" val={gameState.warPoints.toString()} icon={<TrendingUp className="text-cyan-500" />} />
                        {/* Fix: Remove redundant generic type argument from reduce. */}
                        <StatDisplay label="Operasyonel Güç" val={(SHIP_TYPES.reduce((acc, s) => acc + ((gameState.fleet[s.id] || 0) * s.power), 0) * (gameState.unlockedAchievements.includes('war_1') ? 1.1 : 1.0)).toFixed(0)} icon={<Shield className="text-red-500" />} />
                        <StatDisplay label="Sektör Hakimiyeti" val={gameState.sectors.filter(s=>s.controlled).length.toString() + " / " + gameState.sectors.length} icon={<Globe className="text-green-500" />} />
                        <StatDisplay label="Toplam Servet" val={gameState.stats.totalCreditsEarned.toLocaleString() + " CR"} icon={<Coins className="text-yellow-500" />} />
                        <StatDisplay label="Toplam Madencilik" val={Math.floor(gameState.stats.totalIronMined).toLocaleString() + " Demir"} icon={<Pickaxe className="text-slate-400" />} />
                    </div>
                </div>
             </div>
           )}
        </main>
      </div>
      <footer className="mt-20 py-10 opacity-30 text-center border-t border-white/5">
         <p className="text-[8px] orbitron uppercase tracking-[0.5em] text-slate-500">Nebula Command Interface &copy; 2025 | Secure Connection Enabled</p>
      </footer>
    </div>
  );
};

// --- Alt Bileşenler ---
interface SpyStatProps { label: string; val: number; icon: React.ReactNode; }
const SpyStat = ({ label, val, icon }: SpyStatProps) => (
    <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 text-left shadow-inner">
        <div className="flex items-center gap-2 mb-2 text-slate-500">{icon}<span className="text-[8px] font-black uppercase tracking-widest">{label}</span></div>
        <p className="orbitron text-xs font-black text-white">{Math.floor(val).toLocaleString()}</p>
    </div>
);

const StatDisplay = ({ label, val, icon }: { label: string, val: string, icon: React.ReactNode }) => (
    <div className="flex items-center gap-4 group">
        <div className="w-12 h-12 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">{icon}</div>
        <div className="text-left"><p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</p><p className="orbitron text-sm font-black text-white">{val}</p></div>
    </div>
);

const ShipIcon = ({ type, size = 18 }: { type: Ship['type'] | string, size?: number }) => {
    switch (type) {
        case 'scout': return <Radar size={size} />;
        case 'miner': return <Pickaxe size={size} />;
        case 'hauler': return <Box size={size} />;
        case 'cruiser': return <Sword size={size} />;
        case 'mothership': return <Waves size={size} />;
        default: return <Shield size={size} />;
    }
};

const CostRow = ({ label, val, has }: { label: string, val: number, has: boolean }) => (
    <div className="flex justify-between items-center text-[9px] font-mono"><span className="text-slate-500 uppercase">{label}</span><span className={has ? 'text-green-400' : 'text-red-500'}>{val.toLocaleString()}</span></div>
);

interface QuickStatProps { icon: React.ReactNode; label: string; val: number; max?: number; color: string; }
const QuickStat = ({ icon, label, val, max, color }: QuickStatProps) => {
  const safeVal: number = typeof val === 'number' ? val : (Number(val) || 0);
  const safeMax: number | undefined = typeof max === 'number' ? max : undefined;

  return (
    <div className="glass p-5 rounded-3xl border border-white/5 flex items-center gap-5 bg-slate-900/20 text-left group hover:border-white/10 transition-all shadow-lg overflow-hidden">
      <div className={`p-4 bg-slate-950 rounded-2xl ${color} shadow-inner border border-white/5 group-hover:scale-110 transition-transform`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 20 } as any) : icon}
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
         <div className="flex justify-between items-center mb-1">
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</span>
           {safeMax !== undefined && safeMax > 0 && (
             <span className={`text-[8px] font-mono ${safeVal >= safeMax ? 'text-red-500' : 'text-slate-600'}`}>
               {safeVal >= safeMax ? 'MAX' : `%${Math.floor((safeVal / safeMax) * 100)}`}
             </span>
           )}
         </div>
         <span className={`orbitron text-base font-black truncate ${color}`}>{Math.floor(safeVal).toLocaleString()}</span>
      </div>
    </div>
  );
};

interface UpgradeCardProps { icon: React.ReactNode; title: string; level: number; cost: number; canAfford: boolean; onUpgrade: () => void; color: string; }
const UpgradeCard = ({ icon, title, level, cost, canAfford, onUpgrade, color }: UpgradeCardProps) => (
    <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 flex flex-col gap-4 group hover:border-white/20 transition-all text-left shadow-lg">
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl bg-slate-950 text-${color}-400 border border-white/5 shadow-inner`}>
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 24 } as any) : icon}
            </div>
            <div className="text-right"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gelişim</p><p className="orbitron text-sm font-black text-white">Sv. {level}</p></div>
        </div>
        <div><p className="orbitron text-[11px] font-black text-white uppercase mb-1">{title}</p><p className="text-[10px] font-mono text-slate-500 uppercase">{cost.toLocaleString()} CR</p></div>
        <button onClick={onUpgrade} disabled={!canAfford} className={`w-full py-4 rounded-xl orbitron text-[9px] font-black uppercase transition-all shadow-md ${canAfford ? 'bg-slate-800 hover:bg-cyan-900 text-white' : 'bg-slate-950 text-slate-700 cursor-not-allowed grayscale'}`}>Sistemi Geliştir</button>
    </div>
);

interface NavBtnProps { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; }
const NavBtn = ({ active, onClick, icon, label }: NavBtnProps) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-6 py-6 rounded-2xl transition-all orbitron text-[9px] font-black shrink-0 tracking-widest group ${active ? 'bg-cyan-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}>
    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 18 } as any) : icon}
    {label.toUpperCase()}
  </button>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
