export const PALETTE = {
  BG: 0x080d18,
  BG_HEX: '#080D18',
  ROAD: 0x151c2b,
  ROAD_HEX: '#151C2B',
  ROAD_DARK: 0x0f1522,
  SIDEWALK: 0x1c2538,
  SIDEWALK_EDGE: 0x2b3650,
  BUILDING: 0x20283a,
  BUILDING_HEX: '#20283A',
  BUILDING_ROOF: 0x182030,
  BUILDING_INNER: 0x28334a,
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
  WIDTH: 3200,
  HEIGHT: 2400,
  TILE_SIZE: 32,
  STARTING_DISTRICT: '霓虹广场',
  PLAYER_SPAWN: { x: 800, y: 608 },
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
    description: '漫游五大连通城区，承接委托、驾驶飙车、飞跃跳台、搜集霓虹芯片并摆脱警队追捕。',
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
    description: '驾驶高性能超跑穿越 14 个全城检查点，踩踏涡轮加速带与飞跃跳台，刷新环线纪录！',
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
  INITIAL_CASH: 500,
  INTERACT_RADIUS: 68,
  VEHICLE_ENTER_RADIUS: 64,
} as const;

export type WeaponId = 'pistol' | 'smg' | 'shotgun';

export interface WeaponSpec {
  id: WeaponId;
  name: string;
  shortName: string;
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
}

export const WEAPON_ORDER: readonly WeaponId[] = ['pistol', 'smg', 'shotgun'] as const;

export const WEAPON_SPECS: Record<WeaponId, WeaponSpec> = {
  pistol: {
    id: 'pistol',
    name: '脉冲手枪 MK-II',
    shortName: '脉冲手枪',
    description: '制式高能电浆手枪，射速稳定、后坐可控，内置微核充能无需耗材。',
    damage: 26,
    fireIntervalMs: 250,
    projectileSpeed: 760,
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
  },
  smg: {
    id: 'smg',
    name: '霓虹冲锋枪 V-9',
    shortName: '霓虹冲锋枪',
    description: '高射速赛博微冲，弹幕压制力极强，适合街头火拼与快速清场。',
    damage: 17,
    fireIntervalMs: 95,
    projectileSpeed: 840,
    range: 450,
    pellets: 1,
    spreadDeg: 6.5,
    recoilPx: 2.4,
    cameraShake: 0.0018,
    projectileTexture: 'proj_pink',
    colorHex: '#FF2E88',
    colorNum: 0xff2e88,
    infiniteAmmo: false,
    initialAmmo: 120,
    maxAmmo: 360,
    buyCost: 260,
    ammoPackCost: 45,
    ammoPackSize: 90,
  },
  shotgun: {
    id: 'shotgun',
    name: '等离子霰弹枪 M8',
    shortName: '等离子霰弹',
    description: '一次喷射5发高热粒子弹丸，近距离击退与爆发打击感拉满。',
    damage: 19,
    fireIntervalMs: 580,
    projectileSpeed: 690,
    range: 310,
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
  MVP_MAX_STARS: 2,
  DETECT_RANGE: 270,
  LOS_BREAK_RANGE: 325,
  ESCAPE_TIME_STAR_1: 6.5,
  ESCAPE_TIME_STAR_2: 9.5,
  POLICE_PATROL_SPEED: 120,
  POLICE_PURSUIT_FOOT_SPEED: 238,
  POLICE_PURSUIT_VEH_SPEED: 380,
  POLICE_SEARCH_SPEED: 175,
  POLICE_CONTACT_DAMAGE_FOOT: 12,
  POLICE_CONTACT_DAMAGE_VEH: 7,
  RESPAWN_PENALTY: 100,
  CLINIC_RESPAWN: { x: 248, y: 704 },
} as const;

export type VehicleType = 'compact' | 'racer' | 'cruiser' | 'supercar' | 'moto';

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
}

export const VEHICLE_SPECS: Record<VehicleType, VehicleSpec> = {
  compact: {
    type: 'compact',
    name: '都市紧凑型',
    textureKey: 'veh_compact',
    width: 44,
    height: 24,
    maxSpeed: 500,
    maxReverseSpeed: 180,
    acceleration: 660,
    braking: 580,
    turnSpeed: 3.4,
    drag: 1.8,
    lateralGrip: 7.4,
    maxHealth: 110,
    accentHex: PALETTE.NEON_CYAN_HEX,
    hasLightbar: false,
  },
  racer: {
    type: 'racer',
    name: '街头竞速车',
    textureKey: 'veh_racer',
    width: 48,
    height: 24,
    maxSpeed: 640,
    maxReverseSpeed: 210,
    acceleration: 820,
    braking: 720,
    turnSpeed: 3.8,
    drag: 1.5,
    lateralGrip: 6.6,
    maxHealth: 95,
    accentHex: PALETTE.NEON_PINK_HEX,
    hasLightbar: false,
  },
  cruiser: {
    type: 'cruiser',
    name: '特区巡逻警车',
    textureKey: 'veh_cruiser',
    width: 48,
    height: 26,
    maxSpeed: 540,
    maxReverseSpeed: 190,
    acceleration: 620,
    braking: 640,
    turnSpeed: 3.1,
    drag: 1.7,
    lateralGrip: 6.8,
    maxHealth: 150,
    accentHex: PALETTE.WARNING_RED_HEX,
    hasLightbar: true,
  },
  supercar: {
    type: 'supercar',
    name: '幻影超跑 GT-X',
    textureKey: 'veh_super',
    width: 50,
    height: 24,
    maxSpeed: 720,
    maxReverseSpeed: 230,
    acceleration: 960,
    braking: 800,
    turnSpeed: 3.9,
    drag: 1.35,
    lateralGrip: 7.2,
    maxHealth: 105,
    accentHex: PALETTE.GOLD_HEX,
    hasLightbar: false,
  },
  moto: {
    type: 'moto',
    name: '夜行赛博摩托',
    textureKey: 'veh_moto',
    width: 30,
    height: 14,
    maxSpeed: 600,
    maxReverseSpeed: 140,
    acceleration: 900,
    braking: 760,
    turnSpeed: 4.6,
    drag: 1.5,
    lateralGrip: 8.6,
    maxHealth: 75,
    accentHex: PALETTE.NEON_PURPLE_HEX,
    hasLightbar: false,
  },
};

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
  VEHICLE_REPAIR_COST: 60,
  STEALTH_RESPRAY_COST: 120,
  CLINIC_HEAL_COST: 60,
  SNACK_COST: 35,
  SNACK_HEAL: 45,
  RAMEN_COST: 50,
  RAMEN_HEAL: 75,
} as const;

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
  { x: 1248, y: 320, label: '赛博大道东口', bonusSec: 6 },
  { x: 1744, y: 320, label: '北跨河霓虹大桥', bonusSec: 7 },
  { x: 2224, y: 320, label: '苍穹北坡', bonusSec: 6 },
  { x: 2880, y: 320, label: '东岸山顶弯道', bonusSec: 8 },
  { x: 2880, y: 896, label: '东岸高地直道', bonusSec: 7 },
  { x: 2880, y: 1632, label: '铬铁涡轮直道东', bonusSec: 8 },
  { x: 2880, y: 2144, label: '南高速外环', bonusSec: 8 },
  { x: 2192, y: 2144, label: '铬铁工坊直道', bonusSec: 7 },
  { x: 1744, y: 2144, label: '暗港跨海大桥', bonusSec: 7 },
  { x: 1248, y: 2144, label: '暗港码头大道', bonusSec: 7 },
  { x: 352, y: 2144, label: '深水泊位发卡弯', bonusSec: 8 },
  { x: 352, y: 1632, label: '翠水湾南大道', bonusSec: 7 },
  { x: 352, y: 896, label: '霓虹西街冲刺', bonusSec: 7 },
  { x: 800, y: 320, label: '赛博大道终点线', bonusSec: 0 },
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
    summary: '前往赛博集团北门取回加密存储芯片，并在倒计时结束前送达地铁枢纽。',
    reward: 220,
    timeLimitSec: 65,
    steps: [
      {
        instruction: '前往赛博集团北门取回加密芯片',
        objectiveType: 'reach',
        targetPos: { x: 608, y: 224 },
        targetLabel: '赛博集团',
      },
      {
        instruction: '将加密芯片送达地铁枢纽站台',
        objectiveType: 'reach',
        targetPos: { x: 608, y: 984 },
        targetLabel: '地铁枢纽',
      },
    ],
  },
  {
    id: 'mission-ramen-rush',
    title: '夜宵应急专送',
    category: '限时跑腿',
    summary: '狐狸拉面馆有一份加急夜宵单，需赶在冷掉之前送往天际公寓正门。',
    reward: 180,
    timeLimitSec: 48,
    steps: [
      {
        instruction: '前往狐狸拉面馆取餐',
        objectiveType: 'reach',
        targetPos: { x: 576, y: 676 },
        targetLabel: '狐狸拉面馆',
      },
      {
        instruction: '火速送往天际公寓门口',
        objectiveType: 'reach',
        targetPos: { x: 1456, y: 224 },
        targetLabel: '天际公寓',
      },
    ],
  },
  {
    id: 'mission-street-run',
    title: '午夜霓虹极速',
    category: '街头竞速',
    summary: '驾驶载具高速穿越霓虹广场四大检查点，最终冲线抵达脉冲夜店门口。',
    reward: 340,
    timeLimitSec: 58,
    steps: [
      {
        instruction: '穿过检查点 1：赛博大道东段',
        objectiveType: 'reach',
        targetPos: { x: 1248, y: 320 },
        targetLabel: '检查点 1',
      },
      {
        instruction: '穿过检查点 2：合成波街东段',
        objectiveType: 'reach',
        targetPos: { x: 1248, y: 896 },
        targetLabel: '检查点 2',
      },
      {
        instruction: '穿过检查点 3：霓虹南路口',
        objectiveType: 'reach',
        targetPos: { x: 352, y: 896 },
        targetLabel: '检查点 3',
      },
      {
        instruction: '冲刺抵达终点：脉冲夜店门口',
        objectiveType: 'reach',
        targetPos: { x: 992, y: 984 },
        targetLabel: '终点 · 脉冲夜店',
      },
    ],
  },
  {
    id: 'mission-heat-escape',
    title: '涉险脱逃行动',
    category: '高危委托',
    summary: '从数据交易所提取机密包裹，甩掉闻讯而来的特区警队追捕并安全返回枢纽终端。',
    reward: 420,
    timeLimitSec: null,
    steps: [
      {
        instruction: '前往数据交易所提取机密包裹',
        objectiveType: 'reach',
        targetPos: { x: 976, y: 224 },
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
        targetPos: { x: 592, y: 544 },
        targetLabel: '枢纽行动终端',
      },
    ],
  },
  {
    id: 'mission-highland-run',
    title: '跨河苍穹山急件',
    category: '山地越野',
    summary: '驾车穿越跨河霓虹大桥，沿东岸盘山公路登上苍穹山顶观景台完成秘密接头，再经滨河公园返回。',
    reward: 520,
    timeLimitSec: 95,
    steps: [
      {
        instruction: '经赛博大道东行，驶过北跨河霓虹大桥',
        objectiveType: 'reach',
        targetPos: { x: 1744, y: 320 },
        targetLabel: '北跨河霓虹大桥',
      },
      {
        instruction: '沿东岸盘山公路前往苍穹山顶观景台',
        objectiveType: 'reach',
        targetPos: { x: 2224, y: 544 },
        targetLabel: '苍穹山顶观景台',
      },
      {
        instruction: '南下穿过滨河大桥，抵达滨河生态公园湖心桥',
        objectiveType: 'reach',
        targetPos: { x: 800, y: 1360 },
        targetLabel: '滨河生态公园',
      },
    ],
  },
  {
    id: 'mission-harbor-heist',
    title: '暗港集装箱突袭',
    category: '暗港黑市',
    summary: '潜入南部暗港码头提取黑市违禁货箱，随后驾车跨过暗港大桥甩掉警车封锁送往铬铁工坊。',
    reward: 650,
    timeLimitSec: null,
    steps: [
      {
        instruction: '前往暗港集装箱码头黑市接货点',
        objectiveType: 'reach',
        targetPos: { x: 960, y: 2048 },
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
        targetPos: { x: 2280, y: 1790 },
        targetLabel: '铬铁重工工坊',
      },
    ],
  },
  {
    id: 'mission-chrome-blitz',
    title: '全城高速涡轮测试',
    category: '极速挑战',
    summary: '在铬铁工业区高架直道测试超跑涡轮，全速冲过跨海大桥与东岸山道返回霓虹广场！',
    reward: 700,
    timeLimitSec: 90,
    steps: [
      {
        instruction: '驶入铬铁涡轮高速直道起点',
        objectiveType: 'reach',
        targetPos: { x: 1952, y: 1632 },
        targetLabel: '涡轮直道起点',
      },
      {
        instruction: '冲刺经过东岸高速拐点',
        objectiveType: 'reach',
        targetPos: { x: 2880, y: 1632 },
        targetLabel: '东岸高速弯角',
      },
      {
        instruction: '北上经过苍穹东崖直道并跨桥返回枢纽',
        objectiveType: 'reach',
        targetPos: { x: 800, y: 608 },
        targetLabel: '霓虹中心广场',
      },
    ],
  },
];

