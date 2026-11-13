import Phaser from 'phaser';
import { WORLD_CONFIG } from '../config/BalanceConfig';
import { BuildingDef, CityRect, MountainDef, PropDef } from './DistrictManager';

export class CollisionManager {
  private scene: Phaser.Scene;
  private staticGroup: Phaser.Physics.Arcade.StaticGroup;
  private obstacleRects: CityRect[] = [];
  private buildingRects: CityRect[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.staticGroup = scene.physics.add.staticGroup();
  }

  public addBuildingColliders(buildings: BuildingDef[]): void {
    for (const b of buildings) {
      const zone = this.scene.add.zone(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h);
      this.scene.physics.add.existing(zone, true);
      this.staticGroup.add(zone);
      const rect = { x: b.x, y: b.y, w: b.w, h: b.h };
      this.obstacleRects.push(rect);
      this.buildingRects.push(rect);
    }
  }

  public addWaterColliders(waterAreas: CityRect[]): void {
    for (const w of waterAreas) {
      const zone = this.scene.add.zone(w.x + w.w / 2, w.y + w.h / 2, w.w, w.h);
      this.scene.physics.add.existing(zone, true);
      this.staticGroup.add(zone);
      this.obstacleRects.push({ x: w.x, y: w.y, w: w.w, h: w.h });
    }
  }

  public addMountainColliders(mountains: MountainDef[]): void {
    for (const m of mountains) {
      const zone = this.scene.add.zone(m.x + m.w / 2, m.y + m.h / 2, m.w, m.h);
      this.scene.physics.add.existing(zone, true);
      this.staticGroup.add(zone);
      const rect = { x: m.x, y: m.y, w: m.w, h: m.h };
      this.obstacleRects.push(rect);
      this.buildingRects.push(rect);
    }
  }

  public isPointBlockedByWall(x: number, y: number): boolean {
    if (x < 16 || x > WORLD_CONFIG.WIDTH - 16 || y < 16 || y > WORLD_CONFIG.HEIGHT - 16) {
      return true;
    }
    return this.isPointInsideBuilding(x, y, 0);
  }

  public addPropCollider(x: number, y: number, w: number, h: number): void {
    const zone = this.scene.add.zone(x, y, w, h);
    this.scene.physics.add.existing(zone, true);
    this.staticGroup.add(zone);
    this.obstacleRects.push({ x: x - w / 2, y: y - h / 2, w, h });
  }

  public addBoundaryColliders(worldWidth: number, worldHeight: number): void {
    const thickness = 16;
    const walls = [
      { x: worldWidth / 2, y: thickness / 2, w: worldWidth, h: thickness },
      { x: worldWidth / 2, y: worldHeight - thickness / 2, w: worldWidth, h: thickness },
      { x: thickness / 2, y: worldHeight / 2, w: thickness, h: worldHeight },
      { x: worldWidth - thickness / 2, y: worldHeight / 2, w: thickness, h: worldHeight },
    ];
    for (const wall of walls) {
      this.addPropCollider(wall.x, wall.y, wall.w, wall.h);
    }
  }

  public registerPlayerCollider(
    playerSprite: Phaser.Physics.Arcade.Sprite,
    onCollide?: () => void
  ): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.collider(playerSprite, this.staticGroup, () => {
      if (onCollide) onCollide();
    });
  }

  public registerVehicleWorldCollider(
    vehicleSprite: Phaser.Physics.Arcade.Sprite,
    onCollide?: () => void
  ): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.collider(vehicleSprite, this.staticGroup, () => {
      if (onCollide) onCollide();
    });
  }

  public isPointClearForEntity(x: number, y: number, radius = 12): boolean {
    if (
      x - radius < 20 ||
      x + radius > WORLD_CONFIG.WIDTH - 20 ||
      y - radius < 20 ||
      y + radius > WORLD_CONFIG.HEIGHT - 20
    ) {
      return false;
    }

    for (const r of this.obstacleRects) {
      if (
        x + radius > r.x &&
        x - radius < r.x + r.w &&
        y + radius > r.y &&
        y - radius < r.y + r.h
      ) {
        return false;
      }
    }
    return true;
  }

  public isPointInsideBuilding(x: number, y: number, padding = 6): boolean {
    for (const b of this.buildingRects) {
      if (
        x >= b.x - padding &&
        x <= b.x + b.w + padding &&
        y >= b.y - padding &&
        y <= b.y + b.h + padding
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Fast slab line-segment check against building footprints for police line-of-sight.
   */
  public hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;

    for (const b of this.buildingRects) {
      if (this.segmentIntersectsRect(x1, y1, dx, dy, b)) {
        return false;
      }
    }
    return true;
  }

  private segmentIntersectsRect(
    x1: number,
    y1: number,
    dx: number,
    dy: number,
    rect: CityRect
  ): boolean {
    let tMin = 0;
    let tMax = 1;

    if (Math.abs(dx) < 1e-6) {
      if (x1 < rect.x || x1 > rect.x + rect.w) return false;
    } else {
      const invDx = 1 / dx;
      let t1 = (rect.x - x1) * invDx;
      let t2 = (rect.x + rect.w - x1) * invDx;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }

    if (Math.abs(dy) < 1e-6) {
      if (y1 < rect.y || y1 > rect.y + rect.h) return false;
    } else {
      const invDy = 1 / dy;
      let t1 = (rect.y - y1) * invDy;
      let t2 = (rect.y + rect.h - y1) * invDy;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }

    return true;
  }

  public getPropHitboxSize(type: PropDef['type']): { w: number; h: number } {
    switch (type) {
      case 'lamp':
        return { w: 12, h: 12 };
      case 'vending':
        return { w: 22, h: 20 };
      case 'planter':
        return { w: 28, h: 28 };
      case 'bench':
        return { w: 28, h: 14 };
      case 'kiosk':
        return { w: 24, h: 24 };
      case 'bollard':
        return { w: 10, h: 10 };
      case 'cone':
        return { w: 10, h: 10 };
      case 'stool':
        return { w: 10, h: 10 };
      case 'trashbin':
        return { w: 14, h: 14 };
      case 'billboard':
        return { w: 46, h: 14 };
    }
  }

  public destroy(): void {
    this.staticGroup.clear(true, true);
    this.obstacleRects = [];
    this.buildingRects = [];
  }
}
