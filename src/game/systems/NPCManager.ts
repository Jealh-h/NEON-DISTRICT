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
      { x: 608, y: 590 },
      { x: 760, y: 590 },
      { x: 860, y: 632 },
      { x: 640, y: 632 },
    ],
    dialogues: [
      '枢纽行动处的加密信号最近一直在闪，估计马上就有大单子了。',
      '广场中央的信号塔能截获全区频段，不过小心别撞上巡逻车。',
    ],
  },
  {
    id: 'npc-plaza-2',
    name: '阿哲',
    role: '拉面常客',
    variant: 1,
    waypoints: [
      { x: 520, y: 656 },
      { x: 630, y: 656 },
      { x: 660, y: 740 },
      { x: 520, y: 740 },
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
      { x: 768, y: 408 },
      { x: 832, y: 408 },
      { x: 832, y: 580 },
      { x: 768, y: 580 },
    ],
    dialogues: [
      '东边泊车区停了几辆状态不错的车，开上街头竞速车比走路快多了。',
      '听说铬铁镇和暗港区那边最近封锁得很严，目前只能在这片逛。',
    ],
  },
  {
    id: 'npc-north-1',
    name: '陈默',
    role: '字节便利店员',
    variant: 1,
    waypoints: [
      { x: 120, y: 218 },
      { x: 256, y: 218 },
      { x: 256, y: 120 },
      { x: 256, y: 218 },
    ],
    dialogues: [
      '欢迎光临字节便利店！全自动售货机就在门口，24小时不打烊。',
      '刚才有辆竞速车从赛博大道飞驰过去，把门牌灯都震闪了。',
    ],
  },
  {
    id: 'npc-north-2',
    name: 'K-9',
    role: '集团安保顾问',
    variant: 2,
    waypoints: [
      { x: 460, y: 224 },
      { x: 780, y: 224 },
      { x: 1120, y: 224 },
      { x: 780, y: 224 },
    ],
    dialogues: [
      '赛博集团北侧大道车流密集，请勿在人行道上飙车。',
      '特区巡逻警车就停在西侧路口附近，尽量别惹麻烦。',
    ],
  },
  {
    id: 'npc-west-1',
    name: '米娅',
    role: '电玩玩家',
    variant: 0,
    waypoints: [
      { x: 252, y: 460 },
      { x: 252, y: 620 },
      { x: 120, y: 608 },
      { x: 252, y: 608 },
    ],
    dialogues: [
      '街机俱乐部刚上了新机台，手感顺滑得跟真车漂移一样！',
      '义体诊所就在南边巷子对面，真出了事故可以去那儿看看。',
    ],
  },
  {
    id: 'npc-south-1',
    name: '老周',
    role: '修车技师',
    variant: 1,
    waypoints: [
      { x: 1336, y: 984 },
      { x: 1520, y: 984 },
      { x: 1520, y: 1136 },
      { x: 1336, y: 984 },
    ],
    dialogues: [
      '车撞凹了？广场车库马上就要开通改装和维修服务了。',
      '街头竞速车起步猛、抓地滑，过弯前记得轻点刹车。',
    ],
  },
  {
    id: 'npc-south-2',
    name: '夜莺',
    role: '电音DJ',
    variant: 0,
    waypoints: [
      { x: 840, y: 984 },
      { x: 1140, y: 984 },
      { x: 1140, y: 804 },
      { x: 840, y: 804 },
    ],
    dialogues: [
      '脉冲夜店的低音炮整晚都在震，顺着合成波街就能找到入口。',
      '这城市越到深夜越热闹，霓虹灯一亮就没人想回家。',
    ],
  },
  {
    id: 'npc-east-1',
    name: '陆远',
    role: '地铁通勤客',
    variant: 2,
    waypoints: [
      { x: 452, y: 984 },
      { x: 760, y: 984 },
      { x: 760, y: 790 },
      { x: 452, y: 984 },
    ],
    dialogues: [
      '地铁枢纽刚到一班夜车，站台外面全是被霓虹映亮的积水。',
      '走大道过街记得看红绿灯，十秒一轮换。',
    ],
  },
  {
    id: 'npc-east-2',
    name: '小岚',
    role: '街头摄影师',
    variant: 0,
    waypoints: [
      { x: 960, y: 590 },
      { x: 1148, y: 590 },
      { x: 1148, y: 420 },
      { x: 960, y: 590 },
    ],
    dialogues: [
      '霓虹广场的全息灯牌配湿漉漉的柏油路，随手一拍都是大片。',
      '东侧泊车场那边灯光不错，不过车进车出的时候挺吵的。',
    ],
  },
  {
    id: 'npc-park-1',
    name: '白羽',
    role: '水岸垂钓者',
    variant: 1,
    waypoints: [
      { x: 760, y: 1272 },
      { x: 800, y: 1360 },
      { x: 840, y: 1272 },
      { x: 800, y: 1440 },
    ],
    dialogues: [
      '滨河公园的木栈道夜里可安静了，水面还能映出广场的霓虹光。',
      '如果想去东边山上，顺着跨河大桥一直往东开就能上盘山路。',
    ],
  },
  {
    id: 'npc-mountain-1',
    name: '山鹰',
    role: '山地勘测员',
    variant: 2,
    waypoints: [
      { x: 2210, y: 500 },
      { x: 2248, y: 560 },
      { x: 2210, y: 610 },
      { x: 2190, y: 540 },
    ],
    dialogues: [
      '苍穹山顶海拔 480 米，整片霓虹特区和运河两岸尽收眼底！',
      '山体岩壁极度陡峭，千万别把车开出盘山公路的护栏。',
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
    onVehicleHitNpc?: (vehSprite: Phaser.Physics.Arcade.Sprite, npc: NPC, speed: number) => void
  ): void {
    for (const vehSprite of vehicleSprites) {
      this.scene.physics.add.collider(vehSprite, this.npcGroup, (_veh, npcObj) => {
        const npc = this.npcs.find((n) => n.sprite === npcObj);
        const body = vehSprite.body as Phaser.Physics.Arcade.Body;
        if (npc && body && body.speed > 35) {
          npc.triggerPanic(vehSprite.x, vehSprite.y);
          this.audioManager.playBump(this.scene.time.now);
          onVehicleHitNpc?.(vehSprite, npc, body.speed);
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
    fastVehicles: Array<{ x: number; y: number; speedPx: number }>
  ): void {
    for (const npc of this.npcs) {
      npc.update(dtSeconds);
    }

    // Staggered lightweight proximity panic check against speeding vehicles
    this.dangerScanTimer += dtSeconds;
    if (this.dangerScanTimer >= 0.22) {
      this.dangerScanTimer = 0;
      for (const v of fastVehicles) {
        if (v.speedPx >= 175) {
          this.triggerAreaPanic(v.x, v.y, NPC_CONFIG.PANIC_TRIGGER_RADIUS);
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

  public interactNearest(x: number, y: number): string | null {
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
    return closest.interact(x, y);
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
