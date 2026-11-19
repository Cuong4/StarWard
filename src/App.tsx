import React, { useEffect, useRef, useState } from 'react';
import { SoundEngine } from './game/audio';
import { StarwardEngine } from './game/engine';
import {
  AchievementDefinition,
  DashDirectionMode,
  GameMode,
  GameState,
  HangarUpgradeId,
  HudSnapshot,
  KeybindConfig,
  PlayerProfile,
  ShipId,
} from './game/types';
import { loadPlayerProfile } from './game/catalog';
import { GameHud } from './components/GameHud';
import { TitleOverlay } from './components/TitleOverlay';
import { ModalOverlay } from './components/ModalOverlay';
import { PerkSelectModal } from './components/PerkSelectModal';
import { HangarModal } from './components/HangarModal';
import { AchievementsModal } from './components/AchievementsModal';
import { KeybindsModal } from './components/KeybindsModal';
import { PcDownloadModal } from './components/PcDownloadModal';

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  bestScore: 0,
  multiplier: 1,
  comboProgress: 0,
  wave: 1,
  waveProgress: 0,
  hp: 300,
  maxHp: 300,
  shields: 300,
  maxShields: 300,
  dashCharge: 1,
  holdChargeRatio: 0,
  overdriveCharge: 0,
  overdriveActive: false,
  overdriveTimeLeft: 0,
  weapon: 'pulse',
  weaponLevel: 1,
  runShards: 0,
  totalShards: 0,
  enemiesDefeated: 0,
  bossesDefeated: 0,
  waveBanner: null,
  sectorName: 'VÀNH ĐAI HỔ PHÁCH',
  sectorSubtitle: 'Khu Vực Biên Giới Tinh Hà · Sector 01',
  sectorAccent: '#F59E0B',
  isNewBest: false,
  mode: 'arcade',
  shipId: 'vanguard',
  dashDirectionMode: 'mouse',
  activePerks: [],
  perkChoices: [],
  activeBoosts: [],
  boss: null,
  liveStats: {
    damageBonusPct: 0,
    fireRateBonusPct: 0,
    speedBonusPct: 0,
    bonusMaxHp: 0,
    hpRegenPerSec: 6,
    dashCooldownSec: 2.0,
    magnetRadiusPx: 145,
    shardBonusPct: 0,
    overdriveGainBonusPct: 0,
    extraBarrels: 0,
    bonusPierce: 0,
    hangarLevels: {
      hull: 0,
      firepower: 0,
      thruster: 0,
      magnet: 0,
      overdrive: 0,
    },
  },
};

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<StarwardEngine | null>(null);
  const soundRef = useRef<SoundEngine | null>(null);

  const [profile, setProfile] = useState<PlayerProfile>(() => loadPlayerProfile());
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [hud, setHud] = useState<HudSnapshot>(() => ({
    ...INITIAL_HUD,
    shipId: profile.selectedShip,
    mode: profile.selectedMode,
    totalShards: profile.starShards,
    dashDirectionMode: profile.dashDirectionMode ?? 'mouse',
  }));
  const [muted, setMuted] = useState(false);
  const [modal, setModal] = useState<'none' | 'hangar' | 'achievements' | 'keybinds' | 'pcdownload'>('none');
  const [toastAchievement, setToastAchievement] = useState<AchievementDefinition | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sound = new SoundEngine();
    soundRef.current = sound;

    const engine = new StarwardEngine(canvas, sound, {
      onStateChange: (nextState) => setGameState(nextState),
      onHudUpdate: (snapshot) => setHud(snapshot),
      onProfileUpdate: (nextProfile) => setProfile({ ...nextProfile }),
      onAchievementUnlock: (ach) => {
        setToastAchievement(ach);
        setTimeout(() => setToastAchievement(null), 4000);
      },
    });

    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleToggleMute = () => {
    const sound = soundRef.current;
    if (!sound) return;
    const next = sound.toggleMute();
    setMuted(next);
  };

  const handleSelectMode = (mode: GameMode) => {
    engineRef.current?.updateProfile((draft) => {
      draft.selectedMode = mode;
    });
  };

  const handleStart = () => {
    setModal('none');
    engineRef.current?.startNewRun();
  };

  const handlePause = () => {
    engineRef.current?.pauseGame();
  };

  const handleResume = () => {
    engineRef.current?.resumeGame();
  };

  const handleQuitToTitle = () => {
    engineRef.current?.returnToTitle();
  };

  const handleSelectPerk = (perkId: string) => {
    engineRef.current?.selectPerk(perkId);
  };

  const handleSelectShip = (shipId: ShipId) => {
    engineRef.current?.updateProfile((draft) => {
      if (draft.unlockedShips.includes(shipId)) {
        draft.selectedShip = shipId;
      }
    });
  };

  const handleUnlockShip = (shipId: ShipId, cost: number) => {
    engineRef.current?.updateProfile((draft) => {
      if (!draft.unlockedShips.includes(shipId) && draft.starShards >= cost) {
        draft.starShards -= cost;
        draft.unlockedShips.push(shipId);
        draft.selectedShip = shipId;
      }
    });
  };

  const handleBuyUpgrade = (upgradeId: HangarUpgradeId, cost: number) => {
    engineRef.current?.updateProfile((draft) => {
      if (draft.starShards >= cost) {
        draft.starShards -= cost;
        draft.hangarLevels[upgradeId] = (draft.hangarLevels[upgradeId] || 0) + 1;
      }
    });
  };

  const handleUpdateKeybinds = (nextKeybinds: KeybindConfig) => {
    engineRef.current?.updateProfile((draft) => {
      draft.keybinds = { ...nextKeybinds };
    });
  };

  const handleUpdateDashDirection = (mode: DashDirectionMode) => {
    engineRef.current?.updateProfile((draft) => {
      draft.dashDirectionMode = mode;
    });
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#07090E] select-none">
      {/* Primary Full-Viewport Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
      />

      {/* Achievement Unlocked Notification Banner */}
      {toastAchievement && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0D111A]/95 border border-amber-400 px-6 py-3 shadow-[0_0_30px_rgba(245,158,11,0.35)] pointer-events-none animate-bounce">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400 text-center">
            ★ MỞ KHÓA THÀNH TÍCH MỚI (+{toastAchievement.rewardShards} MẢNH SAO) ★
          </div>
          <div className="font-display text-sm font-bold uppercase tracking-wider text-slate-100 text-center mt-0.5">
            {toastAchievement.title}
          </div>
        </div>
      )}

      {/* Active HUD */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'PERK_SELECT') && (
        <GameHud
          hud={hud}
          keybinds={profile.keybinds}
          muted={muted}
          onPause={handlePause}
          onToggleMute={handleToggleMute}
          onToggleDashDirection={handleUpdateDashDirection}
          onOpenKeybinds={() => {
            if (gameState === 'PLAYING') {
              engineRef.current?.pauseGame();
            }
            setModal('keybinds');
          }}
        />
      )}

      {/* Title Overlay */}
      {gameState === 'TITLE_MENU' && modal === 'none' && (
        <TitleOverlay
          profile={profile}
          selectedMode={profile.selectedMode}
          onSelectMode={handleSelectMode}
          onStart={handleStart}
          onOpenHangar={() => setModal('hangar')}
          onOpenAchievements={() => setModal('achievements')}
          onOpenKeybinds={() => setModal('keybinds')}
          onOpenPcDownload={() => setModal('pcdownload')}
        />
      )}

      {/* Hangar Modal */}
      {modal === 'hangar' && (
        <HangarModal
          profile={profile}
          onSelectShip={handleSelectShip}
          onUnlockShip={handleUnlockShip}
          onBuyUpgrade={handleBuyUpgrade}
          onClose={() => setModal('none')}
        />
      )}

      {/* Achievements Modal */}
      {modal === 'achievements' && (
        <AchievementsModal
          profile={profile}
          onClose={() => setModal('none')}
        />
      )}

      {/* Keybindings & Dash Direction Customization Modal */}
      {modal === 'keybinds' && (
        <KeybindsModal
          keybinds={profile.keybinds}
          dashDirectionMode={profile.dashDirectionMode ?? 'mouse'}
          onUpdateKeybinds={handleUpdateKeybinds}
          onUpdateDashDirection={handleUpdateDashDirection}
          onClose={() => setModal('none')}
        />
      )}

      {/* PC .EXE Download Modal */}
      {modal === 'pcdownload' && (
        <PcDownloadModal
          onClose={() => setModal('none')}
        />
      )}

      {/* Roguelite Perk Selection Modal */}
      {gameState === 'PERK_SELECT' && (
        <PerkSelectModal
          waveCleared={hud.wave}
          choices={hud.perkChoices}
          onSelectPerk={handleSelectPerk}
        />
      )}

      {/* Pause & Game Over Modal */}
      {(gameState === 'PAUSED' || gameState === 'GAME_OVER') && modal === 'none' && (
        <ModalOverlay
          gameState={gameState}
          hud={hud}
          muted={muted}
          onResume={handleResume}
          onRestart={handleStart}
          onOpenHangar={() => {
            handleQuitToTitle();
            setModal('hangar');
          }}
          onReturnToTitle={handleQuitToTitle}
          onToggleMute={handleToggleMute}
        />
      )}
    </main>
  );
}

export default App;
