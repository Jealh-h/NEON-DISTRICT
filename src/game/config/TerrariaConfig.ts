export type TerrariaResourceId =
  | 'scrap_alloy'
  | 'neon_crystal'
  | 'quantum_core'
  | 'frost_ore'
  | 'obsidian_shard'
  | 'abyss_pearl'
  | 'boss_soul';

export type TerrariaStructureType = 'campfire' | 'barricade' | 'turret' | 'pylon';

export type TerrariaAccessoryId =
  | 'hermes_boots'
  | 'obsidian_shield'
  | 'treasure_magnet'
  | 'celestial_cuff';

export type TerrariaPotionId = 'ironskin' | 'mining' | 'recall';

export type TerrariaBossId = 'watcher_eye' | 'frost_skeletron' | 'obsidian_destroyer';

export interface TerrariaResourceSpec {
  id: TerrariaResourceId;
  name: string;
  districtHint: string;
  colorNum: number;
  colorHex: string;
  glowHex: string;
  nodeHp: number;
  baseYield: [number, number];
}

export const TERRARIA_RESOURCE_ORDER: TerrariaResourceId[] = [
  'scrap_alloy',
  'neon_crystal',
  'quantum_core',
  'frost_ore',
  'obsidian_shard',
  'abyss_pearl',
  'boss_soul',
];

export const TERRARIA_RESOURCES: Record<TerrariaResourceId, TerrariaResourceSpec> = {
  scrap_alloy: {
    id: 'scrap_alloy',
    name: '铬铁废钢',
    districtHint: '铬铁工业区 · 星港',
    colorNum: 0x94a3b8,
    colorHex: '#CBD5E1',
    glowHex: '#64748B',
    nodeHp: 75,
    baseYield: [2, 4],
  },
  neon_crystal: {
    id: 'neon_crystal',
    name: '霓虹魔晶',
    districtHint: '霓虹广场 · 滨河公园',
    colorNum: 0xff2e88,
    colorHex: '#FF2E88',
    glowHex: '#C000FF',
    nodeHp: 85,
    baseYield: [2, 3],
  },
  quantum_core: {
    id: 'quantum_core',
    name: '量子晶核',
    districtHint: '量子科教区',
    colorNum: 0x00f5ff,
    colorHex: '#00F5FF',
    glowHex: '#38BDF8',
    nodeHp: 100,
    baseYield: [1, 3],
  },
  frost_ore: {
    id: 'frost_ore',
    name: '寒霜秘银',
    districtHint: '苍穹山脉北麓雪岭',
    colorNum: 0x7dd3fc,
    colorHex: '#7DD3FC',
    glowHex: '#E0F2FE',
    nodeHp: 115,
    baseYield: [1, 3],
  },
  obsidian_shard: {
    id: 'obsidian_shard',
    name: '黑曜熔石',
    districtHint: '苍穹火山南麓熔岩带',
    colorNum: 0xf97316,
    colorHex: '#F97316',
    glowHex: '#A855F7',
    nodeHp: 130,
    baseYield: [1, 3],
  },
  abyss_pearl: {
    id: 'abyss_pearl',
    name: '深海棱珠',
    districtHint: '暗港码头海岸',
    colorNum: 0x34d399,
    colorHex: '#34D399',
    glowHex: '#2DD4BF',
    nodeHp: 95,
    baseYield: [1, 3],
  },
  boss_soul: {
    id: 'boss_soul',
    name: '机魂核心',
    districtHint: '击败召唤型世界 Boss 掉落',
    colorNum: 0xffd166,
    colorHex: '#FFD166',
    glowHex: '#F59E0B',
    nodeHp: 150,
    baseYield: [2, 4],
  },
};

export interface BiomeOreSpawnDef {
  id: string;
  resourceId: TerrariaResourceId;
  x: number;
  y: number;
  districtName: string;
}

export const BIOME_ORE_SPAWNS: BiomeOreSpawnDef[] = [
  // 霓虹广场 & 滨河公园 (Neon Crystal)
  { id: 'ore-neon-1', resourceId: 'neon_crystal', x: 640, y: 500, districtName: '霓虹广场' },
  { id: 'ore-neon-2', resourceId: 'neon_crystal', x: 1460, y: 520, districtName: '霓虹广场' },
  { id: 'ore-neon-3', resourceId: 'neon_crystal', x: 1080, y: 1520, districtName: '滨河生态公园' },
  { id: 'ore-neon-4', resourceId: 'neon_crystal', x: 2180, y: 1560, districtName: '滨河生态公园' },
  { id: 'ore-neon-5', resourceId: 'neon_crystal', x: 420, y: 1560, districtName: '滨河生态公园' },

  // 量子科教区 (Quantum Core)
  { id: 'ore-q-1', resourceId: 'quantum_core', x: 2120, y: 460, districtName: '量子科教区' },
  { id: 'ore-q-2', resourceId: 'quantum_core', x: 2920, y: 420, districtName: '量子科教区' },
  { id: 'ore-q-3', resourceId: 'quantum_core', x: 2480, y: 1040, districtName: '量子科教区' },
  { id: 'ore-q-4', resourceId: 'quantum_core', x: 3160, y: 1040, districtName: '量子科教区' },

  // 苍穹雪岭 (Frost Ore)
  { id: 'ore-f-1', resourceId: 'frost_ore', x: 3680, y: 360, districtName: '苍穹山脉' },
  { id: 'ore-f-2', resourceId: 'frost_ore', x: 4180, y: 380, districtName: '苍穹山脉' },
  { id: 'ore-f-3', resourceId: 'frost_ore', x: 4540, y: 480, districtName: '苍穹山脉' },
  { id: 'ore-f-4', resourceId: 'frost_ore', x: 3840, y: 610, districtName: '苍穹山脉' },

  // 苍穹火山熔岩带 (Obsidian Shard)
  { id: 'ore-o-1', resourceId: 'obsidian_shard', x: 3680, y: 980, districtName: '苍穹火山带' },
  { id: 'ore-o-2', resourceId: 'obsidian_shard', x: 4160, y: 1060, districtName: '苍穹火山带' },
  { id: 'ore-o-3', resourceId: 'obsidian_shard', x: 4520, y: 980, districtName: '苍穹火山带' },
  { id: 'ore-o-4', resourceId: 'obsidian_shard', x: 3920, y: 1200, districtName: '苍穹火山带' },

  // 暗港码头海岸 (Abyss Pearl)
  { id: 'ore-a-1', resourceId: 'abyss_pearl', x: 420, y: 2380, districtName: '暗港码头' },
  { id: 'ore-a-2', resourceId: 'abyss_pearl', x: 640, y: 3040, districtName: '暗港码头' },
  { id: 'ore-a-3', resourceId: 'abyss_pearl', x: 1180, y: 3080, districtName: '暗港码头' },
  { id: 'ore-a-4', resourceId: 'abyss_pearl', x: 1560, y: 2540, districtName: '暗港码头' },

  // 铬铁工业区 & 星港航空区 (Scrap Alloy)
  { id: 'ore-s-1', resourceId: 'scrap_alloy', x: 2040, y: 2440, districtName: '铬铁工业区' },
  { id: 'ore-s-2', resourceId: 'scrap_alloy', x: 2740, y: 2460, districtName: '铬铁工业区' },
  { id: 'ore-s-3', resourceId: 'scrap_alloy', x: 3180, y: 3060, districtName: '铬铁工业区' },
  { id: 'ore-s-4', resourceId: 'scrap_alloy', x: 3740, y: 1840, districtName: '星港航空区' },
  { id: 'ore-s-5', resourceId: 'scrap_alloy', x: 4320, y: 2420, districtName: '星港航空区' },
  { id: 'ore-s-6', resourceId: 'scrap_alloy', x: 3820, y: 3120, districtName: '星港航空区' },
  { id: 'ore-s-7', resourceId: 'scrap_alloy', x: 560, y: 960, districtName: '霓虹广场' },
];

export type TerrariaCraftCategory = 'build' | 'gear' | 'boss';

export interface TerrariaRecipe {
  id: string;
  category: TerrariaCraftCategory;
  name: string;
  description: string;
  accentHex: string;
  cost: Partial<Record<TerrariaResourceId, number>>;
  cashCost?: number;
  kind:
    | { type: 'structure'; structureType: TerrariaStructureType }
    | { type: 'pickaxe' }
    | { type: 'accessory'; accessoryId: TerrariaAccessoryId }
    | { type: 'potion'; potionId: TerrariaPotionId }
    | { type: 'boss'; bossId: TerrariaBossId };
}

export const TERRARIA_RECIPES: TerrariaRecipe[] = [
  // Build & Tools
  {
    id: 'craft-campfire',
    category: 'build',
    name: '霓虹战术营火',
    description: '在身前放置永久营火（上限 4 座），靠近 165px 内持续每秒恢复 +8 生命值',
    accentHex: '#F97316',
    cost: { scrap_alloy: 2, neon_crystal: 1 },
    kind: { type: 'structure', structureType: 'campfire' },
  },
  {
    id: 'craft-barricade',
    category: 'build',
    name: '合金防御壁垒',
    description: '架设 260 耐久等离子掩体墙（上限 10 面），阻挡 Boss 与敌方子弹穿透',
    accentHex: '#38BDF8',
    cost: { scrap_alloy: 3 },
    kind: { type: 'structure', structureType: 'barricade' },
  },
  {
    id: 'craft-turret',
    category: 'build',
    name: '聚能哨戒炮台',
    description: '部署自动锁定炮台（上限 4 座），自动攻击世界 Boss、黑帮据点与突发敌人',
    accentHex: '#00F5FF',
    cost: { scrap_alloy: 4, quantum_core: 2 },
    kind: { type: 'structure', structureType: 'turret' },
  },
  {
    id: 'craft-pylon',
    category: 'build',
    name: '个人折跃晶塔',
    description: '放置自定义快速传送锚点（上限 2 座），可在全图或造物台瞬间折跃至此',
    accentHex: '#C000FF',
    cost: { neon_crystal: 3, quantum_core: 2, abyss_pearl: 1 },
    kind: { type: 'structure', structureType: 'pylon' },
  },
  {
    id: 'craft-pickaxe',
    category: 'build',
    name: '等离子聚能矿镐',
    description: '永久升级采矿工具：按 E 挥镐或射击矿脉时所有矿石掉落产量翻倍 (+100%)',
    accentHex: '#FFD166',
    cost: { scrap_alloy: 5, quantum_core: 2, frost_ore: 2 },
    kind: { type: 'pickaxe' },
  },

  // Accessories & Potions
  {
    id: 'craft-hermes-boots',
    category: 'gear',
    name: '赫尔墨斯推进靴（饰品）',
    description: '装备后步行与疾跑移动速度永久提升 +22%',
    accentHex: '#00F5FF',
    cost: { neon_crystal: 3, abyss_pearl: 2 },
    kind: { type: 'accessory', accessoryId: 'hermes_boots' },
  },
  {
    id: 'craft-obsidian-shield',
    category: 'gear',
    name: '黑曜石战术盾（饰品）',
    description: '装备后获得 +14% 全伤害减免与护甲抗击退护盾',
    accentHex: '#A855F7',
    cost: { scrap_alloy: 4, obsidian_shard: 3 },
    kind: { type: 'accessory', accessoryId: 'obsidian_shield' },
  },
  {
    id: 'craft-treasure-magnet',
    category: 'gear',
    name: '赛博寻宝磁铁（饰品）',
    description: '装备后矿物与地面战利品磁力吸附范围扩大 +180px',
    accentHex: '#FFD166',
    cost: { scrap_alloy: 3, quantum_core: 2 },
    kind: { type: 'accessory', accessoryId: 'treasure_magnet' },
  },
  {
    id: 'craft-celestial-cuff',
    category: 'gear',
    name: '星辰脉冲护腕（饰品）',
    description: '装备后武器射速 +15%，击败/命中 Boss 与据点敌人概率汲取 +2 生命',
    accentHex: '#FF2E88',
    cost: { frost_ore: 3, boss_soul: 2 },
    kind: { type: 'accessory', accessoryId: 'celestial_cuff' },
  },
  {
    id: 'craft-ironskin',
    category: 'gear',
    name: '铁皮合剂（45秒增益）',
    description: '合成并自动储备 1 瓶：激活后 45 秒内额外获得 +18% 伤害减免',
    accentHex: '#FBBF24',
    cost: { scrap_alloy: 2, frost_ore: 1 },
    kind: { type: 'potion', potionId: 'ironskin' },
  },
  {
    id: 'craft-mining-potion',
    category: 'gear',
    name: '狂热探矿合剂（45秒增益）',
    description: '合成并自动储备 1 瓶：激活后 45 秒内挖矿双倍产出且移速 +15%',
    accentHex: '#34D399',
    cost: { neon_crystal: 2, abyss_pearl: 1 },
    kind: { type: 'potion', potionId: 'mining' },
  },
  {
    id: 'craft-recall-potion',
    category: 'gear',
    name: '空间折跃药剂（即时）',
    description: '立即传送回霓虹广场/私人安全屋，同时强制降低 1 星通缉等级',
    accentHex: '#38BDF8',
    cost: { neon_crystal: 1, abyss_pearl: 1 },
    kind: { type: 'potion', potionId: 'recall' },
  },

  // World Boss Summons
  {
    id: 'summon-watcher-eye',
    category: 'boss',
    name: '召唤物：克苏鲁光学之眼 MK-V',
    description: '召唤赛博悬空 Boss（2,400 HP），半血后狂暴冲刺！掉落机魂核心与 $900',
    accentHex: '#FF2E88',
    cost: { neon_crystal: 4, quantum_core: 2 },
    kind: { type: 'boss', bossId: 'watcher_eye' },
  },
  {
    id: 'summon-frost-skeletron',
    category: 'boss',
    name: '召唤物：寒霜机械骷髅王',
    description: '召唤双联重炮机械领主（3,600 HP），释放寒冰扩散弹幕！掉落机魂核心与 $1,400',
    accentHex: '#7DD3FC',
    cost: { frost_ore: 4, scrap_alloy: 4, neon_crystal: 2 },
    kind: { type: 'boss', bossId: 'frost_skeletron' },
  },
  {
    id: 'summon-obsidian-destroyer',
    category: 'boss',
    name: '召唤物：黑曜毁灭者',
    description: '召唤终极深渊巨像（5,200 HP），狂暴期释放三向熔岩弹幕！掉落大量机魂与 $2,200',
    accentHex: '#F97316',
    cost: { obsidian_shard: 5, quantum_core: 3, boss_soul: 2 },
    kind: { type: 'boss', bossId: 'obsidian_destroyer' },
  },
];

export interface TerrariaAccessoryMeta {
  id: TerrariaAccessoryId;
  name: string;
  bonusText: string;
  accentHex: string;
}

export const TERRARIA_ACCESSORY_META: Record<TerrariaAccessoryId, TerrariaAccessoryMeta> = {
  hermes_boots: {
    id: 'hermes_boots',
    name: '赫尔墨斯推进靴',
    bonusText: '移速 +22%',
    accentHex: '#00F5FF',
  },
  obsidian_shield: {
    id: 'obsidian_shield',
    name: '黑曜石战术盾',
    bonusText: '减伤 +14%',
    accentHex: '#A855F7',
  },
  treasure_magnet: {
    id: 'treasure_magnet',
    name: '赛博寻宝磁铁',
    bonusText: '吸矿 +180px',
    accentHex: '#FFD166',
  },
  celestial_cuff: {
    id: 'celestial_cuff',
    name: '星辰脉冲护腕',
    bonusText: '射速 +15% · 吸血',
    accentHex: '#FF2E88',
  },
};

export interface WorldBossSpec {
  id: TerrariaBossId;
  name: string;
  subtitle: string;
  maxHp: number;
  radius: number;
  speed: number;
  contactDamage: number;
  projectileDamage: number;
  colorNum: number;
  colorHex: string;
  rewardCash: number;
  rewardExp: number;
  bossSoulsDrop: number;
}

export const WORLD_BOSS_SPECS: Record<TerrariaBossId, WorldBossSpec> = {
  watcher_eye: {
    id: 'watcher_eye',
    name: '克苏鲁光学之眼 MK-V',
    subtitle: '一期悬浮追踪射击 · 半血二阶段进入高速连环突袭',
    maxHp: 2400,
    radius: 30,
    speed: 145,
    contactDamage: 16,
    projectileDamage: 12,
    colorNum: 0xff2e88,
    colorHex: '#FF2E88',
    rewardCash: 900,
    rewardExp: 320,
    bossSoulsDrop: 3,
  },
  frost_skeletron: {
    id: 'frost_skeletron',
    name: '寒霜机械骷髅王',
    subtitle: '高压寒冰连发加农炮 · 二阶段释放 8 向霜冻新星',
    maxHp: 3600,
    radius: 34,
    speed: 132,
    contactDamage: 20,
    projectileDamage: 15,
    colorNum: 0x7dd3fc,
    colorHex: '#7DD3FC',
    rewardCash: 1400,
    rewardExp: 480,
    bossSoulsDrop: 4,
  },
  obsidian_destroyer: {
    id: 'obsidian_destroyer',
    name: '黑曜毁灭者',
    subtitle: '终极熔岩重装兵器 · 二阶段三向狂暴榴弹与突进撞击',
    maxHp: 5200,
    radius: 38,
    speed: 128,
    contactDamage: 24,
    projectileDamage: 18,
    colorNum: 0xf97316,
    colorHex: '#F97316',
    rewardCash: 2200,
    rewardExp: 720,
    bossSoulsDrop: 6,
  },
};

export const TERRARIA_LIMITS = {
  MAX_CAMPFIRES: 4,
  MAX_BARRICADES: 10,
  MAX_TURRETS: 4,
  MAX_PYLONS: 2,
  MAX_EQUIPPED_ACCESSORIES: 3,
  CAMPFIRE_HEAL_RADIUS: 165,
  CAMPFIRE_HEAL_PER_SEC: 8,
  TURRET_RANGE: 320,
  TURRET_COOLDOWN_SEC: 0.42,
  TURRET_DAMAGE: 26,
  BARRICADE_HP: 260,
  ORE_RESPAWN_SEC: 30,
};
