export type TimePhaseId = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherId = 'clear' | 'rain' | 'acid_rain' | 'fog' | 'storm' | 'sandstorm';

export interface TimePhaseSpec {
  id: TimePhaseId;
  label: string;
  tintColor: number;
  darknessAlpha: number;
  neonBoost: number;
}

export interface WeatherPostFxSpec {
  saturation: number;
  contrast: number;
  brightness: number;
  hueShiftDeg: number;
  vignetteColor: number;
  vignetteRadius: number;
  vignetteStrength: number;
  blurStrength: number;
  scanlineAlpha: number;
}

export interface WeatherSpec {
  id: WeatherId;
  label: string;
  effectHint: string;
  policeSightMult: number;
  vehicleGripMult: number;
  overlayColor: number;
  overlayAlpha: number;
  postFx: WeatherPostFxSpec;
}

export const TIME_PHASE_SPECS: Record<TimePhaseId, TimePhaseSpec> = {
  dawn: {
    id: 'dawn',
    label: '破晓清晨',
    tintColor: 0x3b2d54,
    darknessAlpha: 0.03,
    neonBoost: 0.72,
  },
  day: {
    id: 'day',
    label: '霓虹白昼',
    tintColor: 0x0f172a,
    darknessAlpha: 0.0,
    neonBoost: 0.45,
  },
  dusk: {
    id: 'dusk',
    label: '赛博黄昏',
    tintColor: 0x5c2444,
    darknessAlpha: 0.05,
    neonBoost: 0.88,
  },
  night: {
    id: 'night',
    label: '霓虹深夜',
    tintColor: 0x0b132b,
    darknessAlpha: 0.09,
    neonBoost: 1.0,
  },
};

export const WEATHER_ORDER: WeatherId[] = [
  'clear',
  'rain',
  'acid_rain',
  'fog',
  'storm',
  'sandstorm',
];

export const WEATHER_SPECS: Record<WeatherId, WeatherSpec> = {
  clear: {
    id: 'clear',
    label: '晴朗夜空',
    effectHint: '视野与抓地力最佳 · 霓虹高反差锐利滤镜',
    policeSightMult: 1.0,
    vehicleGripMult: 1.0,
    overlayColor: 0x070d20,
    overlayAlpha: 0.0,
    postFx: {
      saturation: 0.34,
      contrast: 0.16,
      brightness: 1.18,
      hueShiftDeg: 0,
      vignetteColor: 0x020617,
      vignetteRadius: 0.76,
      vignetteStrength: 0.11,
      blurStrength: 0,
      scanlineAlpha: 0.01,
    },
  },
  rain: {
    id: 'rain',
    label: '霓虹暴雨',
    effectHint: '警队视野 -22% · 湿滑漂移 · 霓虹高饱和湿润滤镜',
    policeSightMult: 0.78,
    vehicleGripMult: 0.84,
    overlayColor: 0x082f49,
    overlayAlpha: 0.05,
    postFx: {
      saturation: 0.38,
      contrast: 0.17,
      brightness: 1.16,
      hueShiftDeg: 3,
      vignetteColor: 0x062c43,
      vignetteRadius: 0.72,
      vignetteStrength: 0.16,
      blurStrength: 0,
      scanlineAlpha: 0.018,
    },
  },
  acid_rain: {
    id: 'acid_rain',
    label: '赛博酸雨',
    effectHint: '警队视野 -28% · 腐蚀湿滑 · 荧光毒雾赛博滤镜',
    policeSightMult: 0.72,
    vehicleGripMult: 0.82,
    overlayColor: 0x052e16,
    overlayAlpha: 0.06,
    postFx: {
      saturation: 0.24,
      contrast: 0.11,
      brightness: 1.1,
      hueShiftDeg: -10,
      vignetteColor: 0x14532d,
      vignetteRadius: 0.65,
      vignetteStrength: 0.18,
      blurStrength: 0.18,
      scanlineAlpha: 0.022,
    },
  },
  fog: {
    id: 'fog',
    label: '霓虹浓雾',
    effectHint: '警队视野 -42% · 低能见度潜行 · 柔焦迷雾滤镜',
    policeSightMult: 0.58,
    vehicleGripMult: 0.94,
    overlayColor: 0x1e293b,
    overlayAlpha: 0.09,
    postFx: {
      saturation: -0.1,
      contrast: -0.04,
      brightness: 1.13,
      hueShiftDeg: 0,
      vignetteColor: 0x334155,
      vignetteRadius: 0.62,
      vignetteStrength: 0.22,
      blurStrength: 0.26,
      scanlineAlpha: 0.015,
    },
  },
  storm: {
    id: 'storm',
    label: '电磁雷暴',
    effectHint: '警队视野 -35% · 强侧滑漂移 · 雷暴高压脉冲滤镜',
    policeSightMult: 0.65,
    vehicleGripMult: 0.78,
    overlayColor: 0x1e1b4b,
    overlayAlpha: 0.07,
    postFx: {
      saturation: 0.22,
      contrast: 0.13,
      brightness: 1.09,
      hueShiftDeg: 6,
      vignetteColor: 0x312e81,
      vignetteRadius: 0.66,
      vignetteStrength: 0.2,
      blurStrength: 0,
      scanlineAlpha: 0.025,
    },
  },
  sandstorm: {
    id: 'sandstorm',
    label: '赤岩沙暴',
    effectHint: '警队索敌 -38% · 风阻滑移 · 废土琥珀滤镜',
    policeSightMult: 0.62,
    vehicleGripMult: 0.88,
    overlayColor: 0x78350f,
    overlayAlpha: 0.07,
    postFx: {
      saturation: -0.04,
      contrast: 0.09,
      brightness: 1.12,
      hueShiftDeg: -14,
      vignetteColor: 0x7c2d12,
      vignetteRadius: 0.64,
      vignetteStrength: 0.2,
      blurStrength: 0.14,
      scanlineAlpha: 0.02,
    },
  },
};

export type RandomEventType =
  | 'street_robbery'
  | 'gang_shootout'
  | 'armored_van'
  | 'bounty_hunt'
  | 'military_convoy'
  | 'cyber_psycho';

export interface RandomEventSpec {
  type: RandomEventType;
  title: string;
  description: string;
  accentColor: string;
  accentNum: number;
  weight: number;
  durationSec: number;
  cashReward: number;
  expReward: number;
  repRewards: Partial<Record<ReputationFactionId, number>>;
  preferredDistricts: string[];
}

export const RANDOM_EVENT_SPECS: Record<RandomEventType, RandomEventSpec> = {
  street_robbery: {
    type: 'street_robbery',
    title: '街头持械抢劫',
    description: '武装劫匪正在洗劫街头商户，击溃匪徒夺回赃款与悬赏！',
    accentColor: '#FFD166',
    accentNum: 0xffd166,
    weight: 24,
    durationSec: 110,
    cashReward: 260,
    expReward: 85,
    repRewards: { street: 20, law: 25 },
    preferredDistricts: ['霓虹广场', '深水港湾'],
  },
  gang_shootout: {
    type: 'gang_shootout',
    title: '黑帮街头火拼',
    description: '黑帮武装小队在街区交火，清剿敌对武装可搜刮高额战利品！',
    accentColor: '#FF2E88',
    accentNum: 0xff2e88,
    weight: 22,
    durationSec: 120,
    cashReward: 340,
    expReward: 110,
    repRewards: { street: 35 },
    preferredDistricts: ['工业船坞', '霓虹广场', '黄金海岸'],
  },
  armored_van: {
    type: 'armored_van',
    title: '运钞车武装押运',
    description: '重装运钞车正穿过主干道，拦截摧毁可爆出巨额现金（会引起通缉）！',
    accentColor: '#00F5FF',
    accentNum: 0x00f5ff,
    weight: 16,
    durationSec: 125,
    cashReward: 620,
    expReward: 150,
    repRewards: { street: 45, hacker: 25 },
    preferredDistricts: ['霓虹广场', '科技园区'],
  },
  bounty_hunt: {
    type: 'bounty_hunt',
    title: '暗网高速悬赏犯',
    description: '高危通缉逃犯正驾驶跑车全城逃窜，截停并击毁目标领取暗网赏金！',
    accentColor: '#38BDF8',
    accentNum: 0x38bdf8,
    weight: 18,
    durationSec: 115,
    cashReward: 420,
    expReward: 125,
    repRewards: { law: 40, hacker: 15 },
    preferredDistricts: ['黄金海岸', '科技园区', '雪原峰峦'],
  },
  military_convoy: {
    type: 'military_convoy',
    title: '军工重装运输队',
    description: '特区军工装甲运输车携重型弹药出动，摧毁车队可夺取军火箱与赏金！',
    accentColor: '#F97316',
    accentNum: 0xf97316,
    weight: 12,
    durationSec: 130,
    cashReward: 560,
    expReward: 160,
    repRewards: { street: 40, hacker: 30 },
    preferredDistricts: ['黑曜火山', '工业船坞', '赤岩荒漠'],
  },
  cyber_psycho: {
    type: 'cyber_psycho',
    title: '失控赛博义体疯子',
    description: '重度义体改造者陷入赛博精神病暴走，击败首领级目标赢取丰厚悬赏！',
    accentColor: '#C000FF',
    accentNum: 0xc000ff,
    weight: 10,
    durationSec: 135,
    cashReward: 680,
    expReward: 190,
    repRewards: { street: 35, law: 45 },
    preferredDistricts: ['科技园区', '霓虹广场', '工业船坞'],
  },
};

export type SkillTrackId = 'combat' | 'mechanics' | 'hacking' | 'survival';

export interface SkillTrackSpec {
  id: SkillTrackId;
  name: string;
  subtitle: string;
  accentColor: string;
  maxLevel: number;
  levelEffects: string[];
}

export const SKILL_TREE_ORDER: SkillTrackId[] = ['combat', 'mechanics', 'hacking', 'survival'];

export const SKILL_TREE_SPECS: Record<SkillTrackId, SkillTrackSpec> = {
  combat: {
    id: 'combat',
    name: '战斗专家',
    subtitle: '强化全枪械输出、暴击概率与战场击杀续航',
    accentColor: '#FF2E88',
    maxLevel: 4,
    levelEffects: [
      '全枪械伤害 +10% · 暴击率 +6%',
      '全枪械伤害 +20% · 暴击率 +12% · 射速 +8%',
      '全枪械伤害 +32% · 暴击率 +18% · 射速 +15%',
      '终极枪神：伤害 +45% · 暴击率 +25% · 击杀回血 +5',
    ],
  },
  mechanics: {
    id: 'mechanics',
    name: '机械专家',
    subtitle: '优化载具极速、氮气回复、车库折扣与机甲协同',
    accentColor: '#FFD166',
    maxLevel: 4,
    levelEffects: [
      '载具极速 +6% · 氮气恢复 +18% · 修车改装 -10%',
      '载具极速 +12% · 氮气恢复 +35% · 修车改装 -20%',
      '载具极速 +18% · 耐撞 +25% · 机甲/炮塔战力 +20%',
      '机械宗师：极速 +25% · 修车改装 -35% · 机甲/炮塔 +35%',
    ],
  },
  hacking: {
    id: 'hacking',
    name: '黑客专家',
    subtitle: '黑入 ATM 暴利提现、隐藏警报与主动干扰通缉信号',
    accentColor: '#00F5FF',
    maxLevel: 4,
    levelEffects: [
      'ATM 提现收益 +30% · 警报触发概率降低',
      '【解锁主动】按 [H] 干扰 1-3 星警用雷达追踪 8 秒',
      'ATM 收益 +70% · 商店购置费用 -12% · 干扰冷却 -25%',
      '幽灵网行者：ATM 翻倍收益 · 几乎无警报 · 干扰持续 11 秒',
    ],
  },
  survival: {
    id: 'survival',
    name: '生存专家',
    subtitle: '提升生命/护甲上限、徒步机动与全补给回复',
    accentColor: '#38BDF8',
    maxLevel: 4,
    levelEffects: [
      '最大生命 +25 · 最大护甲 +20 · 徒步移速 +7%',
      '最大生命 +50 · 最大护甲 +40 · 补给回复 +20%',
      '最大生命 +80 · 最大护甲 +65 · 减伤 +10% · 移速 +14%',
      '不朽义躯：生命 +120 · 护甲 +90 · 减伤 +18% · 回复 +35%',
    ],
  },
};

export type CyberwareSlotId = 'optics' | 'arms' | 'legs' | 'spine' | 'neural';

export interface CyberwareTierSpec {
  tier: number;
  name: string;
  cost: number;
  effectText: string;
  requiredFaction?: ReputationFactionId;
  requiredRep?: number;
}

export interface CyberwareSlotSpec {
  slot: CyberwareSlotId;
  slotLabel: string;
  accentColor: string;
  tiers: CyberwareTierSpec[];
}

export const CYBERWARE_SLOT_ORDER: CyberwareSlotId[] = ['optics', 'arms', 'legs', 'spine', 'neural'];

export const CYBERWARE_SPECS: Record<CyberwareSlotId, CyberwareSlotSpec> = {
  optics: {
    slot: 'optics',
    slotLabel: '光学扫描仪',
    accentColor: '#00F5FF',
    tiers: [
      {
        tier: 1,
        name: 'MK.I 岐路司基础义眼',
        cost: 350,
        effectText: '暴击率 +6% · 武器伤害 +5%',
      },
      {
        tier: 2,
        name: 'MK.II 热成像弹道追踪镜',
        cost: 780,
        effectText: '暴击率 +12% · 武器伤害 +12%',
        requiredFaction: 'hacker',
        requiredRep: 60,
      },
      {
        tier: 3,
        name: 'MK.III 全息预判核心眼',
        cost: 1450,
        effectText: '暴击率 +20% · 武器伤害 +20%',
        requiredFaction: 'hacker',
        requiredRep: 150,
      },
    ],
  },
  arms: {
    slot: 'arms',
    slotLabel: '动力战斗义肢',
    accentColor: '#FF2E88',
    tiers: [
      {
        tier: 1,
        name: 'MK.I 反冲稳定握臂',
        cost: 380,
        effectText: '全武器伤害 +8%',
      },
      {
        tier: 2,
        name: 'MK.II 强力螳螂压枪臂',
        cost: 840,
        effectText: '全武器伤害 +16% · 射速 +8%',
        requiredFaction: 'street',
        requiredRep: 70,
      },
      {
        tier: 3,
        name: 'MK.III 磁轨伺服重臂',
        cost: 1550,
        effectText: '全武器伤害 +26% · 射速 +15%',
        requiredFaction: 'street',
        requiredRep: 160,
      },
    ],
  },
  legs: {
    slot: 'legs',
    slotLabel: '机动伺服义腿',
    accentColor: '#FFD166',
    tiers: [
      {
        tier: 1,
        name: 'MK.I 碳纤爆发肌腱',
        cost: 320,
        effectText: '徒步移速 +10%',
      },
      {
        tier: 2,
        name: 'MK.II 脉冲推进小腿',
        cost: 700,
        effectText: '徒步移速 +18% · 氮气回复 +15%',
        requiredFaction: 'street',
        requiredRep: 50,
      },
      {
        tier: 3,
        name: 'MK.III 幽灵悬浮足踝',
        cost: 1320,
        effectText: '徒步移速 +26% · 氮气回复 +30%',
        requiredFaction: 'street',
        requiredRep: 140,
      },
    ],
  },
  spine: {
    slot: 'spine',
    slotLabel: '神经脊椎插件',
    accentColor: '#C000FF',
    tiers: [
      {
        tier: 1,
        name: 'MK.I 肾上腺素加速器',
        cost: 420,
        effectText: '武器射速 +10%',
      },
      {
        tier: 2,
        name: 'MK.II 斯安威斯坦脉冲脊椎',
        cost: 920,
        effectText: '武器射速 +18% · 减伤 +8%',
        requiredFaction: 'law',
        requiredRep: 70,
      },
      {
        tier: 3,
        name: 'MK.III 军用级时空反射脊',
        cost: 1700,
        effectText: '武器射速 +26% · 减伤 +16%',
        requiredFaction: 'law',
        requiredRep: 160,
      },
    ],
  },
  neural: {
    slot: 'neural',
    slotLabel: '战术计算核心',
    accentColor: '#38BDF8',
    tiers: [
      {
        tier: 1,
        name: 'MK.I 加密协议协同芯片',
        cost: 360,
        effectText: '经验获取 +15% · 现金奖励 +8%',
      },
      {
        tier: 2,
        name: 'MK.II 暗网裂解超算核',
        cost: 820,
        effectText: '经验 +28% · 现金奖励 +16% · 干扰冷却 -20%',
        requiredFaction: 'hacker',
        requiredRep: 80,
      },
      {
        tier: 3,
        name: 'MK.III 奇点战术主脑',
        cost: 1600,
        effectText: '经验 +45% · 现金奖励 +28% · 干扰冷却 -35%',
        requiredFaction: 'hacker',
        requiredRep: 180,
      },
    ],
  },
};

export type ReputationFactionId = 'street' | 'hacker' | 'law';

export interface ReputationFactionSpec {
  id: ReputationFactionId;
  name: string;
  description: string;
  accentColor: string;
  ranks: Array<{ minRep: number; title: string }>;
}

export const REPUTATION_ORDER: ReputationFactionId[] = ['street', 'hacker', 'law'];

export const REPUTATION_SPECS: Record<ReputationFactionId, ReputationFactionSpec> = {
  street: {
    id: 'street',
    name: '街头威望',
    description: '通过黑帮火拼、运钞劫案、赛博狂徒讨伐与城市委托累积，解锁重型战斗义肢。',
    accentColor: '#FF2E88',
    ranks: [
      { minRep: 0, title: '无名游侠' },
      { minRep: 60, title: '街头新星' },
      { minRep: 150, title: '区街话事人' },
      { minRep: 300, title: '霓虹传奇' },
    ],
  },
  hacker: {
    id: 'hacker',
    name: '黑客声望',
    description: '通过破解 ATM、收集霓虹数据芯片与拦截特殊车队累积，解锁顶尖光学与计算核心。',
    accentColor: '#00F5FF',
    ranks: [
      { minRep: 0, title: '脚本学徒' },
      { minRep: 60, title: '暗网潜入者' },
      { minRep: 150, title: '零日破壁手' },
      { minRep: 300, title: '赛博幽灵' },
    ],
  },
  law: {
    id: 'law',
    name: '执法声望',
    description: '通过警车【治安追缉】、击溃通缉逃犯与平息街头抢劫累积，解锁军用脊椎义体。',
    accentColor: '#38BDF8',
    ranks: [
      { minRep: 0, title: '协防市民' },
      { minRep: 60, title: '赏金义警' },
      { minRep: 150, title: '特区清道夫' },
      { minRep: 300, title: '首席裁决官' },
    ],
  },
};

export interface HordePerkSpec {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  maxStacks: number;
}

export const HORDE_ROGUELITE_PERKS: HordePerkSpec[] = [
  {
    id: 'overload_ammo',
    name: '过载弹药',
    tagline: '火力狂飙',
    description: '全武器与机甲伤害提升 +22%（可叠加）',
    accentColor: '#FF2E88',
    maxStacks: 6,
  },
  {
    id: 'rapid_cycling',
    name: '高频机械装填',
    tagline: '射速倍增',
    description: '所有武器射速加快 14%，压制尸潮更顺畅',
    accentColor: '#FFD166',
    maxStacks: 5,
  },
  {
    id: 'arc_chain',
    name: '电磁弹链',
    tagline: '连锁闪电',
    description: '命中敌人时释放高能电弧，弹射伤害附近 150px 内最多 2 名敌人',
    accentColor: '#00F5FF',
    maxStacks: 4,
  },
  {
    id: 'nano_regen',
    name: '纳米修复血液',
    tagline: '持续回血',
    description: '每秒自动恢复 +3 生命值（可叠加）',
    accentColor: '#4ADE80',
    maxStacks: 5,
  },
  {
    id: 'cyber_berserk',
    name: '义体狂暴协议',
    tagline: '残血爆发',
    description: '生命低于 55% 时所有攻击额外造成 +42% 伤害',
    accentColor: '#F97316',
    maxStacks: 4,
  },
  {
    id: 'quantum_pierce',
    name: '量子穿透弹道',
    tagline: '贯穿群敌',
    description: '子弹穿透数量 +1，弹道飞行速度提升 +15%',
    accentColor: '#C000FF',
    maxStacks: 3,
  },
  {
    id: 'tactical_plate',
    name: '反应装甲镀层',
    tagline: '坚不可摧',
    description: '所受全部伤害降低 14%，并立刻补充 +45 点防弹护甲',
    accentColor: '#38BDF8',
    maxStacks: 4,
  },
  {
    id: 'vampiric_core',
    name: '虹吸战地核心',
    tagline: '以战养战',
    description: '每次击杀敌人立刻恢复 +4 生命值与 +2 护甲',
    accentColor: '#FB7185',
    maxStacks: 4,
  },
  {
    id: 'mech_overclock',
    name: '机甲与炮塔协奏',
    tagline: '重装进化',
    description: '机甲与激光哨戒炮伤害 +30%，机甲技能冷却缩短 20%',
    accentColor: '#FACC15',
    maxStacks: 4,
  },
  {
    id: 'bounty_multiplier',
    name: '暗网赏金超频',
    tagline: '财富滚雪球',
    description: '无尽模式击杀现金收益 +35%，并立即空投 +$260 作战经费',
    accentColor: '#FDE047',
    maxStacks: 4,
  },
];
