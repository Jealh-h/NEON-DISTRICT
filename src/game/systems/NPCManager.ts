import Phaser from 'phaser';
import { NPC_CONFIG, PLAYER_CONFIG } from '../config/BalanceConfig';
import { NPC, NpcProfile } from '../entities/NPC';
import { Player } from '../entities/Player';
import { NearbyNpcInfo } from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { AudioManager } from './AudioManager';

const NEON_PLAZA_NPCS: NpcProfile[] = [
  {
    id: 'npc-plaza-1',
    name: '林零',
    role: '自由骇客',
    variant: 0,
    waypoints: [
      { x: 1184, y: 832 },
      { x: 1472, y: 832 },
      { x: 1472, y: 992 },
      { x: 1184, y: 992 },
    ],
    dialogues: [
      '枢纽行动处的加密信号最近一直在闪，估计马上就有大单子了。',
      '各区都有独立信号塔，按 E 黑入后就能解锁磁悬浮站和区域加密金库位置！',
    ],
  },
  {
    id: 'npc-plaza-2',
    name: '阿哲',
    role: '拉面常客',
    variant: 1,
    waypoints: [
      { x: 416, y: 620 },
      { x: 560, y: 620 },
      { x: 560, y: 780 },
      { x: 416, y: 780 },
    ],
    dialogues: [
      '狐狸拉面馆的合成豚骨汤全霓虹广场最好喝，夜班全靠它撑着。',
      '穿过斑马线时看清信号灯，街上的无人出租可不会让着你。',
    ],
  },
  {
    id: 'npc-plaza-3',
    name: '苏珊娜',
    role: '夜班速递员',
    variant: 2,
    waypoints: [
      { x: 1312, y: 800 },
      { x: 1600, y: 800 },
      { x: 1600, y: 1200 },
      { x: 1312, y: 1200 },
    ],
    dialogues: [
      '如今七大城区全部连通了，开超跑走中央大道能一口气冲到远东星港。',
      '要是懒得长途驾驶，走近磁悬浮地铁站自动解锁，就能随时跨区传送！',
    ],
  },
  {
    id: 'npc-north-1',
    name: '陈默',
    role: '字节便利店员',
    variant: 1,
    waypoints: [
      { x: 576, y: 622 },
      { x: 752, y: 622 },
      { x: 784, y: 500 },
      { x: 784, y: 622 },
    ],
    dialogues: [
      '欢迎光临字节便利店！全自动售货机就在门口，24小时不打烊。',
      '刚才有辆竞速车从霓虹北街飞驰过去，把门牌灯都震闪了。',
    ],
  },
  {
    id: 'npc-north-2',
    name: 'K-9',
    role: '集团安保顾问',
    variant: 2,
    waypoints: [
      { x: 1024, y: 452 },
      { x: 1320, y: 452 },
      { x: 1584, y: 452 },
      { x: 1320, y: 452 },
    ],
    dialogues: [
      'NCPD 警署部署了高速拦截车与重装机甲，通缉 3 星以上会正面迎头封堵。',
      '听说暗港、铬铁区和星港都有帮派武装占领的据点，敢去端掉的人寥寥无几。',
    ],
  },
  {
    id: 'npc-west-1',
    name: '米娅',
    role: '电玩玩家',
    variant: 0,
    waypoints: [
      { x: 352, y: 964 },
      { x: 760, y: 964 },
      { x: 760, y: 1060 },
      { x: 352, y: 964 },
    ],
    dialogues: [
      '街机俱乐部刚上了新机台，手感顺滑得跟在涡轮赛道漂移一样！',
      '飞跃跳台的最高滞空纪录现在全城都能实时播报，快去挑战看看！',
    ],
  },
  {
    id: 'npc-south-1',
    name: '老周',
    role: '超跑技师',
    variant: 1,
    waypoints: [
      { x: 576, y: 1120 },
      { x: 784, y: 1120 },
      { x: 784, y: 1248 },
      { x: 576, y: 1248 },
    ],
    dialogues: [
      '车撞凹了就开进霓虹车库、铬铁车坊或星港机库，喷漆也能瞬间摆脱通缉！',
      '星港跑道南端那几辆飞行器和涡轮超跑速度极快，过弯前记得轻点刹车。',
    ],
  },
  {
    id: 'npc-south-2',
    name: '夜莺',
    role: '电音DJ',
    variant: 0,
    waypoints: [
      { x: 1024, y: 1040 },
      { x: 1248, y: 1040 },
      { x: 1248, y: 1216 },
      { x: 1024, y: 1040 },
    ],
    dialogues: [
      '脉冲夜店的低音炮整晚都在震，点一杯霓虹特调就能进入狂暴节奏。',
      '全城隐藏着八座高加密金库，靠近时终端声纳会自己滴答作响！',
    ],
  },
  {
    id: 'npc-tech-1',
    name: '凯博士',
    role: '量子研究员',
    variant: 2,
    waypoints: [
      { x: 1856, y: 608 },
      { x: 2144, y: 608 },
      { x: 2432, y: 608 },
      { x: 2144, y: 608 },
    ],
    dialogues: [
      '量子科教区的超算中继塔能透视加密信道，黑客声望高了大有好处。',
      '看到路边游荡的数据芯片记得捡起来，集齐 14 枚芯片有巨额全城奖金！',
    ],
  },
  {
    id: 'npc-tech-2',
    name: '艾莉丝',
    role: '全息剧迷',
    variant: 0,
    waypoints: [
      { x: 2688, y: 1024 },
      { x: 2960, y: 1024 },
      { x: 2960, y: 1168 },
      { x: 2688, y: 1168 },
    ],
    dialogues: [
      '全息巨幕剧院今晚首映《熔岩轨道》，散场后我打算去温室那边的广场兜风。',
      '在地图上直接点击任意位置可以打自定义 GPS 航标，不用再靠盲猜找路！',
    ],
  },
  {
    id: 'npc-park-1',
    name: '白羽',
    role: '水岸垂钓者',
    variant: 1,
    waypoints: [
      { x: 1280, y: 1520 },
      { x: 1520, y: 1520 },
      { x: 1520, y: 1620 },
      { x: 1280, y: 1620 },
    ],
    dialogues: [
      '滨河公园横跨了整片翠水湾，六座跨河大桥把南北城区彻底连成一片。',
      '想甩开地面警车，把车往大桥或星港高速一拐准没错。',
    ],
  },
  {
    id: 'npc-park-2',
    name: '凌风',
    role: '竞技场解说',
    variant: 2,
    waypoints: [
      { x: 2672, y: 1652 },
      { x: 3008, y: 1652 },
      { x: 3168, y: 1552 },
      { x: 3008, y: 1652 },
    ],
    dialogues: [
      '十六赛段环城极速挑战已经贯通七大区，最高奖池就等街头车神来拿！',
      '滨河东侧过了桥就是铬铁工业区，那边的涡轮直道爽翻了。',
    ],
  },
  {
    id: 'npc-highlands-1',
    name: '山鹰',
    role: '雪岭勘测员',
    variant: 2,
    waypoints: [
      { x: 3552, y: 620 },
      { x: 3840, y: 620 },
      { x: 3968, y: 620 },
      { x: 3712, y: 620 },
    ],
    dialogues: [
      '苍穹山脉西侧冰封雪原，东边红岩峡谷，往南还能看见黑曜石活火山熔岩！',
      '红岩峡谷东端有荒漠沙盗据点，建议带够护甲再进去清剿。',
    ],
  },
  {
    id: 'npc-harbor-1',
    name: '老船长',
    role: '暗港线人',
    variant: 1,
    waypoints: [
      { x: 560, y: 2500 },
      { x: 784, y: 2500 },
      { x: 784, y: 2740 },
      { x: 560, y: 2740 },
    ],
    dialogues: [
      '穿过南部金沙滩木栈道能登上暗港灯塔岛，老走私贩的秘藏就在塔下。',
      '海蛇走私团把东边货场圈成了禁区，端掉他们整个码头都会感谢你！',
    ],
  },
  {
    id: 'npc-chrome-1',
    name: '阿铁',
    role: '涡轮改装迷',
    variant: 1,
    waypoints: [
      { x: 1856, y: 2432 },
      { x: 2400, y: 2432 },
      { x: 2400, y: 2688 },
      { x: 1856, y: 2432 },
    ],
    dialogues: [
      '南段 F1 赛道的电磁加速带和飞跃跳台能让你一口气飞出六十多米！',
      '重装战车整备库门口常停着坦克或装甲车，但小心铁腕义体帮的火力。',
    ],
  },
  {
    id: 'npc-skyport-1',
    name: '克莱尔',
    role: '星港领航员',
    variant: 0,
    waypoints: [
      { x: 3552, y: 1656 },
      { x: 4064, y: 1656 },
      { x: 4320, y: 1656 },
      { x: 3968, y: 1824 },
    ],
    dialogues: [
      '星港 960 米超长起降跑道与双停机坪全面开放，直升机和极速超跑随你挑！',
      '跑道最南头被黑翼安保雇佣兵封锁了，清场成功会有大笔赏金和机库荣誉。',
    ],
  },
];

export class NPCManager {
  private scene: Phaser.Scene;
  private collisionManager: CollisionManager;
  private audioManager: AudioManager;
  private npcs: NPC[] = [];
  private npcGroup!: Phaser.Physics.Arcade.Group;
  private lastNearbyId: string | null = null;
  private dangerScanTimer = 0;

  constructor(scene: Phaser.Scene, collisionManager: CollisionManager, audioManager: AudioManager) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.audioManager = audioManager;
  }

  public spawnInitialNpcs(player: Player): void {
    this.npcGroup = this.scene.physics.add.group();

    for (const profile of NEON_PLAZA_NPCS) {
      const npc = new NPC(this.scene, profile);
      this.npcs.push(npc);
      this.npcGroup.add(npc.sprite);
      this.collisionManager.registerPlayerCollider(npc.sprite);
    }

    this.scene.physics.add.collider(this.npcGroup, this.npcGroup);
    this.scene.physics.add.collider(player.sprite, this.npcGroup);
  }

  public registerVehicleColliders(
    vehicleSprites: Phaser.Physics.Arcade.Sprite[],
    onVehicleHitNpc?: (
      vehSprite: Phaser.Physics.Arcade.Sprite,
      npc: NPC,
      speed: number,
      res: { killed: boolean; cashDrop: number }
    ) => void
  ): void {
    if (!this.npcGroup) return;
    for (const vehSprite of vehicleSprites) {
      this.scene.physics.add.collider(vehSprite, this.npcGroup, (_veh, npcObj) => {
        const npc = this.npcs.find((n) => n.sprite === npcObj);
        const body = vehSprite.body as Phaser.Physics.Arcade.Body;
        if (!npc || !body) return;
        const speed = body.speed;
        if (speed > 95) {
          const dx = npc.sprite.x - vehSprite.x;
          const dy = npc.sprite.y - vehSprite.y;
          const dist = Math.hypot(dx, dy) || 1;
          const dmg = Math.round((speed - 60) * 0.35);
          const res = npc.takeHit(dmg, dx / dist, dy / dist, Math.min(340, speed));
          this.audioManager.playImpactHit(res.killed);
          this.triggerAreaPanic(npc.sprite.x, npc.sprite.y);
          onVehicleHitNpc?.(vehSprite, npc, speed, res);
        } else if (speed > 35) {
          npc.triggerPanic(vehSprite.x, vehSprite.y);
          this.audioManager.playBump(this.scene.time.now);
          onVehicleHitNpc?.(vehSprite, npc, speed, { killed: false, cashDrop: 0 });
        }
      });
    }
  }

  public triggerAreaPanic(dangerX: number, dangerY: number, radius: number = NPC_CONFIG.PANIC_TRIGGER_RADIUS): void {
    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(dangerX, dangerY, npc.sprite.x, npc.sprite.y);
      if (dist <= radius) {
        npc.triggerPanic(dangerX, dangerY);
      }
    }
  }

  public update(
    dtSeconds: number,
    fastVehicles: Array<{ x: number; y: number; speedPx: number; vx?: number; vy?: number }>,
    weatherSpeedMul = 1
  ): void {
    for (const npc of this.npcs) {
      npc.update(dtSeconds, weatherSpeedMul);
    }

    // Staggered lightweight proximity dodge & panic check against speeding approaching vehicles
    this.dangerScanTimer += dtSeconds;
    if (this.dangerScanTimer >= 0.18) {
      this.dangerScanTimer = 0;
      for (const v of fastVehicles) {
        if (v.speedPx < 135) continue;
        const hasVec = v.vx !== undefined && v.vy !== undefined;
        for (const npc of this.npcs) {
          if (npc.isIncapacitated()) continue;
          const dx = npc.sprite.x - v.x;
          const dy = npc.sprite.y - v.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 135 && hasVec) {
            const dot = dx * (v.vx ?? 0) + dy * (v.vy ?? 0);
            if (dot > 0) {
              npc.triggerDodge(v.x, v.y, v.vx ?? 0, v.vy ?? 0);
              continue;
            }
          }
          if (v.speedPx >= 185 && dist <= NPC_CONFIG.PANIC_TRIGGER_RADIUS) {
            npc.triggerPanic(v.x, v.y);
          }
        }
      }
    }
  }

  public getNpcs(): NPC[] {
    return this.npcs;
  }

  public checkNearbyNpcChange(x: number, y: number): { changed: boolean; npc: NearbyNpcInfo | null } {
    let closest: NPC | null = null;
    let bestDist: number = PLAYER_CONFIG.INTERACT_RADIUS;

    for (const npc of this.npcs) {
      if (npc.isIncapacitated()) continue;
      const dist = Phaser.Math.Distance.Between(x, y, npc.sprite.x, npc.sprite.y);
      if (dist <= bestDist) {
        bestDist = dist;
        closest = npc;
      }
    }

    const nextId = closest?.id ?? null;
    const changed = nextId !== this.lastNearbyId;
    this.lastNearbyId = nextId;

    return {
      changed,
      npc: closest ? { id: closest.id, name: closest.name, role: closest.role } : null,
    };
  }

  public interactNearest(
    x: number,
    y: number,
    worldContext?: { weather?: string; wantedLevel?: number; syncedTowers?: number }
  ): string | null {
    let closest: NPC | null = null;
    let bestDist: number = PLAYER_CONFIG.INTERACT_RADIUS;

    for (const npc of this.npcs) {
      if (npc.isIncapacitated()) continue;
      const dist = Phaser.Math.Distance.Between(x, y, npc.sprite.x, npc.sprite.y);
      if (dist <= bestDist) {
        bestDist = dist;
        closest = npc;
      }
    }

    if (!closest) return null;
    this.audioManager.playInteract();
    return closest.interact(x, y, worldContext);
  }

  public freezeAll(): void {
    for (const npc of this.npcs) {
      npc.freeze();
    }
  }

  public destroy(): void {
    for (const npc of this.npcs) {
      npc.destroy();
    }
    this.npcs = [];
  }
}
