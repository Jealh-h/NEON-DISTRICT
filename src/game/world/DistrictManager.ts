import { PALETTE, WORLD_CONFIG } from '../config/BalanceConfig';
import { LandmarkInfo } from '../ui/GameEvents';

export interface CityRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BuildingDef extends CityRect {
  id: string;
  label: string;
  neonColor: number;
  accentHex: string;
  roofStyle:
    | 'tech'
    | 'store'
    | 'diner'
    | 'residential'
    | 'booth'
    | 'warehouse'
    | 'container'
    | 'factory'
    | 'club'
    | 'arcade'
    | 'stadium'
    | 'police'
    | 'lighthouse';
  roofColor?: number;
  signText: string;
  hasFan?: boolean;
}

export interface PropDef {
  type:
    | 'lamp'
    | 'vending'
    | 'planter'
    | 'bench'
    | 'kiosk'
    | 'bollard'
    | 'cone'
    | 'stool'
    | 'trashbin'
    | 'billboard'
    | 'tree_pine'
    | 'tree_sakura'
    | 'tree_emerald'
    | 'tree_autumn'
    | 'tree_snow'
    | 'tree_palm'
    | 'atm'
    | 'radar'
    | 'barge'
    | 'speedboat';
  x: number;
  y: number;
  collidable: boolean;
  tint?: number;
  label?: string;
}

export interface InteractivePropDef {
  id: string;
  type: 'atm' | 'barrel' | 'crate' | 'hydrant';
  x: number;
  y: number;
}

export interface TrafficSignalDef {
  x: number;
  y: number;
  axis: 'ns' | 'ew';
}

export interface SteamVentDef {
  x: number;
  y: number;
}

export interface MountainDef extends CityRect {
  id: string;
  name: string;
  elevation: number;
  biome: 'snow' | 'desert' | 'forest' | 'volcano';
}

export interface TurboStripDef extends CityRect {
  id: string;
  dir: 'E' | 'W' | 'N' | 'S';
}

export interface StuntRampDef extends CityRect {
  id: string;
  name: string;
}

export interface DistrictZoneDef extends CityRect {
  id: string;
  name: string;
}

export interface SignalTowerDef {
  id: string;
  districtId: string;
  districtName: string;
  name: string;
  x: number;
  y: number;
  rewardCash: number;
  rewardExp: number;
  accentHex: string;
}

export interface MetroStationDef {
  id: string;
  districtId: string;
  name: string;
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  accentHex: string;
}

export interface SecretVaultDef {
  id: string;
  districtId: string;
  name: string;
  hint: string;
  x: number;
  y: number;
  rewardCash: number;
  rewardExp: number;
  rewardArmor: number;
}

export interface GangOutpostDef {
  id: string;
  districtId: string;
  name: string;
  faction: string;
  x: number;
  y: number;
  radius: number;
  guardCount: number;
  hasBoss: boolean;
  rewardCash: number;
  rewardExp: number;
  accentHex: string;
}

export interface DistrictData {
  id: string;
  name: string;
  plazaCenter: { x: number; y: number };
  exitMarkers: {
    east: { x: number; y: number; label: string };
    south: { x: number; y: number; label: string };
    farEast: { x: number; y: number; label: string };
  };
  roads: CityRect[];
  sidewalks: CityRect[];
  plazaZones: CityRect[];
  parks: CityRect[];
  snowZones: CityRect[];
  desertZones: CityRect[];
  volcanoZones: CityRect[];
  lavaZones: CityRect[];
  sandZones: CityRect[];
  waterfalls: CityRect[];
  docks: CityRect[];
  runways: CityRect[];
  helipads: Array<{ x: number; y: number }>;
  rivers: CityRect[];
  waterColliders: CityRect[];
  bridges: CityRect[];
  mountains: MountainDef[];
  turboStrips: TurboStripDef[];
  stuntRamps: StuntRampDef[];
  zones: DistrictZoneDef[];
  parkingLot: CityRect;
  buildings: BuildingDef[];
  props: PropDef[];
  interactiveProps: InteractivePropDef[];
  trafficSignals: TrafficSignalDef[];
  steamVents: SteamVentDef[];
  landmarks: LandmarkInfo[];
  signalTowers: SignalTowerDef[];
  metroStations: MetroStationDef[];
  secretVaults: SecretVaultDef[];
  gangOutposts: GangOutpostDef[];
}

export const CITY_DISTRICTS = [
  { id: 'neon-plaza', name: '霓虹广场', direction: '中心枢纽 · CBD 商业核' },
  { id: 'quantum-tech', name: '量子科教区', direction: '北中走廊 · 尖端研发城' },
  { id: 'skyline-highlands', name: '苍穹山脉', direction: '东北高地 · 雪岭峡谷火山' },
  { id: 'riverside-park', name: '滨河生态公园', direction: '翠水湾岸 · 竞技场绿带' },
  { id: 'dark-harbor', name: '暗港码头', direction: '西南港湾 · 黑市金沙灯塔' },
  { id: 'chrome-town', name: '铬铁工业区', direction: '东南重工 · F1 涡轮赛道' },
  { id: 'neon-skyport', name: '星港航空区', direction: '远东空港 · 超长跑道机库' },
] as const;

export class DistrictManager {
  public getDistrictNameAt(x: number, y: number, data: DistrictData): string {
    for (const z of data.zones) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
        return z.name;
      }
    }
    return data.name;
  }

  public getDistrictZoneAt(x: number, y: number, data: DistrictData): DistrictZoneDef | null {
    for (const z of data.zones) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
        return z;
      }
    }
    return null;
  }

  public getNeonPlaza(): DistrictData {
    // 7 Grand Cohesive Districts covering full 4800 x 3584 world
    const zones: DistrictZoneDef[] = [
      { id: 'neon-plaza', name: '霓虹广场', x: 0, y: 0, w: 1792, h: 1408 },
      { id: 'quantum-tech', name: '量子科教区', x: 1792, y: 0, w: 1664, h: 1408 },
      { id: 'skyline-highlands', name: '苍穹山脉', x: 3456, y: 0, w: 1344, h: 1408 },
      { id: 'riverside-park', name: '滨河生态公园', x: 0, y: 1408, w: 3456, h: 640 },
      { id: 'dark-harbor', name: '暗港码头', x: 0, y: 2048, w: 1792, h: 1536 },
      { id: 'chrome-town', name: '铬铁工业区', x: 1792, y: 2048, w: 1664, h: 1536 },
      { id: 'neon-skyport', name: '星港航空区', x: 3456, y: 1408, w: 1344, h: 2176 },
    ];

    // 128px wide 4-tile arterial grid + outer ring loop + highlands mountain pass
    const roads: CityRect[] = [
      // Horizontal arterials
      { x: 128, y: 128, w: 4544, h: 128 },   // 北环高速 (y: 128..256)
      { x: 128, y: 640, w: 3328, h: 128 },   // 霓虹北街 / 科教大道 (y: 640..768)
      { x: 3456, y: 672, w: 1088, h: 96 },   // 苍穹盘山峡谷公路 (y: 672..768)
      { x: 128, y: 1280, w: 4544, h: 128 },  // 中央大道 (y: 1280..1408)
      { x: 128, y: 2048, w: 4544, h: 128 },  // 滨河干道 / 涡轮大道 (y: 2048..2176)
      { x: 128, y: 2816, w: 4544, h: 128 },  // 南港工贸大道 / F1赛道南段 (y: 2816..2944)
      { x: 128, y: 3264, w: 3328, h: 96 },   // 南环滨海大道 (y: 3264..3360)

      // Vertical arterials
      { x: 128, y: 128, w: 128, h: 3232 },   // 西环高速 (x: 128..256)
      { x: 832, y: 128, w: 128, h: 3232 },   // 中轴西街 / 暗港大道 (x: 832..960)
      { x: 1664, y: 128, w: 128, h: 3232 },  // 核心经脉大道 (x: 1664..1792)
      { x: 2496, y: 128, w: 128, h: 3232 },  // 东岸枢纽大道 (x: 2496..2624)
      { x: 3328, y: 128, w: 128, h: 3232 },  // 航空高速 (x: 3328..3456)
      { x: 4544, y: 128, w: 128, h: 2816 },  // 远东环山高速 (x: 4544..4672)
      // Skyport taxiway connector between Central Ave & Runway Apron
      { x: 3840, y: 2176, w: 96, h: 160 },
      { x: 3840, y: 2592, w: 96, h: 224 },
    ];

    const sidewalks: CityRect[] = [
      // Neon Plaza urban blocks
      { x: 256, y: 256, w: 576, h: 384 },
      { x: 960, y: 256, w: 704, h: 384 },
      { x: 256, y: 768, w: 576, h: 512 },
      // Quantum Tech blocks
      { x: 1792, y: 256, w: 704, h: 384 },
      { x: 2624, y: 256, w: 704, h: 384 },
      { x: 1792, y: 768, w: 704, h: 512 },
      { x: 2624, y: 768, w: 704, h: 512 },
      // Chrome Town upper blocks
      { x: 1792, y: 2176, w: 704, h: 640 },
      { x: 2624, y: 2176, w: 704, h: 640 },
      { x: 1792, y: 2944, w: 1536, h: 320 },
      // Skyport terminal & cargo aprons
      { x: 3456, y: 1408, w: 1088, h: 640 },
      { x: 3456, y: 2176, w: 1088, h: 640 },
      { x: 3456, y: 2944, w: 1088, h: 416 },
    ];

    const plazaZones: CityRect[] = [
      // Grand Neon Plaza pedestrian core
      { x: 960, y: 768, w: 704, h: 512 },
      // Quantum Central Courtyard
      { x: 2208, y: 1056, w: 256, h: 192 },
    ];

    const parks: CityRect[] = [
      // Riverside Park North Bank (across whole river frontage)
      { x: 256, y: 1408, w: 576, h: 288 },
      { x: 960, y: 1408, w: 704, h: 288 },
      { x: 1792, y: 1408, w: 704, h: 288 },
      { x: 2624, y: 1408, w: 704, h: 288 },
      // Riverside Park South Promenade
      { x: 256, y: 1888, w: 576, h: 160 },
      { x: 960, y: 1888, w: 704, h: 160 },
      { x: 1792, y: 1888, w: 704, h: 160 },
      { x: 2624, y: 1888, w: 704, h: 160 },
    ];

    const snowZones: CityRect[] = [
      // NW Skyline Highlands: Alpine Snow Peaks
      { x: 3456, y: 256, w: 544, h: 416 },
      { x: 3456, y: 0, w: 608, h: 128 },
    ];

    const desertZones: CityRect[] = [
      // NE Skyline Highlands: Red-Rock Canyon & Badlands
      { x: 4000, y: 256, w: 544, h: 416 },
      { x: 4064, y: 0, w: 736, h: 128 },
      { x: 4672, y: 128, w: 128, h: 640 },
    ];

    const volcanoZones: CityRect[] = [
      // SE Skyline Highlands: Obsidian Active Volcano Region
      { x: 3456, y: 768, w: 1088, h: 512 },
      { x: 4672, y: 768, w: 128, h: 512 },
    ];

    const lavaZones: CityRect[] = [
      // Molten Lava Caldera & River inside Volcano (keeps mountain roads clear)
      { x: 4128, y: 896, w: 288, h: 192 },
      { x: 4224, y: 1088, w: 96, h: 128 },
    ];

    const sandZones: CityRect[] = [
      // Golden Beach Strip & Lighthouse Sandbar Island
      { x: 256, y: 2944, w: 576, h: 320 },
      { x: 960, y: 2944, w: 704, h: 320 },
      { x: 128, y: 3360, w: 1664, h: 64 },
      { x: 1184, y: 3424, w: 224, h: 128 }, // Offshore Lighthouse Island
    ];

    const waterfalls: CityRect[] = [
      { x: 1984, y: 1664, w: 160, h: 32 },
      { x: 3456, y: 1664, w: 96, h: 64 },
    ];

    const docks: CityRect[] = [
      // Harbor Industrial Blocks + Cargo Piers extending over Southern Ocean
      { x: 256, y: 2176, w: 576, h: 640 },
      { x: 960, y: 2176, w: 704, h: 640 },
      // Timber/Steel Piers jutting south into ocean
      { x: 352, y: 3360, w: 96, h: 192 },
      { x: 640, y: 3360, w: 96, h: 192 },
      { x: 1248, y: 3360, w: 96, h: 96 }, // Pier walkway connecting beach to Lighthouse Island
    ];

    const runways: CityRect[] = [
      { x: 3520, y: 2336, w: 960, h: 256 },
    ];

    const helipads: Array<{ x: number; y: number }> = [
      { x: 3680, y: 2240 },
      { x: 4160, y: 2240 },
      { x: 544, y: 2432 },
    ];

    // Visual river & ocean channels
    const rivers: CityRect[] = [
      { x: 0, y: 1696, w: 3456, h: 192 },  // Central Emerald River
      { x: 0, y: 3424, w: 4800, h: 160 },  // Southern Deep Ocean
    ];

    // Bridges cleanly spanning the river & lagoon
    const bridges: CityRect[] = [
      { x: 128, y: 1696, w: 128, h: 192 },   // West Ring Bridge
      { x: 832, y: 1696, w: 128, h: 192 },   // West Axis / Harbor Bridge
      { x: 1664, y: 1696, w: 128, h: 192 },  // Central Spine Bridge
      { x: 2048, y: 1696, w: 96, h: 192 },   // Park Wooden Pier Bridge
      { x: 2496, y: 1696, w: 128, h: 192 },  // East Hub Bridge
      { x: 3328, y: 1696, w: 128, h: 192 },  // Skyport Expressway Bridge
    ];

    // Physics water colliders strictly in the segments BETWEEN bridges & piers!
    const waterColliders: CityRect[] = [
      // River segments
      { x: 0, y: 1696, w: 128, h: 192 },
      { x: 256, y: 1696, w: 576, h: 192 },
      { x: 960, y: 1696, w: 704, h: 192 },
      { x: 1792, y: 1696, w: 256, h: 192 },
      { x: 2144, y: 1696, w: 352, h: 192 },
      { x: 2624, y: 1696, w: 704, h: 192 },
      // Southern ocean segments around cargo piers & lighthouse island
      { x: 0, y: 3424, w: 352, h: 160 },
      { x: 448, y: 3424, w: 192, h: 160 },
      { x: 736, y: 3424, w: 448, h: 160 },
      { x: 1408, y: 3424, w: 3392, h: 160 },
      // Volcano Molten Caldera Hazard Collider (non-drivable lava pool)
      { x: 4128, y: 896, w: 288, h: 192 },
    ];

    const mountains: MountainDef[] = [
      { id: 'mt-snow-1', name: '苍穹雪峰主脊', x: 3520, y: 288, w: 256, h: 192, elevation: 1450, biome: 'snow' },
      { id: 'mt-canyon-1', name: '红岩断崖峰', x: 4192, y: 288, w: 288, h: 192, elevation: 1120, biome: 'desert' },
      { id: 'mt-volcano-1', name: '黑曜熔岩火山锥', x: 3584, y: 832, w: 320, h: 224, elevation: 1320, biome: 'volcano' },
    ];

    const turboStrips: TurboStripDef[] = [
      // Chrome Town F1 Turbo Straight (y: 2816..2944)
      { id: 'turbo-f1-1', x: 1856, y: 2848, w: 160, h: 64, dir: 'E' },
      { id: 'turbo-f1-2', x: 2784, y: 2848, w: 160, h: 64, dir: 'E' },
      // North Ring Highway Turbo
      { id: 'turbo-north-1', x: 2048, y: 160, w: 160, h: 64, dir: 'E' },
      // Skyport Main Runway Booster
      { id: 'turbo-runway-1', x: 3744, y: 2432, w: 192, h: 64, dir: 'E' },
      { id: 'turbo-runway-2', x: 4096, y: 2432, w: 160, h: 64, dir: 'E' },
      // Central Boulevard Westbound Booster
      { id: 'turbo-central-w', x: 2048, y: 1312, w: 160, h: 64, dir: 'W' },
    ];

    const stuntRamps: StuntRampDef[] = [
      { id: 'ramp-harbor', name: '暗港跨海飞跃跳台', x: 768, y: 2944, w: 64, h: 64 },
      { id: 'ramp-chrome', name: '铬铁涡轮腾空台', x: 2304, y: 2848, w: 64, h: 64 },
      { id: 'ramp-canyon', name: '红岩峡谷飞跃坡', x: 4032, y: 512, w: 64, h: 64 },
      { id: 'ramp-skyport', name: '星港跑道极限跳台', x: 4384, y: 2432, w: 64, h: 64 },
      { id: 'ramp-river', name: '翠水湾西岸跳台', x: 1312, y: 1600, w: 64, h: 64 },
    ];

    const parkingLot: CityRect = { x: 592, y: 1088, w: 192, h: 160 };

    // Cleanly zoned buildings inside urban blocks (never overlapping roads or sidewalks clearance)
    const buildings: BuildingDef[] = [
      // === 霓虹广场 NEON PLAZA ===
      {
        id: 'corp-tower',
        label: '赛博集团总部',
        x: 304,
        y: 288,
        w: 224,
        h: 144,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'tech',
        signText: 'ARASAKA',
        hasFan: true,
      },
      {
        id: 'skyline-apts',
        label: '天际公寓 · 安全屋',
        x: 576,
        y: 288,
        w: 208,
        h: 144,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'residential',
        signText: 'SAFEHOUSE',
      },
      {
        id: 'kitsune-noodles',
        label: '狐狸夜宵拉面馆',
        x: 304,
        y: 480,
        w: 176,
        h: 128,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'diner',
        signText: 'RAMEN',
      },
      {
        id: 'byte-mart',
        label: '字节便利店 24/7',
        x: 544,
        y: 480,
        w: 208,
        h: 128,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'store',
        signText: '24/7',
      },
      {
        id: 'police-hq',
        label: 'NCPD 特区警署',
        x: 1008,
        y: 288,
        w: 272,
        h: 144,
        neonColor: 0x38bdf8,
        accentHex: '#38BDF8',
        roofStyle: 'police',
        signText: 'NCPD',
        hasFan: true,
      },
      {
        id: 'data-exchange',
        label: '全息数据交易所',
        x: 1344,
        y: 288,
        w: 272,
        h: 144,
        neonColor: PALETTE.NEON_PURPLE,
        accentHex: PALETTE.NEON_PURPLE_HEX,
        roofStyle: 'tech',
        signText: 'NEXUS',
        hasFan: true,
      },
      {
        id: 'cyber-clinic',
        label: '义体急救诊所',
        x: 1008,
        y: 480,
        w: 224,
        h: 128,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'booth',
        signText: 'CLINIC',
      },
      {
        id: 'nexus-ops',
        label: '枢纽行动终端',
        x: 1344,
        y: 480,
        w: 272,
        h: 128,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'tech',
        signText: 'OPS',
      },
      {
        id: 'arcade-lounge',
        label: '街机电玩俱乐部',
        x: 304,
        y: 800,
        w: 224,
        h: 144,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'arcade',
        signText: 'ARCADE',
      },
      {
        id: 'plaza-tech',
        label: '广场军械库',
        x: 576,
        y: 800,
        w: 208,
        h: 144,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'store',
        signText: 'ARMS',
      },
      {
        id: 'plaza-garage',
        label: '霓虹超跑车库',
        x: 304,
        y: 1088,
        w: 240,
        h: 144,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'warehouse',
        signText: 'GARAGE',
      },
      {
        id: 'synth-club',
        label: '脉冲夜店酒吧',
        x: 1008,
        y: 1088,
        w: 208,
        h: 144,
        neonColor: PALETTE.NEON_PURPLE,
        accentHex: PALETTE.NEON_PURPLE_HEX,
        roofStyle: 'club',
        signText: 'PULSE',
      },

      // === 量子科教区 QUANTUM TECH ===
      {
        id: 'quantum-lab',
        label: '量子核心实验室',
        x: 1840,
        y: 288,
        w: 288,
        h: 160,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'tech',
        signText: 'QUANTUM',
        hasFan: true,
      },
      {
        id: 'server-matrix',
        label: '超算矩阵塔',
        x: 2192,
        y: 288,
        w: 256,
        h: 160,
        neonColor: PALETTE.NEON_PURPLE,
        accentHex: PALETTE.NEON_PURPLE_HEX,
        roofStyle: 'tech',
        signText: 'MATRIX',
        hasFan: true,
      },
      {
        id: 'cyber-academy',
        label: '义体工程研究院',
        x: 1840,
        y: 800,
        w: 288,
        h: 160,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'tech',
        signText: 'ACADEMY',
      },
      {
        id: 'neural-hub',
        label: '神经链路大厦',
        x: 2672,
        y: 288,
        w: 272,
        h: 160,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'tech',
        signText: 'NEURAL',
        hasFan: true,
      },
      {
        id: 'drone-foundry',
        label: '无人机航电中心',
        x: 3008,
        y: 288,
        w: 272,
        h: 160,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'factory',
        signText: 'DRONE',
      },
      {
        id: 'holo-theater',
        label: '全息巨幕剧院',
        x: 2672,
        y: 800,
        w: 288,
        h: 176,
        neonColor: PALETTE.NEON_PURPLE,
        accentHex: PALETTE.NEON_PURPLE_HEX,
        roofStyle: 'club',
        signText: 'HOLO',
      },
      {
        id: 'synth-conservatory',
        label: '生态科研温室',
        x: 3024,
        y: 800,
        w: 256,
        h: 176,
        neonColor: 0x34d399,
        accentHex: '#34D399',
        roofStyle: 'stadium',
        signText: 'BIO',
      },

      // === 滨河公园 RIVERSIDE ===
      {
        id: 'neon-stadium',
        label: '霓虹穹顶竞技场',
        x: 2672,
        y: 1440,
        w: 320,
        h: 192,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'stadium',
        signText: 'ARENA',
      },

      // === 暗港码头 DARK HARBOR ===
      {
        id: 'harbor-customs',
        label: '暗港海关大楼',
        x: 304,
        y: 2224,
        w: 240,
        h: 144,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'warehouse',
        signText: 'CUSTOMS',
      },
      {
        id: 'harbor-warehouse-a',
        label: '保税一号货仓',
        x: 592,
        y: 2224,
        w: 192,
        h: 144,
        neonColor: 0xf97316,
        accentHex: '#F97316',
        roofStyle: 'container',
        signText: 'CARGO A',
      },
      {
        id: 'harbor-market',
        label: '暗港黑市军械站',
        x: 304,
        y: 2560,
        w: 224,
        h: 144,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'container',
        signText: 'BLACKMKT',
      },
      {
        id: 'harbor-cargo-hub',
        label: '深水集装箱区',
        x: 1008,
        y: 2224,
        w: 256,
        h: 144,
        neonColor: 0x38bdf8,
        accentHex: '#38BDF8',
        roofStyle: 'container',
        signText: 'PORT 01',
      },
      {
        id: 'harbor-crane-depot',
        label: '重型龙门吊货场',
        x: 1344,
        y: 2224,
        w: 272,
        h: 144,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'warehouse',
        signText: 'CRANE',
      },
      {
        id: 'harbor-lighthouse',
        label: '暗港霓虹灯塔',
        x: 1248,
        y: 3456,
        w: 96,
        h: 96,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'lighthouse',
        signText: 'BEACON',
      },

      // === 铬铁工业区 CHROME TOWN ===
      {
        id: 'chrome-workshop',
        label: '铬铁重工 · 涡轮车坊',
        x: 1840,
        y: 2224,
        w: 272,
        h: 160,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'factory',
        signText: 'CHROME',
        hasFan: true,
      },
      {
        id: 'fusion-plant',
        label: '冷核聚变电厂',
        x: 2192,
        y: 2224,
        w: 256,
        h: 160,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'factory',
        signText: 'FUSION',
        hasFan: true,
      },
      {
        id: 'motorsport-hq',
        label: 'F1 极速赛事中心',
        x: 2672,
        y: 2224,
        w: 272,
        h: 160,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'stadium',
        signText: 'APEX F1',
      },
      {
        id: 'tank-depot',
        label: '重装战车整备库',
        x: 3008,
        y: 2224,
        w: 272,
        h: 160,
        neonColor: 0x4ade80,
        accentHex: '#4ADE80',
        roofStyle: 'warehouse',
        signText: 'ARMORY',
      },

      // === 星港航空区 NEON SKYPORT ===
      {
        id: 'skyport-terminal',
        label: '星港国际航站楼',
        x: 3520,
        y: 1440,
        w: 320,
        h: 160,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'tech',
        signText: 'TERMINAL',
        hasFan: true,
      },
      {
        id: 'skyport-garage',
        label: '星港机库改装站',
        x: 3936,
        y: 1440,
        w: 256,
        h: 160,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'warehouse',
        signText: 'HANGAR 1',
      },
      {
        id: 'skyport-tower',
        label: '航空指挥塔台',
        x: 4256,
        y: 1440,
        w: 192,
        h: 160,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'lighthouse',
        signText: 'ATC',
      },
    ];

    // Environmental & decorative props
    const props: PropDef[] = [
      // Neon Plaza Mandala Lights & Lamps
      { type: 'lamp', x: 1120, y: 896, collidable: false },
      { type: 'lamp', x: 1504, y: 896, collidable: false },
      { type: 'lamp', x: 1120, y: 1152, collidable: false },
      { type: 'lamp', x: 1504, y: 1152, collidable: false },
      { type: 'planter', x: 1216, y: 928, collidable: true },
      { type: 'planter', x: 1408, y: 928, collidable: true },
      { type: 'planter', x: 1216, y: 1120, collidable: true },
      { type: 'planter', x: 1408, y: 1120, collidable: true },
      { type: 'bench', x: 1264, y: 992, collidable: false },
      { type: 'bench', x: 1360, y: 992, collidable: false },
      { type: 'vending', x: 528, y: 620, collidable: true },
      { type: 'vending', x: 1264, y: 620, collidable: true },
      { type: 'kiosk', x: 1456, y: 880, collidable: true },

      // Quantum Tech Labs & Campus Trees
      { type: 'tree_emerald', x: 1840, y: 1024, collidable: false },
      { type: 'tree_emerald', x: 1968, y: 1024, collidable: false },
      { type: 'tree_emerald', x: 2096, y: 1024, collidable: false },
      { type: 'billboard', x: 2528, y: 624, collidable: false, label: 'QUANTUM CORPS' },
      { type: 'radar', x: 2416, y: 352, collidable: false },
      { type: 'radar', x: 4352, y: 1520, collidable: false },

      // Riverside Park Scenic Sakura & Emerald Trees
      { type: 'tree_sakura', x: 480, y: 1472, collidable: false },
      { type: 'tree_sakura', x: 672, y: 1504, collidable: false },
      { type: 'tree_sakura', x: 1120, y: 1488, collidable: false },
      { type: 'tree_sakura', x: 1312, y: 1520, collidable: false },
      { type: 'tree_emerald', x: 1888, y: 1488, collidable: false },
      { type: 'tree_sakura', x: 2208, y: 1504, collidable: false },
      { type: 'tree_emerald', x: 2400, y: 1488, collidable: false },
      { type: 'tree_autumn', x: 3104, y: 1504, collidable: false },
      { type: 'bench', x: 1984, y: 1616, collidable: false },
      { type: 'bench', x: 2176, y: 1616, collidable: false },

      // Highlands Snow Pines
      { type: 'tree_snow', x: 3488, y: 512, collidable: false },
      { type: 'tree_snow', x: 3616, y: 544, collidable: false },
      { type: 'tree_snow', x: 3872, y: 448, collidable: false },
      { type: 'tree_snow', x: 3936, y: 336, collidable: false },

      // Southern Gold Sand Palm Trees & Harbor Boats
      { type: 'tree_palm', x: 352, y: 3120, collidable: false },
      { type: 'tree_palm', x: 544, y: 3136, collidable: false },
      { type: 'tree_palm', x: 1056, y: 3120, collidable: false },
      { type: 'tree_palm', x: 1440, y: 3152, collidable: false },
      { type: 'barge', x: 512, y: 3488, collidable: false },
      { type: 'speedboat', x: 960, y: 3488, collidable: false },
      { type: 'speedboat', x: 1312, y: 1792, collidable: false },
    ];

    // Interactive world props (ATMs, explosive barrels, supply crates, hydrants)
    const interactiveProps: InteractivePropDef[] = [
      { id: 'atm-plaza-nw', type: 'atm', x: 560, y: 448 },
      { id: 'atm-plaza-ops', type: 'atm', x: 1312, y: 616 },
      { id: 'atm-tech', type: 'atm', x: 2128, y: 544 },
      { id: 'atm-harbor', type: 'atm', x: 560, y: 2496 },
      { id: 'atm-chrome', type: 'atm', x: 2672, y: 2496 },
      { id: 'atm-skyport', type: 'atm', x: 3680, y: 1648 },
      { id: 'barrel-harbor-1', type: 'barrel', x: 1120, y: 2560 },
      { id: 'barrel-harbor-2', type: 'barrel', x: 1408, y: 2544 },
      { id: 'barrel-chrome-1', type: 'barrel', x: 2160, y: 2512 },
      { id: 'barrel-chrome-2', type: 'barrel', x: 3120, y: 2512 },
      { id: 'barrel-skyport-1', type: 'barrel', x: 3744, y: 3024 },
      { id: 'crate-plaza', type: 'crate', x: 1536, y: 944 },
      { id: 'crate-park', type: 'crate', x: 1584, y: 1568 },
      { id: 'crate-highlands', type: 'crate', x: 3968, y: 576 },
      { id: 'crate-volcano', type: 'crate', x: 3872, y: 1184 },
      { id: 'crate-skyport', type: 'crate', x: 4064, y: 2240 },
      { id: 'hydrant-1', type: 'hydrant', x: 800, y: 624 },
      { id: 'hydrant-2', type: 'hydrant', x: 1632, y: 1264 },
      { id: 'hydrant-3', type: 'hydrant', x: 2464, y: 1264 },
    ];

    // Intersection Traffic Signals covering the grid dynamically
    const trafficSignals: TrafficSignalDef[] = [
      { x: 896, y: 192, axis: 'ns' },
      { x: 1728, y: 192, axis: 'ew' },
      { x: 2560, y: 192, axis: 'ns' },
      { x: 896, y: 704, axis: 'ew' },
      { x: 1728, y: 704, axis: 'ns' },
      { x: 2560, y: 704, axis: 'ew' },
      { x: 896, y: 1344, axis: 'ns' },
      { x: 1728, y: 1344, axis: 'ew' },
      { x: 2560, y: 1344, axis: 'ns' },
      { x: 3392, y: 1344, axis: 'ew' },
      { x: 896, y: 2112, axis: 'ew' },
      { x: 1728, y: 2112, axis: 'ns' },
      { x: 2560, y: 2112, axis: 'ew' },
      { x: 3392, y: 2112, axis: 'ns' },
      { x: 1728, y: 2880, axis: 'ew' },
      { x: 2560, y: 2880, axis: 'ns' },
    ];

    const steamVents: SteamVentDef[] = [
      { x: 448, y: 1248 },
      { x: 1872, y: 2448 },
      { x: 2304, y: 2448 },
      { x: 4032, y: 1088 },
    ];

    // Interactive Landmarks (preserve all 11 core SERVICE_LANDMARK_IDS + add new world POIs)
    const landmarks: LandmarkInfo[] = [
      {
        id: 'nexus-ops',
        name: '枢纽行动终端 · NEXUS',
        category: '任务与警务枢纽',
        description: '接取霓虹特区跑腿、极速飙车与高危脱逃委托，或开启巡警反恐义警行动！',
        x: 1480,
        y: 624,
        accentColor: PALETTE.GOLD_HEX,
      },
      {
        id: 'plaza-garage',
        name: '霓虹超跑车库 · 改装',
        category: '维修与改装',
        description: '修复战损车身、喷涂赛博渐变色、强化引擎与装甲，或提取专属座驾。',
        x: 424,
        y: 1056,
        accentColor: PALETTE.GOLD_HEX,
      },
      {
        id: 'cyber-clinic',
        name: '义体急救诊所',
        category: '医疗与义体',
        description: '恢复生命值、补充战术护甲，并升级你的义体芯片与角色属性。',
        x: 1120,
        y: 624,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'byte-mart',
        name: '字节便利店 24/7',
        category: '便利商店',
        description: '24小时营业的街头便利店，售卖可恢复生命的合成能量饮与夜宵补给。',
        x: 648,
        y: 624,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'kitsune-noodles',
        name: '狐狸夜宵拉面馆',
        category: '街头餐饮',
        description: '霓虹蒸汽缭绕的赛博拉面摊，热腾腾的合成豚骨汤可大幅恢复体力。',
        x: 392,
        y: 624,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'plaza-tech',
        name: '广场科技坊 · 军械库',
        category: '武器与弹药',
        description: '黑市义体军械终端，购买并升级霓虹冲锋枪、激光步枪、电磁轨炮与火箭筒！',
        x: 680,
        y: 976,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'skyline-apts',
        name: '天际公寓 · 安全屋',
        category: '私人房产',
        description: '可购买作为私人安全屋：随时免费恢复满状态、消星躲避追缉并保存进度。',
        x: 680,
        y: 464,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'arcade-lounge',
        name: '街机电玩俱乐部',
        category: '娱乐博弈',
        description: '街头地下电玩城，参与赛博幸运轮盘赌局，赢取丰厚现金与稀有奖池！',
        x: 416,
        y: 976,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'synth-club',
        name: '脉冲夜店 · 午夜酒吧',
        category: '夜店酒吧',
        description: '购买合成霓虹特调激活短时过载狂暴，或贿赂地下线人降低通缉等级！',
        x: 1112,
        y: 1056,
        accentColor: PALETTE.NEON_PURPLE_HEX,
      },
      {
        id: 'police-hq',
        name: 'NCPD 特区警署',
        category: '执法总部',
        description: '霓虹特区治安指挥总部，高速拦截巡逻车与特警机甲从此出动。',
        x: 1144,
        y: 464,
        accentColor: '#38BDF8',
      },
      {
        id: 'quantum-lab',
        name: '量子核心实验室',
        category: '科技地标',
        description: '量子科教区心脏地带，拥有尖端神经网络塔与全息科研走廊。',
        x: 1984,
        y: 480,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'mountain-overlook',
        name: '苍穹雪岭观景台',
        category: '高山地貌',
        description: '高海拔雪岭平台，可一览量子新城、星港跑道与南岸碧湾全景。',
        x: 3680,
        y: 608,
        accentColor: PALETTE.GOLD_HEX,
      },
      {
        id: 'obsidian-volcano',
        name: '黑曜石活火山口',
        category: '火山奇观',
        description: '炽热熔岩翻涌的黑曜岩山口，山腰盘山路暗藏高价值加密金库！',
        x: 3968,
        y: 1216,
        accentColor: '#F97316',
      },
      {
        id: 'riverside-park',
        name: '滨河生态公园湖心桥',
        category: '公园水岸',
        description: '横跨翠水湾的浪漫樱花木栈桥，风光绝佳且适合甩开高速警车追击。',
        x: 2096,
        y: 1584,
        accentColor: '#34D399',
      },
      {
        id: 'neon-stadium',
        name: '霓虹穹顶竞技场',
        category: '地标场馆',
        description: '滨河东岸顶级赛博体育场，环城赛事与全息角斗的荣耀中心。',
        x: 2816,
        y: 1656,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'harbor-market',
        name: '暗港黑市 · 地下军械',
        category: '黑市军械库',
        description: '暗港集装箱走私终端，随时购买重火力武器、补给弹药并强化武器性能。',
        x: 416,
        y: 2528,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'harbor-lighthouse',
        name: '暗港霓虹灯塔岛',
        category: '离岸灯塔',
        description: '跨过海滨木栈桥即可登岛的南部礁岛，指引暗港深水航道并藏有秘宝。',
        x: 1296,
        y: 3408,
        accentColor: PALETTE.GOLD_HEX,
      },
      {
        id: 'chrome-workshop',
        name: '铬铁重工 · 涡轮车坊',
        category: '维修与改装',
        description: '铬铁工业区核心改装厂，提供全套载具强化、快速维修及重装战车停机坪。',
        x: 1976,
        y: 2416,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'chrome-circuit',
        name: 'F1 涡轮极速直道',
        category: '极速赛道',
        description: '配备电磁涡轮加速带与飞跃跳台的南部极速测试赛段。',
        x: 2560,
        y: 2880,
        accentColor: PALETTE.GOLD_HEX,
      },
      {
        id: 'skyport-terminal',
        name: '星港国际航站楼',
        category: '航空枢纽',
        description: '远东航空港客运大厅，直通超长起降跑道、停机坪与重型武装直升机停泊区。',
        x: 3680,
        y: 1632,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'skyport-garage',
        name: '星港机库改装站',
        category: '维修与改装',
        description: '航空港专属机库车坊，可修理战车、重喷隐匿车漆或呼叫专属座驾！',
        x: 4064,
        y: 1632,
        accentColor: PALETTE.GOLD_HEX,
      },
    ];

    // 7 District Cyber Signal Towers (Hack to unlock Metro + District Vaults)
    const signalTowers: SignalTowerDef[] = [
      {
        id: 'tower-neon-plaza',
        districtId: 'neon-plaza',
        districtName: '霓虹广场',
        name: '霓虹中心信号塔',
        x: 1584,
        y: 832,
        rewardCash: 320,
        rewardExp: 180,
        accentHex: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'tower-quantum-tech',
        districtId: 'quantum-tech',
        districtName: '量子科教区',
        name: '量子超算中继塔',
        x: 2352,
        y: 1152,
        rewardCash: 380,
        rewardExp: 220,
        accentHex: PALETTE.NEON_PURPLE_HEX,
      },
      {
        id: 'tower-highlands',
        districtId: 'skyline-highlands',
        districtName: '苍穹山脉',
        name: '雪岭气象观测塔',
        x: 3888,
        y: 592,
        rewardCash: 450,
        rewardExp: 260,
        accentHex: '#38BDF8',
      },
      {
        id: 'tower-riverside',
        districtId: 'riverside-park',
        districtName: '滨河生态公园',
        name: '翠水湾全息基站',
        x: 2320,
        y: 1552,
        rewardCash: 350,
        rewardExp: 200,
        accentHex: '#34D399',
      },
      {
        id: 'tower-harbor',
        districtId: 'dark-harbor',
        districtName: '暗港码头',
        name: '暗港灯塔雷达塔',
        x: 1072,
        y: 2704,
        rewardCash: 420,
        rewardExp: 240,
        accentHex: PALETTE.GOLD_HEX,
      },
      {
        id: 'tower-chrome',
        districtId: 'chrome-town',
        districtName: '铬铁工业区',
        name: '铬铁高压脉冲塔',
        x: 2800,
        y: 2688,
        rewardCash: 440,
        rewardExp: 250,
        accentHex: '#F97316',
      },
      {
        id: 'tower-skyport',
        districtId: 'neon-skyport',
        districtName: '星港航空区',
        name: '星港空域信标塔',
        x: 4320,
        y: 1920,
        rewardCash: 500,
        rewardExp: 300,
        accentHex: PALETTE.NEON_PINK_HEX,
      },
    ];

    // 7 Discoverable Maglev Metro Fast-Travel Hubs
    const metroStations: MetroStationDef[] = [
      {
        id: 'metro-plaza',
        districtId: 'neon-plaza',
        name: '磁悬浮 · 霓虹中央站',
        x: 688,
        y: 1184,
        spawnX: 688,
        spawnY: 1232,
        accentHex: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'metro-tech',
        districtId: 'quantum-tech',
        name: '磁悬浮 · 量子科教站',
        x: 1984,
        y: 576,
        spawnX: 1984,
        spawnY: 616,
        accentHex: PALETTE.NEON_PURPLE_HEX,
      },
      {
        id: 'metro-riverside',
        districtId: 'riverside-park',
        name: '磁悬浮 · 翠水湾公园站',
        x: 1488,
        y: 1552,
        spawnX: 1488,
        spawnY: 1608,
        accentHex: '#34D399',
      },
      {
        id: 'metro-highlands',
        districtId: 'skyline-highlands',
        name: '磁悬浮 · 苍穹山麓站',
        x: 3568,
        y: 624,
        spawnX: 3568,
        spawnY: 704,
        accentHex: '#38BDF8',
      },
      {
        id: 'metro-harbor',
        districtId: 'dark-harbor',
        name: '磁悬浮 · 暗港南泊位站',
        x: 688,
        y: 2704,
        spawnX: 688,
        spawnY: 2768,
        accentHex: PALETTE.GOLD_HEX,
      },
      {
        id: 'metro-chrome',
        districtId: 'chrome-town',
        name: '磁悬浮 · 铬铁工业站',
        x: 3152,
        y: 2688,
        spawnX: 3152,
        spawnY: 2768,
        accentHex: '#F97316',
      },
      {
        id: 'metro-skyport',
        districtId: 'neon-skyport',
        name: '磁悬浮 · 星港航站楼',
        x: 3648,
        y: 1920,
        spawnX: 3648,
        spawnY: 1984,
        accentHex: PALETTE.NEON_PINK_HEX,
      },
    ];

    // 8 Hidden Encrypted Vaults (High reward stashes across landmarks, islands, mountains & alleyways)
    const secretVaults: SecretVaultDef[] = [
      {
        id: 'vault-plaza-alley',
        districtId: 'neon-plaza',
        name: '集团机密金库',
        hint: '藏于赛博集团与公寓之间的加密暗巷',
        x: 544,
        y: 352,
        rewardCash: 350,
        rewardExp: 120,
        rewardArmor: 35,
      },
      {
        id: 'vault-tech-greenhouse',
        districtId: 'quantum-tech',
        name: '神经矩阵冷库',
        hint: '隐匿于全息剧院东侧的科研温室广场',
        x: 3200,
        y: 1120,
        rewardCash: 420,
        rewardExp: 150,
        rewardArmor: 40,
      },
      {
        id: 'vault-snow-ridge',
        districtId: 'skyline-highlands',
        name: '雪峰科考补给箱',
        hint: '位于苍穹雪岭西坡林间边缘',
        x: 3520,
        y: 576,
        rewardCash: 480,
        rewardExp: 170,
        rewardArmor: 50,
      },
      {
        id: 'vault-volcano-rim',
        districtId: 'skyline-highlands',
        name: '黑曜熔岩秘藏',
        hint: '坐落在黑曜石火山口南侧炙热岩崖边',
        x: 4288,
        y: 1184,
        rewardCash: 620,
        rewardExp: 220,
        rewardArmor: 60,
      },
      {
        id: 'vault-park-west',
        districtId: 'riverside-park',
        name: '樱花林荫密匣',
        hint: '藏在西岸樱花河畔树丛旁',
        x: 544,
        y: 1552,
        rewardCash: 360,
        rewardExp: 130,
        rewardArmor: 35,
      },
      {
        id: 'vault-lighthouse-island',
        districtId: 'dark-harbor',
        name: '离岸灯塔走私库',
        hint: '穿过南部木栈道登岛即可在灯塔脚下发现',
        x: 1376,
        y: 3488,
        rewardCash: 580,
        rewardExp: 200,
        rewardArmor: 50,
      },
      {
        id: 'vault-chrome-foundry',
        districtId: 'chrome-town',
        name: '聚变核心保险柜',
        hint: '位于冷核聚变电厂与赛道之间的维修平台',
        x: 2432,
        y: 2672,
        rewardCash: 500,
        rewardExp: 180,
        rewardArmor: 50,
      },
      {
        id: 'vault-skyport-cargo',
        districtId: 'neon-skyport',
        name: '星港黑匣子保险库',
        hint: '封存在星港跑道东端外侧的停机坪角落',
        x: 4416,
        y: 2704,
        rewardCash: 650,
        rewardExp: 240,
        rewardArmor: 70,
      },
    ];

    // 4 Tactical Gang Strongholds / Turf Outposts
    const gangOutposts: GangOutpostDef[] = [
      {
        id: 'outpost-harbor',
        districtId: 'dark-harbor',
        name: '暗港走私帮货场据点',
        faction: '海蛇走私团',
        x: 1312,
        y: 2608,
        radius: 210,
        guardCount: 5,
        hasBoss: false,
        rewardCash: 560,
        rewardExp: 260,
        accentHex: '#F97316',
      },
      {
        id: 'outpost-chrome',
        districtId: 'chrome-town',
        name: '铬铁机械狂徒熔炉营',
        faction: '铁腕义体帮',
        x: 2144,
        y: 2608,
        radius: 210,
        guardCount: 6,
        hasBoss: true,
        rewardCash: 720,
        rewardExp: 320,
        accentHex: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'outpost-canyon',
        districtId: 'skyline-highlands',
        name: '红岩峡谷掠夺者营地',
        faction: '荒漠沙盗团',
        x: 4224,
        y: 576,
        radius: 190,
        guardCount: 5,
        hasBoss: false,
        rewardCash: 620,
        rewardExp: 280,
        accentHex: PALETTE.GOLD_HEX,
      },
      {
        id: 'outpost-skyport',
        districtId: 'neon-skyport',
        name: '星港黑翼佣兵封锁区',
        faction: '黑翼安保雇佣兵',
        x: 3840,
        y: 3120,
        radius: 220,
        guardCount: 7,
        hasBoss: true,
        rewardCash: 880,
        rewardExp: 380,
        accentHex: PALETTE.NEON_PURPLE_HEX,
      },
    ];

    return {
      id: 'neon-district',
      name: WORLD_CONFIG.STARTING_DISTRICT,
      plazaCenter: { x: 1312, y: 1024 },
      exitMarkers: {
        east: { x: 1728, y: 704, label: '→ 量子科教区 & 苍穹山脉' },
        south: { x: 896, y: 1792, label: '↓ 翠水湾 & 暗港码头' },
        farEast: { x: 3392, y: 2112, label: '→ 星港航空区 & 跑道' },
      },
      roads,
      sidewalks,
      plazaZones,
      parks,
      snowZones,
      desertZones,
      volcanoZones,
      lavaZones,
      sandZones,
      waterfalls,
      docks,
      runways,
      helipads,
      rivers,
      waterColliders,
      bridges,
      mountains,
      turboStrips,
      stuntRamps,
      zones,
      parkingLot,
      buildings,
      props,
      interactiveProps,
      trafficSignals,
      steamVents,
      landmarks,
      signalTowers,
      metroStations,
      secretVaults,
      gangOutposts,
    };
  }
}
