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
          // Horizontal neon suspension span beam
          bridgeG.fillStyle(0x1e293b, 1);
          bridgeG.fillRect(br.x + 12, edgeY, br.w - 24, 10);
          bridgeG.lineStyle(1, accent, 0.9);
          bridgeG.strokeRect(br.x + 12, edgeY, br.w - 24, 10);

          // Twin pixel suspension pylons
          for (const tx of [tLeft, tRight]) {
            bridgeG.fillStyle(0x090d16, 1);
            bridgeG.fillRect(tx - 8, edgeY - 12, 16, 22);
            bridgeG.fillStyle(0x475569, 1);
            bridgeG.fillRect(tx - 6, edgeY - 10, 12, 18);
            bridgeG.fillStyle(0x94a3b8, 1);
            bridgeG.fillRect(tx - 4, edgeY - 8, 8, 4);
            bridgeG.fillStyle(accent, 1);
            bridgeG.fillRect(tx - 2, edgeY - 12, 4, 3);
            bridgeG.fillStyle(PALETTE.GOLD, 1);
            bridgeG.fillRect(tx - 2, edgeY + 2, 4, 3);
          }

          // Sweeping suspension cables
          bridgeG.lineStyle(2, PALETTE.GOLD, 0.78);
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
    const g = this.scene.add.graphics();
    g.setDepth(10);

    // 1. Crisp 2.5D multi-step drop shadow
    g.fillStyle(0x03060c, 0.78);
    g.fillRect(b.x + 8, b.y + 9, b.w, b.h + 5);
    g.fillStyle(0x050912, 0.42);
    g.fillRect(b.x + 13, b.y + 14, b.w, b.h + 5);

    const facadeH = b.h >= 88 ? 24 : b.h >= 64 ? 18 : 12;
    const roofH = b.h - facadeH;
    const baseWallColor = b.roofColor
      ? Phaser.Display.Color.ValueToColor(b.roofColor).darken(18).color
      : 0x162038;
    const roofFill = b.roofColor ?? 0x1e2942;

    if (b.roofStyle === 'stadium') {
      // Dedicated pixel-art Cyber Colosseum Dome Arena
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      g.fillStyle(0x0b101d, 1);
      g.fillEllipse(cx + 6, cy + 8, b.w, b.h);
      // Outer tiered wall
      g.fillStyle(0x1f2b47, 1);
      g.fillEllipse(cx, cy, b.w, b.h);
      g.lineStyle(3, b.neonColor, 0.95);
      g.strokeEllipse(cx, cy, b.w - 3, b.h - 3);
      // Illuminated stadium colonnade arches around ring
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const ax = cx + Math.cos(ang) * (b.w * 0.43);
        const ay = cy + Math.sin(ang) * (b.h * 0.42);
        g.fillStyle(i % 2 === 0 ? PALETTE.NEON_CYAN : PALETTE.NEON_PINK, 0.85);
        g.fillRect(ax - 3, ay - 3, 6, 6);
      }
      // Stepped grandstands bowl
      g.fillStyle(0x2d3b5e, 1);
      g.fillEllipse(cx, cy, b.w - 28, b.h - 24);
      g.lineStyle(2, PALETTE.NEON_CYAN, 0.8);
      g.strokeEllipse(cx, cy, b.w - 32, b.h - 28);
      // Illuminated cyber turf field
      g.fillStyle(0x0f5132, 1);
      g.fillEllipse(cx, cy, b.w - 64, b.h - 54);
      g.lineStyle(2, 0x4ade80, 0.75);
      g.strokeEllipse(cx, cy, b.w - 68, b.h - 58);
      g.lineBetween(cx, cy - (b.h - 58) / 2, cx, cy + (b.h - 58) / 2);
      g.strokeCircle(cx, cy, 14);
    } else if (b.roofStyle === 'lighthouse') {
      // Dedicated Maritime Beacon Lighthouse on stone seawall base
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      g.fillStyle(0x334155, 1);
      g.fillRect(b.x + 2, b.y + 4, b.w - 4, b.h - 6);
      g.lineStyle(2, 0x94a3b8, 0.9);
      g.strokeRect(b.x + 2, b.y + 4, b.w - 4, b.h - 6);
      // Striped red & white masonry ring tower
      g.fillStyle(0xf8fafc, 1);
      g.fillCircle(cx, cy - 2, 20);
      g.fillStyle(0xdc2626, 1);
      g.fillCircle(cx, cy - 2, 15);
      g.fillStyle(0xf8fafc, 1);
      g.fillCircle(cx, cy - 2, 10);
      // Golden lantern cupola
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(cx, cy - 2, 6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(cx, cy - 2, 3);

      // Sweeping searchlight beam
      const sweep = this.scene.add.image(cx, cy - 2, 'fx_headlight');
      sweep.setOrigin(0, 0.5);
      sweep.setScale(2.6, 1.8);
      sweep.setTint(PALETTE.GOLD);
      sweep.setAlpha(0.55);
      sweep.setBlendMode(Phaser.BlendModes.ADD);
      sweep.setDepth(16);
      this.rotatingBeams.push(sweep);
    } else {
      // Dark pixel outline + 2.5D structure body
      g.fillStyle(0x070b14, 1);
      g.fillRect(b.x, b.y, b.w, b.h);
      g.fillStyle(0x1e2942, 1);
      g.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);

      // 2.5D vertical south facade (multi-story window matrix + glowing doorway)
      g.fillStyle(baseWallColor, 1);
      g.fillRect(b.x + 2, b.y + roofH, b.w - 4, facadeH - 2);

      // Vertical corner neon trim pillars
      g.fillStyle(b.neonColor, 0.85);
      g.fillRect(b.x + 2, b.y + 4, 2, b.h - 8);
      g.fillRect(b.x + b.w - 4, b.y + 4, 2, b.h - 8);

      if (b.roofStyle === 'container') {
        g.fillStyle(0x0f172a, 0.8);
        g.fillRect(b.x + 8, b.y + roofH + 2, b.w - 16, facadeH - 5);
        g.fillStyle(0xcbd5e1, 0.75);
        g.fillRect(b.x + Math.floor(b.w * 0.48), b.y + roofH + 2, 2, facadeH - 5);
        g.fillRect(b.x + Math.floor(b.w * 0.52), b.y + roofH + 2, 2, facadeH - 5);
      } else {
        // Multi-row lit cyberpunk facade windows
        const winRows = facadeH >= 20 ? [roofH + 3, roofH + 10] : [roofH + 3];
        for (const wy of winRows) {
          for (let wx = b.x + 10; wx < b.x + b.w - 16; wx += 14) {
            const isDoor = wy === winRows[winRows.length - 1] && Math.abs(wx - (b.x + b.w / 2 - 5)) < 12;
            if (isDoor) {
              g.fillStyle(0x070b14, 1);
              g.fillRect(wx - 2, wy - 1, 14, Math.max(6, b.y + b.h - 2 - wy));
              g.fillStyle(b.neonColor, 0.92);
              g.fillRect(wx, wy, 10, 2);
            } else {
              const winLit = ((wx + wy) / 7) % 3 !== 0;
              const winCol = b.roofStyle === 'factory' ? 0xf59e0b : (wx % 28 === 0 ? PALETTE.NEON_PINK : 0x38bdf8);
              g.fillStyle(winLit ? winCol : 0x0f172a, winLit ? 0.82 : 0.9);
              g.fillRect(wx, wy, 8, 4);
            }
          }
        }
      }

      // Rooftop terrace bevel & inner deck
      g.fillStyle(0x334155, 1);
      g.fillRect(b.x + 3, b.y + 2, b.w - 6, 4);
      g.fillStyle(roofFill, 1);
      g.fillRect(b.x + 6, b.y + 6, b.w - 12, Math.max(16, roofH - 8));

      if (b.roofStyle === 'container') {
        g.fillStyle(0x000000, 0.32);
        for (let rx = b.x + 12; rx < b.x + b.w - 10; rx += 8) {
          g.fillRect(rx, b.y + 6, 3, roofH - 8);
        }
        g.fillStyle(0xcbd5e1, 0.85);
        g.fillRect(b.x + 2, b.y + 2, 5, 5);
        g.fillRect(b.x + b.w - 7, b.y + 2, 5, 5);
        g.fillRect(b.x + 2, b.y + roofH - 5, 5, 5);
        g.fillRect(b.x + b.w - 7, b.y + roofH - 5, 5, 5);
      } else if (b.roofStyle === 'warehouse') {
        g.lineStyle(1, 0x475569, 0.75);
        for (let rx = b.x + 14; rx < b.x + b.w - 14; rx += 10) {
          g.lineBetween(rx, b.y + 8, rx, b.y + roofH - 4);
        }
        g.fillStyle(0x0f172a, 1);
        g.fillRect(b.x + 22, b.y + 12, 38, 22);
        g.fillStyle(PALETTE.GOLD, 0.65);
        g.fillRect(b.x + 25, b.y + 15, 32, 4);
      } else if (b.roofStyle === 'factory') {
        g.fillStyle(0x181b24, 1);
        g.fillRect(b.x + 16, b.y + 10, 44, 28);
        g.fillRect(b.x + b.w - 60, b.y + 10, 44, 28);
        g.fillStyle(0xf97316, 0.85);
        g.fillRect(b.x + 22, b.y + 16, 32, 8);
        g.fillStyle(0x64748b, 1);
        g.fillCircle(b.x + b.w - 38, b.y + 24, 10);
        g.fillStyle(0x0f172a, 1);
        g.fillCircle(b.x + b.w - 38, b.y + 24, 5);
        g.fillStyle(0x94a3b8, 0.9);
        g.fillRect(b.x + 64, b.y + 18, Math.max(20, b.w - 128), 5);
        g.fillRect(b.x + 64, b.y + 28, Math.max(20, b.w - 128), 4);
      } else if (b.roofStyle === 'tech') {
        // Stepped 2.5D Cyber Skyscraper Tiered Crown + Glowing Spire Core
        const pW = Math.max(40, b.w - 34);
        const pH = Math.max(24, roofH - 22);
        const px = b.x + (b.w - pW) / 2;
        const py = b.y + 10;
        g.fillStyle(0x111a2e, 1);
        g.fillRect(px, py, pW, pH);
        g.lineStyle(1, b.neonColor, 0.8);
        g.strokeRect(px, py, pW, pH);
        // Illuminated cyber glass skylight strip + spire core
        g.fillStyle(b.neonColor, 0.35);
        g.fillRect(px + 8, py + 6, pW - 16, 8);
        g.fillStyle(b.neonColor, 0.9);
        g.fillRect(px + 10, py + 8, pW - 20, 3);
        g.fillStyle(0xe0f2fe, 0.9);
        g.fillCircle(b.x + b.w / 2, py + pH / 2, 5);
      } else if (b.roofStyle === 'club' || b.roofStyle === 'arcade') {
        // Neon Equalizer & Arcade Rooftop Strips
        const colors = [PALETTE.NEON_PINK, PALETTE.NEON_CYAN, PALETTE.NEON_PURPLE, PALETTE.GOLD];
        for (let i = 0; i < 6; i++) {
          const sx = b.x + 16 + i * Math.floor((b.w - 32) / 6);
          g.fillStyle(colors[i % colors.length], 0.85);
          g.fillRect(sx, b.y + 12, 14, 7);
          g.fillRect(sx, b.y + roofH - 18, 14, 7);
        }
      } else if (b.roofStyle === 'store' || b.roofStyle === 'diner') {
        // Striped storefront awning + rooftop AC boxes
        g.fillStyle(b.neonColor, 0.95);
        g.fillRect(b.x + 8, b.y + roofH - 6, b.w - 16, 6);
        g.fillStyle(0xf8fafc, 0.65);
        for (let ax = b.x + 12; ax < b.x + b.w - 14; ax += 12) {
          g.fillRect(ax, b.y + roofH - 6, 5, 6);
        }
        g.fillStyle(0x334155, 1);
        g.fillRect(b.x + 18, b.y + 14, 24, 16);
      } else if (b.roofStyle === 'residential') {
        for (let rx = b.x + 18; rx < b.x + b.w - 22; rx += 28) {
          g.fillStyle(PALETTE.NEON_PINK, 0.45);
          g.fillRect(rx, b.y + 14, 14, 10);
          g.fillStyle(PALETTE.GOLD, 0.45);
          g.fillRect(rx, b.y + roofH - 22, 14, 10);
        }
      } else if (b.roofStyle === 'police') {
        // NCPD Precinct Helipad + Live Flashing Red/Blue Rooftop Sirens
        g.fillStyle(0x0f172a, 1);
        g.fillRect(b.x + 12, b.y + 10, b.w - 24, roofH - 16);
        g.lineStyle(2, 0x38bdf8, 0.8);
        g.strokeCircle(b.x + b.w / 2, b.y + roofH / 2, 16);

        const redSiren = this.scene.add.rectangle(b.x + 18, b.y + 12, 14, 5, 0xef4444, 1);
        const blueSiren = this.scene.add.rectangle(b.x + b.w - 18, b.y + 12, 14, 5, 0x38bdf8, 1);
        redSiren.setDepth(13);
        blueSiren.setDepth(13);
        this.policeBeacons.push({ red: redSiren, blue: blueSiren });
      }

      // Crisp building neon perimeter outline
      g.lineStyle(2, b.neonColor, 0.92);
      g.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    }

    // Rotating pixel AC fan rotor
    if (b.hasFan) {
      const fan = this.scene.add.image(b.x + b.w - 26, b.y + 22, 'prop_ac_fan');
      fan.setDepth(11);
      this.acFans.push(fan);
    }

    // Building rooftop label
    const roofTitle = this.scene.add.text(b.x + b.w / 2, b.y + roofH / 2, b.label, {
      fontFamily: '"Chakra Petch", "Noto Sans SC", monospace',
      fontSize: b.w <= 70 ? '9px' : '11px',
      fontStyle: 'bold',
      color: '#F8FAFC',
      stroke: '#080D18',
      strokeThickness: 3,
      align: 'center',
    });
    roofTitle.setOrigin(0.5);
    roofTitle.setDepth(12);
    roofTitle.setResolution(2);

    // Animated South-Face Neon Sign + Additive Pixel Glow
    const signX = b.x + b.w / 2;
    const signY = b.y + b.h - 1;
    const signW = Math.min(b.w - 16, 96);

    const glow = this.scene.add.image(signX, signY + 4, 'fx_pixel_glow');
    glow.setTint(b.neonColor);
    glow.setAlpha(0.38);
    glow.setScale(signW / 32, 0.9);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(11);

    const signBar = this.scene.add.rectangle(signX, signY, signW, 4, b.neonColor, 0.95);
    signBar.setDepth(13);

    const signLabel = this.scene.add.text(signX, signY - 11, b.signText, {
      fontFamily: '"JetBrains Mono", "Noto Sans SC", monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#F8FAFC',
      backgroundColor: '#080D18DD',
      padding: { x: 4, y: 1 },
    });
    signLabel.setOrigin(0.5);
    signLabel.setDepth(13);
    signLabel.setResolution(2);

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
    sprite.setDepth(
      prop.type === 'barge' || prop.type === 'speedboat'
        ? 8
        : prop.type === 'tree_pine' ||
            prop.type === 'tree_sakura' ||
            prop.type === 'tree_emerald' ||
            prop.type === 'tree_autumn' ||
            prop.type === 'tree_snow' ||
            prop.type === 'tree_palm'
          ? 24
          : 14
    );

    if (prop.type === 'radar') {
      sprite.setDepth(16);
      this.radarDishes.push(sprite);
    } else if (prop.type === 'barge' || prop.type === 'speedboat') {
      this.bobbingBoats.push({
        sprite,
        baseY: prop.y,
        phase: prop.x * 0.02,
      });
    } else if (prop.type === 'lamp') {
      const lightColor = prop.tint ?? PALETTE.NEON_CYAN;
      const glow = this.scene.add.image(prop.x, prop.y, 'fx_pixel_glow');
      glow.setTint(lightColor);
      glow.setAlpha(0.42);
      glow.setScale(1.85);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setDepth(15);
    } else if (prop.type === 'vending' || prop.type === 'kiosk') {
      const lightColor = prop.tint ?? PALETTE.NEON_PINK;
      const glow = this.scene.add.image(prop.x, prop.y, 'fx_pixel_glow');
      glow.setTint(lightColor);
      glow.setAlpha(0.32);
      glow.setScale(1.25);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setDepth(15);
    } else if (prop.type === 'billboard' && prop.label) {
      const glow = this.scene.add.image(prop.x, prop.y, 'fx_pixel_glow');
      glow.setTint(prop.tint ?? PALETTE.NEON_CYAN);
      glow.setAlpha(0.34);
      glow.setScale(1.8, 0.9);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setDepth(15);

      const txt = this.scene.add.text(prop.x, prop.y, prop.label, {
        fontFamily: '"JetBrains Mono", "Noto Sans SC", monospace',
        fontSize: '7px',
        fontStyle: 'bold',
        color: '#F8FAFC',
      });
      txt.setOrigin(0.5);
      txt.setDepth(16);
      txt.setResolution(2);
    }

    if (prop.collidable) {
      const size = collisionManager.getPropHitboxSize(prop.type);
      collisionManager.addPropCollider(prop.x, prop.y, size.w, size.h);
    }
  }

  private drawTrafficSignal(sig: TrafficSignalDef, collisionManager: CollisionManager): void {
    const post = this.scene.add.image(sig.x, sig.y, 'prop_signal');
    post.setDepth(15);

    const dot = this.scene.add.rectangle(sig.x, sig.y, 4, 4, 0x22c55e, 1);
    dot.setDepth(16);

    const glow = this.scene.add.image(sig.x, sig.y, 'fx_pixel_glow');
    glow.setTint(0x22c55e);
    glow.setAlpha(0.38);
    glow.setScale(0.95);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(15);

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
    const g = this.scene.add.graphics();
    g.setDepth(10);

    // Subtle ground shadow under ridge footprint
    g.fillStyle(0x04070e, 0.52);
    g.fillRect(m.x + 6, m.y + 8, m.w, m.h);

    if (m.biome === 'volcano') {
      // Iconic Towering Obsidian Volcano Cone + Magma Rivers + Caldera Crater
      const cx = m.x + m.w / 2;
      const cy = m.y + m.h / 2;

      // Dark obsidian foothills base apron
      g.fillStyle(0x16111c, 1);
      g.fillRect(m.x + 4, m.y + 4, m.w - 8, m.h - 8);
      g.lineStyle(2, 0xea580c, 0.7);
      g.strokeRect(m.x + 4, m.y + 4, m.w - 8, m.h - 8);

      // Stepped pixel conical slope (5 layers narrowing inward toward crater)
      const coneSteps = [
        { inset: 16, col: 0x261d30, hi: 0x3b2d4a },
        { inset: 46, col: 0x2f243b, hi: 0x4b395c },
        { inset: 78, col: 0x392c47, hi: 0x5c4670 },
        { inset: 112, col: 0x453554, hi: 0x705585 },
      ];
      for (const st of coneSteps) {
        const w = m.w - st.inset * 2;
        const h = m.h - st.inset * 2;
        g.fillStyle(0x09060c, 1);
        g.fillRect(m.x + st.inset - 2, m.y + st.inset - 2, w + 4, h + 4);
        g.fillStyle(st.col, 1);
        g.fillRect(m.x + st.inset, m.y + st.inset, w, h);
        // Sunlit west-north slope highlight
        g.fillStyle(st.hi, 1);
        g.fillRect(m.x + st.inset, m.y + st.inset, Math.floor(w * 0.45), Math.floor(h * 0.35));
      }

      // Branching molten lava rivers flowing down the volcano flanks
      const lavaPaths = [
        [
          [cx - 14, cy + 16],
          [cx - 48, cy + 54],
          [cx - 86, cy + 96],
          [m.x + 12, m.y + m.h - 14],
        ],
        [
          [cx + 16, cy - 12],
          [cx + 58, cy - 52],
          [cx + 110, cy - 90],
          [m.x + m.w - 14, m.y + 18],
        ],
        [
          [cx + 12, cy + 20],
          [cx + 42, cy + 72],
          [cx + 70, cy + 132],
          [m.x + m.w - 40, m.y + m.h - 10],
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

      // Glowing magma caldera crater at apex
      g.fillStyle(0x7c2d12, 1);
      g.fillCircle(cx, cy, 46);
      g.fillStyle(0xea580c, 1);
      g.fillCircle(cx, cy, 36);
      g.fillStyle(0xf97316, 1);
      g.fillCircle(cx, cy, 26);
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(cx, cy, 15);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(cx - 3, cy - 3, 7);

      const emberGlow = this.scene.add.image(cx, cy, 'fx_pixel_glow');
      emberGlow.setTint(0xf97316);
      emberGlow.setAlpha(0.65);
      emberGlow.setScale(4.2);
      emberGlow.setBlendMode(Phaser.BlendModes.ADD);
      emberGlow.setDepth(11);

      const smokeEmitter = this.scene.add.particles(cx, cy - 10, 'fx_steam', {
        speedY: { min: -42, max: -18 },
        speedX: { min: -12, max: 16 },
        scale: { start: 1.6, end: 4.0 },
        alpha: { start: 0.55, end: 0 },
        lifespan: 2400,
        frequency: 150,
        quantity: 2,
        tint: [0x27272a, 0x52525b, 0xf97316, 0xfacc15],
      });
      smokeEmitter.setDepth(18);
      this.steamEmitters.push(smokeEmitter);
    } else {
      // Multi-Peak Stepped Pixel Mountain Ranges (Zero nested flat rectangles!)
      const bgBase =
        m.biome === 'desert'
          ? 0x7c2d12
          : m.biome === 'forest'
            ? 0x123d28
            : 0x1e2d44;
      g.fillStyle(bgBase, 0.92);
      g.fillRect(m.x + 2, m.y + 2, m.w - 4, m.h - 4);

      const cols = Math.max(1, Math.round(m.w / 84));
      const rows = Math.max(1, Math.round(m.h / 84));
      const cellW = m.w / cols;
      const cellH = m.h / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const jx = (((r * 13 + c * 29) % 11) - 5) * 1.4;
          const jy = (((r * 19 + c * 7) % 9) - 4) * 1.2;
          const pkW = Math.min(cellW * 1.05, 92);
          const pkH = Math.min(cellH * 0.98, 84);
          const px = m.x + c * cellW + cellW / 2 + jx;
          const py = m.y + r * cellH + cellH / 2 + jy;

          const topY = py - pkH * 0.44;
          const botY = py + pkH * 0.44;
          const leftX = px - pkW * 0.46;
          const rightX = px + pkW * 0.46;

          if (m.biome === 'desert') {
            // Flat-topped terraced red-rock Mesa / Canyon Butte
            const plateauW = pkW * 0.48;
            // Dark pixel outline
            g.fillStyle(0x431407, 1);
            g.fillTriangle(leftX - 3, botY + 2, px - plateauW / 2 - 3, topY - 2, px + 2, botY + 2);
            g.fillTriangle(px - 2, botY + 2, px + plateauW / 2 + 3, topY - 2, rightX + 3, botY + 2);
            g.fillRect(px - plateauW / 2 - 2, topY - 2, plateauW + 4, botY - topY + 4);
            // Sunlit left sandstone face
            g.fillStyle(0xea580c, 1);
            g.fillTriangle(leftX, botY, px - plateauW / 2, topY, px, botY);
            g.fillRect(px - plateauW / 2, topY, plateauW / 2, botY - topY);
            // Shadowed right canyon cliff
            g.fillStyle(0x9a3412, 1);
            g.fillTriangle(px, botY, px + plateauW / 2, topY, rightX, botY);
            g.fillRect(px, topY, plateauW / 2, botY - topY);
            // Horizontal red-ochre strata bands + sunlit mesa crown
            g.fillStyle(0xf59e0b, 0.85);
            g.fillRect(px - plateauW * 0.6, (topY + botY) / 2, plateauW * 1.2, 4);
            g.fillStyle(0xfdba74, 1);
            g.fillRect(px - plateauW / 2 + 2, topY + 2, plateauW - 4, 8);
          } else {
            // Crisp Stepped Alpine / Forest Peak Triangle
            const leftCol = m.biome === 'snow' ? 0x475569 : 0x2d6a4f;
            const rightCol = m.biome === 'snow' ? 0x1e293b : 0x183d2c;

            // Dark outline base triangle
            g.fillStyle(0x090d16, 1);
            g.fillTriangle(leftX - 3, botY + 2, px, topY - 3, rightX + 3, botY + 2);
            // Sunlit left slope
            g.fillStyle(leftCol, 1);
            g.fillTriangle(leftX, botY, px, topY, px, botY);
            // Shadowed right slope
            g.fillStyle(rightCol, 1);
            g.fillTriangle(px, botY, px, topY, rightX, botY);

            if (m.biome === 'snow') {
              // Jagged glacial white-cyan snow cap covering top 46%
              const capY = topY + (botY - topY) * 0.48;
              const capL = px - (pkW * 0.46) * 0.48;
              const capR = px + (pkW * 0.46) * 0.48;
              g.fillStyle(0xf8fafc, 1);
              g.fillTriangle(capL, capY, px, topY + 1, px, capY + 4);
              g.fillStyle(0xbae6fd, 1);
              g.fillTriangle(px, capY + 4, px, topY + 1, capR, capY);
            } else {
              // Lush forest highland highlight ridge
              const capY = topY + (botY - topY) * 0.35;
              g.fillStyle(0x4ade80, 0.72);
              g.fillTriangle(px - 10, capY, px, topY + 2, px, capY + 2);
            }
          }
        }
      }
    }

    const label = this.scene.add.text(
      m.x + m.w / 2,
      m.y + m.h / 2 + (m.id === 'mtn-se-crag' ? 68 : 0),
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
    label.setDepth(12);
    label.setResolution(2);
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

    // 4. Pulse landmark rings
    const ringScale = 0.94 + Math.sin(timeSeconds * 3.2) * 0.08;
    for (const ring of this.landmarkRings) {
      ring.setScale(ringScale);
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
  }

  public destroy(): void {
    this.pulseTargets = [];
    this.landmarkRings = [];
    this.acFans = [];
    this.radarDishes = [];
    this.bobbingBoats = [];
    this.rotatingBeams = [];
    this.policeBeacons = [];
    this.trafficLights = [];
    this.riverRipples = [];
    this.turboChevrons = [];
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
