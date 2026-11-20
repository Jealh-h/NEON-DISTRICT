import Phaser from 'phaser';
import { PALETTE, PLAYER_CONFIG } from '../config/BalanceConfig';
import { DistrictManager } from '../world/DistrictManager';
import { generateCityTilemap } from '../world/MapGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    // World tilemap is deterministically generated from DistrictManager in create()
  }

  public create(): void {
    const district = new DistrictManager().getNeonPlaza();
    const mapJson = generateCityTilemap(district);
    this.cache.tilemap.add('neon_plaza_map', {
      format: Phaser.Tilemaps.Formats.TILED_JSON,
      data: mapJson,
    });

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
    const rows = 10;
    const tex = this.textures.createCanvas('neon_tileset', cols * tile, rows * tile);
    if (!tex) return;

    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cols * tile, rows * tile);

    const tileOrigin = (gid: number): { ox: number; oy: number } => {
      const idx = gid - 1;
      return { ox: (idx % cols) * tile, oy: Math.floor(idx / cols) * tile };
    };

    const drawComicDots = (ox: number, oy: number, color: string, step = 6) => {
      ctx.fillStyle = color;
      for (let dy = 3; dy < 31; dy += step) {
        const offset = (dy / step) % 2 === 0 ? 2 : 5;
        for (let dx = offset; dx < 31; dx += step) {
          ctx.fillRect(ox + dx, oy + dy, 1, 1);
        }
      }
    };

    const drawAsphaltBase = (ox: number, oy: number, dark: boolean) => {
      ctx.fillStyle = dark ? '#0A0F1D' : '#0E1426';
      ctx.fillRect(ox, oy, 32, 32);
      // Wet rain-slick specular aggregate & Ben-Day asphalt grain
      ctx.fillStyle = dark ? '#121A30' : '#16203B';
      const specks = [
        [3, 5], [11, 2], [21, 9], [28, 4], [7, 15], [16, 19],
        [25, 14], [4, 26], [13, 28], [22, 24], [29, 29], [18, 8],
        [9, 10], [27, 21], [2, 18], [14, 13],
      ];
      for (const [sx, sy] of specks) {
        ctx.fillRect(ox + sx, oy + sy, 2, 1);
      }
      ctx.fillStyle = dark ? '#1A2747' : '#213158';
      ctx.fillRect(ox + 5, oy + 7, 4, 1);
      ctx.fillRect(ox + 19, oy + 16, 5, 1);
      ctx.fillRect(ox + 10, oy + 24, 4, 1);
    };

    // 1: ASPHALT_PLAIN
    {
      const { ox, oy } = tileOrigin(1);
      drawAsphaltBase(ox, oy, false);
    }

    // 2: ASPHALT_WORN (with comic ink tar cracks & glossy wet tread wear)
    {
      const { ox, oy } = tileOrigin(2);
      drawAsphaltBase(ox, oy, true);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy + 6, 32, 3);
      ctx.fillRect(ox, oy + 23, 32, 3);
      ctx.fillStyle = '#182342';
      ctx.fillRect(ox + 4, oy + 11, 8, 1);
      ctx.fillRect(ox + 12, oy + 12, 6, 1);
      ctx.fillRect(ox + 18, oy + 13, 6, 1);
    }

    // 3: ROAD_DASH_H
    {
      const { ox, oy } = tileOrigin(3);
      drawAsphaltBase(ox, oy, false);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 1, oy + 28, 14, 4);
      ctx.fillRect(ox + 17, oy + 28, 14, 4);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 2, oy + 29, 12, 2);
      ctx.fillRect(ox + 18, oy + 29, 12, 2);
    }

    // 4: ROAD_DASH_V
    {
      const { ox, oy } = tileOrigin(4);
      drawAsphaltBase(ox, oy, false);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 28, oy + 1, 4, 14);
      ctx.fillRect(ox + 28, oy + 17, 4, 14);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 29, oy + 2, 2, 12);
      ctx.fillRect(ox + 29, oy + 18, 2, 12);
    }

    // 5: CROSSWALK_H (crisp bright zebra stripes w/ comic black ink edge & specular sheen)
    {
      const { ox, oy } = tileOrigin(5);
      drawAsphaltBase(ox, oy, true);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 3, oy + 4, 10, 24);
      ctx.fillRect(ox + 19, oy + 4, 10, 24);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(ox + 4, oy + 5, 8, 22);
      ctx.fillRect(ox + 20, oy + 5, 8, 22);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(ox + 4, oy + 6, 8, 18);
      ctx.fillRect(ox + 20, oy + 6, 8, 18);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.38)';
      ctx.fillRect(ox + 4, oy + 9, 8, 3);
      ctx.fillRect(ox + 20, oy + 16, 8, 3);
    }

    // 6: CROSSWALK_V (crisp bright zebra stripes w/ comic black ink edge & specular sheen)
    {
      const { ox, oy } = tileOrigin(6);
      drawAsphaltBase(ox, oy, true);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 4, oy + 3, 24, 10);
      ctx.fillRect(ox + 4, oy + 19, 24, 10);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(ox + 5, oy + 4, 22, 8);
      ctx.fillRect(ox + 5, oy + 20, 22, 8);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(ox + 6, oy + 4, 19, 7);
      ctx.fillRect(ox + 6, oy + 20, 19, 7);
      ctx.fillStyle = 'rgba(255, 46, 136, 0.3)';
      ctx.fillRect(ox + 10, oy + 4, 4, 8);
      ctx.fillRect(ox + 16, oy + 20, 4, 8);
    }

    // 7: ROAD_ARROW_E (transparent overlay)
    {
      const { ox, oy } = tileOrigin(7);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.5)';
      ctx.fillRect(ox + 6, oy + 14, 14, 4);
      ctx.fillRect(ox + 16, oy + 10, 4, 12);
      ctx.fillRect(ox + 20, oy + 12, 4, 8);
      ctx.fillRect(ox + 24, oy + 14, 3, 4);
    }

    // 8: ROAD_ARROW_W (transparent overlay)
    {
      const { ox, oy } = tileOrigin(8);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.5)';
      ctx.fillRect(ox + 12, oy + 14, 14, 4);
      ctx.fillRect(ox + 12, oy + 10, 4, 12);
      ctx.fillRect(ox + 8, oy + 12, 4, 8);
      ctx.fillRect(ox + 5, oy + 14, 3, 4);
    }

    // 9: SIDEWALK_BASE (comic-inked indigo pavers + halftone stipple & bevel gleam)
    {
      const { ox, oy } = tileOrigin(9);
      ctx.fillStyle = '#1B253E';
      ctx.fillRect(ox, oy, 32, 32);
      drawComicDots(ox, oy, 'rgba(5, 7, 14, 0.45)', 6);
      // 16x16 crisp black ink slab seams
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy + 15, 32, 2);
      ctx.fillRect(ox + 15, oy, 2, 32);
      ctx.fillRect(ox, oy + 30, 32, 2);
      ctx.fillRect(ox + 30, oy, 2, 32);
      // Top-left 2.5D slab bevel highlights + damp specular gleam
      ctx.fillStyle = '#31436E';
      ctx.fillRect(ox + 1, oy + 1, 13, 1);
      ctx.fillRect(ox + 17, oy + 1, 13, 1);
      ctx.fillRect(ox + 1, oy + 17, 13, 1);
      ctx.fillRect(ox + 17, oy + 17, 13, 1);
      ctx.fillRect(ox + 1, oy + 2, 1, 12);
      ctx.fillRect(ox + 17, oy + 2, 1, 12);
      ctx.fillStyle = '#26365B';
      ctx.fillRect(ox + 4, oy + 5, 7, 2);
      ctx.fillRect(ox + 20, oy + 21, 7, 2);
    }

    // 10: SIDEWALK_CURB_TOP (2.5D raised sidewalk step lip w/ bold ink border & cyan trim)
    {
      const { ox, oy } = tileOrigin(10);
      ctx.fillStyle = '#1B253E';
      ctx.fillRect(ox, oy, 32, 32);
      drawComicDots(ox, oy, 'rgba(5, 7, 14, 0.42)', 6);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy, 32, 2);
      ctx.fillStyle = '#384D7A';
      ctx.fillRect(ox, oy + 2, 32, 4);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox, oy + 2, 32, 2);
    }

    // 11: SIDEWALK_CURB_BOTTOM (2.5D south-facing vertical concrete curb face w/ ink shadow)
    {
      const { ox, oy } = tileOrigin(11);
      ctx.fillStyle = '#1B253E';
      ctx.fillRect(ox, oy, 32, 32);
      drawComicDots(ox, oy, 'rgba(5, 7, 14, 0.42)', 6);
      ctx.fillStyle = '#384D7A';
      ctx.fillRect(ox, oy + 23, 32, 3);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(ox, oy + 23, 32, 1);
      ctx.fillStyle = '#121A2E';
      ctx.fillRect(ox, oy + 26, 32, 4);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy + 30, 32, 2);
    }

    // 12: PLAZA_TILE_DARK
    {
      const { ox, oy } = tileOrigin(12);
      ctx.fillStyle = '#212D48';
      ctx.fillRect(ox, oy, 32, 32);
      drawComicDots(ox, oy, 'rgba(5, 7, 14, 0.38)', 6);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy, 32, 2);
      ctx.fillRect(ox, oy, 2, 32);
      ctx.fillStyle = '#2E3E62';
      ctx.fillRect(ox + 8, oy + 8, 16, 16);
      ctx.fillStyle = '#212D48';
      ctx.fillRect(ox + 10, oy + 10, 12, 12);
    }

    // 13: PLAZA_TILE_NEON_P
    {
      const { ox, oy } = tileOrigin(13);
      ctx.fillStyle = '#242A4A';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#C000FF';
      ctx.fillRect(ox + 2, oy + 2, 28, 2);
      ctx.fillRect(ox + 2, oy + 28, 28, 2);
      ctx.fillRect(ox + 14, oy + 14, 4, 4);
    }

    // 14: PLAZA_TILE_NEON_K
    {
      const { ox, oy } = tileOrigin(14);
      ctx.fillStyle = '#242A4A';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(ox + 2, oy + 2, 2, 28);
      ctx.fillRect(ox + 28, oy + 2, 2, 28);
      ctx.fillRect(ox + 14, oy + 14, 4, 4);
    }

    // 15: PARKING_TARMAC
    {
      const { ox, oy } = tileOrigin(15);
      ctx.fillStyle = '#192236';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#24314D';
      ctx.fillRect(ox + 4, oy + 10, 4, 2);
      ctx.fillRect(ox + 20, oy + 22, 3, 2);
    }

    // 16: PARKING_STALL
    {
      const { ox, oy } = tileOrigin(16);
      ctx.fillStyle = '#192236';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox, oy, 32, 2);
      ctx.fillRect(ox, oy + 30, 32, 2);
      ctx.fillStyle = '#64748B';
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

    // 19: PUDDLE_CYAN (glossy wet rain-slick cyan & violet reflection puddle)
    {
      const { ox, oy } = tileOrigin(19);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
      ctx.fillRect(ox + 2, oy + 8, 28, 14);
      ctx.fillRect(ox + 6, oy + 5, 20, 20);
      ctx.fillStyle = 'rgba(192, 0, 255, 0.22)';
      ctx.fillRect(ox + 4, oy + 14, 22, 8);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.56)';
      ctx.fillRect(ox + 8, oy + 11, 14, 2);
      ctx.fillRect(ox + 12, oy + 17, 10, 2);
      ctx.fillStyle = 'rgba(224, 255, 255, 0.65)';
      ctx.fillRect(ox + 10, oy + 11, 6, 1);
    }

    // 20: PUDDLE_PINK (glossy wet rain-slick magenta & warm amber reflection puddle)
    {
      const { ox, oy } = tileOrigin(20);
      ctx.fillStyle = 'rgba(255, 46, 136, 0.26)';
      ctx.fillRect(ox + 3, oy + 7, 26, 15);
      ctx.fillRect(ox + 7, oy + 5, 18, 20);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
      ctx.fillRect(ox + 5, oy + 15, 20, 7);
      ctx.fillStyle = 'rgba(255, 46, 136, 0.54)';
      ctx.fillRect(ox + 7, oy + 12, 16, 2);
      ctx.fillRect(ox + 11, oy + 17, 11, 2);
      ctx.fillStyle = 'rgba(255, 228, 241, 0.62)';
      ctx.fillRect(ox + 11, oy + 12, 6, 1);
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

    // 29: RIVER_DEEP (Vibrant cobalt-sapphire ocean & river waves)
    {
      const { ox, oy } = tileOrigin(29);
      ctx.fillStyle = '#074B83';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#0A5E9E';
      ctx.fillRect(ox + 2, oy + 4, 12, 3);
      ctx.fillRect(ox + 16, oy + 15, 13, 3);
      ctx.fillRect(ox + 5, oy + 24, 11, 3);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(ox + 4, oy + 4, 7, 1);
      ctx.fillRect(ox + 18, oy + 15, 8, 1);
      ctx.fillStyle = '#BAE6FD';
      ctx.fillRect(ox + 6, oy + 4, 3, 1);
      ctx.fillRect(ox + 20, oy + 15, 4, 1);
      ctx.fillRect(ox + 8, oy + 24, 3, 1);
    }

    // 30: RIVER_SHORE (2.5D beveled seawall curb + bold comic ink border + turquoise rim)
    {
      const { ox, oy } = tileOrigin(30);
      ctx.fillStyle = '#084D7A';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 1, oy + 1, 30, 30);
      ctx.fillStyle = '#3E5275';
      ctx.fillRect(ox + 3, oy + 3, 26, 20);
      drawComicDots(ox, oy, 'rgba(5, 7, 14, 0.42)', 6);
      ctx.fillStyle = '#758AA8';
      ctx.fillRect(ox + 4, oy + 4, 24, 3);
      ctx.fillStyle = '#22D3EE';
      ctx.fillRect(ox + 2, oy + 2, 28, 2);
      ctx.fillRect(ox + 2, oy + 26, 28, 2);
    }

    // 31: BRIDGE_DECK (2.5D steel girder deck + comic ink plate joints + glowing cyan rails)
    {
      const { ox, oy } = tileOrigin(31);
      ctx.fillStyle = '#1B253B';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#2C3C5E';
      ctx.fillRect(ox + 1, oy + 2, 14, 26);
      ctx.fillRect(ox + 17, oy + 2, 14, 26);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 15, oy, 2, 32);
      ctx.fillRect(ox, oy + 28, 32, 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(ox + 3, oy + 5, 10, 2);
      ctx.fillRect(ox + 19, oy + 21, 10, 2);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox, oy + 1, 32, 1);
      ctx.fillRect(ox, oy + 28, 32, 1);
    }

    // 32: BRIDGE_RAIL (2.5D elevated suspension truss & gold/cyan rail w/ ink outlines)
    {
      const { ox, oy } = tileOrigin(32);
      ctx.fillStyle = '#074B83';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy + 4, 32, 24);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(ox, oy + 5, 32, 20);
      ctx.fillStyle = '#536480';
      ctx.fillRect(ox + 1, oy + 6, 30, 14);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 4, oy + 10, 24, 9);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 3, oy + 13, 9, 4);
      ctx.fillRect(ox + 20, oy + 13, 9, 4);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox, oy + 5, 32, 2);
      ctx.fillRect(ox, oy + 22, 32, 2);
    }

    // 33: MOUNTAIN_BASE (Lush highland grass + rocky shale foothills)
    {
      const { ox, oy } = tileOrigin(33);
      ctx.fillStyle = '#184D35';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#236B49';
      ctx.fillRect(ox + 2, oy + 3, 10, 6);
      ctx.fillRect(ox + 18, oy + 14, 11, 6);
      ctx.fillRect(ox + 5, oy + 22, 10, 5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(ox + 15, oy + 4, 8, 5);
      ctx.fillRect(ox + 19, oy + 24, 8, 5);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(ox + 16, oy + 4, 5, 2);
    }

    // 34: MOUNTAIN_CLIFF (Stepped geological slate cliff)
    {
      const { ox, oy } = tileOrigin(34);
      ctx.fillStyle = '#334155';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#475569';
      ctx.fillRect(ox + 1, oy + 1, 30, 21);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(ox + 2, oy + 2, 28, 4);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(ox, oy + 22, 32, 10);
    }

    // 35: MOUNTAIN_PEAK (High altitude granite & snow crest)
    {
      const { ox, oy } = tileOrigin(35);
      ctx.fillStyle = '#475569';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#64748B';
      ctx.fillRect(ox + 3, oy + 3, 26, 26);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(ox + 6, oy + 5, 20, 12);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ox + 9, oy + 6, 14, 6);
    }

    // 36: PARK_TURF (Vibrant emerald comic turf w/ cel leaf tufts & Ben-Day shadow dots)
    {
      const { ox, oy } = tileOrigin(36);
      ctx.fillStyle = '#145C39';
      ctx.fillRect(ox, oy, 32, 32);
      drawComicDots(ox, oy, 'rgba(5, 7, 14, 0.28)', 6);
      ctx.fillStyle = '#1E7A4B';
      ctx.fillRect(ox + 2, oy + 4, 7, 4);
      ctx.fillRect(ox + 16, oy + 12, 8, 4);
      ctx.fillRect(ox + 6, oy + 22, 7, 4);
      ctx.fillRect(ox + 22, oy + 3, 6, 4);
      ctx.fillStyle = '#2EA363';
      ctx.fillRect(ox + 4, oy + 3, 3, 2);
      ctx.fillRect(ox + 18, oy + 11, 4, 2);
      ctx.fillRect(ox + 8, oy + 21, 3, 2);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 12, oy + 8, 4, 1);
      ctx.fillRect(ox + 24, oy + 20, 4, 1);
      ctx.fillStyle = '#86EFAC';
      ctx.fillRect(ox + 5, oy + 4, 1, 1);
      ctx.fillRect(ox + 19, oy + 12, 1, 1);
    }

    // 37: WOOD_PIER (Warm sunlit boardwalk planks + comic ink gaps & iron studs)
    {
      const { ox, oy } = tileOrigin(37);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#7C4D34';
      for (let py = 1; py < 32; py += 6) {
        ctx.fillRect(ox + 1, oy + py, 30, 4);
        ctx.fillStyle = '#A16646';
        ctx.fillRect(ox + 2, oy + py, 28, 1);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(ox + 3, oy + py + 2, 1, 1);
        ctx.fillRect(ox + 28, oy + py + 2, 1, 1);
        ctx.fillStyle = '#7C4D34';
      }
      ctx.fillStyle = '#C2855A';
      ctx.fillRect(ox, oy, 32, 1);
      ctx.fillRect(ox, oy + 31, 32, 1);
    }

    // 38: RIVER_FOAM (Crisp white-cyan surf crests overlay)
    {
      const { ox, oy } = tileOrigin(38);
      ctx.fillStyle = 'rgba(125, 211, 252, 0.55)';
      ctx.fillRect(ox + 4, oy + 10, 14, 2);
      ctx.fillRect(ox + 14, oy + 20, 12, 2);
      ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
      ctx.fillRect(ox + 7, oy + 10, 7, 1);
      ctx.fillRect(ox + 17, oy + 20, 6, 1);
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

    // 41: DOCK_CONCRETE (Weathered Harbor Slab w/ comic ink joints & halftone grain)
    {
      const { ox, oy } = tileOrigin(41);
      ctx.fillStyle = '#1C222D';
      ctx.fillRect(ox, oy, 32, 32);
      drawComicDots(ox, oy, 'rgba(5, 7, 14, 0.45)', 6);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy + 30, 32, 2);
      ctx.fillRect(ox + 30, oy, 2, 32);
      ctx.fillStyle = '#2F3A4D';
      ctx.fillRect(ox + 2, oy + 2, 27, 1);
      ctx.fillRect(ox + 2, oy + 2, 1, 27);
      ctx.fillStyle = '#3B2821';
      ctx.fillRect(ox + 6, oy + 18, 7, 4);
      ctx.fillRect(ox + 20, oy + 6, 5, 3);
      ctx.fillStyle = '#141922';
      ctx.fillRect(ox + 16, oy + 22, 6, 3);
    }

    // 42: HELIPAD_TILE (Glowing H landing circle mark)
    {
      const { ox, oy } = tileOrigin(42);
      ctx.fillStyle = '#141A26';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(ox + 4, oy + 4, 24, 2);
      ctx.fillRect(ox + 4, oy + 26, 24, 2);
      ctx.fillRect(ox + 9, oy + 9, 3, 14);
      ctx.fillRect(ox + 20, oy + 9, 3, 14);
      ctx.fillRect(ox + 12, oy + 15, 8, 3);
    }

    // 43: CHROME_FLOOR (Industrial Brushed Steel Grating & Rivets)
    {
      const { ox, oy } = tileOrigin(43);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#222A3B';
      ctx.fillRect(ox + 1, oy + 1, 30, 30);
      ctx.fillStyle = '#33415C';
      ctx.fillRect(ox + 2, oy + 2, 28, 2);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 6, oy + 8, 20, 2);
      ctx.fillRect(ox + 6, oy + 16, 20, 2);
      ctx.fillRect(ox + 6, oy + 24, 20, 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(ox + 3, oy + 3, 2, 2);
      ctx.fillRect(ox + 27, oy + 3, 2, 2);
      ctx.fillRect(ox + 3, oy + 27, 2, 2);
      ctx.fillRect(ox + 27, oy + 27, 2, 2);
    }

    // 44: SAND_SHORE (Warm sunlit golden sand w/ comic dune ink contour & halftone grain)
    {
      const { ox, oy } = tileOrigin(44);
      ctx.fillStyle = '#D99B38';
      ctx.fillRect(ox, oy, 32, 32);
      drawComicDots(ox, oy, 'rgba(124, 45, 18, 0.35)', 6);
      ctx.fillStyle = '#F5BA4B';
      ctx.fillRect(ox + 2, oy + 4, 14, 5);
      ctx.fillRect(ox + 15, oy + 15, 14, 5);
      ctx.fillRect(ox + 4, oy + 24, 14, 4);
      ctx.fillStyle = '#9A3412';
      ctx.fillRect(ox + 3, oy + 10, 11, 2);
      ctx.fillRect(ox + 16, oy + 21, 12, 2);
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(ox + 8, oy + 5, 5, 2);
      ctx.fillRect(ox + 21, oy + 16, 5, 2);
      ctx.fillRect(ox + 11, oy + 26, 3, 1);
    }

    // 45: SPEEDWAY_CURB_N (F1 Red/White Racing Curb on north asphalt edge)
    {
      const { ox, oy } = tileOrigin(45);
      drawAsphaltBase(ox, oy, true);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy + 6, 32, 2);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(ox, oy, 16, 6);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(ox + 16, oy, 16, 6);
    }

    // 46: SPEEDWAY_CURB_S (F1 Red/White Racing Curb on south asphalt edge)
    {
      const { ox, oy } = tileOrigin(46);
      drawAsphaltBase(ox, oy, true);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy + 24, 32, 2);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(ox, oy + 26, 16, 6);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(ox + 16, oy + 26, 16, 6);
    }

    // 47: HARBOR_HAZARD_EDGE (Yellow/Black Dock Safety Stripe)
    {
      const { ox, oy } = tileOrigin(47);
      ctx.fillStyle = '#1C222D';
      ctx.fillRect(ox, oy, 32, 32);
      for (let hx = 0; hx < 32; hx += 8) {
        ctx.fillStyle = '#EAB308';
        ctx.fillRect(ox + hx, oy + 24, 4, 6);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(ox + hx + 4, oy + 24, 4, 6);
      }
      ctx.fillStyle = '#475569';
      ctx.fillRect(ox, oy + 22, 32, 2);
    }

    // 48: HIGHLAND_ASPHALT (Mountain road w/ warm amber shoulder)
    {
      const { ox, oy } = tileOrigin(48);
      drawAsphaltBase(ox, oy, true);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(ox, oy + 1, 32, 2);
      ctx.fillRect(ox, oy + 29, 32, 2);
    }

    // 49: PARK_COBBLE (Warm stone park cobblestone walkway w/ crisp comic ink joints)
    {
      const { ox, oy } = tileOrigin(49);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox, oy, 32, 32);
      const stones = [
        [2, 2, 12, 8], [16, 2, 14, 8],
        [1, 12, 8, 8], [11, 12, 12, 8], [25, 12, 6, 8],
        [3, 22, 14, 8], [19, 22, 11, 8],
      ];
      for (const [sx, sy, sw, sh] of stones) {
        ctx.fillStyle = '#333D4D';
        ctx.fillRect(ox + sx, oy + sy, sw, sh);
        ctx.fillStyle = '#52627A';
        ctx.fillRect(ox + sx, oy + sy, sw, 1);
      }
    }

    // 50: PARK_FLOWERBED (Lush grass w/ sakura pink & cyan cyber blossoms)
    {
      const { ox, oy } = tileOrigin(50);
      ctx.fillStyle = '#113329';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#1B4D3E';
      ctx.fillRect(ox + 3, oy + 3, 26, 26);
      ctx.fillStyle = '#FF6B9D';
      ctx.fillRect(ox + 6, oy + 7, 3, 3);
      ctx.fillRect(ox + 20, oy + 18, 3, 3);
      ctx.fillStyle = '#FCD34D';
      ctx.fillRect(ox + 15, oy + 8, 2, 2);
      ctx.fillRect(ox + 9, oy + 21, 3, 2);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(ox + 22, oy + 6, 2, 3);
    }

    // 51: CHROME_MOLTEN_GRATE (Glowing industrial foundry vent)
    {
      const { ox, oy } = tileOrigin(51);
      ctx.fillStyle = '#1A1412';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(ox + 5, oy + 5, 22, 22);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(ox + 8, oy + 8, 16, 16);
      ctx.fillStyle = '#1E2430';
      for (let gx = 4; gx <= 24; gx += 6) {
        ctx.fillRect(ox + gx, oy + 3, 3, 26);
      }
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox + 2, oy + 2, 28, 28);
    }

    // 52: SIDEWALK_CHROME (Brushed metallic sidewalk for Chrome Town)
    {
      const { ox, oy } = tileOrigin(52);
      ctx.fillStyle = '#202634';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#2B3345';
      ctx.fillRect(ox + 1, oy + 1, 14, 14);
      ctx.fillRect(ox + 17, oy + 17, 14, 14);
      ctx.fillStyle = '#171C26';
      ctx.fillRect(ox, oy + 15, 32, 1);
      ctx.fillRect(ox + 15, oy, 1, 32);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(ox + 2, oy + 2, 2, 2);
      ctx.fillRect(ox + 28, oy + 28, 2, 2);
    }

    // 53: WATER_SHALLOW (Bright vivid turquoise coastal shallows w/ sunlit ripples)
    {
      const { ox, oy } = tileOrigin(53);
      ctx.fillStyle = '#0891B2';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#06B6D4';
      ctx.fillRect(ox + 2, oy + 3, 14, 5);
      ctx.fillRect(ox + 16, oy + 14, 13, 5);
      ctx.fillRect(ox + 4, oy + 24, 15, 4);
      ctx.fillStyle = '#67E8F9';
      ctx.fillRect(ox + 4, oy + 5, 9, 2);
      ctx.fillRect(ox + 18, oy + 16, 8, 2);
      ctx.fillStyle = '#ECFEFF';
      ctx.fillRect(ox + 6, oy + 5, 4, 1);
      ctx.fillRect(ox + 20, oy + 25, 5, 1);
    }

    // 54: WATERFALL_CASCADE (Vertical rushing white-cyan cascade foam over cliff water)
    {
      const { ox, oy } = tileOrigin(54);
      ctx.fillStyle = '#0369A1';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(ox + 2, oy, 7, 32);
      ctx.fillRect(ox + 12, oy, 8, 32);
      ctx.fillRect(ox + 23, oy, 7, 32);
      ctx.fillStyle = '#BAE6FD';
      ctx.fillRect(ox + 4, oy + 2, 4, 14);
      ctx.fillRect(ox + 14, oy + 8, 4, 16);
      ctx.fillRect(ox + 25, oy + 3, 3, 13);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ox + 1, oy + 25, 30, 6);
      ctx.fillStyle = '#67E8F9';
      ctx.fillRect(ox + 3, oy + 23, 26, 2);
    }

    // 55: FOREST_FLOOR (Rich layered emerald-jade woodland turf + Ben-Day dots)
    {
      const { ox, oy } = tileOrigin(55);
      ctx.fillStyle = '#114A31';
      ctx.fillRect(ox, oy, 32, 32);
      drawComicDots(ox, oy, 'rgba(5, 7, 14, 0.3)', 6);
      ctx.fillStyle = '#186642';
      ctx.fillRect(ox + 2, oy + 4, 10, 6);
      ctx.fillRect(ox + 16, oy + 12, 11, 6);
      ctx.fillRect(ox + 5, oy + 21, 11, 6);
      ctx.fillStyle = '#228B57';
      ctx.fillRect(ox + 4, oy + 5, 5, 3);
      ctx.fillRect(ox + 19, oy + 13, 5, 3);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(ox + 24, oy + 4, 3, 2);
      ctx.fillRect(ox + 11, oy + 17, 3, 2);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 12, oy + 25, 5, 1);
    }

    // 56: SNOW_PLAIN (Crisp alpine snowfield w/ bright icy drift highlights)
    {
      const { ox, oy } = tileOrigin(56);
      ctx.fillStyle = '#E2EDF8';
      ctx.fillRect(ox, oy, 32, 32);
      drawComicDots(ox, oy, 'rgba(56, 189, 248, 0.25)', 6);
      ctx.fillStyle = '#BAE6FD';
      ctx.fillRect(ox + 2, oy + 9, 13, 4);
      ctx.fillRect(ox + 16, oy + 21, 14, 4);
      ctx.fillRect(ox + 5, oy + 27, 10, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ox + 3, oy + 3, 12, 4);
      ctx.fillRect(ox + 17, oy + 14, 12, 4);
      ctx.fillStyle = '#7DD3FC';
      ctx.fillRect(ox + 10, oy + 15, 2, 2);
      ctx.fillRect(ox + 25, oy + 6, 2, 2);
    }

    // 57: DESERT_CANYON (Vivid ochre terracotta sandstone w/ bold comic ink rock cracks)
    {
      const { ox, oy } = tileOrigin(57);
      ctx.fillStyle = '#B45309';
      ctx.fillRect(ox, oy, 32, 32);
      drawComicDots(ox, oy, 'rgba(67, 20, 7, 0.35)', 6);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(ox + 2, oy + 3, 13, 8);
      ctx.fillRect(ox + 17, oy + 15, 13, 8);
      ctx.fillRect(ox + 4, oy + 21, 11, 7);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 14, oy + 2, 1, 12);
      ctx.fillRect(ox + 2, oy + 14, 16, 1);
      ctx.fillRect(ox + 15, oy + 24, 15, 1);
      ctx.fillStyle = '#FCD34D';
      ctx.fillRect(ox + 5, oy + 5, 5, 2);
      ctx.fillRect(ox + 21, oy + 17, 5, 2);
    }

    // 58: VOLCANIC_ROCK (Charred obsidian basalt w/ comic ink cracks & glowing magma fissures)
    {
      const { ox, oy } = tileOrigin(58);
      ctx.fillStyle = '#1D1824';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#2F263B';
      ctx.fillRect(ox + 3, oy + 4, 11, 8);
      ctx.fillRect(ox + 17, oy + 15, 12, 9);
      ctx.fillRect(ox + 6, oy + 21, 9, 7);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(ox + 14, oy + 3, 2, 15);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(ox + 14, oy + 9, 2, 6);
      ctx.fillRect(ox + 8, oy + 25, 5, 2);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(ox + 14, oy + 11, 1, 3);
    }

    // 59: LAVA_MAGMA (Incandescent glowing molten lava river)
    {
      const { ox, oy } = tileOrigin(59);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(ox + 2, oy + 2, 28, 28);
      ctx.fillStyle = '#FB923C';
      ctx.fillRect(ox + 4, oy + 5, 13, 9);
      ctx.fillRect(ox + 14, oy + 17, 14, 9);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(ox + 7, oy + 7, 8, 4);
      ctx.fillRect(ox + 16, oy + 19, 9, 4);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(ox + 9, oy + 8, 4, 2);
      ctx.fillRect(ox + 19, oy + 20, 4, 2);
    }

    // 60: SAND_DUNE_EDGE (Sunlit beach + crisp white surf foam edge)
    {
      const { ox, oy } = tileOrigin(60);
      ctx.fillStyle = '#D99B38';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#F5BA4B';
      ctx.fillRect(ox, oy, 32, 18);
      ctx.fillStyle = '#06B6D4';
      ctx.fillRect(ox, oy + 22, 32, 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ox + 1, oy + 20, 30, 3);
      ctx.fillStyle = '#67E8F9';
      ctx.fillRect(ox + 3, oy + 23, 26, 2);
    }

    // 61: DIRT_TRAIL (Sunlit packed earth path through woodland & canyons)
    {
      const { ox, oy } = tileOrigin(61);
      ctx.fillStyle = '#785032';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#92643F';
      ctx.fillRect(ox + 3, oy + 4, 9, 5);
      ctx.fillRect(ox + 17, oy + 13, 10, 6);
      ctx.fillRect(ox + 7, oy + 22, 9, 5);
      ctx.fillStyle = '#573822';
      ctx.fillRect(ox + 13, oy + 8, 4, 3);
      ctx.fillRect(ox + 23, oy + 24, 4, 2);
    }

    // 62: BOARDWALK_COAST (Coastal timber boardwalk w/ neon cyan rails)
    {
      const { ox, oy } = tileOrigin(62);
      ctx.fillStyle = '#523424';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#85543A';
      for (let bx = 1; bx < 32; bx += 6) {
        ctx.fillRect(ox + bx, oy + 1, 4, 30);
      }
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox, oy + 1, 32, 2);
      ctx.fillRect(ox, oy + 29, 32, 2);
    }

    // 63: STADIUM_TURF (Glowing Neon Stadium plaza paving)
    {
      const { ox, oy } = tileOrigin(63);
      ctx.fillStyle = '#182442';
      ctx.fillRect(ox, oy, 32, 32);
      ctx.fillStyle = '#223259';
      ctx.fillRect(ox + 2, oy + 2, 28, 28);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(ox + 2, oy + 15, 28, 2);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(ox + 15, oy + 2, 2, 28);
    }

    // 64: PLAZA_ROUNDABOUT (Crisp circular neon intersection ring accent)
    {
      const { ox, oy } = tileOrigin(64);
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.72)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox + 16, oy + 16, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 209, 102, 0.75)';
      ctx.fillRect(ox + 14, oy + 14, 4, 4);
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

      ctx.fillStyle = '#05070E';
      ctx.fillRect(10 + frame.leftFootOffset, 6, 5, 4);
      ctx.fillRect(10 + frame.rightFootOffset, 18, 5, 4);

      ctx.fillStyle = '#05070E';
      ctx.fillRect(9 + frame.leftArmOffset, 3, 9, 6);
      ctx.fillRect(9 + frame.rightArmOffset, 19, 9, 6);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(10 + frame.leftArmOffset, 4, 7, 4);
      ctx.fillRect(10 + frame.rightArmOffset, 20, 7, 4);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(10 + frame.leftArmOffset, 4, 6, 1);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(15 + frame.leftArmOffset, 5, 2, 2);
      ctx.fillRect(15 + frame.rightArmOffset, 21, 2, 2);

      // Jacket torso with bold #05070E comic ink outline, cel armor bevel & neon trim
      ctx.fillStyle = '#05070E';
      ctx.fillRect(6, 6, 14, 16);
      ctx.fillStyle = '#2B3A55';
      ctx.fillRect(8, 8, 10, 12);
      ctx.fillStyle = '#4E6B9C';
      ctx.fillRect(8, 8, 9, 3);
      ctx.fillStyle = '#C000FF';
      ctx.fillRect(7, 9, 2, 10);

      // Sculpted comic-inked head/helmet with cel highlight rim
      ctx.fillStyle = '#05070E';
      ctx.fillRect(9, 8, 11, 12);
      ctx.fillStyle = '#334155';
      ctx.fillRect(11, 10, 7, 8);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(11, 10, 6, 2);

      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(17, 11, 3, 6);
      ctx.fillStyle = '#FFFFFF';
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
        ctx.fillStyle = '#05070E';
        ctx.fillRect(7, 1, 9, 3);
        ctx.fillRect(28, 1, 9, 3);
        ctx.fillRect(7, 20, 9, 3);
        ctx.fillRect(28, 20, 9, 3);
        // Bold comic ink outer chassis + cel bevel
        ctx.fillStyle = '#05070E';
        ctx.fillRect(2, 2, 40, 20);
        ctx.fillStyle = '#2A3A54';
        ctx.fillRect(4, 4, 36, 16);
        ctx.fillStyle = '#46628E';
        ctx.fillRect(6, 4, 32, 4);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(6, 3, 28, 1);
        ctx.fillRect(6, 20, 28, 1);
        // Raised 2.5D Comic Cabin + diagonal specular window slash
        ctx.fillStyle = '#05070E';
        ctx.fillRect(10, 6, 17, 12);
        ctx.fillStyle = '#3B5178';
        ctx.fillRect(11, 7, 14, 10);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(25, 6, 6, 12);
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(26, 7, 4, 10);
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(27, 8, 2, 3);
        ctx.fillRect(28, 11, 2, 2);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(7, 7, 3, 10);
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
        ctx.fillStyle = '#05070E';
        ctx.fillRect(8, 1, 10, 3);
        ctx.fillRect(31, 1, 10, 3);
        ctx.fillRect(8, 20, 10, 3);
        ctx.fillRect(31, 20, 10, 3);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(1, 2, 46, 20);
        ctx.fillStyle = '#241B3E';
        ctx.fillRect(3, 4, 42, 16);
        ctx.fillStyle = '#47367A';
        ctx.fillRect(6, 4, 36, 4);
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(6, 8, 36, 2);
        ctx.fillRect(6, 14, 36, 2);
        ctx.fillStyle = '#C000FF';
        ctx.fillRect(2, 3, 3, 18);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(14, 6, 16, 12);
        ctx.fillStyle = '#243454';
        ctx.fillRect(15, 7, 10, 8);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(25, 7, 5, 10);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(26, 8, 2, 3);
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(44, 4, 2, 16);
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(44, 5, 2, 4);
        ctx.fillRect(44, 15, 2, 4);
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
        ctx.fillStyle = '#05070E';
        ctx.fillRect(8, 1, 10, 3);
        ctx.fillRect(30, 1, 10, 3);
        ctx.fillRect(8, 22, 10, 3);
        ctx.fillRect(30, 22, 10, 3);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(2, 2, 44, 22);
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(14, 4, 18, 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(15, 5, 16, 14);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(32, 4, 12, 18);
        ctx.fillRect(4, 4, 10, 18);
        ctx.fillStyle = '#3B4D6B';
        ctx.fillRect(32, 4, 11, 4);
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(45, 6, 2, 14);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(27, 6, 5, 14);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(28, 7, 3, 12);
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(28, 8, 2, 3);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(19, 6, 4, 14);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(19, 7, 4, 6);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(19, 13, 4, 6);
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
        ctx.fillStyle = '#05070E';
        ctx.fillRect(7, 1, 9, 3);
        ctx.fillRect(28, 1, 9, 3);
        ctx.fillRect(7, 20, 9, 3);
        ctx.fillRect(28, 20, 9, 3);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(2, 2, 40, 20);
        ctx.fillStyle = '#D99B26';
        ctx.fillRect(5, 4, 34, 16);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(7, 4, 30, 4);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(11, 6, 16, 12);
        ctx.fillStyle = '#283654';
        ctx.fillRect(12, 7, 13, 9);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(16, 9, 4, 6);
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(25, 7, 5, 10);
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(26, 8, 2, 3);
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
        ctx.fillStyle = '#05070E';
        ctx.fillRect(8, 1, 11, 3);
        ctx.fillRect(31, 1, 11, 3);
        ctx.fillRect(8, 20, 11, 3);
        ctx.fillRect(31, 20, 11, 3);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(1, 2, 48, 20);
        ctx.fillStyle = '#292942';
        ctx.fillRect(4, 4, 42, 16);
        ctx.fillStyle = '#474775';
        ctx.fillRect(7, 4, 35, 4);
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(4, 5, 40, 2);
        ctx.fillRect(4, 17, 40, 2);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(10, 11, 28, 2);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(16, 6, 17, 12);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(17, 7, 10, 8);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(26, 7, 6, 10);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(27, 8, 2, 4);
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
        ctx.fillStyle = '#05070E';
        ctx.fillRect(2, 4, 7, 6);
        ctx.fillRect(21, 4, 7, 6);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(5, 2, 20, 10);
        ctx.fillStyle = '#23163D';
        ctx.fillRect(6, 3, 18, 8);
        ctx.fillStyle = '#C000FF';
        ctx.fillRect(7, 3, 15, 2);
        ctx.fillRect(7, 9, 15, 2);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(4, 6, 3, 2);
        ctx.fillRect(23, 6, 3, 2);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(10, 5, 7, 4);
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(26, 5, 2, 4);
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(2, 5, 2, 4);
        tex.refresh();
      }
    }

    // 7. Phantom Superbike (34x16 facing RIGHT +X)
    {
      const tex = this.textures.createCanvas('veh_superbike', 34, 16);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#05070E';
        ctx.fillRect(2, 5, 8, 6);
        ctx.fillRect(24, 5, 8, 6);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(4, 2, 26, 12);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(7, 4, 20, 8);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(8, 3, 18, 2);
        ctx.fillRect(8, 11, 18, 2);
        ctx.fillRect(5, 7, 4, 2);
        ctx.fillRect(26, 7, 4, 2);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(11, 5, 8, 6);
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(21, 5, 5, 6);
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(30, 6, 2, 4);
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(2, 6, 2, 4);
        tex.refresh();
      }
    }

    // 8. Off-road Assault Buggy (46x28 facing RIGHT +X)
    {
      const tex = this.textures.createCanvas('veh_buggy', 46, 28);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#05070E';
        ctx.fillRect(5, 0, 11, 5);
        ctx.fillRect(29, 0, 11, 5);
        ctx.fillRect(5, 23, 11, 5);
        ctx.fillRect(29, 23, 11, 5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(7, 1, 7, 3);
        ctx.fillRect(31, 1, 7, 3);
        ctx.fillRect(7, 24, 7, 3);
        ctx.fillRect(31, 24, 7, 3);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(3, 4, 40, 20);
        ctx.fillStyle = '#EA580C';
        ctx.fillRect(6, 6, 33, 16);
        ctx.fillStyle = '#FDBA74';
        ctx.fillRect(7, 6, 30, 3);
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(9, 7, 20, 2);
        ctx.fillRect(9, 19, 20, 2);
        ctx.fillRect(17, 7, 3, 14);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(11, 9, 14, 10);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(30, 10, 6, 8);
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(41, 7, 3, 14);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(40, 8, 2, 4);
        ctx.fillRect(40, 16, 2, 4);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(4, 8, 2, 4);
        ctx.fillRect(4, 16, 2, 4);
        tex.refresh();
      }
    }

    // 9. SWAT Heavy APC (58x30 facing RIGHT +X)
    {
      const tex = this.textures.createCanvas('veh_swat', 58, 30);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#05070E';
        ctx.fillRect(7, 1, 10, 3);
        ctx.fillRect(23, 1, 10, 3);
        ctx.fillRect(40, 1, 10, 3);
        ctx.fillRect(7, 26, 10, 3);
        ctx.fillRect(23, 26, 10, 3);
        ctx.fillRect(40, 26, 10, 3);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(2, 3, 54, 24);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(5, 5, 48, 20);
        ctx.fillStyle = '#334155';
        ctx.fillRect(8, 7, 28, 16);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(15, 10, 10, 10);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(10, 6, 20, 1);
        ctx.fillRect(10, 23, 20, 1);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(40, 8, 4, 14);
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(41, 9, 2, 4);
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(53, 6, 3, 18);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(35, 7, 3, 7);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(35, 16, 3, 7);
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(51, 6, 2, 4);
        ctx.fillRect(51, 20, 2, 4);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(3, 6, 2, 4);
        ctx.fillRect(3, 20, 2, 4);
        tex.refresh();
      }
    }

    // 10. Armed Attack Helicopter Hull (56x32 facing RIGHT +X)
    {
      const tex = this.textures.createCanvas('veh_heli', 56, 32);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#475569';
        ctx.fillRect(20, 3, 22, 2);
        ctx.fillRect(20, 27, 22, 2);
        ctx.fillRect(25, 5, 2, 4);
        ctx.fillRect(35, 5, 2, 4);
        ctx.fillRect(25, 23, 2, 4);
        ctx.fillRect(35, 23, 2, 4);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(1, 12, 24, 8);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(3, 14, 20, 4);
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(3, 9, 3, 14);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(25, 3, 11, 26);
        ctx.fillStyle = '#334155';
        ctx.fillRect(26, 4, 9, 24);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(33, 5, 4, 4);
        ctx.fillRect(33, 23, 4, 4);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(19, 8, 30, 16);
        ctx.fillStyle = '#334155';
        ctx.fillRect(23, 10, 21, 12);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(38, 11, 10, 10);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(39, 12, 7, 8);
        ctx.fillStyle = '#E0FFFF';
        ctx.fillRect(40, 13, 3, 3);
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(48, 15, 7, 2);
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(29, 14, 4, 4);
        tex.refresh();
      }
    }

    // 10b. Helicopter Spinning Rotor Overlay (64x64)
    {
      const tex = this.textures.createCanvas('veh_heli_rotor', 64, 64);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.beginPath();
        ctx.arc(32, 32, 29, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(2, 30, 60, 4);
        ctx.fillRect(30, 2, 4, 60);
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(2, 30, 5, 4);
        ctx.fillRect(57, 30, 5, 4);
        ctx.fillRect(30, 2, 4, 5);
        ctx.fillRect(30, 57, 4, 5);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(29, 29, 6, 6);
        tex.refresh();
      }
    }

    // 11. Heavy Battle Tank Hull (60x36 facing RIGHT +X)
    {
      const tex = this.textures.createCanvas('veh_tank', 60, 36);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#05070E';
        ctx.fillRect(3, 1, 54, 7);
        ctx.fillRect(3, 28, 54, 7);
        ctx.fillStyle = '#334155';
        for (let tx = 5; tx < 54; tx += 5) {
          ctx.fillRect(tx, 2, 3, 5);
          ctx.fillRect(tx, 29, 3, 5);
        }
        ctx.fillStyle = '#05070E';
        ctx.fillRect(5, 6, 50, 24);
        ctx.fillStyle = '#1F3A2E';
        ctx.fillRect(9, 9, 42, 18);
        ctx.fillStyle = '#2D5442';
        ctx.fillRect(10, 9, 39, 4);
        ctx.fillStyle = '#4ADE80';
        ctx.fillRect(10, 8, 36, 1);
        ctx.fillRect(10, 27, 36, 1);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(10, 11, 8, 14);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(52, 9, 2, 4);
        ctx.fillRect(52, 23, 2, 4);
        tex.refresh();
      }
    }

    // 11b. Tank Rotating Turret + Main Cannon (58x26, pivot at x=18, y=13)
    {
      const tex = this.textures.createCanvas('veh_tank_turret', 58, 26);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#05070E';
        ctx.fillRect(26, 9, 29, 8);
        ctx.fillStyle = '#64748B';
        ctx.fillRect(26, 11, 26, 4);
        ctx.fillStyle = '#4ADE80';
        ctx.fillRect(51, 10, 4, 6);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(5, 2, 26, 22);
        ctx.fillStyle = '#264D3B';
        ctx.fillRect(8, 5, 20, 16);
        ctx.fillStyle = '#4ADE80';
        ctx.fillRect(12, 8, 8, 10);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(14, 10, 4, 6);
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
        ctx.fillStyle = '#05070E';
        ctx.fillRect(5, 4, 15, 18);
        ctx.fillStyle = '#1E1B2E';
        ctx.fillRect(6, 5, 13, 16);
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(6, 7, 3, 12);
        ctx.fillRect(15, 4, 5, 4);
        ctx.fillRect(15, 18, 5, 4);
        ctx.fillStyle = '#05070E';
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
        ctx.fillStyle = '#05070E';
        ctx.fillRect(4, 4, 6, 6);
        ctx.fillRect(16, 4, 6, 6);
        ctx.fillRect(4, 16, 6, 6);
        ctx.fillRect(16, 16, 6, 6);
        ctx.fillRect(6, 6, 14, 14);
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
        ctx.fillStyle = '#05070E';
        ctx.fillRect(4, 3, 24, 28);
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
        ctx.fillStyle = '#05070E';
        ctx.fillRect(5, 3, 34, 40);
        ctx.fillStyle = '#332047';
        ctx.fillRect(9, 7, 26, 32);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(7, 8, 5, 30);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(23, 2, 20, 9);
        ctx.fillRect(23, 35, 20, 9);
        ctx.fillStyle = '#475569';
        ctx.fillRect(24, 3, 18, 7);
        ctx.fillRect(24, 36, 18, 7);
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(38, 4, 5, 5);
        ctx.fillRect(38, 37, 5, 5);
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
      ctx.fillStyle = '#05070E';
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
    makePickup('pickup_armor', '#0F2537', '#38BDF8', '#E0F2FE');
    makePickup('pickup_bribe', '#2E230B', '#FACC15', '#FEF08A');

    // Player Titan Heavy Mech (38x38)
    {
      const tex = this.textures.createCanvas('mech_titan', 38, 38);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#05070E';
        ctx.fillRect(4, 1, 18, 9);
        ctx.fillRect(4, 28, 18, 9);
        ctx.fillStyle = '#475569';
        ctx.fillRect(5, 2, 16, 7);
        ctx.fillRect(5, 29, 16, 7);
        ctx.fillStyle = '#FF4545';
        ctx.fillRect(19, 3, 3, 5);
        ctx.fillRect(19, 30, 3, 5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(16, 7, 19, 5);
        ctx.fillRect(16, 26, 19, 5);
        ctx.fillStyle = '#FFD166';
        ctx.fillRect(32, 8, 5, 3);
        ctx.fillRect(32, 27, 5, 3);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(6, 8, 20, 22);
        ctx.fillStyle = '#D97706';
        ctx.fillRect(9, 11, 14, 16);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(10, 11, 11, 3);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(19, 14, 6, 10);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(21, 16, 3, 6);
        tex.refresh();
      }
    }

    // Player Phantom Assault Mech (36x36)
    {
      const tex = this.textures.createCanvas('mech_phantom', 36, 36);
      if (tex) {
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(2, 10, 4, 5);
        ctx.fillRect(2, 21, 4, 5);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(13, 4, 21, 6);
        ctx.fillRect(13, 26, 21, 6);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(14, 5, 19, 4);
        ctx.fillRect(14, 27, 19, 4);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(29, 6, 6, 2);
        ctx.fillRect(29, 28, 6, 2);
        ctx.fillStyle = '#05070E';
        ctx.fillRect(5, 8, 19, 20);
        ctx.fillStyle = '#4338CA';
        ctx.fillRect(8, 11, 13, 14);
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(10, 12, 3, 12);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(18, 13, 6, 10);
        tex.refresh();
      }
    }
  }

  private createNpcTextures(): void {
    const palettes = [
      { coat: '#3B2859', trim: '#FF2E88', visor: '#FF2E88' },
      { coat: '#1D4254', trim: '#00F5FF', visor: '#FFD166' },
      { coat: '#2F3352', trim: '#C000FF', visor: '#00F5FF' },
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
        ctx.fillStyle = '#05070E';
        ctx.fillRect(8 + stride, 5, 4, 3);
        ctx.fillRect(8 - stride, 16, 4, 3);

        ctx.fillStyle = '#05070E';
        ctx.fillRect(5, 5, 12, 14);
        ctx.fillStyle = pal.coat;
        ctx.fillRect(6, 6, 10, 12);
        ctx.fillStyle = '#64748B';
        ctx.fillRect(6, 6, 9, 2);
        ctx.fillStyle = pal.trim;
        ctx.fillRect(6, 8, 2, 8);

        ctx.fillStyle = '#05070E';
        ctx.fillRect(9, 8, 7, 8);
        ctx.fillStyle = '#475569';
        ctx.fillRect(10, 9, 5, 6);
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(10, 9, 4, 2);

        ctx.fillStyle = pal.visor;
        ctx.fillRect(14, 10, 2, 4);

        tex.refresh();
      }
    });
  }

  private createPropTextures(): void {
    // 2.5D Upright Cyber Streetlamp (16x26)
    const lamp = this.textures.createCanvas('prop_lamp', 16, 26);
    if (lamp) {
      const ctx = lamp.getContext();
      ctx.imageSmoothingEnabled = false;
      // Base pedestal
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(4, 19, 8, 6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(5, 20, 6, 4);
      // Vertical post shaft
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(6, 7, 4, 14);
      ctx.fillStyle = '#64748B';
      ctx.fillRect(7, 7, 1, 13);
      // Lantern hood & neon bulb
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(3, 2, 10, 6);
      ctx.fillStyle = '#475569';
      ctx.fillRect(4, 3, 8, 2);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(5, 5, 6, 3);
      ctx.fillStyle = '#E0FFFF';
      ctx.fillRect(6, 5, 4, 2);
      lamp.refresh();
    }

    // 2.5D Upright Cyber Vending Machine (24x32)
    const vending = this.textures.createCanvas('prop_vending', 24, 32);
    if (vending) {
      const ctx = vending.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#090D16';
      ctx.fillRect(2, 2, 20, 28);
      // Top slanted bevel roof
      ctx.fillStyle = '#475569';
      ctx.fillRect(3, 3, 18, 5);
      // Front vertical body
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(3, 8, 18, 21);
      ctx.fillStyle = '#2D3C59';
      ctx.fillRect(4, 9, 14, 19);
      // Glowing cyber drink display window
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(5, 10, 11, 10);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(6, 12, 9, 3);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(6, 16, 9, 3);
      // Dispenser slot
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(6, 22, 11, 5);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(17, 11, 2, 5);
      vending.refresh();
    }

    // 2.5D Raised Neon Planter Box (28x28)
    const planter = this.textures.createCanvas('prop_planter', 28, 28);
    if (planter) {
      const ctx = planter.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(2, 4, 24, 22);
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 5, 22, 14);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(3, 19, 22, 6);
      ctx.fillStyle = '#C000FF';
      ctx.fillRect(2, 4, 24, 2);
      ctx.fillRect(2, 19, 24, 1);
      ctx.fillStyle = '#0F4C5C';
      ctx.fillRect(5, 7, 18, 11);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(7, 8, 5, 5);
      ctx.fillRect(15, 11, 5, 5);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(16, 7, 3, 3);
      ctx.fillRect(9, 13, 3, 3);
      planter.refresh();
    }

    // 2.5D Park Bench (32x18)
    const bench = this.textures.createCanvas('prop_bench', 32, 18);
    if (bench) {
      const ctx = bench.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(2, 2, 28, 13);
      ctx.fillStyle = '#475569';
      ctx.fillRect(4, 3, 24, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 9, 24, 5);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(4, 3, 2, 11);
      ctx.fillRect(26, 3, 2, 11);
      bench.refresh();
    }

    // 2.5D Upright Street Kiosk Booth (28x34)
    const kiosk = this.textures.createCanvas('prop_kiosk', 28, 34);
    if (kiosk) {
      const ctx = kiosk.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#090D16';
      ctx.fillRect(2, 2, 24, 30);
      // Canopy roof
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 2, 24, 8);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(2, 9, 24, 2);
      // Booth vertical front wall & counter window
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(3, 11, 22, 20);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(6, 13, 16, 9);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(8, 15, 12, 5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(5, 22, 18, 2);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(5, 4, 18, 3);
      kiosk.refresh();
    }

    // Bollard (12x16)
    const bollard = this.textures.createCanvas('prop_bollard', 12, 16);
    if (bollard) {
      const ctx = bollard.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(2, 2, 8, 12);
      ctx.fillStyle = '#64748B';
      ctx.fillRect(3, 3, 6, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 7, 6, 6);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(3, 5, 6, 2);
      bollard.refresh();
    }

    // Cone (12x14)
    const cone = this.textures.createCanvas('prop_cone', 12, 14);
    if (cone) {
      const ctx = cone.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(1, 9, 10, 4);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(4, 2, 4, 9);
      ctx.fillRect(3, 6, 6, 5);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(4, 5, 4, 3);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(5, 2, 2, 2);
      cone.refresh();
    }

    // Ramen Stool (12x14)
    const stool = this.textures.createCanvas('prop_stool', 12, 14);
    if (stool) {
      const ctx = stool.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(3, 8, 6, 5);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(2, 3, 8, 6);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(3, 4, 6, 3);
      stool.refresh();
    }

    // 2.5D Cyber Trashbin (16x20)
    const bin = this.textures.createCanvas('prop_trashbin', 16, 20);
    if (bin) {
      const ctx = bin.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(2, 2, 12, 16);
      ctx.fillStyle = '#475569';
      ctx.fillRect(3, 3, 10, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 7, 10, 10);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(4, 5, 8, 2);
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(5, 9, 6, 5);
      bin.refresh();
    }

    // 2.5D Raised Holo Billboard (48x24)
    const billboard = this.textures.createCanvas('prop_billboard', 48, 24);
    if (billboard) {
      const ctx = billboard.getContext();
      ctx.imageSmoothingEnabled = false;
      // Twin steel support posts
      ctx.fillStyle = '#334155';
      ctx.fillRect(10, 14, 4, 9);
      ctx.fillRect(34, 14, 4, 9);
      // Raised holo screen frame
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(0, 2, 48, 13);
      ctx.fillStyle = '#20283A';
      ctx.fillRect(2, 3, 44, 11);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(2, 3, 44, 2);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(2, 12, 44, 2);
      billboard.refresh();
    }

    // 2.5D Upright Traffic Signal Post (14x22)
    const signal = this.textures.createCanvas('prop_signal', 14, 22);
    if (signal) {
      const ctx = signal.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(5, 11, 4, 10);
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 11, 2, 9);
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(2, 1, 10, 11);
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 2, 8, 9);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(4, 3, 6, 7);
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

    // Helper to paint 2.5D comic-inked stepped canopy clusters (thick #05070E ink + cel tufts)
    const drawRoundedCanopy = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      trunkColor: string,
      _outlineColor: string,
      darkColor: string,
      midColor: string,
      lightColor: string,
      accentColor?: string
    ) => {
      ctx.fillStyle = 'rgba(5, 7, 14, 0.52)';
      ctx.fillRect(cx - 7, cy + 12, 14, 5);
      // Tall 2.5D trunk with comic ink outline
      ctx.fillStyle = '#05070E';
      ctx.fillRect(cx - 3, cy + 1, 7, 15);
      ctx.fillStyle = trunkColor;
      ctx.fillRect(cx - 2, cy + 2, 5, 13);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(cx - 2, cy + 2, 2, 12);
      // Bold #05070E comic ink canopy silhouette
      ctx.fillStyle = '#05070E';
      ctx.fillRect(cx - 10, cy - 14, 20, 20);
      ctx.fillRect(cx - 13, cy - 10, 26, 13);
      ctx.fillRect(cx - 7, cy - 16, 14, 23);
      // Base canopy shadow tone
      ctx.fillStyle = darkColor;
      ctx.fillRect(cx - 8, cy - 12, 16, 16);
      ctx.fillRect(cx - 11, cy - 8, 22, 9);
      // Midtone leaf tufts
      ctx.fillStyle = midColor;
      ctx.fillRect(cx - 9, cy - 10, 14, 11);
      ctx.fillRect(cx - 5, cy - 13, 10, 12);
      // Sunlit cel top-left crown highlights
      ctx.fillStyle = lightColor;
      ctx.fillRect(cx - 7, cy - 11, 7, 6);
      ctx.fillRect(cx + 1, cy - 6, 4, 4);
      if (accentColor) {
        ctx.fillStyle = accentColor;
        ctx.fillRect(cx - 6, cy - 10, 3, 2);
        ctx.fillRect(cx + 2, cy - 4, 2, 2);
      }
    };

    // 2.5D Alpine Pine Tree (32x38 comic-inked conifer layers)
    const pine = this.textures.createCanvas('prop_tree_pine', 32, 38);
    if (pine) {
      const ctx = pine.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(5, 7, 14, 0.5)';
      ctx.fillRect(8, 30, 16, 6);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(13, 23, 7, 12);
      ctx.fillStyle = '#5C3820';
      ctx.fillRect(14, 23, 5, 11);
      // Bold #05070E comic ink silhouette
      ctx.fillStyle = '#05070E';
      ctx.fillRect(5, 16, 22, 12);
      ctx.fillRect(7, 9, 18, 11);
      ctx.fillRect(10, 3, 12, 10);
      ctx.fillRect(13, 0, 6, 5);
      ctx.fillStyle = '#155E3E';
      ctx.fillRect(8, 18, 16, 7);
      ctx.fillRect(10, 11, 12, 7);
      ctx.fillRect(12, 5, 8, 6);
      ctx.fillStyle = '#228B57';
      ctx.fillRect(9, 18, 11, 5);
      ctx.fillRect(11, 11, 8, 5);
      ctx.fillRect(13, 6, 5, 4);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(14, 3, 2, 3);
      ctx.fillRect(11, 12, 3, 2);
      pine.refresh();
    }

    // 2.5D Park Cyber Sakura / Blossom Tree (32x38)
    const sakura = this.textures.createCanvas('prop_tree_sakura', 32, 38);
    if (sakura) {
      const ctx = sakura.getContext();
      ctx.imageSmoothingEnabled = false;
      drawRoundedCanopy(ctx, 16, 18, '#5C2544', '#05070E', '#9D174D', '#EC4899', '#F472B6', '#FBCFE8');
      sakura.refresh();
    }

    // 2.5D Lush Emerald Broadleaf Forest Tree (32x38)
    const emerald = this.textures.createCanvas('prop_tree_emerald', 32, 38);
    if (emerald) {
      const ctx = emerald.getContext();
      ctx.imageSmoothingEnabled = false;
      drawRoundedCanopy(ctx, 16, 18, '#5C3820', '#05070E', '#14532D', '#16A34A', '#4ADE80', '#BBF7D0');
      emerald.refresh();
    }

    // 2.5D Autumn / Desert Gold-Amber Tree (32x38)
    const autumn = this.textures.createCanvas('prop_tree_autumn', 32, 38);
    if (autumn) {
      const ctx = autumn.getContext();
      ctx.imageSmoothingEnabled = false;
      drawRoundedCanopy(ctx, 16, 18, '#5C2A0E', '#05070E', '#9A3412', '#EA580C', '#FACC15', '#FEF08A');
      autumn.refresh();
    }

    // 2.5D Snow-Dusted Alpine Pine (32x38)
    const snowTree = this.textures.createCanvas('prop_tree_snow', 32, 38);
    if (snowTree) {
      const ctx = snowTree.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(5, 7, 14, 0.48)';
      ctx.fillRect(8, 30, 16, 6);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(13, 23, 7, 12);
      ctx.fillStyle = '#5C3820';
      ctx.fillRect(14, 23, 5, 11);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(5, 16, 22, 12);
      ctx.fillRect(7, 9, 18, 11);
      ctx.fillRect(10, 3, 12, 10);
      ctx.fillStyle = '#1D5E4C';
      ctx.fillRect(8, 18, 16, 7);
      ctx.fillRect(10, 11, 12, 7);
      ctx.fillStyle = '#BAE6FD';
      ctx.fillRect(7, 17, 18, 3);
      ctx.fillRect(9, 10, 14, 3);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(9, 17, 12, 2);
      ctx.fillRect(11, 10, 9, 2);
      ctx.fillRect(12, 4, 8, 4);
      snowTree.refresh();
    }

    // 2.5D Tropical Coastal Palm Tree (34x40 curved trunk + high frond canopy)
    const palm = this.textures.createCanvas('prop_tree_palm', 34, 40);
    if (palm) {
      const ctx = palm.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(5, 7, 14, 0.42)';
      ctx.fillRect(11, 31, 13, 6);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(14, 15, 6, 20);
      ctx.fillStyle = '#855331';
      ctx.fillRect(16, 15, 3, 18);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(3, 9, 28, 7);
      ctx.fillRect(13, 1, 8, 22);
      ctx.fillRect(6, 4, 22, 16);
      ctx.fillStyle = '#15803D';
      ctx.fillRect(5, 11, 24, 3);
      ctx.fillRect(15, 3, 4, 18);
      ctx.fillRect(8, 6, 18, 12);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(7, 11, 20, 2);
      ctx.fillRect(16, 4, 2, 15);
      ctx.fillRect(10, 7, 14, 4);
      ctx.fillStyle = '#86EFAC';
      ctx.fillRect(14, 9, 6, 4);
      ctx.fillStyle = '#451A03';
      ctx.fillRect(15, 14, 2, 2);
      ctx.fillRect(18, 14, 2, 2);
      palm.refresh();
    }

    // 2.5D Upright Cyber ATM Terminal (20x26)
    const atm = this.textures.createCanvas('prop_atm', 20, 26);
    if (atm) {
      const ctx = atm.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05070E';
      ctx.fillRect(1, 1, 18, 24);
      ctx.fillStyle = '#475569';
      ctx.fillRect(3, 3, 14, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, 7, 14, 16);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(5, 8, 10, 7);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(6, 9, 5, 2);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(6, 17, 8, 3);
      atm.refresh();
    }

    // 2.5D Upright Explosive Red Fuel Barrel (18x22)
    const barrel = this.textures.createCanvas('prop_barrel', 18, 22);
    if (barrel) {
      const ctx = barrel.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05070E';
      ctx.fillRect(1, 1, 16, 20);
      ctx.fillStyle = '#FCA5A5';
      ctx.fillRect(4, 3, 10, 4);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(11, 4, 2, 2);
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(3, 7, 12, 12);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(4, 7, 8, 11);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(3, 11, 12, 3);
      barrel.refresh();
    }

    // 2.5D Upright Supply Crate (22x24)
    const crate = this.textures.createCanvas('prop_crate', 22, 24);
    if (crate) {
      const ctx = crate.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05070E';
      ctx.fillRect(1, 1, 20, 22);
      ctx.fillStyle = '#B87E4C';
      ctx.fillRect(3, 3, 16, 6);
      ctx.fillStyle = '#784E2C';
      ctx.fillRect(3, 9, 16, 12);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(5, 14, 12, 2);
      ctx.fillRect(10, 9, 2, 11);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(4, 4, 2, 2);
      ctx.fillRect(16, 4, 2, 2);
      ctx.fillRect(4, 18, 2, 2);
      ctx.fillRect(16, 18, 2, 2);
      crate.refresh();
    }

    // 2.5D Upright Fire Hydrant (14x18)
    const hydrant = this.textures.createCanvas('prop_hydrant', 14, 18);
    if (hydrant) {
      const ctx = hydrant.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05070E';
      ctx.fillRect(2, 1, 10, 16);
      ctx.fillStyle = '#FCA5A5';
      ctx.fillRect(4, 3, 6, 3);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(4, 6, 6, 9);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(2, 8, 10, 2);
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(3, 13, 8, 2);
      hydrant.refresh();
    }

    // Highland Observatory Radar Dish (36x36)
    const radar = this.textures.createCanvas('prop_radar', 36, 36);
    if (radar) {
      const ctx = radar.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05070E';
      ctx.fillRect(5, 5, 26, 26);
      ctx.fillStyle = '#475569';
      ctx.fillRect(8, 8, 20, 20);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(11, 10, 14, 16);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(17, 6, 2, 14);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(16, 16, 4, 4);
      radar.refresh();
    }

    // Harbor Moored Cargo Barge (128x48)
    const barge = this.textures.createCanvas('prop_barge', 128, 48);
    if (barge) {
      const ctx = barge.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05070E';
      ctx.fillRect(3, 5, 122, 38);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(8, 8, 112, 32);
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(6, 6, 116, 3);
      ctx.fillRect(6, 39, 116, 3);
      // Deck containers with comic ink borders & top cel rims
      ctx.fillStyle = '#05070E';
      ctx.fillRect(15, 11, 38, 13);
      ctx.fillRect(55, 11, 38, 13);
      ctx.fillRect(15, 24, 38, 13);
      ctx.fillRect(55, 24, 38, 13);
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(16, 12, 36, 11);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(56, 12, 36, 11);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(16, 25, 36, 11);
      ctx.fillStyle = '#0D9488';
      ctx.fillRect(56, 25, 36, 11);
      ctx.fillStyle = '#05070E';
      ctx.fillRect(97, 10, 20, 28);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(98, 11, 18, 26);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(102, 14, 4, 20);
      barge.refresh();
    }

    // Harbor Moored Speedboat (44x20)
    const boat = this.textures.createCanvas('prop_speedboat', 44, 20);
    if (boat) {
      const ctx = boat.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05070E';
      ctx.fillRect(1, 2, 40, 16);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(4, 4, 34, 12);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(22, 6, 8, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(24, 7, 3, 3);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(6, 5, 14, 2);
      ctx.fillRect(6, 13, 14, 2);
      boat.refresh();
    }

    // Horde Auto-Sentry Tripod Base (24x24)
    const turretBase = this.textures.createCanvas('prop_turret', 24, 24);
    if (turretBase) {
      const ctx = turretBase.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(3, 3, 18, 18);
      ctx.fillStyle = '#334155';
      ctx.fillRect(5, 5, 14, 14);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(9, 9, 6, 6);
      turretBase.refresh();
    }

    // Horde Auto-Sentry Rotating Laser Gun (26x14)
    const turretGun = this.textures.createCanvas('prop_turret_gun', 26, 14);
    if (turretGun) {
      const ctx = turretGun.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(4, 2, 12, 10);
      ctx.fillStyle = '#64748B';
      ctx.fillRect(14, 5, 11, 4);
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(22, 5, 4, 4);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(7, 4, 5, 6);
      turretGun.refresh();
    }

    // 2.5D Cylindrical Holographic Projection Tower (44x96)
    const holoTower = this.textures.createCanvas('prop_holo_tower', 44, 96);
    if (holoTower) {
      const ctx = holoTower.getContext();
      ctx.imageSmoothingEnabled = false;
      // Ground shadow + base pedestal
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(4, 80, 36, 14);
      ctx.fillStyle = '#090D18';
      ctx.fillRect(6, 74, 32, 18);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(8, 76, 28, 12);
      ctx.fillStyle = '#475569';
      ctx.fillRect(10, 74, 24, 4);
      // Glowing cyan pedestal emitter ring
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(8, 77, 28, 2);
      ctx.fillStyle = '#E0FFFF';
      ctx.fillRect(14, 77, 16, 1);

      // Tall translucent glowing cyan hologram cylinder
      ctx.fillStyle = 'rgba(14, 165, 233, 0.24)';
      ctx.fillRect(9, 12, 26, 64);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.32)';
      ctx.fillRect(12, 14, 20, 60);
      // Crisp cylinder glass vertical side edges
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(9, 12, 2, 64);
      ctx.fillRect(33, 12, 2, 64);
      ctx.fillStyle = 'rgba(224, 255, 255, 0.55)';
      ctx.fillRect(11, 14, 1, 60);

      // Stylized cyber avatar silhouette inside hologram column
      ctx.fillStyle = 'rgba(224, 255, 255, 0.88)';
      ctx.fillRect(19, 20, 6, 7); // head
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(18, 27, 8, 3); // shoulders
      ctx.fillStyle = 'rgba(186, 230, 253, 0.86)';
      ctx.fillRect(17, 30, 10, 16); // torso
      ctx.fillRect(15, 31, 2, 12); // left arm
      ctx.fillRect(27, 31, 2, 12); // right arm
      ctx.fillRect(18, 46, 3, 18); // left leg
      ctx.fillRect(23, 46, 3, 18); // right leg
      // Neon scanlines & crown ring
      ctx.fillStyle = 'rgba(0, 245, 255, 0.72)';
      for (let sy = 18; sy <= 68; sy += 8) {
        ctx.fillRect(11, sy, 22, 1);
      }
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(7, 6, 30, 7);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(8, 11, 28, 2);
      ctx.fillStyle = '#FF2E88';
      ctx.fillRect(15, 7, 14, 2);
      holoTower.refresh();
    }

    // Waterfront Illuminated Neon Ferris Wheel (116x124)
    const ferris = this.textures.createCanvas('prop_ferris_wheel', 116, 124);
    if (ferris) {
      const ctx = ferris.getContext();
      ctx.imageSmoothingEnabled = false;
      const cx = 58;
      const cy = 54;
      const rOuter = 44;
      const rInner = 34;

      // Support A-frame legs
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 26, 118);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + 26, 118);
      ctx.stroke();

      // Glowing outer magenta ring & inner cyan ring
      ctx.strokeStyle = '#FF2E88';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#00F5FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
      ctx.stroke();

      // Radial spokes + glowing passenger pods
      const podCols = ['#FFD166', '#00F5FF', '#FF2E88', '#C000FF'];
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const px = Math.round(cx + Math.cos(ang) * rOuter);
        const py = Math.round(cy + Math.sin(ang) * rOuter);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.72)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.fillStyle = podCols[i % podCols.length];
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(cx - 6, cy - 6, 12, 12);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(cx - 3, cy - 3, 6, 6);
      ferris.refresh();
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
      ctx.fillStyle = 'rgba(224, 255, 255, 0.16)';
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(72, 2);
      ctx.lineTo(72, 42);
      ctx.lineTo(0, 29);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 245, 255, 0.14)';
      ctx.beginPath();
      ctx.moveTo(0, 17);
      ctx.lineTo(52, 8);
      ctx.lineTo(52, 36);
      ctx.lineTo(0, 27);
      ctx.closePath();
      ctx.fill();
      beam.refresh();
    }

    // Wet-pavement specular neon reflection pool (72x36 tintable stepped oval)
    const wetRef = this.textures.createCanvas('fx_wet_reflect', 72, 36);
    if (wetRef) {
      const ctx = wetRef.getContext();
      ctx.imageSmoothingEnabled = false;
      const drawOval = (rx: number, ry: number, alpha: number) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(36, 18, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      drawOval(35, 17, 0.12);
      drawOval(26, 12, 0.22);
      drawOval(16, 7, 0.34);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(14, 15, 44, 2);
      ctx.fillRect(20, 20, 32, 2);
      wetRef.refresh();
    }

    // Glowing red taillight rear glow/streak (30x22 facing LEFT -X)
    const tail = this.textures.createCanvas('fx_taillight', 30, 22);
    if (tail) {
      const ctx = tail.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(255, 45, 85, 0.24)';
      ctx.fillRect(0, 2, 26, 6);
      ctx.fillRect(0, 14, 26, 6);
      ctx.fillStyle = 'rgba(255, 70, 90, 0.65)';
      ctx.fillRect(14, 3, 14, 4);
      ctx.fillRect(14, 15, 14, 4);
      ctx.fillStyle = 'rgba(255, 220, 220, 0.9)';
      ctx.fillRect(25, 4, 4, 2);
      ctx.fillRect(25, 16, 4, 2);
      tail.refresh();
    }

    // Police helicopter ground spotlight pool (68x42)
    const spotPool = this.textures.createCanvas('fx_spotlight_pool', 68, 42);
    if (spotPool) {
      const ctx = spotPool.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(186, 230, 253, 0.16)';
      ctx.beginPath();
      ctx.ellipse(34, 21, 33, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(224, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.ellipse(34, 21, 22, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(34, 21, 26, 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      spotPool.refresh();
    }

    // V-shaped boat water wake (48x24 facing RIGHT +X)
    const wake = this.textures.createCanvas('fx_water_wake', 48, 24);
    if (wake) {
      const ctx = wake.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.58)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(44, 12);
      ctx.lineTo(4, 3);
      ctx.moveTo(44, 12);
      ctx.lineTo(4, 21);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(38, 12);
      ctx.lineTo(10, 7);
      ctx.moveTo(38, 12);
      ctx.lineTo(10, 17);
      ctx.stroke();
      wake.refresh();
    }

    // Weapon projectiles (facing RIGHT +X)
    const projColors: Array<{ key: string; outer: string; core: string }> = [
      { key: 'proj_cyan', outer: '#00F5FF', core: '#E0FFFF' },
      { key: 'proj_pink', outer: '#FF2E88', core: '#FFE4F1' },
      { key: 'proj_gold', outer: '#FFD166', core: '#FFFBEB' },
      { key: 'proj_violet', outer: '#C000FF', core: '#F5D0FE' },
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

    // Hyper-velocity electric railgun slug (26x6)
    const railTex = this.textures.createCanvas('proj_rail', 26, 6);
    if (railTex) {
      const ctx = railTex.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0EA5E9';
      ctx.fillRect(0, 1, 24, 4);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(4, 0, 20, 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(6, 2, 20, 2);
      railTex.refresh();
    }

    // Incendiary plasma flame puff (12x12)
    const flameTex = this.textures.createCanvas('proj_flame', 12, 12);
    if (flameTex) {
      const ctx = flameTex.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#EA580C';
      ctx.fillRect(2, 1, 8, 10);
      ctx.fillRect(1, 2, 10, 8);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(3, 2, 6, 8);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(4, 4, 4, 4);
      flameTex.refresh();
    }

    // Explosive cyber rocket (16x8)
    const rocketTex = this.textures.createCanvas('proj_rocket', 16, 8);
    if (rocketTex) {
      const ctx = rocketTex.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#F97316';
      ctx.fillRect(0, 2, 4, 4);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(1, 3, 2, 2);
      ctx.fillStyle = '#64748B';
      ctx.fillRect(4, 2, 8, 4);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(12, 1, 3, 6);
      ctx.fillRect(14, 2, 2, 4);
      rocketTex.refresh();
    }

    // Heavy Tank 120mm Shell (18x8)
    const tankShell = this.textures.createCanvas('proj_tank_shell', 18, 8);
    if (tankShell) {
      const ctx = tankShell.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(0, 2, 6, 4);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(5, 1, 9, 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(12, 2, 6, 4);
      tankShell.refresh();
    }

    // Mech High-Energy Plasma Bolt (16x8)
    const mechPlasma = this.textures.createCanvas('proj_mech_plasma', 16, 8);
    if (mechPlasma) {
      const ctx = mechPlasma.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#00F5FF';
      ctx.fillRect(1, 1, 14, 6);
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(4, 2, 10, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(7, 3, 7, 2);
      mechPlasma.refresh();
    }

    // Helicopter Autocannon Tracer (16x6)
    const heliTracer = this.textures.createCanvas('proj_heli_autocannon', 16, 6);
    if (heliTracer) {
      const ctx = heliTracer.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(0, 1, 14, 4);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(6, 2, 10, 2);
      heliTracer.refresh();
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

    // Scorch crater decal (36x36)
    const scorch = this.textures.createCanvas('fx_scorch', 36, 36);
    if (scorch) {
      const ctx = scorch.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(8, 10, 16, 0.72)';
      ctx.fillRect(6, 6, 24, 24);
      ctx.fillRect(3, 11, 30, 14);
      ctx.fillRect(11, 3, 14, 30);
      ctx.fillStyle = 'rgba(24, 28, 38, 0.85)';
      ctx.fillRect(11, 11, 14, 14);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
      ctx.fillRect(15, 15, 6, 6);
      scorch.refresh();
    }
  }
}
