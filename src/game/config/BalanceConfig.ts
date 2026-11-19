export const PALETTE = {
  BG: 0x0c1324,
  BG_HEX: '#0C1324',
  ROAD: 0x1c2538,
  ROAD_HEX: '#1C2538',
  ROAD_DARK: 0x151d2e,
  SIDEWALK: 0x26334c,
  SIDEWALK_EDGE: 0x354463,
  BUILDING: 0x29344c,
  BUILDING_HEX: '#29344C',
  BUILDING_ROOF: 0x1f2a40,
  BUILDING_INNER: 0x33415c,
  NEON_CYAN: 0x00f5ff,
  NEON_CYAN_HEX: '#00F5FF',
  NEON_PURPLE: 0xc000ff,
  NEON_PURPLE_HEX: '#C000FF',
  NEON_PINK: 0xff2e88,
  NEON_PINK_HEX: '#FF2E88',
  WARNING_RED: 0xff4545,
  WARNING_RED_HEX: '#FF4545',
  GOLD: 0xffd166,
  GOLD_HEX: '#FFD166',
  WHITE: 0xf8fafc,
} as const;

export const WORLD_CONFIG = {
  WIDTH: 4800,
  HEIGHT: 3584,
  TILE_SIZE: 32,
  STARTING_DISTRICT: '霓虹广场',
  PLAYER_SPAWN: { x: 1312, y: 1184 },
} as const;

export type GamePlayMode = 'sandbox' | 'horde' | 'race';

export interface GameModeMeta {
  id: GamePlayMode;
  name: string;
  tag: string;
  description: string;
  accentHex: string;
}

export const GAME_MODE_DEFS: GameModeMeta[] = [
  {
    id: 'sandbox',
    name: '自由沙盒',
    tag: '开放世界',
    description: '漫游七大连通城区！骇入信号塔、解锁磁悬浮传送站、清剿帮派据点、搜寻加密金库并飞跃刷新纪录。',
    accentHex: '#00F5FF',
  },
  {
    id: 'horde',
    name: '无尽杀怪',
    tag: '浪潮生存',
    description: '源源不断的失控义体、无人机与重装机甲来袭！叠加连击、拾取过载模块，挑战最高波次。',
    accentHex: '#FF2E88',
  },
  {
    id: 'race',
    name: '极速狂飙',
    tag: '环城竞速',
    description: '驾驶高性能超跑穿越 16 个七区巡回检查点，飞驰星港跑道与涡轮直道，刷新全城环线纪录！',
    accentHex: '#FFD166',
  },
];

export const PLAYER_CONFIG = {
  WALK_SPEED: 220,
  BODY_WIDTH: 18,
  BODY_HEIGHT: 18,
  SPRITE_SIZE: 28,
  INITIAL_HEALTH: 100,
  MAX_HEALTH: 100,
  MAX_ARMOR: 100,
  ARMOR_ABSORB_RATIO: 0.75,
  INITIAL_CASH: 500,
  INTERACT_RADIUS: 68,
  VEHICLE_ENTER_RADIUS: 64,
} as const;

export type WeaponId =
  | 'pistol'
  | 'smg'
  | 'shotgun'
  | 'rifle'
  | 'railgun'
  | 'flamethrower'
  | 'launcher';

export type WeaponUpgradeTrack = 'damage' | 'firerate' | 'capacity';

export interface WeaponSpec {
  id: WeaponId;
  name: string;
  shortName: string;
  tag: string;
  description: string;
  damage: number;
  fireIntervalMs: number;
  projectileSpeed: number;
  range: number;
  pellets: number;
  spreadDeg: number;
  recoilPx: number;
  cameraShake: number;
  projectileTexture: string;
  colorHex: string;
  colorNum: number;
  infiniteAmmo: boolean;
  initialAmmo: number;
  maxAmmo: number;
  buyCost: number;
  ammoPackCost: number;
  ammoPackSize: number;
  upgradeBaseCost: number;
  barrelLength: number;
  barrelWidth: number;
  pierceCount?: number;
  blastRadius?: number;
}

export const WEAPON_ORDER: readonly WeaponId[] = [
  'pistol',
  'smg',
  'shotgun',
  'rifle',
  'flamethrower',
  'railgun',
  'launcher',
] as const;

export const WEAPON_UPGRADE_CONFIG: Record<
  WeaponUpgradeTrack,
  {
    label: string;
    shortLabel: string;
    description: string;
    maxLevel: number;
    costMultipliers: readonly [number, number, number];
  }
> = {
  damage: {
    label: '火力增幅',
    shortLabel: '火力',
    description: '每级 +20% 伤害（火箭筒额外扩大爆破半径，磁轨炮 Lv.2 额外+1穿透）',
    maxLevel: 3,
    costMultipliers: [0.85, 1.45, 2.25],
  },
  firerate: {
    label: '射速冷却',
    shortLabel: '射速',
    description: '每级缩短 12% 射击冷却间隔，连射压制更迅猛',
    maxLevel: 3,
    costMultipliers: [0.8, 1.35, 2.1],
  },
  capacity: {
    label: '弹道扩容',
    shortLabel: '弹容/弹道',
    description: '每级 +30% 备弹上限（升级即补弹）并提升 +10% 射程与弹速',
    maxLevel: 3,
    costMultipliers: [0.75, 1.25, 1.9],
  },
};

export const WEAPON_SPECS: Record<WeaponId, WeaponSpec> = {
  pistol: {
    id: 'pistol',
    name: '脉冲手枪 MK-II',
    shortName: '脉冲手枪',
    tag: '制式副手',
    description: '制式高能电浆手枪，射速稳定、后坐可控，内置微核充能无需耗材。',
    damage: 26,
    fireIntervalMs: 245,
    projectileSpeed: 780,
    range: 480,
    pellets: 1,
    spreadDeg: 2,
    recoilPx: 3.5,
    cameraShake: 0.0022,
    projectileTexture: 'proj_cyan',
    colorHex: '#00F5FF',
    colorNum: 0x00f5ff,
    infiniteAmmo: true,
    initialAmmo: 999,
    maxAmmo: 999,
    buyCost: 0,
    ammoPackCost: 0,
    ammoPackSize: 0,
    upgradeBaseCost: 140,
    barrelLength: 9,
    barrelWidth: 3,
  },
  smg: {
    id: 'smg',
    name: '霓虹冲锋枪 V-9',
    shortName: '霓虹冲锋',
    tag: '高速连射',
    description: '高射速赛博微冲，弹幕压制力极强，适合街头火拼与快速清场。',
    damage: 17,
    fireIntervalMs: 92,
    projectileSpeed: 860,
    range: 450,
    pellets: 1,
    spreadDeg: 6.5,
    recoilPx: 2.4,
    cameraShake: 0.0018,
    projectileTexture: 'proj_pink',
    colorHex: '#FF2E88',
    colorNum: 0xff2e88,
    infiniteAmmo: false,
    initialAmmo: 150,
    maxAmmo: 400,
    buyCost: 260,
    ammoPackCost: 45,
    ammoPackSize: 100,
    upgradeBaseCost: 180,
    barrelLength: 12,
    barrelWidth: 3,
  },
  shotgun: {
    id: 'shotgun',
    name: '等离子霰弹枪 M8',
    shortName: '等离子霰弹',
    tag: '近战爆发',
    description: '一次喷射5发高热粒子弹丸，近距离击退与爆发打击感拉满。',
    damage: 19,
    fireIntervalMs: 560,
    projectileSpeed: 710,
    range: 320,
    pellets: 5,
    spreadDeg: 18,
    recoilPx: 7.5,
    cameraShake: 0.0055,
    projectileTexture: 'proj_gold',
    colorHex: '#FFD166',
    colorNum: 0xffd166,
    infiniteAmmo: false,
    initialAmmo: 36,
    maxAmmo: 96,
    buyCost: 380,
    ammoPackCost: 50,
    ammoPackSize: 24,
    upgradeBaseCost: 210,
    barrelLength: 14,
    barrelWidth: 4,
  },
  rifle: {
    id: 'rifle',
    name: '电磁突击步枪 X-47',
    shortName: '电磁步枪',
    tag: '中远全能',
    description: '全自动高初速电磁卡宾枪，弹道平直精准、单发穿透压制力极强。',
    damage: 34,
    fireIntervalMs: 145,
    projectileSpeed: 1080,
    range: 640,
    pellets: 1,
    spreadDeg: 2.2,
    recoilPx: 3.8,
    cameraShake: 0.0028,
    projectileTexture: 'proj_violet',
    colorHex: '#C000FF',
    colorNum: 0xc000ff,
    infiniteAmmo: false,
    initialAmmo: 120,
    maxAmmo: 320,
    buyCost: 520,
    ammoPackCost: 60,
    ammoPackSize: 90,
    upgradeBaseCost: 240,
    barrelLength: 16,
    barrelWidth: 3,
  },
  flamethrower: {
    id: 'flamethrower',
    name: '烈焰喷射器 PYRO-6',
    shortName: '烈焰喷射',
    tag: '范围灼烧',
    description: '连续喷涌高热等离子火浪，近中距离扇形覆盖，横扫成群尸潮与追兵。',
    damage: 15,
    fireIntervalMs: 65,
    projectileSpeed: 420,
    range: 225,
    pellets: 2,
    spreadDeg: 22,
    recoilPx: 1.5,
    cameraShake: 0.0014,
    projectileTexture: 'proj_flame',
    colorHex: '#FB923C',
    colorNum: 0xf97316,
    infiniteAmmo: false,
    initialAmmo: 220,
    maxAmmo: 550,
    buyCost: 620,
    ammoPackCost: 55,
    ammoPackSize: 160,
    upgradeBaseCost: 250,
    barrelLength: 15,
    barrelWidth: 5,
  },
  railgun: {
    id: 'railgun',
    name: '磁轨狙击炮 RAIL-Z',
    shortName: '磁轨狙击',
    tag: '穿甲贯通',
    description: '超音速磁轨重狙，发射穿透力极强的离子束，可直线贯通最多 3 个目标！',
    damage: 118,
    fireIntervalMs: 820,
    projectileSpeed: 1580,
    range: 820,
    pellets: 1,
    spreadDeg: 0.4,
    recoilPx: 9,
    cameraShake: 0.0075,
    projectileTexture: 'proj_rail',
    colorHex: '#38BDF8',
    colorNum: 0x38bdf8,
    infiniteAmmo: false,
    initialAmmo: 20,
    maxAmmo: 56,
    buyCost: 780,
    ammoPackCost: 75,
    ammoPackSize: 14,
    upgradeBaseCost: 300,
    barrelLength: 19,
    barrelWidth: 4,
    pierceCount: 3,
  },
  launcher: {
    id: 'launcher',
    name: '微型火箭筒 RPG-77',
    shortName: '火箭筒',
    tag: '爆破溅射',
    description: '发射高爆制导微火箭，命中后引爆大范围冲击波，瞬间粉碎机甲与车辆！',
    damage: 115,
    fireIntervalMs: 1050,
    projectileSpeed: 540,
    range: 580,
    pellets: 1,
    spreadDeg: 1.2,
    recoilPx: 10,
    cameraShake: 0.009,
    projectileTexture: 'proj_rocket',
    colorHex: '#FF4545',
    colorNum: 0xff4545,
    infiniteAmmo: false,
    initialAmmo: 10,
    maxAmmo: 30,
    buyCost: 920,
    ammoPackCost: 95,
    ammoPackSize: 8,
    upgradeBaseCost: 340,
    barrelLength: 17,
    barrelWidth: 6,
    blastRadius: 115,
  },
};

export const CAMERA_CONFIG = {
  ZOOM_DESKTOP: 1.35,
  ZOOM_DESKTOP_DRIVING: 1.15,
  ZOOM_MOBILE: 1.12,
  ZOOM_MOBILE_DRIVING: 0.96,
  LERP_X: 0.14,
  LERP_Y: 0.14,
  TITLE_PAN_SPEED: 0.22,
} as const;

export const NPC_CONFIG = {
  WALK_SPEED: 68,
  PANIC_SPEED: 155,
  PANIC_DURATION: 2.6,
  PANIC_TRIGGER_RADIUS: 135,
  AI_TICK_INTERVAL: 0.18,
  BODY_SIZE: 16,
} as const;

export const TRAFFIC_CONFIG = {
  CRUISE_SPEED: 145,
  STOP_DISTANCE: 88,
  SLOW_DISTANCE: 145,
} as const;

export const WANTED_CONFIG = {
  MAX_STARS: 5,
  MVP_MAX_STARS: 5,
  DETECT_RANGE: 215,
  LOS_BREAK_RANGE: 265,
  ESCAPE_TIME_STAR_1: 4.0,
  ESCAPE_TIME_STAR_2: 6.0,
  ESCAPE_TIME_STAR_3: 8.5,
  ESCAPE_TIME_STAR_4: 11.5,
  ESCAPE_TIME_STAR_5: 15.0,
  POLICE_PATROL_SPEED: 105,
  POLICE_PURSUIT_FOOT_SPEED: 195,
  POLICE_PURSUIT_VEH_SPEED: 280,
  POLICE_INTERCEPTOR_SPEED: 325,
  POLICE_HELI_SPEED: 245,
  POLICE_SWAT_SPEED: 265,
  POLICE_TANK_SPEED: 190,
  POLICE_SEARCH_SPEED: 145,
  POLICE_CONTACT_DAMAGE_FOOT: 10,
  POLICE_CONTACT_DAMAGE_VEH: 6,
  POLICE_HELI_BOUNTY: 320,
  POLICE_TANK_BOUNTY: 500,
  VIGILANTE_BASE_REWARD: 280,
  RESPAWN_PENALTY: 80,
  CLINIC_RESPAWN: { x: 1120, y: 656 },
} as const;

export type VehicleType =
  | 'compact'
  | 'racer'
  | 'cruiser'
  | 'supercar'
  | 'moto'
  | 'superbike'
  | 'buggy'
  | 'swat'
  | 'heli'
  | 'tank';

export type VehicleCategory = 'car' | 'moto' | 'armor' | 'air' | 'tank';
export type VehicleWeaponKind = 'driveby' | 'autocannon' | 'tank_cannon';

export interface VehicleSpec {
  type: VehicleType;
  name: string;
  textureKey: string;
  width: number;
  height: number;
  maxSpeed: number;
  maxReverseSpeed: number;
  acceleration: number;
  braking: number;
  turnSpeed: number;
  drag: number;
  lateralGrip: number;
  maxHealth: number;
  accentHex: string;
  hasLightbar: boolean;
  category: VehicleCategory;
  weaponKind: VehicleWeaponKind;
  isFlying?: boolean;
  hasTurret?: boolean;
  collisionDamageScale?: number;
}

export const VEHICLE_SPECS: Record<VehicleType, VehicleSpec> = {
  compact: {
    type: 'compact',
    name: '都市紧凑型',
    textureKey: 'veh_compact',
    width: 44,
    height: 24,
    maxSpeed: 340,
    maxReverseSpeed: 150,
    acceleration: 480,
    braking: 520,
    turnSpeed: 3.4,
    drag: 1.9,
    lateralGrip: 7.6,
    maxHealth: 110,
    accentHex: PALETTE.NEON_CYAN_HEX,
    hasLightbar: false,
    category: 'car',
    weaponKind: 'driveby',
  },
  racer: {
    type: 'racer',
    name: '街头竞速车',
    textureKey: 'veh_racer',
    width: 48,
    height: 24,
    maxSpeed: 425,
    maxReverseSpeed: 175,
    acceleration: 600,
    braking: 640,
    turnSpeed: 3.8,
    drag: 1.65,
    lateralGrip: 7.0,
    maxHealth: 95,
    accentHex: PALETTE.NEON_PINK_HEX,
    hasLightbar: false,
    category: 'car',
    weaponKind: 'driveby',
  },
  cruiser: {
    type: 'cruiser',
    name: '特区巡逻警车',
    textureKey: 'veh_cruiser',
    width: 48,
    height: 26,
    maxSpeed: 365,
    maxReverseSpeed: 160,
    acceleration: 490,
    braking: 580,
    turnSpeed: 3.2,
    drag: 1.8,
    lateralGrip: 7.0,
    maxHealth: 150,
    accentHex: PALETTE.WARNING_RED_HEX,
    hasLightbar: true,
    category: 'car',
    weaponKind: 'driveby',
    collisionDamageScale: 0.75,
  },
  supercar: {
    type: 'supercar',
    name: '幻影超跑 GT-X',
    textureKey: 'veh_super',
    width: 50,
    height: 24,
    maxSpeed: 470,
    maxReverseSpeed: 185,
    acceleration: 660,
    braking: 700,
    turnSpeed: 3.9,
    drag: 1.5,
    lateralGrip: 7.5,
    maxHealth: 105,
    accentHex: PALETTE.GOLD_HEX,
    hasLightbar: false,
    category: 'car',
    weaponKind: 'driveby',
  },
  moto: {
    type: 'moto',
    name: '夜行赛博摩托',
    textureKey: 'veh_moto',
    width: 30,
    height: 14,
    maxSpeed: 400,
    maxReverseSpeed: 120,
    acceleration: 620,
    braking: 660,
    turnSpeed: 4.5,
    drag: 1.65,
    lateralGrip: 8.8,
    maxHealth: 75,
    accentHex: PALETTE.NEON_PURPLE_HEX,
    hasLightbar: false,
    category: 'moto',
    weaponKind: 'driveby',
  },
  superbike: {
    type: 'superbike',
    name: '幽灵重机超跑摩托',
    textureKey: 'veh_superbike',
    width: 34,
    height: 16,
    maxSpeed: 450,
    maxReverseSpeed: 135,
    acceleration: 700,
    braking: 720,
    turnSpeed: 4.7,
    drag: 1.55,
    lateralGrip: 9.2,
    maxHealth: 85,
    accentHex: PALETTE.NEON_CYAN_HEX,
    hasLightbar: false,
    category: 'moto',
    weaponKind: 'driveby',
  },
  buggy: {
    type: 'buggy',
    name: '荒野越野突击车',
    textureKey: 'veh_buggy',
    width: 46,
    height: 28,
    maxSpeed: 385,
    maxReverseSpeed: 165,
    acceleration: 560,
    braking: 600,
    turnSpeed: 3.7,
    drag: 1.7,
    lateralGrip: 8.0,
    maxHealth: 165,
    accentHex: '#F97316',
    hasLightbar: false,
    category: 'car',
    weaponKind: 'driveby',
    collisionDamageScale: 0.65,
  },
  swat: {
    type: 'swat',
    name: '特警重装运兵车',
    textureKey: 'veh_swat',
    width: 58,
    height: 30,
    maxSpeed: 315,
    maxReverseSpeed: 140,
    acceleration: 400,
    braking: 540,
    turnSpeed: 2.7,
    drag: 1.95,
    lateralGrip: 7.2,
    maxHealth: 320,
    accentHex: '#38BDF8',
    hasLightbar: true,
    category: 'armor',
    weaponKind: 'driveby',
    collisionDamageScale: 0.35,
  },
  heli: {
    type: 'heli',
    name: '苍穹武装直升机',
    textureKey: 'veh_heli',
    width: 56,
    height: 32,
    maxSpeed: 380,
    maxReverseSpeed: 180,
    acceleration: 520,
    braking: 600,
    turnSpeed: 3.5,
    drag: 2.2,
    lateralGrip: 5.2,
    maxHealth: 260,
    accentHex: PALETTE.GOLD_HEX,
    hasLightbar: false,
    category: 'air',
    weaponKind: 'autocannon',
    isFlying: true,
    collisionDamageScale: 0.3,
  },
  tank: {
    type: 'tank',
    name: '泰坦重装主战坦克',
    textureKey: 'veh_tank',
    width: 60,
    height: 36,
    maxSpeed: 245,
    maxReverseSpeed: 130,
    acceleration: 340,
    braking: 520,
    turnSpeed: 2.4,
    drag: 2.4,
    lateralGrip: 9.2,
    maxHealth: 520,
    accentHex: '#4ADE80',
    hasLightbar: false,
    category: 'tank',
    weaponKind: 'tank_cannon',
    hasTurret: true,
    collisionDamageScale: 0.15,
  },
};

export const VEHICLE_CATALOG_ORDER: readonly VehicleType[] = [
  'compact',
  'cruiser',
  'buggy',
  'moto',
  'superbike',
  'racer',
  'supercar',
  'swat',
  'heli',
  'tank',
] as const;

export const VEHICLE_BUY_COSTS: Record<VehicleType, number> = {
  compact: 1200,
  cruiser: 1500,
  buggy: 1800,
  moto: 1400,
  superbike: 2400,
  racer: 2200,
  supercar: 3500,
  swat: 4200,
  heli: 7000,
  tank: 8000,
};

export type MechKind = 'titan' | 'phantom';

export interface MechSpec {
  kind: MechKind;
  name: string;
  shortName: string;
  tag: string;
  description: string;
  textureKey: string;
  cost: number;
  maxHp: number;
  speed: number;
  radius: number;
  primaryWeaponName: string;
  fireIntervalMs: number;
  damage: number;
  projectileSpeed: number;
  range: number;
  abilityName: string;
  abilityLabel: string;
  abilityCooldownSec: number;
  stompDamage: number;
  accentHex: string;
}

export const MECH_SPECS: Record<MechKind, MechSpec> = {
  titan: {
    kind: 'titan',
    name: '泰坦重装机甲 TITAN-X',
    shortName: '泰坦机甲',
    tag: '重装火力',
    description: '450 装甲护盾，踏步碾压小型敌军，主炮双联等离子加农炮，[空格] 发射 5 枚肩部集束火箭！',
    textureKey: 'mech_titan',
    cost: 450,
    maxHp: 450,
    speed: 185,
    radius: 20,
    primaryWeaponName: '双联高频等离子炮',
    fireIntervalMs: 135,
    damage: 44,
    projectileSpeed: 980,
    range: 560,
    abilityName: '肩部集束火箭齐射',
    abilityLabel: '集束火箭',
    abilityCooldownSec: 6,
    stompDamage: 55,
    accentHex: '#FFD166',
  },
  phantom: {
    kind: 'phantom',
    name: '幻影突击机甲 PHANTOM-Z',
    shortName: '幻影机甲',
    tag: '超导磁轨',
    description: '高机动赛博外骨骼机甲，连射贯通型超导磁轨光束，[空格] 释放 220px EMP 电磁震荡冲击波！',
    textureKey: 'mech_phantom',
    cost: 650,
    maxHp: 350,
    speed: 275,
    radius: 18,
    primaryWeaponName: '超导重型磁轨连射',
    fireIntervalMs: 165,
    damage: 68,
    projectileSpeed: 1480,
    range: 740,
    abilityName: 'EMP 电磁震荡冲击波',
    abilityLabel: 'EMP 冲击',
    abilityCooldownSec: 5,
    stompDamage: 30,
    accentHex: '#00F5FF',
  },
};

export const HORDE_GEAR_COSTS = {
  ARMOR_PACK_COST: 120,
  ARMOR_PACK_AMOUNT: 50,
  TURRET_COST: 280,
  TURRET_DURATION_SEC: 45,
  TURRET_FIRE_INTERVAL_MS: 240,
  TURRET_RANGE: 420,
  TURRET_DAMAGE: 26,
  MAX_TURRETS: 2,
  ORBITAL_STRIKE_COST: 360,
  ORBITAL_BEAM_COUNT: 4,
  ORBITAL_BEAM_DAMAGE: 280,
  ORBITAL_BEAM_RADIUS: 140,
  AIRDROP_TANK_COST: 550,
} as const;

export const VEHICLE_EXIT_MAX_SPEED = 240;

export type VehicleUpgradeTrack = 'engine' | 'handling' | 'armor';

export const VEHICLE_UPGRADE_CONFIG: Record<
  VehicleUpgradeTrack,
  {
    label: string;
    description: string;
    maxLevel: number;
    costs: readonly [number, number, number];
  }
> = {
  engine: {
    label: '引擎调校',
    description: '每级提升 +10% 极速与 +12% 加速度',
    maxLevel: 3,
    costs: [180, 320, 500],
  },
  handling: {
    label: '悬挂转向',
    description: '每级提升 +10% 转向响应与 +12% 抓地力',
    maxLevel: 3,
    costs: [150, 280, 450],
  },
  armor: {
    label: '装甲强化',
    description: '每级增加 +30 最大车身耐久并补满耐久',
    maxLevel: 3,
    costs: [160, 300, 480],
  },
};

export const ECONOMY_CONFIG = {
  VEHICLE_REPAIR_COST: 50,
  STEALTH_RESPRAY_COST: 60,
  PAINT_JOB_COST: 35,
  CLINIC_HEAL_COST: 50,
  SNACK_COST: 30,
  SNACK_HEAL: 50,
  RAMEN_COST: 45,
  RAMEN_HEAL: 80,
  VENDING_DRINK_COST: 15,
  VENDING_DRINK_HEAL: 30,
  SAFEHOUSE_PRICE: 750,
  CLUB_COCKTAIL_COST: 60,
  CLUB_COCKTAIL_HEAL: 65,
  CLUB_OVERDRIVE_SEC: 25,
  CLUB_BRIBE_COST: 50,
} as const;

export interface VehiclePaintOption {
  id: string;
  name: string;
  colorNum: number | null;
  swatchHex: string;
}

export const VEHICLE_PAINT_OPTIONS: VehiclePaintOption[] = [
  { id: 'stock', name: '原厂涂装', colorNum: null, swatchHex: '#64748B' },
  { id: 'cyan', name: '赛博青', colorNum: 0x38e8ff, swatchHex: '#00F5FF' },
  { id: 'pink', name: '霓虹粉', colorNum: 0xff55a3, swatchHex: '#FF2E88' },
  { id: 'gold', name: '帝国金', colorNum: 0xffd166, swatchHex: '#FFD166' },
  { id: 'purple', name: '幽冥紫', colorNum: 0xd06bff, swatchHex: '#C000FF' },
  { id: 'obsidian', name: '暗夜黑', colorNum: 0x64748b, swatchHex: '#1E293B' },
];

export interface RadioStationDef {
  index: number;
  name: string;
  genre: string;
  bpm: number;
}

export const RADIO_STATIONS: RadioStationDef[] = [
  { index: 0, name: '车载电台已关闭', genre: '静音', bpm: 0 },
  { index: 1, name: 'FM 98.5 霓虹合成波', genre: 'Synthwave', bpm: 118 },
  { index: 2, name: 'FM 104.2 暗港重低音', genre: 'Dark Bass', bpm: 130 },
  { index: 3, name: 'FM 88.8 铬铁工业脉冲', genre: 'Cyber Pulse', bpm: 140 },
];

export type EnemyKind = 'raider' | 'drone' | 'brute' | 'boss';

export interface EnemySpec {
  kind: EnemyKind;
  name: string;
  textureKey: string;
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  score: number;
  cashDrop: number;
  ranged: boolean;
}

export const ENEMY_SPECS: Record<EnemyKind, EnemySpec> = {
  raider: {
    kind: 'raider',
    name: '失控义体狂徒',
    textureKey: 'enemy_raider',
    hp: 45,
    speed: 145,
    damage: 10,
    radius: 14,
    score: 100,
    cashDrop: 18,
    ranged: false,
  },
  drone: {
    kind: 'drone',
    name: '猎杀无人机',
    textureKey: 'enemy_drone',
    hp: 36,
    speed: 125,
    damage: 8,
    radius: 13,
    score: 140,
    cashDrop: 24,
    ranged: true,
  },
  brute: {
    kind: 'brute',
    name: '重装生化暴君',
    textureKey: 'enemy_brute',
    hp: 150,
    speed: 98,
    damage: 18,
    radius: 18,
    score: 260,
    cashDrop: 45,
    ranged: false,
  },
  boss: {
    kind: 'boss',
    name: '铁幕机甲 · 屠戮者',
    textureKey: 'enemy_boss',
    hp: 580,
    speed: 108,
    damage: 24,
    radius: 24,
    score: 1200,
    cashDrop: 220,
    ranged: true,
  },
};

export interface RaceCheckpointDef {
  x: number;
  y: number;
  label: string;
  bonusSec: number;
}

export const RACE_CHECKPOINTS: RaceCheckpointDef[] = [
  { x: 1728, y: 704, label: '霓虹北街十字路口', bonusSec: 7 },
  { x: 2560, y: 704, label: '量子科教走廊', bonusSec: 7 },
  { x: 3392, y: 192, label: '北环雪岭入口', bonusSec: 8 },
  { x: 4608, y: 192, label: '苍穹山脉东峰弯道', bonusSec: 9 },
  { x: 4608, y: 1344, label: '火山东环高速段', bonusSec: 8 },
  { x: 4416, y: 2464, label: '星港主跑道东端', bonusSec: 9 },
  { x: 3648, y: 2464, label: '星港主跑道西口', bonusSec: 8 },
  { x: 3392, y: 2880, label: '航空港涡轮立交', bonusSec: 8 },
  { x: 2560, y: 2880, label: 'F1 涡轮高速直道', bonusSec: 8 },
  { x: 1728, y: 2880, label: '铬铁工业大桥西口', bonusSec: 8 },
  { x: 896, y: 2880, label: '暗港南货场直道', bonusSec: 8 },
  { x: 192, y: 2880, label: '深水码头西南弯', bonusSec: 8 },
  { x: 192, y: 1792, label: '西环跨河大桥', bonusSec: 8 },
  { x: 896, y: 1344, label: '中央大道西段', bonusSec: 7 },
  { x: 1728, y: 1344, label: '翠水湾林荫道', bonusSec: 7 },
  { x: 1312, y: 1184, label: '霓虹广场终点线', bonusSec: 0 },
];

export interface MissionStepDef {
  instruction: string;
  objectiveType: 'reach' | 'escape_wanted';
  targetPos: { x: number; y: number } | null;
  targetLabel?: string;
  triggerWantedStars?: number;
}

export interface MissionDef {
  id: string;
  title: string;
  category: string;
  summary: string;
  reward: number;
  timeLimitSec: number | null;
  steps: MissionStepDef[];
}

export const MISSION_DEFINITIONS: MissionDef[] = [
  {
    id: 'mission-courier',
    title: '数据加急派送',
    category: '中心派送',
    summary: '前往赛博集团南门取回加密存储芯片，并在倒计时结束前送达中心磁悬浮枢纽。',
    reward: 240,
    timeLimitSec: 68,
    steps: [
      {
        instruction: '前往赛博集团门前取回加密芯片',
        objectiveType: 'reach',
        targetPos: { x: 416, y: 464 },
        targetLabel: '赛博集团',
      },
      {
        instruction: '将加密芯片送达中心磁悬浮枢纽',
        objectiveType: 'reach',
        targetPos: { x: 416, y: 1056 },
        targetLabel: '磁悬浮枢纽',
      },
    ],
  },
  {
    id: 'mission-ramen-rush',
    title: '夜宵应急专送',
    category: '限时跑腿',
    summary: '狐狸夜宵拉面馆有一份加急外卖，需赶在冷却之前穿过街头送往天际公寓正门。',
    reward: 200,
    timeLimitSec: 52,
    steps: [
      {
        instruction: '前往狐狸夜宵拉面馆取餐',
        objectiveType: 'reach',
        targetPos: { x: 392, y: 632 },
        targetLabel: '狐狸拉面馆',
      },
      {
        instruction: '火速送往天际公寓门口',
        objectiveType: 'reach',
        targetPos: { x: 680, y: 464 },
        targetLabel: '天际公寓',
      },
    ],
  },
  {
    id: 'mission-street-run',
    title: '午夜霓虹极速',
    category: '街头竞速',
    summary: '驾驶载具高速穿越霓虹广场四大路口检查点，最终冲线抵达脉冲夜店门口。',
    reward: 360,
    timeLimitSec: 62,
    steps: [
      {
        instruction: '穿过检查点 1：西轴北街路口',
        objectiveType: 'reach',
        targetPos: { x: 896, y: 704 },
        targetLabel: '检查点 1',
      },
      {
        instruction: '穿过检查点 2：核心经脉北口',
        objectiveType: 'reach',
        targetPos: { x: 1728, y: 704 },
        targetLabel: '检查点 2',
      },
      {
        instruction: '穿过检查点 3：中央大道西口',
        objectiveType: 'reach',
        targetPos: { x: 896, y: 1344 },
        targetLabel: '检查点 3',
      },
      {
        instruction: '冲刺抵达终点：脉冲夜店门口',
        objectiveType: 'reach',
        targetPos: { x: 1112, y: 1056 },
        targetLabel: '终点 · 脉冲夜店',
      },
    ],
  },
  {
    id: 'mission-heat-escape',
    title: '涉险脱逃行动',
    category: '高危委托',
    summary: '从全息数据交易所提取机密包裹，甩掉闻讯而来的特区警队并安全返回枢纽行动终端。',
    reward: 450,
    timeLimitSec: null,
    steps: [
      {
        instruction: '前往全息数据交易所提取机密包裹',
        objectiveType: 'reach',
        targetPos: { x: 1480, y: 464 },
        targetLabel: '数据交易所',
        triggerWantedStars: 2,
      },
      {
        instruction: '甩掉特区警队追捕并解除通缉状态',
        objectiveType: 'escape_wanted',
        targetPos: null,
      },
      {
        instruction: '安全返回枢纽行动终端完成交付',
        objectiveType: 'reach',
        targetPos: { x: 1480, y: 632 },
        targetLabel: '枢纽行动终端',
      },
    ],
  },
  {
    id: 'mission-highland-run',
    title: '苍穹雪岭急件',
    category: '山地越野',
    summary: '沿量子科教走廊一路东进驶入苍穹山脉，登上雪岭观景台完成接头后南下滨河公园。',
    reward: 580,
    timeLimitSec: 115,
    steps: [
      {
        instruction: '沿科教大道穿过量子实验室门前',
        objectiveType: 'reach',
        targetPos: { x: 2560, y: 704 },
        targetLabel: '科教走廊',
      },
      {
        instruction: '攀登苍穹山脉前往雪岭观景台',
        objectiveType: 'reach',
        targetPos: { x: 3680, y: 608 },
        targetLabel: '苍穹雪岭观景台',
      },
      {
        instruction: '南下跨过跨河大桥抵达滨河生态公园',
        objectiveType: 'reach',
        targetPos: { x: 2096, y: 1584 },
        targetLabel: '滨河生态公园',
      },
    ],
  },
  {
    id: 'mission-harbor-heist',
    title: '暗港集装箱突袭',
    category: '暗港黑市',
    summary: '潜入南部暗港码头黑市接货点提取违禁货箱，摆脱警车封锁后送往铬铁重工工坊。',
    reward: 680,
    timeLimitSec: null,
    steps: [
      {
        instruction: '前往暗港集装箱码头黑市接货点',
        objectiveType: 'reach',
        targetPos: { x: 416, y: 2528 },
        targetLabel: '暗港黑市',
        triggerWantedStars: 2,
      },
      {
        instruction: '甩掉警队追捕并解除通缉状态',
        objectiveType: 'escape_wanted',
        targetPos: null,
      },
      {
        instruction: '将货箱送往铬铁重工工坊',
        objectiveType: 'reach',
        targetPos: { x: 1976, y: 2416 },
        targetLabel: '铬铁重工工坊',
      },
    ],
  },
  {
    id: 'mission-chrome-blitz',
    title: '全城高速涡轮测试',
    category: '极速挑战',
    summary: '在铬铁 F1 涡轮直道测试极速性能，一路冲入星港跑道再折返霓虹广场中心！',
    reward: 780,
    timeLimitSec: 110,
    steps: [
      {
        instruction: '驶入铬铁 F1 涡轮直道起点',
        objectiveType: 'reach',
        targetPos: { x: 1952, y: 2880 },
        targetLabel: '涡轮直道起点',
      },
      {
        instruction: '全速冲入星港主跑道',
        objectiveType: 'reach',
        targetPos: { x: 4224, y: 2464 },
        targetLabel: '星港主跑道',
      },
      {
        instruction: '北上穿过中央大道凯旋返回霓虹广场',
        objectiveType: 'reach',
        targetPos: { x: 1312, y: 1184 },
        targetLabel: '霓虹中心广场',
      },
    ],
  },
  {
    id: 'mission-skyport-intercept',
    title: '星港禁区劫机行动',
    category: '航空突袭',
    summary: '突袭星港国际航空区塔台提取绝密航电密钥，顶住重装围剿后交付量子实验室。',
    reward: 860,
    timeLimitSec: null,
    steps: [
      {
        instruction: '前往星港航空塔台夺取航电密钥',
        objectiveType: 'reach',
        targetPos: { x: 4352, y: 1632 },
        targetLabel: '星港航空塔台',
        triggerWantedStars: 3,
      },
      {
        instruction: '突围并彻底摆脱特区警队追缉',
        objectiveType: 'escape_wanted',
        targetPos: null,
      },
      {
        instruction: '将航电密钥交付量子核心实验室',
        objectiveType: 'reach',
        targetPos: { x: 1984, y: 480 },
        targetLabel: '量子核心实验室',
      },
    ],
  },
  {
    id: 'mission-volcano-relay',
    title: '黑曜石火山热核护送',
    category: '禁区急送',
    summary: '从冷核聚变电厂提取稳定冷却剂，穿越极险黑曜石火山公路送往火山边缘研究站。',
    reward: 740,
    timeLimitSec: 105,
    steps: [
      {
        instruction: '前往冷核聚变电厂领取稳定剂',
        objectiveType: 'reach',
        targetPos: { x: 2320, y: 2416 },
        targetLabel: '冷核聚变电厂',
      },
      {
        instruction: '穿越火山环形道送达火山研究前哨',
        objectiveType: 'reach',
        targetPos: { x: 3968, y: 1216 },
        targetLabel: '火山研究前哨',
      },
    ],
  },
];

