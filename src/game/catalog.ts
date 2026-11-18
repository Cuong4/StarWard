import {
  AchievementDefinition,
  BoostType,
  GameMode,
  HangarUpgradeDefinition,
  HangarUpgradeId,
  KeybindConfig,
  PerkDefinition,
  PlayerProfile,
  SectorTheme,
  ShipConfig,
  ShipId,
  WeaponConfig,
  WeaponType,
} from './types';

export const PROFILE_STORAGE_KEY = 'starward_profile_v3';

export const DEFAULT_KEYBINDS: KeybindConfig = {
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  dash: 'KeyQ',
  overdrive: 'KeyE',
  fire: 'Space',
  pause: 'Escape',
};

export function formatKeyLabel(code: string): string {
  if (!code) return '---';
  if (code.startsWith('Key')) return code.slice(3).toUpperCase();
  if (code.startsWith('Digit')) return code.slice(5);
  switch (code) {
    case 'Space':
      return 'SPACE';
    case 'ShiftLeft':
      return 'SHIFT TRÁI';
    case 'ShiftRight':
      return 'SHIFT PHẢI';
    case 'ControlLeft':
      return 'CTRL TRÁI';
    case 'ControlRight':
      return 'CTRL PHẢI';
    case 'AltLeft':
      return 'ALT TRÁI';
    case 'AltRight':
      return 'ALT PHẢI';
    case 'Escape':
      return 'ESC';
    case 'Tab':
      return 'TAB';
    case 'Enter':
      return 'ENTER';
    case 'ArrowUp':
      return '↑';
    case 'ArrowDown':
      return '↓';
    case 'ArrowLeft':
      return '←';
    case 'ArrowRight':
      return '→';
    default:
      return code.toUpperCase();
  }
}

export const SECTOR_THEMES: SectorTheme[] = [
  {
    id: 'amber_frontier',
    name: 'VÀNH ĐAI HỔ PHÁCH',
    subtitle: 'Khu Vực Biên Giới Tinh Hà · Sector 01',
    bgBase: '#070B14',
    nebulaCore: 'rgba(245, 158, 11, 0.16)',
    nebulaOuter: 'rgba(30, 58, 138, 0.14)',
    gridColor: 'rgba(245, 158, 11, 0.055)',
    borderColor: 'rgba(245, 158, 11, 0.24)',
    cornerColor: '#F59E0B',
    starColor: '248, 250, 252',
    accentHex: '#F59E0B',
  },
  {
    id: 'crimson_nebula',
    name: 'TINH VÂN HỒNG NGỌC',
    subtitle: 'Bão Bụi Sao Đỏ Thẫm · Sector 02',
    bgBase: '#12060C',
    nebulaCore: 'rgba(244, 63, 94, 0.20)',
    nebulaOuter: 'rgba(136, 19, 55, 0.16)',
    gridColor: 'rgba(251, 113, 133, 0.06)',
    borderColor: 'rgba(244, 63, 94, 0.28)',
    cornerColor: '#FB7185',
    starColor: '255, 228, 230',
    accentHex: '#F43F5E',
  },
  {
    id: 'quantum_abyss',
    name: 'VỰC THẲM LƯỢNG TỬ',
    subtitle: 'Không Gian Điện Từ Xanh Lam · Sector 03',
    bgBase: '#040D1A',
    nebulaCore: 'rgba(56, 189, 248, 0.20)',
    nebulaOuter: 'rgba(14, 116, 144, 0.16)',
    gridColor: 'rgba(56, 189, 248, 0.065)',
    borderColor: 'rgba(56, 189, 248, 0.28)',
    cornerColor: '#38BDF8',
    starColor: '224, 242, 254',
    accentHex: '#38BDF8',
  },
  {
    id: 'emerald_storm',
    name: 'BÃO TỪ NGỌC LỤC BẢO',
    subtitle: 'Trường Ion Xanh Lục Bảo · Sector 04',
    bgBase: '#04120E',
    nebulaCore: 'rgba(16, 185, 129, 0.19)',
    nebulaOuter: 'rgba(6, 95, 70, 0.16)',
    gridColor: 'rgba(52, 211, 153, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.28)',
    cornerColor: '#34D399',
    starColor: '209, 250, 229',
    accentHex: '#10B981',
  },
  {
    id: 'amethyst_horizon',
    name: 'CHÂN TRỜI THẠCH ANH TÍM',
    subtitle: 'Vùng Xoáy Trọng Trường Tím · Sector 05',
    bgBase: '#0D0618',
    nebulaCore: 'rgba(168, 85, 247, 0.21)',
    nebulaOuter: 'rgba(88, 28, 135, 0.16)',
    gridColor: 'rgba(192, 132, 252, 0.06)',
    borderColor: 'rgba(168, 85, 247, 0.28)',
    cornerColor: '#C084FC',
    starColor: '243, 232, 255',
    accentHex: '#A855F7',
  },
  {
    id: 'cryo_aurora',
    name: 'CỰC QUANG BĂNG GIÁ',
    subtitle: 'Tinh Vân Tuyết Lạnh Vĩnh Cửu · Sector 06',
    bgBase: '#051019',
    nebulaCore: 'rgba(34, 211, 238, 0.20)',
    nebulaOuter: 'rgba(59, 130, 246, 0.16)',
    gridColor: 'rgba(103, 232, 249, 0.065)',
    borderColor: 'rgba(34, 211, 238, 0.30)',
    cornerColor: '#22D3EE',
    starColor: '207, 250, 254',
    accentHex: '#06B6D4',
  },
  {
    id: 'solaris_core',
    name: 'LÒ PHẢN ỨNG THÁI DƯƠNG',
    subtitle: 'Quầng Lửa Hoàng Kim Rực Cháy · Sector 07',
    bgBase: '#140B04',
    nebulaCore: 'rgba(251, 146, 60, 0.22)',
    nebulaOuter: 'rgba(180, 83, 9, 0.16)',
    gridColor: 'rgba(251, 191, 36, 0.065)',
    borderColor: 'rgba(251, 146, 60, 0.30)',
    cornerColor: '#FB923C',
    starColor: '254, 243, 199',
    accentHex: '#F97316',
  },
  {
    id: 'cyber_matrix',
    name: 'MẠNG LƯỚI SIÊU KHÔNG GIAN',
    subtitle: 'Chiều Không Gian Đa Tần Số · Sector 08',
    bgBase: '#090818',
    nebulaCore: 'rgba(129, 140, 248, 0.21)',
    nebulaOuter: 'rgba(236, 72, 153, 0.15)',
    gridColor: 'rgba(129, 140, 248, 0.065)',
    borderColor: 'rgba(129, 140, 248, 0.30)',
    cornerColor: '#818CF8',
    starColor: '224, 231, 255',
    accentHex: '#6366F1',
  },
];

export const BOOST_DEFS: Record<
  BoostType,
  {
    id: BoostType;
    name: string;
    shortLabel: string;
    color: string;
    duration: number;
    description: string;
  }
> = {
  rapid_fire: {
    id: 'rapid_fire',
    name: 'CUỒNG BẠO TỐC BẮN',
    shortLabel: 'TỐC BẮN +65%',
    color: '#F59E0B',
    duration: 7.5,
    description: 'Tăng 65% tốc độ khai hỏa trong 7.5 giây',
  },
  hyper_speed: {
    id: 'hyper_speed',
    name: 'ĐỘNG CƠ SIÊU TỐC',
    shortLabel: 'TỐC CHẠY +55%',
    color: '#38BDF8',
    duration: 7.5,
    description: 'Tăng 55% tốc độ di chuyển & hồi Lướt nhanh gấp đôi trong 7.5 giây',
  },
  damage_surge: {
    id: 'damage_surge',
    name: 'ĐẠN QUÁ TẢI HỎA LỰC',
    shortLabel: 'SÁT THƯƠNG +60%',
    color: '#F43F5E',
    duration: 7.5,
    description: 'Tăng 60% sát thương & +1 xuyên giáp trong 7.5 giây',
  },
  hyper_magnet: {
    id: 'hyper_magnet',
    name: 'TỪ TRƯỜNG SIÊU CẤP',
    shortLabel: 'HÚT SAO TOÀN BẢN ĐỒ',
    color: '#A855F7',
    duration: 7.5,
    description: 'Hút toàn bộ Mảnh Sao trên bản đồ & tăng nhanh thanh Overdrive',
  },
};

export const GAME_MODES: {
  id: GameMode;
  name: string;
  subtitle: string;
  description: string;
  shardMultiplier: string;
}[] = [
  {
    id: 'arcade',
    name: 'Hành Trình',
    subtitle: 'Chuẩn cân bằng',
    description:
      'Chiến đấu qua từng khu vực tinh vân biến đổi liên tục, nhặt vật phẩm Boost, ghép thẻ kỹ năng mỗi wave và chạm trán Boss mỗi 3 wave.',
    shardMultiplier: 'x1.0 Mảnh Sao',
  },
  {
    id: 'boss_rush',
    name: 'Săn Trùm',
    subtitle: 'Liên hoàn Boss',
    description:
      'Đối đầu trực diện với các siêu Boss cùng đội hộ vệ Tinh Anh ngay từ Wave 1. Tỷ lệ rơi vật phẩm Boost cao gấp đôi.',
    shardMultiplier: 'x1.5 Mảnh Sao',
  },
  {
    id: 'hardcore',
    name: 'Sinh Tồn Khắc Nghiệt',
    subtitle: '1 Sinh Mạng duy nhất',
    description:
      'Chỉ có 1 Sinh Mạng không thể hồi phục, tốc độ quái tăng 25% nhưng điểm số và Mảnh Sao nhận được nhân đôi.',
    shardMultiplier: 'x2.0 Mảnh Sao',
  },
];

export const SHIPS: Record<ShipId, ShipConfig> = {
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard MK-II',
    role: 'Tiêm Kích Cân Bằng',
    description:
      'Chiến cơ tiêu chuẩn của hạm đội với độ cơ động ổn định và súng Xung Đơn chính xác.',
    cost: 0,
    baseShields: 3,
    speedMult: 1.0,
    fireRateMult: 1.0,
    damageMult: 1.0,
    defaultWeapon: 'pulse',
    accentColor: '#F59E0B',
    trailColor: '#FBBF24',
    dashColor: '#F59E0B',
    dashSecondaryColor: '#FEF08A',
    dashEffectName: 'Lướt Lửa Mặt Trời',
    dashEffectDesc: 'Tạo tàn ảnh Hổ Phách rực cháy và phóng 4 tia lửa mặt trời đẩy lùi kẻ địch.',
    dashStyle: 'solar_flare',
    stats: { speed: 7, shield: 6, firepower: 6, utility: 7 },
  },
  phantom: {
    id: 'phantom',
    name: 'Bóng Ma X-09',
    role: 'Sát Thủ Tốc Độ',
    description:
      'Thân vỏ siêu nhẹ giúp bay cực nhanh và hồi Lướt thần tốc, trang bị sẵn Pháo Tán Xạ càn quét tầm gần.',
    cost: 80,
    baseShields: 2,
    speedMult: 1.25,
    fireRateMult: 1.15,
    damageMult: 1.05,
    defaultWeapon: 'spread',
    accentColor: '#38BDF8',
    trailColor: '#7DD3FC',
    dashColor: '#38BDF8',
    dashSecondaryColor: '#E0F2FE',
    dashEffectName: 'Lướt Chớp Hư Không',
    dashEffectDesc: 'Để lại chuỗi phân thân Điện Quang Xanh và phóng 6 tia chớp xuyên thấu.',
    dashStyle: 'void_lightning',
    stats: { speed: 10, shield: 4, firepower: 8, utility: 8 },
  },
  valkyrie: {
    id: 'valkyrie',
    name: 'Chiến Thần Valkyrie',
    role: 'Xung Kích Cận Chiến',
    description:
      'Cánh kiếm khí động học chuyên áp sát tốc độ cao, chém đôi đội hình địch mỗi khi kích hoạt Lướt.',
    cost: 130,
    baseShields: 3,
    speedMult: 1.18,
    fireRateMult: 1.12,
    damageMult: 1.18,
    defaultWeapon: 'spread',
    accentColor: '#F43F5E',
    trailColor: '#FDA4AF',
    dashColor: '#E11D48',
    dashSecondaryColor: '#FFE4E6',
    dashEffectName: 'Lướt Huyết Kiếm',
    dashEffectDesc: 'Phóng 3 lưỡi kiếm plasma Đỏ Hồng Ngọc khổng lồ chém xuyên mục tiêu phía trước.',
    dashStyle: 'crimson_lance',
    stats: { speed: 9, shield: 6, firepower: 9, utility: 7 },
  },
  titan: {
    id: 'titan',
    name: 'Pháo Đài Titan',
    role: 'Thiết Giáp Hạng Nặng',
    description:
      'Sở hữu 5 Sinh Mạng khởi đầu cùng Pháo Tia Xuyên phá giáp, nghiền nát cả đội hình Tank và Prism.',
    cost: 180,
    baseShields: 5,
    speedMult: 0.88,
    fireRateMult: 0.94,
    damageMult: 1.35,
    defaultWeapon: 'rail',
    accentColor: '#10B981',
    trailColor: '#6EE7B7',
    dashColor: '#10B981',
    dashSecondaryColor: '#A7F3D0',
    dashEffectName: 'Lướt Chấn Động Lục Bảo',
    dashEffectDesc: 'Gây vụ nổ địa chấn Ngọc Lục Bảo cực mạnh hất văng và làm choáng quái xung quanh.',
    dashStyle: 'bastion_wave',
    stats: { speed: 5, shield: 10, firepower: 9, utility: 6 },
  },
  tempest: {
    id: 'tempest',
    name: 'Cuồng Phong Tempest',
    role: 'Pháo Kích Điện Từ',
    description:
      'Tích hợp cuộn cảm ứng từ trường cao áp, bắn đạn xung tốc độ cực nhanh và phóng hồ quang khi Lướt.',
    cost: 220,
    baseShields: 3,
    speedMult: 1.16,
    fireRateMult: 1.28,
    damageMult: 1.1,
    defaultWeapon: 'pulse',
    accentColor: '#06B6D4',
    trailColor: '#67E8F9',
    dashColor: '#22D3EE',
    dashSecondaryColor: '#CFFAFE',
    dashEffectName: 'Lướt Bão Điện Từ',
    dashEffectDesc: 'Giật sét hồ quang Lam Ngọc liên hoàn vào tối đa 5 kẻ địch gần nhất và xóa đạn gần thân.',
    dashStyle: 'ion_tempest',
    stats: { speed: 8, shield: 6, firepower: 9, utility: 9 },
  },
  eclipse: {
    id: 'eclipse',
    name: 'Nhật Thực Eclipse',
    role: 'Chiến Cơ Bóng Tối',
    description:
      'Chiến cơ tàng hình không gian sâu, hấp thụ đạn địch trên đường Lướt để chuyển hóa thành năng lượng Overdrive.',
    cost: 270,
    baseShields: 3,
    speedMult: 1.2,
    fireRateMult: 1.1,
    damageMult: 1.25,
    defaultWeapon: 'rail',
    accentColor: '#A855F7',
    trailColor: '#D8B4FE',
    dashColor: '#9333EA',
    dashSecondaryColor: '#F3E8FF',
    dashEffectName: 'Lướt Vết Nứt Hắc Ám',
    dashEffectDesc: 'Xóa sạch đạn địch trên quỹ đạo lướt, tạo hố đen Tím Thạch Anh hút và gây sát thương.',
    dashStyle: 'shadow_rift',
    stats: { speed: 9, shield: 6, firepower: 9, utility: 10 },
  },
  nova: {
    id: 'nova',
    name: 'Siêu Tân Tinh Nova',
    role: 'Pháo Thủ Dẫn Đường',
    description:
      'Tích hợp hệ thống Tên Lửa Dẫn Đường tự tìm mục tiêu và tốc độ sạc Chiêu Cuối Overdrive nhanh vượt trội.',
    cost: 320,
    baseShields: 3,
    speedMult: 1.14,
    fireRateMult: 1.15,
    damageMult: 1.22,
    defaultWeapon: 'missile',
    accentColor: '#EC4899',
    trailColor: '#F9A8D4',
    dashColor: '#EC4899',
    dashSecondaryColor: '#FCE7F3',
    dashEffectName: 'Lướt Sao Băng Truy Kích',
    dashEffectDesc: 'Phóng 6 quả tên lửa vi mô Hồng Tinh Vân tự động truy đuổi mọi mục tiêu trên màn hình.',
    dashStyle: 'supernova_burst',
    stats: { speed: 8, shield: 7, firepower: 9, utility: 10 },
  },
  solaris: {
    id: 'solaris',
    name: 'Thái Dương Solaris',
    role: 'Hỏa Phụng Hoàng Kim',
    description:
      'Động cơ nhiệt hạch mặt trời tỏa nhiệt lượng khổng lồ, biến mỗi cú Lướt thành một dải lửa thiêu rụi chiến trường.',
    cost: 380,
    baseShields: 4,
    speedMult: 1.15,
    fireRateMult: 1.2,
    damageMult: 1.32,
    defaultWeapon: 'spread',
    accentColor: '#F97316',
    trailColor: '#FDBA74',
    dashColor: '#F97316',
    dashSecondaryColor: '#FFEDD5',
    dashEffectName: 'Lướt Phượng Hoàng Lửa',
    dashEffectDesc: 'Trải thảm cầu lửa Hoàng Kim dọc theo toàn bộ đường bay và nổ tung thành 10 tia lửa.',
    dashStyle: 'golden_phoenix',
    stats: { speed: 8, shield: 8, firepower: 10, utility: 9 },
  },
  aether: {
    id: 'aether',
    name: 'Lăng Kính Aether',
    role: 'Thiết Giáp Quang Học',
    description:
      'Thân tàu cấu tạo từ tinh thể khúc xạ ánh sáng, bắn tia Railgun siêu tốc và phát tán chùm laser 8 hướng khi Lướt.',
    cost: 450,
    baseShields: 4,
    speedMult: 1.18,
    fireRateMult: 1.18,
    damageMult: 1.38,
    defaultWeapon: 'rail',
    accentColor: '#34D399',
    trailColor: '#A7F3D0',
    dashColor: '#2DD4BF',
    dashSecondaryColor: '#CCFBF1',
    dashEffectName: 'Lướt Khúc Xạ Lăng Kính',
    dashEffectDesc: 'Bắn đồng loạt 8 tia Laser Ngọc Bích xuyên thấu toàn bộ màn hình theo 8 hướng.',
    dashStyle: 'prism_mirror',
    stats: { speed: 9, shield: 8, firepower: 10, utility: 10 },
  },
  chronos: {
    id: 'chronos',
    name: 'Thời Không Chronos',
    role: 'Soái Hạm Tối Thượng',
    description:
      'Đỉnh cao công nghệ xuyên không gian: bẻ cong thời gian khi Lướt, làm chậm mọi kẻ địch và phóng mưa tên lửa lượng tử.',
    cost: 550,
    baseShields: 4,
    speedMult: 1.26,
    fireRateMult: 1.25,
    damageMult: 1.42,
    defaultWeapon: 'missile',
    accentColor: '#818CF8',
    trailColor: '#C7D2FE',
    dashColor: '#6366F1',
    dashSecondaryColor: '#E0E7FF',
    dashEffectName: 'Lướt Bẻ Cong Thời Không',
    dashEffectDesc: 'Đóng băng tốc độ quái & xóa đạn xung quanh, phóng 8 đạn lượng tử và nạp +12% Overdrive.',
    dashStyle: 'chrono_warp',
    stats: { speed: 10, shield: 9, firepower: 10, utility: 10 },
  },
};

export const SHIP_LIST: ShipConfig[] = [
  SHIPS.vanguard,
  SHIPS.phantom,
  SHIPS.valkyrie,
  SHIPS.titan,
  SHIPS.tempest,
  SHIPS.eclipse,
  SHIPS.nova,
  SHIPS.solaris,
  SHIPS.aether,
  SHIPS.chronos,
];

export const WEAPONS: Record<WeaponType, WeaponConfig> = {
  pulse: {
    id: 'pulse',
    name: 'Pháo Xung Đơn',
    shortDesc: 'Tốc độ bắn cao, đường đạn chuẩn xác và ổn định.',
    color: '#FDE68A',
  },
  spread: {
    id: 'spread',
    name: 'Pháo Tán Xạ',
    shortDesc: 'Bắn chùm 3–5 tia năng lượng quét sạch đám đông.',
    color: '#38BDF8',
  },
  rail: {
    id: 'rail',
    name: 'Tia Xuyên Phá',
    shortDesc: 'Đạn siêu tốc xuyên thấu nhiều kẻ địch trên một đường thẳng.',
    color: '#34D399',
  },
  missile: {
    id: 'missile',
    name: 'Tên Lửa Dẫn Đường',
    shortDesc: 'Đạn thông minh tự động bẻ góc truy đuổi mục tiêu gần nhất.',
    color: '#FB7185',
  },
};

export const HANGAR_UPGRADES: HangarUpgradeDefinition[] = [
  {
    id: 'hull',
    name: 'Lõi Giáp Sinh Mạng',
    description:
      'Tăng số Sinh Mạng tối đa khi bắt đầu trận đấu (trừ chế độ Sinh Tồn Khắc Nghiệt).',
    maxLevel: 3,
    baseCost: 80,
    costStep: 90,
    unitLabel: '+1 Sinh Mạng / cấp',
  },
  {
    id: 'firepower',
    name: 'Tụ Điện Hỏa Lực',
    description: 'Tăng sát thương cơ bản và tốc độ khai hỏa cho mọi loại vũ khí.',
    maxLevel: 5,
    baseCost: 50,
    costStep: 55,
    unitLabel: '+10% Sát thương / cấp',
  },
  {
    id: 'thruster',
    name: 'Động Cơ Phản Lực Ion',
    description: 'Tăng tốc độ bay tối đa và giảm thời gian hồi kỹ năng Lướt.',
    maxLevel: 5,
    baseCost: 45,
    costStep: 50,
    unitLabel: '+6% Tốc độ & Hồi lướt / cấp',
  },
  {
    id: 'magnet',
    name: 'Từ Trường Hút Sao & Boost',
    description:
      'Mở rộng bán kính hút Mảnh Sao / Vật phẩm Boost và tăng lượng Mảnh Sao thu được.',
    maxLevel: 5,
    baseCost: 40,
    costStep: 45,
    unitLabel: '+20% Tầm hút & +10% Mảnh Sao / cấp',
  },
  {
    id: 'overdrive',
    name: 'Lò Phản Ứng Overdrive',
    description: 'Tăng tốc độ nạp thanh Chiêu Cuối Overdrive và kéo dài thời gian bùng nổ.',
    maxLevel: 5,
    baseCost: 60,
    costStep: 65,
    unitLabel: '+12% Tốc sạc Overdrive / cấp',
  },
];

export const PERK_POOL: PerkDefinition[] = [
  {
    id: 'rapid_barrel',
    name: 'Nòng Súng Siêu Tốc',
    category: 'Hỏa Lực',
    rarity: 'common',
    description: 'Tăng 22% tốc độ bắn của vũ khí hiện tại.',
  },
  {
    id: 'heavy_caliber',
    name: 'Đầu Đạn Nhiệt Hạch',
    category: 'Hỏa Lực',
    rarity: 'rare',
    description: 'Tăng 30% sát thương mỗi viên đạn và tăng lực đẩy lùi quái.',
  },
  {
    id: 'multishot_core',
    name: 'Bộ Chia Quang Học',
    category: 'Hỏa Lực',
    rarity: 'epic',
    description: 'Cộng thêm +1 luồng đạn song song cho mỗi lần khai hỏa.',
  },
  {
    id: 'pierce_rounds',
    name: 'Đầu Đạn Xuyên Giáp',
    category: 'Hỏa Lực',
    rarity: 'rare',
    description: 'Mọi viên đạn bắn ra có thể xuyên thêm +1 mục tiêu.',
  },
  {
    id: 'shield_restore',
    name: 'Sửa Chữa Khẩn Cấp',
    category: 'Phòng Thủ',
    rarity: 'common',
    description: 'Hồi ngay 2 Sinh Mạng và tạo sóng xung kích đẩy lùi kẻ địch.',
  },
  {
    id: 'max_shield_up',
    name: 'Giáp Tinh Thể',
    category: 'Phòng Thủ',
    rarity: 'rare',
    description: 'Tăng +1 Sinh Mạng tối đa và hồi ngay 1 Sinh Mạng.',
  },
  {
    id: 'phase_turbine',
    name: 'Tua-Bin Không Gian',
    category: 'Cơ Động',
    rarity: 'common',
    description: 'Giảm 25% thời gian hồi Lướt và tăng 15% tốc độ bay.',
  },
  {
    id: 'shock_dash',
    name: 'Cường Hóa Hiệu Ứng Lướt',
    category: 'Cơ Động',
    rarity: 'rare',
    description: 'Tăng gấp đôi uy lực kỹ năng Lướt riêng biệt của từng tàu chiến.',
  },
  {
    id: 'overdrive_surge',
    name: 'Quá Tải Năng Lượng',
    category: 'Cơ Động',
    rarity: 'epic',
    description: 'Nạp ngay 50% thanh Overdrive và tăng 25% tốc độ tích năng lượng.',
  },
  {
    id: 'weapon_spread',
    name: 'Trang Bị: Pháo Tán Xạ',
    category: 'Vũ Khí',
    rarity: 'rare',
    description: 'Chuyển sang Pháo Tán Xạ (hoặc nâng cấp +1 tia nếu đang dùng).',
    weaponUnlock: 'spread',
  },
  {
    id: 'weapon_rail',
    name: 'Trang Bị: Tia Xuyên Phá',
    category: 'Vũ Khí',
    rarity: 'epic',
    description:
      'Chuyển sang Tia Xuyên Phá bắn xuyên hàng loạt kẻ địch (hoặc +35% sát thương).',
    weaponUnlock: 'rail',
  },
  {
    id: 'weapon_missile',
    name: 'Trang Bị: Tên Lửa Dẫn Đường',
    category: 'Vũ Khí',
    rarity: 'epic',
    description:
      'Chuyển sang Tên Lửa Dẫn Đường tự tìm mục tiêu (hoặc +1 tên lửa mỗi loạt).',
    weaponUnlock: 'missile',
  },
];

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_blood',
    title: 'Khởi Đầu Tinh Hà',
    description: 'Hạ gục 25 kẻ địch đầu tiên trong một trận đấu.',
    rewardShards: 30,
  },
  {
    id: 'combo_master',
    title: 'Chuỗi Liên Hoàn Cực Đại',
    description: 'Đạt hệ số nhân điểm tối đa 8x trong trận đấu.',
    rewardShards: 45,
  },
  {
    id: 'boss_slayer',
    title: 'Thợ Săn Pháo Đài',
    description: 'Đánh bại Boss đầu tiên trong bất kỳ chế độ nào.',
    rewardShards: 60,
  },
  {
    id: 'wave_6',
    title: 'Chiến Binh Viễn Chinh',
    description: 'Sống sót và vượt qua Wave 06.',
    rewardShards: 80,
  },
  {
    id: 'overdrive_unleashed',
    title: 'Bùng Nổ Overdrive',
    description: 'Kích hoạt Chiêu Cuối Overdrive trong trận chiến.',
    rewardShards: 35,
  },
  {
    id: 'elite_hunter',
    title: 'Khắc Tinh Tinh Anh',
    description: 'Tiêu diệt 5 quái Tinh Anh (Elite) có hào quang vàng.',
    rewardShards: 50,
  },
  {
    id: 'ship_collector',
    title: 'Đô Đốc Hạm Đội',
    description: 'Sở hữu ít nhất 3 chiến cơ trong Hangar.',
    rewardShards: 75,
  },
  {
    id: 'score_25k',
    title: 'Huyền Thoại Ngân Hà',
    description: 'Đạt mốc 25.000 điểm trong một lượt chơi.',
    rewardShards: 100,
  },
];

export function createDefaultProfile(): PlayerProfile {
  return {
    starShards: 160,
    unlockedShips: ['vanguard'],
    selectedShip: 'vanguard',
    selectedMode: 'arcade',
    hangarLevels: {
      hull: 0,
      firepower: 0,
      thruster: 0,
      magnet: 0,
      overdrive: 0,
    },
    achievements: {},
    bestScores: {
      arcade: 0,
      boss_rush: 0,
      hardcore: 0,
    },
    keybinds: { ...DEFAULT_KEYBINDS },
    stats: {
      totalRuns: 0,
      totalKills: 0,
      totalBossKills: 0,
      highestWave: 1,
    },
  };
}

export function loadPlayerProfile(): PlayerProfile {
  const fallback = createDefaultProfile();
  try {
    const raw =
      localStorage.getItem(PROFILE_STORAGE_KEY) ??
      localStorage.getItem('starward_profile_v2');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    return {
      starShards:
        typeof parsed.starShards === 'number' ? parsed.starShards : fallback.starShards,
      unlockedShips:
        Array.isArray(parsed.unlockedShips) && parsed.unlockedShips.length > 0
          ? (parsed.unlockedShips.filter((id) => Boolean(SHIPS[id as ShipId])) as ShipId[])
          : fallback.unlockedShips,
      selectedShip:
        parsed.selectedShip && SHIPS[parsed.selectedShip]
          ? parsed.selectedShip
          : fallback.selectedShip,
      selectedMode: parsed.selectedMode ? parsed.selectedMode : fallback.selectedMode,
      hangarLevels: {
        ...fallback.hangarLevels,
        ...(parsed.hangarLevels ?? {}),
      },
      achievements: parsed.achievements ?? {},
      bestScores: {
        ...fallback.bestScores,
        ...(parsed.bestScores ?? {}),
      },
      keybinds: {
        ...DEFAULT_KEYBINDS,
        ...(parsed.keybinds ?? {}),
      },
      stats: {
        ...fallback.stats,
        ...(parsed.stats ?? {}),
      },
    };
  } catch {
    return fallback;
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage errors
  }
}

export function getUpgradeCost(def: HangarUpgradeDefinition, currentLevel: number): number {
  return def.baseCost + currentLevel * def.costStep;
}

export function getUpgradeLevel(profile: PlayerProfile, id: HangarUpgradeId): number {
  return profile.hangarLevels[id] ?? 0;
}
