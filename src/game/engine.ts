import { SoundEngine } from './audio';
import {
  ACHIEVEMENTS,
  BOOST_DEFS,
  PERK_POOL,
  SECTOR_THEMES,
  SHIPS,
  WEAPONS,
  loadPlayerProfile,
  savePlayerProfile,
} from './catalog';
import {
  AchievementDefinition,
  ActiveBoostHud,
  BoostPickup,
  BoostType,
  BossHudInfo,
  DashGhost,
  Enemy,
  EnemyBullet,
  EnemyType,
  FloatingText,
  GameMode,
  GameState,
  HudSnapshot,
  Particle,
  PerkDefinition,
  PlayerBullet,
  PlayerProfile,
  SectorTheme,
  Shard,
  ShipId,
  Shockwave,
  Star,
  WeaponType,
} from './types';

const COLORS = {
  playerFill: '#F8FAFC',
  playerShield: '#10B981',
  bulletPlayer: '#FDE68A',
  bulletPlayerCore: '#FFFFFF',
  bulletEnemy: '#FB7185',
  drifter: '#F59E0B',
  chaser: '#FB923C',
  shooter: '#818CF8',
  tank: '#10B981',
  charger: '#F43F5E',
  prism: '#38BDF8',
  pulsar: '#E11D48',
  shardling: '#7DD3FC',
  bossAegis: '#F43F5E',
  bossHydra: '#F59E0B',
  eliteRing: '#FBBF24',
  shard: '#FBBF24',
  repair: '#34D399',
};

interface LightningArc {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  life: number;
  maxLife: number;
}

interface EngineCallbacks {
  onStateChange: (state: GameState) => void;
  onHudUpdate: (hud: HudSnapshot) => void;
  onProfileUpdate: (profile: PlayerProfile) => void;
  onAchievementUnlock: (achievement: AchievementDefinition) => void;
}

export class StarwardEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sound: SoundEngine;
  private callbacks: EngineCallbacks;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private elapsedTime = 0;
  private destroyed = false;

  private width = 1280;
  private height = 720;
  private dpr = 1;
  private readonly arenaPad = 24;

  private gameState: GameState = 'TITLE_MENU';
  private profile: PlayerProfile;

  private heldKeys = new Set<string>();
  private mouseDown = false;
  private mouseX = 640;
  private mouseY = 360;
  private hasPointerAim = false;
  private dashBufferTimer = 0;

  private currentSector: SectorTheme = SECTOR_THEMES[0];
  private warpTransitionTimer = 0;
  private readonly warpMaxDuration = 1.25;

  private activeBoostTimers: Record<BoostType, number> = {
    rapid_fire: 0,
    hyper_speed: 0,
    damage_surge: 0,
    hyper_magnet: 0,
  };

  private player = {
    x: 640,
    y: 360,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    radius: 14,
    fireCooldown: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashMaxCooldown: 1.25,
    dashDirX: 0,
    dashDirY: -1,
    dashTickTimer: 0,
    invulnTimer: 0,
    hitFlash: 0,
    squashX: 1,
    squashY: 1,
    shields: 3,
    maxShields: 3,
    weapon: 'pulse' as WeaponType,
    weaponLevel: 1,
    damageMult: 1,
    fireRateMult: 1,
    speedMult: 1,
    extraBarrels: 0,
    bonusPierce: 0,
    shockDash: false,
    magnetRadius: 170,
    overdriveCharge: 0,
    overdriveTimer: 0,
    overdriveGainMult: 1,
  };

  private mode: GameMode = 'arcade';
  private shipId: ShipId = 'vanguard';
  private score = 0;
  private isNewBest = false;
  private multiplier = 1;
  private comboTimer = 0;
  private readonly maxComboDuration = 4.6;
  private wave = 1;
  private waveSpawnQueue: { type: EnemyType; isElite: boolean }[] = [];
  private waveTotalEnemies = 0;
  private waveDefeated = 0;
  private spawnCooldown = 0;
  private waveClearDelay = 0;
  private waveBanner: string | null = null;
  private waveBannerTimer = 0;
  private totalEnemiesDefeated = 0;
  private bossesDefeated = 0;
  private elitesDefeated = 0;
  private runShards = 0;
  private activePerks: string[] = [];
  private currentPerkChoices: PerkDefinition[] = [];
  private nextEnemyId = 1;

  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private hudSyncTimer = 0;
  private lastHudSignature = '';
  private reducedMotion = false;

  private stars: Star[] = [];
  private enemies: Enemy[] = [];
  private dashGhosts: DashGhost[] = [];
  private lightningArcs: LightningArc[] = [];
  private playerBullets: PlayerBullet[] = [];
  private enemyBullets: EnemyBullet[] = [];
  private shards: Shard[] = [];
  private boostPickups: BoostPickup[] = [];
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private floatingTexts: FloatingText[] = [];

  private attractAngle = 0;

  constructor(canvas: HTMLCanvasElement, sound: SoundEngine, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.sound = sound;
    this.callbacks = callbacks;

    this.profile = loadPlayerProfile();
    this.mode = this.profile.selectedMode;
    this.shipId = this.profile.selectedShip;

    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    this.initPools();
    this.resize();
    this.initStars();
    this.bindEvents();
    this.callbacks.onProfileUpdate(this.profile);
    this.pushHud(true);

    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  public getProfile(): PlayerProfile {
    return this.profile;
  }

  public updateProfile(mutator: (draft: PlayerProfile) => void): void {
    const next: PlayerProfile = JSON.parse(JSON.stringify(this.profile));
    mutator(next);
    this.profile = next;
    this.mode = next.selectedMode;
    this.shipId = next.selectedShip;
    savePlayerProfile(this.profile);
    this.callbacks.onProfileUpdate(this.profile);

    if (this.profile.unlockedShips.length >= 3) {
      this.tryUnlockAchievement('ship_collector');
    }

    this.pushHud(true);
  }

  public triggerDash(): void {
    this.sound.unlock();
    if (this.gameState !== 'PLAYING') return;
    this.dashBufferTimer = 0.16;
  }

  private tryUnlockAchievement(id: string): void {
    if (this.profile.achievements[id]) return;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;

    this.profile.achievements[id] = Date.now();
    this.profile.starShards += def.rewardShards;
    savePlayerProfile(this.profile);
    this.sound.playAchievement();
    this.callbacks.onProfileUpdate({ ...this.profile });
    this.callbacks.onAchievementUnlock(def);
  }

  private initPools(): void {
    for (let i = 0; i < 200; i++) {
      this.playerBullets.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        radius: 4.5,
        angle: 0,
        damage: 1,
        pierce: 0,
        homing: false,
        color: COLORS.bulletPlayerCore,
        hitEnemyIds: new Set<number>(),
      });
    }
    for (let i = 0; i < 220; i++) {
      this.enemyBullets.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        radius: 5,
        color: COLORS.bulletEnemy,
      });
    }
    for (let i = 0; i < 100; i++) {
      this.shards.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 10,
        value: 25,
        shardCurrency: 1,
        isRepair: false,
      });
    }
    for (let i = 0; i < 24; i++) {
      this.boostPickups.push({
        active: false,
        type: 'rapid_fire',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 11,
      });
    }
    for (let i = 0; i < 420; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0.4,
        size: 3,
        color: '#FBBF24',
        drag: 0.94,
      });
    }
    for (let i = 0; i < 48; i++) {
      this.shockwaves.push({
        active: false,
        x: 0,
        y: 0,
        radius: 0,
        maxRadius: 80,
        life: 0,
        maxLife: 0.3,
        color: '#F59E0B',
        lineWidth: 2,
      });
    }
    for (let i = 0; i < 56; i++) {
      this.floatingTexts.push({
        active: false,
        x: 0,
        y: 0,
        vy: -38,
        text: '',
        color: '#F8FAFC',
        life: 0,
        maxLife: 0.75,
      });
    }
  }

  private initStars(): void {
    this.stars = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      const depth = 0.25 + Math.random() * 0.75;
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        depth,
        size: 0.8 + depth * 1.7,
        alpha: 0.16 + depth * 0.48,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  public destroy(): void {
    this.destroyed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }

  private handleResize = (): void => {
    this.resize();
  };

  public resize(): void {
    const parent = this.canvas.parentElement;
    const nextWidth = parent ? parent.clientWidth : window.innerWidth;
    const nextHeight = parent ? parent.clientHeight : window.innerHeight;
    if (nextWidth <= 0 || nextHeight <= 0) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = nextWidth;
    this.height = nextHeight;

    this.canvas.width = Math.floor(nextWidth * this.dpr);
    this.canvas.height = Math.floor(nextHeight * this.dpr);
    this.canvas.style.width = `${nextWidth}px`;
    this.canvas.style.height = `${nextHeight}px`;

    const minX = this.arenaPad + this.player.radius;
    const maxX = Math.max(minX, this.width - this.arenaPad - this.player.radius);
    const minY = this.arenaPad + this.player.radius;
    const maxY = Math.max(minY, this.height - this.arenaPad - this.player.radius);
    this.player.x = Math.min(Math.max(this.player.x, minX), maxX);
    this.player.y = Math.min(Math.max(this.player.y, minY), maxY);

    if (this.stars.length === 0) {
      this.initStars();
    } else {
      for (const s of this.stars) {
        s.x = ((s.x % this.width) + this.width) % this.width;
        s.y = ((s.y % this.height) + this.height) % this.height;
      }
    }
  }

  private handleBlur = (): void => {
    this.heldKeys.clear();
    this.mouseDown = false;
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.heldKeys.clear();
      this.mouseDown = false;
      if (this.gameState === 'PLAYING') {
        this.pauseGame();
      }
    }
  };

  private handleContextMenu = (e: MouseEvent): void => {
    if (this.gameState === 'PLAYING') {
      e.preventDefault();
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
    this.hasPointerAim = true;
  };

  private handleMouseDown = (e: MouseEvent): void => {
    this.sound.unlock();
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
    this.hasPointerAim = true;

    if (this.gameState === 'PLAYING') {
      if (e.button === 0) {
        this.mouseDown = true;
      } else if (e.button === 2) {
        this.dashBufferTimer = 0.15;
      }
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.mouseDown = false;
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const kb = this.profile.keybinds;

    if (e.repeat) {
      if (
        ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', kb.fire, kb.dash].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }
      return;
    }

    this.sound.unlock();

    if (e.code === 'KeyM') {
      this.sound.toggleMute();
      this.pushHud(true);
      return;
    }

    if (this.gameState === 'PERK_SELECT') {
      if (e.code === 'Digit1' && this.currentPerkChoices[0]) {
        this.selectPerk(this.currentPerkChoices[0].id);
      } else if (e.code === 'Digit2' && this.currentPerkChoices[1]) {
        this.selectPerk(this.currentPerkChoices[1].id);
      } else if (e.code === 'Digit3' && this.currentPerkChoices[2]) {
        this.selectPerk(this.currentPerkChoices[2].id);
      }
      return;
    }

    if (e.code === kb.pause || e.code === 'Escape' || e.code === 'KeyP') {
      if (this.gameState === 'PLAYING') {
        this.pauseGame();
      } else if (this.gameState === 'PAUSED') {
        this.resumeGame();
      }
      return;
    }

    if (this.gameState === 'PLAYING') {
      if (e.code === kb.overdrive) {
        e.preventDefault();
        this.triggerOverdrive();
        return;
      }
      if (e.code === kb.dash) {
        e.preventDefault();
        this.dashBufferTimer = 0.16;
      }
    }

    if (
      ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', kb.fire].includes(e.code) &&
      this.gameState === 'PLAYING'
    ) {
      e.preventDefault();
    }

    this.heldKeys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
  };

  public startNewRun(): void {
    this.sound.unlock();
    this.heldKeys.clear();
    this.mouseDown = false;
    this.dashBufferTimer = 0;

    this.mode = this.profile.selectedMode;
    this.shipId = this.profile.selectedShip;
    const ship = SHIPS[this.shipId] ?? SHIPS.vanguard;
    const h = this.profile.hangarLevels;

    const maxShields =
      this.mode === 'hardcore' ? 1 : ship.baseShields + (h.hull ?? 0);

    this.player.x = this.width / 2;
    this.player.y = this.height / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.angle = -Math.PI / 2;
    this.player.fireCooldown = 0;
    this.player.dashTimer = 0;
    this.player.dashCooldown = 0;
    this.player.dashMaxCooldown = Math.max(0.55, 1.25 * (1 - (h.thruster ?? 0) * 0.06));
    this.player.dashTickTimer = 0;
    this.player.invulnTimer = 1.0;
    this.player.hitFlash = 0;
    this.player.squashX = 1;
    this.player.squashY = 1;
    this.player.shields = maxShields;
    this.player.maxShields = maxShields;
    this.player.weapon = ship.defaultWeapon;
    this.player.weaponLevel = 1;
    this.player.damageMult = ship.damageMult * (1 + (h.firepower ?? 0) * 0.1);
    this.player.fireRateMult = ship.fireRateMult * (1 + (h.firepower ?? 0) * 0.05);
    this.player.speedMult = ship.speedMult * (1 + (h.thruster ?? 0) * 0.06);
    this.player.extraBarrels = 0;
    this.player.bonusPierce = 0;
    this.player.shockDash = false;
    this.player.magnetRadius = 175 * (1 + (h.magnet ?? 0) * 0.2);
    this.player.overdriveCharge = (h.overdrive ?? 0) * 10;
    this.player.overdriveTimer = 0;
    this.player.overdriveGainMult = 1 + (h.overdrive ?? 0) * 0.12;

    this.activeBoostTimers = {
      rapid_fire: 0,
      hyper_speed: 0,
      damage_surge: 0,
      hyper_magnet: 0,
    };

    this.score = 0;
    this.isNewBest = false;
    this.multiplier = 1;
    this.comboTimer = 0;
    this.wave = 1;
    this.totalEnemiesDefeated = 0;
    this.bossesDefeated = 0;
    this.elitesDefeated = 0;
    this.runShards = 0;
    this.activePerks = [];
    this.currentPerkChoices = [];
    this.hitstopTimer = 0;
    this.shakeIntensity = 0;

    this.enemies = [];
    this.dashGhosts = [];
    this.lightningArcs = [];
    for (const b of this.playerBullets) b.active = false;
    for (const b of this.enemyBullets) b.active = false;
    for (const s of this.shards) s.active = false;
    for (const bp of this.boostPickups) bp.active = false;
    for (const p of this.particles) p.active = false;
    for (const sw of this.shockwaves) sw.active = false;
    for (const ft of this.floatingTexts) ft.active = false;

    this.profile.stats.totalRuns += 1;
    savePlayerProfile(this.profile);
    this.callbacks.onProfileUpdate({ ...this.profile });

    this.beginWave(1);
    this.setState('PLAYING');
    this.spawnShockwave(this.player.x, this.player.y, 110, ship.accentColor, 2.5);
    this.pushHud(true);
  }

  public pauseGame(): void {
    if (this.gameState !== 'PLAYING') return;
    this.heldKeys.clear();
    this.mouseDown = false;
    this.setState('PAUSED');
  }

  public resumeGame(): void {
    if (this.gameState !== 'PAUSED') return;
    this.lastTimestamp = performance.now();
    this.setState('PLAYING');
  }

  public returnToTitle(): void {
    this.heldKeys.clear();
    this.mouseDown = false;
    this.enemies = [];
    this.lightningArcs = [];
    for (const b of this.playerBullets) b.active = false;
    for (const b of this.enemyBullets) b.active = false;
    for (const s of this.shards) s.active = false;
    for (const bp of this.boostPickups) bp.active = false;
    this.setState('TITLE_MENU');
    this.pushHud(true);
  }

  private setState(next: GameState): void {
    this.gameState = next;
    this.callbacks.onStateChange(next);
  }

  public triggerOverdrive(): void {
    this.sound.unlock();
    if (this.gameState !== 'PLAYING') return;
    if (this.player.overdriveCharge < 100 || this.player.overdriveTimer > 0) return;

    const hLevel = this.profile.hangarLevels.overdrive ?? 0;
    const ship = SHIPS[this.shipId] ?? SHIPS.vanguard;
    this.player.overdriveCharge = 0;
    this.player.overdriveTimer = 3.8 + hLevel * 0.25;
    this.player.invulnTimer = Math.max(this.player.invulnTimer, this.player.overdriveTimer);

    this.sound.playOverdrive();
    this.addShake(11);
    this.spawnShockwave(this.player.x, this.player.y, 280, ship.accentColor, 4.2);
    this.spawnShockwave(this.player.x, this.player.y, 190, '#FDE68A', 2.8);
    this.spawnFloatingText(this.player.x, this.player.y - 34, 'OVERDRIVE BÙNG NỔ!', '#FDE68A');

    for (const eb of this.enemyBullets) {
      if (eb.active) {
        this.spawnBurst(eb.x, eb.y, 3, '#FDE68A', 80);
        eb.active = false;
      }
    }
    for (const e of this.enemies) {
      if (e.spawnTimer > 0) continue;
      const dx = e.x - this.player.x;
      const dy = e.y - this.player.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      if (dist < 300) {
        const force = e.isBoss ? 150 : 440;
        e.vx += (dx / dist) * force;
        e.vy += (dy / dist) * force;
        e.hitFlash = 0.14;
      }
    }

    this.tryUnlockAchievement('overdrive_unleashed');
    this.pushHud(true);
  }

  private openPerkSelection(): void {
    this.heldKeys.clear();
    this.mouseDown = false;

    const shuffled = [...PERK_POOL];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }

    this.currentPerkChoices = shuffled.slice(0, 3);
    this.setState('PERK_SELECT');
    this.pushHud(true);
  }

  public selectPerk(perkId: string): void {
    if (this.gameState !== 'PERK_SELECT') return;
    const perk = PERK_POOL.find((p) => p.id === perkId);
    if (!perk) return;

    this.activePerks.push(perk.name);
    this.sound.playPerkSelect();

    const p = this.player;
    switch (perk.id) {
      case 'rapid_barrel':
        p.fireRateMult *= 1.22;
        break;
      case 'heavy_caliber':
        p.damageMult *= 1.3;
        break;
      case 'multishot_core':
        p.extraBarrels += 1;
        break;
      case 'pierce_rounds':
        p.bonusPierce += 1;
        break;
      case 'shield_restore':
        if (this.mode !== 'hardcore') {
          p.shields = Math.min(p.maxShields, p.shields + 2);
        }
        this.spawnShockwave(p.x, p.y, 140, COLORS.playerShield, 3);
        break;
      case 'max_shield_up':
        if (this.mode !== 'hardcore') {
          p.maxShields += 1;
          p.shields = Math.min(p.maxShields, p.shields + 1);
        } else {
          p.damageMult *= 1.2;
        }
        break;
      case 'phase_turbine':
        p.dashMaxCooldown = Math.max(0.42, p.dashMaxCooldown * 0.75);
        p.speedMult *= 1.15;
        break;
      case 'shock_dash':
        p.shockDash = true;
        break;
      case 'overdrive_surge':
        p.overdriveCharge = Math.min(100, p.overdriveCharge + 50);
        p.overdriveGainMult *= 1.25;
        break;
      case 'weapon_spread':
      case 'weapon_rail':
      case 'weapon_missile':
        if (perk.weaponUnlock) {
          if (p.weapon === perk.weaponUnlock) {
            p.weaponLevel += 1;
            p.damageMult *= 1.22;
            p.extraBarrels += 1;
          } else {
            p.weapon = perk.weaponUnlock;
            p.weaponLevel += 1;
          }
        }
        break;
    }

    this.currentPerkChoices = [];
    this.lastTimestamp = performance.now();
    this.beginWave(this.wave + 1);
    this.setState('PLAYING');
    this.pushHud(true);
  }

  private pickNextSectorTheme(waveNum: number): void {
    if (waveNum === 1) {
      this.currentSector = SECTOR_THEMES[0];
    } else {
      const candidates = SECTOR_THEMES.filter((s) => s.id !== this.currentSector.id);
      const next = candidates[Math.floor(Math.random() * candidates.length)] ?? SECTOR_THEMES[0];
      this.currentSector = next;
    }
    this.warpTransitionTimer = this.warpMaxDuration;
    this.spawnShockwave(
      this.width * 0.5,
      this.height * 0.5,
      Math.max(this.width, this.height) * 0.55,
      this.currentSector.accentHex,
      3.2
    );
  }

  private beginWave(waveNum: number): void {
    this.wave = waveNum;
    this.waveDefeated = 0;
    this.waveClearDelay = 0;
    this.spawnCooldown = 0.45;

    this.pickNextSectorTheme(waveNum);

    if (waveNum > this.profile.stats.highestWave) {
      this.profile.stats.highestWave = waveNum;
      savePlayerProfile(this.profile);
    }
    if (waveNum > 6) {
      this.tryUnlockAchievement('wave_6');
    }

    const isBossWave = this.mode === 'boss_rush' || waveNum % 3 === 0;

    if (isBossWave) {
      const bossIndex = this.mode === 'boss_rush' ? waveNum : Math.floor(waveNum / 3);
      const bossType: EnemyType = bossIndex % 2 === 1 ? 'boss_aegis' : 'boss_hydra';
      const bossTitle = bossType === 'boss_aegis' ? 'PHÁO ĐÀI AEGIS' : 'XÀ VƯƠNG MẶT TRỜI';
      this.waveBanner = `CẢNH BÁO BOSS · ${bossTitle}`;
      this.waveBannerTimer = 2.5;
      this.sound.playBossWarning();

      const queue: { type: EnemyType; isElite: boolean }[] = [{ type: bossType, isElite: false }];
      const escortCount = Math.min(2 + Math.floor(waveNum * 0.6), 7);
      const escortPool: EnemyType[] = ['chaser', 'shooter', 'drifter', 'charger'];
      for (let i = 0; i < escortCount; i++) {
        const t = escortPool[i % escortPool.length];
        queue.push({ type: t, isElite: i === 0 && waveNum >= 3 });
      }
      this.waveSpawnQueue = queue;
      this.waveTotalEnemies = queue.length;
      return;
    }

    this.waveBanner = `ĐỢT ${String(waveNum).padStart(2, '0')} · ${this.currentSector.name}`;
    this.waveBannerTimer = 2.1;

    const queue: { type: EnemyType; isElite: boolean }[] = [];
    const drifterCount = 3 + Math.min(waveNum * 2, 10);
    const chaserCount = 2 + Math.min(Math.floor(waveNum * 1.4), 9);
    const shooterCount = waveNum >= 1 ? Math.min(1 + Math.floor(waveNum * 0.9), 6) : 0;
    const tankCount = waveNum >= 2 ? Math.min(Math.floor(waveNum * 0.75), 5) : 1;
    const chargerCount = waveNum >= 2 ? Math.min(Math.floor(waveNum * 0.7), 5) : 0;
    const prismCount = waveNum >= 2 ? Math.min(Math.floor((waveNum - 1) * 0.8), 4) : 0;
    const pulsarCount = waveNum >= 4 ? Math.min(Math.floor((waveNum - 2) * 0.7), 4) : 0;

    const addEntries = (type: EnemyType, count: number) => {
      for (let i = 0; i < count; i++) {
        const eliteChance = waveNum >= 2 ? Math.min(0.08 + waveNum * 0.025, 0.28) : 0;
        queue.push({ type, isElite: Math.random() < eliteChance });
      }
    };

    addEntries('drifter', drifterCount);
    addEntries('chaser', chaserCount);
    addEntries('shooter', shooterCount);
    addEntries('tank', tankCount);
    addEntries('charger', chargerCount);
    addEntries('prism', prismCount);
    addEntries('pulsar', pulsarCount);

    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = queue[i];
      queue[i] = queue[j];
      queue[j] = tmp;
    }

    this.waveSpawnQueue = queue;
    this.waveTotalEnemies = queue.length;
  }

  private loop = (timestamp: number): void => {
    if (this.destroyed) return;

    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    const dt = Math.min(Math.max(rawDt, 0), 0.05);

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.elapsedTime += dt;

    if (this.warpTransitionTimer > 0) {
      this.warpTransitionTimer = Math.max(0, this.warpTransitionTimer - dt);
    }

    if (this.gameState === 'TITLE_MENU') {
      this.updateStars(dt, 32, -14);
      this.updateTitleAttract(dt);
      this.updateParticles(dt);
      this.updateShockwaves(dt);
      return;
    }

    if (this.gameState === 'PAUSED' || this.gameState === 'PERK_SELECT') {
      return;
    }

    if (this.gameState === 'GAME_OVER') {
      this.updateStars(dt, 14, -8);
      this.updateParticles(dt);
      this.updateShockwaves(dt);
      this.updateFloatingTexts(dt);
      if (this.shakeIntensity > 0) {
        this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 28);
      }
      return;
    }

    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 36);
    }

    if (this.waveBannerTimer > 0) {
      this.waveBannerTimer -= dt;
      if (this.waveBannerTimer <= 0) {
        this.waveBanner = null;
      }
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateParticles(dt * 0.25);
      this.updateShockwaves(dt * 0.35);
      return;
    }

    // Update active boost timers
    (Object.keys(this.activeBoostTimers) as BoostType[]).forEach((bType) => {
      if (this.activeBoostTimers[bType] > 0) {
        this.activeBoostTimers[bType] = Math.max(0, this.activeBoostTimers[bType] - dt);
      }
    });

    // Update lightning arcs
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      this.lightningArcs[i].life -= dt;
      if (this.lightningArcs[i].life <= 0) {
        this.lightningArcs.splice(i, 1);
      }
    }

    const warpMult = this.warpTransitionTimer > 0 ? 1 + (this.warpTransitionTimer / this.warpMaxDuration) * 6 : 1;
    this.updateStars(
      dt,
      (-this.player.vx * 0.06 + 14) * warpMult,
      (-this.player.vy * 0.06 - 6) * warpMult
    );
    this.updatePlayer(dt);
    this.updateWaveSpawning(dt);
    this.updatePlayerBullets(dt);
    this.updateEnemies(dt);
    this.updateEnemyBullets(dt);
    this.updateShards(dt);
    this.updateBoostPickups(dt);
    this.updateParticles(dt);
    this.updateShockwaves(dt);
    this.updateFloatingTexts(dt);

    if (this.multiplier > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.multiplier = Math.max(1, this.multiplier - 1);
        this.comboTimer = this.multiplier > 1 ? this.maxComboDuration * 0.65 : 0;
      }
    }

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.05) {
      this.hudSyncTimer = 0;
      this.pushHud(false);
    }
  }

  private updateTitleAttract(dt: number): void {
    this.attractAngle += dt * 0.48;
    const cx = this.width >= 900 ? this.width * 0.68 : this.width * 0.5;
    const cy = this.width >= 900 ? this.height * 0.5 : this.height * 0.35;
    const rx = Math.min(this.width * 0.16, 185);
    const ry = Math.min(this.height * 0.2, 135);
    const px = cx + Math.cos(this.attractAngle) * rx;
    const py = cy + Math.sin(this.attractAngle * 1.4) * ry;
    const dx = -Math.sin(this.attractAngle) * rx;
    const dy = Math.cos(this.attractAngle * 1.4) * ry * 1.4;
    this.player.x = px;
    this.player.y = py;
    this.player.angle = Math.atan2(dy, dx);

    const ship = SHIPS[this.profile.selectedShip] ?? SHIPS.vanguard;
    if (Math.random() < dt * 28) {
      const backX = px - Math.cos(this.player.angle) * 14;
      const backY = py - Math.sin(this.player.angle) * 14;
      this.spawnParticle(
        backX,
        backY,
        -Math.cos(this.player.angle) * 48 + (Math.random() - 0.5) * 20,
        -Math.sin(this.player.angle) * 48 + (Math.random() - 0.5) * 20,
        0.38,
        2.5,
        ship.trailColor,
        0.92
      );
    }
  }

  private updateStars(dt: number, driftX: number, driftY: number): void {
    for (const star of this.stars) {
      star.x += driftX * star.depth * dt;
      star.y += driftY * star.depth * dt;
      if (star.x < 0) star.x += this.width;
      if (star.x >= this.width) star.x -= this.width;
      if (star.y < 0) star.y += this.height;
      if (star.y >= this.height) star.y -= this.height;
    }
  }

  private executeShipDashEffect(): void {
    const p = this.player;
    const ship = SHIPS[this.shipId] ?? SHIPS.vanguard;
    const powerScale = p.shockDash ? 1.75 : 1.0;
    const dmg = p.damageMult * powerScale;

    this.spawnShockwave(p.x, p.y, 75 * powerScale, ship.dashColor, 2.8);
    this.spawnShockwave(p.x, p.y, 45 * powerScale, ship.dashSecondaryColor, 1.8);
    this.spawnBurst(p.x, p.y, 14, ship.dashColor, 210);
    this.spawnBurst(p.x, p.y, 8, ship.dashSecondaryColor, 160);

    switch (ship.dashStyle) {
      case 'solar_flare': {
        const count = p.shockDash ? 8 : 4;
        for (let i = 0; i < count; i++) {
          const a = p.angle + (i * Math.PI * 2) / count;
          this.spawnPlayerProjectile(
            p.x,
            p.y,
            a,
            680,
            1.1 * dmg,
            1,
            false,
            ship.dashColor,
            5
          );
        }
        break;
      }

      case 'void_lightning': {
        const count = p.shockDash ? 10 : 6;
        for (let i = 0; i < count; i++) {
          const spread = ((i / (count - 1)) - 0.5) * 0.9;
          this.spawnPlayerProjectile(
            p.x,
            p.y,
            p.angle + spread,
            960,
            0.95 * dmg,
            3,
            false,
            ship.dashColor,
            4.2
          );
        }
        break;
      }

      case 'crimson_lance': {
        const blades = p.shockDash ? 5 : 3;
        for (let i = 0; i < blades; i++) {
          const spread = ((i / (blades - 1)) - 0.5) * 0.36;
          this.spawnPlayerProjectile(
            p.x + Math.cos(p.angle) * 14,
            p.y + Math.sin(p.angle) * 14,
            p.angle + spread,
            880,
            1.75 * dmg,
            4,
            false,
            ship.dashColor,
            6.5
          );
        }
        this.spawnFloatingText(p.x, p.y - 26, 'HUYẾT KIẾM!', ship.dashColor);
        break;
      }

      case 'bastion_wave': {
        const blastR = 195 * powerScale;
        this.spawnShockwave(p.x, p.y, blastR, ship.dashColor, 4.2);
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (e.spawnTimer > 0) continue;
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          if (d <= blastR + e.radius) {
            const push = e.isBoss ? 140 : 520;
            this.damageEnemy(i, 2.2 * dmg, (dx / d) * push, (dy / d) * push);
          }
        }
        break;
      }

      case 'ion_tempest': {
        const range = 260 * powerScale;
        for (const eb of this.enemyBullets) {
          if (eb.active && Math.hypot(eb.x - p.x, eb.y - p.y) < 135) {
            this.spawnBurst(eb.x, eb.y, 3, ship.dashColor, 90);
            eb.active = false;
          }
        }
        let struck = 0;
        const maxTargets = p.shockDash ? 8 : 5;
        for (let i = this.enemies.length - 1; i >= 0 && struck < maxTargets; i--) {
          const e = this.enemies[i];
          if (e.spawnTimer > 0) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d <= range) {
            struck++;
            this.lightningArcs.push({
              x1: p.x,
              y1: p.y,
              x2: e.x,
              y2: e.y,
              color: ship.dashColor,
              life: 0.25,
              maxLife: 0.25,
            });
            this.damageEnemy(i, 1.85 * dmg, 0, 0);
          }
        }
        break;
      }

      case 'shadow_rift': {
        let absorbed = 0;
        const absorbR = 175 * powerScale;
        for (const eb of this.enemyBullets) {
          if (eb.active && Math.hypot(eb.x - p.x, eb.y - p.y) <= absorbR) {
            eb.active = false;
            absorbed++;
            this.spawnBurst(eb.x, eb.y, 4, ship.dashColor, 100);
          }
        }
        if (absorbed > 0) {
          p.overdriveCharge = Math.min(100, p.overdriveCharge + absorbed * 4.5);
          this.spawnFloatingText(
            p.x,
            p.y - 26,
            `HẤP THỤ +${Math.round(absorbed * 4.5)}% OVERDRIVE`,
            ship.dashSecondaryColor
          );
        }
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (e.spawnTimer > 0) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d <= absorbR) {
            this.damageEnemy(i, 1.65 * dmg, 0, 0);
          }
        }
        break;
      }

      case 'supernova_burst': {
        const missiles = p.shockDash ? 10 : 6;
        for (let i = 0; i < missiles; i++) {
          const a = (i * Math.PI * 2) / missiles;
          this.spawnPlayerProjectile(
            p.x,
            p.y,
            a,
            560,
            1.2 * dmg,
            1,
            true,
            ship.dashColor,
            4.8
          );
        }
        break;
      }

      case 'golden_phoenix': {
        const count = p.shockDash ? 14 : 10;
        for (let i = 0; i < count; i++) {
          const a = (i * Math.PI * 2) / count;
          this.spawnPlayerProjectile(
            p.x,
            p.y,
            a,
            640,
            1.3 * dmg,
            2,
            false,
            ship.dashColor,
            5.2
          );
        }
        break;
      }

      case 'prism_mirror': {
        const beams = p.shockDash ? 12 : 8;
        for (let i = 0; i < beams; i++) {
          const a = p.angle + (i * Math.PI * 2) / beams;
          this.spawnPlayerProjectile(
            p.x,
            p.y,
            a,
            1080,
            1.5 * dmg,
            5,
            false,
            ship.dashColor,
            5.0
          );
        }
        break;
      }

      case 'chrono_warp': {
        const chronoR = 260 * powerScale;
        this.spawnShockwave(p.x, p.y, chronoR, ship.dashColor, 3.6);
        for (const eb of this.enemyBullets) {
          if (eb.active && Math.hypot(eb.x - p.x, eb.y - p.y) <= chronoR) {
            eb.vx *= 0.25;
            eb.vy *= 0.25;
          }
        }
        for (const e of this.enemies) {
          if (e.spawnTimer <= 0 && Math.hypot(e.x - p.x, e.y - p.y) <= chronoR) {
            e.vx *= 0.2;
            e.vy *= 0.2;
          }
        }
        const bolts = p.shockDash ? 10 : 8;
        for (let i = 0; i < bolts; i++) {
          const a = (i * Math.PI * 2) / bolts;
          this.spawnPlayerProjectile(
            p.x,
            p.y,
            a,
            720,
            1.35 * dmg,
            2,
            true,
            ship.dashColor,
            4.8
          );
        }
        if (p.overdriveTimer <= 0) {
          p.overdriveCharge = Math.min(100, p.overdriveCharge + 12);
        }
        this.spawnFloatingText(p.x, p.y - 28, 'NGƯNG ĐỌNG THỜI KHÔNG!', ship.dashSecondaryColor);
        break;
      }
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    const kb = this.profile.keybinds;
    const ship = SHIPS[this.shipId] ?? SHIPS.vanguard;

    const hasHyperSpeed = this.activeBoostTimers.hyper_speed > 0;
    const dashRechargeMult = hasHyperSpeed ? 2.0 : 1.0;

    p.squashX += (1 - p.squashX) * Math.min(1, dt * 16);
    p.squashY += (1 - p.squashY) * Math.min(1, dt * 16);

    if (p.overdriveTimer > 0) {
      p.overdriveTimer = Math.max(0, p.overdriveTimer - dt);
      if (Math.random() < dt * 35) {
        const a = Math.random() * Math.PI * 2;
        this.spawnParticle(
          p.x + Math.cos(a) * 16,
          p.y + Math.sin(a) * 16,
          Math.cos(a) * 85,
          Math.sin(a) * 85,
          0.26,
          2.8,
          '#FDE68A',
          0.9
        );
      }
    }
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.hitFlash > 0) p.hitFlash = Math.max(0, p.hitFlash - dt);
    if (p.fireCooldown > 0) p.fireCooldown = Math.max(0, p.fireCooldown - dt);
    if (p.dashCooldown > 0) {
      p.dashCooldown = Math.max(0, p.dashCooldown - dt * dashRechargeMult);
    }
    if (this.dashBufferTimer > 0) this.dashBufferTimer = Math.max(0, this.dashBufferTimer - dt);

    for (let i = this.dashGhosts.length - 1; i >= 0; i--) {
      this.dashGhosts[i].alpha -= dt * 3.8;
      this.dashGhosts[i].scale += dt * 0.35;
      if (this.dashGhosts[i].alpha <= 0) {
        this.dashGhosts.splice(i, 1);
      }
    }

    let ix = 0;
    let iy = 0;
    if (this.heldKeys.has(kb.left) || this.heldKeys.has('ArrowLeft')) ix -= 1;
    if (this.heldKeys.has(kb.right) || this.heldKeys.has('ArrowRight')) ix += 1;
    if (this.heldKeys.has(kb.up) || this.heldKeys.has('ArrowUp')) iy -= 1;
    if (this.heldKeys.has(kb.down) || this.heldKeys.has('ArrowDown')) iy += 1;

    const inputLen = Math.hypot(ix, iy);
    if (inputLen > 0) {
      ix /= inputLen;
      iy /= inputLen;
    }

    if (this.hasPointerAim) {
      p.angle = Math.atan2(this.mouseY - p.y, this.mouseX - p.x);
    } else if (inputLen > 0.1) {
      p.angle = Math.atan2(iy, ix);
    }

    if (this.dashBufferTimer > 0 && p.dashCooldown <= 0 && p.dashTimer <= 0) {
      this.dashBufferTimer = 0;
      p.dashTimer = 0.18;
      p.dashTickTimer = 0;
      p.dashCooldown = p.dashMaxCooldown;
      p.invulnTimer = Math.max(p.invulnTimer, 0.28);

      if (inputLen > 0.1) {
        p.dashDirX = ix;
        p.dashDirY = iy;
      } else {
        p.dashDirX = Math.cos(p.angle);
        p.dashDirY = Math.sin(p.angle);
      }

      const speedBoost = hasHyperSpeed ? 1.35 : 1.0;
      p.vx = p.dashDirX * 920 * p.speedMult * speedBoost;
      p.vy = p.dashDirY * 920 * p.speedMult * speedBoost;
      p.squashX = 1.48;
      p.squashY = 0.64;
      this.addShake(4.5);
      this.sound.playDash();

      this.executeShipDashEffect();
    }

    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.dashTickTimer -= dt;

      this.dashGhosts.push({
        x: p.x,
        y: p.y,
        angle: p.angle,
        alpha: 0.72,
        shipId: this.shipId,
        color: ship.dashColor,
        secondaryColor: ship.dashSecondaryColor,
        scale: 1.0,
      });

      // Spawn continuous ship-specific dash trail particles
      for (let k = 0; k < 2; k++) {
        const spreadA = p.angle + Math.PI + (Math.random() - 0.5) * 0.9;
        const spd = 80 + Math.random() * 140;
        this.spawnParticle(
          p.x + (Math.random() - 0.5) * 10,
          p.y + (Math.random() - 0.5) * 10,
          Math.cos(spreadA) * spd,
          Math.sin(spreadA) * spd,
          0.32,
          3.4,
          k === 0 ? ship.dashColor : ship.dashSecondaryColor,
          0.9
        );
      }

      // Solaris leaves fire orbs along its dash trajectory
      if (ship.dashStyle === 'golden_phoenix' && p.dashTickTimer <= 0) {
        p.dashTickTimer = 0.045;
        this.spawnPlayerProjectile(
          p.x,
          p.y,
          p.angle + Math.PI + (Math.random() - 0.5) * 0.4,
          120,
          1.4 * p.damageMult,
          2,
          false,
          ship.dashColor,
          6.5
        );
      }

      for (const e of this.enemies) {
        if (e.spawnTimer > 0) continue;
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist < e.radius + p.radius + 16) {
          const nx = (e.x - p.x) / Math.max(dist, 1);
          const ny = (e.y - p.y) / Math.max(dist, 1);
          const push = e.isBoss ? 90 : 400;
          e.vx += nx * push;
          e.vy += ny * push;
          e.hitFlash = 0.09;
        }
      }
    } else {
      const overdriveBoost = p.overdriveTimer > 0 ? 1.22 : 1.0;
      const speedPickupBoost = hasHyperSpeed ? 1.55 : 1.0;
      const totalSpeedMult = p.speedMult * overdriveBoost * speedPickupBoost;

      const accel = 1950 * totalSpeedMult;
      const maxSpeed = 350 * totalSpeedMult;
      const friction = 7.2;

      p.vx += ix * accel * dt;
      p.vy += iy * accel * dt;

      const damp = Math.exp(-friction * dt);
      p.vx *= damp;
      p.vy *= damp;

      const speed = Math.hypot(p.vx, p.vy);
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      if (inputLen > 0.1 && Math.random() < dt * 40) {
        const tailX = p.x - Math.cos(p.angle) * 14;
        const tailY = p.y - Math.sin(p.angle) * 14;
        const pColor =
          p.overdriveTimer > 0
            ? '#FDE68A'
            : hasHyperSpeed
            ? '#38BDF8'
            : ship.trailColor;
        this.spawnParticle(
          tailX + (Math.random() - 0.5) * 5,
          tailY + (Math.random() - 0.5) * 5,
          -p.vx * 0.25 + (Math.random() - 0.5) * 32,
          -p.vy * 0.25 + (Math.random() - 0.5) * 32,
          0.26,
          2.6,
          pColor,
          0.9
        );
      }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const minX = this.arenaPad + p.radius;
    const maxX = this.width - this.arenaPad - p.radius;
    const minY = this.arenaPad + p.radius;
    const maxY = this.height - this.arenaPad - p.radius;

    if (p.x < minX) {
      p.x = minX;
      p.vx = Math.abs(p.vx) * 0.35;
    } else if (p.x > maxX) {
      p.x = maxX;
      p.vx = -Math.abs(p.vx) * 0.35;
    }
    if (p.y < minY) {
      p.y = minY;
      p.vy = Math.abs(p.vy) * 0.35;
    } else if (p.y > maxY) {
      p.y = maxY;
      p.vy = -Math.abs(p.vy) * 0.35;
    }

    const wantsFire =
      this.mouseDown || this.heldKeys.has(kb.fire) || this.heldKeys.has('Space');

    if (wantsFire && p.fireCooldown <= 0 && p.dashTimer <= 0) {
      this.firePlayerWeapon();
    }
  }

  private firePlayerWeapon(): void {
    const p = this.player;
    const overdriveRate = p.overdriveTimer > 0 ? 1.85 : 1.0;
    const rapidBoostRate = this.activeBoostTimers.rapid_fire > 0 ? 1.65 : 1.0;
    const overdriveDmg = p.overdriveTimer > 0 ? 1.35 : 1.0;
    const surgeBoostDmg = this.activeBoostTimers.damage_surge > 0 ? 1.6 : 1.0;
    const surgeBonusPierce = this.activeBoostTimers.damage_surge > 0 ? 1 : 0;

    const rateDiv = p.fireRateMult * overdriveRate * rapidBoostRate;
    const totalDmgMult = p.damageMult * overdriveDmg * surgeBoostDmg;
    const totalPierce = p.bonusPierce + surgeBonusPierce;

    const muzzleX = p.x + Math.cos(p.angle) * 17;
    const muzzleY = p.y + Math.sin(p.angle) * 17;
    const wColor =
      this.activeBoostTimers.damage_surge > 0
        ? '#FB7185'
        : this.activeBoostTimers.rapid_fire > 0
        ? '#FBBF24'
        : WEAPONS[p.weapon].color;

    if (p.weapon === 'spread') {
      p.fireCooldown = 0.22 / rateDiv;
      const count = 3 + p.extraBarrels;
      const totalSpread = Math.min(0.75, 0.32 + count * 0.06);
      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * totalSpread;
        this.spawnPlayerProjectile(
          muzzleX,
          muzzleY,
          p.angle + offset,
          730,
          0.78 * totalDmgMult,
          totalPierce,
          false,
          wColor,
          4.2
        );
      }
    } else if (p.weapon === 'rail') {
      p.fireCooldown = 0.28 / rateDiv;
      const barrels = 1 + p.extraBarrels;
      for (let i = 0; i < barrels; i++) {
        const offset = barrels === 1 ? 0 : (i / (barrels - 1) - 0.5) * 0.12;
        this.spawnPlayerProjectile(
          muzzleX,
          muzzleY,
          p.angle + offset,
          1050,
          1.85 * totalDmgMult,
          3 + totalPierce,
          false,
          wColor,
          5.2
        );
      }
    } else if (p.weapon === 'missile') {
      p.fireCooldown = 0.21 / rateDiv;
      const count = 2 + p.extraBarrels;
      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * 0.42;
        this.spawnPlayerProjectile(
          muzzleX,
          muzzleY,
          p.angle + offset,
          590,
          1.05 * totalDmgMult,
          totalPierce,
          true,
          wColor,
          4.8
        );
      }
    } else {
      p.fireCooldown = 0.13 / rateDiv;
      const count = 1 + p.extraBarrels;
      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * 0.18;
        this.spawnPlayerProjectile(
          muzzleX,
          muzzleY,
          p.angle + offset,
          810,
          1.05 * totalDmgMult,
          totalPierce,
          false,
          wColor,
          4.5
        );
      }
    }

    p.squashX = 0.86;
    p.squashY = 1.14;
    p.vx -= Math.cos(p.angle) * 14;
    p.vy -= Math.sin(p.angle) * 14;

    for (let i = 0; i < 3; i++) {
      const a = p.angle + (Math.random() - 0.5) * 0.6;
      const spd = 90 + Math.random() * 90;
      this.spawnParticle(
        muzzleX,
        muzzleY,
        Math.cos(a) * spd,
        Math.sin(a) * spd,
        0.13,
        2,
        wColor,
        0.88
      );
    }

    this.sound.playShoot(p.weapon);
  }

  private spawnPlayerProjectile(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    pierce: number,
    homing: boolean,
    color: string,
    radius: number
  ): void {
    for (const b of this.playerBullets) {
      if (!b.active) {
        b.active = true;
        b.x = x;
        b.y = y;
        b.vx = Math.cos(angle) * speed + this.player.vx * 0.14;
        b.vy = Math.sin(angle) * speed + this.player.vy * 0.14;
        b.life = 1.35;
        b.radius = radius;
        b.angle = angle;
        b.damage = damage;
        b.pierce = pierce;
        b.homing = homing;
        b.color = color;
        b.hitEnemyIds.clear();
        return;
      }
    }
  }

  private updateWaveSpawning(dt: number): void {
    if (this.waveSpawnQueue.length > 0) {
      this.spawnCooldown -= dt;
      const maxConcurrent = Math.min(6 + this.wave * 2, 18);
      if (this.spawnCooldown <= 0 && this.enemies.length < maxConcurrent) {
        const nextEntry = this.waveSpawnQueue.shift()!;
        this.spawnEnemyAtSafeEdge(nextEntry.type, nextEntry.isElite);
        const interval = Math.max(0.38, 1.15 - this.wave * 0.065);
        this.spawnCooldown = interval;
      }
    } else if (this.enemies.length === 0) {
      if (this.waveClearDelay <= 0) {
        this.waveClearDelay = 1.05;
        this.sound.playWaveClear();
        this.waveBanner = `HOÀN THÀNH ĐỢT ${String(this.wave).padStart(2, '0')}`;
        this.waveBannerTimer = 1.0;
      } else {
        this.waveClearDelay -= dt;
        if (this.waveClearDelay <= 0) {
          this.openPerkSelection();
        }
      }
    }
  }

  private spawnEnemyAtSafeEdge(type: EnemyType, isElite: boolean): void {
    if (type === 'boss_aegis' || type === 'boss_hydra') {
      const bx = this.width * 0.5;
      const by = Math.max(this.arenaPad + 95, this.height * 0.22);
      this.createEnemy(type, bx, by, 1.1, false);
      return;
    }

    const pad = this.arenaPad + 38;
    let x = pad;
    let y = pad;

    for (let attempt = 0; attempt < 10; attempt++) {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) {
        x = pad + Math.random() * Math.max(40, this.width - pad * 2);
        y = pad + Math.random() * 36;
      } else if (edge === 1) {
        x = pad + Math.random() * Math.max(40, this.width - pad * 2);
        y = this.height - pad - Math.random() * 36;
      } else if (edge === 2) {
        x = pad + Math.random() * 36;
        y = pad + Math.random() * Math.max(40, this.height - pad * 2);
      } else {
        x = this.width - pad - Math.random() * 36;
        y = pad + Math.random() * Math.max(40, this.height - pad * 2);
      }
      if (Math.hypot(x - this.player.x, y - this.player.y) > 220) break;
    }

    this.createEnemy(type, x, y, 0.55, isElite);
  }

  private createEnemy(
    type: EnemyType,
    x: number,
    y: number,
    spawnTimer: number,
    isElite: boolean
  ): Enemy {
    const modeSpeed = this.mode === 'hardcore' ? 1.22 : 1.0;
    const speedScale = (1 + Math.min((this.wave - 1) * 0.055, 0.5)) * modeSpeed;
    const hpScale = 1 + Math.max(0, this.wave - 1) * 0.14;

    let radius = 14;
    let hp = 1.2 * hpScale;
    let speed = 135 * speedScale;
    let points = 100;
    let isBoss = false;

    if (type === 'chaser') {
      radius = 12;
      hp = 1.0 * hpScale;
      speed = 215 * speedScale;
      points = 130;
    } else if (type === 'shooter') {
      radius = 15;
      hp = 2.0 * hpScale;
      speed = 112 * speedScale;
      points = 190;
    } else if (type === 'tank') {
      radius = 25;
      hp = 6.5 * hpScale;
      speed = 68 * speedScale;
      points = 340;
    } else if (type === 'charger') {
      radius = 15;
      hp = 2.2 * hpScale;
      speed = 118 * speedScale;
      points = 200;
    } else if (type === 'prism') {
      radius = 22;
      hp = 3.4 * hpScale;
      speed = 84 * speedScale;
      points = 260;
    } else if (type === 'pulsar') {
      radius = 17;
      hp = 2.5 * hpScale;
      speed = 105 * speedScale;
      points = 230;
    } else if (type === 'shardling') {
      radius = 9;
      hp = 0.9 * hpScale;
      speed = 205 * speedScale;
      points = 80;
    } else if (type === 'boss_aegis') {
      radius = 42;
      hp = 58 + this.wave * 18;
      speed = 78 * modeSpeed;
      points = 2200;
      isBoss = true;
    } else if (type === 'boss_hydra') {
      radius = 44;
      hp = 68 + this.wave * 20;
      speed = 86 * modeSpeed;
      points = 2600;
      isBoss = true;
    }

    if (isElite && !isBoss) {
      radius = Math.round(radius * 1.24);
      hp *= 2.4;
      speed *= 1.1;
      points *= 2.5;
    }

    const enemy: Enemy = {
      id: this.nextEnemyId++,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      angle: Math.atan2(this.player.y - y, this.player.x - x),
      radius,
      hp,
      maxHp: hp,
      speed,
      points: Math.round(points),
      spawnTimer,
      hitFlash: 0,
      squash: 1,
      isElite,
      isBoss,
      bossPhase: 1,
      state:
        type === 'pulsar' || type === 'shooter' || isBoss ? 'orbit' : 'chase',
      stateTimer:
        type === 'shooter'
          ? 1.1 + Math.random() * 0.7
          : isBoss
          ? 2.0
          : 1.3 + Math.random() * 0.7,
      secondaryTimer: 2.2,
      aimX: this.player.x,
      aimY: this.player.y,
      orbitDir: Math.random() < 0.5 ? 1 : -1,
    };

    this.enemies.push(enemy);
    return enemy;
  }

  private updatePlayerBullets(dt: number): void {
    const minX = this.arenaPad;
    const maxX = this.width - this.arenaPad;
    const minY = this.arenaPad;
    const maxY = this.height - this.arenaPad;

    for (const b of this.playerBullets) {
      if (!b.active) continue;

      if (b.homing && this.enemies.length > 0) {
        let nearest: Enemy | null = null;
        let bestDist = 380;
        for (const e of this.enemies) {
          if (e.spawnTimer > 0 || b.hitEnemyIds.has(e.id)) continue;
          const d = Math.hypot(e.x - b.x, e.y - b.y);
          if (d < bestDist) {
            bestDist = d;
            nearest = e;
          }
        }
        if (nearest) {
          const targetA = Math.atan2(nearest.y - b.y, nearest.x - b.x);
          b.angle = this.lerpAngle(b.angle, targetA, dt * 8.8);
          const spd = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(b.angle) * spd;
          b.vy = Math.sin(b.angle) * spd;
        }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0 || b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) {
        b.active = false;
        this.spawnBurst(b.x, b.y, 3, b.color, 85);
        continue;
      }

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (e.spawnTimer > 0 || b.hitEnemyIds.has(e.id)) continue;
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist <= b.radius + e.radius) {
          b.hitEnemyIds.add(e.id);
          const knockScale = e.type === 'tank' ? 0.025 : e.isBoss ? 0.008 : 0.08;
          this.damageEnemy(i, b.damage, b.vx * knockScale, b.vy * knockScale);

          if (b.pierce > 0) {
            b.pierce -= 1;
            this.spawnBurst(b.x, b.y, 4, b.color, 110);
          } else {
            b.active = false;
            break;
          }
        }
      }
    }
  }

  private spawnRandomBoostPickup(x: number, y: number): void {
    const types: BoostType[] = ['rapid_fire', 'hyper_speed', 'damage_surge', 'hyper_magnet'];
    const chosen = types[Math.floor(Math.random() * types.length)];
    for (const bp of this.boostPickups) {
      if (!bp.active) {
        const a = Math.random() * Math.PI * 2;
        const spd = 45 + Math.random() * 75;
        bp.active = true;
        bp.type = chosen;
        bp.x = x;
        bp.y = y;
        bp.vx = Math.cos(a) * spd;
        bp.vy = Math.sin(a) * spd;
        bp.life = 11.5;
        bp.maxLife = 11.5;
        return;
      }
    }
  }

  private updateBoostPickups(dt: number): void {
    const p = this.player;
    const magnetR =
      this.activeBoostTimers.hyper_magnet > 0 ? 1800 : p.magnetRadius * 1.15;

    for (const bp of this.boostPickups) {
      if (!bp.active) continue;
      bp.life -= dt;
      if (bp.life <= 0) {
        bp.active = false;
        continue;
      }

      const dx = p.x - bp.x;
      const dy = p.y - bp.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetR) {
        const pull = (1 - Math.min(1, dist / magnetR)) * 760 + 260;
        bp.vx += (dx / Math.max(dist, 1)) * pull * dt;
        bp.vy += (dy / Math.max(dist, 1)) * pull * dt;
      } else {
        bp.vx *= Math.exp(-3.5 * dt);
        bp.vy *= Math.exp(-3.5 * dt);
      }

      bp.x += bp.vx * dt;
      bp.y += bp.vy * dt;

      if (dist < p.radius + 18) {
        bp.active = false;
        const def = BOOST_DEFS[bp.type];
        this.activeBoostTimers[bp.type] = def.duration;
        this.sound.playPerkSelect();
        this.spawnShockwave(p.x, p.y, 115, def.color, 2.8);
        this.spawnBurst(bp.x, bp.y, 16, def.color, 190);
        this.spawnFloatingText(p.x, p.y - 28, `BOOST: ${def.shortLabel}!`, def.color);

        if (bp.type === 'hyper_speed') {
          p.dashCooldown = 0;
        } else if (bp.type === 'hyper_magnet') {
          if (p.overdriveTimer <= 0) {
            p.overdriveCharge = Math.min(100, p.overdriveCharge + 18);
          }
        }
        this.pushHud(true);
      }
    }
  }

  private damageEnemy(index: number, damage: number, knockVx: number, knockVy: number): void {
    const e = this.enemies[index];
    if (!e) return;

    e.hp -= damage;
    e.hitFlash = 0.085;
    e.squash = e.isBoss ? 1.08 : 1.24;
    e.vx += knockVx;
    e.vy += knockVy;

    if (this.player.overdriveTimer <= 0) {
      this.player.overdriveCharge = Math.min(
        100,
        this.player.overdriveCharge + 1.4 * this.player.overdriveGainMult
      );
    }

    if (e.isBoss && e.bossPhase === 1 && e.hp <= e.maxHp * 0.5) {
      e.bossPhase = 2;
      this.spawnShockwave(e.x, e.y, 160, '#F43F5E', 3.5);
      this.spawnFloatingText(e.x, e.y - e.radius - 12, 'CUỒNG NỘ PHA 2!', '#FB7185');
      this.addShake(7);
      // Boss drops a guaranteed combat boost when entering Phase 2
      this.spawnRandomBoostPickup(e.x, e.y);
    }

    if (e.hp > 0) {
      this.sound.playHit(e.type === 'prism' || e.type === 'tank' || e.isBoss);
      this.spawnBurst(e.x, e.y, 5, '#F8FAFC', 130);
      return;
    }

    this.enemies.splice(index, 1);
    this.waveDefeated += 1;
    this.totalEnemiesDefeated += 1;
    this.profile.stats.totalKills += 1;

    if (this.totalEnemiesDefeated >= 25) {
      this.tryUnlockAchievement('first_blood');
    }

    if (e.isElite) {
      this.elitesDefeated += 1;
      if (this.elitesDefeated >= 5) {
        this.tryUnlockAchievement('elite_hunter');
      }
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI * 2) / 6;
        this.spawnEnemyProjectile(e.x, e.y, Math.cos(a) * 185, Math.sin(a) * 185, 4.8, '#FBBF24');
      }
    }

    if (e.isBoss) {
      this.bossesDefeated += 1;
      this.profile.stats.totalBossKills += 1;
      this.tryUnlockAchievement('boss_slayer');
    }

    if (this.player.overdriveTimer <= 0) {
      const gain = e.isBoss ? 35 : e.isElite ? 12 : 4.5;
      this.player.overdriveCharge = Math.min(
        100,
        this.player.overdriveCharge + gain * this.player.overdriveGainMult
      );
    }

    const modeScoreMult = this.mode === 'hardcore' ? 2 : this.mode === 'boss_rush' ? 1.5 : 1;
    const gained = Math.round(e.points * this.multiplier * modeScoreMult);
    this.addScore(gained);
    this.spawnFloatingText(
      e.x,
      e.y - 10,
      e.isBoss ? `HẠ BOSS +${gained}` : `+${gained}`,
      e.isBoss ? '#34D399' : '#FDE68A'
    );

    const isHeavy =
      e.isBoss || e.isElite || e.type === 'prism' || e.type === 'tank' || e.type === 'charger';
    this.sound.playExplosion(isHeavy);

    if (e.isBoss) {
      this.hitstopTimer = 0.08;
      this.addShake(14);
    } else if (isHeavy) {
      this.hitstopTimer = 0.042;
      this.addShake(6.5);
    } else {
      this.addShake(2.6);
    }

    const color = this.getEnemyColor(e);
    this.spawnBurst(e.x, e.y, e.isBoss ? 48 : isHeavy ? 22 : 12, color, e.isBoss ? 340 : 220);
    this.spawnShockwave(
      e.x,
      e.y,
      e.isBoss ? 220 : e.radius * 2.8,
      color,
      e.isBoss ? 4 : isHeavy ? 2.5 : 1.8
    );

    if (e.type === 'prism') {
      for (let s = 0; s < 2; s++) {
        const offsetAngle = e.angle + (s === 0 ? -Math.PI / 2 : Math.PI / 2);
        const child = this.createEnemy(
          'shardling',
          e.x + Math.cos(offsetAngle) * 14,
          e.y + Math.sin(offsetAngle) * 14,
          0,
          false
        );
        child.vx = Math.cos(offsetAngle) * 210;
        child.vy = Math.sin(offsetAngle) * 210;
        this.waveTotalEnemies += 1;
      }
    }

    const shardDrops = e.isBoss
      ? 14
      : e.isElite
      ? 5
      : e.type === 'tank'
      ? 4
      : e.type === 'prism'
      ? 3
      : e.type === 'shardling'
      ? 1
      : 2;

    for (let s = 0; s < shardDrops; s++) {
      this.spawnShard(e.x, e.y, 25, e.isBoss ? 3 : e.isElite ? 2 : 1, false);
    }

    // Roll for temporary combat boost drop (Tốc Bắn, Tốc Chạy, Sát Thương, Từ Trường)
    const boostDropChance = e.isBoss
      ? 1.0
      : e.isElite
      ? 0.48
      : e.type === 'tank' || e.type === 'prism'
      ? 0.24
      : 0.14;
    if (Math.random() < boostDropChance) {
      this.spawnRandomBoostPickup(e.x, e.y);
    }

    if (
      this.mode !== 'hardcore' &&
      this.player.shields < this.player.maxShields &&
      (e.isBoss || Math.random() < (e.isElite ? 0.25 : 0.07))
    ) {
      this.spawnShard(e.x, e.y, 50, 2, true);
    }

    this.pushHud(true);
  }

  private getEnemyColor(e: Enemy): string {
    switch (e.type) {
      case 'chaser':
        return COLORS.chaser;
      case 'shooter':
        return COLORS.shooter;
      case 'tank':
        return COLORS.tank;
      case 'charger':
        return COLORS.charger;
      case 'prism':
        return COLORS.prism;
      case 'pulsar':
        return COLORS.pulsar;
      case 'shardling':
        return COLORS.shardling;
      case 'boss_aegis':
        return COLORS.bossAegis;
      case 'boss_hydra':
        return COLORS.bossHydra;
      default:
        return COLORS.drifter;
    }
  }

  private updateEnemies(dt: number): void {
    const minX = this.arenaPad;
    const maxX = this.width - this.arenaPad;
    const minY = this.arenaPad;
    const maxY = this.height - this.arenaPad;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.squash += (1 - e.squash) * Math.min(1, dt * 14);

      if (e.spawnTimer > 0) {
        e.spawnTimer = Math.max(0, e.spawnTimer - dt);
        continue;
      }

      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const distToPlayer = Math.hypot(dx, dy);
      const dirX = dx / Math.max(distToPlayer, 1);
      const dirY = dy / Math.max(distToPlayer, 1);

      if (e.type === 'drifter' || e.type === 'shardling' || e.type === 'prism') {
        const targetAngle = Math.atan2(dy, dx);
        e.angle = this.lerpAngle(e.angle, targetAngle, dt * (e.type === 'prism' ? 3 : 6));
        const desiredVx = Math.cos(e.angle) * e.speed;
        const desiredVy = Math.sin(e.angle) * e.speed;
        e.vx += (desiredVx - e.vx) * Math.min(1, dt * 4.5);
        e.vy += (desiredVy - e.vy) * Math.min(1, dt * 4.5);
      } else if (e.type === 'chaser') {
        const weave = Math.sin(this.elapsedTime * 7 + e.id) * 0.38;
        const targetAngle = Math.atan2(dy, dx) + weave;
        e.angle = this.lerpAngle(e.angle, targetAngle, dt * 10);
        const desiredVx = Math.cos(e.angle) * e.speed;
        const desiredVy = Math.sin(e.angle) * e.speed;
        e.vx += (desiredVx - e.vx) * Math.min(1, dt * 7.5);
        e.vy += (desiredVy - e.vy) * Math.min(1, dt * 7.5);
      } else if (e.type === 'tank') {
        const targetAngle = Math.atan2(dy, dx);
        e.angle = this.lerpAngle(e.angle, targetAngle, dt * 2.4);
        e.vx += (Math.cos(e.angle) * e.speed - e.vx) * Math.min(1, dt * 3);
        e.vy += (Math.sin(e.angle) * e.speed - e.vy) * Math.min(1, dt * 3);
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.stateTimer = 3.2;
          for (let k = 0; k < 6; k++) {
            const a = e.angle + (k * Math.PI * 2) / 6;
            this.spawnEnemyProjectile(e.x, e.y, Math.cos(a) * 155, Math.sin(a) * 155, 5.5, COLORS.tank);
          }
          this.spawnShockwave(e.x, e.y, e.radius * 2.2, COLORS.tank, 2);
        }
      } else if (e.type === 'shooter') {
        if (e.state === 'orbit') {
          const desiredDist = 270;
          const radialPush = Math.max(-1, Math.min(1, (distToPlayer - desiredDist) / 90));
          const tangentX = -dirY * e.orbitDir;
          const tangentY = dirX * e.orbitDir;
          const desiredVx = (dirX * radialPush * 0.75 + tangentX * 0.75) * e.speed;
          const desiredVy = (dirY * radialPush * 0.75 + tangentY * 0.75) * e.speed;
          e.vx += (desiredVx - e.vx) * Math.min(1, dt * 4.5);
          e.vy += (desiredVy - e.vy) * Math.min(1, dt * 4.5);
          e.angle = Math.atan2(dy, dx);
          e.stateTimer -= dt;
          if (e.stateTimer <= 0 && distToPlayer < 520) {
            e.state = 'windup';
            e.stateTimer = 0.65;
            e.aimX = dirX;
            e.aimY = dirY;
            this.sound.playTelegraph();
          }
        } else if (e.state === 'windup') {
          e.vx *= Math.exp(-8 * dt);
          e.vy *= Math.exp(-8 * dt);
          if (e.stateTimer > 0.22) {
            e.aimX = dirX;
            e.aimY = dirY;
            e.angle = Math.atan2(dy, dx);
          }
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            const baseA = Math.atan2(e.aimY, e.aimX);
            const shots = e.isElite ? 3 : 2;
            for (let s = 0; s < shots; s++) {
              const spread = (s / (shots - 1) - 0.5) * 0.22;
              const spd = 250 + s * 25;
              this.spawnEnemyProjectile(
                e.x + Math.cos(baseA) * e.radius,
                e.y + Math.sin(baseA) * e.radius,
                Math.cos(baseA + spread) * spd,
                Math.sin(baseA + spread) * spd,
                5,
                COLORS.shooter
              );
            }
            e.squash = 1.25;
            e.state = 'orbit';
            e.stateTimer = 1.7 + Math.random() * 0.7;
          }
        }
      } else if (e.type === 'charger') {
        if (e.state === 'chase') {
          e.angle = this.lerpAngle(e.angle, Math.atan2(dy, dx), dt * 5);
          e.vx += (dirX * e.speed - e.vx) * Math.min(1, dt * 4);
          e.vy += (dirY * e.speed - e.vy) * Math.min(1, dt * 4);
          e.stateTimer -= dt;
          if (e.stateTimer <= 0 && distToPlayer < 430) {
            e.state = 'windup';
            e.stateTimer = 0.72;
            e.aimX = dirX;
            e.aimY = dirY;
            e.angle = Math.atan2(dy, dx);
            this.sound.playTelegraph();
          }
        } else if (e.state === 'windup') {
          e.vx *= Math.exp(-10 * dt);
          e.vy *= Math.exp(-10 * dt);
          if (e.stateTimer > 0.3) {
            e.aimX = dirX;
            e.aimY = dirY;
            e.angle = Math.atan2(dy, dx);
          }
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'lunge';
            e.stateTimer = 0.42;
            e.vx = e.aimX * 560;
            e.vy = e.aimY * 560;
            e.squash = 1.4;
            this.spawnBurst(e.x, e.y, 7, COLORS.charger, 120);
          }
        } else if (e.state === 'lunge') {
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'recover';
            e.stateTimer = 0.55;
          }
        } else {
          e.vx *= Math.exp(-6 * dt);
          e.vy *= Math.exp(-6 * dt);
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'chase';
            e.stateTimer = 1.3 + Math.random() * 0.6;
          }
        }
      } else if (e.type === 'pulsar') {
        if (e.state === 'orbit') {
          const desiredDist = 250;
          const radialPush = Math.max(-1, Math.min(1, (distToPlayer - desiredDist) / 90));
          const tangentX = -dirY * e.orbitDir;
          const tangentY = dirX * e.orbitDir;
          const desiredVx = (dirX * radialPush * 0.7 + tangentX * 0.85) * e.speed;
          const desiredVy = (dirY * radialPush * 0.7 + tangentY * 0.85) * e.speed;
          e.vx += (desiredVx - e.vx) * Math.min(1, dt * 4);
          e.vy += (desiredVy - e.vy) * Math.min(1, dt * 4);
          e.angle += dt * 1.4;
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'windup';
            e.stateTimer = 0.85;
            this.sound.playTelegraph();
          }
        } else if (e.state === 'windup') {
          e.vx *= Math.exp(-8 * dt);
          e.vy *= Math.exp(-8 * dt);
          e.angle += dt * 4.5;
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            this.fireRadialVolley(e, e.isElite ? 6 : 4, 210, COLORS.pulsar);
            e.state = 'orbit';
            e.stateTimer = 2.3 + Math.random() * 0.8;
            e.squash = 1.3;
          }
        }
      } else if (e.isBoss) {
        this.updateBossBehavior(e, dt, dirX, dirY, distToPlayer);
      }

      for (let j = i + 1; j < this.enemies.length; j++) {
        const other = this.enemies[j];
        if (other.spawnTimer > 0) continue;
        const sdx = e.x - other.x;
        const sdy = e.y - other.y;
        const sDist = Math.hypot(sdx, sdy);
        const minSep = e.radius + other.radius + 4;
        if (sDist > 0 && sDist < minSep) {
          const push = ((minSep - sDist) / minSep) * 140 * dt;
          const nx = sdx / sDist;
          const ny = sdy / sDist;
          if (!e.isBoss) {
            e.vx += nx * push;
            e.vy += ny * push;
          }
          if (!other.isBoss) {
            other.vx -= nx * push;
            other.vy -= ny * push;
          }
        }
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (e.x < minX + e.radius) {
        e.x = minX + e.radius;
        e.vx = Math.abs(e.vx) * 0.6;
      } else if (e.x > maxX - e.radius) {
        e.x = maxX - e.radius;
        e.vx = -Math.abs(e.vx) * 0.6;
      }
      if (e.y < minY + e.radius) {
        e.y = minY + e.radius;
        e.vy = Math.abs(e.vy) * 0.6;
      } else if (e.y > maxY - e.radius) {
        e.y = maxY - e.radius;
        e.vy = -Math.abs(e.vy) * 0.6;
      }

      if (this.player.invulnTimer <= 0 && this.player.dashTimer <= 0) {
        const pDist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (pDist < e.radius + this.player.radius - 2) {
          this.damagePlayer(e.x, e.y);
        }
      }
    }
  }

  private updateBossBehavior(
    e: Enemy,
    dt: number,
    dirX: number,
    dirY: number,
    distToPlayer: number
  ): void {
    const phaseMult = e.bossPhase === 2 ? 1.3 : 1.0;
    e.angle += dt * 0.9 * phaseMult;

    if (e.state === 'orbit') {
      const desiredDist = 230;
      const radialPush = Math.max(-1, Math.min(1, (distToPlayer - desiredDist) / 110));
      const tangentX = -dirY * e.orbitDir;
      const tangentY = dirX * e.orbitDir;
      const desiredVx = (dirX * radialPush * 0.65 + tangentX * 0.75) * e.speed * phaseMult;
      const desiredVy = (dirY * radialPush * 0.65 + tangentY * 0.75) * e.speed * phaseMult;
      e.vx += (desiredVx - e.vx) * Math.min(1, dt * 3);
      e.vy += (desiredVy - e.vy) * Math.min(1, dt * 3);

      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        if (e.type === 'boss_aegis' && e.bossPhase === 2 && Math.random() < 0.45) {
          e.state = 'windup';
          e.stateTimer = 0.85;
          e.aimX = dirX;
          e.aimY = dirY;
          this.sound.playTelegraph();
        } else {
          e.state = 'spiral_volley';
          e.stateTimer = 1.6;
          e.secondaryTimer = 0;
          this.sound.playTelegraph();
        }
      }
    } else if (e.state === 'spiral_volley') {
      e.vx *= Math.exp(-5 * dt);
      e.vy *= Math.exp(-5 * dt);
      e.stateTimer -= dt;
      e.secondaryTimer -= dt;

      if (e.secondaryTimer <= 0) {
        e.secondaryTimer = e.bossPhase === 2 ? 0.24 : 0.34;
        const arms = e.type === 'boss_hydra' ? 6 : 5;
        const spd = e.type === 'boss_hydra' ? 215 : 195;
        const col = e.type === 'boss_hydra' ? COLORS.bossHydra : COLORS.bossAegis;
        this.fireRadialVolley(e, arms, spd, col);
      }

      if (e.stateTimer <= 0) {
        e.state = 'orbit';
        e.stateTimer = e.bossPhase === 2 ? 1.5 : 2.1;
      }
    } else if (e.state === 'windup') {
      e.vx *= Math.exp(-8 * dt);
      e.vy *= Math.exp(-8 * dt);
      if (e.stateTimer > 0.28) {
        e.aimX = dirX;
        e.aimY = dirY;
      }
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        e.state = 'lunge';
        e.stateTimer = 0.52;
        e.vx = e.aimX * 520;
        e.vy = e.aimY * 520;
        this.spawnShockwave(e.x, e.y, 110, COLORS.bossAegis, 3);
      }
    } else if (e.state === 'lunge') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        this.fireRadialVolley(e, 8, 200, COLORS.bossAegis);
        e.state = 'orbit';
        e.stateTimer = 1.6;
      }
    }
  }

  private fireRadialVolley(e: Enemy, count: number, bulletSpeed: number, color: string): void {
    const baseAngle = e.angle;
    for (let k = 0; k < count; k++) {
      const a = baseAngle + (k * Math.PI * 2) / count;
      this.spawnEnemyProjectile(
        e.x + Math.cos(a) * (e.radius + 4),
        e.y + Math.sin(a) * (e.radius + 4),
        Math.cos(a) * bulletSpeed,
        Math.sin(a) * bulletSpeed,
        5.5,
        color
      );
    }
    this.spawnShockwave(e.x, e.y, e.radius + 26, color, 2);
  }

  private spawnEnemyProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    color: string
  ): void {
    for (const b of this.enemyBullets) {
      if (!b.active) {
        b.active = true;
        b.x = x;
        b.y = y;
        b.vx = vx;
        b.vy = vy;
        b.life = 4.5;
        b.radius = radius;
        b.color = color;
        return;
      }
    }
  }

  private updateEnemyBullets(dt: number): void {
    const minX = this.arenaPad;
    const maxX = this.width - this.arenaPad;
    const minY = this.arenaPad;
    const maxY = this.height - this.arenaPad;

    for (const b of this.enemyBullets) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0 || b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) {
        b.active = false;
        continue;
      }

      if (this.player.invulnTimer <= 0 && this.player.dashTimer <= 0) {
        const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
        if (dist < b.radius + this.player.radius - 2) {
          b.active = false;
          this.damagePlayer(b.x, b.y);
        }
      }
    }
  }

  private damagePlayer(sourceX: number, sourceY: number): void {
    const p = this.player;
    p.shields -= 1;
    p.invulnTimer = 1.4;
    p.hitFlash = 0.16;
    p.squashX = 1.35;
    p.squashY = 0.65;

    const dx = p.x - sourceX;
    const dy = p.y - sourceY;
    const dist = Math.max(Math.hypot(dx, dy), 1);
    p.vx = (dx / dist) * 320;
    p.vy = (dy / dist) * 320;

    this.multiplier = Math.max(1, Math.floor(this.multiplier / 2));
    this.comboTimer = this.multiplier > 1 ? this.maxComboDuration * 0.5 : 0;

    this.hitstopTimer = 0.055;
    this.addShake(11);
    this.sound.playPlayerDamage();
    this.spawnBurst(p.x, p.y, 24, COLORS.charger, 260);
    this.spawnShockwave(p.x, p.y, 125, COLORS.charger, 3);

    for (const e of this.enemies) {
      const edx = e.x - p.x;
      const edy = e.y - p.y;
      const eDist = Math.hypot(edx, edy);
      if (eDist > 0 && eDist < 180 && !e.isBoss) {
        e.vx += (edx / eDist) * 280;
        e.vy += (edy / eDist) * 280;
      }
    }

    if (p.shields <= 0) {
      p.shields = 0;
      savePlayerProfile(this.profile);
      this.callbacks.onProfileUpdate({ ...this.profile });
      this.pushHud(true);
      this.setState('GAME_OVER');
      return;
    }

    this.spawnFloatingText(p.x, p.y - 24, 'MẤT 1 SINH MẠNG!', COLORS.charger);
    this.pushHud(true);
  }

  private spawnShard(
    x: number,
    y: number,
    value: number,
    shardCurrency: number,
    isRepair: boolean
  ): void {
    for (const s of this.shards) {
      if (!s.active) {
        const a = Math.random() * Math.PI * 2;
        const spd = 45 + Math.random() * 95;
        s.active = true;
        s.x = x;
        s.y = y;
        s.vx = Math.cos(a) * spd;
        s.vy = Math.sin(a) * spd;
        s.life = 10.5;
        s.maxLife = 10.5;
        s.value = value;
        s.shardCurrency = shardCurrency;
        s.isRepair = isRepair;
        return;
      }
    }
  }

  private updateShards(dt: number): void {
    const p = this.player;
    const hasHyperMagnet = this.activeBoostTimers.hyper_magnet > 0;
    const magnetR = hasHyperMagnet ? 2000 : p.magnetRadius;

    for (const s of this.shards) {
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.active = false;
        continue;
      }

      const dx = p.x - s.x;
      const dy = p.y - s.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetR) {
        const pull = (1 - Math.min(1, dist / magnetR)) * 960 + (hasHyperMagnet ? 540 : 280);
        s.vx += (dx / Math.max(dist, 1)) * pull * dt;
        s.vy += (dy / Math.max(dist, 1)) * pull * dt;
      } else {
        s.vx *= Math.exp(-3.5 * dt);
        s.vy *= Math.exp(-3.5 * dt);
      }

      s.x += s.vx * dt;
      s.y += s.vy * dt;

      if (dist < p.radius + 15) {
        s.active = false;
        if (s.isRepair) {
          if (this.mode !== 'hardcore' && p.shields < p.maxShields) {
            p.shields += 1;
            this.spawnFloatingText(p.x, p.y - 22, '+1 SINH MẠNG', COLORS.repair);
          } else {
            this.addScore(180 * this.multiplier);
            this.spawnFloatingText(p.x, p.y - 22, `+${180 * this.multiplier}`, COLORS.repair);
          }
          this.sound.playShard(this.multiplier, true);
          this.spawnBurst(s.x, s.y, 10, COLORS.repair, 140);
        } else {
          this.multiplier = Math.min(8, this.multiplier + 1);
          this.comboTimer = this.maxComboDuration;
          if (this.multiplier >= 8) {
            this.tryUnlockAchievement('combo_master');
          }

          const modeShardMult =
            this.mode === 'hardcore' ? 2 : this.mode === 'boss_rush' ? 1.5 : 1;
          const magnetBonus = 1 + (this.profile.hangarLevels.magnet ?? 0) * 0.1;
          const gainedShards = Math.max(
            1,
            Math.round(s.shardCurrency * modeShardMult * magnetBonus)
          );

          this.runShards += gainedShards;
          this.profile.starShards += gainedShards;

          if (p.overdriveTimer <= 0) {
            p.overdriveCharge = Math.min(
              100,
              p.overdriveCharge + 2.4 * p.overdriveGainMult
            );
          }

          const pts = s.value * this.multiplier * (hasHyperMagnet ? 2 : 1);
          this.addScore(pts);
          this.sound.playShard(this.multiplier, false);
          this.spawnBurst(s.x, s.y, 6, COLORS.shard, 110);
        }
        this.pushHud(true);
      }
    }
  }

  private addScore(points: number): void {
    this.score += points;
    const currentBest = this.profile.bestScores[this.mode] ?? 0;
    if (this.score > currentBest) {
      this.profile.bestScores[this.mode] = this.score;
      this.isNewBest = true;
      savePlayerProfile(this.profile);
    }
    if (this.score >= 25000) {
      this.tryUnlockAchievement('score_25k');
    }
  }

  private addShake(amount: number): void {
    if (this.reducedMotion) return;
    this.shakeIntensity = Math.min(16, this.shakeIntensity + amount);
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    maxLife: number,
    size: number,
    color: string,
    drag: number
  ): void {
    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.life = maxLife;
        p.maxLife = maxLife;
        p.size = size;
        p.color = color;
        p.drag = drag;
        return;
      }
    }
  }

  private spawnBurst(x: number, y: number, count: number, color: string, maxSpeed: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * maxSpeed;
      const life = 0.22 + Math.random() * 0.28;
      const size = 2 + Math.random() * 2.8;
      this.spawnParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd, life, size, color, 0.92);
    }
  }

  private spawnShockwave(
    x: number,
    y: number,
    maxRadius: number,
    color: string,
    lineWidth: number
  ): void {
    for (const sw of this.shockwaves) {
      if (!sw.active) {
        sw.active = true;
        sw.x = x;
        sw.y = y;
        sw.radius = 6;
        sw.maxRadius = maxRadius;
        sw.life = 0.3;
        sw.maxLife = 0.3;
        sw.color = color;
        sw.lineWidth = lineWidth;
        return;
      }
    }
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string): void {
    for (const ft of this.floatingTexts) {
      if (!ft.active) {
        ft.active = true;
        ft.x = x;
        ft.y = y;
        ft.vy = -42;
        ft.text = text;
        ft.color = color;
        ft.life = 0.85;
        ft.maxLife = 0.85;
        return;
      }
    }
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      const damp = Math.pow(p.drag, dt * 60);
      p.vx *= damp;
      p.vy *= damp;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private updateShockwaves(dt: number): void {
    for (const sw of this.shockwaves) {
      if (!sw.active) continue;
      sw.life -= dt;
      if (sw.life <= 0) {
        sw.active = false;
        continue;
      }
      const t = 1 - sw.life / sw.maxLife;
      const eased = 1 - Math.pow(1 - t, 3);
      sw.radius = 6 + (sw.maxRadius - 6) * eased;
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (const ft of this.floatingTexts) {
      if (!ft.active) continue;
      ft.life -= dt;
      if (ft.life <= 0) {
        ft.active = false;
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * Math.min(1, t);
  }

  private getActiveBossInfo(): BossHudInfo | null {
    const boss = this.enemies.find((e) => e.isBoss);
    if (!boss) return null;
    return {
      name: boss.type === 'boss_aegis' ? 'PHÁO ĐÀI AEGIS' : 'XÀ VƯƠNG MẶT TRỜI',
      subtitle: boss.bossPhase === 2 ? 'Pha 2 · Cuồng Nộ' : 'Pha 1 · Phòng Tuyến',
      hp: Math.max(0, Math.ceil(boss.hp)),
      maxHp: Math.ceil(boss.maxHp),
      phase: boss.bossPhase,
    };
  }

  private getActiveBoostsHud(): ActiveBoostHud[] {
    const list: ActiveBoostHud[] = [];
    (Object.keys(this.activeBoostTimers) as BoostType[]).forEach((t) => {
      const rem = this.activeBoostTimers[t];
      if (rem > 0.05) {
        const def = BOOST_DEFS[t];
        list.push({
          type: t,
          label: def.shortLabel,
          color: def.color,
          remaining: rem,
          duration: def.duration,
        });
      }
    });
    return list;
  }

  private pushHud(force: boolean): void {
    const dashCharge = Math.max(
      0,
      Math.min(1, 1 - this.player.dashCooldown / this.player.dashMaxCooldown)
    );
    const overdriveCharge = Math.max(0, Math.min(1, this.player.overdriveCharge / 100));
    const comboProgress =
      this.multiplier > 1 ? Math.max(0, Math.min(1, this.comboTimer / this.maxComboDuration)) : 0;
    const waveProgress =
      this.waveTotalEnemies > 0 ? Math.min(1, this.waveDefeated / this.waveTotalEnemies) : 0;
    const bestScore = this.profile.bestScores[this.mode] ?? 0;
    const boss = this.getActiveBossInfo();
    const activeBoosts = this.getActiveBoostsHud();
    const boostSig = activeBoosts.map((b) => `${b.type}:${Math.round(b.remaining * 10)}`).join(',');

    const sig = `${this.score}|${bestScore}|${this.multiplier}|${Math.round(comboProgress * 20)}|${this.wave}|${Math.round(waveProgress * 20)}|${this.player.shields}|${this.player.maxShields}|${Math.round(dashCharge * 20)}|${Math.round(overdriveCharge * 25)}|${this.player.overdriveTimer > 0}|${this.player.weapon}|${this.runShards}|${this.profile.starShards}|${this.totalEnemiesDefeated}|${this.waveBanner ?? ''}|${this.currentSector.id}|${boostSig}|${boss?.hp ?? 0}|${this.gameState}`;
    if (!force && sig === this.lastHudSignature) return;
    this.lastHudSignature = sig;

    this.callbacks.onHudUpdate({
      score: this.score,
      bestScore,
      multiplier: this.multiplier,
      comboProgress,
      wave: this.wave,
      waveProgress,
      shields: this.player.shields,
      maxShields: this.player.maxShields,
      dashCharge,
      overdriveCharge,
      overdriveActive: this.player.overdriveTimer > 0,
      weapon: this.player.weapon,
      weaponLevel: this.player.weaponLevel,
      runShards: this.runShards,
      totalShards: this.profile.starShards,
      enemiesDefeated: this.totalEnemiesDefeated,
      bossesDefeated: this.bossesDefeated,
      waveBanner: this.waveBanner,
      sectorName: this.currentSector.name,
      sectorSubtitle: this.currentSector.subtitle,
      sectorAccent: this.currentSector.accentHex,
      isNewBest: this.isNewBest,
      mode: this.mode,
      shipId: this.shipId,
      activePerks: this.activePerks,
      perkChoices: this.currentPerkChoices,
      activeBoosts,
      boss,
    });
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    ctx.fillStyle = this.currentSector.bgBase;
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.shakeIntensity > 0.1) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(sx, sy);
    }

    this.renderBackdrop(ctx);

    if (this.gameState === 'TITLE_MENU') {
      this.renderTitleBackdropScene(ctx);
      this.renderParticles(ctx);
      this.renderShockwaves(ctx);
      ctx.restore();
      return;
    }

    this.renderArenaBounds(ctx);
    this.renderShards(ctx);
    this.renderBoostPickups(ctx);
    this.renderShockwaves(ctx);
    this.renderLightningArcs(ctx);
    this.renderEnemyBullets(ctx);
    this.renderPlayerBullets(ctx);
    this.renderEnemies(ctx);
    this.renderPlayer(ctx);
    this.renderParticles(ctx);
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  private renderBackdrop(ctx: CanvasRenderingContext2D): void {
    const sec = this.currentSector;

    // Dual cosmic nebula clouds that shift gently with player movement
    const offsetX = (this.player.x - this.width * 0.5) * -0.08;
    const offsetY = (this.player.y - this.height * 0.5) * -0.08;

    const grad = ctx.createRadialGradient(
      this.width * 0.5 + offsetX,
      this.height * 0.5 + offsetY,
      30,
      this.width * 0.5 + offsetX,
      this.height * 0.5 + offsetY,
      Math.max(this.width, this.height) * 0.72
    );
    grad.addColorStop(0, sec.nebulaCore);
    grad.addColorStop(0.55, sec.nebulaOuter);
    grad.addColorStop(1, 'rgba(4, 8, 16, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    const gridSize = 64;
    ctx.strokeStyle = sec.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = (this.width % gridSize) / 2; x < this.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = (this.height % gridSize) / 2; y < this.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();

    // Warp Jump Map Transition Effect when changing waves
    if (this.warpTransitionTimer > 0) {
      const t = this.warpTransitionTimer / this.warpMaxDuration;
      ctx.save();
      ctx.strokeStyle = sec.accentHex;
      ctx.globalAlpha = t * 0.45;
      ctx.lineWidth = 2;
      for (let r = 1; r <= 3; r++) {
        const rad = ((1 - t) * 420 + r * 95) % 620;
        ctx.beginPath();
        ctx.arc(this.width * 0.5, this.height * 0.5, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    const isWarping = this.warpTransitionTimer > 0.1;
    for (const s of this.stars) {
      const twinkle = 0.7 + 0.3 * Math.sin(this.elapsedTime * 2.2 + s.twinkleOffset);
      ctx.fillStyle = `rgba(${sec.starColor}, ${(s.alpha * twinkle).toFixed(3)})`;
      if (isWarping) {
        const stretch = 12 * s.depth * (this.warpTransitionTimer / this.warpMaxDuration);
        ctx.beginPath();
        ctx.roundRect(s.x - stretch, s.y - s.size * 0.5, stretch + s.size * 2, s.size, 1);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderTitleBackdropScene(ctx: CanvasRenderingContext2D): void {
    const cx = this.width >= 900 ? this.width * 0.68 : this.width * 0.5;
    const cy = this.width >= 900 ? this.height * 0.5 : this.height * 0.35;
    const ship = SHIPS[this.profile.selectedShip] ?? SHIPS.vanguard;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.16)';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(this.width * 0.22, 240), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.rotate(this.elapsedTime * 0.08);
    ctx.arc(0, 0, Math.min(this.width * 0.15, 165), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const orbitR = Math.min(this.width * 0.22, 240);
    const ox = Math.cos(-this.elapsedTime * 0.35) * orbitR;
    const oy = Math.sin(-this.elapsedTime * 0.35) * orbitR;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(this.elapsedTime * 0.8);
    ctx.strokeStyle = ship.dashColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      const rx = Math.cos(a) * 14;
      const ry = Math.sin(a) * 14;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    this.drawCraftShape(
      ctx,
      this.player.x,
      this.player.y,
      this.player.angle,
      1,
      1,
      false,
      ship.id,
      ship.accentColor
    );
  }

  private renderArenaBounds(ctx: CanvasRenderingContext2D): void {
    const pad = this.arenaPad;
    const w = this.width - pad * 2;
    const h = this.height - pad * 2;
    if (w <= 0 || h <= 0) return;

    ctx.strokeStyle = this.currentSector.borderColor;
    ctx.lineWidth = 1.35;
    ctx.strokeRect(pad, pad, w, h);

    const len = 18;
    ctx.strokeStyle = this.currentSector.cornerColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(pad, pad + len);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + len, pad);

    ctx.moveTo(pad + w - len, pad);
    ctx.lineTo(pad + w, pad);
    ctx.lineTo(pad + w, pad + len);

    ctx.moveTo(pad + w, pad + h - len);
    ctx.lineTo(pad + w, pad + h);
    ctx.lineTo(pad + w - len, pad + h);

    ctx.moveTo(pad + len, pad + h);
    ctx.lineTo(pad, pad + h);
    ctx.lineTo(pad, pad + h - len);
    ctx.stroke();
  }

  private renderLightningArcs(ctx: CanvasRenderingContext2D): void {
    for (const arc of this.lightningArcs) {
      const alpha = Math.max(0, arc.life / arc.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(arc.x1, arc.y1);
      const segments = 5;
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const mx = arc.x1 + (arc.x2 - arc.x1) * t + (Math.random() - 0.5) * 18;
        const my = arc.y1 + (arc.y2 - arc.y1) * t + (Math.random() - 0.5) * 18;
        ctx.lineTo(mx, my);
      }
      ctx.lineTo(arc.x2, arc.y2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderBoostPickups(ctx: CanvasRenderingContext2D): void {
    for (const bp of this.boostPickups) {
      if (!bp.active) continue;
      const blink = bp.life < 2.2 && Math.floor(bp.life * 10) % 2 === 0;
      if (blink) continue;

      const def = BOOST_DEFS[bp.type];
      const pulse = 1 + Math.sin(this.elapsedTime * 7) * 0.12;

      ctx.save();
      ctx.translate(bp.x, bp.y);

      // Outer pulsing aura ring
      ctx.strokeStyle = def.color;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 14 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating hexagonal power core
      ctx.save();
      ctx.rotate(this.elapsedTime * 2.4);
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#0B111E';
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const rx = Math.cos(a) * 10;
        const ry = Math.sin(a) * 10;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Inner glowing core dot
      ctx.globalAlpha = 1;
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
      ctx.fill();

      // Floating mini tag above boost
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = def.color;
      ctx.fillText(def.shortLabel, 0, -18);

      ctx.restore();
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    if (this.gameState === 'GAME_OVER' && this.player.shields <= 0) return;

    const p = this.player;
    const ship = SHIPS[this.shipId] ?? SHIPS.vanguard;

    if (p.overdriveTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 24 + Math.sin(this.elapsedTime * 16) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Active boost aura ring around player
    const activeBoostList = this.getActiveBoostsHud();
    if (activeBoostList.length > 0) {
      const topBoost = activeBoostList[0];
      ctx.save();
      ctx.strokeStyle = topBoost.color;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 21, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Ship-specific colored Dash Ghosts
    for (const g of this.dashGhosts) {
      ctx.save();
      ctx.globalAlpha = g.alpha * 0.55;
      this.drawCraftShape(
        ctx,
        g.x,
        g.y,
        g.angle,
        g.scale,
        2 - g.scale,
        false,
        g.shipId,
        g.color,
        g.secondaryColor
      );
      ctx.restore();
    }

    if (
      p.invulnTimer > 0 &&
      p.overdriveTimer <= 0 &&
      Math.floor(p.invulnTimer * 18) % 2 === 0 &&
      p.dashTimer <= 0
    ) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      this.drawCraftShape(
        ctx,
        p.x,
        p.y,
        p.angle,
        p.squashX,
        p.squashY,
        p.hitFlash > 0,
        ship.id,
        ship.accentColor
      );
      ctx.restore();
    } else {
      this.drawCraftShape(
        ctx,
        p.x,
        p.y,
        p.angle,
        p.squashX,
        p.squashY,
        p.hitFlash > 0,
        ship.id,
        ship.accentColor
      );
    }

    // Precision PC Mouse Reticle
    if (this.hasPointerAim && this.gameState === 'PLAYING') {
      ctx.save();
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.42)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(this.mouseX, this.mouseY, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ship.accentColor;
      ctx.beginPath();
      ctx.arc(this.mouseX, this.mouseY, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawCraftShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    squashX: number,
    squashY: number,
    flash: boolean,
    shipId: ShipId,
    accentColor: string,
    hullOverrideColor?: string
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(squashX, squashY);

    ctx.fillStyle = flash ? 'rgba(255, 255, 255, 0.3)' : `${accentColor}22`;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = flash ? '#FFFFFF' : hullOverrideColor ?? COLORS.playerFill;
    ctx.beginPath();

    switch (shipId) {
      case 'phantom':
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -14);
        ctx.lineTo(-4, -3);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-4, 3);
        ctx.lineTo(-10, 14);
        break;
      case 'valkyrie':
        ctx.moveTo(21, 0);
        ctx.lineTo(3, -15);
        ctx.lineTo(-13, -12);
        ctx.lineTo(-6, -3);
        ctx.lineTo(-11, 0);
        ctx.lineTo(-6, 3);
        ctx.lineTo(-13, 12);
        ctx.lineTo(3, 15);
        break;
      case 'titan':
        ctx.moveTo(17, 0);
        ctx.lineTo(5, -14);
        ctx.lineTo(-13, -13);
        ctx.lineTo(-9, 0);
        ctx.lineTo(-13, 13);
        ctx.lineTo(5, 14);
        break;
      case 'tempest':
        ctx.moveTo(20, 0);
        ctx.lineTo(2, -11);
        ctx.lineTo(-4, -16);
        ctx.lineTo(-12, -7);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-12, 7);
        ctx.lineTo(-4, 16);
        ctx.lineTo(2, 11);
        break;
      case 'eclipse':
        ctx.moveTo(19, 0);
        ctx.lineTo(-2, -16);
        ctx.lineTo(-15, -9);
        ctx.lineTo(-7, 0);
        ctx.lineTo(-15, 9);
        ctx.lineTo(-2, 16);
        break;
      case 'nova':
        ctx.moveTo(19, 0);
        ctx.lineTo(0, -14);
        ctx.lineTo(-13, -8);
        ctx.lineTo(-7, 0);
        ctx.lineTo(-13, 8);
        ctx.lineTo(0, 14);
        break;
      case 'solaris':
        ctx.moveTo(22, 0);
        ctx.lineTo(5, -8);
        ctx.lineTo(-4, -17);
        ctx.lineTo(-9, -6);
        ctx.lineTo(-15, 0);
        ctx.lineTo(-9, 6);
        ctx.lineTo(-4, 17);
        ctx.lineTo(5, 8);
        break;
      case 'aether':
        ctx.moveTo(20, 0);
        ctx.lineTo(3, -13);
        ctx.lineTo(-10, -13);
        ctx.lineTo(-15, 0);
        ctx.lineTo(-10, 13);
        ctx.lineTo(3, 13);
        break;
      case 'chronos':
        ctx.moveTo(22, 0);
        ctx.lineTo(6, -15);
        ctx.lineTo(-6, -15);
        ctx.lineTo(-3, -5);
        ctx.lineTo(-15, 0);
        ctx.lineTo(-3, 5);
        ctx.lineTo(-6, 15);
        ctx.lineTo(6, 15);
        break;
      default:
        ctx.moveTo(18, 0);
        ctx.lineTo(-12, -11);
        ctx.lineTo(-7, 0);
        ctx.lineTo(-12, 11);
        break;
    }

    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = flash ? '#FFFFFF' : accentColor;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-2.5, 0);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private renderPlayerBullets(ctx: CanvasRenderingContext2D): void {
    for (const b of this.playerBullets) {
      if (!b.active) continue;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.ellipse(-2, 0, b.pierce > 0 ? 15 : 10, b.radius + 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(-7, -2.2, b.pierce > 0 ? 18 : 14, 4.4, 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderEnemyBullets(ctx: CanvasRenderingContext2D): void {
    for (const b of this.enemyBullets) {
      if (!b.active) continue;
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF1F2';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D): void {
    for (const e of this.enemies) {
      const color = this.getEnemyColor(e);

      if (e.spawnTimer > 0) {
        const progress = 1 - e.spawnTimer / (e.isBoss ? 1.1 : 0.55);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = e.isBoss ? 3 : 1.5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * (2.2 - progress * 1.2), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      if (e.isElite) {
        ctx.save();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.lineWidth = 1.75;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      if ((e.type === 'charger' || e.type === 'shooter' || e.isBoss) && e.state === 'windup') {
        const maxT = e.type === 'shooter' ? 0.65 : 0.75;
        const t = Math.max(0, Math.min(1, 1 - e.stateTimer / maxT));
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.28 + t * 0.6;
        ctx.lineWidth = 1.5 + t * 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + e.aimX * 340, e.y + e.aimY * 340);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 14 * (1 - t), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (e.type === 'pulsar' && e.state === 'windup') {
        const t = 1 - e.stateTimer / 0.85;
        ctx.save();
        ctx.strokeStyle = `rgba(225, 29, 72, ${(0.3 + t * 0.6).toFixed(2)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 18 * (1 - t), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);
      ctx.scale(e.squash, 2 - e.squash);

      const flash = e.hitFlash > 0;

      if (e.type === 'drifter') {
        ctx.fillStyle = flash ? '#FFFFFF' : color;
        ctx.beginPath();
        ctx.moveTo(e.radius, 0);
        ctx.lineTo(-e.radius * 0.65, -e.radius * 0.8);
        ctx.lineTo(-e.radius * 0.3, 0);
        ctx.lineTo(-e.radius * 0.65, e.radius * 0.8);
        ctx.closePath();
        ctx.fill();
      } else if (e.type === 'chaser') {
        ctx.fillStyle = flash ? '#FFFFFF' : color;
        ctx.beginPath();
        ctx.moveTo(e.radius * 1.25, 0);
        ctx.lineTo(-e.radius * 0.8, -e.radius * 0.75);
        ctx.lineTo(-e.radius * 0.4, 0);
        ctx.lineTo(-e.radius * 0.8, e.radius * 0.75);
        ctx.closePath();
        ctx.fill();
      } else if (e.type === 'shooter') {
        ctx.strokeStyle = flash ? '#FFFFFF' : color;
        ctx.fillStyle = flash ? '#FFFFFF' : 'rgba(129, 140, 248, 0.25)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(e.radius * 1.15, 0);
        ctx.lineTo(0, -e.radius * 0.9);
        ctx.lineTo(-e.radius, 0);
        ctx.lineTo(0, e.radius * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#FFFFFF' : '#E0E7FF';
        ctx.beginPath();
        ctx.arc(3, 0, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'tank') {
        ctx.strokeStyle = flash ? '#FFFFFF' : color;
        ctx.fillStyle = flash ? 'rgba(255,255,255,0.85)' : 'rgba(16, 185, 129, 0.22)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const sides = 8;
        for (let s = 0; s < sides; s++) {
          const a = (s * Math.PI * 2) / sides;
          const rx = Math.cos(a) * e.radius;
          const ry = Math.sin(a) * e.radius;
          if (s === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const hpRatio = Math.max(0.2, e.hp / e.maxHp);
        ctx.fillStyle = flash ? '#FFFFFF' : color;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.48 * hpRatio, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'charger') {
        ctx.fillStyle = flash ? '#FFFFFF' : color;
        ctx.beginPath();
        ctx.moveTo(e.radius * 1.2, 0);
        ctx.lineTo(-e.radius * 0.7, -e.radius * 0.7);
        ctx.lineTo(-e.radius * 0.95, 0);
        ctx.lineTo(-e.radius * 0.7, e.radius * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = flash ? '#FFFFFF' : '#FFE4E6';
        ctx.beginPath();
        ctx.arc(2, 0, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'prism') {
        ctx.strokeStyle = flash ? '#FFFFFF' : color;
        ctx.fillStyle = flash ? 'rgba(255,255,255,0.85)' : 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const a = (s * Math.PI * 2) / 6;
          const rx = Math.cos(a) * e.radius;
          const ry = Math.sin(a) * e.radius;
          if (s === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#FFFFFF' : color;
        ctx.beginPath();
        ctx.arc(0, 0, 4 + Math.min(3, e.hp) * 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'pulsar') {
        ctx.strokeStyle = flash ? '#FFFFFF' : color;
        ctx.fillStyle = flash ? 'rgba(255,255,255,0.85)' : 'rgba(225, 29, 72, 0.22)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let s = 0; s < 4; s++) {
          const a = (s * Math.PI) / 2;
          ctx.lineTo(Math.cos(a) * (e.radius + 3), Math.sin(a) * (e.radius + 3));
          const midA = a + Math.PI / 4;
          ctx.lineTo(Math.cos(midA) * (e.radius * 0.55), Math.sin(midA) * (e.radius * 0.55));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.isBoss) {
        ctx.strokeStyle = flash ? '#FFFFFF' : color;
        ctx.fillStyle = flash ? 'rgba(255,255,255,0.85)' : 'rgba(244, 63, 94, 0.2)';
        ctx.lineWidth = 3.2;
        const points = e.type === 'boss_hydra' ? 10 : 8;
        ctx.beginPath();
        for (let s = 0; s < points; s++) {
          const a = (s * Math.PI * 2) / points;
          const r = s % 2 === 0 ? e.radius : e.radius * 0.72;
          const rx = Math.cos(a) * r;
          const ry = Math.sin(a) * r;
          if (s === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#FFFFFF' : color;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.shardling;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, -7);
        ctx.lineTo(-6, 7);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderShards(ctx: CanvasRenderingContext2D): void {
    for (const s of this.shards) {
      if (!s.active) continue;
      const blink = s.life < 2.0 && Math.floor(s.life * 10) % 2 === 0;
      if (blink) continue;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(this.elapsedTime * 3.5);
      const color = s.isRepair ? COLORS.repair : COLORS.shard;
      ctx.fillStyle = color;

      const size = s.isRepair ? 7.5 : 5.2;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.75, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.75, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderShockwaves(ctx: CanvasRenderingContext2D): void {
    for (const sw of this.shockwaves) {
      if (!sw.active) continue;
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth * alpha;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      if (!ft.active) continue;
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }
}
