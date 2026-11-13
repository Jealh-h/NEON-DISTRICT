import Phaser from 'phaser';
import { PALETTE, PLAYER_CONFIG } from '../config/BalanceConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    this.load.tilemapTiledJSON('neon_plaza_map', 'maps/neon_plaza.json');
  }

  public create(): void {
    this.createTilesetTexture();
    this.createPlayerTextures();
    this.createNpcTextures();
    this.createVehicleTextures();
    this.createEnemyAndPickupTextures();
    this.createPropTextures();
    this.createFxTextures();

    this.scene.start('CityScene');
  }

  private createTilesetTexture(): void {
    const tile = 32;
    const cols = 8;
    const rows = 6;
    const tex = this.textures.createCanvas('neon_tileset', cols * tile, rows * tile);
    if (!tex) return;

    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cols * tile, rows * tile);

    const tileOrigin = (gid: number): { ox: number; oy: number } => {
      const idx = gid - 1;
      return { ox: (idx % cols) * tile, oy: Math.floor(idx / cols) * tile };
    };

    const drawAsphaltBase = (ox: number, oy: number, dark: boolean) => {
      ctx.fillStyle = dark ? '#111726' : '#151C2B';
      ctx.fillRect(ox, oy, 32, 32);
      // Deterministic asphalt pixel grit
      ctx.fillStyle = dark ? '#0C111D' : '#1A2336';
      const specks = [
        [3, 5], [11, 2], [21, 9], [28, 4], [7, 15], [16, 19],
        [25, 14], [4, 26], [13, 28], [22, 24], [29, 29], [18, 8],
      ];
      for (const [sx, sy] of specks) {
        ctx.fillRect(ox + sx, oy + sy, 2, 1);
      }
    };

    // 1: ASPHALT_PLAIN
    {
      const { ox, oy } = tileOrigin(1);
      drawAsphaltBase(ox, oy, false);
    }

    // 2: ASPHALT_WORN
    {
      const { ox, oy } = tileOrigin(2);
      drawAsphaltBase(ox, oy, true);
      ctx.fillStyle = '#0B0F1A';
      ctx.fillRect(ox, oy + 6, 32, 4);
      ctx.fillRect(ox, oy + 22, 32, 4);
    }

    // 3: ROAD_DASH_H
    {
      const { ox, oy } = tileOrigin(3);
      drawAsphaltBase(ox, oy, false);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 2, oy + 29, 12, 3);
      ctx.fillRect(ox + 18, oy + 29, 12, 3);
    }

    // 4: ROAD_DASH_V
    {
      const { ox, oy } = tileOrigin(4);
      drawAsphaltBase(ox, oy, false);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 29, oy + 2, 3, 12);
      ctx.fillRect(ox + 29, oy + 18, 3, 12);
    }

    // 5: CROSSWALK_H (stripes along X for crossing vertical streets)
    {
      const { ox, oy } = tileOrigin(5);
      drawAsphaltBase(ox, oy, true);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(ox + 4, oy + 6, 8, 20);
      ctx.fillRect(ox + 20, oy + 6, 8, 20);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox + 4, oy + 6, 8, 2);
      ctx.fillRect(ox + 20, oy + 6, 8, 2);
    }

    // 6: CROSSWALK_V (stripes along Y for crossing horizontal avenues)
    {
      const { ox, oy } = tileOrigin(6);
      drawAsphaltBase(ox, oy, true);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(ox + 6, oy + 4, 20, 8);
      ctx.fillRect(ox + 6, oy + 20, 20, 8);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox + 6, oy + 4, 2, 8);
      ctx.fillRect(ox + 6, oy + 20, 2, 8);
    }

    // 7: ROAD_ARROW_E (transparent overlay)
    {
      const { ox, oy } = tileOrigin(7);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.45)';
      ctx.fillRect(ox + 6, oy + 14, 14, 4);
      ctx.fillRect(ox + 16, oy + 10, 4, 12);
      ctx.fillRect(ox + 20, oy + 12, 4, 8);
      ctx.fillRect(ox + 24, oy + 14, 3, 4);
    }

    // 8: ROAD_ARROW_W (transparent overlay)
    {
      const { ox, oy } = tileOrigin(8);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.45)';
      ctx.fillRect(ox + 12, oy + 14, 14, 4);
      ctx.fillRect(ox + 12, oy + 10, 4, 12);
      ctx.fillRect(ox + 8, oy + 12, 4, 8);
      ctx.fillRect(ox + 5, oy + 14, 3, 4);
    }

    // 9: SIDEWALK_BASE
    {
      const { ox, oy } = tileOrigin(9);
      ctx.fillStyle = '#1C2538';
      ctx.fillRect(ox, oy, 32, 32);
      // 16x16 slab seams
      ctx.fillStyle = '#141B2B';
      ctx.fillRect(ox, oy + 15, 32, 1);
      ctx.fillRect(ox + 15, oy, 1, 32);
      ctx.fillRect(ox, oy + 31, 32, 1);
      ctx.fillRect(ox + 31, oy, 1, 32);
      // Subtle top-left slab bevel highlights
      ctx.fillStyle = '#253047';
      ctx.fillRect(ox + 1, oy + 1, 13, 1);
      ctx.fillRect(ox + 17, oy + 1, 13, 1);
      ctx.fillRect(ox + 1, oy + 17, 13, 1);
      ctx.fillRect(ox + 17, oy + 17, 13, 1);
    }

    // 10: SIDEWALK_CURB_TOP
    {
      const { ox, oy } = tileOrigin(10);
      ctx.fillStyle = '#1C2538';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#2B3650';
      ctx.fillRect(ox, oy, 32, 4);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox, oy, 32, 1);
    }

    // 11: SIDEWALK_CURB_BOTTOM
    {
      const { ox, oy } = tileOrigin(11);
      ctx.fillStyle = '#1C2538';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#2B3650';
      ctx.fillRect(ox, oy + 28, 32, 4);
    }

    // 12: PLAZA_TILE_DARK
    {
      const { ox, oy } = tileOrigin(12);
      ctx.fillStyle = '#182034';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#111728';
      ctx.fillRect(ox, oy, 32, 1);
      ctx.fillRect(ox, oy, 1, 32);
      ctx.fillStyle = '#24304D';
      ctx.fillRect(ox + 8, oy + 8, 16, 16);
      ctx.fillStyle = '#182034';
      ctx.fillRect(ox + 10, oy + 10, 12, 12);
    }

    // 13: PLAZA_TILE_NEON_P
    {
      const { ox, oy } = tileOrigin(13);
      ctx.fillStyle = '#1A1E36';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#C000FF';
      ctx.fillRect(ox + 2, oy + 2, 28, 2);
      ctx.fillRect(ox + 2, oy + 28, 28, 2);
      ctx.fillRect(ox + 14, oy + 14, 4, 4);
    }

    // 14: PLAZA_TILE_NEON_K
    {
      const { ox, oy } = tileOrigin(14);
      ctx.fillStyle = '#1A1E36';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(ox + 2, oy + 2, 2, 28);
      ctx.fillRect(ox + 28, oy + 2, 2, 28);
      ctx.fillRect(ox + 14, oy + 14, 4, 4);
    }

    // 15: PARKING_TARMAC
    {
      const { ox, oy } = tileOrigin(15);
      ctx.fillStyle = '#0F1522';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#182135';
      ctx.fillRect(ox + 4, oy + 10, 4, 2);
      ctx.fillRect(ox + 20, oy + 22, 3, 2);
    }

    // 16: PARKING_STALL
    {
      const { ox, oy } = tileOrigin(16);
      ctx.fillStyle = '#0F1522';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox, oy, 32, 2);
      ctx.fillRect(ox, oy + 30, 32, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(ox + 24, oy + 6, 4, 20);
    }

    // 17: BORDER_HAZARD
    {
      const { ox, oy } = tileOrigin(17);
      ctx.fillStyle = '#080D18';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#1B1030';
      ctx.fillRect(ox + 2, oy + 2, 28, 28);
      ctx.fillStyle = '#C000FF';
      ctx.fillRect(ox + 4, oy + 4, 8, 4);
      ctx.fillRect(ox + 20, oy + 4, 8, 4);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 12, oy + 24, 8, 4);
    }

    // 18: MANHOLE_GRATE (transparent overlay)
    {
      const { ox, oy } = tileOrigin(18);
      ctx.fillStyle = '#090D16';
      ctx.fillRect(ox + 8, oy + 8, 16, 16);
      ctx.fillStyle = '#334155';
      ctx.fillRect(ox + 9, oy + 9, 14, 14);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(ox + 11, oy + 11, 10, 2);
      ctx.fillRect(ox + 11, oy + 15, 10, 2);
      ctx.fillRect(ox + 11, oy + 19, 10, 2);
    }

    // 19: PUDDLE_CYAN (transparent overlay)
    {
      const { ox, oy } = tileOrigin(19);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.18)';
      ctx.fillRect(ox + 4, oy + 10, 22, 10);
      ctx.fillRect(ox + 8, oy + 8, 14, 14);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.48)';
      ctx.fillRect(ox + 10, oy + 12, 8, 2);
      ctx.fillRect(ox + 14, oy + 16, 6, 1);
    }

    // 20: PUDDLE_PINK (transparent overlay)
    {
      const { ox, oy } = tileOrigin(20);
      ctx.fillStyle = 'rgba(255, 46, 136, 0.18)';
      ctx.fillRect(ox + 6, oy + 8, 20, 12);
      ctx.fillRect(ox + 10, oy + 6, 12, 16);
      ctx.fillStyle = 'rgba(255, 46, 136, 0.45)';
      ctx.fillRect(ox + 10, oy + 13, 10, 2);
    }

    // 21: SIDEWALK_DRAIN (transparent overlay)
    {
      const { ox, oy } = tileOrigin(21);
      ctx.fillStyle = '#090D16';
      ctx.fillRect(ox + 6, oy + 10, 20, 12);
      ctx.fillStyle = '#475569';
      for (let gx = 8; gx <= 22; gx += 4) {
        ctx.fillRect(ox + gx, oy + 12, 2, 8);
      }
    }

    // 22: PLAZA_CENTER_CREST
    {
      const { ox, oy } = tileOrigin(22);
      ctx.fillStyle = '#182034';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox + 2, oy + 2, 28, 2);
      ctx.fillRect(ox + 2, oy + 28, 28, 2);
      ctx.fillRect(ox + 2, oy + 2, 2, 28);
      ctx.fillRect(ox + 28, oy + 2, 2, 28);
      ctx.fillStyle = '#C000FF';
      ctx.fillRect(ox + 8, oy + 8, 16, 16);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox + 12, oy + 12, 8, 8);
    }

    // 23: ROAD_STOP_LINE_H (transparent overlay)
    {
      const { ox, oy } = tileOrigin(23);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.fillRect(ox + 2, oy + 14, 28, 4);
    }

    // 24: ROAD_STOP_LINE_V (transparent overlay)
    {
      const { ox, oy } = tileOrigin(24);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.fillRect(ox + 14, oy + 2, 4, 28);
    }

    // 25: ALLEY_PAVER
    {
      const { ox, oy } = tileOrigin(25);
      ctx.fillStyle = '#141A29';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#1D253A';
      ctx.fillRect(ox + 2, oy + 2, 12, 6);
      ctx.fillRect(ox + 18, oy + 2, 12, 6);
      ctx.fillRect(ox + 8, oy + 12, 14, 6);
      ctx.fillRect(ox + 2, oy + 22, 12, 6);
      ctx.fillRect(ox + 18, oy + 22, 12, 6);
    }

    // 26: DISTRICT_GATE_W (transparent overlay)
    {
      const { ox, oy } = tileOrigin(26);
      ctx.fillStyle = '#C000FF';
      ctx.fillRect(ox, oy + 2, 6, 10);
      ctx.fillRect(ox, oy + 20, 6, 10);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 8, oy + 12, 4, 8);
    }

    // 27: DISTRICT_GATE_S (transparent overlay)
    {
      const { ox, oy } = tileOrigin(27);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(ox + 2, oy + 26, 10, 6);
      ctx.fillRect(ox + 20, oy + 26, 10, 6);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 12, oy + 20, 8, 4);
    }

    // 28: GARAGE_APRON
    {
      const { ox, oy } = tileOrigin(28);
      ctx.fillStyle = '#151C2B';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox, oy + 26, 8, 4);
      ctx.fillRect(ox + 16, oy + 26, 8, 4);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox + 8, oy + 26, 8, 4);
      ctx.fillRect(ox + 24, oy + 26, 8, 4);
    }

    // 29: RIVER_DEEP
    {
      const { ox, oy } = tileOrigin(29);
      ctx.fillStyle = '#071E36';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#0B2B4B';
      ctx.fillRect(ox + 2, oy + 6, 12, 3);
      ctx.fillRect(ox + 16, oy + 18, 12, 3);
      ctx.fillRect(ox + 6, oy + 26, 10, 2);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.25)';
      ctx.fillRect(ox + 4, oy + 7, 6, 1);
      ctx.fillRect(ox + 18, oy + 19, 7, 1);
    }

    // 30: RIVER_SHORE
    {
      const { ox, oy } = tileOrigin(30);
      ctx.fillStyle = '#0B2742';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#243147';
      ctx.fillRect(ox + 2, oy + 2, 28, 28);
      ctx.fillStyle = '#364966';
      ctx.fillRect(ox + 4, oy + 4, 24, 24);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox + 2, oy + 2, 28, 1);
      ctx.fillRect(ox + 2, oy + 29, 28, 1);
    }

    // 31: BRIDGE_DECK
    {
      const { ox, oy } = tileOrigin(31);
      ctx.fillStyle = '#1B2436';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#25324B';
      ctx.fillRect(ox + 1, oy + 2, 14, 28);
      ctx.fillRect(ox + 17, oy + 2, 14, 28);
      ctx.fillStyle = '#0F1624';
      ctx.fillRect(ox + 15, oy, 2, 32);
      ctx.fillStyle = '#334155';
      ctx.fillRect(ox + 4, oy + 6, 8, 2);
      ctx.fillRect(ox + 20, oy + 22, 8, 2);
    }

    // 32: BRIDGE_RAIL
    {
      const { ox, oy } = tileOrigin(32);
      ctx.fillStyle = '#071E36';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#27344B';
      ctx.fillRect(ox, oy + 8, 32, 16);
      ctx.fillStyle = '#475569';
      ctx.fillRect(ox + 2, oy + 10, 28, 12);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 2, oy + 14, 10, 4);
      ctx.fillRect(ox + 20, oy + 14, 10, 4);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox, oy + 8, 32, 1);
      ctx.fillRect(ox, oy + 23, 32, 1);
    }

    // 33: MOUNTAIN_BASE (Highland slate gravel)
    {
      const { ox, oy } = tileOrigin(33);
      ctx.fillStyle = '#181F2D';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#222C3F';
      ctx.fillRect(ox + 4, oy + 5, 6, 4);
      ctx.fillRect(ox + 18, oy + 12, 8, 5);
      ctx.fillRect(ox + 8, oy + 22, 7, 4);
      ctx.fillStyle = '#121824';
      ctx.fillRect(ox + 14, oy + 4, 3, 2);
      ctx.fillRect(ox + 24, oy + 24, 4, 3);
    }

    // 34: MOUNTAIN_CLIFF (Stepped faceted rock)
    {
      const { ox, oy } = tileOrigin(34);
      ctx.fillStyle = '#263044';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#33415A';
      ctx.fillRect(ox + 2, oy + 2, 28, 22);
      ctx.fillStyle = '#192132';
      ctx.fillRect(ox, oy + 24, 32, 8);
      ctx.fillStyle = '#475978';
      ctx.fillRect(ox + 4, oy + 4, 10, 6);
      ctx.fillRect(ox + 18, oy + 10, 10, 6);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox + 8, oy + 14, 4, 2);
    }

    // 35: MOUNTAIN_PEAK
    {
      const { ox, oy } = tileOrigin(35);
      ctx.fillStyle = '#33415A';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#4A5D7F';
      ctx.fillRect(ox + 4, oy + 4, 24, 24);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(ox + 8, oy + 6, 16, 10);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(ox + 11, oy + 7, 10, 5);
    }

    // 36: PARK_TURF (Cyber emerald park turf)
    {
      const { ox, oy } = tileOrigin(36);
      ctx.fillStyle = '#0D262B';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#13373E';
      ctx.fillRect(ox + 4, oy + 6, 4, 2);
      ctx.fillRect(ox + 18, oy + 14, 5, 2);
      ctx.fillRect(ox + 9, oy + 24, 4, 2);
      ctx.fillRect(ox + 24, oy + 5, 3, 2);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox + 20, oy + 13, 1, 1);
      ctx.fillRect(ox + 5, oy + 5, 1, 1);
    }

    // 37: WOOD_PIER (Synthetic timber dock/footbridge)
    {
      const { ox, oy } = tileOrigin(37);
      ctx.fillStyle = '#2B1F24';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#473239';
      for (let py = 1; py < 32; py += 6) {
        ctx.fillRect(ox + 1, oy + py, 30, 4);
      }
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(ox, oy, 32, 1);
      ctx.fillRect(ox, oy + 31, 32, 1);
    }

    // 38: RIVER_FOAM (transparent overlay)
    {
      const { ox, oy } = tileOrigin(38);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.35)';
      ctx.fillRect(ox + 4, oy + 10, 14, 2);
      ctx.fillRect(ox + 14, oy + 20, 12, 2);
      ctx.fillStyle = 'rgba(224, 255, 255, 0.45)';
      ctx.fillRect(ox + 8, oy + 10, 5, 1);
      ctx.fillRect(ox + 18, oy + 20, 4, 1);
    }

    // 39: NITRO_PAD (Glowing Turbo Boost Strip on asphalt)
    {
      const { ox, oy } = tileOrigin(39);
      drawAsphaltBase(ox, oy, true);
      ctx.fillStyle = '#07222B';
      ctx.fillRect(ox + 2, oy + 2, 28, 28);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox + 4, oy + 4, 24, 2);
      ctx.fillRect(ox + 4, oy + 26, 24, 2);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 8, oy + 10, 6, 4);
      ctx.fillRect(ox + 12, oy + 14, 6, 4);
      ctx.fillRect(ox + 8, oy + 18, 6, 4);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox + 18, oy + 10, 6, 4);
      ctx.fillRect(ox + 22, oy + 14, 6, 4);
      ctx.fillRect(ox + 18, oy + 18, 6, 4);
    }

    // 40: RAMP_TILE (Stunt Jump Ramp)
    {
      const { ox, oy } = tileOrigin(40);
      drawAsphaltBase(ox, oy, true);
      ctx.fillStyle = '#334155';
      ctx.fillRect(ox + 2, oy + 2, 28, 28);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(ox + 2, oy + 2, 28, 3);
      ctx.fillRect(ox + 2, oy + 27, 28, 3);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 6, oy + 8, 20, 4);
      ctx.fillRect(ox + 10, oy + 14, 14, 4);
      ctx.fillRect(ox + 6, oy + 20, 20, 4);
    }

    // 41: DOCK_CONCRETE (Industrial harbor slab)
    {
      const { ox, oy } = tileOrigin(41);
      ctx.fillStyle = '#171E2C';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#0E131E';
      ctx.fillRect(ox, oy + 31, 32, 1);
      ctx.fillRect(ox + 31, oy, 1, 32);
      ctx.fillStyle = '#232D42';
      ctx.fillRect(ox + 4, oy + 4, 8, 2);
      ctx.fillRect(ox + 18, oy + 20, 6, 2);
    }

    // 42: HELIPAD_TILE (Glowing H landing circle mark)
    {
      const { ox, oy } = tileOrigin(42);
      ctx.fillStyle = '#121826';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 4, oy + 4, 24, 2);
      ctx.fillRect(ox + 4, oy + 26, 24, 2);
      ctx.fillRect(ox + 9, oy + 9, 3, 14);
      ctx.fillRect(ox + 20, oy + 9, 3, 14);
      ctx.fillRect(ox + 12, oy + 15, 8, 3);
    }

    // 43: CHROME_FLOOR (Industrial cyber factory floor)
    {
      const { ox, oy } = tileOrigin(43);
      ctx.fillStyle = '#151A28';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#232B42';
      ctx.fillRect(ox + 2, oy + 2, 28, 28);
      ctx.fillStyle = '#C000FF';
      ctx.fillRect(ox + 4, oy + 4, 4, 2);
      ctx.fillRect(ox + 24, oy + 26, 4, 2);
    }

    // 44: SAND_SHORE (Harbor seawall / sand edge)
    {
      const { ox, oy } = tileOrigin(44);
      ctx.fillStyle = '#142B3E';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#2A3E52';
      ctx.fillRect(ox, oy, 32, 20);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(ox, oy + 20, 32, 2);
    }

    tex.refresh();
  }

  private createPlayerTextures(): void {
    const size = PLAYER_CONFIG.SPRITE_SIZE;

    const frames: Array<{ key: string; leftFootOffset: number; rightFootOffset: number; leftArmOffset: number; rightArmOffset: number }> = [
      { key: 'player_idle', leftFootOffset: 0, rightFootOffset: 0, leftArmOffset: 0, rightArmOffset: 0 },
      { key: 'player_walk_1', leftFootOffset: 3, rightFootOffset: -3, leftArmOffset: -2, rightArmOffset: 2 },
      { key: 'player_walk_2', leftFootOffset: -3, rightFootOffset: 3, leftArmOffset: 2, rightArmOffset: -2 },
      { key: 'player_walk_3', leftFootOffset: 1, rightFootOffset: -1, leftArmOffset: -1, rightArmOffset: 1 },
    ];

    for (const frame of frames) {
      const tex = this.textures.createCanvas(frame.key, size, size);
      if (!tex) continue;
      const ctx = tex.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);

      ctx.fillStyle = '#0F172A';
      ctx.fillRect(10 + frame.leftFootOffset, 6, 5, 4);
      ctx.fillRect(10 + frame.rightFootOffset, 18, 5, 4);

      ctx.fillStyle = '#1E293B';
      ctx.fillRect(10 + frame.leftArmOffset, 4, 7, 4);
      ctx.fillRect(10 + frame.rightArmOffset, 20, 7, 4);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(15 + frame.leftArmOffset, 5, 2, 2);
      ctx.fillRect(15 + frame.rightArmOffset, 21, 2, 2);

      ctx.fillStyle = '#141B2D';
      ctx.fillRect(7, 7, 12, 14);
      ctx.fillStyle = '#2B3A55';
      ctx.fillRect(8, 8, 9, 12);
      ctx.fillStyle = '#C000FF';
      ctx.fillRect(7, 9, 2, 10);

      ctx.fillStyle = '#0B1120';
      ctx.fillRect(10, 9, 9, 10);
      ctx.fillStyle = '#334155';
      ctx.fillRect(11, 10, 7, 8);

      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(17, 11, 3, 6);
      ctx.fillStyle = '#E0FFFF';
      ctx.fillRect(18, 12, 1, 4);

      tex.refresh();
    }
  }

  private createVehicleTextures(): void {
    // 1. City Compact (44x24, facing RIGHT +X)
    {
      const tex = this.textures.createCanvas('veh_compact', 44, 24);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        // Tires
        ctx.fillStyle = '#070B14';
        ctx.fillRect(7, 1, 9, 3);
        ctx.fillRect(28, 1, 9, 3);
        ctx.fillRect(7, 20, 9, 3);
        ctx.fillRect(28, 20, 9, 3);
        // Body shell
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(3, 3, 38, 18);
        ctx.fillStyle = '#2A3A54';
        ctx.fillRect(5, 4, 34, 16);
        // Neon cyan side trim
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(6, 3, 28, 1);
        ctx.fillRect(6, 20, 28, 1);
        // Cabin & roof
        ctx.fillStyle = '#141C2E';
        ctx.fillRect(10, 6, 17, 12);
        // Windshield & rear glass
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(25, 6, 6, 12);
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(26, 7, 4, 10);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(7, 7, 3, 10);
        // Headlights & taillights
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(39, 5, 2, 4);
        ctx.fillRect(39, 15, 2, 4);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(3, 5, 2, 4);
        ctx.fillRect(3, 15, 2, 4);
        tex.refresh();
      }
    }

    // 2. Street Racer (48x24, facing RIGHT +X)
    {
      const tex = this.textures.createCanvas('veh_racer', 48, 24);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        // Wide slick tires
        ctx.fillStyle = '#070B14';
        ctx.fillRect(8, 1, 10, 3);
        ctx.fillRect(31, 1, 10, 3);
        ctx.fillRect(8, 20, 10, 3);
        ctx.fillRect(31, 20, 10, 3);
        // Sleek aero chassis
        ctx.fillStyle = '#151226';
        ctx.fillRect(2, 3, 44, 18);
        ctx.fillStyle = '#241B3E';
        ctx.fillRect(4, 4, 40, 16);
        // Twin racing stripes (Neon Pink + Purple)
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(6, 8, 36, 2);
        ctx.fillRect(6, 14, 36, 2);
        // Rear spoiler
        ctx.fillStyle = '#C000FF';
        ctx.fillRect(2, 3, 3, 18);
        // Low cockpit canopy
        ctx.fillStyle = '#0B1120';
        ctx.fillRect(14, 6, 16, 12);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(25, 7, 5, 10);
        // Front splitter + headlights
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(44, 4, 2, 16);
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(44, 5, 2, 4);
        ctx.fillRect(44, 15, 2, 4);
        // Taillights
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(3, 5, 2, 4);
        ctx.fillRect(3, 15, 2, 4);
        tex.refresh();
      }
    }

    // 3. Police Cruiser (48x26, facing RIGHT +X)
    {
      const tex = this.textures.createCanvas('veh_cruiser', 48, 26);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        // Tires
        ctx.fillStyle = '#070B14';
        ctx.fillRect(8, 1, 10, 3);
        ctx.fillRect(30, 1, 10, 3);
        ctx.fillRect(8, 22, 10, 3);
        ctx.fillRect(30, 22, 10, 3);
        // Heavy armored frame
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(3, 3, 42, 20);
        // White patrol doors / roof center
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(14, 4, 18, 18);
        // Dark hood & trunk
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(32, 4, 12, 18);
        ctx.fillRect(4, 4, 10, 18);
        // Push-bar bumper
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(45, 6, 2, 14);
        // Windshield
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(27, 6, 5, 14);
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(28, 7, 3, 12);
        // Rooftop Lightbar housing (red & cyan/blue)
        ctx.fillStyle = '#0B1120';
        ctx.fillRect(19, 6, 4, 14);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(19, 7, 4, 6);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(19, 13, 4, 6);
        // Headlights & taillights
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(43, 5, 2, 4);
        ctx.fillRect(43, 17, 2, 4);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(3, 5, 2, 4);
        ctx.fillRect(3, 17, 2, 4);
        tex.refresh();
      }
    }

    // 4. Cyber Metro Cab (Traffic AI vehicle, 44x24 facing RIGHT +X)
    {
      const tex = this.textures.createCanvas('veh_traffic', 44, 24);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#070B14';
        ctx.fillRect(7, 1, 9, 3);
        ctx.fillRect(28, 1, 9, 3);
        ctx.fillRect(7, 20, 9, 3);
        ctx.fillRect(28, 20, 9, 3);
        ctx.fillStyle = '#2B2518';
        ctx.fillRect(3, 3, 38, 18);
        ctx.fillStyle = '#D99B26';
        ctx.fillRect(6, 4, 32, 16);
        ctx.fillStyle = '#141C2E';
        ctx.fillRect(11, 6, 16, 12);
        // Taxi roof sign
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(16, 9, 4, 6);
        // Windshield
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(25, 7, 5, 10);
        // Lights
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(39, 5, 2, 4);
        ctx.fillRect(39, 15, 2, 4);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(3, 5, 2, 4);
        ctx.fillRect(3, 15, 2, 4);
        tex.refresh();
      }
    }

    // 5. Phantom Supercar GT-X (50x24 facing RIGHT +X)
    {
      const tex = this.textures.createCanvas('veh_super', 50, 24);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        // Wide rear & front slicks
        ctx.fillStyle = '#070B14';
        ctx.fillRect(8, 1, 11, 3);
        ctx.fillRect(31, 1, 11, 3);
        ctx.fillRect(8, 20, 11, 3);
        ctx.fillRect(31, 20, 11, 3);
        // Hypercar wedge chassis
        ctx.fillStyle = '#181828';
        ctx.fillRect(2, 3, 46, 18);
        ctx.fillStyle = '#292942';
        ctx.fillRect(5, 4, 40, 16);
        // Gold & Cyan aero accent lines
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(4, 5, 40, 2);
        ctx.fillRect(4, 17, 40, 2);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(10, 11, 28, 2);
        // Teardrop glass cockpit
        ctx.fillStyle = '#090D18';
        ctx.fillRect(16, 6, 17, 12);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(26, 7, 6, 10);
        // Active aero wing & exhausts
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(1, 3, 3, 18);
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(46, 5, 2, 4);
        ctx.fillRect(46, 15, 2, 4);
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(2, 6, 2, 3);
        ctx.fillRect(2, 15, 2, 3);
        tex.refresh();
      }
    }

    // 6. Cyber Neon Moto (30x14 facing RIGHT +X)
    {
      const tex = this.textures.createCanvas('veh_moto', 30, 14);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        // Front & rear fat tires
        ctx.fillStyle = '#070B14';
        ctx.fillRect(2, 4, 7, 6);
        ctx.fillRect(21, 4, 7, 6);
        // Sleek fairing frame
        ctx.fillStyle = '#23163D';
        ctx.fillRect(6, 3, 18, 8);
        ctx.fillStyle = '#C000FF';
        ctx.fillRect(7, 3, 15, 2);
        ctx.fillRect(7, 9, 15, 2);
        // Neon cyan wheel rims + rider seat
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(4, 6, 3, 2);
        ctx.fillRect(23, 6, 3, 2);
        ctx.fillStyle = '#0B1120';
        ctx.fillRect(10, 5, 7, 4);
        // Headlight & tail
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(26, 5, 2, 4);
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(2, 5, 2, 4);
        tex.refresh();
      }
    }
  }

  private createEnemyAndPickupTextures(): void {
    // 1. Cyber Raider (26x26)
    {
      const tex = this.textures.createCanvas('enemy_raider', 26, 26);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#1E1B2E';
        ctx.fillRect(6, 5, 13, 16);
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(6, 7, 3, 12);
        ctx.fillRect(15, 4, 5, 4);
        ctx.fillRect(15, 18, 5, 4);
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(9, 8, 9, 10);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(16, 10, 4, 6);
        tex.refresh();
      }
    }

    // 2. Hunter Drone (26x26)
    {
      const tex = this.textures.createCanvas('enemy_drone', 26, 26);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(4, 4, 6, 6);
        ctx.fillRect(16, 4, 6, 6);
        ctx.fillRect(4, 16, 6, 6);
        ctx.fillRect(16, 16, 6, 6);
        ctx.fillStyle = '#334155';
        ctx.fillRect(7, 7, 12, 12);
        ctx.fillStyle = '#C000FF';
        ctx.fillRect(9, 9, 8, 8);
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(15, 11, 5, 4);
        tex.refresh();
      }
    }

    // 3. Heavy Cyber Brute (34x34)
    {
      const tex = this.textures.createCanvas('enemy_brute', 34, 34);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#2D1422';
        ctx.fillRect(5, 4, 22, 26);
        ctx.fillStyle = '#4A1D33';
        ctx.fillRect(7, 6, 18, 22);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(6, 6, 4, 22);
        ctx.fillRect(21, 5, 7, 6);
        ctx.fillRect(21, 23, 7, 6);
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(24, 13, 5, 8);
        tex.refresh();
      }
    }

    // 4. Ironclad Mech Boss (46x46)
    {
      const tex = this.textures.createCanvas('enemy_boss', 46, 46);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#1A1124';
        ctx.fillRect(6, 4, 32, 38);
        ctx.fillStyle = '#332047';
        ctx.fillRect(9, 7, 26, 32);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(7, 8, 5, 30);
        // Twin shoulder cannons
        ctx.fillStyle = '#475569';
        ctx.fillRect(24, 3, 18, 7);
        ctx.fillRect(24, 36, 18, 7);
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(38, 4, 5, 5);
        ctx.fillRect(38, 37, 5, 5);
        // Glowing core visor
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(28, 16, 8, 14);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(31, 19, 3, 8);
        tex.refresh();
      }
    }

    // Enemy plasma projectile (10x10)
    {
      const tex = this.textures.createCanvas('proj_enemy', 10, 10);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(1, 1, 8, 8);
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(3, 3, 4, 4);
        tex.refresh();
      }
    }

    // World Pickups (18x18)
    const makePickup = (key: string, bg: string, border: string, inner: string) => {
      const tex = this.textures.createCanvas(key, 18, 18);
      if (!tex) return;
      const ctx = tex.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#080D18';
      ctx.fillRect(1, 1, 16, 16);
      ctx.fillStyle = border;
      ctx.fillRect(2, 2, 14, 14);
      ctx.fillStyle = bg;
      ctx.fillRect(4, 4, 10, 10);
      ctx.fillStyle = inner;
      ctx.fillRect(7, 6, 4, 6);
      ctx.fillRect(6, 7, 6, 4);
      tex.refresh();
    };
    makePickup('pickup_cash', '#1E293B', '#FFD166', '#FFD166');
    makePickup('pickup_medkit', '#0F2E28', '#00F5FF', '#FF4545');
    makePickup('pickup_ammo', '#2D1A2B', '#FF2E88', '#FFD166');
    makePickup('pickup_chip', '#1A1038', '#C000FF', '#00F5FF');
    makePickup('pickup_overdrive', '#36131E', '#FF2E88', '#FFFFFF');
  }

  private createNpcTextures(): void {
    const palettes = [
      { coat: '#2D2042', trim: '#FF2E88', visor: '#FF2E88' }, // Neon Pink streetwalker
      { coat: '#1A3442', trim: '#00F5FF', visor: '#FFD166' }, // Cyan/Gold courier
      { coat: '#27293D', trim: '#C000FF', visor: '#00F5FF' }, // Purple corp tech
    ];

    palettes.forEach((pal, idx) => {
      for (let frame = 0; frame < 2; frame++) {
        const key = `npc_${idx}_${frame === 0 ? 'idle' : 'walk'}`;
        const tex = this.textures.createCanvas(key, 24, 24);
        if (!tex) continue;
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 24, 24);

        const stride = frame === 0 ? 0 : 2;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(8 + stride, 5, 4, 3);
        ctx.fillRect(8 - stride, 16, 4, 3);

        ctx.fillStyle = pal.coat;
        ctx.fillRect(6, 6, 10, 12);
        ctx.fillStyle = pal.trim;
        ctx.fillRect(6, 8, 2, 8);

        ctx.fillStyle = '#0B1120';
        ctx.fillRect(9, 8, 7, 8);
        ctx.fillStyle = '#475569';
        ctx.fillRect(10, 9, 5, 6);

        ctx.fillStyle = pal.visor;
        ctx.fillRect(14, 10, 2, 4);

        tex.refresh();
      }
    });
  }

  private createPropTextures(): void {
    // Streetlamp
    const lamp = this.textures.createCanvas('prop_lamp', 16, 16);
    if (lamp) {
      const ctx = lamp.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(5, 5, 6, 6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, 6, 4, 4);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(7, 7, 2, 2);
      lamp.refresh();
    }

    // Vending Machine
    const vending = this.textures.createCanvas('prop_vending', 24, 24);
    if (vending) {
      const ctx = vending.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(2, 2, 20, 20);
      ctx.fillStyle = '#28334A';
      ctx.fillRect(3, 3, 18, 18);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(5, 5, 14, 6);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(6, 13, 12, 5);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(7, 6, 3, 2);
      ctx.fillRect(12, 6, 3, 2);
      vending.refresh();
    }

    // Planter Box
    const planter = this.textures.createCanvas('prop_planter', 28, 28);
    if (planter) {
      const ctx = planter.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(2, 2, 24, 24);
      ctx.fillStyle = '#C000FF';
      ctx.fillRect(2, 2, 24, 2);
      ctx.fillRect(2, 24, 24, 2);
      ctx.fillRect(2, 2, 2, 24);
      ctx.fillRect(24, 2, 2, 24);
      ctx.fillStyle = '#0F4C5C';
      ctx.fillRect(6, 6, 16, 16);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(8, 8, 4, 4);
      ctx.fillRect(15, 14, 5, 5);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(16, 8, 3, 3);
      ctx.fillRect(9, 16, 3, 3);
      planter.refresh();
    }

    // Bench
    const bench = this.textures.createCanvas('prop_bench', 32, 16);
    if (bench) {
      const ctx = bench.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(2, 3, 28, 10);
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 4, 24, 8);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(4, 4, 2, 8);
      ctx.fillRect(26, 4, 2, 8);
      bench.refresh();
    }

    // Kiosk
    const kiosk = this.textures.createCanvas('prop_kiosk', 28, 28);
    if (kiosk) {
      const ctx = kiosk.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(3, 3, 22, 22);
      ctx.fillStyle = '#20283A';
      ctx.fillRect(5, 5, 18, 18);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(5, 5, 18, 2);
      ctx.fillRect(5, 21, 18, 2);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(11, 11, 6, 6);
      kiosk.refresh();
    }

    // Bollard (12x12)
    const bollard = this.textures.createCanvas('prop_bollard', 12, 12);
    if (bollard) {
      const ctx = bollard.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(2, 2, 8, 8);
      ctx.fillStyle = '#475569';
      ctx.fillRect(3, 3, 6, 6);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(4, 4, 4, 2);
      bollard.refresh();
    }

    // Cone (12x12)
    const cone = this.textures.createCanvas('prop_cone', 12, 12);
    if (cone) {
      const ctx = cone.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(2, 2, 8, 8);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(3, 3, 6, 6);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(4, 4, 4, 4);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(5, 5, 2, 2);
      cone.refresh();
    }

    // Ramen Stool (12x12)
    const stool = this.textures.createCanvas('prop_stool', 12, 12);
    if (stool) {
      const ctx = stool.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(2, 2, 8, 8);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(3, 3, 6, 6);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(4, 4, 4, 4);
      stool.refresh();
    }

    // Cyber Trashbin (16x16)
    const bin = this.textures.createCanvas('prop_trashbin', 16, 16);
    if (bin) {
      const ctx = bin.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 3, 10, 10);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(4, 4, 8, 2);
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(5, 7, 6, 4);
      bin.refresh();
    }

    // Holo Billboard (48x16)
    const billboard = this.textures.createCanvas('prop_billboard', 48, 16);
    if (billboard) {
      const ctx = billboard.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(0, 3, 48, 10);
      ctx.fillStyle = '#20283A';
      ctx.fillRect(2, 4, 44, 8);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(2, 4, 44, 2);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(2, 10, 44, 2);
      billboard.refresh();
    }

    // Traffic Signal Post (14x14)
    const signal = this.textures.createCanvas('prop_signal', 14, 14);
    if (signal) {
      const ctx = signal.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(2, 2, 10, 10);
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 3, 8, 8);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(4, 4, 6, 6);
      signal.refresh();
    }

    // Rooftop AC Fan Rotor (18x18)
    const fan = this.textures.createCanvas('prop_ac_fan', 18, 18);
    if (fan) {
      const ctx = fan.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(1, 1, 16, 16);
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, 2, 2, 14);
      ctx.fillRect(2, 8, 14, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(7, 7, 4, 4);
      fan.refresh();
    }
  }

  private createFxTextures(): void {
    // Particle spark
    const g = this.add.graphics();
    g.fillStyle(PALETTE.NEON_CYAN, 1);
    g.fillRect(0, 0, 3, 3);
    g.generateTexture('pixel_spark', 3, 3);
    g.clear();

    // Steam puff (4x4)
    g.fillStyle(0xcbd5e1, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('fx_steam', 4, 4);
    g.destroy();

    // Stepped pixel light glow (48x48) — crisp concentric pixel rings (no blurry bloom)
    const glow = this.textures.createCanvas('fx_pixel_glow', 48, 48);
    if (glow) {
      const ctx = glow.getContext();
      ctx.imageSmoothingEnabled = false;
      const drawRing = (r: number, alpha: number) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(24, 24, r, 0, Math.PI * 2);
        ctx.fill();
      };
      drawRing(24, 0.08);
      drawRing(16, 0.14);
      drawRing(9, 0.24);
      drawRing(4, 0.45);
      glow.refresh();
    }

    // Crisp pixel headlight cone (72x44 facing RIGHT +X)
    const beam = this.textures.createCanvas('fx_headlight', 72, 44);
    if (beam) {
      const ctx = beam.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(224, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(72, 2);
      ctx.lineTo(72, 42);
      ctx.lineTo(0, 29);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 245, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, 17);
      ctx.lineTo(52, 8);
      ctx.lineTo(52, 36);
      ctx.lineTo(0, 27);
      ctx.closePath();
      ctx.fill();
      beam.refresh();
    }

    // Weapon projectiles (14x6 facing RIGHT +X)
    const projColors: Array<{ key: string; outer: string; core: string }> = [
      { key: 'proj_cyan', outer: '#00F5FF', core: '#E0FFFF' },
      { key: 'proj_pink', outer: '#FF2E88', core: '#FFE4F1' },
      { key: 'proj_gold', outer: '#FFD166', core: '#FFFBEB' },
    ];
    for (const p of projColors) {
      const pTex = this.textures.createCanvas(p.key, 14, 6);
      if (pTex) {
        const ctx = pTex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = p.outer;
        ctx.fillRect(0, 1, 13, 4);
        ctx.fillRect(10, 0, 4, 6);
        ctx.fillStyle = p.core;
        ctx.fillRect(3, 2, 10, 2);
        pTex.refresh();
      }
    }

    // Muzzle flash (18x16 facing RIGHT +X)
    const muzzle = this.textures.createCanvas('fx_muzzle', 18, 16);
    if (muzzle) {
      const ctx = muzzle.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(0, 5, 11, 6);
      ctx.fillRect(4, 2, 6, 12);
      ctx.fillRect(10, 6, 8, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(1, 6, 9, 4);
      ctx.fillRect(10, 7, 5, 2);
      muzzle.refresh();
    }

    // Smoke puff (6x6)
    const smoke = this.textures.createCanvas('fx_smoke', 6, 6);
    if (smoke) {
      const ctx = smoke.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#475569';
      ctx.fillRect(1, 0, 4, 6);
      ctx.fillRect(0, 1, 6, 4);
      ctx.fillStyle = '#64748B';
      ctx.fillRect(2, 2, 2, 2);
      smoke.refresh();
    }

    // Hit impact burst ring (16x16)
    const hitRing = this.textures.createCanvas('fx_hit_ring', 16, 16);
    if (hitRing) {
      const ctx = hitRing.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, Math.PI * 2);
      ctx.stroke();
      hitRing.refresh();
    }
  }
}
