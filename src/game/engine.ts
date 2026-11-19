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
  sniper: '#F43F5E',
  bomber: '#F97316',
  vortex: '#A855F7',
  juggernaut: '#14B8A6',
  bossAegis: '#F43F5E',
  bossHydra: '#F59E0B',
  bossValkyria: '#EC4899',
  bossChronovore: '#6366F1',
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

type ConstructKind =
  | 'solar_ring'
  | 'phantom_turret'
  | 'valkyrie_drill'
  | 'titan_dome'
  | 'lightning_pylon'
  | 'gravity_well'
  | 'nebula_mine'
  | 'fire_wall'
  | 'laser_gate'
  | 'time_dome'
  | 'colossal_orb'
  | 'judgment_beam'
  | 'traveling_blackhole'
  | 'ricochet_blade'
  | 'colossal_slash'
  | 'enemy_telegraph_beam';

interface FieldConstruct {
  kind: ConstructKind;
  x: number;
  y: number;
  x2: number;
  y2: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  life: number;
  maxLife: number;
  tickTimer: number;
  damage: number;
  color: string;
  secondaryColor: string;
  hitIds: Set<number>;
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
  private rightMouseDown = false;
  private mouseX = 640;
  private mouseY = 360;
  private hasPointerAim = false;
  private dashBufferTimer = 0;
  private pendingChargeRatio = 0;

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
    dashStartX: 640,
    dashStartY: 360,
    dashTickTimer: 0,
    holdChargeTimer: 0,
    isChargingDash: false,
    ricochetVx: 0,
    ricochetVy: 0,
    ricochetLastBounceX: 640,
    ricochetLastBounceY: 360,
    ricochetBossCooldown: 0,
    invulnTimer: 0,
    hitFlash: 0,
    squashX: 1,
    squashY: 1,
    hp: 300,
    maxHp: 300,
    hpRegenRate: 4,
    outOfCombatTimer: 0,
    shields: 300,
    maxShields: 300,
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
    overdriveMaxDuration: 10.0,
    overdrivePulseTimer: 0,
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
  private fieldConstructs: FieldConstruct[] = [];
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
    this.dashBufferTimer = 0.18;
    this.pendingChargeRatio = 0;
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
    for (let i = 0; i < 240; i++) {
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
        shape: 'bolt',
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
        maxLife: 4.5,
        radius: 5,
        color: COLORS.bulletEnemy,
        damage: 24,
        shape: 'lance',
        destructible: false,
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
    for (let i = 0; i < 460; i++) {
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
    for (let i = 0; i < 56; i++) {
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
    for (let i = 0; i < 64; i++) {
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
    this.rightMouseDown = false;
    this.player.isChargingDash = false;
    this.player.holdChargeTimer = 0;
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.heldKeys.clear();
      this.mouseDown = false;
      this.rightMouseDown = false;
      this.player.isChargingDash = false;
      this.player.holdChargeTimer = 0;
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
        this.rightMouseDown = true;
        if (this.player.dashCooldown <= 0 && this.player.dashTimer <= 0) {
          this.player.isChargingDash = true;
          this.player.holdChargeTimer = 0;
        } else {
          this.dashBufferTimer = 0.16;
          this.pendingChargeRatio = 0;
        }
      }
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.mouseDown = false;
    } else if (e.button === 2) {
      this.rightMouseDown = false;
      if (this.player.isChargingDash) {
        const ratio = Math.min(1, this.player.holdChargeTimer / 1.05);
        this.player.isChargingDash = false;
        this.player.holdChargeTimer = 0;
        this.pendingChargeRatio = ratio >= 0.2 ? ratio : 0;
        this.dashBufferTimer = 0.2;
      }
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
        if (this.player.dashCooldown <= 0 && this.player.dashTimer <= 0) {
          this.player.isChargingDash = true;
          this.player.holdChargeTimer = 0;
        } else {
          this.dashBufferTimer = 0.16;
          this.pendingChargeRatio = 0;
        }
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
    const kb = this.profile.keybinds;
    this.heldKeys.delete(e.code);
    if (e.code === kb.dash && this.player.isChargingDash) {
      const ratio = Math.min(1, this.player.holdChargeTimer / 1.05);
      this.player.isChargingDash = false;
      this.player.holdChargeTimer = 0;
      this.pendingChargeRatio = ratio >= 0.2 ? ratio : 0;
      this.dashBufferTimer = 0.2;
    }
  };

  public startNewRun(): void {
    this.sound.unlock();
    this.heldKeys.clear();
    this.mouseDown = false;
    this.rightMouseDown = false;
    this.dashBufferTimer = 0;
    this.pendingChargeRatio = 0;

    this.mode = this.profile.selectedMode;
    this.shipId = this.profile.selectedShip;
    const ship = SHIPS[this.shipId] ?? SHIPS.vanguard;
    const h = this.profile.hangarLevels;

    const maxHp =
      this.mode === 'hardcore' ? 100 : ship.baseHp + (h.hull ?? 0) * 45;
    const hpRegen =
      this.mode === 'hardcore' ? 0 : 4 + (h.hull ?? 0) * 2;

    this.player.x = this.width / 2;
    this.player.y = this.height / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.angle = -Math.PI / 2;
    this.player.radius = Math.round(14 * Math.min(1.35, ship.hullScale || 1));
    this.player.fireCooldown = 0;
    this.player.dashTimer = 0;
    this.player.dashCooldown = 0;
    this.player.dashMaxCooldown = Math.max(0.45, 1.25 / (1 + (h.thruster ?? 0) * 0.05));
    this.player.dashTickTimer = 0;
    this.player.holdChargeTimer = 0;
    this.player.isChargingDash = false;
    this.player.ricochetVx = 0;
    this.player.ricochetVy = 0;
    this.player.ricochetBossCooldown = 0;
    this.player.invulnTimer = 1.0;
    this.player.hitFlash = 0;
    this.player.squashX = 1;
    this.player.squashY = 1;
    this.player.hp = maxHp;
    this.player.maxHp = maxHp;
    this.player.hpRegenRate = hpRegen;
    this.player.outOfCombatTimer = 4.0;
    this.player.shields = maxHp;
    this.player.maxShields = maxHp;
    this.player.weapon = ship.defaultWeapon;
    this.player.weaponLevel = 1;
    this.player.damageMult = ship.damageMult * (1 + (h.firepower ?? 0) * 0.1);
    this.player.fireRateMult = ship.fireRateMult * (1 + (h.firepower ?? 0) * 0.04);
    this.player.speedMult = ship.speedMult * (1 + (h.thruster ?? 0) * 0.05);
    this.player.extraBarrels = 0;
    this.player.bonusPierce = 0;
    this.player.shockDash = false;
    this.player.magnetRadius = 175 * (1 + (h.magnet ?? 0) * 0.2);
    // Overdrive always starts at 0% and charges ONLY by dealing damage to enemies
    this.player.overdriveCharge = 0;
    this.player.overdriveTimer = 0;
    this.player.overdriveMaxDuration = 10.0;
    this.player.overdrivePulseTimer = 0;
    this.player.overdriveGainMult = 1 + (h.overdrive ?? 0) * 0.1;

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
    this.fieldConstructs = [];
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
    this.rightMouseDown = false;
    this.player.isChargingDash = false;
    this.player.holdChargeTimer = 0;
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
    this.rightMouseDown = false;
    this.player.isChargingDash = false;
    this.player.holdChargeTimer = 0;
    this.enemies = [];
    this.lightningArcs = [];
    this.fieldConstructs = [];
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

    const ship = SHIPS[this.shipId] ?? SHIPS.vanguard;
    const p = this.player;
    p.overdriveCharge = 0;
    p.overdriveMaxDuration = 10.0;
    p.overdriveTimer = 10.0;
    p.overdrivePulseTimer = 0.05;
    p.invulnTimer = Math.max(p.invulnTimer, 2.8);

    this.sound.playOverdrive();
    this.addShake(14);
    this.spawnShockwave(p.x, p.y, 320, ship.accentColor, 4.8);
    this.spawnShockwave(p.x, p.y, 210, ship.dashSecondaryColor, 3.2);
    this.spawnFloatingText(
      p.x,
      p.y - 38,
      `TUYỆT KỸ NỘ 10S: ${ship.overdriveEffectName.toUpperCase()}!`,
      '#FDE68A'
    );

    for (const eb of this.enemyBullets) {
      if (eb.active) {
        this.spawnBurst(eb.x, eb.y, 4, ship.accentColor, 95);
        eb.active = false;
      }
    }

    // Immediate opening signature phenomenon for Mythic / Special Ships
    if (this.shipId === 'hyperion') {
      // Launch Hyperion into high-speed Pinball Wall-Ricochet Storm!
      let launchAngle = p.angle;
      if (Math.abs(Math.cos(launchAngle)) < 0.25) launchAngle += 0.42;
      if (Math.abs(Math.sin(launchAngle)) < 0.25) launchAngle -= 0.42;
      p.ricochetVx = Math.cos(launchAngle) * 1680;
      p.ricochetVy = Math.sin(launchAngle) * 1680;
      p.ricochetLastBounceX = p.x;
      p.ricochetLastBounceY = p.y;
      p.invulnTimer = 10.0; // Immortal during 10s wall-ricochet storm
    } else if (this.shipId === 'celestia') {
      this.fieldConstructs.push({
        kind: 'judgment_beam',
        x: p.x,
        y: p.y,
        x2: p.x + Math.cos(p.angle) * 1500,
        y2: p.y + Math.sin(p.angle) * 1500,
        vx: 0,
        vy: 0,
        angle: p.angle,
        radius: 96,
        life: 10.0,
        maxLife: 10.0,
        tickTimer: 0,
        damage: 2.2 * p.damageMult,
        color: ship.accentColor,
        secondaryColor: ship.dashColor,
        hitIds: new Set<number>(),
      });
    } else if (this.shipId === 'omega') {
      this.fieldConstructs.push({
        kind: 'colossal_orb',
        x: p.x + Math.cos(p.angle) * 32,
        y: p.y + Math.sin(p.angle) * 32,
        x2: 0,
        y2: 0,
        vx: Math.cos(p.angle) * 280,
        vy: Math.sin(p.angle) * 280,
        angle: p.angle,
        radius: 175,
        life: 5.5,
        maxLife: 5.5,
        tickTimer: 0,
        damage: 3.2 * p.damageMult,
        color: ship.dashColor,
        secondaryColor: ship.dashSecondaryColor,
        hitIds: new Set<number>(),
      });
    } else if (this.shipId === 'leviathan') {
      this.fieldConstructs.push({
        kind: 'traveling_blackhole',
        x: p.x + Math.cos(p.angle) * 38,
        y: p.y + Math.sin(p.angle) * 38,
        x2: 0,
        y2: 0,
        vx: Math.cos(p.angle) * 165,
        vy: Math.sin(p.angle) * 165,
        angle: p.angle,
        radius: 185,
        life: 6.5,
        maxLife: 6.5,
        tickTimer: 0,
        damage: 2.8 * p.damageMult,
        color: ship.dashColor,
        secondaryColor: ship.dashSecondaryColor,
        hitIds: new Set<number>(),
      });
    } else if (this.shipId === 'apocalypse') {
      for (let s = -1; s <= 1; s++) {
        const a = p.angle + s * 0.28;
        this.fieldConstructs.push({
          kind: 'colossal_slash',
          x: p.x + Math.cos(a) * 28,
          y: p.y + Math.sin(a) * 28,
          x2: 0,
          y2: 0,
          vx: Math.cos(a) * 620,
          vy: Math.sin(a) * 620,
          angle: a,
          radius: 250,
          life: 2.6,
          maxLife: 2.6,
          tickTimer: 0,
          damage: 3.8 * p.damageMult,
          color: ship.accentColor,
          secondaryColor: ship.dashSecondaryColor,
          hitIds: new Set<number>(),
        });
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
          p.hp = Math.min(p.maxHp, p.hp + 140);
          p.shields = p.hp;
        }
        this.spawnShockwave(p.x, p.y, 140, COLORS.playerShield, 3);
        break;
      case 'max_shield_up':
        if (this.mode !== 'hardcore') {
          p.maxHp += 80;
          p.hp = Math.min(p.maxHp, p.hp + 80);
          p.hpRegenRate += 3;
          p.maxShields = p.maxHp;
          p.shields = p.hp;
        } else {
          p.damageMult *= 1.25;
        }
        break;
      case 'phase_turbine':
        p.dashMaxCooldown = Math.max(0.38, p.dashMaxCooldown * 0.75);
        p.speedMult *= 1.15;
        break;
      case 'shock_dash':
        p.shockDash = true;
        break;
      case 'overdrive_surge':
        p.overdriveCharge = Math.min(100, p.overdriveCharge + 35);
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
    this.spawnCooldown = 0.5;

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
      const bossIndex = (this.mode === 'boss_rush' ? waveNum : Math.floor(waveNum / 3)) - 1;
      const bossRotation: EnemyType[] = [
        'boss_aegis',
        'boss_hydra',
        'boss_valkyria',
        'boss_chronovore',
      ];
      const bossType = bossRotation[((bossIndex % 4) + 4) % 4];
      const bossTitle =
        bossType === 'boss_aegis'
          ? 'PHÁO ĐÀI AEGIS'
          : bossType === 'boss_hydra'
          ? 'XÀ VƯƠNG MẶT TRỜI'
          : bossType === 'boss_valkyria'
          ? 'NỮ HOÀNG KIẾM KHÍ VALKYRIA'
          : 'CHÚA TỂ HƯ KHÔNG CHRONOVORE';
      this.waveBanner = `CẢNH BÁO BOSS · ${bossTitle}`;
      this.waveBannerTimer = 2.5;
      this.sound.playBossWarning();

      const queue: { type: EnemyType; isElite: boolean }[] = [{ type: bossType, isElite: false }];
      const escortCount = Math.min(2 + Math.floor(waveNum * 0.35), 4);
      const escortPool: EnemyType[] = ['chaser', 'sniper', 'drifter', 'vortex'];
      for (let i = 0; i < escortCount; i++) {
        const t = escortPool[i % escortPool.length];
        queue.push({ type: t, isElite: i === 0 && waveNum >= 4 });
      }
      this.waveSpawnQueue = queue;
      this.waveTotalEnemies = queue.length;
      return;
    }

    this.waveBanner = `ĐỢT ${String(waveNum).padStart(2, '0')} · ${this.currentSector.name}`;
    this.waveBannerTimer = 2.1;

    // Streamlined enemy counts per wave so combat is crisp and never visually cluttered
    const queue: { type: EnemyType; isElite: boolean }[] = [];
    const drifterCount = 2 + Math.min(waveNum, 6);
    const chaserCount = 2 + Math.min(Math.floor(waveNum * 0.8), 5);
    const shooterCount = waveNum >= 1 ? Math.min(1 + Math.floor(waveNum * 0.5), 3) : 0;
    const sniperCount = waveNum >= 2 ? Math.min(Math.floor(waveNum * 0.5), 3) : 0;
    const tankCount = waveNum >= 2 ? Math.min(Math.floor(waveNum * 0.45), 2) : 1;
    const chargerCount = waveNum >= 2 ? Math.min(Math.floor(waveNum * 0.5), 3) : 0;
    const bomberCount = waveNum >= 3 ? Math.min(Math.floor((waveNum - 1) * 0.45), 2) : 0;
    const prismCount = waveNum >= 3 ? Math.min(Math.floor((waveNum - 1) * 0.45), 2) : 0;
    const vortexCount = waveNum >= 4 ? Math.min(Math.floor((waveNum - 2) * 0.45), 2) : 0;
    const pulsarCount = waveNum >= 4 ? Math.min(Math.floor((waveNum - 2) * 0.4), 2) : 0;
    const juggernautCount = waveNum >= 5 ? Math.min(Math.floor((waveNum - 3) * 0.4), 2) : 0;

    const addEntries = (type: EnemyType, count: number) => {
      for (let i = 0; i < count; i++) {
        const eliteChance = waveNum >= 2 ? Math.min(0.08 + waveNum * 0.022, 0.25) : 0;
        queue.push({ type, isElite: Math.random() < eliteChance });
      }
    };

    addEntries('drifter', drifterCount);
    addEntries('chaser', chaserCount);
    addEntries('shooter', shooterCount);
    addEntries('sniper', sniperCount);
    addEntries('tank', tankCount);
    addEntries('charger', chargerCount);
    addEntries('bomber', bomberCount);
    addEntries('prism', prismCount);
    addEntries('vortex', vortexCount);
    addEntries('pulsar', pulsarCount);
    addEntries('juggernaut', juggernautCount);

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

    (Object.keys(this.activeBoostTimers) as BoostType[]).forEach((bType) => {
      if (this.activeBoostTimers[bType] > 0) {
        this.activeBoostTimers[bType] = Math.max(0, this.activeBoostTimers[bType] - dt);
      }
    });

    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      this.lightningArcs[i].life -= dt;
      if (this.lightningArcs[i].life <= 0) {
        this.lightningArcs.splice(i, 1);
      }
    }

    const warpMult =
      this.warpTransitionTimer > 0
        ? 1 + (this.warpTransitionTimer / this.warpMaxDuration) * 6
        : 1;
    this.updateStars(
      dt,
      (-this.player.vx * 0.06 + 14) * warpMult,
      (-this.player.vy * 0.06 - 6) * warpMult
    );
    this.updatePlayer(dt);
    this.updateFieldConstructs(dt);
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

  private executeShipDashEffect(chargeRatio = 0): void {
    const p = this.player;
    const ship = SHIPS[this.shipId] ?? SHIPS.vanguard;
    const isCharged = chargeRatio >= 0.35;
    const chargeBoost = 1 + chargeRatio * 1.5;
    const powerScale = (p.shockDash ? 1.55 : 1.0) * chargeBoost;
    const dmg = p.damageMult * powerScale;
    const dashAngle = Math.atan2(p.dashDirY, p.dashDirX);

    this.spawnShockwave(p.x, p.y, 75 * powerScale, ship.dashColor, isCharged ? 4.2 : 2.8);
    this.spawnShockwave(p.x, p.y, 45 * powerScale, ship.dashSecondaryColor, 2.0);
    this.spawnBurst(p.x, p.y, isCharged ? 24 : 14, ship.dashColor, 240);

    if (isCharged) {
      this.addShake(8);
      this.spawnFloatingText(
        p.x,
        p.y - 34,
        `BÙNG PHÁ TỤ LỰC ${Math.round(chargeRatio * 100)}%!`,
        '#FDE047'
      );
    }

    switch (ship.dashStyle) {
      case 'solar_flare': {
        // 1. Vanguard: Rotating Solar Shield Ring attached to player
        this.fieldConstructs.push({
          kind: 'solar_ring',
          x: p.x,
          y: p.y,
          x2: 0,
          y2: 0,
          vx: 0,
          vy: 0,
          angle: 0,
          radius: 76 * powerScale,
          life: 3.2 * (isCharged ? 1.5 : 1),
          maxLife: 3.2 * (isCharged ? 1.5 : 1),
          tickTimer: 0,
          damage: 1.45 * dmg,
          color: ship.dashColor,
          secondaryColor: ship.dashSecondaryColor,
          hitIds: new Set<number>(),
        });
        break;
      }

      case 'void_lightning': {
        // 2. Phantom: Hologram Turret Clone at origin (or 3 clones when charged!)
        const count = isCharged ? 3 : 1;
        for (let c = 0; c < count; c++) {
          const offsetA = (c * Math.PI * 2) / count;
          const dist = c === 0 ? 0 : 48;
          this.fieldConstructs.push({
            kind: 'phantom_turret',
            x: p.dashStartX + Math.cos(offsetA) * dist,
            y: p.dashStartY + Math.sin(offsetA) * dist,
            x2: 0,
            y2: 0,
            vx: 0,
            vy: 0,
            angle: p.angle,
            radius: 26,
            life: 4.2 * (isCharged ? 1.35 : 1),
            maxLife: 4.2 * (isCharged ? 1.35 : 1),
            tickTimer: 0.08 * c,
            damage: 1.15 * dmg,
            color: ship.dashColor,
            secondaryColor: ship.dashSecondaryColor,
            hitIds: new Set<number>(),
          });
        }
        break;
      }

      case 'crimson_lance': {
        // 3. Valkyrie: Crimson Drill Lance attached to player that pierces & steals HP
        this.fieldConstructs.push({
          kind: 'valkyrie_drill',
          x: p.x,
          y: p.y,
          x2: 0,
          y2: 0,
          vx: 0,
          vy: 0,
          angle: dashAngle,
          radius: 56 * powerScale,
          life: 0.55 * (isCharged ? 1.4 : 1),
          maxLife: 0.55 * (isCharged ? 1.4 : 1),
          tickTimer: 0,
          damage: 2.35 * dmg,
          color: ship.dashColor,
          secondaryColor: ship.dashSecondaryColor,
          hitIds: new Set<number>(),
        });
        if (isCharged) {
          this.fieldConstructs.push({
            kind: 'colossal_slash',
            x: p.x,
            y: p.y,
            x2: 0,
            y2: 0,
            vx: Math.cos(dashAngle) * 620,
            vy: Math.sin(dashAngle) * 620,
            angle: dashAngle,
            radius: 145,
            life: 1.8,
            maxLife: 1.8,
            tickTimer: 0,
            damage: 2.5 * dmg,
            color: ship.dashColor,
            secondaryColor: ship.dashSecondaryColor,
            hitIds: new Set<number>(),
          });
        }
        break;
      }

      case 'bastion_wave': {
        // 4. Titan: Hexagonal Gravity Fortress Dome + Earthquake slam
        const blastR = 195 * powerScale;
        this.spawnShockwave(p.x, p.y, blastR, ship.dashColor, 4.5);
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (e.spawnTimer > 0) continue;
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          if (d <= blastR + e.radius) {
            const push = e.isBoss ? 140 : 540;
            this.damageEnemy(i, 2.4 * dmg, (dx / d) * push, (dy / d) * push);
          }
        }
        this.fieldConstructs.push({
          kind: 'titan_dome',
          x: p.x,
          y: p.y,
          x2: 0,
          y2: 0,
          vx: 0,
          vy: 0,
          angle: 0,
          radius: 118 * powerScale,
          life: 3.8 * (isCharged ? 1.5 : 1),
          maxLife: 3.8 * (isCharged ? 1.5 : 1),
          tickTimer: 0,
          damage: 1.3 * dmg,
          color: ship.dashColor,
          secondaryColor: ship.dashSecondaryColor,
          hitIds: new Set<number>(),
        });
        break;
      }

      case 'ion_tempest': {
        // 5. Tempest: Lightning Pylon tethered to player with high-voltage electric cable
        const pylonCount = isCharged ? 2 : 1;
        for (let k = 0; k < pylonCount; k++) {
          const offset = k === 0 ? 0 : 75;
          this.fieldConstructs.push({
            kind: 'lightning_pylon',
            x: p.dashStartX + Math.cos(dashAngle + Math.PI / 2) * offset,
            y: p.dashStartY + Math.sin(dashAngle + Math.PI / 2) * offset,
            x2: p.x,
            y2: p.y,
            vx: 0,
            vy: 0,
            angle: 0,
            radius: 26,
            life: 4.2 * (isCharged ? 1.35 : 1),
            maxLife: 4.2 * (isCharged ? 1.35 : 1),
            tickTimer: 0,
            damage: 1.75 * dmg,
            color: ship.dashColor,
            secondaryColor: ship.dashSecondaryColor,
            hitIds: new Set<number>(),
          });
        }
        break;
      }

      case 'shadow_rift': {
        // 6. Eclipse: Stationary Black Hole Gravity Well that pulls enemies & swallows bullets
        this.fieldConstructs.push({
          kind: 'gravity_well',
          x: p.dashStartX,
          y: p.dashStartY,
          x2: 0,
          y2: 0,
          vx: 0,
          vy: 0,
          angle: 0,
          radius: 155 * powerScale,
          life: 3.6 * (isCharged ? 1.4 : 1),
          maxLife: 3.6 * (isCharged ? 1.4 : 1),
          tickTimer: 0,
          damage: 1.6 * dmg,
          color: ship.dashColor,
          secondaryColor: ship.dashSecondaryColor,
          hitIds: new Set<number>(),
        });
        break;
      }

      case 'supernova_burst': {
        // 7. Nova: Drops Magnetic Proximity Nebula Mines along the dash path
        const mineCount = isCharged ? 8 : 4;
        for (let m = 0; m < mineCount; m++) {
          const t = m / Math.max(1, mineCount - 1);
          const mx = p.dashStartX + p.dashDirX * 165 * t + (Math.random() - 0.5) * 28;
          const my = p.dashStartY + p.dashDirY * 165 * t + (Math.random() - 0.5) * 28;
          this.fieldConstructs.push({
            kind: 'nebula_mine',
            x: mx,
            y: my,
            x2: 0,
            y2: 0,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            angle: 0,
            radius: 22 * (isCharged ? 1.35 : 1),
            life: 5.5,
            maxLife: 5.5,
            tickTimer: 0,
            damage: 2.6 * dmg,
            color: ship.dashColor,
            secondaryColor: ship.dashSecondaryColor,
            hitIds: new Set<number>(),
          });
        }
        break;
      }

      case 'golden_phoenix': {
        // 8. Solaris: Blazing Thermonuclear Fire Wall Carpet along dash path
        this.fieldConstructs.push({
          kind: 'fire_wall',
          x: p.dashStartX,
          y: p.dashStartY,
          x2: p.dashStartX + p.dashDirX * 210,
          y2: p.dashStartY + p.dashDirY * 210,
          vx: 0,
          vy: 0,
          angle: dashAngle,
          radius: 40 * powerScale,
          life: 4.2 * (isCharged ? 1.4 : 1),
          maxLife: 4.2 * (isCharged ? 1.4 : 1),
          tickTimer: 0,
          damage: 1.75 * dmg,
          color: ship.dashColor,
          secondaryColor: ship.dashSecondaryColor,
          hitIds: new Set<number>(),
        });
        break;
      }

      case 'prism_mirror': {
        // 9. Aether: Dual Prism Crystals connected by a persistent Emerald Laser Cutter Gate
        this.fieldConstructs.push({
          kind: 'laser_gate',
          x: p.dashStartX,
          y: p.dashStartY,
          x2: p.dashStartX + p.dashDirX * 225,
          y2: p.dashStartY + p.dashDirY * 225,
          vx: 0,
          vy: 0,
          angle: dashAngle,
          radius: 26 * powerScale,
          life: 4.5 * (isCharged ? 1.4 : 1),
          maxLife: 4.5 * (isCharged ? 1.4 : 1),
          tickTimer: 0,
          damage: 2.1 * dmg,
          color: ship.dashColor,
          secondaryColor: ship.dashSecondaryColor,
          hitIds: new Set<number>(),
        });
        if (isCharged) {
          this.fieldConstructs.push({
            kind: 'judgment_beam',
            x: p.x,
            y: p.y,
            x2: p.x + Math.cos(p.angle) * 1400,
            y2: p.y + Math.sin(p.angle) * 1400,
            vx: 0,
            vy: 0,
            angle: p.angle,
            radius: 48,
            life: 0.75,
            maxLife: 0.75,
            tickTimer: 0,
            damage: 2.8 * dmg,
            color: ship.dashColor,
            secondaryColor: ship.dashSecondaryColor,
            hitIds: new Set<number>(),
          });
        }
        break;
      }

      case 'chrono_warp': {
        // 10. Chronos: Time-Stasis Bubble Dome freezing enemies & bullets inside by 85%
        this.fieldConstructs.push({
          kind: 'time_dome',
          x: p.dashStartX + p.dashDirX * 70,
          y: p.dashStartY + p.dashDirY * 70,
          x2: 0,
          y2: 0,
          vx: 0,
          vy: 0,
          angle: 0,
          radius: 195 * powerScale,
          life: 4.0 * (isCharged ? 1.4 : 1),
          maxLife: 4.0 * (isCharged ? 1.4 : 1),
          tickTimer: 0,
          damage: 1.35 * dmg,
          color: ship.dashColor,
          secondaryColor: ship.dashSecondaryColor,
          hitIds: new Set<number>(),
        });
        break;
      }

      case 'omega_burst': {
        // 11. Omega-X: Launches a Colossal Antimatter Sphere (up to 220px when charged!)
        const aimA = this.hasPointerAim ? p.angle : dashAngle;
        this.fieldConstructs.push({
          kind: 'colossal_orb',
          x: p.x + Math.cos(aimA) * 26,
          y: p.y + Math.sin(aimA) * 26,
          x2: 0,
          y2: 0,
          vx: Math.cos(aimA) * 320,
          vy: Math.sin(aimA) * 320,
          angle: aimA,
          radius: 85 * powerScale,
          life: 4.5,
          maxLife: 4.5,
          tickTimer: 0,
          damage: 3.1 * dmg,
          color: ship.dashColor,
          secondaryColor: ship.dashSecondaryColor,
          hitIds: new Set<number>(),
        });
        break;
      }

      case 'starlight_step': {
        // 12. Celestia: Instantaneous Judgment Mega-Laser Column + Heal
        const aimA = this.hasPointerAim ? p.angle : dashAngle;
        const healAmt = isCharged ? 35 : 18;
        if (this.mode !== 'hardcore' && p.hp < p.maxHp) {
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
          p.shields = p.hp;
          this.spawnFloatingText(p.x, p.y - 26, `+${healAmt} HP ÁNH SÁNG`, '#34D399');
        }
        this.fieldConstructs.push({
          kind: 'judgment_beam',
          x: p.x,
          y: p.y,
          x2: p.x + Math.cos(aimA) * 1450,
          y2: p.y + Math.sin(aimA) * 1450,
          vx: 0,
          vy: 0,
          angle: aimA,
          radius: 52 * powerScale,
          life: isCharged ? 1.25 : 0.65,
          maxLife: isCharged ? 1.25 : 0.65,
          tickTimer: 0,
          damage: 3.4 * dmg,
          color: ship.accentColor,
          secondaryColor: ship.dashColor,
          hitIds: new Set<number>(),
        });
        break;
      }

      case 'abyss_tide': {
        // 13. Leviathan: Traveling Black Hole Singularity Orb that vacuums enemies along its path
        const aimA = this.hasPointerAim ? p.angle : dashAngle;
        this.fieldConstructs.push({
          kind: 'traveling_blackhole',
          x: p.x + Math.cos(aimA) * 28,
          y: p.y + Math.sin(aimA) * 28,
          x2: 0,
          y2: 0,
          vx: Math.cos(aimA) * 185,
          vy: Math.sin(aimA) * 185,
          angle: aimA,
          radius: 105 * powerScale,
          life: 4.6,
          maxLife: 4.6,
          tickTimer: 0,
          damage: 2.75 * dmg,
          color: ship.dashColor,
          secondaryColor: ship.dashSecondaryColor,
          hitIds: new Set<number>(),
        });
        break;
      }

      case 'ricochet_blade': {
        // 14. Hyperion: Launches High-Speed Wall-Bouncing Light Shurikens (2 normal, 6 when Hold-Q charged!)
        const aimA = this.hasPointerAim ? p.angle : dashAngle;
        const bladeCount = isCharged ? 6 : 2;
        for (let b = 0; b < bladeCount; b++) {
          const spread = (b - (bladeCount - 1) * 0.5) * 0.36;
          const a = aimA + spread;
          this.fieldConstructs.push({
            kind: 'ricochet_blade',
            x: p.x + Math.cos(a) * 24,
            y: p.y + Math.sin(a) * 24,
            x2: p.x,
            y2: p.y,
            vx: Math.cos(a) * 860,
            vy: Math.sin(a) * 860,
            angle: a,
            radius: 34 * (isCharged ? 1.35 : 1),
            life: 4.8,
            maxLife: 4.8,
            tickTimer: 0,
            damage: 2.6 * dmg,
            color: ship.accentColor,
            secondaryColor: ship.dashSecondaryColor,
            hitIds: new Set<number>(),
          });
        }
        break;
      }

      case 'dimension_slash': {
        // 15. Apocalypse: Giant 3D Excalibur Dimension Crescent Wave (3 waves + Golden Beam when Charged!)
        const aimA = this.hasPointerAim ? p.angle : dashAngle;
        const slashCount = isCharged ? 3 : 1;
        for (let s = 0; s < slashCount; s++) {
          const offset = (s - (slashCount - 1) * 0.5) * 0.28;
          const a = aimA + offset;
          this.fieldConstructs.push({
            kind: 'colossal_slash',
            x: p.x + Math.cos(a) * 30,
            y: p.y + Math.sin(a) * 30,
            x2: 0,
            y2: 0,
            vx: Math.cos(a) * 580,
            vy: Math.sin(a) * 580,
            angle: a,
            radius: 155 * powerScale,
            life: 2.4,
            maxLife: 2.4,
            tickTimer: 0,
            damage: 3.8 * dmg,
            color: ship.accentColor,
            secondaryColor: ship.dashSecondaryColor,
            hitIds: new Set<number>(),
          });
        }
        break;
      }
    }
  }

  private distToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  private updateFieldConstructs(dt: number): void {
    const p = this.player;
    const minX = this.arenaPad + 16;
    const maxX = this.width - this.arenaPad - 16;
    const minY = this.arenaPad + 16;
    const maxY = this.height - this.arenaPad - 16;

    for (let i = this.fieldConstructs.length - 1; i >= 0; i--) {
      const c = this.fieldConstructs[i];
      c.life -= dt;
      if (c.life <= 0) {
        if (c.kind === 'colossal_orb' || c.kind === 'traveling_blackhole') {
          this.spawnShockwave(c.x, c.y, c.radius * 1.6, c.color, 4);
          this.spawnBurst(c.x, c.y, 24, c.secondaryColor, 260);
        }
        this.fieldConstructs.splice(i, 1);
        continue;
      }

      c.tickTimer -= dt;

      switch (c.kind) {
        case 'solar_ring': {
          c.x = p.x;
          c.y = p.y;
          c.angle += dt * 5.2;
          for (const eb of this.enemyBullets) {
            if (eb.active && Math.hypot(eb.x - c.x, eb.y - c.y) <= c.radius + 10) {
              eb.active = false;
              this.spawnBurst(eb.x, eb.y, 3, c.secondaryColor, 90);
            }
          }
          if (c.tickTimer <= 0) {
            c.tickTimer = 0.16;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer <= 0 && Math.hypot(e.x - c.x, e.y - c.y) <= c.radius + e.radius) {
                this.damageEnemy(j, c.damage * 0.45, 0, 0);
              }
            }
          }
          break;
        }

        case 'phantom_turret': {
          if (c.tickTimer <= 0 && this.enemies.length > 0) {
            c.tickTimer = 0.28;
            let nearest: Enemy | null = null;
            let bestD = 540;
            for (const e of this.enemies) {
              if (e.spawnTimer > 0) continue;
              const d = Math.hypot(e.x - c.x, e.y - c.y);
              if (d < bestD) {
                bestD = d;
                nearest = e;
              }
            }
            if (nearest) {
              c.angle = Math.atan2(nearest.y - c.y, nearest.x - c.x);
              this.spawnPlayerProjectile(
                c.x,
                c.y,
                c.angle,
                920,
                c.damage * 0.65,
                2,
                false,
                c.color,
                4.2
              );
            }
          }
          break;
        }

        case 'valkyrie_drill': {
          c.x = p.x + Math.cos(p.angle) * 20;
          c.y = p.y + Math.sin(p.angle) * 20;
          c.angle = p.angle;
          if (c.tickTimer <= 0) {
            c.tickTimer = 0.09;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer <= 0 && Math.hypot(e.x - c.x, e.y - c.y) <= c.radius + e.radius) {
                this.damageEnemy(j, c.damage * 0.65, Math.cos(c.angle) * 180, Math.sin(c.angle) * 180);
                if (this.mode !== 'hardcore' && p.hp < p.maxHp) {
                  p.hp = Math.min(p.maxHp, p.hp + 8);
                  p.shields = p.hp;
                }
              }
            }
          }
          break;
        }

        case 'titan_dome': {
          c.angle += dt * 1.5;
          for (const eb of this.enemyBullets) {
            if (eb.active && Math.hypot(eb.x - c.x, eb.y - c.y) <= c.radius) {
              eb.active = false;
              this.spawnBurst(eb.x, eb.y, 3, c.color, 70);
            }
          }
          if (c.tickTimer <= 0) {
            c.tickTimer = 0.35;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer <= 0 && Math.hypot(e.x - c.x, e.y - c.y) <= c.radius + e.radius) {
                const dx = e.x - c.x;
                const dy = e.y - c.y;
                const d = Math.max(1, Math.hypot(dx, dy));
                this.damageEnemy(j, c.damage * 0.5, (dx / d) * 180, (dy / d) * 180);
              }
            }
          }
          break;
        }

        case 'lightning_pylon': {
          c.x2 = p.x;
          c.y2 = p.y;
          if (c.tickTimer <= 0) {
            c.tickTimer = 0.14;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer > 0) continue;
              const d = this.distToSegment(e.x, e.y, c.x, c.y, c.x2, c.y2);
              if (d <= e.radius + 20) {
                this.damageEnemy(j, c.damage * 0.55, 0, 0);
                this.lightningArcs.push({
                  x1: c.x,
                  y1: c.y,
                  x2: e.x,
                  y2: e.y,
                  color: c.color,
                  life: 0.15,
                  maxLife: 0.15,
                });
              }
            }
          }
          break;
        }

        case 'gravity_well': {
          c.angle += dt * 4.5;
          for (const eb of this.enemyBullets) {
            if (eb.active && Math.hypot(eb.x - c.x, eb.y - c.y) <= c.radius) {
              eb.active = false;
              this.spawnBurst(eb.x, eb.y, 2, c.color, 60);
            }
          }
          for (const e of this.enemies) {
            if (e.spawnTimer > 0 || e.isBoss) continue;
            const dx = c.x - e.x;
            const dy = c.y - e.y;
            const d = Math.hypot(dx, dy);
            if (d > 10 && d <= c.radius * 1.35) {
              e.vx += (dx / d) * 520 * dt;
              e.vy += (dy / d) * 520 * dt;
            }
          }
          if (c.tickTimer <= 0) {
            c.tickTimer = 0.22;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer <= 0 && Math.hypot(e.x - c.x, e.y - c.y) <= c.radius) {
                this.damageEnemy(j, c.damage * 0.45, 0, 0);
              }
            }
          }
          break;
        }

        case 'nebula_mine': {
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          c.vx *= Math.exp(-3 * dt);
          c.vy *= Math.exp(-3 * dt);
          c.angle += dt * 3;

          let triggered = false;
          for (const e of this.enemies) {
            if (e.spawnTimer > 0) continue;
            const d = Math.hypot(e.x - c.x, e.y - c.y);
            if (d < 150) {
              c.x += ((e.x - c.x) / Math.max(1, d)) * 280 * dt;
              c.y += ((e.y - c.y) / Math.max(1, d)) * 280 * dt;
            }
            if (d <= c.radius + e.radius + 8) {
              triggered = true;
              break;
            }
          }
          if (triggered) {
            const blastR = c.radius * 4.5;
            this.spawnShockwave(c.x, c.y, blastR, c.color, 3.4);
            this.spawnBurst(c.x, c.y, 18, c.color, 210);
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer <= 0 && Math.hypot(e.x - c.x, e.y - c.y) <= blastR + e.radius) {
                this.damageEnemy(j, c.damage, 0, 0);
              }
            }
            this.fieldConstructs.splice(i, 1);
            continue;
          }
          break;
        }

        case 'fire_wall':
        case 'laser_gate': {
          if (c.tickTimer <= 0) {
            c.tickTimer = 0.14;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer > 0) continue;
              const d = this.distToSegment(e.x, e.y, c.x, c.y, c.x2, c.y2);
              if (d <= c.radius + e.radius) {
                this.damageEnemy(j, c.damage * 0.55, 0, 0);
              }
            }
          }
          break;
        }

        case 'time_dome': {
          c.angle += dt * 0.9;
          for (const eb of this.enemyBullets) {
            if (eb.active && Math.hypot(eb.x - c.x, eb.y - c.y) <= c.radius) {
              eb.x -= eb.vx * dt * 0.82;
              eb.y -= eb.vy * dt * 0.82;
            }
          }
          for (const e of this.enemies) {
            if (e.spawnTimer <= 0 && Math.hypot(e.x - c.x, e.y - c.y) <= c.radius) {
              e.x -= e.vx * dt * 0.78;
              e.y -= e.vy * dt * 0.78;
            }
          }
          if (c.tickTimer <= 0) {
            c.tickTimer = 0.28;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer <= 0 && Math.hypot(e.x - c.x, e.y - c.y) <= c.radius) {
                this.damageEnemy(j, c.damage * 0.4, 0, 0);
              }
            }
          }
          break;
        }

        case 'colossal_orb': {
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          c.angle += dt * 4;
          for (const eb of this.enemyBullets) {
            if (eb.active && Math.hypot(eb.x - c.x, eb.y - c.y) <= c.radius + 14) {
              eb.active = false;
              this.spawnBurst(eb.x, eb.y, 4, c.secondaryColor, 110);
            }
          }
          if (c.tickTimer <= 0) {
            c.tickTimer = 0.1;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer <= 0 && Math.hypot(e.x - c.x, e.y - c.y) <= c.radius + e.radius) {
                this.damageEnemy(j, c.damage * 0.65, c.vx * 0.18, c.vy * 0.18);
                this.lightningArcs.push({
                  x1: c.x,
                  y1: c.y,
                  x2: e.x,
                  y2: e.y,
                  color: c.secondaryColor,
                  life: 0.14,
                  maxLife: 0.14,
                });
              }
            }
          }
          break;
        }

        case 'judgment_beam': {
          if (c.maxLife >= 5.0) {
            c.x = p.x;
            c.y = p.y;
            c.angle = p.angle;
          }
          c.x2 = c.x + Math.cos(c.angle) * 1500;
          c.y2 = c.y + Math.sin(c.angle) * 1500;

          for (const eb of this.enemyBullets) {
            if (eb.active && this.distToSegment(eb.x, eb.y, c.x, c.y, c.x2, c.y2) <= c.radius) {
              eb.active = false;
              this.spawnBurst(eb.x, eb.y, 3, c.secondaryColor, 90);
            }
          }
          if (c.tickTimer <= 0) {
            c.tickTimer = 0.09;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer > 0) continue;
              const d = this.distToSegment(e.x, e.y, c.x, c.y, c.x2, c.y2);
              if (d <= c.radius + e.radius) {
                this.damageEnemy(
                  j,
                  c.damage * 0.55,
                  Math.cos(c.angle) * 90,
                  Math.sin(c.angle) * 90
                );
              }
            }
          }
          break;
        }

        case 'traveling_blackhole': {
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          c.angle += dt * 5.5;
          for (const eb of this.enemyBullets) {
            if (eb.active && Math.hypot(eb.x - c.x, eb.y - c.y) <= c.radius * 1.35) {
              eb.active = false;
              this.spawnBurst(eb.x, eb.y, 3, c.secondaryColor, 100);
            }
          }
          for (const e of this.enemies) {
            if (e.spawnTimer > 0) continue;
            const dx = c.x - e.x;
            const dy = c.y - e.y;
            const d = Math.hypot(dx, dy);
            if (d > 8 && d <= c.radius * 2.2) {
              const pullForce = e.isBoss ? 140 : 760;
              e.vx += (dx / d) * pullForce * dt;
              e.vy += (dy / d) * pullForce * dt;
            }
          }
          if (c.tickTimer <= 0) {
            c.tickTimer = 0.11;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer <= 0 && Math.hypot(e.x - c.x, e.y - c.y) <= c.radius + e.radius) {
                this.damageEnemy(j, c.damage * 0.65, 0, 0);
              }
            }
          }
          break;
        }

        case 'ricochet_blade': {
          c.x2 = c.x;
          c.y2 = c.y;
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          c.angle += dt * 18;

          let bounced = false;
          if (c.x <= minX) {
            c.x = minX;
            c.vx = Math.abs(c.vx);
            bounced = true;
          } else if (c.x >= maxX) {
            c.x = maxX;
            c.vx = -Math.abs(c.vx);
            bounced = true;
          }
          if (c.y <= minY) {
            c.y = minY;
            c.vy = Math.abs(c.vy);
            bounced = true;
          } else if (c.y >= maxY) {
            c.y = maxY;
            c.vy = -Math.abs(c.vy);
            bounced = true;
          }
          if (bounced) {
            c.hitIds.clear();
            this.spawnShockwave(c.x, c.y, c.radius * 1.4, c.color, 2.2);
            this.spawnBurst(c.x, c.y, 7, c.secondaryColor, 150);
          }

          for (const eb of this.enemyBullets) {
            if (eb.active && Math.hypot(eb.x - c.x, eb.y - c.y) <= c.radius + 10) {
              eb.active = false;
              this.spawnBurst(eb.x, eb.y, 3, c.color, 90);
            }
          }

          for (let j = this.enemies.length - 1; j >= 0; j--) {
            const e = this.enemies[j];
            if (e.spawnTimer > 0 || c.hitIds.has(e.id)) continue;
            if (Math.hypot(e.x - c.x, e.y - c.y) <= c.radius + e.radius) {
              c.hitIds.add(e.id);
              this.damageEnemy(j, c.damage * 0.85, c.vx * 0.12, c.vy * 0.12);
            }
          }
          break;
        }

        case 'colossal_slash': {
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          for (const eb of this.enemyBullets) {
            if (eb.active && Math.hypot(eb.x - c.x, eb.y - c.y) <= c.radius) {
              eb.active = false;
              this.spawnBurst(eb.x, eb.y, 3, c.secondaryColor, 100);
            }
          }
          if (c.tickTimer <= 0) {
            c.tickTimer = 0.08;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer > 0) continue;
              if (Math.hypot(e.x - c.x, e.y - c.y) <= c.radius + e.radius) {
                this.damageEnemy(j, c.damage * 0.65, c.vx * 0.2, c.vy * 0.2);
              }
            }
          }
          break;
        }

        case 'enemy_telegraph_beam': {
          // Telegraphed enemy/boss laser warning line that fires when timer reaches last 0.22s
          if (c.life <= 0.22 && c.tickTimer <= 0) {
            c.tickTimer = 0.12;
            if (p.invulnTimer <= 0 && p.dashTimer <= 0) {
              const d = this.distToSegment(p.x, p.y, c.x, c.y, c.x2, c.y2);
              if (d <= c.radius + p.radius) {
                this.damagePlayer(c.x, c.y, c.damage);
              }
            }
          }
          break;
        }
      }
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    const kb = this.profile.keybinds;
    const ship = SHIPS[this.shipId] ?? SHIPS.vanguard;

    const hasHyperSpeed = this.activeBoostTimers.hyper_speed > 0;
    const dashRechargeMult =
      (hasHyperSpeed ? 2.0 : 1.0) * (this.shipId === 'chronos' && p.overdriveTimer > 0 ? 3.0 : 1.0);

    p.squashX += (1 - p.squashX) * Math.min(1, dt * 16);
    p.squashY += (1 - p.squashY) * Math.min(1, dt * 16);

    // Out-of-combat Nano HP Regeneration
    p.outOfCombatTimer += dt;
    if (this.mode !== 'hardcore' && p.outOfCombatTimer >= 3.5 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + p.hpRegenRate * dt);
      p.shields = Math.ceil(p.hp);
    }

    // Hold-[Q] Charge-Burst Energy Accumulation
    if (p.isChargingDash) {
      if (p.dashCooldown <= 0 && p.dashTimer <= 0) {
        p.holdChargeTimer = Math.min(1.15, p.holdChargeTimer + dt);
        const ratio = Math.min(1, p.holdChargeTimer / 1.05);
        if (Math.random() < dt * (25 + ratio * 45)) {
          const a = Math.random() * Math.PI * 2;
          const dist = 36 + Math.random() * 28;
          this.spawnParticle(
            p.x + Math.cos(a) * dist,
            p.y + Math.sin(a) * dist,
            -Math.cos(a) * (130 + ratio * 120),
            -Math.sin(a) * (130 + ratio * 120),
            0.25,
            2.4 + ratio * 2.2,
            ratio >= 0.85 ? '#FDE047' : ship.dashColor,
            0.92
          );
        }
      } else {
        p.isChargingDash = false;
        p.holdChargeTimer = 0;
      }
    }

    // Active 10-Second Ship-Specific 3D Overdrive Effects
    if (p.overdriveTimer > 0) {
      p.overdriveTimer = Math.max(0, p.overdriveTimer - dt);
      p.overdrivePulseTimer -= dt;

      if (this.shipId === 'solaris' && this.mode !== 'hardcore' && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + 12 * dt);
        p.shields = Math.ceil(p.hp);
      }

      if (this.shipId === 'chronos') {
        for (const eb of this.enemyBullets) {
          if (eb.active) {
            eb.x -= eb.vx * dt * 0.65;
            eb.y -= eb.vy * dt * 0.65;
          }
        }
        for (const e of this.enemies) {
          if (e.spawnTimer <= 0) {
            e.x -= e.vx * dt * 0.65;
            e.y -= e.vy * dt * 0.65;
          }
        }
      }

      if (p.overdrivePulseTimer <= 0) {
        if (this.shipId === 'vanguard') {
          p.overdrivePulseTimer = 0.22;
          for (let s = 0; s < 3; s++) {
            const orbitA = this.elapsedTime * 5 + (s * Math.PI * 2) / 3;
            const sx = p.x + Math.cos(orbitA) * 42;
            const sy = p.y + Math.sin(orbitA) * 42;
            this.spawnPlayerProjectile(sx, sy, p.angle, 880, 1.35 * p.damageMult, 1, true, ship.accentColor, 4.8);
          }
        } else if (this.shipId === 'phantom') {
          p.overdrivePulseTimer = 0.24;
          for (let s = 0; s < 4; s++) {
            const a = this.elapsedTime * 6 + (s * Math.PI) / 2;
            this.spawnPlayerProjectile(p.x, p.y, a, 940, 1.3 * p.damageMult, 3, false, ship.accentColor, 4.5);
          }
        } else if (this.shipId === 'valkyrie') {
          p.overdrivePulseTimer = 0.26;
          for (let s = -1; s <= 1; s++) {
            this.spawnPlayerProjectile(
              p.x,
              p.y,
              p.angle + s * 0.22,
              860,
              1.65 * p.damageMult,
              4,
              false,
              ship.accentColor,
              6.5
            );
          }
        } else if (this.shipId === 'titan') {
          p.overdrivePulseTimer = 0.65;
          this.spawnShockwave(p.x, p.y, 210, ship.accentColor, 3.8);
          for (const eb of this.enemyBullets) {
            if (eb.active && Math.hypot(eb.x - p.x, eb.y - p.y) <= 190) {
              eb.active = false;
            }
          }
          for (let j = this.enemies.length - 1; j >= 0; j--) {
            const e = this.enemies[j];
            if (e.spawnTimer <= 0 && Math.hypot(e.x - p.x, e.y - p.y) <= 210 + e.radius) {
              this.damageEnemy(j, 2.2 * p.damageMult, 0, 0);
            }
          }
        } else if (this.shipId === 'tempest') {
          p.overdrivePulseTimer = 0.25;
          let hits = 0;
          for (let j = this.enemies.length - 1; j >= 0 && hits < 5; j--) {
            const e = this.enemies[j];
            if (e.spawnTimer <= 0 && Math.hypot(e.x - p.x, e.y - p.y) <= 320) {
              hits++;
              this.lightningArcs.push({
                x1: p.x,
                y1: p.y,
                x2: e.x,
                y2: e.y,
                color: ship.accentColor,
                life: 0.2,
                maxLife: 0.2,
              });
              this.damageEnemy(j, 1.55 * p.damageMult, 0, 0);
            }
          }
        } else if (this.shipId === 'eclipse') {
          p.overdrivePulseTimer = 0.28;
          for (const eb of this.enemyBullets) {
            if (eb.active && Math.hypot(eb.x - p.x, eb.y - p.y) <= 185) {
              eb.active = false;
              this.spawnPlayerProjectile(eb.x, eb.y, p.angle, 950, 1.5 * p.damageMult, 3, true, ship.accentColor, 5);
            }
          }
          for (const e of this.enemies) {
            if (e.spawnTimer <= 0 && !e.isBoss) {
              const d = Math.hypot(p.x - e.x, p.y - e.y);
              if (d > 40 && d < 280) {
                e.vx += ((p.x - e.x) / d) * 120;
                e.vy += ((p.y - e.y) / d) * 120;
              }
            }
          }
        } else if (this.shipId === 'nova') {
          p.overdrivePulseTimer = 0.24;
          for (let s = 0; s < 4; s++) {
            const a = (s * Math.PI) / 2 + this.elapsedTime * 3;
            this.spawnPlayerProjectile(p.x, p.y, a, 620, 1.35 * p.damageMult, 1, true, ship.accentColor, 5.2);
          }
        } else if (this.shipId === 'solaris') {
          p.overdrivePulseTimer = 0.32;
          this.spawnShockwave(p.x, p.y, 175, ship.accentColor, 3);
          for (let j = this.enemies.length - 1; j >= 0; j--) {
            const e = this.enemies[j];
            if (e.spawnTimer <= 0 && Math.hypot(e.x - p.x, e.y - p.y) <= 175 + e.radius) {
              this.damageEnemy(j, 1.75 * p.damageMult, 0, 0);
            }
          }
        } else if (this.shipId === 'aether') {
          p.overdrivePulseTimer = 0.22;
          for (let b = 0; b < 4; b++) {
            const a = this.elapsedTime * 2.6 + (b * Math.PI) / 2;
            const bx2 = p.x + Math.cos(a) * 900;
            const by2 = p.y + Math.sin(a) * 900;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
              const e = this.enemies[j];
              if (e.spawnTimer <= 0 && this.distToSegment(e.x, e.y, p.x, p.y, bx2, by2) <= e.radius + 18) {
                this.damageEnemy(j, 1.45 * p.damageMult, 0, 0);
              }
            }
          }
        } else if (this.shipId === 'chronos') {
          p.overdrivePulseTimer = 0.28;
          p.dashCooldown = 0;
          this.spawnPlayerProjectile(p.x, p.y, p.angle, 920, 1.6 * p.damageMult, 3, true, ship.accentColor, 5.2);
        } else if (this.shipId === 'omega') {
          p.overdrivePulseTimer = 1.45;
          this.fieldConstructs.push({
            kind: 'colossal_orb',
            x: p.x + Math.cos(p.angle) * 28,
            y: p.y + Math.sin(p.angle) * 28,
            x2: 0,
            y2: 0,
            vx: Math.cos(p.angle) * 310,
            vy: Math.sin(p.angle) * 310,
            angle: p.angle,
            radius: 135,
            life: 4.0,
            maxLife: 4.0,
            tickTimer: 0,
            damage: 2.8 * p.damageMult,
            color: ship.dashColor,
            secondaryColor: ship.dashSecondaryColor,
            hitIds: new Set<number>(),
          });
        } else if (this.shipId === 'leviathan') {
          p.overdrivePulseTimer = 2.1;
          this.fieldConstructs.push({
            kind: 'traveling_blackhole',
            x: p.x + Math.cos(p.angle) * 30,
            y: p.y + Math.sin(p.angle) * 30,
            x2: 0,
            y2: 0,
            vx: Math.cos(p.angle) * 180,
            vy: Math.sin(p.angle) * 180,
            angle: p.angle,
            radius: 145,
            life: 4.5,
            maxLife: 4.5,
            tickTimer: 0,
            damage: 2.6 * p.damageMult,
            color: ship.dashColor,
            secondaryColor: ship.dashSecondaryColor,
            hitIds: new Set<number>(),
          });
        } else if (this.shipId === 'apocalypse') {
          p.overdrivePulseTimer = 0.55;
          this.fieldConstructs.push({
            kind: 'colossal_slash',
            x: p.x + Math.cos(p.angle) * 30,
            y: p.y + Math.sin(p.angle) * 30,
            x2: 0,
            y2: 0,
            vx: Math.cos(p.angle) * 640,
            vy: Math.sin(p.angle) * 640,
            angle: p.angle,
            radius: 235,
            life: 2.2,
            maxLife: 2.2,
            tickTimer: 0,
            damage: 3.5 * p.damageMult,
            color: ship.accentColor,
            secondaryColor: ship.dashSecondaryColor,
            hitIds: new Set<number>(),
          });
        }
      }
    }

    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.hitFlash > 0) p.hitFlash = Math.max(0, p.hitFlash - dt);
    if (p.fireCooldown > 0) p.fireCooldown = Math.max(0, p.fireCooldown - dt);
    if (p.ricochetBossCooldown > 0) {
      p.ricochetBossCooldown = Math.max(0, p.ricochetBossCooldown - dt);
    }
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

    const minX = this.arenaPad + p.radius;
    const maxX = this.width - this.arenaPad - p.radius;
    const minY = this.arenaPad + p.radius;
    const maxY = this.height - this.arenaPad - p.radius;

    // SPECIAL HYPERION [E] OVERDRIVE: Pinball Wall-Ricochet Lightning Mode!
    // Continuously bounces off the 4 walls at supersonic speed, instantly obliterating all non-boss enemies!
    if (this.shipId === 'hyperion' && p.overdriveTimer > 0) {
      p.invulnTimer = Math.max(p.invulnTimer, 0.25);

      // Gentle player steering nudge while bouncing
      if (inputLen > 0.1) {
        p.ricochetVx += ix * 650 * dt;
        p.ricochetVy += iy * 650 * dt;
      }
      const curSpd = Math.max(1, Math.hypot(p.ricochetVx, p.ricochetVy));
      const targetSpd = 1680;
      p.ricochetVx = (p.ricochetVx / curSpd) * targetSpd;
      p.ricochetVy = (p.ricochetVy / curSpd) * targetSpd;

      p.vx = p.ricochetVx;
      p.vy = p.ricochetVy;
      p.angle = Math.atan2(p.ricochetVy, p.ricochetVx);
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      this.dashGhosts.push({
        x: p.x,
        y: p.y,
        angle: p.angle,
        alpha: 0.85,
        shipId: this.shipId,
        color: ship.accentColor,
        secondaryColor: ship.dashSecondaryColor,
        scale: 1.05,
      });

      let wallBounced = false;
      if (p.x <= minX) {
        p.x = minX;
        p.ricochetVx = Math.abs(p.ricochetVx);
        wallBounced = true;
      } else if (p.x >= maxX) {
        p.x = maxX;
        p.ricochetVx = -Math.abs(p.ricochetVx);
        wallBounced = true;
      }
      if (p.y <= minY) {
        p.y = minY;
        p.ricochetVy = Math.abs(p.ricochetVy);
        wallBounced = true;
      } else if (p.y >= maxY) {
        p.y = maxY;
        p.ricochetVy = -Math.abs(p.ricochetVy);
        wallBounced = true;
      }

      if (wallBounced) {
        // Draw a laser rebound beam between the previous wall bounce and this bounce
        this.lightningArcs.push({
          x1: p.ricochetLastBounceX,
          y1: p.ricochetLastBounceY,
          x2: p.x,
          y2: p.y,
          color: '#00F5D4',
          life: 0.42,
          maxLife: 0.42,
        });
        p.ricochetLastBounceX = p.x;
        p.ricochetLastBounceY = p.y;

        // Smartly bias bounce angle toward a random live enemy so it sweeps the entire screen!
        const liveTargets = this.enemies.filter((e) => e.spawnTimer <= 0);
        if (liveTargets.length > 0) {
          const target = liveTargets[Math.floor(Math.random() * liveTargets.length)];
          const toTargetA = Math.atan2(target.y - p.y, target.x - p.x);
          const bounceA = Math.atan2(p.ricochetVy, p.ricochetVx);
          const blendedA = this.lerpAngle(bounceA, toTargetA, 0.58);
          p.ricochetVx = Math.cos(blendedA) * targetSpd;
          p.ricochetVy = Math.sin(blendedA) * targetSpd;
        }

        this.addShake(6.5);
        this.sound.playDash();
        this.spawnShockwave(p.x, p.y, 165, '#00F5D4', 3.6);
        this.spawnBurst(p.x, p.y, 18, '#FDE047', 240);
      }

      // Destroy any enemy bullets near Hyperion's ricochet path
      for (const eb of this.enemyBullets) {
        if (eb.active && Math.hypot(eb.x - p.x, eb.y - p.y) <= 95) {
          eb.active = false;
          this.spawnBurst(eb.x, eb.y, 3, '#00F5D4', 90);
        }
      }

      // Sweep and OBLITERATE all non-boss enemies in path (Bosses take normal impact damage, never instant-killed!)
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (e.spawnTimer > 0) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d <= e.radius + p.radius + 54) {
          if (!e.isBoss) {
            this.spawnFloatingText(e.x, e.y - 18, 'QUÉT SẠCH!', '#00F5D4');
            this.damageEnemy(j, e.hp + 9999, p.ricochetVx * 0.25, p.ricochetVy * 0.25);
          } else if (p.ricochetBossCooldown <= 0) {
            p.ricochetBossCooldown = 0.22;
            this.damageEnemy(j, 3.2 * p.damageMult, p.ricochetVx * 0.05, p.ricochetVy * 0.05);
          }
        }
      }
      return;
    }

    // Standard Dash Trigger (on tap or after releasing Hold-[Q] Charge)
    if (this.dashBufferTimer > 0 && p.dashCooldown <= 0 && p.dashTimer <= 0) {
      const chargeRatio = this.pendingChargeRatio;
      this.pendingChargeRatio = 0;
      this.dashBufferTimer = 0;
      p.dashTimer = 0.19;
      p.dashTickTimer = 0;
      p.dashCooldown = p.dashMaxCooldown;
      p.invulnTimer = Math.max(p.invulnTimer, 0.32 + chargeRatio * 0.25);
      p.dashStartX = p.x;
      p.dashStartY = p.y;

      // Respect player's configured Dash Direction Mode ('mouse' vs 'movement')
      const dirMode = this.profile.dashDirectionMode ?? 'mouse';
      if (dirMode === 'mouse' && this.hasPointerAim) {
        const aimAngle = Math.atan2(this.mouseY - p.y, this.mouseX - p.x);
        p.dashDirX = Math.cos(aimAngle);
        p.dashDirY = Math.sin(aimAngle);
      } else if (inputLen > 0.1) {
        p.dashDirX = ix;
        p.dashDirY = iy;
      } else {
        p.dashDirX = Math.cos(p.angle);
        p.dashDirY = Math.sin(p.angle);
      }

      const speedBoost = (hasHyperSpeed ? 1.35 : 1.0) * (1 + chargeRatio * 0.35);
      p.vx = p.dashDirX * 940 * p.speedMult * speedBoost;
      p.vy = p.dashDirY * 940 * p.speedMult * speedBoost;
      p.squashX = 1.48;
      p.squashY = 0.64;
      this.addShake(4.5 + chargeRatio * 5);
      this.sound.playDash();

      this.executeShipDashEffect(chargeRatio);
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
      const overdriveBoost = p.overdriveTimer > 0 ? 1.24 : 1.0;
      const speedPickupBoost = hasHyperSpeed ? 1.55 : 1.0;
      const chargeSlowMult = p.isChargingDash ? 0.68 : 1.0;
      const totalSpeedMult = p.speedMult * overdriveBoost * speedPickupBoost * chargeSlowMult;

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
      // Reduced concurrent cap so the battlefield remains tactical and never cluttered
      const maxConcurrent = Math.min(4 + Math.floor(this.wave * 0.65), 9);
      if (this.spawnCooldown <= 0 && this.enemies.length < maxConcurrent) {
        const nextEntry = this.waveSpawnQueue.shift()!;
        this.spawnEnemyAtSafeEdge(nextEntry.type, nextEntry.isElite);
        const interval = Math.max(0.55, 1.35 - this.wave * 0.055);
        this.spawnCooldown = interval;
      }
    } else if (this.enemies.length === 0) {
      if (this.waveClearDelay <= 0) {
        this.waveClearDelay = 1.05;
        this.sound.playWaveClear();
        if (this.mode !== 'hardcore' && this.player.hp < this.player.maxHp) {
          const heal = Math.round(this.player.maxHp * 0.15);
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
          this.player.shields = Math.ceil(this.player.hp);
          this.spawnFloatingText(
            this.player.x,
            this.player.y - 28,
            `QUA ĐỢT +${heal} HP`,
            COLORS.repair
          );
        }
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
    if (
      type === 'boss_aegis' ||
      type === 'boss_hydra' ||
      type === 'boss_valkyria' ||
      type === 'boss_chronovore'
    ) {
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
      if (Math.hypot(x - this.player.x, y - this.player.y) > 240) break;
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
    const modeSpeed = this.mode === 'hardcore' ? 1.2 : 1.0;
    const speedScale = (1 + Math.min((this.wave - 1) * 0.045, 0.45)) * modeSpeed;
    const hpScale = 1 + Math.max(0, this.wave - 1) * 0.16;

    let radius = 14;
    let hp = 1.3 * hpScale;
    let speed = 132 * speedScale;
    let points = 110;
    let isBoss = false;

    if (type === 'chaser') {
      radius = 12;
      hp = 1.1 * hpScale;
      speed = 205 * speedScale;
      points = 140;
    } else if (type === 'shooter') {
      radius = 15;
      hp = 2.1 * hpScale;
      speed = 110 * speedScale;
      points = 200;
    } else if (type === 'sniper') {
      radius = 16;
      hp = 2.2 * hpScale;
      speed = 98 * speedScale;
      points = 240;
    } else if (type === 'bomber') {
      radius = 18;
      hp = 3.0 * hpScale;
      speed = 95 * speedScale;
      points = 260;
    } else if (type === 'vortex') {
      radius = 19;
      hp = 3.5 * hpScale;
      speed = 90 * speedScale;
      points = 290;
    } else if (type === 'tank') {
      radius = 25;
      hp = 6.5 * hpScale;
      speed = 68 * speedScale;
      points = 360;
    } else if (type === 'juggernaut') {
      radius = 29;
      hp = 8.5 * hpScale;
      speed = 64 * speedScale;
      points = 460;
    } else if (type === 'charger') {
      radius = 15;
      hp = 2.2 * hpScale;
      speed = 118 * speedScale;
      points = 210;
    } else if (type === 'prism') {
      radius = 22;
      hp = 3.4 * hpScale;
      speed = 84 * speedScale;
      points = 270;
    } else if (type === 'pulsar') {
      radius = 17;
      hp = 2.5 * hpScale;
      speed = 102 * speedScale;
      points = 240;
    } else if (type === 'shardling') {
      radius = 9;
      hp = 0.9 * hpScale;
      speed = 195 * speedScale;
      points = 85;
    } else if (type === 'boss_aegis') {
      radius = 44;
      hp = 68 + this.wave * 22;
      speed = 76 * modeSpeed;
      points = 2500;
      isBoss = true;
    } else if (type === 'boss_hydra') {
      radius = 46;
      hp = 78 + this.wave * 24;
      speed = 84 * modeSpeed;
      points = 2900;
      isBoss = true;
    } else if (type === 'boss_valkyria') {
      radius = 45;
      hp = 85 + this.wave * 26;
      speed = 96 * modeSpeed;
      points = 3400;
      isBoss = true;
    } else if (type === 'boss_chronovore') {
      radius = 48;
      hp = 96 + this.wave * 28;
      speed = 80 * modeSpeed;
      points = 3800;
      isBoss = true;
    }

    if (isElite && !isBoss) {
      radius = Math.round(radius * 1.24);
      hp *= 2.3;
      speed *= 1.08;
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
        type === 'pulsar' ||
        type === 'shooter' ||
        type === 'sniper' ||
        type === 'bomber' ||
        type === 'vortex' ||
        isBoss
          ? 'orbit'
          : 'chase',
      stateTimer:
        type === 'shooter' || type === 'sniper'
          ? 2.2 + Math.random() * 1.1
          : isBoss
          ? 2.2
          : 2.0 + Math.random() * 1.0,
      secondaryTimer: 2.6,
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
        let bestDist = 420;
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

      // Allow player bullets to shoot down destructible enemy plasma orbs & mines!
      for (const eb of this.enemyBullets) {
        if (eb.active && eb.destructible) {
          if (Math.hypot(b.x - eb.x, b.y - eb.y) <= b.radius + eb.radius + 3) {
            eb.active = false;
            this.spawnBurst(eb.x, eb.y, 6, eb.color, 110);
            if (b.pierce <= 0) {
              b.active = false;
              break;
            }
          }
        }
      }
      if (!b.active) continue;

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (e.spawnTimer > 0 || b.hitEnemyIds.has(e.id)) continue;
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist <= b.radius + e.radius) {
          b.hitEnemyIds.add(e.id);
          const knockScale =
            e.type === 'tank' || e.type === 'juggernaut' ? 0.025 : e.isBoss ? 0.008 : 0.08;
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

    // Overdrive ONLY charges from dealing damage, accumulating at a steady tactical pace
    if (this.player.overdriveTimer <= 0) {
      const hitGain = (0.36 + Math.min(1.3, damage * 0.35)) * this.player.overdriveGainMult;
      this.player.overdriveCharge = Math.min(100, this.player.overdriveCharge + hitGain);
    }

    // Valkyrie Overdrive lifesteal on hit
    if (
      this.shipId === 'valkyrie' &&
      this.player.overdriveTimer > 0 &&
      this.mode !== 'hardcore' &&
      this.player.hp < this.player.maxHp
    ) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1.5);
      this.player.shields = Math.ceil(this.player.hp);
    }

    if (e.isBoss && e.bossPhase === 1 && e.hp <= e.maxHp * 0.5) {
      e.bossPhase = 2;
      this.spawnShockwave(e.x, e.y, 160, '#F43F5E', 3.5);
      this.spawnFloatingText(e.x, e.y - e.radius - 12, 'CUỒNG NỘ PHA 2!', '#FB7185');
      this.addShake(7);
      this.spawnRandomBoostPickup(e.x, e.y);
    }

    if (e.hp > 0) {
      this.sound.playHit(
        e.type === 'prism' || e.type === 'tank' || e.type === 'juggernaut' || e.isBoss
      );
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
    }

    if (e.isBoss) {
      this.bossesDefeated += 1;
      this.profile.stats.totalBossKills += 1;
      this.tryUnlockAchievement('boss_slayer');
    }

    if (this.player.overdriveTimer <= 0) {
      const killGain = e.isBoss ? 22 : e.isElite ? 6.5 : 2.2;
      this.player.overdriveCharge = Math.min(
        100,
        this.player.overdriveCharge + killGain * this.player.overdriveGainMult
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
      e.isBoss ||
      e.isElite ||
      e.type === 'prism' ||
      e.type === 'tank' ||
      e.type === 'juggernaut' ||
      e.type === 'charger';
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
      : e.type === 'tank' || e.type === 'juggernaut'
      ? 4
      : e.type === 'prism'
      ? 3
      : e.type === 'shardling'
      ? 1
      : 2;

    for (let s = 0; s < shardDrops; s++) {
      this.spawnShard(e.x, e.y, 25, e.isBoss ? 3 : e.isElite ? 2 : 1, false);
    }

    const boostDropChance = e.isBoss
      ? 1.0
      : e.isElite
      ? 0.48
      : e.type === 'tank' || e.type === 'juggernaut' || e.type === 'prism'
      ? 0.24
      : 0.14;
    if (Math.random() < boostDropChance) {
      this.spawnRandomBoostPickup(e.x, e.y);
    }

    if (
      this.mode !== 'hardcore' &&
      this.player.hp < this.player.maxHp &&
      (e.isBoss || Math.random() < (e.isElite ? 0.32 : 0.11))
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
      case 'sniper':
        return COLORS.sniper;
      case 'bomber':
        return COLORS.bomber;
      case 'vortex':
        return COLORS.vortex;
      case 'tank':
        return COLORS.tank;
      case 'juggernaut':
        return COLORS.juggernaut;
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
      case 'boss_valkyria':
        return COLORS.bossValkyria;
      case 'boss_chronovore':
        return COLORS.bossChronovore;
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
      } else if (e.type === 'tank' || e.type === 'juggernaut') {
        const targetAngle = Math.atan2(dy, dx);
        e.angle = this.lerpAngle(e.angle, targetAngle, dt * 2.2);
        e.vx += (Math.cos(e.angle) * e.speed - e.vx) * Math.min(1, dt * 3);
        e.vy += (Math.sin(e.angle) * e.speed - e.vy) * Math.min(1, dt * 3);
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.stateTimer = 4.2;
          if (e.type === 'juggernaut') {
            // Fires 2 wide readable Crescent Plasma Waves toward player
            for (let s = -1; s <= 1; s += 2) {
              const a = e.angle + s * 0.16;
              this.spawnEnemyProjectile(
                e.x + Math.cos(a) * e.radius,
                e.y + Math.sin(a) * e.radius,
                Math.cos(a) * 215,
                Math.sin(a) * 215,
                11,
                COLORS.juggernaut,
                34,
                'crescent',
                false
              );
            }
          } else {
            // Fires 4 cardinal Energy Lances
            for (let k = 0; k < 4; k++) {
              const a = e.angle + (k * Math.PI) / 2;
              this.spawnEnemyProjectile(
                e.x,
                e.y,
                Math.cos(a) * 165,
                Math.sin(a) * 165,
                6,
                COLORS.tank,
                26,
                'lance',
                false
              );
            }
          }
          this.spawnShockwave(e.x, e.y, e.radius * 2.2, this.getEnemyColor(e), 2);
        }
      } else if (e.type === 'sniper') {
        const desiredDist = 340;
        const radialPush = Math.max(-1, Math.min(1, (distToPlayer - desiredDist) / 90));
        const tangentX = -dirY * e.orbitDir;
        const tangentY = dirX * e.orbitDir;
        e.vx += ((dirX * radialPush * 0.7 + tangentX * 0.6) * e.speed - e.vx) * Math.min(1, dt * 4);
        e.vy += ((dirY * radialPush * 0.7 + tangentY * 0.6) * e.speed - e.vy) * Math.min(1, dt * 4);
        e.angle = Math.atan2(dy, dx);
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.stateTimer = 4.0 + Math.random() * 1.0;
          // Spawns a telegraphed laser beam line that gives the player 0.85s to sidestep before firing!
          this.fieldConstructs.push({
            kind: 'enemy_telegraph_beam',
            x: e.x,
            y: e.y,
            x2: e.x + dirX * 1100,
            y2: e.y + dirY * 1100,
            vx: 0,
            vy: 0,
            angle: e.angle,
            radius: 14,
            life: 1.05,
            maxLife: 1.05,
            tickTimer: 0,
            damage: 32,
            color: COLORS.sniper,
            secondaryColor: '#FFE4E6',
            hitIds: new Set<number>(),
          });
          this.sound.playTelegraph();
        }
      } else if (e.type === 'bomber') {
        const desiredDist = 240;
        const radialPush = Math.max(-1, Math.min(1, (distToPlayer - desiredDist) / 90));
        const tangentX = -dirY * e.orbitDir;
        const tangentY = dirX * e.orbitDir;
        e.vx += ((dirX * radialPush * 0.6 + tangentX * 0.85) * e.speed - e.vx) * Math.min(1, dt * 4);
        e.vy += ((dirY * radialPush * 0.6 + tangentY * 0.85) * e.speed - e.vy) * Math.min(1, dt * 4);
        e.angle = Math.atan2(dy, dx);
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.stateTimer = 3.8 + Math.random() * 0.8;
          // Drops a destructible floating Space Mine
          this.spawnEnemyProjectile(
            e.x,
            e.y,
            dirX * 45,
            dirY * 45,
            10,
            COLORS.bomber,
            34,
            'mine',
            true
          );
        }
      } else if (e.type === 'vortex') {
        const desiredDist = 260;
        const radialPush = Math.max(-1, Math.min(1, (distToPlayer - desiredDist) / 90));
        const tangentX = -dirY * e.orbitDir;
        const tangentY = dirX * e.orbitDir;
        e.vx += ((dirX * radialPush * 0.65 + tangentX * 0.8) * e.speed - e.vx) * Math.min(1, dt * 4);
        e.vy += ((dirY * radialPush * 0.65 + tangentY * 0.8) * e.speed - e.vy) * Math.min(1, dt * 4);
        e.angle += dt * 2.5;
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.stateTimer = 3.9 + Math.random() * 0.9;
          // Fires a large slow destructible Gravity Orb
          this.spawnEnemyProjectile(
            e.x + dirX * e.radius,
            e.y + dirY * e.radius,
            dirX * 145,
            dirY * 145,
            11,
            COLORS.vortex,
            30,
            'orb',
            true
          );
        }
      } else if (e.type === 'shooter') {
        if (e.state === 'orbit') {
          const desiredDist = 280;
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
            this.spawnEnemyProjectile(
              e.x + Math.cos(baseA) * e.radius,
              e.y + Math.sin(baseA) * e.radius,
              Math.cos(baseA) * 245,
              Math.sin(baseA) * 245,
              6,
              COLORS.shooter,
              24,
              'lance',
              false
            );
            e.squash = 1.25;
            e.state = 'orbit';
            e.stateTimer = 3.1 + Math.random() * 0.9;
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
            e.stateTimer = 0.75;
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
            e.vx = e.aimX * 540;
            e.vy = e.aimY * 540;
            e.squash = 1.4;
            this.spawnBurst(e.x, e.y, 7, COLORS.charger, 120);
          }
        } else if (e.state === 'lunge') {
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'recover';
            e.stateTimer = 0.65;
          }
        } else {
          e.vx *= Math.exp(-6 * dt);
          e.vy *= Math.exp(-6 * dt);
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'chase';
            e.stateTimer = 2.4 + Math.random() * 0.8;
          }
        }
      } else if (e.type === 'pulsar') {
        if (e.state === 'orbit') {
          const desiredDist = 260;
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
            const baseA = Math.atan2(dy, dx);
            for (let s = -1; s <= 1; s++) {
              const a = baseA + s * 0.32;
              this.spawnEnemyProjectile(
                e.x + Math.cos(a) * e.radius,
                e.y + Math.sin(a) * e.radius,
                Math.cos(a) * 195,
                Math.sin(a) * 195,
                8,
                COLORS.pulsar,
                26,
                'crescent',
                false
              );
            }
            e.state = 'orbit';
            e.stateTimer = 3.5 + Math.random() * 0.9;
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
          const contactDmg = e.isBoss ? 48 : e.type === 'juggernaut' || e.type === 'tank' ? 36 : 24;
          this.damagePlayer(e.x, e.y, contactDmg);
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
    const phaseMult = e.bossPhase === 2 ? 1.25 : 1.0;
    const bossColor = this.getEnemyColor(e);
    e.angle += dt * 0.85 * phaseMult;

    if (e.state === 'orbit') {
      const desiredDist = 250;
      const radialPush = Math.max(-1, Math.min(1, (distToPlayer - desiredDist) / 110));
      const tangentX = -dirY * e.orbitDir;
      const tangentY = dirX * e.orbitDir;
      const desiredVx = (dirX * radialPush * 0.65 + tangentX * 0.75) * e.speed * phaseMult;
      const desiredVy = (dirY * radialPush * 0.65 + tangentY * 0.75) * e.speed * phaseMult;
      e.vx += (desiredVx - e.vx) * Math.min(1, dt * 3);
      e.vy += (desiredVy - e.vy) * Math.min(1, dt * 3);

      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        if ((e.type === 'boss_aegis' || e.type === 'boss_valkyria') && Math.random() < 0.5) {
          e.state = 'windup';
          e.stateTimer = 0.9;
          e.aimX = dirX;
          e.aimY = dirY;
          this.sound.playTelegraph();
        } else if (e.type === 'boss_hydra' || e.type === 'boss_chronovore') {
          // Telegraphed Cross Laser Beams + Crescent Waves instead of round bullet spam!
          const beamCount = e.bossPhase === 2 ? 4 : 2;
          const baseA = Math.atan2(dirY, dirX);
          for (let b = 0; b < beamCount; b++) {
            const a = baseA + (b * Math.PI) / (beamCount === 4 ? 2 : 1) + 0.28;
            this.fieldConstructs.push({
              kind: 'enemy_telegraph_beam',
              x: e.x,
              y: e.y,
              x2: e.x + Math.cos(a) * 1200,
              y2: e.y + Math.sin(a) * 1200,
              vx: 0,
              vy: 0,
              angle: a,
              radius: 22,
              life: 1.15,
              maxLife: 1.15,
              tickTimer: 0,
              damage: 42,
              color: bossColor,
              secondaryColor: '#FFFFFF',
              hitIds: new Set<number>(),
            });
          }
          e.state = 'spiral_volley';
          e.stateTimer = 1.4;
          e.secondaryTimer = 0.25;
          this.sound.playTelegraph();
        } else {
          e.state = 'spiral_volley';
          e.stateTimer = 1.3;
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
        e.secondaryTimer = e.bossPhase === 2 ? 0.45 : 0.6;
        const baseA = Math.atan2(dirY, dirX);
        const count = e.bossPhase === 2 ? 4 : 3;
        for (let k = 0; k < count; k++) {
          const offset = (k - (count - 1) * 0.5) * 0.34;
          const a = baseA + offset;
          this.spawnEnemyProjectile(
            e.x + Math.cos(a) * (e.radius + 6),
            e.y + Math.sin(a) * (e.radius + 6),
            Math.cos(a) * 205,
            Math.sin(a) * 205,
            10,
            bossColor,
            34,
            e.type === 'boss_chronovore' ? 'orb' : 'crescent',
            e.type === 'boss_chronovore'
          );
        }
        this.spawnShockwave(e.x, e.y, e.radius + 26, bossColor, 2);
      }

      if (e.stateTimer <= 0) {
        e.state = 'orbit';
        e.stateTimer = e.bossPhase === 2 ? 2.4 : 3.1;
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
        this.spawnShockwave(e.x, e.y, 120, bossColor, 3);
      }
    } else if (e.state === 'lunge') {
      e.stateTimer -= dt;
      if (e.stateTimer <= 0) {
        // Fires 4 wide Crescent Blade Waves on lunge recovery
        for (let k = 0; k < 4; k++) {
          const a = e.angle + (k * Math.PI) / 2;
          this.spawnEnemyProjectile(
            e.x + Math.cos(a) * e.radius,
            e.y + Math.sin(a) * e.radius,
            Math.cos(a) * 195,
            Math.sin(a) * 195,
            11,
            bossColor,
            36,
            'crescent',
            false
          );
        }
        e.state = 'orbit';
        e.stateTimer = 2.6;
      }
    }
  }

  private spawnEnemyProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    color: string,
    damage = 24,
    shape: 'lance' | 'crescent' | 'orb' | 'mine' = 'lance',
    destructible = false
  ): void {
    for (const b of this.enemyBullets) {
      if (!b.active) {
        b.active = true;
        b.x = x;
        b.y = y;
        b.vx = vx;
        b.vy = vy;
        b.life = shape === 'mine' ? 6.0 : 4.5;
        b.maxLife = b.life;
        b.radius = radius;
        b.color = color;
        b.damage = damage;
        b.shape = shape;
        b.destructible = destructible;
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
      if (b.shape === 'mine') {
        b.vx *= Math.exp(-2.5 * dt);
        b.vy *= Math.exp(-2.5 * dt);
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0 || b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) {
        if (b.shape === 'mine' && b.life <= 0) {
          this.spawnShockwave(b.x, b.y, 65, b.color, 2.2);
        }
        b.active = false;
        continue;
      }

      if (this.player.invulnTimer <= 0 && this.player.dashTimer <= 0) {
        const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
        if (dist < b.radius + this.player.radius - 2) {
          b.active = false;
          this.damagePlayer(b.x, b.y, b.damage || 24);
        }
      }
    }
  }

  private damagePlayer(sourceX: number, sourceY: number, rawDamage = 26): void {
    const p = this.player;
    let damageMult = 1.0;

    // Titan Overdrive or Titan Hexagonal Dome reduces incoming HP damage
    if (this.shipId === 'titan' && p.overdriveTimer > 0) {
      damageMult *= 0.35;
    } else {
      for (const c of this.fieldConstructs) {
        if (c.kind === 'titan_dome' && Math.hypot(p.x - c.x, p.y - c.y) <= c.radius) {
          damageMult *= 0.5;
          break;
        }
      }
    }

    const finalDmg = Math.max(5, Math.round(rawDamage * damageMult));
    p.hp = Math.max(0, p.hp - finalDmg);
    p.shields = Math.ceil(p.hp);
    p.outOfCombatTimer = 0;
    p.invulnTimer = 1.05;
    p.hitFlash = 0.16;
    p.squashX = 1.35;
    p.squashY = 0.65;

    const dx = p.x - sourceX;
    const dy = p.y - sourceY;
    const dist = Math.max(Math.hypot(dx, dy), 1);
    p.vx = (dx / dist) * 290;
    p.vy = (dy / dist) * 290;

    this.multiplier = Math.max(1, Math.floor(this.multiplier / 2));
    this.comboTimer = this.multiplier > 1 ? this.maxComboDuration * 0.5 : 0;

    this.hitstopTimer = 0.045;
    this.addShake(9);
    this.sound.playPlayerDamage();
    this.spawnBurst(p.x, p.y, 20, COLORS.charger, 240);
    this.spawnShockwave(p.x, p.y, 115, COLORS.charger, 2.8);

    for (const e of this.enemies) {
      const edx = e.x - p.x;
      const edy = e.y - p.y;
      const eDist = Math.hypot(edx, edy);
      if (eDist > 0 && eDist < 170 && !e.isBoss) {
        e.vx += (edx / eDist) * 260;
        e.vy += (edy / eDist) * 260;
      }
    }

    if (p.hp <= 0) {
      p.hp = 0;
      p.shields = 0;
      savePlayerProfile(this.profile);
      this.callbacks.onProfileUpdate({ ...this.profile });
      this.pushHud(true);
      this.setState('GAME_OVER');
      return;
    }

    this.spawnFloatingText(p.x, p.y - 24, `-${finalDmg} HP!`, COLORS.charger);
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
          if (this.mode !== 'hardcore' && p.hp < p.maxHp) {
            const heal = Math.max(45, Math.round(p.maxHp * 0.18));
            p.hp = Math.min(p.maxHp, p.hp + heal);
            p.shields = Math.ceil(p.hp);
            this.spawnFloatingText(p.x, p.y - 22, `+${heal} HP`, COLORS.repair);
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
          const magnetBonus = 1 + (this.profile.hangarLevels.magnet ?? 0) * 0.12;
          const gainedShards = Math.max(
            1,
            Math.round(s.shardCurrency * modeShardMult * magnetBonus)
          );

          this.runShards += gainedShards;
          this.profile.starShards += gainedShards;

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
    const bossName =
      boss.type === 'boss_aegis'
        ? 'PHÁO ĐÀI AEGIS'
        : boss.type === 'boss_hydra'
        ? 'XÀ VƯƠNG MẶT TRỜI'
        : boss.type === 'boss_valkyria'
        ? 'NỮ HOÀNG KIẾM KHÍ VALKYRIA'
        : 'CHÚA TỂ HƯ KHÔNG CHRONOVORE';
    return {
      name: bossName,
      subtitle: boss.bossPhase === 2 ? 'Pha 2 · Cuồng Nộ Thức Tỉnh' : 'Pha 1 · Phòng Tuyến Chiến Hạm',
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
    const p = this.player;
    const ship = SHIPS[this.shipId] ?? SHIPS.vanguard;
    const h = this.profile.hangarLevels;

    const dashCharge = Math.max(0, Math.min(1, 1 - p.dashCooldown / p.dashMaxCooldown));
    const holdChargeRatio = p.isChargingDash ? Math.min(1, p.holdChargeTimer / 1.05) : 0;
    // Fixed Overdrive 0..100 percentage so HUD never shows 1% when full!
    const overdriveCharge = Math.max(0, Math.min(100, Math.round(p.overdriveCharge)));
    const overdriveTimeLeft = Math.max(0, Number(p.overdriveTimer.toFixed(1)));
    const comboProgress =
      this.multiplier > 1 ? Math.max(0, Math.min(1, this.comboTimer / this.maxComboDuration)) : 0;
    const waveProgress =
      this.waveTotalEnemies > 0 ? Math.min(1, this.waveDefeated / this.waveTotalEnemies) : 0;
    const bestScore = this.profile.bestScores[this.mode] ?? 0;
    const boss = this.getActiveBossInfo();
    const activeBoosts = this.getActiveBoostsHud();
    const boostSig = activeBoosts.map((b) => `${b.type}:${Math.round(b.remaining * 10)}`).join(',');

    // Calculate live upgraded stats in battle (Hangar + Perks + Active Boosts)
    const activeDmgMult =
      p.damageMult *
      (p.overdriveTimer > 0 ? 1.35 : 1.0) *
      (this.activeBoostTimers.damage_surge > 0 ? 1.6 : 1.0);
    const activeFireRateMult =
      p.fireRateMult *
      (p.overdriveTimer > 0 ? 1.85 : 1.0) *
      (this.activeBoostTimers.rapid_fire > 0 ? 1.65 : 1.0);
    const activeSpeedMult =
      p.speedMult *
      (p.overdriveTimer > 0 ? 1.24 : 1.0) *
      (this.activeBoostTimers.hyper_speed > 0 ? 1.55 : 1.0);

    const liveStats = {
      damageBonusPct: Math.round((activeDmgMult - 1) * 100),
      fireRateBonusPct: Math.round((activeFireRateMult - 1) * 100),
      speedBonusPct: Math.round((activeSpeedMult - 1) * 100),
      bonusMaxHp: Math.max(0, Math.round(p.maxHp - ship.baseHp)),
      hpRegenPerSec: Number(
        (
          p.hpRegenRate +
          (this.shipId === 'solaris' && p.overdriveTimer > 0 ? 12 : 0)
        ).toFixed(1)
      ),
      dashCooldownSec: Number(p.dashMaxCooldown.toFixed(2)),
      magnetRadiusPx: Math.round(
        this.activeBoostTimers.hyper_magnet > 0 ? 1800 : p.magnetRadius
      ),
      shardBonusPct: Math.round((h.magnet ?? 0) * 12),
      overdriveGainBonusPct: Math.round((p.overdriveGainMult - 1) * 100),
      extraBarrels: p.extraBarrels,
      bonusPierce: p.bonusPierce + (this.activeBoostTimers.damage_surge > 0 ? 1 : 0),
      hangarLevels: { ...h },
    };

    const hpInt = Math.ceil(p.hp);
    const maxHpInt = Math.ceil(p.maxHp);

    const sig = `${this.score}|${bestScore}|${this.multiplier}|${Math.round(comboProgress * 20)}|${this.wave}|${Math.round(waveProgress * 20)}|${hpInt}|${maxHpInt}|${Math.round(dashCharge * 20)}|${Math.round(holdChargeRatio * 20)}|${overdriveCharge}|${overdriveTimeLeft}|${p.weapon}|${p.weaponLevel}|${this.runShards}|${this.profile.starShards}|${this.totalEnemiesDefeated}|${this.waveBanner ?? ''}|${this.currentSector.id}|${this.profile.dashDirectionMode}|${boostSig}|${boss?.hp ?? 0}|${liveStats.damageBonusPct}|${liveStats.fireRateBonusPct}|${this.gameState}`;
    if (!force && sig === this.lastHudSignature) return;
    this.lastHudSignature = sig;

    this.callbacks.onHudUpdate({
      score: this.score,
      bestScore,
      multiplier: this.multiplier,
      comboProgress,
      wave: this.wave,
      waveProgress,
      hp: hpInt,
      maxHp: maxHpInt,
      shields: hpInt,
      maxShields: maxHpInt,
      dashCharge,
      holdChargeRatio,
      overdriveCharge,
      overdriveActive: p.overdriveTimer > 0,
      overdriveTimeLeft,
      weapon: p.weapon,
      weaponLevel: p.weaponLevel,
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
      dashDirectionMode: this.profile.dashDirectionMode ?? 'mouse',
      activePerks: this.activePerks,
      perkChoices: this.currentPerkChoices,
      activeBoosts,
      boss,
      liveStats,
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
    this.renderFieldConstructs(ctx);
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

  private renderFieldConstructs(ctx: CanvasRenderingContext2D): void {
    for (const c of this.fieldConstructs) {
      const alpha = Math.max(0.15, Math.min(1, c.life / Math.min(c.maxLife, 0.55)));
      ctx.save();
      ctx.globalAlpha = alpha;

      switch (c.kind) {
        case 'solar_ring': {
          ctx.translate(c.x, c.y);
          ctx.rotate(c.angle);
          const grad = ctx.createRadialGradient(0, 0, c.radius * 0.25, 0, 0, c.radius);
          grad.addColorStop(0, 'rgba(254, 240, 138, 0.32)');
          grad.addColorStop(0.7, 'rgba(250, 204, 21, 0.16)');
          grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = c.color;
          ctx.lineWidth = 2.6;
          ctx.setLineDash([12, 8]);
          ctx.beginPath();
          ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }

        case 'phantom_turret': {
          ctx.translate(c.x, c.y);
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, 0, 18 + Math.sin(this.elapsedTime * 10) * 2, 0, Math.PI * 2);
          ctx.stroke();
          this.drawCraftShape(
            ctx,
            0,
            0,
            c.angle,
            0.85,
            0.85,
            false,
            'phantom',
            c.color,
            c.secondaryColor
          );
          break;
        }

        case 'valkyrie_drill': {
          ctx.translate(c.x, c.y);
          ctx.rotate(c.angle);
          ctx.fillStyle = c.color;
          ctx.strokeStyle = '#FFF1F2';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(c.radius * 1.4, 0);
          ctx.lineTo(-c.radius * 0.9, -c.radius * 0.65);
          ctx.lineTo(-c.radius * 0.45, 0);
          ctx.lineTo(-c.radius * 0.9, c.radius * 0.65);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 'titan_dome': {
          ctx.translate(c.x, c.y);
          ctx.strokeStyle = c.color;
          ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = c.angle + (i * Math.PI * 2) / 8;
            const rx = Math.cos(a) * c.radius;
            const ry = Math.sin(a) * c.radius;
            if (i === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 'lightning_pylon': {
          ctx.translate(c.x, c.y);
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 8]);
          ctx.beginPath();
          ctx.arc(0, 0, c.radius * 0.45, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.rotate(c.angle);
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#E0F2FE';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2;
            ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
            ctx.lineTo(Math.cos(a + Math.PI / 4) * 7, Math.sin(a + Math.PI / 4) * 7);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 'gravity_well':
        case 'traveling_blackhole': {
          ctx.translate(c.x, c.y);
          const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, c.radius);
          grad.addColorStop(0, '#020617');
          grad.addColorStop(0.32, c.secondaryColor);
          grad.addColorStop(0.75, 'rgba(168, 85, 247, 0.16)');
          grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.rotate(c.angle);
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 2.4;
          for (let arm = 0; arm < 3; arm++) {
            const baseA = (arm * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.arc(0, 0, c.radius * 0.55, baseA, baseA + 1.35);
            ctx.stroke();
          }
          ctx.fillStyle = '#020617';
          ctx.strokeStyle = '#F3E8FF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, c.kind === 'traveling_blackhole' ? 18 : 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 'nebula_mine': {
          ctx.translate(c.x, c.y);
          ctx.rotate(c.angle);
          const pulse = 1 + Math.sin(this.elapsedTime * 14) * 0.2;
          ctx.strokeStyle = c.color;
          ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI * 2) / 8;
            const r = (i % 2 === 0 ? 15 : 8) * pulse;
            const rx = Math.cos(a) * r;
            const ry = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 'fire_wall': {
          const grad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, c.radius);
          grad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
          grad.addColorStop(0.55, 'rgba(250, 204, 21, 0.45)');
          grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'laser_gate': {
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 10;
          ctx.globalAlpha = alpha * 0.28;
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(c.x2, c.y2);
          ctx.stroke();

          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#ECFDF5';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(c.x2, c.y2);
          ctx.stroke();

          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
          ctx.arc(c.x2, c.y2, 7, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'time_dome': {
          ctx.translate(c.x, c.y);
          ctx.fillStyle = 'rgba(45, 212, 191, 0.09)';
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Clock hands inside dome
          ctx.rotate(c.angle);
          ctx.strokeStyle = 'rgba(204, 251, 241, 0.65)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(c.radius * 0.68, 0);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -c.radius * 0.45);
          ctx.stroke();
          break;
        }

        case 'colossal_orb': {
          ctx.translate(c.x, c.y);
          const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, c.radius * 1.45);
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(0.35, c.color);
          grad.addColorStop(0.75, c.secondaryColor);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, c.radius * 1.45, 0, Math.PI * 2);
          ctx.fill();

          ctx.rotate(c.angle);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.8;
          ctx.setLineDash([14, 10]);
          ctx.beginPath();
          ctx.arc(0, 0, c.radius * 0.9, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }

        case 'judgment_beam': {
          ctx.translate(c.x, c.y);
          const pulseR = c.radius * (0.9 + Math.sin(this.elapsedTime * 22) * 0.15);
          const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, pulseR * 1.5);
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(0.45, c.color);
          grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, pulseR * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Vertical sky beam pillar effect
          ctx.fillStyle = 'rgba(254, 249, 195, 0.32)';
          ctx.fillRect(-pulseR * 0.42, -this.height, pulseR * 0.84, this.height);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case 'ricochet_blade': {
          ctx.translate(c.x, c.y);
          ctx.rotate(c.angle);
          ctx.strokeStyle = '#FFFFFF';
          ctx.fillStyle = c.color;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2;
            ctx.lineTo(Math.cos(a) * c.radius, Math.sin(a) * c.radius);
            ctx.lineTo(
              Math.cos(a + Math.PI / 4) * (c.radius * 0.36),
              Math.sin(a + Math.PI / 4) * (c.radius * 0.36)
            );
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = c.secondaryColor;
          ctx.beginPath();
          ctx.arc(0, 0, c.radius * 0.26, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'colossal_slash': {
          ctx.translate(c.x, c.y);
          ctx.rotate(c.angle);
          ctx.fillStyle = c.color;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, c.radius, -1.18, 1.18, false);
          ctx.arc(-c.radius * 0.35, 0, c.radius * 0.88, 1.05, -1.05, true);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 'enemy_telegraph_beam': {
          if (c.life > 0.35) {
            // Telegraph warning laser line
            ctx.strokeStyle = c.color;
            ctx.lineWidth = 2.2;
            ctx.setLineDash([10, 8]);
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(c.x2, c.y2);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            // High-intensity firing beam
            ctx.strokeStyle = c.color;
            ctx.lineWidth = c.radius * 1.4;
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(c.x2, c.y2);
            ctx.stroke();

            ctx.globalAlpha = 0.95;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = c.radius * 0.55;
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(c.x2, c.y2);
            ctx.stroke();
          }
          break;
        }
      }

      ctx.restore();
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    if (this.gameState === 'GAME_OVER' && this.player.hp <= 0) return;

    const p = this.player;
    const ship = SHIPS[this.shipId] ?? SHIPS.vanguard;
    const scale = ship.hullScale ?? 1.0;

    // 10-Second 3D Overdrive Ultimate Visuals around the player
    if (p.overdriveTimer > 0) {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Outer 3D dual rotating sacred/cyber halos
      const r1 = (30 + Math.sin(this.elapsedTime * 14) * 4) * scale;
      ctx.strokeStyle = ship.accentColor;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(0, 0, r1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.rotate(-this.elapsedTime * 3.5);
      ctx.strokeStyle = ship.dashSecondaryColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, r1 * 1.24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Ship-specific 10s Overdrive 3D effects attached to player
      if (this.shipId === 'valkyrie') {
        for (let b = 0; b < 3; b++) {
          const ba = this.elapsedTime * 6.5 + (b * Math.PI * 2) / 3;
          const bx = Math.cos(ba) * 105;
          const by = Math.sin(ba) * 105;
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(ba + Math.PI / 2);
          ctx.fillStyle = '#FB7185';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(22, 0);
          ctx.lineTo(-14, -9);
          ctx.lineTo(-8, 0);
          ctx.lineTo(-14, 9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      } else if (this.shipId === 'titan') {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 128, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (this.shipId === 'solaris') {
        const beamLen = 580;
        const endX = Math.cos(p.angle) * beamLen;
        const endY = Math.sin(p.angle) * beamLen;
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.lineWidth = 34;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.strokeStyle = '#FEF9C3';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      } else if (this.shipId === 'aether') {
        for (let i = 0; i < 4; i++) {
          const oa = this.elapsedTime * 3.8 + (i * Math.PI) / 2;
          const ox = Math.cos(oa) * 125;
          const oy = Math.sin(oa) * 125;
          ctx.fillStyle = '#34D399';
          ctx.strokeStyle = '#ECFDF5';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ox, oy, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else if (this.shipId === 'hyperion') {
        // Hyperion Pinball Ricochet Overdrive supersonic lightning aura
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = this.elapsedTime * 10 + (i * Math.PI) / 4;
          const r = i % 2 === 0 ? 52 : 26;
          const rx = Math.cos(a) * r;
          const ry = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.stroke();
      }

      ctx.restore();
    }

    // Hold-[Q] Energy Charge-Burst Inward-Pulling Rings
    if (p.isChargingDash && p.holdChargeTimer > 0.04) {
      const chargeRatio = Math.min(1, p.holdChargeTimer / 1.05);
      ctx.save();
      ctx.translate(p.x, p.y);
      const ringR = (54 - chargeRatio * 28) * scale;
      ctx.strokeStyle = chargeRatio >= 0.99 ? '#FDE047' : ship.dashColor;
      ctx.lineWidth = 2 + chargeRatio * 2.5;
      ctx.setLineDash([8, 6]);
      ctx.rotate(this.elapsedTime * (4 + chargeRatio * 10));
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
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
      ctx.arc(p.x, p.y, 22 * scale, 0, Math.PI * 2);
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
      ctx.globalAlpha = 0.48;
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

    // Tactical Micro-HP Bar & Hold-[Q] Charge Bar directly beneath player ship
    if (this.gameState === 'PLAYING') {
      const barW = 44 * Math.max(1, scale * 0.85);
      const barH = 4.5;
      const bx = p.x - barW * 0.5;
      const by = p.y + 24 * scale + 6;
      const hpRatio = Math.max(0, Math.min(1, p.hp / Math.max(1, p.maxHp)));

      ctx.save();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

      ctx.fillStyle =
        hpRatio > 0.5 ? '#10B981' : hpRatio > 0.25 ? '#F59E0B' : '#EF4444';
      ctx.fillRect(bx, by, barW * hpRatio, barH);

      if (p.isChargingDash && p.holdChargeTimer > 0.04) {
        const chargeRatio = Math.min(1, p.holdChargeTimer / 1.05);
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(bx - 1, by + barH + 2, barW + 2, 4);
        ctx.fillStyle = chargeRatio >= 0.99 ? '#FDE047' : ship.dashColor;
        ctx.fillRect(bx, by + barH + 2.5, barW * chargeRatio, 3);
      }
      ctx.restore();
    }

    // Precision PC Mouse Reticle
    if (this.hasPointerAim && this.gameState === 'PLAYING') {
      ctx.save();
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(this.mouseX, this.mouseY, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ship.accentColor;
      ctx.beginPath();
      ctx.arc(this.mouseX, this.mouseY, 2.4, 0, Math.PI * 2);
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
    const shipDef = SHIPS[shipId] ?? SHIPS.vanguard;
    const hullScale = shipDef.hullScale ?? 1.0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(squashX * hullScale, squashY * hullScale);

    ctx.fillStyle = flash ? 'rgba(255, 255, 255, 0.35)' : `${accentColor}24`;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Mythic & High-Tier Outer Floating Rings / Blades before main hull
    if (shipId === 'omega') {
      ctx.strokeStyle = flash ? '#FFFFFF' : shipDef.dashSecondaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-2, 0, 18, -Math.PI * 0.72, Math.PI * 0.72);
      ctx.stroke();
    } else if (shipId === 'celestia') {
      ctx.strokeStyle = flash ? '#FFFFFF' : '#FDE047';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(-5, 0, 21, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shipId === 'hyperion') {
      // Rotating laser shuriken halo
      ctx.save();
      ctx.rotate(this.elapsedTime * 5);
      ctx.strokeStyle = flash ? '#FFFFFF' : '#FACC15';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-14, -14, 28, 28);
      ctx.restore();
    } else if (shipId === 'apocalypse') {
      // Sovereign 100k Flagship floating Excalibur wing blades & sacred halo
      ctx.strokeStyle = flash ? '#FFFFFF' : '#FACC15';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(-3, 0, 24, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = flash ? '#FFFFFF' : '#E11D48';
      ctx.beginPath();
      ctx.moveTo(10, -24);
      ctx.lineTo(-16, -28);
      ctx.lineTo(-10, -19);
      ctx.closePath();
      ctx.moveTo(10, 24);
      ctx.lineTo(-16, 28);
      ctx.lineTo(-10, 19);
      ctx.closePath();
      ctx.fill();
    }

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
      case 'omega':
        // Heavy twin-prong siege dreadnought
        ctx.moveTo(24, -4);
        ctx.lineTo(14, -4);
        ctx.lineTo(8, -17);
        ctx.lineTo(-15, -15);
        ctx.lineTo(-11, -5);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-11, 5);
        ctx.lineTo(-15, 15);
        ctx.lineTo(8, 17);
        ctx.lineTo(14, 4);
        ctx.lineTo(24, 4);
        ctx.lineTo(19, 0);
        break;
      case 'celestia':
        // 6-wing seraphic angelic cruiser
        ctx.moveTo(25, 0);
        ctx.lineTo(9, -7);
        ctx.lineTo(3, -20);
        ctx.lineTo(-5, -11);
        ctx.lineTo(-16, -18);
        ctx.lineTo(-11, -5);
        ctx.lineTo(-19, 0);
        ctx.lineTo(-11, 5);
        ctx.lineTo(-16, 18);
        ctx.lineTo(-5, 11);
        ctx.lineTo(3, 20);
        ctx.lineTo(9, 7);
        break;
      case 'leviathan':
        // Abyssal void dragon flagship with forward mandibles
        ctx.moveTo(25, -5);
        ctx.lineTo(13, -2);
        ctx.lineTo(25, 5);
        ctx.lineTo(6, 12);
        ctx.lineTo(-4, 21);
        ctx.lineTo(-17, 13);
        ctx.lineTo(-12, 4);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-12, -4);
        ctx.lineTo(-17, -13);
        ctx.lineTo(-4, -21);
        ctx.lineTo(6, -12);
        break;
      case 'hyperion':
        // 4-blade cybernetic flash shuriken interceptor
        ctx.moveTo(26, 0);
        ctx.lineTo(6, -7);
        ctx.lineTo(2, -21);
        ctx.lineTo(-5, -8);
        ctx.lineTo(-20, -13);
        ctx.lineTo(-11, 0);
        ctx.lineTo(-20, 13);
        ctx.lineTo(-5, 8);
        ctx.lineTo(2, 21);
        ctx.lineTo(6, 7);
        break;
      case 'apocalypse':
        // 100.000 Mảnh Sao Sovereign Titan-God Flagship
        ctx.moveTo(28, 0);
        ctx.lineTo(15, -8);
        ctx.lineTo(18, -16);
        ctx.lineTo(2, -22);
        ctx.lineTo(-6, -13);
        ctx.lineTo(-19, -20);
        ctx.lineTo(-14, -7);
        ctx.lineTo(-22, 0);
        ctx.lineTo(-14, 7);
        ctx.lineTo(-19, 20);
        ctx.lineTo(-6, 13);
        ctx.lineTo(2, 22);
        ctx.lineTo(18, 16);
        ctx.lineTo(15, 8);
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

    // Inner Armored Core & Reactor Gem
    ctx.fillStyle = flash ? '#FFFFFF' : accentColor;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -6.5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 6.5);
    ctx.closePath();
    ctx.fill();

    if (hullScale >= 1.25) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(2, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    }

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
      ctx.translate(b.x, b.y);
      const ang = Math.atan2(b.vy, b.vx);

      if (b.shape === 'lance') {
        // Long plasma spear projectile
        ctx.rotate(ang);
        ctx.fillStyle = b.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.radius * 2.6, b.radius * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(b.radius * 2.2, 0);
        ctx.lineTo(-b.radius * 1.4, -b.radius * 0.7);
        ctx.lineTo(-b.radius * 0.8, 0);
        ctx.lineTo(-b.radius * 1.4, b.radius * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(b.radius * 1.4, 0);
        ctx.lineTo(-b.radius * 0.6, -b.radius * 0.28);
        ctx.lineTo(-b.radius * 0.6, b.radius * 0.28);
        ctx.closePath();
        ctx.fill();
      } else if (b.shape === 'crescent') {
        // Sweeping scythe/crescent wave blade (destructible by player fire!)
        ctx.rotate(ang);
        ctx.fillStyle = b.color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius * 1.25, -1.15, 1.15, false);
        ctx.arc(-b.radius * 0.45, 0, b.radius * 1.1, 1.0, -1.0, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (b.shape === 'mine') {
        // Pulsing spiked bomb mine (destructible)
        ctx.rotate(this.elapsedTime * 3.5);
        const pulse = 1 + Math.sin(this.elapsedTime * 12) * 0.16;
        ctx.fillStyle = b.color;
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI * 2) / 8;
          const r = (i % 2 === 0 ? b.radius * 1.28 : b.radius * 0.65) * pulse;
          const rx = Math.cos(a) * r;
          const ry = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // High-contrast plasma core orb
        ctx.fillStyle = b.color;
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius + 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF1F2';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D): void {
    const armorTier = Math.min(3, Math.floor(this.wave / 4));

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
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      if (
        (e.type === 'charger' ||
          e.type === 'shooter' ||
          e.type === 'sniper' ||
          e.type === 'juggernaut' ||
          e.isBoss) &&
        e.state === 'windup'
      ) {
        const maxT = e.type === 'sniper' ? 0.95 : 0.75;
        const t = Math.max(0, Math.min(1, 1 - e.stateTimer / maxT));
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.3 + t * 0.65;
        ctx.lineWidth = e.type === 'sniper' ? 2.4 : 1.5 + t * 1.5;
        ctx.setLineDash(e.type === 'sniper' ? [14, 6] : [8, 6]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        const aimLen = e.type === 'sniper' ? 880 : 360;
        ctx.lineTo(e.x + e.aimX * aimLen, e.y + e.aimY * aimLen);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 14 * (1 - t), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if ((e.type === 'pulsar' || e.type === 'vortex') && e.state === 'windup') {
        const t = Math.max(0, Math.min(1, 1 - e.stateTimer / 0.85));
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.35 + t * 0.55;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 22 * (1 - t), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);
      ctx.scale(e.squash, 2 - e.squash);

      const flash = e.hitFlash > 0;

      // Progressive Wave Armor Evolution Fin Plates for higher waves
      if (armorTier >= 1 && !e.isBoss && e.type !== 'shardling') {
        ctx.strokeStyle = flash ? '#FFFFFF' : color;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 3.5, -0.8, 0.8);
        if (armorTier >= 2) {
          ctx.moveTo(-e.radius * 0.4, -e.radius * 1.15);
          ctx.lineTo(e.radius * 0.3, -e.radius * 0.85);
          ctx.moveTo(-e.radius * 0.4, e.radius * 1.15);
          ctx.lineTo(e.radius * 0.3, e.radius * 0.85);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

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
      } else if (e.type === 'sniper') {
        // Long railgun sniper craft
        ctx.strokeStyle = flash ? '#FFFFFF' : color;
        ctx.fillStyle = flash ? '#FFFFFF' : 'rgba(244, 63, 94, 0.26)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(e.radius * 1.55, 0);
        ctx.lineTo(-e.radius * 0.3, -e.radius * 0.85);
        ctx.lineTo(-e.radius, -e.radius * 0.35);
        ctx.lineTo(-e.radius * 0.7, 0);
        ctx.lineTo(-e.radius, e.radius * 0.35);
        ctx.lineTo(-e.radius * 0.3, e.radius * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.type === 'bomber') {
        // Heavy twin-pod mine layer
        ctx.strokeStyle = flash ? '#FFFFFF' : color;
        ctx.fillStyle = flash ? '#FFFFFF' : 'rgba(251, 146, 60, 0.26)';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.roundRect(-e.radius * 0.9, -e.radius * 0.85, e.radius * 1.8, e.radius * 1.7, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'vortex') {
        // Spinning gravitational ring entity
        ctx.strokeStyle = flash ? '#FFFFFF' : color;
        ctx.fillStyle = flash ? '#FFFFFF' : 'rgba(192, 132, 252, 0.24)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const a = (s * Math.PI * 2) / 6;
          const r = s % 2 === 0 ? e.radius * 1.15 : e.radius * 0.65;
          const rx = Math.cos(a) * r;
          const ry = Math.sin(a) * r;
          if (s === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.type === 'juggernaut') {
        // Armored siege dreadnought
        ctx.strokeStyle = flash ? '#FFFFFF' : color;
        ctx.fillStyle = flash ? '#FFFFFF' : 'rgba(52, 211, 153, 0.25)';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(e.radius * 1.2, -e.radius * 0.45);
        ctx.lineTo(e.radius * 0.3, -e.radius * 1.05);
        ctx.lineTo(-e.radius, -e.radius * 0.85);
        ctx.lineTo(-e.radius * 0.8, 0);
        ctx.lineTo(-e.radius, e.radius * 0.85);
        ctx.lineTo(e.radius * 0.3, e.radius * 1.05);
        ctx.lineTo(e.radius * 1.2, e.radius * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
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
        // Multi-ring Boss Dreadnought Architecture
        ctx.save();
        ctx.rotate(-this.elapsedTime * 0.9);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 1.22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.strokeStyle = flash ? '#FFFFFF' : color;
        ctx.fillStyle = flash ? 'rgba(255,255,255,0.85)' : `${color}33`;
        ctx.lineWidth = 3.5;

        const points =
          e.type === 'boss_chronovore'
            ? 12
            : e.type === 'boss_hydra'
            ? 10
            : e.type === 'boss_valkyria'
            ? 6
            : 8;
        ctx.beginPath();
        for (let s = 0; s < points; s++) {
          const a = (s * Math.PI * 2) / points;
          const r =
            s % 2 === 0
              ? e.radius * (e.type === 'boss_valkyria' ? 1.15 : 1.0)
              : e.radius * (e.type === 'boss_valkyria' ? 0.55 : 0.72);
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
        ctx.arc(0, 0, e.radius * 0.36, 0, Math.PI * 2);
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
