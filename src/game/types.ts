export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PERK_SELECT' | 'PAUSED' | 'GAME_OVER';

export type GameMode = 'arcade' | 'boss_rush' | 'hardcore';

export type DashDirectionMode = 'mouse' | 'movement';

export type ShipId =
  | 'vanguard'
  | 'phantom'
  | 'titan'
  | 'nova'
  | 'valkyrie'
  | 'eclipse'
  | 'tempest'
  | 'solaris'
  | 'aether'
  | 'chronos'
  | 'omega'
  | 'celestia'
  | 'leviathan'
  | 'hyperion'
  | 'apocalypse';

export type DashEffectStyle =
  | 'solar_flare'
  | 'void_lightning'
  | 'bastion_wave'
  | 'supernova_burst'
  | 'crimson_lance'
  | 'shadow_rift'
  | 'ion_tempest'
  | 'golden_phoenix'
  | 'prism_mirror'
  | 'chrono_warp'
  | 'omega_burst'
  | 'starlight_step'
  | 'abyss_tide'
  | 'ricochet_blade'
  | 'dimension_slash';

export type WeaponType = 'pulse' | 'spread' | 'rail' | 'missile';

export type BoostType = 'rapid_fire' | 'hyper_speed' | 'damage_surge' | 'hyper_magnet';

export type EnemyType =
  | 'drifter'
  | 'charger'
  | 'prism'
  | 'pulsar'
  | 'shardling'
  | 'chaser'
  | 'shooter'
  | 'tank'
  | 'sniper'
  | 'bomber'
  | 'vortex'
  | 'juggernaut'
  | 'boss_aegis'
  | 'boss_hydra'
  | 'boss_valkyria'
  | 'boss_chronovore';

export type HangarUpgradeId = 'hull' | 'firepower' | 'thruster' | 'magnet' | 'overdrive';

export interface KeybindConfig {
  up: string;
  down: string;
  left: string;
  right: string;
  dash: string;
  overdrive: string;
  fire: string;
  pause: string;
}

export interface SectorTheme {
  id: string;
  name: string;
  subtitle: string;
  bgBase: string;
  nebulaCore: string;
  nebulaOuter: string;
  gridColor: string;
  borderColor: string;
  cornerColor: string;
  starColor: string;
  accentHex: string;
}

export interface ShipConfig {
  id: ShipId;
  name: string;
  role: string;
  description: string;
  cost: number;
  baseHp: number;
  baseShields: number;
  speedMult: number;
  fireRateMult: number;
  damageMult: number;
  defaultWeapon: WeaponType;
  accentColor: string;
  trailColor: string;
  dashColor: string;
  dashSecondaryColor: string;
  dashEffectName: string;
  dashEffectDesc: string;
  dashStyle: DashEffectStyle;
  chargeSkillName: string;
  chargeSkillDesc: string;
  overdriveEffectName: string;
  overdriveEffectDesc: string;
  hullScale: number;
  isMythic?: boolean;
  stats: {
    speed: number;
    shield: number;
    firepower: number;
    utility: number;
  };
}

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  shortDesc: string;
  color: string;
}

export interface PerkDefinition {
  id: string;
  name: string;
  category: 'Vũ Khí' | 'Hỏa Lực' | 'Phòng Thủ' | 'Cơ Động';
  rarity: 'common' | 'rare' | 'epic';
  description: string;
  weaponUnlock?: WeaponType;
}

export interface HangarUpgradeDefinition {
  id: HangarUpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costStep: number;
  unitLabel: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  rewardShards: number;
}

export interface PlayerProfile {
  starShards: number;
  unlockedShips: ShipId[];
  selectedShip: ShipId;
  selectedMode: GameMode;
  dashDirectionMode: DashDirectionMode;
  hangarLevels: Record<HangarUpgradeId, number>;
  achievements: Record<string, number>;
  bestScores: Record<GameMode, number>;
  keybinds: KeybindConfig;
  stats: {
    totalRuns: number;
    totalKills: number;
    totalBossKills: number;
    highestWave: number;
  };
}

export interface BossHudInfo {
  name: string;
  subtitle: string;
  hp: number;
  maxHp: number;
  phase: number;
}

export interface ActiveBoostHud {
  type: BoostType;
  label: string;
  color: string;
  remaining: number;
  duration: number;
}

export interface LiveCombatStats {
  damageBonusPct: number;
  fireRateBonusPct: number;
  speedBonusPct: number;
  bonusMaxHp: number;
  hpRegenPerSec: number;
  dashCooldownSec: number;
  magnetRadiusPx: number;
  shardBonusPct: number;
  overdriveGainBonusPct: number;
  extraBarrels: number;
  bonusPierce: number;
  hangarLevels: Record<HangarUpgradeId, number>;
}

export interface HudSnapshot {
  score: number;
  bestScore: number;
  multiplier: number;
  comboProgress: number;
  wave: number;
  waveProgress: number;
  hp: number;
  maxHp: number;
  shields: number;
  maxShields: number;
  dashCharge: number;
  holdChargeRatio: number;
  overdriveCharge: number;
  overdriveActive: boolean;
  overdriveTimeLeft: number;
  weapon: WeaponType;
  weaponLevel: number;
  runShards: number;
  totalShards: number;
  enemiesDefeated: number;
  bossesDefeated: number;
  waveBanner: string | null;
  sectorName: string;
  sectorSubtitle: string;
  sectorAccent: string;
  isNewBest: boolean;
  mode: GameMode;
  shipId: ShipId;
  dashDirectionMode: DashDirectionMode;
  activePerks: string[];
  perkChoices: PerkDefinition[];
  activeBoosts: ActiveBoostHud[];
  boss: BossHudInfo | null;
  liveStats: LiveCombatStats;
}

export interface Star {
  x: number;
  y: number;
  depth: number;
  size: number;
  alpha: number;
  twinkleOffset: number;
}

export interface PlayerBullet {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  radius: number;
  angle: number;
  damage: number;
  pierce: number;
  homing: boolean;
  color: string;
  shape?: 'bolt' | 'crescent' | 'orb' | 'star' | 'beam_node';
  hitEnemyIds: Set<number>;
}

export interface EnemyBullet {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife?: number;
  radius: number;
  color: string;
  damage: number;
  shape?: 'lance' | 'crescent' | 'orb' | 'mine';
  destructible?: boolean;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  points: number;
  spawnTimer: number;
  hitFlash: number;
  squash: number;
  isElite: boolean;
  isBoss: boolean;
  bossPhase: number;
  state: 'chase' | 'windup' | 'lunge' | 'recover' | 'orbit' | 'laser_sweep' | 'spiral_volley';
  stateTimer: number;
  secondaryTimer: number;
  aimX: number;
  aimY: number;
  orbitDir: number;
}

export interface Shard {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  value: number;
  shardCurrency: number;
  isRepair: boolean;
  weaponDrop?: WeaponType;
}

export interface BoostPickup {
  active: boolean;
  type: BoostType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  drag: number;
}

export interface Shockwave {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
  lineWidth: number;
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface DashGhost {
  x: number;
  y: number;
  angle: number;
  alpha: number;
  shipId: ShipId;
  color: string;
  secondaryColor: string;
  scale: number;
}
