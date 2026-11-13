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
  roofStyle: 'tech' | 'store' | 'diner' | 'residential' | 'booth';
  signText: string;
  hasFan?: boolean;
}

export interface PropDef {
  type: 'lamp' | 'vending' | 'planter' | 'bench' | 'kiosk' | 'bollard' | 'cone' | 'stool' | 'trashbin' | 'billboard';
  x: number;
  y: number;
  collidable: boolean;
  tint?: number;
  label?: string;
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
    ];

    const docks: CityRect[] = [
      { x: 32, y: 1696, w: 1600, h: 512 },
      { x: 448, y: 2208, w: 160, h: 128 },
      { x: 1024, y: 2208, w: 160, h: 128 },
    ];

    const rivers: CityRect[] = [
      { x: 1664, y: 32, w: 160, h: 2336 },
      { x: 32, y: 2208, w: 1632, h: 160 },
      { x: 512, y: 1312, w: 576, h: 128 },
    ];

    const waterColliders: CityRect[] = [
      // Neon Cyber River sections between the 4 bridges
      { x: 1664, y: 32, w: 160, h: 224 },
      { x: 1664, y: 384, w: 160, h: 448 },
      { x: 1664, y: 960, w: 160, h: 608 },
      { x: 1664, y: 1696, w: 160, h: 384 },
      { x: 1664, y: 2208, w: 160, h: 160 },
      // Southern Harbor Bay excluding the two drivable cargo piers
      { x: 32, y: 2208, w: 416, h: 160 },
      { x: 608, y: 2208, w: 416, h: 160 },
      { x: 1184, y: 2208, w: 480, h: 160 },
      { x: 448, y: 2336, w: 160, h: 32 },
      { x: 1024, y: 2336, w: 160, h: 32 },
      // Riverside Park Emerald Lagoon
      { x: 512, y: 1312, w: 224, h: 128 },
      { x: 864, y: 1312, w: 224, h: 128 },
    ];

    const bridges: CityRect[] = [
      { x: 1632, y: 256, w: 224, h: 128 },
      { x: 1632, y: 832, w: 224, h: 128 },
      { x: 1632, y: 1568, w: 224, h: 128 },
      { x: 1632, y: 2080, w: 224, h: 128 },
      { x: 736, y: 1312, w: 128, h: 128 },
    ];

    const mountains: MountainDef[] = [
      { id: 'mtn-north', name: '北峰绝壁', x: 1888, y: 64, w: 960, h: 160, elevation: 340 },
      { id: 'mtn-skyline', name: '苍穹主峰', x: 2048, y: 416, w: 96, h: 384, elevation: 480 },
      { id: 'mtn-east-plateau', name: '云巅高原', x: 2272, y: 384, w: 512, h: 416, elevation: 520 },
      { id: 'mtn-south-gorge', name: '南岭矿峰', x: 2048, y: 1024, w: 96, h: 480, elevation: 360 },
      { id: 'mtn-se-crag', name: '赤岩矿脉', x: 2272, y: 992, w: 512, h: 512, elevation: 410 },
      { id: 'mtn-coast-cliff', name: '东海峭壁', x: 2976, y: 384, w: 160, h: 1120, elevation: 450 },
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
        signText: '电玩城',
        x: 64,
        y: 448,
        w: 160,
        h: 128,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'store',
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
        id: 'synth-club',
        label: '脉冲夜店',
        signText: '电子脉冲',
        x: 864,
        y: 1008,
        w: 256,
        h: 112,
        neonColor: PALETTE.NEON_PURPLE,
        accentHex: PALETTE.NEON_PURPLE_HEX,
        roofStyle: 'store',
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
        roofStyle: 'tech',
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
        roofStyle: 'store',
      },
      {
        id: 'harbor-container-1',
        label: 'A区货柜',
        signText: 'CARGO A',
        x: 464,
        y: 1920,
        w: 128,
        h: 64,
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'booth',
      },
      {
        id: 'harbor-container-2',
        label: 'B区货柜',
        signText: 'CARGO B',
        x: 640,
        y: 1920,
        w: 128,
        h: 64,
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'booth',
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
        neonColor: PALETTE.NEON_CYAN,
        accentHex: PALETTE.NEON_CYAN_HEX,
        roofStyle: 'tech',
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
        roofStyle: 'tech',
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
        neonColor: PALETTE.NEON_PINK,
        accentHex: PALETTE.NEON_PINK_HEX,
        roofStyle: 'residential',
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
    ];

    return {
      id: 'neon-district',
      name: WORLD_CONFIG.STARTING_DISTRICT,
      roads,
      sidewalks,
      plazaZones,
      parks,
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
      trafficSignals,
      steamVents,
      landmarks,
    };
  }
}
