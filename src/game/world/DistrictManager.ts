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

export interface DistrictData {
  id: string;
  name: string;
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
}

export const CITY_DISTRICTS = [
  { id: 'neon-plaza', name: '霓虹广场', direction: '中心枢纽 · 商业区' },
  { id: 'riverside-park', name: '滨河生态公园', direction: '南区水岸 · 公园栈道' },
  { id: 'skyline-highlands', name: '苍穹山脉', direction: '东北高地 · 盘山弯道' },
  { id: 'dark-harbor', name: '暗港码头', direction: '西南港口 · 集装箱区' },
  { id: 'chrome-town', name: '铬铁工业区', direction: '东南工业 · 涡轮高速' },
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

  public getNeonPlaza(): DistrictData {
    const zones: DistrictZoneDef[] = [
      { id: 'neon-plaza', name: '霓虹广场', x: 0, y: 0, w: 1664, h: 1184 },
      { id: 'riverside-park', name: '滨河生态公园', x: 0, y: 1184, w: 1664, h: 512 },
      { id: 'dark-harbor', name: '暗港码头', x: 0, y: 1696, w: 1664, h: 704 },
      { id: 'skyline-highlands', name: '苍穹山脉', x: 1664, y: 0, w: 1536, h: 1568 },
      { id: 'chrome-town', name: '铬铁工业区', x: 1664, y: 1568, w: 1536, h: 832 },
    ];

    const roads: CityRect[] = [
      { x: 32, y: 256, w: 2912, h: 128 },
      { x: 32, y: 832, w: 2912, h: 128 },
      { x: 32, y: 1568, w: 2912, h: 128 },
      { x: 288, y: 2080, w: 2656, h: 128 },
      { x: 288, y: 32, w: 128, h: 2176 },
      { x: 1184, y: 32, w: 128, h: 2176 },
      { x: 1888, y: 256, w: 128, h: 1952 },
      { x: 2176, y: 256, w: 96, h: 1440 },
      { x: 2336, y: 1568, w: 128, h: 640 },
      { x: 2816, y: 256, w: 128, h: 1952 },
    ];

    const sidewalks: CityRect[] = [
      { x: 32, y: 32, w: 256, h: 224 },
      { x: 416, y: 32, w: 768, h: 224 },
      { x: 1312, y: 32, w: 320, h: 224 },
      { x: 32, y: 384, w: 256, h: 448 },
      { x: 416, y: 384, w: 768, h: 448 },
      { x: 1312, y: 384, w: 320, h: 448 },
      { x: 32, y: 960, w: 256, h: 224 },
      { x: 416, y: 960, w: 768, h: 224 },
      { x: 1312, y: 960, w: 320, h: 224 },
    ];

    const plazaZones: CityRect[] = [
      { x: 512, y: 544, w: 576, h: 128 },
      { x: 736, y: 384, w: 128, h: 160 },
      { x: 704, y: 672, w: 192, h: 160 },
    ];

    const parks: CityRect[] = [
      { x: 32, y: 1184, w: 1600, h: 384 },
      { x: 1856, y: 960, w: 416, h: 608 },
      { x: 704, y: 2272, w: 192, h: 64 },
    ];

    const snowZones: CityRect[] = [
      { x: 1856, y: 32, w: 672, h: 800 },
    ];

    const desertZones: CityRect[] = [
      { x: 2528, y: 32, w: 640, h: 800 },
    ];

    const volcanoZones: CityRect[] = [
      { x: 2272, y: 960, w: 896, h: 608 },
    ];

    const lavaZones: CityRect[] = [
      { x: 2304, y: 992, w: 480, h: 32 },
      { x: 2304, y: 1472, w: 480, h: 32 },
      { x: 2304, y: 992, w: 32, h: 512 },
      { x: 2752, y: 992, w: 32, h: 512 },
    ];

    const sandZones: CityRect[] = [
      { x: 32, y: 2208, w: 1600, h: 32 },
      { x: 672, y: 2272, w: 256, h: 96 },
      { x: 2944, y: 1568, w: 64, h: 800 },
    ];

    const waterfalls: CityRect[] = [
      { x: 1696, y: 32, w: 96, h: 96 },
      { x: 608, y: 1280, w: 96, h: 32 },
    ];

    const docks: CityRect[] = [
      { x: 32, y: 1696, w: 1600, h: 512 },
      { x: 448, y: 2208, w: 160, h: 128 },
      { x: 768, y: 2208, w: 96, h: 64 },
      { x: 1024, y: 2208, w: 160, h: 128 },
    ];

    const rivers: CityRect[] = [
      { x: 1664, y: 32, w: 160, h: 2336 },
      { x: 32, y: 2240, w: 1632, h: 128 },
      { x: 512, y: 1312, w: 576, h: 128 },
      { x: 3008, y: 1568, w: 160, h: 800 },
    ];

    const waterColliders: CityRect[] = [
      // Neon Cyber River sections between the 4 bridges
      { x: 1664, y: 32, w: 160, h: 224 },
      { x: 1664, y: 384, w: 160, h: 448 },
      { x: 1664, y: 960, w: 160, h: 608 },
      { x: 1664, y: 1696, w: 160, h: 384 },
      { x: 1664, y: 2208, w: 160, h: 160 },
      // Southern Harbor Bay excluding the golden beach (row 69), two cargo piers, footbridge, and lighthouse island
      { x: 32, y: 2240, w: 416, h: 128 },
      { x: 608, y: 2240, w: 160, h: 32 },
      { x: 608, y: 2272, w: 64, h: 96 },
      { x: 864, y: 2240, w: 160, h: 32 },
      { x: 928, y: 2272, w: 96, h: 96 },
      { x: 1184, y: 2240, w: 480, h: 128 },
      { x: 448, y: 2336, w: 160, h: 32 },
      { x: 1024, y: 2336, w: 160, h: 32 },
      // Riverside Park Emerald Lagoon
      { x: 512, y: 1312, w: 224, h: 128 },
      { x: 864, y: 1312, w: 224, h: 128 },
      // East Coast Ocean Cove
      { x: 3008, y: 1568, w: 160, h: 800 },
    ];

    const bridges: CityRect[] = [
      { x: 1632, y: 256, w: 224, h: 128 },
      { x: 1632, y: 832, w: 224, h: 128 },
      { x: 1632, y: 1568, w: 224, h: 128 },
      { x: 1632, y: 2080, w: 224, h: 128 },
      { x: 736, y: 1312, w: 128, h: 128 },
    ];

    const mountains: MountainDef[] = [
      { id: 'mtn-north', name: '雪域北峰', x: 1888, y: 64, w: 512, h: 160, elevation: 420, biome: 'snow' },
      { id: 'mtn-desert-mesa', name: '赤岩北台', x: 2400, y: 64, w: 448, h: 160, elevation: 340, biome: 'desert' },
      { id: 'mtn-skyline', name: '苍穹雪峰', x: 2048, y: 416, w: 96, h: 384, elevation: 480, biome: 'snow' },
      { id: 'mtn-east-plateau', name: '云巅冰原', x: 2272, y: 384, w: 224, h: 416, elevation: 520, biome: 'snow' },
      { id: 'mtn-desert-butte', name: '金砂红崖', x: 2528, y: 384, w: 256, h: 416, elevation: 390, biome: 'desert' },
      { id: 'mtn-coast-cliff-n', name: '东海砾岩', x: 2976, y: 384, w: 160, h: 416, elevation: 360, biome: 'desert' },
      { id: 'mtn-south-gorge', name: '翠林南岭', x: 2048, y: 1024, w: 96, h: 480, elevation: 360, biome: 'forest' },
      { id: 'mtn-se-crag', name: '黑曜活火山', x: 2336, y: 1056, w: 384, h: 384, elevation: 620, biome: 'volcano' },
      { id: 'mtn-coast-cliff-s', name: '熔岩海岬', x: 2976, y: 960, w: 160, h: 544, elevation: 450, biome: 'volcano' },
    ];

    const turboStrips: TurboStripDef[] = [
      { id: 'turbo-express-1', x: 2048, y: 1600, w: 64, h: 64, dir: 'E' },
      { id: 'turbo-express-2', x: 2528, y: 1600, w: 64, h: 64, dir: 'E' },
      { id: 'turbo-south-1', x: 2112, y: 2112, w: 64, h: 64, dir: 'W' },
      { id: 'turbo-south-2', x: 2592, y: 2112, w: 64, h: 64, dir: 'W' },
      { id: 'turbo-east-1', x: 2848, y: 576, w: 64, h: 64, dir: 'S' },
      { id: 'turbo-east-2', x: 2848, y: 1216, w: 64, h: 64, dir: 'S' },
      { id: 'turbo-east-3', x: 2848, y: 1824, w: 64, h: 64, dir: 'S' },
      { id: 'turbo-north-1', x: 2464, y: 288, w: 64, h: 64, dir: 'E' },
      { id: 'turbo-harbor-1', x: 704, y: 2112, w: 64, h: 64, dir: 'W' },
    ];

    const stuntRamps: StuntRampDef[] = [
      { id: 'ramp-helipad', name: '暗港停机坪跳台', x: 192, y: 1920, w: 64, h: 64 },
      { id: 'ramp-north-bridge', name: '北桥助推跳台', x: 1472, y: 288, w: 64, h: 64 },
      { id: 'ramp-chrome-express', name: '铬铁涡轮跳台', x: 2656, y: 1600, w: 64, h: 64 },
      { id: 'ramp-pier-east', name: '东码头水上飞跃', x: 1056, y: 2208, w: 96, h: 32 },
      { id: 'ramp-highland', name: '苍穹峡谷跳台', x: 1920, y: 1248, w: 64, h: 64 },
    ];

    const parkingLot: CityRect = {
      x: 1344,
      y: 416,
      w: 192,
      h: 384,
    };

    const buildings: BuildingDef[] = [
      // === District 1: Neon Plaza ===
      {
        id: 'byte-mart',
        label: '字节便利店',
        signText: '24H 便利',
        x: 64,
        y: 64,
        w: 160,
        h: 128,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'store',
        hasFan: true,
      },
      {
        id: 'cyber-corp',
        label: '赛博集团',
        signText: '集团总部',
        x: 480,
        y: 64,
        w: 256,
        h: 128,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'tech',
        hasFan: true,
      },
      {
        id: 'data-exchange',
        label: '数据交易所',
        signText: '网络枢纽',
        x: 832,
        y: 64,
        w: 288,
        h: 128,
        neonColor: PALETTE.NEON_PURPLE,
        accentHex: PALETTE.NEON_PURPLE_HEX,
        roofStyle: 'tech',
        hasFan: true,
      },
      {
        id: 'skyline-apts',
        label: '天际公寓',
        signText: '居住区01',
        x: 1376,
        y: 64,
        w: 160,
        h: 128,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'residential',
      },
      {
        id: 'arcade-lounge',
        label: '街机俱乐部',
        signText: '电玩赌局',
        x: 64,
        y: 448,
        w: 160,
        h: 128,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'arcade',
      },
      {
        id: 'cyber-clinic',
        label: '义体诊所',
        signText: '医疗舱',
        x: 64,
        y: 640,
        w: 160,
        h: 128,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'tech',
        hasFan: true,
      },
      {
        id: 'nexus-ops',
        label: '枢纽行动处',
        signText: '任务中心',
        x: 480,
        y: 432,
        w: 224,
        h: 96,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'tech',
        hasFan: true,
      },
      {
        id: 'holo-tower',
        label: '全息塔楼',
        signText: '全息视界',
        x: 896,
        y: 432,
        w: 224,
        h: 96,
        neonColor: PALETTE.NEON_PURPLE,
        accentHex: PALETTE.NEON_PURPLE_HEX,
        roofStyle: 'tech',
        hasFan: true,
      },
      {
        id: 'kitsune-noodles',
        label: '狐狸拉面馆',
        signText: '24H 拉面',
        x: 480,
        y: 688,
        w: 192,
        h: 96,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'diner',
      },
      {
        id: 'plaza-tech',
        label: '广场科技坊',
        signText: '军械终端',
        x: 928,
        y: 688,
        w: 192,
        h: 96,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'store',
      },
      {
        id: 'parking-booth',
        label: '泊车亭',
        signText: '泊车',
        x: 1344,
        y: 424,
        w: 64,
        h: 48,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'booth',
      },
      {
        id: 'neon-diner',
        label: '霓虹餐厅',
        signText: '夜宵',
        x: 64,
        y: 1008,
        w: 160,
        h: 112,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'diner',
      },
      {
        id: 'transit-hub',
        label: '地铁枢纽',
        signText: '城铁站',
        x: 480,
        y: 1008,
        w: 256,
        h: 112,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'tech',
        hasFan: true,
      },
      {
        id: 'police-hq',
        label: '特区警署',
        signText: 'NCPD',
        x: 752,
        y: 1008,
        w: 96,
        h: 112,
        neonColor: 0x38bdf8,
        accentHex: '#38BDF8',
        roofStyle: 'police',
        hasFan: true,
      },
      {
        id: 'synth-club',
        label: '脉冲夜店',
        signText: '午夜酒吧',
        x: 864,
        y: 1008,
        w: 256,
        h: 112,
        neonColor: PALETTE.NEON_PURPLE,
        accentHex: PALETTE.NEON_PURPLE_HEX,
        roofStyle: 'club',
      },
      {
        id: 'plaza-garage',
        label: '广场车库',
        signText: '修车库',
        x: 1360,
        y: 1008,
        w: 176,
        h: 112,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'tech',
        hasFan: true,
      },
      {
        id: 'neon-stadium',
        label: '霓虹竞技场',
        signText: 'ARENA',
        x: 1344,
        y: 1232,
        w: 192,
        h: 160,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'stadium',
      },
      {
        id: 'harbor-lighthouse',
        label: '暗港灯塔',
        signText: 'BEACON',
        x: 768,
        y: 2288,
        w: 64,
        h: 56,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'lighthouse',
      },

      // === District 4: Dark Harbor (South-West) ===
      {
        id: 'harbor-warehouse',
        label: '远洋货仓',
        signText: '货运中心',
        x: 464,
        y: 1744,
        w: 256,
        h: 112,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'warehouse',
        roofColor: 0x2a2420,
        hasFan: true,
      },
      {
        id: 'harbor-blackmarket',
        label: '暗港黑市',
        signText: '地下军火',
        x: 864,
        y: 1920,
        w: 224,
        h: 112,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'warehouse',
        roofColor: 0x261a26,
      },
      {
        id: 'harbor-container-1',
        label: 'A区货柜',
        signText: 'CARGO A',
        x: 464,
        y: 1920,
        w: 128,
        h: 64,
        neonColor: 0xef4444,
        accentHex: '#EF4444',
        roofStyle: 'container',
        roofColor: 0x7f1d1d,
      },
      {
        id: 'harbor-container-2',
        label: 'B区货柜',
        signText: 'CARGO B',
        x: 640,
        y: 1920,
        w: 128,
        h: 64,
        neonColor: 0x14b8a6,
        accentHex: '#14B8A6',
        roofStyle: 'container',
        roofColor: 0x115e59,
      },
      {
        id: 'harbor-customs',
        label: '港务调度站',
        signText: '港务塔台',
        x: 1360,
        y: 1760,
        w: 192,
        h: 128,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'tech',
        hasFan: true,
      },

      // === District 5: Chrome Town Industrial (South-East) ===
      {
        id: 'chrome-foundry',
        label: '铬铁重工工坊',
        signText: '涡轮改装',
        x: 2080,
        y: 1760,
        w: 208,
        h: 112,
        neonColor: 0xf59e0b,
        accentHex: '#F59E0B',
        roofStyle: 'factory',
        roofColor: 0x2b241d,
        hasFan: true,
      },
      {
        id: 'chrome-powerplant',
        label: '聚变供电厂',
        signText: '高压核心',
        x: 2528,
        y: 1760,
        w: 224,
        h: 128,
        neonColor: PALETTE.NEON_PURPLE,
        accentHex: PALETTE.NEON_PURPLE_HEX,
        roofStyle: 'factory',
        roofColor: 0x232030,
        hasFan: true,
      },
      {
        id: 'chrome-racetrack-hq',
        label: '极速赛事总部',
        signText: 'GT-X 联盟',
        x: 2528,
        y: 1936,
        w: 224,
        h: 96,
        neonColor: PALETTE.GOLD,
        accentHex: PALETTE.GOLD_HEX,
        roofStyle: 'store',
      },
      {
        id: 'chrome-reactor-tower',
        label: '散热冷却塔',
        signText: 'COOLING',
        x: 2080,
        y: 1936,
        w: 176,
        h: 96,
        neonColor: 0xf97316,
        accentHex: '#F97316',
        roofStyle: 'factory',
        roofColor: 0x29211d,
      },
    ];

    const props: PropDef[] = [
      // Streetlamps along Cyan Boulevard
      { type: 'lamp', x: 268, y: 240, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'lamp', x: 436, y: 240, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'lamp', x: 784, y: 240, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'lamp', x: 1164, y: 240, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'lamp', x: 1332, y: 240, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'lamp', x: 436, y: 400, collidable: true, tint: PALETTE.NEON_PURPLE },
      { type: 'lamp', x: 1164, y: 400, collidable: true, tint: PALETTE.NEON_PURPLE },

      // Streetlamps along Synthway Drive
      { type: 'lamp', x: 268, y: 816, collidable: true, tint: PALETTE.NEON_PINK },
      { type: 'lamp', x: 436, y: 816, collidable: true, tint: PALETTE.NEON_PINK },
      { type: 'lamp', x: 1164, y: 816, collidable: true, tint: PALETTE.NEON_PINK },
      { type: 'lamp', x: 1332, y: 816, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'lamp', x: 436, y: 976, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'lamp', x: 1164, y: 976, collidable: true, tint: PALETTE.NEON_CYAN },

      // Central Plaza planters, benches, and hologram kiosks
      { type: 'planter', x: 560, y: 560, collidable: true, tint: PALETTE.NEON_PURPLE },
      { type: 'planter', x: 1040, y: 560, collidable: true, tint: PALETTE.NEON_PURPLE },
      { type: 'planter', x: 560, y: 656, collidable: true, tint: PALETTE.NEON_PINK },
      { type: 'planter', x: 1040, y: 656, collidable: true, tint: PALETTE.NEON_PINK },

      { type: 'bench', x: 640, y: 560, collidable: true },
      { type: 'bench', x: 960, y: 560, collidable: true },
      { type: 'bench', x: 640, y: 656, collidable: true },
      { type: 'bench', x: 960, y: 656, collidable: true },

      { type: 'kiosk', x: 592, y: 540, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'billboard', x: 800, y: 404, collidable: true, tint: PALETTE.NEON_CYAN, label: '霓虹广场' },
      { type: 'billboard', x: 800, y: 812, collidable: true, tint: PALETTE.NEON_PINK, label: '合成波街' },

      { type: 'vending', x: 238, y: 120, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'vending', x: 238, y: 160, collidable: true, tint: PALETTE.NEON_PINK },
      { type: 'vending', x: 238, y: 500, collidable: true, tint: PALETTE.NEON_PURPLE },
      { type: 'vending', x: 462, y: 736, collidable: true, tint: PALETTE.NEON_PINK },
      { type: 'vending', x: 752, y: 1040, collidable: true, tint: PALETTE.NEON_CYAN },

      { type: 'stool', x: 516, y: 676, collidable: true },
      { type: 'stool', x: 540, y: 676, collidable: true },
      { type: 'stool', x: 612, y: 676, collidable: true },

      { type: 'trashbin', x: 256, y: 212, collidable: true },
      { type: 'trashbin', x: 452, y: 556, collidable: true },
      { type: 'trashbin', x: 1140, y: 556, collidable: true },
      { type: 'trashbin', x: 756, y: 984, collidable: true },

      { type: 'bollard', x: 744, y: 392, collidable: true },
      { type: 'bollard', x: 856, y: 392, collidable: true },
      { type: 'bollard', x: 716, y: 822, collidable: true },
      { type: 'bollard', x: 884, y: 822, collidable: true },

      { type: 'cone', x: 1336, y: 504, collidable: true },
      { type: 'cone', x: 1336, y: 536, collidable: true },
      { type: 'cone', x: 1412, y: 992, collidable: true },
      { type: 'cone', x: 1484, y: 992, collidable: true },

      // Bridgehead, Highland, Harbor & Chrome Props
      { type: 'lamp', x: 1644, y: 244, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'lamp', x: 1644, y: 396, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'lamp', x: 1844, y: 244, collidable: true, tint: PALETTE.GOLD },
      { type: 'lamp', x: 1844, y: 396, collidable: true, tint: PALETTE.GOLD },
      { type: 'lamp', x: 1644, y: 820, collidable: true, tint: PALETTE.NEON_PINK },
      { type: 'lamp', x: 1644, y: 972, collidable: true, tint: PALETTE.NEON_PINK },
      { type: 'lamp', x: 1644, y: 1556, collidable: true, tint: PALETTE.GOLD },
      { type: 'lamp', x: 1844, y: 1556, collidable: true, tint: PALETTE.GOLD },
      { type: 'lamp', x: 1644, y: 2068, collidable: true, tint: PALETTE.NEON_PINK },
      { type: 'lamp', x: 1844, y: 2068, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'kiosk', x: 2254, y: 544, collidable: true, tint: PALETTE.GOLD },
      { type: 'bench', x: 768, y: 1270, collidable: true },
      { type: 'bench', x: 832, y: 1270, collidable: true },
      { type: 'lamp', x: 730, y: 1296, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'lamp', x: 870, y: 1296, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'billboard', x: 960, y: 2058, collidable: true, tint: PALETTE.NEON_PINK, label: '暗港黑市' },
      { type: 'billboard', x: 2400, y: 1546, collidable: true, tint: PALETTE.GOLD, label: '铬铁高速' },
      { type: 'cone', x: 2260, y: 1744, collidable: true },
      { type: 'cone', x: 2300, y: 1744, collidable: true },

      // === Riverside Park Emerald Forest, Autumn Scrub & Cyber Sakura ===
      { type: 'tree_emerald', x: 68, y: 1216, collidable: true },
      { type: 'tree_emerald', x: 132, y: 1216, collidable: true },
      { type: 'tree_emerald', x: 216, y: 1216, collidable: true },
      { type: 'tree_emerald', x: 260, y: 1236, collidable: true },
      { type: 'tree_sakura', x: 160, y: 1260, collidable: true },
      { type: 'tree_autumn', x: 184, y: 1304, collidable: true },
      { type: 'tree_emerald', x: 64, y: 1316, collidable: true },
      { type: 'tree_sakura', x: 246, y: 1320, collidable: true },
      { type: 'tree_emerald', x: 138, y: 1348, collidable: true },
      { type: 'tree_emerald', x: 110, y: 1412, collidable: true },
      { type: 'tree_emerald', x: 196, y: 1412, collidable: true },
      { type: 'tree_emerald', x: 252, y: 1404, collidable: true },
      { type: 'tree_autumn', x: 68, y: 1432, collidable: true },
      { type: 'tree_sakura', x: 160, y: 1460, collidable: true },
      { type: 'tree_emerald', x: 236, y: 1480, collidable: true },
      { type: 'tree_emerald', x: 72, y: 1524, collidable: true },
      { type: 'tree_sakura', x: 148, y: 1528, collidable: true },
      { type: 'tree_emerald', x: 248, y: 1530, collidable: true },

      // Mid-West & Lagoon Shore Park Woods
      { type: 'tree_emerald', x: 446, y: 1214, collidable: true },
      { type: 'tree_sakura', x: 456, y: 1260, collidable: true },
      { type: 'tree_emerald', x: 486, y: 1324, collidable: true },
      { type: 'tree_autumn', x: 444, y: 1404, collidable: true },
      { type: 'tree_sakura', x: 456, y: 1460, collidable: true },
      { type: 'tree_emerald', x: 488, y: 1526, collidable: true },
      { type: 'tree_emerald', x: 536, y: 1214, collidable: true },
      { type: 'tree_sakura', x: 640, y: 1220, collidable: true },
      { type: 'tree_emerald', x: 716, y: 1214, collidable: true },
      { type: 'tree_emerald', x: 884, y: 1214, collidable: true },
      { type: 'tree_sakura', x: 960, y: 1220, collidable: true },
      { type: 'tree_emerald', x: 1056, y: 1214, collidable: true },
      { type: 'tree_emerald', x: 536, y: 1526, collidable: true },
      { type: 'tree_sakura', x: 664, y: 1526, collidable: true },
      { type: 'tree_emerald', x: 936, y: 1526, collidable: true },
      { type: 'tree_emerald', x: 1056, y: 1526, collidable: true },
      { type: 'tree_emerald', x: 1116, y: 1218, collidable: true },
      { type: 'tree_autumn', x: 1156, y: 1296, collidable: true },
      { type: 'tree_sakura', x: 1120, y: 1360, collidable: true },
      { type: 'tree_emerald', x: 1118, y: 1420, collidable: true },
      { type: 'tree_emerald', x: 1584, y: 1218, collidable: true },
      { type: 'tree_sakura', x: 1584, y: 1340, collidable: true },
      { type: 'tree_emerald', x: 1348, y: 1524, collidable: true },
      { type: 'tree_sakura', x: 1560, y: 1480, collidable: true },
      { type: 'tree_emerald', x: 1560, y: 1528, collidable: true },

      // === Skyline Highlands Snow Pines, Forest & Desert Scrub + Observatory Radar ===
      { type: 'tree_snow', x: 1856, y: 76, collidable: true },
      { type: 'tree_snow', x: 1856, y: 140, collidable: true },
      { type: 'tree_snow', x: 1856, y: 208, collidable: true },
      { type: 'tree_snow', x: 1856, y: 460, collidable: true },
      { type: 'tree_snow', x: 1856, y: 560, collidable: true },
      { type: 'tree_pine', x: 1856, y: 680, collidable: true },
      { type: 'tree_snow', x: 1856, y: 760, collidable: true },
      { type: 'tree_snow', x: 2028, y: 432, collidable: true },
      { type: 'tree_snow', x: 2028, y: 540, collidable: true },
      { type: 'tree_pine', x: 2032, y: 814, collidable: true },
      { type: 'tree_snow', x: 2158, y: 428, collidable: true },
      { type: 'tree_snow', x: 2158, y: 660, collidable: true },
      { type: 'tree_pine', x: 2158, y: 740, collidable: true },
      { type: 'tree_pine', x: 2158, y: 986, collidable: true },
      { type: 'tree_emerald', x: 1856, y: 1004, collidable: true },
      { type: 'tree_emerald', x: 1856, y: 1080, collidable: true },
      { type: 'tree_emerald', x: 1856, y: 1176, collidable: true },
      { type: 'tree_emerald', x: 2028, y: 1200, collidable: true },
      { type: 'tree_pine', x: 1856, y: 1272, collidable: true },
      { type: 'tree_emerald', x: 1856, y: 1360, collidable: true },
      { type: 'tree_emerald', x: 1856, y: 1456, collidable: true },
      { type: 'tree_emerald', x: 1856, y: 1524, collidable: true },
      { type: 'tree_autumn', x: 2512, y: 460, collidable: true },
      { type: 'tree_snow', x: 2512, y: 540, collidable: true },
      { type: 'tree_autumn', x: 2512, y: 620, collidable: true },
      { type: 'tree_autumn', x: 2512, y: 700, collidable: true },
      { type: 'tree_autumn', x: 2796, y: 440, collidable: true },
      { type: 'tree_autumn', x: 2796, y: 530, collidable: true },
      { type: 'tree_autumn', x: 2796, y: 620, collidable: true },
      { type: 'tree_autumn', x: 2796, y: 720, collidable: true },
      { type: 'tree_autumn', x: 2958, y: 120, collidable: true },
      { type: 'tree_autumn', x: 2948, y: 200, collidable: true },
      { type: 'tree_palm', x: 3040, y: 140, collidable: true },
      { type: 'tree_palm', x: 3104, y: 200, collidable: true },
      { type: 'radar', x: 2384, y: 592, collidable: false },

      // === Golden Sandy Beaches & Tropical Coastal Palms ===
      { type: 'tree_palm', x: 80, y: 2222, collidable: true },
      { type: 'tree_palm', x: 140, y: 2222, collidable: true },
      { type: 'tree_palm', x: 220, y: 2222, collidable: true },
      { type: 'tree_palm', x: 360, y: 2224, collidable: true },
      { type: 'tree_palm', x: 660, y: 2222, collidable: true },
      { type: 'tree_palm', x: 960, y: 2222, collidable: true },
      { type: 'tree_palm', x: 1280, y: 2224, collidable: true },
      { type: 'tree_palm', x: 1400, y: 2222, collidable: true },
      { type: 'tree_palm', x: 1520, y: 2222, collidable: true },
      { type: 'tree_palm', x: 1580, y: 2222, collidable: true },
      { type: 'tree_palm', x: 704, y: 2318, collidable: true },
      { type: 'tree_palm', x: 896, y: 2318, collidable: true },
      { type: 'tree_palm', x: 2968, y: 1620, collidable: true },
      { type: 'tree_palm', x: 2964, y: 1700, collidable: true },
      { type: 'tree_palm', x: 2968, y: 1780, collidable: true },
      { type: 'tree_palm', x: 2984, y: 1880, collidable: true },
      { type: 'tree_palm', x: 2968, y: 1980, collidable: true },
      { type: 'tree_palm', x: 2964, y: 2080, collidable: true },
      { type: 'tree_palm', x: 2968, y: 2180, collidable: true },
      { type: 'tree_palm', x: 2984, y: 2260, collidable: true },
      { type: 'tree_palm', x: 2968, y: 2320, collidable: true },

      // === Dark Harbor Moored Cargo Barge & Speedboats ===
      { type: 'barge', x: 230, y: 2304, collidable: false },
      { type: 'barge', x: 1380, y: 2304, collidable: false },
      { type: 'speedboat', x: 638, y: 2320, collidable: false },
      { type: 'speedboat', x: 1230, y: 2320, collidable: false },
      { type: 'lamp', x: 464, y: 2232, collidable: true, tint: PALETTE.GOLD },
      { type: 'lamp', x: 592, y: 2232, collidable: true, tint: PALETTE.GOLD },
      { type: 'lamp', x: 1040, y: 2232, collidable: true, tint: PALETTE.NEON_CYAN },
      { type: 'lamp', x: 1168, y: 2232, collidable: true, tint: PALETTE.NEON_CYAN },
    ];

    const interactiveProps: InteractivePropDef[] = [
      // Cyber ATMs (press E to hack/withdraw cash)
      { id: 'atm-byte-mart', type: 'atm', x: 244, y: 92 },
      { id: 'atm-cyber-corp', type: 'atm', x: 752, y: 196 },
      { id: 'atm-plaza-east', type: 'atm', x: 1144, y: 500 },
      { id: 'atm-transit', type: 'atm', x: 460, y: 1050 },
      { id: 'atm-harbor', type: 'atm', x: 1344, y: 1856 },
      { id: 'atm-chrome', type: 'atm', x: 2504, y: 1984 },
      { id: 'atm-highland', type: 'atm', x: 2200, y: 510 },

      // Explosive Red Fuel Barrels (shoot or ram fast for chain explosions!)
      { id: 'barrel-alley-n', type: 'barrel', x: 756, y: 120 },
      { id: 'barrel-alley-w', type: 'barrel', x: 120, y: 596 },
      { id: 'barrel-parking', type: 'barrel', x: 1368, y: 740 },
      { id: 'barrel-harbor-1', type: 'barrel', x: 438, y: 1800 },
      { id: 'barrel-harbor-2', type: 'barrel', x: 438, y: 1824 },
      { id: 'barrel-harbor-3', type: 'barrel', x: 614, y: 1940 },
      { id: 'barrel-harbor-4', type: 'barrel', x: 800, y: 1948 },
      { id: 'barrel-harbor-5', type: 'barrel', x: 528, y: 2248 },
      { id: 'barrel-chrome-1', type: 'barrel', x: 2308, y: 1810 },
      { id: 'barrel-chrome-2', type: 'barrel', x: 2334, y: 1810 },
      { id: 'barrel-chrome-3', type: 'barrel', x: 2496, y: 1816 },
      { id: 'barrel-chrome-4', type: 'barrel', x: 2496, y: 1842 },
      { id: 'barrel-chrome-5', type: 'barrel', x: 2278, y: 1980 },
      { id: 'barrel-highland-1', type: 'barrel', x: 2016, y: 760 },
      { id: 'barrel-highland-2', type: 'barrel', x: 2800, y: 1280 },

      // Destructible Supply Crates (smash or shoot for cash/ammo drops!)
      { id: 'crate-alley-1', type: 'crate', x: 792, y: 160 },
      { id: 'crate-harbor-1', type: 'crate', x: 744, y: 1780 },
      { id: 'crate-harbor-2', type: 'crate', x: 772, y: 1780 },
      { id: 'crate-harbor-3', type: 'crate', x: 488, y: 2008 },
      { id: 'crate-harbor-4', type: 'crate', x: 660, y: 2008 },
      { id: 'crate-harbor-5', type: 'crate', x: 1104, y: 2248 },
      { id: 'crate-chrome-1', type: 'crate', x: 2048, y: 1816 },
      { id: 'crate-chrome-2', type: 'crate', x: 2772, y: 1824 },
      { id: 'crate-chrome-3', type: 'crate', x: 2772, y: 1984 },
      { id: 'crate-park-1', type: 'crate', x: 1440, y: 1448 },

      // Fire Hydrants (shoot or hit for pressurized water geyser!)
      { id: 'hydrant-1', type: 'hydrant', x: 276, y: 232 },
      { id: 'hydrant-2', type: 'hydrant', x: 1168, y: 232 },
      { id: 'hydrant-3', type: 'hydrant', x: 428, y: 808 },
      { id: 'hydrant-4', type: 'hydrant', x: 1320, y: 808 },
      { id: 'hydrant-5', type: 'hydrant', x: 428, y: 1552 },
      { id: 'hydrant-6', type: 'hydrant', x: 1876, y: 1552 },
    ];

    const trafficSignals: TrafficSignalDef[] = [
      { x: 274, y: 244, axis: 'ns' },
      { x: 430, y: 396, axis: 'ew' },
      { x: 1170, y: 244, axis: 'ns' },
      { x: 1326, y: 396, axis: 'ew' },
      { x: 274, y: 820, axis: 'ns' },
      { x: 430, y: 972, axis: 'ew' },
      { x: 1170, y: 820, axis: 'ns' },
      { x: 1326, y: 972, axis: 'ew' },
    ];

    const steamVents: SteamVentDef[] = [
      { x: 464, y: 400 },
      { x: 784, y: 120 },
      { x: 1136, y: 400 },
      { x: 160, y: 608 },
      { x: 464, y: 816 },
      { x: 1136, y: 816 },
      { x: 800, y: 1860 },
      { x: 2480, y: 1760 },
      { x: 2480, y: 1960 },
    ];

    const landmarks: LandmarkInfo[] = [
      {
        id: 'nexus-ops',
        name: '枢纽行动终端',
        category: '任务中心',
        description: '特区中心合约终端，可接取加急派送、街头竞速与高危委托任务。',
        x: 592,
        y: 544,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'plaza-garage',
        name: '广场改装车库',
        category: '维修与改装',
        description: '提供车身修复、引擎与悬挂改装及隐匿喷漆消星服务（可驾车驶入）。',
        x: 1326,
        y: 988,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'cyber-clinic',
        name: '义体诊所',
        category: '医疗急救',
        description: '提供快速纳米急救修复生命值。',
        x: 248,
        y: 704,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'byte-mart',
        name: '字节便利店 24/7',
        category: '便利商店',
        description: '24小时营业的街头便利店，售卖可恢复生命的合成能量饮。',
        x: 144,
        y: 204,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'kitsune-noodles',
        name: '狐狸拉面馆',
        category: '街头餐饮',
        description: '霓虹蒸汽缭绕的赛博拉面摊，热腾腾的合成豚骨汤可大幅恢复体力。',
        x: 576,
        y: 676,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'plaza-tech',
        name: '广场科技坊 · 军械库',
        category: '武器与弹药',
        description: '黑市义体军械终端，售卖霓虹冲锋枪、等离子霰弹枪与高能弹药补给。',
        x: 1024,
        y: 676,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'north-bridge',
        name: '北跨河霓虹大桥',
        category: '跨河通道',
        description: '横跨霓虹运河的双线钢构大桥，直通东岸山地公路与东海环线。',
        x: 1744,
        y: 320,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'mountain-overlook',
        name: '苍穹山顶观景台',
        category: '高山地貌',
        description: '东岸苍穹山海拔最高观景平台，可俯瞰霓虹运河与全城天际线。',
        x: 2224,
        y: 544,
        accentColor: PALETTE.GOLD_HEX,
      },
      {
        id: 'riverside-park',
        name: '滨河生态公园',
        category: '公园水岸',
        description: '南区人工翠水湾与木栈道步桥，适合徒步观景与躲避巡逻视线。',
        x: 800,
        y: 1360,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'harbor-market',
        name: '暗港黑市 · 地下军械',
        category: '黑市军械库',
        description: '暗港码头走私终端，随时购买重火力武器与高能弹药补给。',
        x: 960,
        y: 2048,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'harbor-pier',
        name: '暗港深水货柜泊位',
        category: '海港码头',
        description: '南部深水码头区，拥有双栈桥泊位与停机坪飞跃跳台。',
        x: 528,
        y: 2280,
        accentColor: PALETTE.GOLD_HEX,
      },
      {
        id: 'chrome-workshop',
        name: '铬铁重工 · 涡轮车坊',
        category: '维修与改装',
        description: '铬铁工业区顶级改装工坊，提供全套车辆强化、修复与隐匿喷漆。',
        x: 2288,
        y: 1790,
        accentColor: PALETTE.NEON_CYAN_HEX,
      },
      {
        id: 'chrome-circuit',
        name: '铬铁涡轮高架直道',
        category: '极速赛道',
        description: '铺设多组电磁涡轮加速带的高速环线，极速飙车与飞跃跳台的圣地。',
        x: 2560,
        y: 1632,
        accentColor: PALETTE.GOLD_HEX,
      },
      {
        id: 'skyline-apts',
        name: '天际公寓 · 安全屋',
        category: '私人房产',
        description: '可购买作为私人安全屋：随时免费恢复满状态、躲避消星并保存进度。',
        x: 1456,
        y: 204,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'arcade-lounge',
        name: '街机俱乐部 · 霓虹博弈',
        category: '娱乐博弈',
        description: '街头地下电玩城，参与赛博幸运轮盘赌局，小博大赢取高额现金！',
        x: 144,
        y: 588,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'synth-club',
        name: '脉冲夜店 · 午夜酒吧',
        category: '夜店酒吧',
        description: '购买合成霓虹特调激活短暂过载狂暴，或花钱买通地下线人降低通缉！',
        x: 992,
        y: 996,
        accentColor: PALETTE.NEON_PURPLE_HEX,
      },
      {
        id: 'police-hq',
        name: '特区警署 · NCPD',
        category: '执法总部',
        description: '霓虹特区治安指挥枢纽，警力巡逻与重装拦截部队从此出动。',
        x: 800,
        y: 996,
        accentColor: '#38BDF8',
      },
      {
        id: 'neon-stadium',
        name: '霓虹竞技场',
        category: '地标场馆',
        description: '滨河东岸穹顶体育馆，环状霓虹顶棚是南城天际线最耀眼的坐标。',
        x: 1440,
        y: 1412,
        accentColor: PALETTE.NEON_PINK_HEX,
      },
      {
        id: 'harbor-lighthouse',
        name: '暗港霓虹灯塔岛',
        category: '离岸灯塔',
        description: '穿过木栈步桥即可抵达的南部沙洲岛，高耸灯塔指引着暗港航道。',
        x: 800,
        y: 2264,
        accentColor: PALETTE.GOLD_HEX,
      },
      {
        id: 'obsidian-volcano',
        name: '黑曜活火山口',
        category: '火山奇观',
        description: '高地东南端的炙热活火山，炽烈熔岩流与黑曜岩崖壁构筑出狂野地形。',
        x: 2160,
        y: 1248,
        accentColor: '#F97316',
      },
    ];

    return {
      id: 'neon-district',
      name: WORLD_CONFIG.STARTING_DISTRICT,
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
    };
  }
}
