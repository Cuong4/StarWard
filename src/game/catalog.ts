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
    description: 'Hút toàn bộ Mảnh Sao trên bản đồ & tăng tốc độ di chuyển',
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
      'Chiến đấu qua từng khu vực tinh vân biến đổi liên tục, nhặt vật phẩm Boost, ghép thẻ kỹ năng mỗi wave và chạm trán 4 Đại Boss đa chiêu thức.',
    shardMultiplier: 'x1.0 Mảnh Sao',
  },
  {
    id: 'boss_rush',
    name: 'Săn Trùm',
    subtitle: 'Liên hoàn Boss',
    description:
      'Đối đầu trực diện với các siêu Boss cùng đội hộ vệ Tinh Anh ngay từ Wave 1. Tỷ lệ rơi vật phẩm Boost và Lõi Hồi Máu cao gấp đôi.',
    shardMultiplier: 'x1.5 Mảnh Sao',
  },
  {
    id: 'hardcore',
    name: 'Sinh Tồn Khắc Nghiệt',
    subtitle: '100 HP • Không hồi máu',
    description:
      'Giới hạn 100 Máu (HP) và không thể hồi phục, tốc độ quái tăng 25% nhưng điểm số và Mảnh Sao nhận được nhân đôi.',
    shardMultiplier: 'x2.0 Mảnh Sao',
  },
];

export const SHIPS: Record<ShipId, ShipConfig> = {
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard MK-II',
    role: 'Tiêm Kích Cân Bằng',
    description:
      'Chiến cơ tiêu chuẩn của hạm đội với 300 HP bền bỉ, độ cơ động ổn định và súng Xung Đơn chính xác.',
    cost: 0,
    baseHp: 300,
    baseShields: 300,
    speedMult: 1.0,
    fireRateMult: 1.0,
    damageMult: 1.0,
    defaultWeapon: 'pulse',
    accentColor: '#F59E0B',
    trailColor: '#FBBF24',
    dashColor: '#F59E0B',
    dashSecondaryColor: '#FEF08A',
    dashEffectName: 'Vòng Lửa Phản Quang',
    dashEffectDesc: 'Bấm [Q]: Dựng Vòng Khiên Lửa Mặt Trời xoay quanh tàu 3.2s, đốt quái áp sát và phản đạn địch.',
    dashStyle: 'solar_flare',
    chargeSkillName: 'Giữ [Q] Tụ Lực: Tân Tinh Bùng Nổ',
    chargeSkillDesc: 'Đè giữ [Q] tụ năng lượng rồi thả ra để phóng Vòng Lửa Mặt Trời Khổng Lồ gấp 2.5 lần, quét sạch đạn và thiêu đốt diện rộng!',
    overdriveEffectName: 'Thái Dương Chiến Hạm (10s)',
    overdriveEffectDesc: 'Triệu hồi 3 vệ tinh Pháo Mặt Trời 3D xoay quanh tàu tự động xả đạn nhiệt hạch liên thanh.',
    hullScale: 1.0,
    stats: { speed: 7, shield: 6, firepower: 6, utility: 7 },
  },
  phantom: {
    id: 'phantom',
    name: 'Bóng Ma X-09',
    role: 'Sát Thủ Tốc Độ',
    description:
      'Thân vỏ siêu nhẹ (250 HP) giúp bay cực nhanh và hồi Lướt thần tốc, trang bị sẵn Pháo Tán Xạ càn quét tầm gần.',
    cost: 350,
    baseHp: 250,
    baseShields: 250,
    speedMult: 1.25,
    fireRateMult: 1.15,
    damageMult: 1.1,
    defaultWeapon: 'spread',
    accentColor: '#38BDF8',
    trailColor: '#7DD3FC',
    dashColor: '#38BDF8',
    dashSecondaryColor: '#E0F2FE',
    dashEffectName: 'Phân Thân Ám Sát 3D',
    dashEffectDesc: 'Bấm [Q]: Để lại 1 Tháp Phân Thân Hologram tại vị trí cũ trong 4 giây tự động bắn laze điện quang.',
    dashStyle: 'void_lightning',
    chargeSkillName: 'Giữ [Q] Tụ Lực: Tam Ảnh Liên Kích',
    chargeSkillDesc: 'Đè giữ [Q] tụ lực rồi lướt để triệu hồi cùng lúc 3 Phân Thân Bóng Ma 3D lập trận địa laze đan chéo!',
    overdriveEffectName: 'Bão Kiếm Không Gian (10s)',
    overdriveEffectDesc: 'Tạo 4 phân thân bóng ma 3D xoay quanh tàu, phóng lưỡi đao Điện Quang Xanh 360° liên tục.',
    hullScale: 1.04,
    stats: { speed: 10, shield: 5, firepower: 8, utility: 8 },
  },
  valkyrie: {
    id: 'valkyrie',
    name: 'Chiến Thần Valkyrie',
    role: 'Xung Kích Cận Chiến',
    description:
      'Cánh kiếm khí động học (320 HP) chuyên áp sát tốc độ cao, hóa thành mũi thương xuyên phá mỗi khi Lướt.',
    cost: 800,
    baseHp: 320,
    baseShields: 320,
    speedMult: 1.18,
    fireRateMult: 1.14,
    damageMult: 1.2,
    defaultWeapon: 'spread',
    accentColor: '#F43F5E',
    trailColor: '#FDA4AF',
    dashColor: '#E11D48',
    dashSecondaryColor: '#FFE4E6',
    dashEffectName: 'Mũi Thương Xuyên Tâm',
    dashEffectDesc: 'Bấm [Q]: Bao bọc thân tàu bằng Mũi Khoan Huyết Kiếm, lao xuyên kẻ địch và hút +10 HP mỗi mục tiêu.',
    dashStyle: 'crimson_lance',
    chargeSkillName: 'Giữ [Q] Tụ Lực: Đại Huyết Thương Phá Giáp',
    chargeSkillDesc: 'Đè giữ [Q] tụ lực rồi lao đi với kích thước Mũi Khoan khổng lồ gấp 2.5 lần, chém thêm 1 sóng kiếm khí đỏ và hút +22 HP!',
    overdriveEffectName: 'Huyết Vũ Chiến Thần (10s)',
    overdriveEffectDesc: 'Bung đôi cánh năng lượng 3D Đỏ Hồng Ngọc, chém đại kiếm Plasma xuyên giáp & hút máu khi diệt địch.',
    hullScale: 1.08,
    stats: { speed: 9, shield: 6, firepower: 9, utility: 7 },
  },
  titan: {
    id: 'titan',
    name: 'Pháo Đài Titan',
    role: 'Thiết Giáp Hạng Nặng',
    description:
      'Sở hữu lớp giáp 500 HP siêu dày cùng Pháo Tia Xuyên phá giáp, nghiền nát cả đội hình Tank và Juggernaut.',
    cost: 1500,
    baseHp: 500,
    baseShields: 500,
    speedMult: 0.92,
    fireRateMult: 0.98,
    damageMult: 1.36,
    defaultWeapon: 'rail',
    accentColor: '#10B981',
    trailColor: '#6EE7B7',
    dashColor: '#10B981',
    dashSecondaryColor: '#A7F3D0',
    dashEffectName: 'Khiên Chấn Động Trọng Lực',
    dashEffectDesc: 'Bấm [Q]: Đáp xuống tạo Vòm Khiên Lục Giác chặn 50% sát thương trong 3.5s và hất văng quái.',
    dashStyle: 'bastion_wave',
    chargeSkillName: 'Giữ [Q] Tụ Lực: Đại Địa Chấn Lục Bảo',
    chargeSkillDesc: 'Đè giữ [Q] nén trọng lực rồi thả ra để dậm Vụ Nổ Địa Chấn bán kính 360px nghiền nát quái và mở Khiên Lục Giác 6 giây!',
    overdriveEffectName: 'Trường Lực Hủy Diệt (10s)',
    overdriveEffectDesc: 'Dựng vòm khiên lục giác 3D giảm 65% sát thương, xóa đạn bay tới và dậm địa chấn liên hoàn.',
    hullScale: 1.15,
    stats: { speed: 5, shield: 10, firepower: 9, utility: 7 },
  },
  tempest: {
    id: 'tempest',
    name: 'Cuồng Phong Tempest',
    role: 'Pháo Kích Điện Từ',
    description:
      'Tích hợp cuộn cảm ứng từ trường cao áp (340 HP), giăng dây cáp sét cao thế cắt ngang chiến trường khi Lướt.',
    cost: 2500,
    baseHp: 340,
    baseShields: 340,
    speedMult: 1.16,
    fireRateMult: 1.28,
    damageMult: 1.22,
    defaultWeapon: 'pulse',
    accentColor: '#06B6D4',
    trailColor: '#67E8F9',
    dashColor: '#22D3EE',
    dashSecondaryColor: '#CFFAFE',
    dashEffectName: 'Cột Thu Lôi Cáp Sét',
    dashEffectDesc: 'Bấm [Q]: Cắm 1 Cột Thu Lôi Từ Trường tại điểm xuất phát, nối dây sét cao áp tới thân tàu bạn trong 4s.',
    dashStyle: 'ion_tempest',
    chargeSkillName: 'Giữ [Q] Tụ Lực: Lưới Điện Cao Thế Tam Giác',
    chargeSkillDesc: 'Đè giữ [Q] tích điện rồi lướt để cắm 2 Cột Thu Lôi nối hoàn chỉnh với tàu thành Tam Giác Lôi Điện giật sét toàn vùng!',
    overdriveEffectName: 'Lôi Ngục Vĩnh Cửu (10s)',
    overdriveEffectDesc: 'Tạo 2 vòng hồ quang 3D xoay ngược chiều, giật sét dây chuyền tự động vào mọi kẻ địch xung quanh.',
    hullScale: 1.14,
    stats: { speed: 8, shield: 6, firepower: 9, utility: 9 },
  },
  eclipse: {
    id: 'eclipse',
    name: 'Nhật Thực Eclipse',
    role: 'Chiến Cơ Bóng Tối',
    description:
      'Chiến cơ tàng hình không gian sâu (330 HP), tạo giếng trọng lực hút đạn và gom quái mỗi khi Lướt.',
    cost: 4000,
    baseHp: 330,
    baseShields: 330,
    speedMult: 1.2,
    fireRateMult: 1.15,
    damageMult: 1.32,
    defaultWeapon: 'rail',
    accentColor: '#A855F7',
    trailColor: '#D8B4FE',
    dashColor: '#9333EA',
    dashSecondaryColor: '#F3E8FF',
    dashEffectName: 'Giếng Trọng Lực Hắc Ám',
    dashEffectDesc: 'Bấm [Q]: Tạo 1 Giếng Hố Đen tồn tại 3.5 giây tại điểm lướt, hút đạn địch và kéo gom quái.',
    dashStyle: 'shadow_rift',
    chargeSkillName: 'Giữ [Q] Tụ Lực: Siêu Hố Đen Đôi',
    chargeSkillDesc: 'Đè giữ [Q] tụ lực rồi lướt để mở Siêu Giếng Trọng Lực bán kính 320px cuốn phăng mọi quái về tâm và nổ sóng chân không!',
    overdriveEffectName: 'Hố Đen Thực Tại (10s)',
    overdriveEffectDesc: 'Mở đĩa bồi tụ Hố Đen 3D dưới thân tàu, nuốt chửng đạn địch và bắn trả tia Xuyên Phá Hắc Ám.',
    hullScale: 1.18,
    stats: { speed: 9, shield: 7, firepower: 9, utility: 10 },
  },
  nova: {
    id: 'nova',
    name: 'Siêu Tân Tinh Nova',
    role: 'Pháo Thủ Dẫn Đường',
    description:
      'Chiến cơ 360 HP tích hợp hệ thống Tên Lửa Dẫn Đường và rải mìn không gian phát nổ dây chuyền.',
    cost: 6000,
    baseHp: 360,
    baseShields: 360,
    speedMult: 1.16,
    fireRateMult: 1.2,
    damageMult: 1.34,
    defaultWeapon: 'missile',
    accentColor: '#EC4899',
    trailColor: '#F9A8D4',
    dashColor: '#EC4899',
    dashSecondaryColor: '#FCE7F3',
    dashEffectName: 'Rải Thủy Lôi Tinh Vân',
    dashEffectDesc: 'Bấm [Q]: Rải dọc đường lướt 4 Quả Thủy Lôi Từ Trường phát sáng tự hút vào quái và phát nổ.',
    dashStyle: 'supernova_burst',
    chargeSkillName: 'Giữ [Q] Tụ Lực: Bãi Mìn Liên Hoàn 8 Quả',
    chargeSkillDesc: 'Đè giữ [Q] tụ lực để rải 8 Đại Thủy Lôi Tinh Vân cỡ lớn dọc đường bay với bán kính nổ gấp đôi!',
    overdriveEffectName: 'Mưa Sao Băng Hủy Diệt (10s)',
    overdriveEffectDesc: 'Triệu hồi 4 bệ phóng quỹ đạo 3D, tự động xả mưa Tên Lửa Dẫn Đường Hồng Tinh Vân khắp bản đồ.',
    hullScale: 1.2,
    stats: { speed: 8, shield: 7, firepower: 9, utility: 10 },
  },
  solaris: {
    id: 'solaris',
    name: 'Thái Dương Solaris',
    role: 'Hỏa Phụng Hoàng Kim',
    description:
      'Động cơ nhiệt hạch mặt trời (400 HP) biến mỗi cú Lướt thành một bức tường lửa Hoàng Kim thiêu đốt chiến trường.',
    cost: 8500,
    baseHp: 400,
    baseShields: 400,
    speedMult: 1.18,
    fireRateMult: 1.24,
    damageMult: 1.4,
    defaultWeapon: 'spread',
    accentColor: '#F97316',
    trailColor: '#FDBA74',
    dashColor: '#F97316',
    dashSecondaryColor: '#FFEDD5',
    dashEffectName: 'Bức Tường Lửa Hoàng Kim',
    dashEffectDesc: 'Bấm [Q]: Trải một dải Tường Lửa Nhiệt Hạch rực cháy dọc suốt đường lướt trong 4 giây.',
    dashStyle: 'golden_phoenix',
    chargeSkillName: 'Giữ [Q] Tụ Lực: Biển Lửa Phượng Hoàng',
    chargeSkillDesc: 'Đè giữ [Q] tụ nhiệt rồi lao đi, trải Thảm Lửa Hoàng Kim siêu rộng kèm Cầu Lửa Mặt Trời bay dọc theo tàu!',
    overdriveEffectName: 'Phượng Hoàng Niết Bàn (10s)',
    overdriveEffectDesc: 'Hóa thân thành Phượng Hoàng Lửa 3D khổng lồ, tự hồi +12 HP/giây và phun bão lửa mặt trời 360°.',
    hullScale: 1.24,
    stats: { speed: 8, shield: 8, firepower: 10, utility: 9 },
  },
  aether: {
    id: 'aether',
    name: 'Lăng Kính Aether',
    role: 'Thiết Giáp Quang Học',
    description:
      'Thân tàu 420 HP cấu tạo từ tinh thể khúc xạ ánh sáng, dựng cổng cắt Laser cố định mỗi khi Lướt.',
    cost: 12000,
    baseHp: 420,
    baseShields: 420,
    speedMult: 1.2,
    fireRateMult: 1.24,
    damageMult: 1.45,
    defaultWeapon: 'rail',
    accentColor: '#34D399',
    trailColor: '#A7F3D0',
    dashColor: '#2DD4BF',
    dashSecondaryColor: '#CCFBF1',
    dashEffectName: 'Cổng Cắt Laser Lăng Kính',
    dashEffectDesc: 'Bấm [Q]: Dựng 2 Tinh Thể Lăng Kính ở đầu và cuối cú lướt, nối tia Laser Ngọc Bích cắt đôi mọi quái đi qua.',
    dashStyle: 'prism_mirror',
    chargeSkillName: 'Giữ [Q] Tụ Lực: Đại Pháo Lăng Kính Khúc Xạ',
    chargeSkillDesc: 'Đè giữ [Q] hội tụ ánh sáng rồi thả ra: Dựng Cổng Laser Kép và bắn ngay 1 Tia Đại Laser Ngọc Bích xuyên bản đồ!',
    overdriveEffectName: 'Ma Trận Khúc Xạ Vũ Trụ (10s)',
    overdriveEffectDesc: 'Dựng tinh thể Lăng Kính 3D xoay quanh tàu, quét 4 chùm đại Laser xuyên thấu toàn màn hình.',
    hullScale: 1.28,
    stats: { speed: 9, shield: 8, firepower: 10, utility: 10 },
  },
  chronos: {
    id: 'chronos',
    name: 'Thời Không Chronos',
    role: 'Soái Hạm Thời Không',
    description:
      'Soái hạm 450 HP đỉnh cao công nghệ xuyên không gian: mở bong bóng đóng băng thời gian tại khu vực lướt qua.',
    cost: 18000,
    baseHp: 450,
    baseShields: 450,
    speedMult: 1.26,
    fireRateMult: 1.26,
    damageMult: 1.5,
    defaultWeapon: 'missile',
    accentColor: '#818CF8',
    trailColor: '#C7D2FE',
    dashColor: '#6366F1',
    dashSecondaryColor: '#E0E7FF',
    dashEffectName: 'Vòm Đóng Băng Thời Gian',
    dashEffectDesc: 'Bấm [Q]: Tạo Vòm Thời Không bán kính 220px tồn tại 3.8 giây, làm chậm 85% quái và đạn bên trong.',
    dashStyle: 'chrono_warp',
    chargeSkillName: 'Giữ [Q] Tụ Lực: Lãnh Địa Ngưng Đọng Toàn Bản Đồ',
    chargeSkillDesc: 'Đè giữ [Q] tụ lực rồi thả ra để mở Siêu Vòm Thời Không khổng lồ 380px đóng băng chiến trường và chém Kiếm Khí Thời Gian!',
    overdriveEffectName: 'Lãnh Địa Thời Không (10s)',
    overdriveEffectDesc: 'Mở Vòm Đồng Hồ Thiên Văn 3D làm chậm 70% mọi kẻ địch & đạn, hồi Lướt tức thì và xả đạn Lượng Tử.',
    hullScale: 1.32,
    stats: { speed: 10, shield: 9, firepower: 10, utility: 10 },
  },
  omega: {
    id: 'omega',
    name: 'Thần Phạt Omega-X',
    role: 'Siêu Cấp • Pháo Hủy Diệt Tinh Cầu',
    description:
      'Thiết giáp hạm Siêu Cấp cỡ lớn (500 HP) mang lò phản ứng Phản Vật Chất. Có thể ĐÈ GIỮ [Q] tụ năng lượng để chưởng Quả Cầu Hủy Diệt Tinh Cầu khổng lồ!',
    cost: 28000,
    baseHp: 500,
    baseShields: 500,
    speedMult: 1.25,
    fireRateMult: 1.28,
    damageMult: 1.62,
    defaultWeapon: 'rail',
    accentColor: '#EF4444',
    trailColor: '#FCA5A5',
    dashColor: '#DC2626',
    dashSecondaryColor: '#FEF08A',
    dashEffectName: 'Chưởng Cầu Phản Vật Chất',
    dashEffectDesc: 'Bấm [Q]: Chưởng ra 1 Quả Cầu Phản Vật Chất (rộng 95px) bay về hướng ngắm, nuốt đạn và nghiền nát đường đi.',
    dashStyle: 'omega_burst',
    chargeSkillName: 'ĐÈ GIỮ [Q] TỤ LỰC: SIÊU CẦU HỦY DIỆT TINH CẦU (220PX)',
    chargeSkillDesc: 'Đè giữ [Q] tích tụ hạt nhân đến 100% rồi thả ra để CHƯỞNG QUẢ CẦU PHẢN VẬT CHẤT KHỔNG LỒ 220PX quét sạch cả bản đồ!',
    overdriveEffectName: 'Đại Pháo Hủy Diệt Tinh Cầu (10s)',
    overdriveEffectDesc: 'Chưởng liên hoàn các QUẢ CẦU NĂNG LƯỢNG 3D SIÊU KHỔNG LỒ kèm tia sét hạt nhân quét sạch toàn bộ bản đồ!',
    hullScale: 1.4,
    isMythic: true,
    stats: { speed: 9, shield: 9, firepower: 10, utility: 10 },
  },
  celestia: {
    id: 'celestia',
    name: 'Thiên Hà Celestia',
    role: 'Siêu Cấp • Đại Pháo Ánh Sáng',
    description:
      'Thần hạm Bạch Kim 4 cánh quang học cỡ lớn (520 HP). Đè giữ [Q] tụ ánh sáng để bắn Cột Đại Laser Kamehameha xuyên thủng màn hình!',
    cost: 45000,
    baseHp: 520,
    baseShields: 520,
    speedMult: 1.28,
    fireRateMult: 1.32,
    damageMult: 1.68,
    defaultWeapon: 'pulse',
    accentColor: '#38BDF8',
    trailColor: '#FDE047',
    dashColor: '#FACC15',
    dashSecondaryColor: '#E0F2FE',
    dashEffectName: 'Tia Phán Quyết Thiên Hà',
    dashEffectDesc: 'Bấm [Q]: Bắn tức thời 1 Cột Laser Ánh Sáng Bạch Kim rộng 55px xuyên suốt màn hình và hồi +18 HP.',
    dashStyle: 'starlight_step',
    chargeSkillName: 'ĐÈ GIỮ [Q] TỤ LỰC: LONG PHÁO ÁNH SÁNG VŨ TRỤ (120PX)',
    chargeSkillDesc: 'Đè giữ [Q] tụ quang năng đến 100% rồi thả ra để KHAI HỎA CỘT ĐẠI LASER HOÀNG KIM RỘNG 120PX đốt cháy mọi mục tiêu và hồi +35 HP!',
    overdriveEffectName: 'Đại Hồng Thủy Laser Vũ Trụ (10s)',
    overdriveEffectDesc: 'Bắn CỘT ĐẠI LASER 3D KHỔNG LỒ xuyên toàn màn hình suốt 10 giây, quét chuột tới đâu bốc hơi quái và đạn địch tới đó!',
    hullScale: 1.46,
    isMythic: true,
    stats: { speed: 10, shield: 9, firepower: 10, utility: 10 },
  },
  leviathan: {
    id: 'leviathan',
    name: 'Thâm Uyên Leviathan',
    role: 'Siêu Cấp • Chúa Tể Hố Đen',
    description:
      'Soái hạm Hố Đen khổng lồ (620 HP) với 2 càng trọng lực hầm hố. Đè giữ [Q] nén không gian để phóng Hố Đen Thôn Phệ cuốn sạch cả bản đồ!',
    cost: 68000,
    baseHp: 620,
    baseShields: 620,
    speedMult: 1.24,
    fireRateMult: 1.28,
    damageMult: 1.78,
    defaultWeapon: 'spread',
    accentColor: '#C084FC',
    trailColor: '#67E8F9',
    dashColor: '#7C3AED',
    dashSecondaryColor: '#22D3EE',
    dashEffectName: 'Sóng Thần Trọng Lực',
    dashEffectDesc: 'Bấm [Q]: Phóng ra 1 Quả Cầu Xoáy Hố Đen Di Động hút gom mọi kẻ địch và đạn trên đường nó trôi qua.',
    dashStyle: 'abyss_tide',
    chargeSkillName: 'ĐÈ GIỮ [Q] TỤ LỰC: HỐ ĐEN ĐẠI THÔN PHỆ VŨ TRỤ',
    chargeSkillDesc: 'Đè giữ [Q] nén trọng trường đến 100% rồi thả ra để PHÓNG SIÊU HỐ ĐEN 3D KHỔNG LỒ hút toàn bộ quái trong bán kính 360px vào tâm nghiền nát!',
    overdriveEffectName: 'Chưởng Hố Đen Thôn Phệ (10s)',
    overdriveEffectDesc: 'Phóng ra HỐ ĐEN TRỌNG TRƯỜNG 3D SIÊU KHỔNG LỒ trôi qua bản đồ, cuốn sạch đạn và hút mọi quái vào tâm để nghiền nát!',
    hullScale: 1.54,
    isMythic: true,
    stats: { speed: 9, shield: 10, firepower: 10, utility: 10 },
  },
  hyperion: {
    id: 'hyperion',
    name: 'Quang Ảnh Hyperion',
    role: 'Siêu Cấp • Tia Chớp Dội Tường',
    description:
      'Siêu chiến cơ Phi Tiêu Quang Học 4 cánh (680 HP). Khi bật Nộ [E], tàu hóa thành Tia Chớp Bất Tử tự động LƯỚT BẬT LIÊN TỤC VÀO TƯỜNG DỘI QUA DỘI LẠI tốc độ siêu thanh, QUÉT SẠCH MỌI QUÁI TRÊN ĐƯỜNG ĐI (trừ Boss)!',
    cost: 82000,
    baseHp: 680,
    baseShields: 680,
    speedMult: 1.38,
    fireRateMult: 1.35,
    damageMult: 1.85,
    defaultWeapon: 'rail',
    accentColor: '#00F5D4',
    trailColor: '#FDE047',
    dashColor: '#06B6D4',
    dashSecondaryColor: '#FEF08A',
    dashEffectName: 'Phi Đao Dội Tường Liên Hoàn',
    dashEffectDesc: 'Bấm [Q]: Phóng 2 Lưỡi Phi Đao Ánh Sáng bay tốc độ cao tự động đập tường nảy qua nảy lại khắp màn hình trong 4.5 giây!',
    dashStyle: 'ricochet_blade',
    chargeSkillName: 'ĐÈ GIỮ [Q] TỤ LỰC: BÃO PHI ĐAO PHẢN XẠ (6 LƯỠI KHỔNG LỒ)',
    chargeSkillDesc: 'Đè giữ [Q] tụ quang năng đến 100% rồi thả ra để PHÓNG 6 ĐẠI PHI ĐAO ÁNH SÁNG DỘI TƯỜNG LIÊN TỤC cắt nát mọi mục tiêu!',
    overdriveEffectName: 'Bật [E]: Tia Chớp Dội Tường Quét Sạch (10s)',
    overdriveEffectDesc: 'Tàu hóa thành TIA CHỚP BẤT TỬ tự động LƯỚT ĐẬP TƯỜNG DỘI QUA DỘI LẠI khắp bản đồ suốt 10s, QUÉT SẠCH TỨC THÌ mọi quái thường & Tinh Anh (trừ Boss nhận sát thương chuẩn)!',
    hullScale: 1.58,
    isMythic: true,
    stats: { speed: 10, shield: 10, firepower: 10, utility: 10 },
  },
  apocalypse: {
    id: 'apocalypse',
    name: 'Thánh Kiếm Apocalypse',
    role: 'Đế Vương Tối Thượng • 100.000 Mảnh Sao',
    description:
      'Siêu Soái Hạm Tối Thượng kích thước khổng lồ (750 HP) với 6 cánh chiến thần, vòng hào quang vương miện 3D và 2 Thần Kiếm hộ vệ. Đè giữ [Q] để tung Tam Tuyệt Trảm Không Gian cắt đôi toàn bộ thiên hà!',
    cost: 100000,
    baseHp: 750,
    baseShields: 750,
    speedMult: 1.36,
    fireRateMult: 1.38,
    damageMult: 1.95,
    defaultWeapon: 'missile',
    accentColor: '#F43F5E',
    trailColor: '#FDE047',
    dashColor: '#FB7185',
    dashSecondaryColor: '#FEF08A',
    dashEffectName: 'Đại Kiếm Khí Không Gian',
    dashEffectDesc: 'Bấm [Q]: Vung Thần Kiếm chém ra 1 Lưỡi Kiếm Khí Bán Nguyệt 3D Khổng Lồ (rộng 190px) bay xuyên bản đồ!',
    dashStyle: 'dimension_slash',
    chargeSkillName: 'ĐÈ GIỮ [Q] TỤ LỰC: TAM TUYỆT TRẢM HỦY DIỆT THIÊN HÀ',
    chargeSkillDesc: 'Đè giữ [Q] tụ thần lực đến 100% rồi thả ra: Vung Đại Thần Kiếm chém đồng loạt 3 LƯỠI KIẾM KHÍ KHỔNG LỒ 280PX kèm Cột Laser Hoàng Kim quét sạch cả màn hình!',
    overdriveEffectName: 'Thần Kiếm Phán Quyết 3D (10s)',
    overdriveEffectDesc: 'Triệu hồi ĐẠI THẦN KIẾM ÁNH SÁNG 3D chém sóng kiếm khí khổng lồ rộng 280px + 6 Thánh Kiếm xoay quanh tàu suốt 10 giây!',
    hullScale: 1.65,
    isMythic: true,
    stats: { speed: 10, shield: 10, firepower: 10, utility: 10 },
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
  SHIPS.omega,
  SHIPS.celestia,
  SHIPS.leviathan,
  SHIPS.hyperion,
  SHIPS.apocalypse,
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
    name: 'Lõi Giáp Sinh Lực (HP)',
    description:
      'Nâng cấp KHÔNG GIỚI HẠN: Tăng Máu tối đa (Max HP) và tốc độ tự hồi máu của chiến cơ.',
    maxLevel: 9999,
    baseCost: 75,
    costStep: 65,
    unitLabel: '+45 HP & +2 HP/s mỗi cấp',
  },
  {
    id: 'firepower',
    name: 'Tụ Điện Hỏa Lực',
    description: 'Nâng cấp KHÔNG GIỚI HẠN: Tăng sát thương cơ bản và tốc độ khai hỏa cho mọi loại vũ khí.',
    maxLevel: 9999,
    baseCost: 65,
    costStep: 55,
    unitLabel: '+10% Sát thương mỗi cấp',
  },
  {
    id: 'thruster',
    name: 'Động Cơ Phản Lực Ion',
    description: 'Nâng cấp KHÔNG GIỚI HẠN: Tăng tốc độ bay tối đa và giảm thời gian hồi kỹ năng Lướt.',
    maxLevel: 9999,
    baseCost: 55,
    costStep: 50,
    unitLabel: '+5% Tốc độ & Hồi lướt mỗi cấp',
  },
  {
    id: 'magnet',
    name: 'Từ Trường Hút Sao & Boost',
    description:
      'Nâng cấp KHÔNG GIỚI HẠN: Mở rộng bán kính hút Mảnh Sao / Vật phẩm Boost và tăng lượng Mảnh Sao thu được.',
    maxLevel: 9999,
    baseCost: 50,
    costStep: 45,
    unitLabel: '+20% Tầm hút & +12% Mảnh Sao',
  },
  {
    id: 'overdrive',
    name: 'Lò Phản Ứng Overdrive',
    description: 'Nâng cấp KHÔNG GIỚI HẠN: Tăng lượng Nộ tích được mỗi khi gây sát thương và tăng uy lực chiêu Nộ 10s.',
    maxLevel: 9999,
    baseCost: 70,
    costStep: 60,
    unitLabel: '+10% Tốc tích Nộ & Uy lực Nộ',
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
    name: 'Nano Hồi Phục Khẩn Cấp',
    category: 'Phòng Thủ',
    rarity: 'common',
    description: 'Hồi ngay 140 Máu (HP) và phát sóng xung kích đẩy lùi kẻ địch xung quanh.',
  },
  {
    id: 'max_shield_up',
    name: 'Giáp Sinh Học Nano',
    category: 'Phòng Thủ',
    rarity: 'rare',
    description: 'Tăng +80 Máu tối đa, hồi ngay 80 HP và tăng tốc độ tự hồi máu +3 HP/giây.',
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
    name: 'Cường Hóa Tuyệt Kỹ Lướt',
    category: 'Cơ Động',
    rarity: 'rare',
    description: 'Tăng gấp đôi kích thước, thời gian duy trì và sát thương kỹ năng Lướt riêng của tàu.',
  },
  {
    id: 'overdrive_surge',
    name: 'Quá Tải Năng Lượng Nộ',
    category: 'Cơ Động',
    rarity: 'epic',
    description: 'Nạp ngay +35% thanh Nộ Overdrive và tăng 25% tốc độ tích Nộ khi gây sát thương.',
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
    rewardShards: 50,
  },
  {
    id: 'combo_master',
    title: 'Chuỗi Liên Hoàn Cực Đại',
    description: 'Đạt hệ số nhân điểm tối đa 8x trong trận đấu.',
    rewardShards: 80,
  },
  {
    id: 'boss_slayer',
    title: 'Thợ Săn Pháo Đài',
    description: 'Đánh bại Boss đầu tiên trong bất kỳ chế độ nào.',
    rewardShards: 120,
  },
  {
    id: 'wave_6',
    title: 'Chiến Binh Viễn Chinh',
    description: 'Sống sót và vượt qua Wave 06.',
    rewardShards: 150,
  },
  {
    id: 'overdrive_unleashed',
    title: 'Bùng Nổ Nộ Tuyệt Kỹ',
    description: 'Tích đủ 100% Nộ và kích hoạt Siêu Tuyệt Kỹ Overdrive 10 giây.',
    rewardShards: 90,
  },
  {
    id: 'elite_hunter',
    title: 'Khắc Tinh Tinh Anh',
    description: 'Tiêu diệt 5 quái Tinh Anh (Elite) có hào quang vàng.',
    rewardShards: 100,
  },
  {
    id: 'ship_collector',
    title: 'Đô Đốc Hạm Đội',
    description: 'Sở hữu ít nhất 3 chiến cơ trong Hangar.',
    rewardShards: 150,
  },
  {
    id: 'score_25k',
    title: 'Huyền Thoại Ngân Hà',
    description: 'Đạt mốc 25.000 điểm trong một lượt chơi.',
    rewardShards: 250,
  },
];

export function createDefaultProfile(): PlayerProfile {
  return {
    starShards: 300,
    unlockedShips: ['vanguard'],
    selectedShip: 'vanguard',
    selectedMode: 'arcade',
    dashDirectionMode: 'mouse',
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
      dashDirectionMode:
        parsed.dashDirectionMode === 'movement' || parsed.dashDirectionMode === 'mouse'
          ? parsed.dashDirectionMode
          : 'mouse',
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
