import Phaser from 'phaser';
import { PALETTE, WORLD_CONFIG } from '../config/BalanceConfig';
import { CollisionManager } from './CollisionManager';
import { BuildingDef, DistrictData, MountainDef, PropDef, TrafficSignalDef } from './DistrictManager';

interface NeonPulseTarget {
  bar: Phaser.GameObjects.Rectangle;
  glow: Phaser.GameObjects.Image;
  signLabel: Phaser.GameObjects.Text;
  baseAlpha: number;
  speed: number;
  phase: number;
  flickerSeed: number;
}

interface TrafficLightVisual {
  dot: Phaser.GameObjects.Rectangle;
  glow: Phaser.GameObjects.Image;
  axis: 'ns' | 'ew';
}

interface RoofOcclusionTarget {
  container: Phaser.GameObjects.Container;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  curAlpha: number;
}

function groundDepth(y: number): number {
  return 19 + Math.min(8.4, Math.max(0, y) * 0.0022);
}

export class WorldManager {
  private scene: Phaser.Scene;
  private tilemap: Phaser.Tilemaps.Tilemap | null = null;
  private pulseTargets: NeonPulseTarget[] = [];
  private landmarkRings: Phaser.GameObjects.Arc[] = [];
  private acFans: Phaser.GameObjects.Image[] = [];
  private radarDishes: Phaser.GameObjects.Image[] = [];
  private bobbingBoats: Array<{ sprite: Phaser.GameObjects.Image; baseY: number; phase: number }> = [];
  private trafficLights: TrafficLightVisual[] = [];
  private steamEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private riverRipples: Array<{ rect: Phaser.GameObjects.Rectangle; baseY: number; phase: number }> = [];
  private turboChevrons: Array<{ rect: Phaser.GameObjects.Rectangle; baseColor: number; phase: number }> = [];
  private rotatingBeams: Phaser.GameObjects.Image[] = [];
  private policeBeacons: Array<{ red: Phaser.GameObjects.Rectangle; blue: Phaser.GameObjects.Rectangle }> = [];
  private holoTowers: Array<{ sprite: Phaser.GameObjects.Image; ring: Phaser.GameObjects.Arc; phase: number }> = [];
  private ferrisWheels: Phaser.GameObjects.Image[] = [];
  private roofOccluders: RoofOcclusionTarget[] = [];
  private ambientDust: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private playerGlow: Phaser.GameObjects.Image | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public buildDistrict(district: DistrictData, collisionManager: CollisionManager): void {
    // 1. Render Tiled Tilemap (GPU-batched + automatic camera frustum culling)
    this.buildTiledLayers();

    // 2. Decorative Central Plaza Holographic Mandala, Bridge Towers, Waterfall Cliffs & Road Markings
    const overlayG = this.scene.add.graphics();
    overlayG.setDepth(3);

    // Central Neon Plaza Holographic Mandala (matching cyber hub aesthetic)
    const { x: px, y: py } = district.plazaCenter;
    overlayG.fillStyle(0x7c3aed, 0.14);
    overlayG.fillCircle(px, py, 62);
    overlayG.lineStyle(2, PALETTE.NEON_CYAN, 0.72);
    overlayG.strokeCircle(px, py, 28);
    overlayG.lineStyle(2, PALETTE.NEON_PINK, 0.65);
    overlayG.strokeCircle(px, py, 44);
    overlayG.lineStyle(2, PALETTE.NEON_PURPLE, 0.62);
    overlayG.strokeCircle(px, py, 60);
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = Phaser.Math.DegToRad(deg);
      overlayG.lineStyle(1, deg % 90 === 0 ? PALETTE.NEON_CYAN : PALETTE.NEON_PINK, 0.52);
      overlayG.lineBetween(
        px + Math.cos(rad) * 28,
        py + Math.sin(rad) * 28,
        px + Math.cos(rad) * 60,
        py + Math.sin(rad) * 60
      );
    }

    overlayG.lineStyle(1, PALETTE.NEON_PURPLE, 0.55);
    overlayG.strokeRect(16, 16, WORLD_CONFIG.WIDTH - 32, WORLD_CONFIG.HEIGHT - 32);

    this.addExitMarker(district.exitMarkers.east.x, district.exitMarkers.east.y - 76, district.exitMarkers.east.label, PALETTE.NEON_CYAN_HEX);
    this.addExitMarker(district.exitMarkers.south.x, district.exitMarkers.south.y - 76, district.exitMarkers.south.label, PALETTE.NEON_PINK_HEX);
    this.addExitMarker(district.exitMarkers.farEast.x, district.exitMarkers.farEast.y - 76, district.exitMarkers.farEast.label, PALETTE.GOLD_HEX);

    // Skyport illuminated runway strobe markers
    for (const rw of district.runways) {
      overlayG.lineStyle(2, PALETTE.NEON_CYAN, 0.7);
      overlayG.strokeRect(rw.x + 2, rw.y + 2, rw.w - 4, rw.h - 4);
      for (let rx = rw.x + 48; rx < rw.x + rw.w - 40; rx += 96) {
        overlayG.fillStyle(PALETTE.GOLD, 0.85);
        overlayG.fillRect(rx, rw.y + 8, 8, 4);
        overlayG.fillRect(rx, rw.y + rw.h - 12, 8, 4);
      }
      this.addExitMarker(rw.x + rw.w / 2, rw.y + 28, '★ 星港超长起降主跑道 · 24R ★', PALETTE.NEON_CYAN_HEX);
    }

    // Pixel Suspension Bridge Towers & Glowing Parabolic Cables (placed cleanly on bridge edges)
    const bridgeG = this.scene.add.graphics();
    bridgeG.setDepth(14);
    for (const br of district.bridges) {
      const accent = br.w >= 120 ? PALETTE.NEON_CYAN : PALETTE.NEON_PINK;
      overlayG.lineStyle(2, accent, 0.8);
      overlayG.lineBetween(br.x, br.y + 2, br.x + br.w, br.y + 2);
      overlayG.lineBetween(br.x, br.y + br.h - 2, br.x + br.w, br.y + br.h - 2);

      if (br.w > 150) {
        // Twin steel suspension towers along north & south bridge rails
        const tLeft = br.x + 42;
        const tRight = br.x + br.w - 42;
        const tMid = br.x + br.w / 2;
        for (const edgeY of [br.y - 6, br.y + br.h - 4]) {
          // Horizontal neon suspension span beam with bold comic ink contour
          bridgeG.fillStyle(0x05070e, 1);
          bridgeG.fillRect(br.x + 10, edgeY - 2, br.w - 20, 14);
          bridgeG.fillStyle(0x1e293b, 1);
          bridgeG.fillRect(br.x + 12, edgeY, br.w - 24, 10);
          bridgeG.lineStyle(1.5, accent, 0.92);
          bridgeG.strokeRect(br.x + 12, edgeY, br.w - 24, 10);

          // Twin pixel suspension pylons with #05070E comic ink outline & cel bevel
          for (const tx of [tLeft, tRight]) {
            bridgeG.fillStyle(0x05070e, 1);
            bridgeG.fillRect(tx - 10, edgeY - 14, 20, 26);
            bridgeG.fillStyle(0x475569, 1);
            bridgeG.fillRect(tx - 7, edgeY - 11, 14, 20);
            bridgeG.fillStyle(0x94a3b8, 1);
            bridgeG.fillRect(tx - 5, edgeY - 9, 6, 6);
            bridgeG.fillStyle(accent, 1);
            bridgeG.fillRect(tx - 2, edgeY - 13, 4, 3);
            bridgeG.fillStyle(PALETTE.GOLD, 1);
            bridgeG.fillRect(tx - 2, edgeY + 2, 4, 3);
          }

          // Sweeping suspension cables with comic ink shadow backing
          bridgeG.lineStyle(4, 0x05070e, 0.9);
          bridgeG.lineBetween(br.x + 12, edgeY + 4, tLeft, edgeY - 10);
          bridgeG.lineBetween(tLeft, edgeY - 10, tMid, edgeY + 3);
          bridgeG.lineBetween(tMid, edgeY + 3, tRight, edgeY - 10);
          bridgeG.lineBetween(tRight, edgeY - 10, br.x + br.w - 12, edgeY + 4);

          bridgeG.lineStyle(2, PALETTE.GOLD, 0.92);
          bridgeG.lineBetween(br.x + 12, edgeY + 4, tLeft, edgeY - 10);
          bridgeG.lineBetween(tLeft, edgeY - 10, tMid, edgeY + 3);
          bridgeG.lineBetween(tMid, edgeY + 3, tRight, edgeY - 10);
          bridgeG.lineBetween(tRight, edgeY - 10, br.x + br.w - 12, edgeY + 4);
        }
      }
    }

    // Waterfall Rocky Cliff Ledges & Foam Splash Rings
    const wfG = this.scene.add.graphics();
    wfG.setDepth(8);
    for (const wf of district.waterfalls) {
      // Dark rocky cliff lip above the cascade
      wfG.fillStyle(0x1e293b, 1);
      wfG.fillRect(wf.x - 10, wf.y - 8, wf.w + 20, 14);
      wfG.fillStyle(0x475569, 1);
      wfG.fillRect(wf.x - 6, wf.y - 6, wf.w + 12, 6);
      wfG.fillStyle(0x94a3b8, 0.85);
      wfG.fillRect(wf.x - 4, wf.y - 6, wf.w + 8, 2);
      // Churning splash foam pool at base
      wfG.fillStyle(0xe0f2fe, 0.65);
      wfG.fillEllipse(wf.x + wf.w / 2, wf.y + wf.h, wf.w + 14, 14);
      wfG.lineStyle(2, 0x38bdf8, 0.8);
      wfG.strokeEllipse(wf.x + wf.w / 2, wf.y + wf.h, wf.w + 22, 18);
    }

    this.spawnRiverRipples(district);

    // Turbo boost strips (animated glowing edge pulses)
    for (let i = 0; i < district.turboStrips.length; i++) {
      const ts = district.turboStrips[i];
      overlayG.lineStyle(2, PALETTE.NEON_CYAN, 0.85);
      overlayG.strokeRect(ts.x + 2, ts.y + 2, ts.w - 4, ts.h - 4);
      const pulse = this.scene.add.rectangle(
        ts.x + ts.w / 2,
        ts.y + ts.h / 2,
        ts.w - 10,
        ts.h - 10,
        PALETTE.NEON_CYAN,
        0.18
      );
      pulse.setDepth(4);
      this.turboChevrons.push({ rect: pulse, baseColor: PALETTE.NEON_CYAN, phase: i * 0.7 });
    }

    // Stunt jump ramps (high-contrast pink/gold indicators)
    for (const ramp of district.stuntRamps) {
      overlayG.lineStyle(2, PALETTE.NEON_PINK, 0.9);
      overlayG.strokeRect(ramp.x + 1, ramp.y + 1, ramp.w - 2, ramp.h - 2);
      const label = this.scene.add.text(ramp.x + ramp.w / 2, ramp.y - 10, '飞跃跳台 ▲', {
        fontFamily: '"JetBrains Mono", "Noto Sans SC", monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#FFD166',
        backgroundColor: '#080D18CC',
        padding: { x: 3, y: 1 },
      });
      label.setOrigin(0.5);
      label.setDepth(8);
    }

    // 3. Buildings & Stepped Highland Mountains
    for (const b of district.buildings) {
      this.drawBuilding(b);
    }
    for (const m of district.mountains) {
      this.drawMountain(m);
    }

    // 3b. Iconic Glowing Holographic Projection Towers & Waterfront Promenade / Ferris Wheel
    this.drawHoloTowers();
    this.drawWaterfrontPromenade(district);

    // 4. Street Props & Lighting Pools
    for (const prop of district.props) {
      this.drawProp(prop, collisionManager);
    }

    // 5. Cycling Intersection Traffic Signals
    for (const sig of district.trafficSignals) {
      this.drawTrafficSignal(sig, collisionManager);
    }

    // 6. Sidewalk Steam Vents & Waterfall Mist Emitters
    for (const vent of district.steamVents) {
      const emitter = this.scene.add.particles(vent.x, vent.y, 'fx_steam', {
        speedY: { min: -22, max: -10 },
        speedX: { min: -4, max: 6 },
        scale: { start: 0.9, end: 2.1 },
        alpha: { start: 0.34, end: 0 },
        lifespan: 1400,
        frequency: 260,
        quantity: 1,
        tint: [0x94a3b8, PALETTE.NEON_CYAN],
      });
      emitter.setDepth(16);
      this.steamEmitters.push(emitter);
    }

    for (const wf of district.waterfalls) {
      const mist = this.scene.add.particles(wf.x + wf.w / 2, wf.y + wf.h - 4, 'fx_steam', {
        x: { min: -wf.w * 0.42, max: wf.w * 0.42 },
        speedY: { min: 10, max: 32 },
        speedX: { min: -12, max: 12 },
        scale: { start: 1.0, end: 2.6 },
        alpha: { start: 0.42, end: 0 },
        lifespan: 950,
        frequency: 110,
        quantity: 2,
        tint: [0xe0f2fe, 0x38bdf8, 0xffffff],
      });
      mist.setDepth(17);
      this.steamEmitters.push(mist);
    }

    // 7. Landmark Interaction Pads
    for (const lm of district.landmarks) {
      const colorNum = Phaser.Display.Color.HexStringToColor(lm.accentColor).color;
      const pad = this.scene.add.circle(lm.x, lm.y, 18, colorNum, 0.16);
      pad.setDepth(5);
      const ring = this.scene.add.circle(lm.x, lm.y, 18);
      ring.setStrokeStyle(2, colorNum, 0.9);
      ring.setDepth(6);
      this.landmarkRings.push(ring);
    }

    // 8. Subtle Player Cyan Visor Glow + Ambient Neon Night Dust
    this.playerGlow = this.scene.add.image(WORLD_CONFIG.PLAYER_SPAWN.x, WORLD_CONFIG.PLAYER_SPAWN.y, 'fx_pixel_glow');
    this.playerGlow.setTint(PALETTE.NEON_CYAN);
    this.playerGlow.setAlpha(0.32);
    this.playerGlow.setScale(1.65);
    this.playerGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.playerGlow.setDepth(19);

    this.ambientDust = this.scene.add.particles(0, 0, 'pixel_spark', {
      x: { min: 32, max: WORLD_CONFIG.WIDTH - 32 },
      y: { min: 32, max: WORLD_CONFIG.HEIGHT - 32 },
      speedX: { min: -10, max: 12 },
      speedY: { min: 6, max: 18 },
      alpha: { start: 0.25, end: 0 },
      scale: { start: 0.8, end: 0.4 },
      lifespan: 2600,
      frequency: 110,
      quantity: 1,
      tint: [PALETTE.NEON_CYAN, PALETTE.NEON_PURPLE, PALETTE.NEON_PINK],
    });
    this.ambientDust.setDepth(26);

    // 9. Register Colliders (Buildings, Rivers/Lagoon, Mountains, World Perimeter)
    collisionManager.addBuildingColliders(district.buildings);
    collisionManager.addWaterColliders(district.waterColliders);
    collisionManager.addMountainColliders(district.mountains);
    collisionManager.addBoundaryColliders(WORLD_CONFIG.WIDTH, WORLD_CONFIG.HEIGHT);
  }

  private buildTiledLayers(): void {
    this.tilemap = this.scene.make.tilemap({ key: 'neon_plaza_map' });
    const tileset = this.tilemap.addTilesetImage('neon_tileset', 'neon_tileset', 32, 32, 0, 0);

    if (tileset) {
      const groundLayer = this.tilemap.createLayer('Ground', tileset, 0, 0);
      if (groundLayer) {
        groundLayer.setDepth(1);
        if (groundLayer instanceof Phaser.Tilemaps.TilemapLayer) {
          groundLayer.setCullPadding(2, 2);
        }
      }

      const detailLayer = this.tilemap.createLayer('Details', tileset, 0, 0);
      if (detailLayer) {
        detailLayer.setDepth(2);
        if (detailLayer instanceof Phaser.Tilemaps.TilemapLayer) {
          detailLayer.setCullPadding(2, 2);
        }
      }
    }
  }

  private drawBuilding(b: BuildingDef): void {
    // Layer 1: Ground shadow + structural base footprint (below ground actors at depth 9)
    const baseG = this.scene.add.graphics();
    baseG.setDepth(9);

    const extrudeH =
      b.roofStyle === 'stadium'
        ? 14
        : b.roofStyle === 'lighthouse'
          ? 18
          : b.roofStyle === 'container'
            ? 14
            : b.roofStyle === 'tech' || b.roofStyle === 'police'
              ? Math.min(60, Math.max(34, Math.round(b.h * 0.48)))
              : b.roofStyle === 'factory' || b.roofStyle === 'club' || b.roofStyle === 'arcade' || b.roofStyle === 'residential'
                ? Math.min(46, Math.max(26, Math.round(b.h * 0.39)))
                : Math.min(36, Math.max(22, Math.round(b.h * 0.32)));

    const eastBevel =
      b.roofStyle === 'stadium' || b.roofStyle === 'lighthouse'
        ? 0
        : b.roofStyle === 'container'
          ? 5
          : b.h >= 80
            ? 11
            : 8;

    // 1. Crisp 2.5D hard American comic-book drop shadow + Ben-Day stipple rim
    baseG.fillStyle(0x04060d, 0.86);
    baseG.fillRect(b.x + 10 + Math.round(eastBevel * 0.5), b.y + 10, b.w + eastBevel, b.h + 6);
    baseG.fillStyle(0x05070e, 0.52);
    for (let hx = b.x + 16; hx < b.x + b.w + eastBevel + 14; hx += 8) {
      baseG.fillCircle(hx, b.y + b.h + 18, 1.5);
    }

    // 1b. Wet-pavement specular neon & warm storefront reflection pools in front of building
    if (b.roofStyle !== 'stadium' && b.roofStyle !== 'lighthouse' && b.roofStyle !== 'container') {
      const neonPool = this.scene.add.image(b.x + b.w / 2, b.y + b.h + 28, 'fx_wet_reflect');
      neonPool.setTint(b.neonColor);
      neonPool.setAlpha(0.32);
      neonPool.setScale(Math.max(1.4, b.w / 72), 1.15);
      neonPool.setBlendMode(Phaser.BlendModes.ADD);
      neonPool.setDepth(4.5);

      const isWarmShop =
        b.roofStyle === 'store' ||
        b.roofStyle === 'diner' ||
        b.roofStyle === 'arcade' ||
        b.roofStyle === 'club' ||
        b.roofStyle === 'booth' ||
        b.roofStyle === 'residential';
      if (isWarmShop) {
        const warmPool = this.scene.add.image(b.x + b.w / 2, b.y + b.h + 10, 'fx_wet_reflect');
        warmPool.setTint(0xf59e0b);
        warmPool.setAlpha(0.34);
        warmPool.setScale(Math.max(1.1, b.w / 95), 0.75);
        warmPool.setBlendMode(Phaser.BlendModes.ADD);
        warmPool.setDepth(4.6);
      }
    }

    // Ground-level foundation pad so south-doorway actors stand cleanly in front of wall base
    baseG.fillStyle(0x05070e, 1);
    baseG.fillRect(b.x, b.y, b.w, b.h);
    baseG.fillStyle(0x111827, 1);
    baseG.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
    if (b.roofStyle !== 'stadium' && b.roofStyle !== 'lighthouse') {
      baseG.fillStyle(b.neonColor, 0.42);
      baseG.fillRect(b.x + 4, b.y + b.h - 3, b.w - 8, 2);
    }

    // Layer 2: Overhanging 2.5D Extruded Tower, East Bevel Wall & Roof Container (occludes & auto-fades!)
    const roofContainer = this.scene.add.container(b.x, b.y);
    roofContainer.setDepth(29 + Math.min(2.0, b.y * 0.0005));

    const rg = this.scene.add.graphics();
    roofContainer.add(rg);

    const baseWallColor = b.roofColor
      ? Phaser.Display.Color.ValueToColor(b.roofColor).darken(14).color
      : 0x16223d;
    const eastWallColor = b.roofColor
      ? Phaser.Display.Color.ValueToColor(b.roofColor).darken(42).color
      : 0x0c1324;
    const roofFill = b.roofColor ?? 0x1f2b48;

    let roofCenterY = (b.h - extrudeH) / 2;
    let signLocalY = b.h - 2;

    if (b.roofStyle === 'stadium') {
      const lcx = b.w / 2;
      const lcy = b.h / 2;
      const topCy = lcy - extrudeH;
      roofCenterY = topCy;
      signLocalY = b.h - 2;

      baseG.fillStyle(0x141d33, 1);
      baseG.fillEllipse(b.x + lcx, b.y + lcy, b.w, b.h);
      baseG.lineStyle(3, 0x05070e, 1);
      baseG.strokeEllipse(b.x + lcx, b.y + lcy, b.w, b.h);

      // Oblique extruded outer colosseum wall skirt with bold comic ink outline
      rg.fillStyle(0x0f172a, 1);
      rg.fillRect(4, topCy, b.w - 8, extrudeH + lcy * 0.35);
      rg.fillEllipse(lcx, lcy, b.w, b.h);
      rg.lineStyle(3, 0x05070e, 1);
      rg.strokeEllipse(lcx, lcy, b.w, b.h);

      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const ax = lcx + Math.cos(ang) * (b.w * 0.45);
        const ay = topCy + Math.sin(ang) * (b.h * 0.43) + 6;
        rg.fillStyle(i % 2 === 0 ? PALETTE.NEON_CYAN : PALETTE.NEON_PINK, 0.9);
        rg.fillRect(ax - 3, ay - 3, 6, 6);
      }
      // Elevated stadium crown rim & tiered bowl
      rg.fillStyle(0x1f2b47, 1);
      rg.fillEllipse(lcx, topCy, b.w, b.h);
      rg.lineStyle(4, 0x05070e, 1);
      rg.strokeEllipse(lcx, topCy, b.w, b.h);
      rg.lineStyle(2.5, b.neonColor, 0.95);
      rg.strokeEllipse(lcx, topCy, b.w - 5, b.h - 5);
      rg.fillStyle(0x2d3b5e, 1);
      rg.fillEllipse(lcx, topCy, b.w - 28, b.h - 24);
      rg.lineStyle(2, PALETTE.NEON_CYAN, 0.85);
      rg.strokeEllipse(lcx, topCy, b.w - 32, b.h - 28);
      rg.fillStyle(0x0f5132, 1);
      rg.fillEllipse(lcx, topCy, b.w - 64, b.h - 54);
      rg.lineStyle(2, 0x4ade80, 0.85);
      rg.strokeEllipse(lcx, topCy, b.w - 68, b.h - 58);
      rg.lineBetween(lcx, topCy - (b.h - 58) / 2, lcx, topCy + (b.h - 58) / 2);
      rg.strokeCircle(lcx, topCy, 14);
    } else if (b.roofStyle === 'lighthouse') {
      const lcx = b.w / 2;
      const lcy = b.h / 2;
      const topCy = lcy - extrudeH;
      roofCenterY = topCy - 18;
      signLocalY = b.h - 2;

      baseG.fillStyle(0x334155, 1);
      baseG.fillRect(b.x + 2, b.y + 4, b.w - 4, b.h - 6);
      baseG.lineStyle(3, 0x05070e, 1);
      baseG.strokeRect(b.x + 2, b.y + 4, b.w - 4, b.h - 6);

      // 2.5D vertical masonry shaft extruded upward with bold ink frame
      rg.fillStyle(0x05070e, 1);
      rg.fillRect(lcx - 18, topCy - 2, 36, extrudeH + 8);
      rg.fillStyle(0xcbd5e1, 1);
      rg.fillRect(lcx - 16, topCy, 32, extrudeH + 4);
      rg.fillStyle(0x94a3b8, 1);
      rg.fillRect(lcx + 2, topCy, 14, extrudeH + 4);
      rg.fillStyle(0xdc2626, 1);
      rg.fillRect(lcx - 15, topCy + 7, 30, 6);
      // Striped red & white lantern tower top
      rg.fillStyle(0x05070e, 1);
      rg.fillCircle(lcx, topCy, 22);
      rg.fillStyle(0xf8fafc, 1);
      rg.fillCircle(lcx, topCy, 19);
      rg.fillStyle(0xdc2626, 1);
      rg.fillCircle(lcx, topCy, 14);
      rg.fillStyle(0xf8fafc, 1);
      rg.fillCircle(lcx, topCy, 9);
      rg.fillStyle(0xfacc15, 1);
      rg.fillCircle(lcx, topCy, 5);
      rg.fillStyle(0xffffff, 1);
      rg.fillCircle(lcx, topCy, 2.5);

      const sweep = this.scene.add.image(b.x + lcx, b.y + topCy, 'fx_headlight');
      sweep.setOrigin(0, 0.5);
      sweep.setScale(2.6, 1.8);
      sweep.setTint(PALETTE.GOLD);
      sweep.setAlpha(0.55);
      sweep.setBlendMode(Phaser.BlendModes.ADD);
      sweep.setDepth(31.5);
      this.rotatingBeams.push(sweep);
    } else {
      const roofTop = -extrudeH;
      const roofDeckH = Math.max(22, b.h - 14);
      const roofBot = roofTop + roofDeckH;
      const facadeH = b.h - roofBot;
      roofCenterY = roofTop + roofDeckH / 2;
      signLocalY = b.h - 2;

      // 2.5D Oblique East Beveled Wall with bold comic ink border & diagonal crosshatching
      rg.fillStyle(0x05070e, 1);
      rg.fillPoints(
        [
          new Phaser.Math.Vector2(b.w, roofTop - 1),
          new Phaser.Math.Vector2(b.w + eastBevel + 2, roofTop + 6),
          new Phaser.Math.Vector2(b.w + eastBevel + 2, b.h + 1),
          new Phaser.Math.Vector2(b.w, b.h + 1),
        ],
        true
      );
      rg.fillStyle(eastWallColor, 1);
      rg.fillPoints(
        [
          new Phaser.Math.Vector2(b.w, roofTop + 2),
          new Phaser.Math.Vector2(b.w + eastBevel - 1, roofTop + 7),
          new Phaser.Math.Vector2(b.w + eastBevel - 1, b.h - 1),
          new Phaser.Math.Vector2(b.w, b.h - 1),
        ],
        true
      );
      // Comic ink diagonal crosshatching on shaded east wall
      rg.lineStyle(1, 0x05070e, 0.65);
      for (let hy = roofTop + 10; hy < b.h - 4; hy += 7) {
        rg.lineBetween(b.w + 1, hy, b.w + eastBevel - 2, hy + 5);
      }
      // Subtle east-wall side window slits
      for (let sy = roofTop + 14; sy < b.h - 10; sy += 11) {
        rg.fillStyle(0x38bdf8, 0.36);
        rg.fillRect(b.w + 2, sy, Math.max(2, eastBevel - 4), 4);
      }

      // 2.5D Bold #05070E Comic Ink Outline around front tower + roof
      rg.fillStyle(0x05070e, 1);
      rg.fillRect(-1, roofTop - 1, b.w + 2, b.h - roofTop + 2);
      rg.fillStyle(0x1e2942, 1);
      rg.fillRect(2, roofTop + 2, b.w - 4, b.h - roofTop - 4);

      // 2.5D Vertical South Facade (from roofBot down to street level b.h)
      rg.fillStyle(baseWallColor, 1);
      rg.fillRect(2, roofBot, b.w - 4, facadeH - 2);

      // Vertical corner neon trim pillars spanning full extruded height
      rg.fillStyle(b.neonColor, 0.9);
      rg.fillRect(2, roofTop + 4, 2, b.h - roofTop - 8);
      rg.fillRect(b.w - 4, roofTop + 4, 2, b.h - roofTop - 8);

      if (b.roofStyle === 'container') {
        rg.fillStyle(0x0f172a, 0.85);
        rg.fillRect(8, roofBot + 2, b.w - 16, Math.max(6, facadeH - 5));
        rg.fillStyle(0xcbd5e1, 0.85);
        rg.fillRect(Math.floor(b.w * 0.48), roofBot + 2, 2, Math.max(6, facadeH - 5));
        rg.fillRect(Math.floor(b.w * 0.52), roofBot + 2, 2, Math.max(6, facadeH - 5));
      } else {
        // Multi-story cyberpunk facade window matrix + warm golden-orange illuminated storefronts
        const winRows: number[] = [];
        for (let wy = roofBot + 4; wy < b.h - 11; wy += 8) {
          winRows.push(wy);
        }
        if (winRows.length === 0) {
          winRows.push(roofBot + 3);
        }
        const isCommercialGround =
          b.roofStyle === 'store' ||
          b.roofStyle === 'diner' ||
          b.roofStyle === 'arcade' ||
          b.roofStyle === 'club' ||
          b.roofStyle === 'booth' ||
          b.roofStyle === 'tech' ||
          b.roofStyle === 'residential';

        for (let ri = 0; ri < winRows.length; ri++) {
          const wy = winRows[ri];
          const isBottomRow = ri === winRows.length - 1;
          for (let wx = 10; wx < b.w - 16; wx += 14) {
            const isDoor = isBottomRow && Math.abs(wx - (b.w / 2 - 5)) < 14;
            if (isDoor) {
              // Warm golden-amber illuminated shopfront entrance with comic ink frame
              rg.fillStyle(0x05070e, 1);
              rg.fillRect(wx - 4, wy - 2, 18, Math.max(9, b.h - wy));
              rg.fillStyle(isCommercialGround ? 0xf59e0b : 0x38bdf8, 0.95);
              rg.fillRect(wx - 2, wy, 14, Math.max(5, b.h - 4 - wy));
              rg.fillStyle(0xfef08a, 0.98);
              rg.fillRect(wx, wy + 1, 10, Math.max(3, b.h - 6 - wy));
              // Illuminated entry steps & canopy trim
              rg.fillStyle(b.neonColor, 0.95);
              rg.fillRect(wx - 5, wy - 2, 20, 2);
              rg.fillStyle(0xfdba74, 0.88);
              rg.fillRect(wx - 3, b.h - 3, 16, 2);
            } else if (isBottomRow && isCommercialGround) {
              // Glowing warm golden shopfront display windows with crisp cel diagonal shine
              rg.fillStyle(0x05070e, 1);
              rg.fillRect(wx - 1, wy - 1, 11, 8);
              rg.fillStyle(0xf97316, 0.95);
              rg.fillRect(wx, wy, 9, 6);
              rg.fillStyle(0xfef08a, 0.88);
              rg.fillRect(wx + 1, wy + 1, 7, 3);
              rg.fillStyle(0xffffff, 0.72);
              rg.fillRect(wx + 1, wy + 1, 2, 2);
            } else {
              const winLit = ((wx + wy + b.x) / 7) % 3 !== 0;
              const winCol =
                b.roofStyle === 'factory'
                  ? 0xf59e0b
                  : wx % 28 === 0
                    ? PALETTE.NEON_PINK
                    : (wx + ri) % 21 === 0
                      ? 0xc000ff
                      : 0x38bdf8;
              rg.fillStyle(0x05070e, 1);
              rg.fillRect(wx - 1, wy - 1, 11, 7);
              rg.fillStyle(winLit ? winCol : 0x0b1020, winLit ? 0.92 : 0.96);
              rg.fillRect(wx, wy, 9, 5);
              if (winLit) {
                rg.fillStyle(0xffffff, 0.55);
                rg.fillRect(wx + 1, wy + 1, 3, 1);
              }
            }
          }
        }
      }

      // Elevated Rooftop Parapet Bevel & Inner Deck
      rg.fillStyle(0x475569, 1);
      rg.fillRect(3, roofTop + 2, b.w - 6, 4);
      rg.fillStyle(roofFill, 1);
      rg.fillRect(6, roofTop + 6, b.w - 12, Math.max(14, roofDeckH - 8));

      // Comic Cel-Highlight Specular Diagonal Slash across Rooftop Deck
      rg.fillStyle(0xffffff, 0.08);
      rg.fillTriangle(
        8,
        roofTop + 8,
        Math.min(b.w - 10, 42),
        roofTop + 8,
        8,
        Math.min(roofBot - 4, roofTop + 36)
      );

      // Sunlit south eave rim separating roof from vertical south facade (with ink divider)
      rg.fillStyle(0x05070e, 1);
      rg.fillRect(2, roofBot - 1, b.w - 4, 2);
      rg.fillStyle(0x64748b, 0.95);
      rg.fillRect(2, roofBot - 3, b.w - 4, 2);

      if (b.roofStyle === 'container') {
        rg.fillStyle(0x05070e, 0.42);
        for (let rx = 12; rx < b.w - 10; rx += 8) {
          rg.fillRect(rx, roofTop + 6, 3, Math.max(12, roofDeckH - 8));
        }
        rg.fillStyle(0xcbd5e1, 0.92);
        rg.fillRect(2, roofTop + 2, 5, 5);
        rg.fillRect(b.w - 7, roofTop + 2, 5, 5);
        rg.fillRect(2, roofBot - 5, 5, 5);
        rg.fillRect(b.w - 7, roofBot - 5, 5, 5);
      } else if (b.roofStyle === 'warehouse') {
        rg.lineStyle(1.5, 0x05070e, 0.85);
        for (let rx = 14; rx < b.w - 14; rx += 10) {
          rg.lineBetween(rx, roofTop + 8, rx, roofBot - 4);
        }
        rg.fillStyle(0x05070e, 1);
        rg.fillRect(21, roofTop + 11, 40, Math.min(24, roofDeckH - 14));
        rg.fillStyle(0x0f172a, 1);
        rg.fillRect(22, roofTop + 12, 38, Math.min(22, roofDeckH - 16));
        rg.fillStyle(PALETTE.GOLD, 0.85);
        rg.fillRect(25, roofTop + 15, 32, 4);
      } else if (b.roofStyle === 'factory') {
        rg.fillStyle(0x05070e, 1);
        rg.fillRect(15, roofTop + 9, 46, Math.min(28, roofDeckH - 12));
        rg.fillRect(b.w - 61, roofTop + 9, 46, Math.min(28, roofDeckH - 12));
        rg.fillStyle(0x181b24, 1);
        rg.fillRect(16, roofTop + 10, 44, Math.min(26, roofDeckH - 14));
        rg.fillRect(b.w - 60, roofTop + 10, 44, Math.min(26, roofDeckH - 14));
        rg.fillStyle(0xf97316, 0.9);
        rg.fillRect(22, roofTop + 16, 32, 8);
        rg.fillStyle(0x64748b, 1);
        rg.fillCircle(b.w - 38, roofTop + 22, 10);
        rg.lineStyle(2, 0x05070e, 1);
        rg.strokeCircle(b.w - 38, roofTop + 22, 10);
        rg.fillStyle(0x0f172a, 1);
        rg.fillCircle(b.w - 38, roofTop + 22, 5);
        rg.fillStyle(0x94a3b8, 0.95);
        rg.fillRect(64, roofTop + 16, Math.max(20, b.w - 128), 5);
        rg.fillRect(64, roofTop + 26, Math.max(20, b.w - 128), 4);
      } else if (b.roofStyle === 'tech') {
        const pW = Math.max(40, b.w - 34);
        const pH = Math.max(18, roofDeckH - 22);
        const px = (b.w - pW) / 2;
        const py = roofTop + 10;
        // Tiered 2.5D skyscraper penthouse crown with comic ink rim & cel shine
        rg.fillStyle(0x05070e, 1);
        rg.fillRect(px - 2, py - 6, pW + 4, pH + 4);
        rg.fillStyle(0x111a2e, 1);
        rg.fillRect(px, py - 4, pW, pH);
        rg.lineStyle(1.5, b.neonColor, 0.92);
        rg.strokeRect(px, py - 4, pW, pH);
        rg.fillStyle(b.neonColor, 0.38);
        rg.fillRect(px + 8, py + 2, pW - 16, 7);
        rg.fillStyle(b.neonColor, 0.95);
        rg.fillRect(px + 10, py + 4, pW - 20, 3);
        rg.fillStyle(0xffffff, 0.95);
        rg.fillCircle(b.w / 2, py + pH / 2 - 4, 5);
      } else if (b.roofStyle === 'club' || b.roofStyle === 'arcade') {
        const colors = [PALETTE.NEON_PINK, PALETTE.NEON_CYAN, PALETTE.NEON_PURPLE, PALETTE.GOLD];
        for (let i = 0; i < 6; i++) {
          const sx = 16 + i * Math.floor((b.w - 32) / 6);
          rg.fillStyle(0x05070e, 1);
          rg.fillRect(sx - 1, roofTop + 11, 16, 9);
          rg.fillRect(sx - 1, roofBot - 17, 16, 9);
          rg.fillStyle(colors[i % colors.length], 0.95);
          rg.fillRect(sx, roofTop + 12, 14, 7);
          rg.fillRect(sx, roofBot - 16, 14, 7);
        }
      } else if (b.roofStyle === 'store' || b.roofStyle === 'diner') {
        rg.fillStyle(0x05070e, 1);
        rg.fillRect(7, roofBot - 7, b.w - 14, 8);
        rg.fillStyle(b.neonColor, 0.95);
        rg.fillRect(8, roofBot - 6, b.w - 16, 6);
        rg.fillStyle(0xf8fafc, 0.85);
        for (let ax = 12; ax < b.w - 14; ax += 12) {
          rg.fillRect(ax, roofBot - 6, 5, 6);
        }
        rg.fillStyle(0x334155, 1);
        rg.fillRect(18, roofTop + 12, 24, 14);
        rg.lineStyle(1.5, 0x05070e, 1);
        rg.strokeRect(18, roofTop + 12, 24, 14);
      } else if (b.roofStyle === 'residential') {
        for (let rx = 18; rx < b.w - 22; rx += 28) {
          rg.fillStyle(PALETTE.NEON_PINK, 0.55);
          rg.fillRect(rx, roofTop + 12, 14, 9);
          rg.fillStyle(PALETTE.GOLD, 0.55);
          rg.fillRect(rx, roofBot - 18, 14, 9);
        }
      } else if (b.roofStyle === 'police') {
        rg.fillStyle(0x05070e, 1);
        rg.fillRect(11, roofTop + 9, b.w - 22, Math.max(20, roofDeckH - 16));
        rg.fillStyle(0x0f172a, 1);
        rg.fillRect(12, roofTop + 10, b.w - 24, Math.max(18, roofDeckH - 18));
        rg.lineStyle(2.5, 0x38bdf8, 0.92);
        rg.strokeCircle(b.w / 2, roofCenterY, 15);

        const redSiren = this.scene.add.rectangle(18, roofTop + 12, 14, 5, 0xef4444, 1);
        const blueSiren = this.scene.add.rectangle(b.w - 18, roofTop + 12, 14, 5, 0x38bdf8, 1);
        roofContainer.add([redSiren, blueSiren]);
        this.policeBeacons.push({ red: redSiren, blue: blueSiren });
      }

      // Crisp building comic ink outer stroke + inner neon perimeter outline
      rg.lineStyle(2.5, 0x05070e, 1);
      rg.strokeRect(0, roofTop, b.w, b.h - roofTop);
      rg.lineStyle(1.8, b.neonColor, 0.94);
      rg.strokeRect(2, roofTop + 2, b.w - 4, b.h - roofTop - 4);
      rg.lineStyle(1, b.neonColor, 0.6);
      rg.lineBetween(2, roofBot, b.w - 2, roofBot);
    }

    // Rotating pixel AC fan rotor on elevated rooftop
    if (b.hasFan) {
      const fan = this.scene.add.image(b.w - 26, -extrudeH + 22, 'prop_ac_fan');
      roofContainer.add(fan);
      this.acFans.push(fan);
    }

    // Building rooftop label on elevated roof (bold comic ink stroke)
    const roofTitle = this.scene.add.text(b.w / 2, roofCenterY, b.label, {
      fontFamily: '"Chakra Petch", "Noto Sans SC", monospace',
      fontSize: b.w <= 70 ? '9px' : '11px',
      fontStyle: 'bold',
      color: '#F8FAFC',
      stroke: '#05070E',
      strokeThickness: 4,
      align: 'center',
    });
    roofTitle.setOrigin(0.5);
    roofTitle.setResolution(2);
    roofContainer.add(roofTitle);

    // Animated South-Face Neon Sign + Additive Pixel Glow
    const signX = b.w / 2;
    const signW = Math.min(b.w - 16, 96);

    const glow = this.scene.add.image(signX, signLocalY + 4, 'fx_pixel_glow');
    glow.setTint(b.neonColor);
    glow.setAlpha(0.38);
    glow.setScale(signW / 32, 0.9);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    const signBar = this.scene.add.rectangle(signX, signLocalY, signW, 4, b.neonColor, 0.95);

    const signLabel = this.scene.add.text(signX, signLocalY - 12, b.signText, {
      fontFamily: '"JetBrains Mono", "Noto Sans SC", monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#05070E',
      strokeThickness: 3,
      backgroundColor: '#05070EE6',
      padding: { x: 4, y: 1 },
    });
    signLabel.setOrigin(0.5);
    signLabel.setResolution(2);
    roofContainer.add([glow, signBar, signLabel]);

    // Register overhanging 2.5D roof occlusion box (fades smoothly when player or ground vehicle passes behind)
    this.roofOccluders.push({
      container: roofContainer,
      x1: b.x - 10,
      y1: b.y - extrudeH - 10,
      x2: b.x + b.w + eastBevel + 8,
      y2: b.y + 12,
      curAlpha: 1,
    });

    this.pulseTargets.push({
      bar: signBar,
      glow,
      signLabel,
      baseAlpha: 0.92,
      speed: 2.0 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      flickerSeed: Math.random() * 100,
    });
  }

  private drawProp(prop: PropDef, collisionManager: CollisionManager): void {
    const texKey = `prop_${prop.type}`;
    const sprite = this.scene.add.image(prop.x, prop.y, texKey);
    const isBoat = prop.type === 'barge' || prop.type === 'speedboat';
    const isRadar = prop.type === 'radar';
    const propDepth = groundDepth(prop.y);

    if (isBoat) {
      sprite.setDepth(8);
    } else if (isRadar) {
      sprite.setDepth(29.8);
    } else {
      // 2.5D upright street & park props anchor near bottom base so bodies/canopies rise cleanly
      sprite.setOrigin(0.5, 0.78);
      sprite.setDepth(propDepth);

      const needsShadow =
        prop.type === 'lamp' ||
        prop.type === 'vending' ||
        prop.type === 'kiosk' ||
        prop.type === 'atm' ||
        prop.type === 'trashbin' ||
        prop.type === 'planter' ||
        prop.type.startsWith('tree_');
      if (needsShadow) {
        const sw = prop.type.startsWith('tree_') ? 22 : prop.type === 'kiosk' ? 24 : 16;
        const sh = prop.type.startsWith('tree_') ? 9 : 7;
        const shadow = this.scene.add.ellipse(prop.x + 2, prop.y + 3, sw, sh, 0x03060c, 0.45);
        shadow.setDepth(17);
      }
    }

    if (isRadar) {
      this.radarDishes.push(sprite);
    } else if (isBoat) {
      // V-shaped water wake behind harbor & river vessels
      const wake = this.scene.add.image(prop.x - (prop.type === 'barge' ? 68 : 26), prop.y, 'fx_water_wake');
      wake.setAlpha(0.75);
      wake.setScale(prop.type === 'barge' ? 1.55 : 1.0);
      wake.setDepth(7.5);
      this.bobbingBoats.push({
        sprite,
        baseY: prop.y,
        phase: prop.x * 0.02,
      });
    } else if (prop.type === 'lamp') {
      const lightColor = prop.tint ?? PALETTE.NEON_CYAN;
      const glow = this.scene.add.image(prop.x, prop.y - 12, 'fx_pixel_glow');
      glow.setTint(lightColor);
      glow.setAlpha(0.48);
      glow.setScale(2.0);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setDepth(propDepth + 0.05);

      const wetPool = this.scene.add.image(prop.x, prop.y + 8, 'fx_wet_reflect');
      wetPool.setTint(lightColor);
      wetPool.setAlpha(0.28);
      wetPool.setScale(1.1, 0.85);
      wetPool.setBlendMode(Phaser.BlendModes.ADD);
      wetPool.setDepth(4.5);
    } else if (prop.type === 'vending' || prop.type === 'kiosk') {
      const lightColor = prop.tint ?? PALETTE.NEON_PINK;
      const glow = this.scene.add.image(prop.x, prop.y - 10, 'fx_pixel_glow');
      glow.setTint(lightColor);
      glow.setAlpha(0.36);
      glow.setScale(1.35);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setDepth(propDepth + 0.05);

      const wetPool = this.scene.add.image(prop.x, prop.y + 10, 'fx_wet_reflect');
      wetPool.setTint(lightColor);
      wetPool.setAlpha(0.24);
      wetPool.setScale(0.95, 0.7);
      wetPool.setBlendMode(Phaser.BlendModes.ADD);
      wetPool.setDepth(4.5);
    } else if (prop.type === 'billboard' && prop.label) {
      const glow = this.scene.add.image(prop.x, prop.y - 10, 'fx_pixel_glow');
      glow.setTint(prop.tint ?? PALETTE.NEON_CYAN);
      glow.setAlpha(0.38);
      glow.setScale(1.85, 0.95);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setDepth(propDepth + 0.05);

      const txt = this.scene.add.text(prop.x, prop.y - 10, prop.label, {
        fontFamily: '"JetBrains Mono", "Noto Sans SC", monospace',
        fontSize: '7px',
        fontStyle: 'bold',
        color: '#F8FAFC',
      });
      txt.setOrigin(0.5);
      txt.setDepth(propDepth + 0.08);
      txt.setResolution(2);
    }

    if (prop.collidable) {
      const size = collisionManager.getPropHitboxSize(prop.type);
      collisionManager.addPropCollider(prop.x, prop.y, size.w, size.h);
    }
  }

  private drawHoloTowers(): void {
    const holoPositions = [
      { x: 768, y: 616 }, // Byte Mart / Neon Plaza corner
      { x: 1320, y: 616 }, // Cyber Clinic / Nexus Ops corner
      { x: 1096, y: 904 }, // Neon Plaza west promenade corner
      { x: 1528, y: 904 }, // Neon Plaza east promenade corner
      { x: 1816, y: 464 }, // Quantum Core Tech plaza
      { x: 3496, y: 1612 }, // Neon Skyport Terminal plaza
    ];

    holoPositions.forEach((pos, idx) => {
      const pool = this.scene.add.image(pos.x, pos.y + 10, 'fx_wet_reflect');
      pool.setTint(PALETTE.NEON_CYAN);
      pool.setAlpha(0.45);
      pool.setScale(1.7, 1.15);
      pool.setBlendMode(Phaser.BlendModes.ADD);
      pool.setDepth(4.6);

      const halo = this.scene.add.image(pos.x, pos.y - 26, 'fx_pixel_glow');
      halo.setTint(PALETTE.NEON_CYAN);
      halo.setAlpha(0.42);
      halo.setScale(2.1, 2.5);
      halo.setBlendMode(Phaser.BlendModes.ADD);
      halo.setDepth(groundDepth(pos.y) + 0.04);

      const ring = this.scene.add.circle(pos.x, pos.y + 4, 24);
      ring.setStrokeStyle(2, PALETTE.NEON_CYAN, 0.85);
      ring.setDepth(6);

      const tower = this.scene.add.image(pos.x, pos.y, 'prop_holo_tower');
      tower.setOrigin(0.5, 0.88);
      tower.setDepth(groundDepth(pos.y) + 0.1);

      this.holoTowers.push({ sprite: tower, ring, phase: idx * 1.15 });
    });
  }

  private drawWaterfrontPromenade(district: DistrictData): void {
    const railG = this.scene.add.graphics();
    railG.setDepth(13.5);

    const bridgeRanges = district.bridges
      .filter((br) => br.y >= 1650 && br.y <= 1950)
      .map((br) => ({ x1: br.x - 16, x2: br.x + br.w + 16 }));

    const isOnBridge = (x: number) => bridgeRanges.some((r) => x >= r.x1 && x <= r.x2);

    // Raised 2.5D stone/steel canal balustrade walls along Riverside north (1684) & south (1934) quays
    for (const quayY of [1684, 1934]) {
      let segStart: number | null = null;
      for (let x = 224; x <= 3360; x += 32) {
        if (!isOnBridge(x)) {
          if (segStart === null) segStart = x;
        } else if (segStart !== null) {
          this.drawBalustradeSegment(railG, segStart, x - 32, quayY);
          segStart = null;
        }
      }
      if (segStart !== null) {
        this.drawBalustradeSegment(railG, segStart, 3360, quayY);
      }
    }

    // Illuminated Neon Ferris Wheel on the Riverside Promenade
    const fx = 2424;
    const fy = 1624;
    const ferrisReflect = this.scene.add.image(fx, fy + 18, 'fx_wet_reflect');
    ferrisReflect.setTint(PALETTE.NEON_PINK);
    ferrisReflect.setAlpha(0.36);
    ferrisReflect.setScale(2.1, 1.25);
    ferrisReflect.setBlendMode(Phaser.BlendModes.ADD);
    ferrisReflect.setDepth(4.5);

    const ferrisHalo = this.scene.add.image(fx, fy - 42, 'fx_pixel_glow');
    ferrisHalo.setTint(PALETTE.NEON_PINK);
    ferrisHalo.setAlpha(0.34);
    ferrisHalo.setScale(3.2);
    ferrisHalo.setBlendMode(Phaser.BlendModes.ADD);
    ferrisHalo.setDepth(groundDepth(fy) - 0.1);

    const ferris = this.scene.add.image(fx, fy, 'prop_ferris_wheel');
    ferris.setOrigin(0.5, 0.88);
    ferris.setDepth(groundDepth(fy));
    this.ferrisWheels.push(ferris);
  }

  private drawBalustradeSegment(
    g: Phaser.GameObjects.Graphics,
    x1: number,
    x2: number,
    y: number
  ): void {
    const w = x2 - x1;
    if (w < 32) return;
    // Drop shadow + raised comic-inked canal balustrade
    g.fillStyle(0x05070e, 0.72);
    g.fillRect(x1, y + 6, w, 6);
    g.fillStyle(0x05070e, 1);
    g.fillRect(x1 - 1, y - 1, w + 2, 9);
    g.fillStyle(0x1e293b, 1);
    g.fillRect(x1, y, w, 7);
    g.fillStyle(0x475569, 1);
    g.fillRect(x1, y, w, 2);
    g.lineStyle(1.5, PALETTE.NEON_CYAN, 0.75);
    g.lineBetween(x1, y + 2, x2, y + 2);

    // Periodic stone pillars with bold comic ink outlines & glowing neon caps
    for (let px = x1 + 16; px <= x2 - 16; px += 96) {
      g.fillStyle(0x05070e, 1);
      g.fillRect(px - 5, y - 5, 10, 14);
      g.fillStyle(0x64748b, 1);
      g.fillRect(px - 3, y - 3, 6, 9);
      const isPink = ((px / 96) | 0) % 2 === 1;
      const capCol = isPink ? PALETTE.NEON_PINK : PALETTE.NEON_CYAN;
      g.fillStyle(capCol, 0.98);
      g.fillRect(px - 2, y - 4, 4, 2);

      const bollardPool = this.scene.add.image(px, y + 14, 'fx_wet_reflect');
      bollardPool.setTint(capCol);
      bollardPool.setAlpha(0.22);
      bollardPool.setScale(0.65, 0.55);
      bollardPool.setBlendMode(Phaser.BlendModes.ADD);
      bollardPool.setDepth(4.5);
    }
  }

  private drawTrafficSignal(sig: TrafficSignalDef, collisionManager: CollisionManager): void {
    const sigDepth = groundDepth(sig.y);
    const post = this.scene.add.image(sig.x, sig.y, 'prop_signal');
    post.setOrigin(0.5, 0.78);
    post.setDepth(sigDepth);

    const dot = this.scene.add.rectangle(sig.x, sig.y - 7, 4, 4, 0x22c55e, 1);
    dot.setDepth(sigDepth + 0.08);

    const glow = this.scene.add.image(sig.x, sig.y - 7, 'fx_pixel_glow');
    glow.setTint(0x22c55e);
    glow.setAlpha(0.38);
    glow.setScale(0.95);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(sigDepth + 0.05);

    this.trafficLights.push({ dot, glow, axis: sig.axis });
    collisionManager.addPropCollider(sig.x, sig.y, 12, 12);
  }

  private spawnRiverRipples(district: DistrictData): void {
    for (const wc of district.waterColliders) {
      if (wc.y > 3000 || wc.w < 120) continue;
      // Place subtle shimmering ripples inside open river channels
      for (let x = wc.x + 28; x <= wc.x + wc.w - 28; x += 68) {
        const y = wc.y + 42 + ((x * 13) % Math.max(24, wc.h - 84));
        const rect = this.scene.add.rectangle(x, y, 14, 2, PALETTE.NEON_CYAN, 0.34);
        rect.setDepth(4);
        this.riverRipples.push({ rect, baseY: y, phase: x * 0.04 });
      }
    }
  }

  private drawMountain(m: MountainDef): void {
    const baseG = this.scene.add.graphics();
    baseG.setDepth(9);

    // Subtle ground shadow under ridge footprint
    baseG.fillStyle(0x04070e, 0.56);
    baseG.fillRect(m.x + 8, m.y + 9, m.w + 4, m.h + 4);

    // Upper extruded 2.5D mountain range container (auto-occludes if player passes behind north peaks)
    const mtnContainer = this.scene.add.container(m.x, m.y);
    mtnContainer.setDepth(28.5 + Math.min(1.5, m.y * 0.0004));
    const g = this.scene.add.graphics();
    mtnContainer.add(g);

    if (m.biome === 'volcano') {
      const lcx = m.w / 2;
      const lcy = m.h / 2 - 16; // Extrude volcano apex 16px upward in -Y

      // Dark obsidian foothills base apron on ground
      baseG.fillStyle(0x16111c, 1);
      baseG.fillRect(m.x + 4, m.y + 4, m.w - 8, m.h - 8);
      baseG.lineStyle(2, 0xea580c, 0.72);
      baseG.strokeRect(m.x + 4, m.y + 4, m.w - 8, m.h - 8);

      // Stepped pixel conical slope extruding upward toward raised apex
      const coneSteps = [
        { inset: 16, lift: 4, col: 0x261d30, hi: 0x3b2d4a },
        { inset: 46, lift: 8, col: 0x2f243b, hi: 0x4b395c },
        { inset: 78, lift: 12, col: 0x392c47, hi: 0x5c4670 },
        { inset: 112, lift: 16, col: 0x453554, hi: 0x705585 },
      ];
      for (const st of coneSteps) {
        const w = m.w - st.inset * 2;
        const h = m.h - st.inset * 2;
        g.fillStyle(0x09060c, 1);
        g.fillRect(st.inset - 2, st.inset - st.lift - 2, w + 4, h + 4);
        g.fillStyle(st.col, 1);
        g.fillRect(st.inset, st.inset - st.lift, w, h);
        g.fillStyle(st.hi, 1);
        g.fillRect(st.inset, st.inset - st.lift, Math.floor(w * 0.45), Math.floor(h * 0.35));
      }

      // Branching molten lava rivers flowing from raised caldera
      const lavaPaths = [
        [
          [lcx - 14, lcy + 16],
          [lcx - 48, lcy + 54],
          [lcx - 86, lcy + 98],
          [12, m.h - 14],
        ],
        [
          [lcx + 16, lcy - 12],
          [lcx + 58, lcy - 50],
          [lcx + 110, lcy - 84],
          [m.w - 14, 18],
        ],
        [
          [lcx + 12, lcy + 20],
          [lcx + 42, lcy + 72],
          [lcx + 70, lcy + 132],
          [m.w - 40, m.h - 10],
        ],
      ];
      for (const path of lavaPaths) {
        for (let i = 0; i < path.length - 1; i++) {
          const [x1, y1] = path[i];
          const [x2, y2] = path[i + 1];
          g.lineStyle(10, 0x9a3412, 0.9);
          g.lineBetween(x1, y1, x2, y2);
          g.lineStyle(6, 0xf97316, 0.95);
          g.lineBetween(x1, y1, x2, y2);
          g.lineStyle(3, 0xfacc15, 1);
          g.lineBetween(x1, y1, x2, y2);
        }
      }

      // Glowing magma caldera crater at raised apex
      g.fillStyle(0x7c2d12, 1);
      g.fillCircle(lcx, lcy, 46);
      g.fillStyle(0xea580c, 1);
      g.fillCircle(lcx, lcy, 36);
      g.fillStyle(0xf97316, 1);
      g.fillCircle(lcx, lcy, 26);
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(lcx, lcy, 15);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(lcx - 3, lcy - 3, 7);

      const emberGlow = this.scene.add.image(lcx, lcy, 'fx_pixel_glow');
      emberGlow.setTint(0xf97316);
      emberGlow.setAlpha(0.65);
      emberGlow.setScale(4.2);
      emberGlow.setBlendMode(Phaser.BlendModes.ADD);
      mtnContainer.add(emberGlow);

      const smokeEmitter = this.scene.add.particles(m.x + lcx, m.y + lcy - 10, 'fx_steam', {
        speedY: { min: -42, max: -18 },
        speedX: { min: -12, max: 16 },
        scale: { start: 1.6, end: 4.0 },
        alpha: { start: 0.55, end: 0 },
        lifespan: 2400,
        frequency: 150,
        quantity: 2,
        tint: [0x27272a, 0x52525b, 0xf97316, 0xfacc15],
      });
      smokeEmitter.setDepth(31);
      this.steamEmitters.push(smokeEmitter);
    } else {
      const bgBase =
        m.biome === 'desert'
          ? 0x7c2d12
          : m.biome === 'forest'
            ? 0x123d28
            : 0x1e2d44;
      baseG.fillStyle(bgBase, 0.92);
      baseG.fillRect(m.x + 2, m.y + 2, m.w - 4, m.h - 4);

      const cols = Math.max(1, Math.round(m.w / 84));
      const rows = Math.max(1, Math.round(m.h / 84));
      const cellW = m.w / cols;
      const cellH = m.h / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const jx = (((r * 13 + c * 29) % 11) - 5) * 1.4;
          const jy = (((r * 19 + c * 7) % 9) - 4) * 1.2;
          const pkW = Math.min(cellW * 1.05, 94);
          const pkH = Math.min(cellH * 1.04, 92);
          const px = c * cellW + cellW / 2 + jx;
          const py = r * cellH + cellH / 2 + jy;

          // Extrude northern / upper peaks upward in -Y for crisp 2.5D relief
          const topY = py - pkH * 0.54 - 16;
          const botY = py + pkH * 0.42;
          const leftX = px - pkW * 0.46;
          const rightX = px + pkW * 0.48;

          if (m.biome === 'desert') {
            const plateauW = pkW * 0.48;
            g.fillStyle(0x431407, 1);
            g.fillTriangle(leftX - 3, botY + 2, px - plateauW / 2 - 3, topY - 2, px + 2, botY + 2);
            g.fillTriangle(px - 2, botY + 2, px + plateauW / 2 + 3, topY - 2, rightX + 3, botY + 2);
            g.fillRect(px - plateauW / 2 - 2, topY - 2, plateauW + 4, botY - topY + 4);

            g.fillStyle(0xea580c, 1);
            g.fillTriangle(leftX, botY, px - plateauW / 2, topY, px, botY);
            g.fillRect(px - plateauW / 2, topY, plateauW / 2, botY - topY);

            g.fillStyle(0x9a3412, 1);
            g.fillTriangle(px, botY, px + plateauW / 2, topY, rightX, botY);
            g.fillRect(px, topY, plateauW / 2, botY - topY);

            g.fillStyle(0xf59e0b, 0.85);
            g.fillRect(px - plateauW * 0.6, (topY + botY) / 2, plateauW * 1.2, 4);
            g.fillStyle(0xfdba74, 1);
            g.fillRect(px - plateauW / 2 + 2, topY + 2, plateauW - 4, 8);
          } else {
            const leftCol = m.biome === 'snow' ? 0x64748b : 0x2d6a4f;
            const rightCol = m.biome === 'snow' ? 0x1e293b : 0x143828;

            g.fillStyle(0x05070e, 1);
            g.fillTriangle(leftX - 3, botY + 2, px, topY - 3, rightX + 3, botY + 2);
            g.fillStyle(leftCol, 1);
            g.fillTriangle(leftX, botY, px, topY, px, botY);
            g.fillStyle(rightCol, 1);
            g.fillTriangle(px, botY, px, topY, rightX, botY);

            // Comic crosshatch ink strokes along shadowed east slope
            g.lineStyle(1.5, 0x05070e, 0.55);
            for (let s = 0.25; s <= 0.85; s += 0.2) {
              const sy = topY + (botY - topY) * s;
              const sx = px + (rightX - px) * s;
              g.lineBetween(px + 2, sy - 4, sx - 2, sy + 2);
            }

            if (m.biome === 'snow') {
              const capY = topY + (botY - topY) * 0.46;
              const capL = px - (pkW * 0.46) * 0.46;
              const capR = px + (pkW * 0.48) * 0.46;
              g.fillStyle(0xf8fafc, 1);
              g.fillTriangle(capL, capY, px, topY + 1, px, capY + 4);
              g.fillStyle(0x93c5fd, 1);
              g.fillTriangle(px, capY + 4, px, topY + 1, capR, capY);
              g.lineStyle(2, 0x05070e, 0.9);
              g.lineBetween(capL, capY, px, capY + 4);
              g.lineBetween(px, capY + 4, capR, capY);
            } else {
              const capY = topY + (botY - topY) * 0.36;
              g.fillStyle(0x4ade80, 0.85);
              g.fillTriangle(px - 11, capY, px, topY + 2, px, capY + 2);
            }

            // Bold comic ink outer ridge line
            g.lineStyle(2.5, 0x05070e, 1);
            g.lineBetween(leftX, botY, px, topY);
            g.lineBetween(px, topY, rightX, botY);
          }
        }
      }
    }

    const label = this.scene.add.text(
      m.w / 2,
      m.h / 2 + (m.id === 'mtn-se-crag' ? 56 : -10),
      `${m.name} · ${m.elevation}m`,
      {
        fontFamily: '"Noto Sans SC", monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: m.biome === 'volcano' ? '#FDBA74' : m.biome === 'desert' ? '#FDE68A' : '#F8FAFC',
        align: 'center',
        backgroundColor: '#080D18CC',
        padding: { x: 5, y: 2 },
      }
    );
    label.setOrigin(0.5);
    label.setResolution(2);
    mtnContainer.add(label);

    this.roofOccluders.push({
      container: mtnContainer,
      x1: m.x - 8,
      y1: m.y - 28,
      x2: m.x + m.w + 8,
      y2: m.y + 12,
      curAlpha: 1,
    });
  }

  private addExitMarker(x: number, y: number, label: string, color: string): void {
    const txt = this.scene.add.text(x, y, label, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '10px',
      color,
      backgroundColor: '#080D18',
      padding: { x: 4, y: 2 },
    });
    txt.setOrigin(0.5);
    txt.setDepth(8);
  }

  public update(timeSeconds: number, dtSeconds: number, playerPos: { x: number; y: number } | null): void {
    // 1. Update animated neon signs with subtle flicker
    for (const target of this.pulseTargets) {
      const wave = Math.sin(timeSeconds * target.speed + target.phase);
      const flickerNoise = Math.sin(timeSeconds * 19 + target.flickerSeed) * Math.sin(timeSeconds * 7.3 + target.flickerSeed);
      const flickerDip = flickerNoise > 0.92 ? 0.35 : 0;
      const alpha = Math.max(0.25, target.baseAlpha - 0.18 + wave * 0.14 - flickerDip);
      target.bar.setAlpha(alpha);
      target.glow.setAlpha(alpha * 0.42);
      target.signLabel.setAlpha(flickerDip > 0 ? 0.65 : 1);
    }

    // 2. Rotate rooftop AC fans & observatory radar
    const fanDelta = dtSeconds * 4.2;
    for (const fan of this.acFans) {
      fan.rotation += fanDelta;
    }
    const radarDelta = dtSeconds * 1.1;
    for (const dish of this.radarDishes) {
      dish.rotation += radarDelta;
    }

    // 2b. Gently bob moored harbor cargo barges & speedboats
    for (const b of this.bobbingBoats) {
      b.sprite.setY(b.baseY + Math.sin(timeSeconds * 1.8 + b.phase) * 2.2);
    }

    // 2c. Rotate lighthouse searchlights & alternate police HQ beacons
    for (const beam of this.rotatingBeams) {
      beam.rotation += dtSeconds * 1.35;
    }
    const beaconBlink = Math.floor(timeSeconds * 4) % 2 === 0;
    for (const pb of this.policeBeacons) {
      pb.red.setAlpha(beaconBlink ? 1 : 0.25);
      pb.blue.setAlpha(beaconBlink ? 0.25 : 1);
    }

    // 3. Cycle traffic signals (10s full cycle: 4s green, 1s amber, 5s red per axis)
    const cycle = timeSeconds % 10;
    for (const light of this.trafficLights) {
      const phaseTime = light.axis === 'ns' ? cycle : (cycle + 5) % 10;
      let color = 0xff4545; // Red
      if (phaseTime < 4) {
        color = 0x22c55e; // Green
      } else if (phaseTime < 5) {
        color = 0xffd166; // Amber
      }
      light.dot.setFillStyle(color, 1);
      light.glow.setTint(color);
    }

    // 4. Pulse landmark rings & Holographic Projection Towers
    const ringScale = 0.94 + Math.sin(timeSeconds * 3.2) * 0.08;
    for (const ring of this.landmarkRings) {
      ring.setScale(ringScale);
    }
    for (const ht of this.holoTowers) {
      const pulse = 0.85 + Math.sin(timeSeconds * 3.8 + ht.phase) * 0.15;
      ht.sprite.setAlpha(0.88 + Math.sin(timeSeconds * 6.2 + ht.phase) * 0.12);
      ht.ring.setScale(0.92 + Math.sin(timeSeconds * 3.0 + ht.phase) * 0.14);
      ht.ring.setAlpha(pulse * 0.78);
    }
    for (const fw of this.ferrisWheels) {
      fw.setAlpha(0.92 + Math.sin(timeSeconds * 2.4) * 0.08);
    }

    // 5. Animate river current shimmer & turbo pads
    for (const r of this.riverRipples) {
      const drift = ((timeSeconds * 16 + r.phase * 10) % 14) - 7;
      r.rect.setY(r.baseY + drift);
      r.rect.setAlpha(0.2 + Math.abs(Math.sin(timeSeconds * 2 + r.phase)) * 0.25);
    }

    for (const tc of this.turboChevrons) {
      const pulse = 0.14 + Math.abs(Math.sin(timeSeconds * 4.5 + tc.phase)) * 0.24;
      tc.rect.setAlpha(pulse);
    }

    // 6. Follow player visor aura when on foot
    if (this.playerGlow) {
      if (playerPos) {
        this.playerGlow.setVisible(true);
        this.playerGlow.setPosition(playerPos.x, playerPos.y);
      } else {
        this.playerGlow.setVisible(false);
      }
    }

    // 7. Auto-fade overhanging 2.5D building roofs & mountain crests when actor/car passes behind
    const lerpRate = Math.min(1, dtSeconds * 12);
    for (const occ of this.roofOccluders) {
      const behind =
        playerPos !== null &&
        playerPos.x >= occ.x1 &&
        playerPos.x <= occ.x2 &&
        playerPos.y >= occ.y1 &&
        playerPos.y <= occ.y2;
      const targetAlpha = behind ? 0.3 : 1;
      if (Math.abs(occ.curAlpha - targetAlpha) > 0.01) {
        occ.curAlpha += (targetAlpha - occ.curAlpha) * lerpRate;
        occ.container.setAlpha(occ.curAlpha);
      } else if (occ.curAlpha !== targetAlpha) {
        occ.curAlpha = targetAlpha;
        occ.container.setAlpha(targetAlpha);
      }
    }
  }

  public destroy(): void {
    this.pulseTargets = [];
    this.landmarkRings = [];
    this.acFans = [];
    this.radarDishes = [];
    this.bobbingBoats = [];
    this.rotatingBeams = [];
    this.policeBeacons = [];
    this.holoTowers = [];
    this.ferrisWheels = [];
    this.trafficLights = [];
    this.riverRipples = [];
    this.turboChevrons = [];
    this.roofOccluders = [];
    for (const emitter of this.steamEmitters) {
      emitter.destroy();
    }
    this.steamEmitters = [];
    if (this.ambientDust) {
      this.ambientDust.destroy();
      this.ambientDust = null;
    }
    if (this.playerGlow) {
      this.playerGlow.destroy();
      this.playerGlow = null;
    }
    if (this.tilemap) {
      this.tilemap.destroy();
      this.tilemap = null;
    }
  }
}
