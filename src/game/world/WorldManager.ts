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
  private trafficLights: TrafficLightVisual[] = [];
  private steamEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private riverRipples: Array<{ rect: Phaser.GameObjects.Rectangle; baseY: number; phase: number }> = [];
  private turboChevrons: Array<{ rect: Phaser.GameObjects.Rectangle; baseColor: number; phase: number }> = [];
  private ambientDust: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private playerGlow: Phaser.GameObjects.Image | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public buildDistrict(district: DistrictData, collisionManager: CollisionManager): void {
    // 1. Render Tiled Tilemap (GPU-batched + automatic camera frustum culling)
    this.buildTiledLayers();

    // 2. Decorative Plaza, Turbo Strips, Stunt Ramps & District Gate Overlays
    const overlayG = this.scene.add.graphics();
    overlayG.setDepth(3);
    overlayG.lineStyle(2, PALETTE.NEON_CYAN, 0.55);
    overlayG.strokeCircle(800, 608, 38);
    overlayG.lineStyle(1, PALETTE.NEON_PURPLE, 0.55);
    overlayG.strokeRect(16, 16, WORLD_CONFIG.WIDTH - 32, WORLD_CONFIG.HEIGHT - 32);

    this.addExitMarker(1744, 240, '北跨河霓虹大桥', PALETTE.NEON_CYAN_HEX);
    this.addExitMarker(1744, 816, '中跨河霓虹大桥', PALETTE.NEON_PINK_HEX);
    this.addExitMarker(1744, 1552, '涡轮跨河高速桥', PALETTE.GOLD_HEX);
    this.addExitMarker(1744, 2064, '暗港跨海大桥', PALETTE.NEON_CYAN_HEX);
    this.addExitMarker(352, 1712, '▼ 暗港集装箱码头', PALETTE.NEON_PINK_HEX);
    this.addExitMarker(2304, 1548, '▶ 铬铁工业区 · 涡轮高速', PALETTE.GOLD_HEX);

    // Bridge side neon edge guides & animated river current ripples
    for (const br of district.bridges) {
      overlayG.lineStyle(2, br.w > 150 ? PALETTE.NEON_CYAN : PALETTE.NEON_PINK, 0.72);
      overlayG.lineBetween(br.x, br.y + 2, br.x + br.w, br.y + 2);
      overlayG.lineBetween(br.x, br.y + br.h - 2, br.x + br.w, br.y + br.h - 2);
    }
    this.spawnRiverRipples();

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

    // 6. Sidewalk Steam Vents
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
    this.playerGlow = this.scene.add.image(800, 608, 'fx_pixel_glow');
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

    // Crisp offset drop shadow
    g.fillStyle(0x04070e, 0.65);
    g.fillRect(b.x + 6, b.y + 6, b.w, b.h);

    // Main structure & stepped parapet bevel
    g.fillStyle(PALETTE.BUILDING, 1);
    g.fillRect(b.x, b.y, b.w, b.h);

    // Subtle interior wall rim
    g.fillStyle(0x28344c, 1);
    g.fillRect(b.x + 2, b.y + 2, b.w - 4, 6);

    // Recessed rooftop deck
    g.fillStyle(PALETTE.BUILDING_ROOF, 1);
    g.fillRect(b.x + 8, b.y + 8, b.w - 16, b.h - 16);

    // Pixel rooftop slab lines
    g.lineStyle(1, 0x1e293b, 0.7);
    for (let rx = b.x + 24; rx < b.x + b.w - 16; rx += 24) {
      g.lineBetween(rx, b.y + 10, rx, b.y + b.h - 10);
    }

    // Glowing building neon outline
    g.lineStyle(2, b.neonColor, 0.95);
    g.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);

    // Style-specific pixel rooftop architecture
    if (b.roofStyle === 'tech') {
      // Server/ventilation housings
      g.fillStyle(PALETTE.BUILDING_INNER, 1);
      g.fillRect(b.x + 16, b.y + 14, 30, 22);
      g.fillRect(b.x + b.w - 46, b.y + 14, 30, 22);
      g.lineStyle(1, b.neonColor, 0.5);
      g.strokeRect(b.x + 16, b.y + 14, 30, 22);
      g.strokeRect(b.x + b.w - 46, b.y + 14, 30, 22);

      // Glowing fiber-optic skylight bar
      g.fillStyle(b.neonColor, 0.28);
      g.fillRect(b.x + 56, b.y + 18, b.w - 112, 8);
      g.fillStyle(b.neonColor, 0.75);
      g.fillRect(b.x + 58, b.y + 21, b.w - 116, 2);
    } else if (b.roofStyle === 'store' || b.roofStyle === 'diner') {
      // Illuminated storefront awning along south edge
      g.fillStyle(b.neonColor, 0.85);
      g.fillRect(b.x + 10, b.y + b.h - 9, b.w - 20, 6);
      g.fillStyle(0x080d18, 0.45);
      for (let ax = b.x + 14; ax < b.x + b.w - 16; ax += 12) {
        g.fillRect(ax, b.y + b.h - 9, 4, 6);
      }

      // Rooftop duct
      g.fillStyle(0x334155, 1);
      g.fillRect(b.x + 18, b.y + 16, 24, 18);
      g.fillStyle(0x0f172a, 1);
      g.fillRect(b.x + 22, b.y + 20, 16, 10);
    } else if (b.roofStyle === 'residential') {
      // Lit apartment skylight windows
      for (let rx = b.x + 20; rx < b.x + b.w - 24; rx += 32) {
        g.fillStyle(PALETTE.NEON_PINK, 0.35);
        g.fillRect(rx, b.y + 20, 16, 12);
        g.fillStyle(PALETTE.GOLD, 0.32);
        g.fillRect(rx, b.y + b.h - 36, 16, 12);
      }
    }

    // Rotating pixel AC fan rotor
    if (b.hasFan) {
      const fan = this.scene.add.image(b.x + b.w - 31, b.y + 25, 'prop_ac_fan');
      fan.setDepth(11);
      this.acFans.push(fan);
    }

    // Building rooftop label
    const roofTitle = this.scene.add.text(b.x + b.w / 2, b.y + b.h / 2 - 4, b.label, {
      fontFamily: '"Chakra Petch", monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: b.accentHex,
      align: 'center',
    });
    roofTitle.setOrigin(0.5);
    roofTitle.setDepth(12);
    roofTitle.setResolution(2);

    // Animated South-Face Neon Sign + Additive Pixel Glow
    const signX = b.x + b.w / 2;
    const signY = b.y + b.h - 1;
    const signW = Math.min(b.w - 24, 96);

    const glow = this.scene.add.image(signX, signY + 4, 'fx_pixel_glow');
    glow.setTint(b.neonColor);
    glow.setAlpha(0.35);
    glow.setScale(signW / 32, 0.9);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(11);

    const signBar = this.scene.add.rectangle(signX, signY, signW, 4, b.neonColor, 0.95);
    signBar.setDepth(13);

    const signLabel = this.scene.add.text(signX, signY - 12, b.signText, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#F8FAFC',
      backgroundColor: '#080D18',
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
    sprite.setDepth(14);

    if (prop.type === 'lamp') {
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
        fontFamily: '"JetBrains Mono", monospace',
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

  private spawnRiverRipples(): void {
    const riverBands = [
      { yMin: 48, yMax: 240 },
      { yMin: 400, yMax: 816 },
      { yMin: 976, yMax: 1552 },
      { yMin: 1712, yMax: 2064 },
      { yMin: 2224, yMax: 2352 },
    ];
    for (const band of riverBands) {
      for (let y = band.yMin; y <= band.yMax; y += 48) {
        const x = 1690 + ((y * 19) % 108);
        const rect = this.scene.add.rectangle(x, y, 3, 14, PALETTE.NEON_CYAN, 0.35);
        rect.setDepth(4);
        this.riverRipples.push({ rect, baseY: y, phase: y * 0.05 });
      }
    }
    for (let x = 532; x <= 716; x += 42) {
      const rect = this.scene.add.rectangle(x, 1372, 12, 2, PALETTE.NEON_CYAN, 0.32);
      rect.setDepth(4);
      this.riverRipples.push({ rect, baseY: 1372, phase: x * 0.06 });
    }
    for (let x = 884; x <= 1068; x += 42) {
      const rect = this.scene.add.rectangle(x, 1376, 12, 2, PALETTE.NEON_CYAN, 0.32);
      rect.setDepth(4);
      this.riverRipples.push({ rect, baseY: 1376, phase: x * 0.06 });
    }
  }

  private drawMountain(m: MountainDef): void {
    const g = this.scene.add.graphics();
    g.setDepth(10);

    // Base drop shadow
    g.fillStyle(0x04070e, 0.6);
    g.fillRect(m.x + 8, m.y + 8, m.w, m.h);

    // Lower rock cliff plateau
    g.fillStyle(0x222c3f, 1);
    g.fillRect(m.x, m.y, m.w, m.h);
    g.lineStyle(2, 0x3b4d6b, 0.9);
    g.strokeRect(m.x + 1, m.y + 1, m.w - 2, m.h - 2);

    // Tier 2 cliff terrace
    const t2x = m.x + 14;
    const t2y = m.y + 14;
    const t2w = Math.max(20, m.w - 28);
    const t2h = Math.max(20, m.h - 28);
    g.fillStyle(0x2f3e59, 1);
    g.fillRect(t2x, t2y, t2w, t2h);
    g.lineStyle(1, 0x64748b, 0.65);
    g.strokeRect(t2x, t2y, t2w, t2h);

    // Tier 3 ridge summit
    const t3x = m.x + 28;
    const t3y = m.y + 28;
    const t3w = Math.max(12, m.w - 56);
    const t3h = Math.max(12, m.h - 56);
    if (t3w > 14 && t3h > 14) {
      g.fillStyle(0x475b7f, 1);
      g.fillRect(t3x, t3y, t3w, t3h);
      g.fillStyle(0x94a3b8, 0.35);
      g.fillRect(t3x + 4, t3y + 4, Math.max(8, t3w - 8), 8);
    }

    // Glowing mineral fissure & summit beacon
    g.fillStyle(PALETTE.NEON_CYAN, 0.45);
    g.fillRect(m.x + 18, m.y + Math.floor(m.h * 0.45), 10, 3);
    g.fillRect(m.x + m.w - 26, m.y + Math.floor(m.h * 0.65), 8, 3);

    const glow = this.scene.add.image(m.x + m.w / 2, m.y + m.h / 2, 'fx_pixel_glow');
    glow.setTint(PALETTE.NEON_CYAN);
    glow.setAlpha(0.22);
    glow.setScale(1.3);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(11);

    const label = this.scene.add.text(
      m.x + m.w / 2,
      m.y + m.h / 2,
      `${m.name}\n海拔 ${m.elevation}m`,
      {
        fontFamily: '"Noto Sans SC", monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#CBD5E1',
        align: 'center',
        backgroundColor: '#080D1899',
        padding: { x: 4, y: 2 },
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

    // 2. Rotate rooftop AC fans
    const fanDelta = dtSeconds * 4.2;
    for (const fan of this.acFans) {
      fan.rotation += fanDelta;
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
