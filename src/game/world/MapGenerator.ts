import { WORLD_CONFIG } from '../config/BalanceConfig';
import { CityRect, DistrictData } from './DistrictManager';

// Tile GID constants matching BootScene.ts createTilesetTexture() (1-indexed)
const T = {
  ASPHALT_PLAIN: 1,
  ASPHALT_WORN: 2,
  ROAD_DASH_H: 3,
  ROAD_DASH_V: 4,
  CROSSWALK_H: 5,
  CROSSWALK_V: 6,
  ROAD_ARROW_E: 7,
  ROAD_ARROW_W: 8,
  SIDEWALK_BASE: 9,
  SIDEWALK_CURB_TOP: 10,
  SIDEWALK_CURB_BOTTOM: 11,
  PLAZA_TILE_DARK: 12,
  PLAZA_TILE_NEON_P: 13,
  PLAZA_TILE_NEON_K: 14,
  PARKING_TARMAC: 15,
  PARKING_STALL: 16,
  BORDER_HAZARD: 17,
  MANHOLE_GRATE: 18,
  PUDDLE_CYAN: 19,
  PUDDLE_PINK: 20,
  SIDEWALK_DRAIN: 21,
  PLAZA_CENTER_CREST: 22,
  ROAD_STOP_LINE_H: 23,
  ROAD_STOP_LINE_V: 24,
  ALLEY_PAVER: 25,
  GARAGE_APRON: 28,
  RIVER_DEEP: 29,
  RIVER_SHORE: 30,
  BRIDGE_DECK: 31,
  BRIDGE_RAIL: 32,
  MOUNTAIN_BASE: 33,
  PARK_TURF: 36,
  WOOD_PIER: 37,
  RIVER_FOAM: 38,
  NITRO_PAD: 39,
  RAMP_TILE: 40,
  DOCK_CONCRETE: 41,
  HELIPAD_TILE: 42,
  CHROME_FLOOR: 43,
  SAND_SHORE: 44,
  SPEEDWAY_CURB_N: 45,
  SPEEDWAY_CURB_S: 46,
  HARBOR_HAZARD_EDGE: 47,
  HIGHLAND_ASPHALT: 48,
  PARK_COBBLE: 49,
  PARK_FLOWERBED: 50,
  SIDEWALK_CHROME: 52,
  WATER_SHALLOW: 53,
  WATERFALL_CASCADE: 54,
  FOREST_FLOOR: 55,
  SNOW_PLAIN: 56,
  DESERT_CANYON: 57,
  VOLCANIC_ROCK: 58,
  LAVA_MAGMA: 59,
  SAND_DUNE_EDGE: 60,
  DIRT_TRAIL: 61,
  BOARDWALK_COAST: 62,
  STADIUM_TURF: 63,
  PLAZA_ROUNDABOUT: 64,
} as const;

export interface TiledMapJson {
  compressionlevel: number;
  height: number;
  width: number;
  infinite: boolean;
  orientation: 'orthogonal';
  renderorder: 'right-down';
  tiledversion: string;
  tileheight: number;
  tilewidth: number;
  type: 'map';
  version: string;
  layers: Array<{
    id: number;
    name: string;
    type: 'tilelayer';
    width: number;
    height: number;
    opacity: number;
    visible: boolean;
    x: number;
    y: number;
    data: number[];
  }>;
  tilesets: Array<{
    columns: number;
    firstgid: number;
    image: string;
    imageheight: number;
    imagewidth: number;
    margin: number;
    name: string;
    spacing: number;
    tilecount: number;
    tileheight: number;
    tilewidth: number;
  }>;
}

/**
 * Deterministically synthesizes the full 150x112 (4800x3584) Tiled JSON map directly from
 * DistrictData so visual asphalt, sidewalks, crosswalks, biomes, rivers, bridges, speedways,
 * and runways stay 100% synchronized with physics colliders and the SVG tactical map.
 */
export function generateCityTilemap(district: DistrictData): TiledMapJson {
  const tileSize = WORLD_CONFIG.TILE_SIZE;
  const cols = Math.floor(WORLD_CONFIG.WIDTH / tileSize);
  const rows = Math.floor(WORLD_CONFIG.HEIGHT / tileSize);
  const total = cols * rows;

  const ground = new Array<number>(total).fill(T.ALLEY_PAVER);
  const details = new Array<number>(total).fill(0);

  const inBounds = (tx: number, ty: number) => tx >= 0 && tx < cols && ty >= 0 && ty < rows;
  const idx = (tx: number, ty: number) => ty * cols + tx;

  const fillRect = (arr: number[], r: CityRect, gid: number) => {
    const x0 = Math.max(0, Math.floor(r.x / tileSize));
    const y0 = Math.max(0, Math.floor(r.y / tileSize));
    const x1 = Math.min(cols, Math.ceil((r.x + r.w) / tileSize));
    const y1 = Math.min(rows, Math.ceil((r.y + r.h) / tileSize));
    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        arr[idx(tx, ty)] = gid;
      }
    }
  };

  // 1. District ambient ground bases
  for (const z of district.zones) {
    let baseGid: number = T.SIDEWALK_BASE;
    if (z.id === 'riverside-park') baseGid = T.FOREST_FLOOR;
    else if (z.id === 'skyline-highlands') baseGid = T.MOUNTAIN_BASE;
    else if (z.id === 'dark-harbor') baseGid = T.DOCK_CONCRETE;
    else if (z.id === 'chrome-town') baseGid = T.CHROME_FLOOR;
    else if (z.id === 'neon-skyport') baseGid = T.PARKING_TARMAC;
    fillRect(ground, z, baseGid);
  }

  // 2. Sidewalks & urban slabs
  for (const sw of district.sidewalks) {
    const isChrome = sw.x >= 1792 && sw.y >= 2048;
    fillRect(ground, sw, isChrome ? T.SIDEWALK_CHROME : T.SIDEWALK_BASE);
  }

  // 3. Parks, flower accents & cobblestone promenades
  for (const p of district.parks) {
    fillRect(ground, p, T.PARK_TURF);
    const x0 = Math.floor(p.x / tileSize);
    const y0 = Math.floor(p.y / tileSize);
    const x1 = Math.ceil((p.x + p.w) / tileSize);
    const y1 = Math.ceil((p.y + p.h) / tileSize);
    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        // Cobble promenade near river edge
        if (Math.abs(ty * tileSize - 1664) <= 32 || Math.abs(ty * tileSize - 1888) <= 16) {
          ground[idx(tx, ty)] = T.PARK_COBBLE;
        } else if ((tx * 7 + ty * 13) % 19 === 0) {
          ground[idx(tx, ty)] = T.PARK_FLOWERBED;
        }
      }
    }
  }

  // 4. Natural Biomes: Snow Alps, Red-Rock Desert, Volcano Obsidian, Molten Lava, Golden Beach Sand
  for (const s of district.snowZones) fillRect(ground, s, T.SNOW_PLAIN);
  for (const d of district.desertZones) {
    fillRect(ground, d, T.DESERT_CANYON);
    // Winding canyon dirt trail across desert
    fillRect(ground, { x: 4000, y: 544, w: 480, h: 64 }, T.DIRT_TRAIL);
  }
  for (const v of district.volcanoZones) fillRect(ground, v, T.VOLCANIC_ROCK);
  for (const lv of district.lavaZones) fillRect(ground, lv, T.LAVA_MAGMA);
  for (const sand of district.sandZones) {
    fillRect(ground, sand, T.SAND_SHORE);
    const x0 = Math.floor(sand.x / tileSize);
    const x1 = Math.ceil((sand.x + sand.w) / tileSize);
    const yBottom = Math.min(rows - 1, Math.ceil((sand.y + sand.h) / tileSize) - 1);
    if (sand.y + sand.h >= 3400 && sand.y < 3424) {
      for (let tx = x0; tx < x1; tx++) {
        ground[idx(tx, yBottom)] = T.SAND_DUNE_EDGE;
      }
    }
  }

  // 5. Harbor Docks & Timber/Coast Boardwalks
  for (const dock of district.docks) {
    const isPier = dock.h <= 256 && dock.y >= 3328;
    fillRect(ground, dock, isPier ? T.WOOD_PIER : T.DOCK_CONCRETE);
    if (!isPier) {
      const yEdge = Math.min(rows - 1, Math.ceil((dock.y + dock.h) / tileSize) - 1);
      const x0 = Math.floor(dock.x / tileSize);
      const x1 = Math.ceil((dock.x + dock.w) / tileSize);
      for (let tx = x0; tx < x1; tx++) {
        ground[idx(tx, yEdge)] = T.HARBOR_HAZARD_EDGE;
      }
    }
  }

  // 6. Plaza Tiles & Holographic Centerpiece Crest
  for (const pz of district.plazaZones) {
    const x0 = Math.floor(pz.x / tileSize);
    const y0 = Math.floor(pz.y / tileSize);
    const x1 = Math.ceil((pz.x + pz.w) / tileSize);
    const y1 = Math.ceil((pz.y + pz.h) / tileSize);
    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        if ((tx + ty) % 6 === 0) ground[idx(tx, ty)] = T.PLAZA_TILE_NEON_P;
        else if ((tx + ty) % 6 === 3) ground[idx(tx, ty)] = T.PLAZA_TILE_NEON_K;
        else ground[idx(tx, ty)] = T.PLAZA_TILE_DARK;
      }
    }
  }
  const pcx = Math.floor(district.plazaCenter.x / tileSize);
  const pcy = Math.floor(district.plazaCenter.y / tileSize);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (inBounds(pcx + dx, pcy + dy)) {
        ground[idx(pcx + dx, pcy + dy)] = T.PLAZA_CENTER_CREST;
      }
    }
  }

  // 7. Parking Lot & Stadium Apron
  fillRect(ground, district.parkingLot, T.PARKING_TARMAC);
  {
    const x0 = Math.floor(district.parkingLot.x / tileSize);
    const y0 = Math.floor(district.parkingLot.y / tileSize);
    const x1 = Math.ceil((district.parkingLot.x + district.parkingLot.w) / tileSize);
    const y1 = Math.ceil((district.parkingLot.y + district.parkingLot.h) / tileSize);
    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        if (ty % 2 === 0 && tx > x0 && tx < x1 - 1) {
          ground[idx(tx, ty)] = T.PARKING_STALL;
        }
      }
    }
  }
  fillRect(ground, { x: 2640, y: 1440, w: 384, h: 224 }, T.STADIUM_TURF);

  // 8. Skyport Runways & Helipads
  for (const rw of district.runways) {
    fillRect(ground, rw, T.ASPHALT_WORN);
    const x0 = Math.floor(rw.x / tileSize);
    const y0 = Math.floor(rw.y / tileSize);
    const x1 = Math.ceil((rw.x + rw.w) / tileSize);
    const y1 = Math.ceil((rw.y + rw.h) / tileSize);
    const midY = Math.floor((y0 + y1) / 2);
    for (let tx = x0; tx < x1; tx++) {
      ground[idx(tx, midY)] = T.ROAD_DASH_H;
      if (tx === x0 + 1 || tx === x1 - 2) {
        for (let ty = y0 + 1; ty < y1 - 1; ty++) {
          details[idx(tx, ty)] = T.CROSSWALK_V;
        }
      }
    }
  }
  for (const hp of district.helipads) {
    const htx = Math.floor(hp.x / tileSize);
    const hty = Math.floor(hp.y / tileSize);
    if (inBounds(htx, hty)) ground[idx(htx, hty)] = T.HELIPAD_TILE;
  }

  // 9. Rivers, Shallow Water Banks, Waterfalls
  for (const rv of district.rivers) {
    fillRect(ground, rv, T.RIVER_DEEP);
    const x0 = Math.floor(rv.x / tileSize);
    const y0 = Math.floor(rv.y / tileSize);
    const x1 = Math.ceil((rv.x + rv.w) / tileSize);
    const y1 = Math.ceil((rv.y + rv.h) / tileSize);
    for (let tx = x0; tx < x1; tx++) {
      if (inBounds(tx, y0)) ground[idx(tx, y0)] = T.WATER_SHALLOW;
      if (inBounds(tx, y1 - 1) && rv.y < 3000) ground[idx(tx, y1 - 1)] = T.WATER_SHALLOW;
      if ((tx * 5) % 11 === 0 && inBounds(tx, y0 + 2)) {
        details[idx(tx, y0 + 2)] = T.RIVER_FOAM;
      }
    }
  }
  for (const wf of district.waterfalls) {
    fillRect(ground, wf, T.WATERFALL_CASCADE);
  }

  // 10. Roads with dashed lane lines & speedway racing curbs
  const roadMask = new Uint8Array(total);
  for (const rd of district.roads) {
    const x0 = Math.max(0, Math.floor(rd.x / tileSize));
    const y0 = Math.max(0, Math.floor(rd.y / tileSize));
    const x1 = Math.min(cols, Math.ceil((rd.x + rd.w) / tileSize));
    const y1 = Math.min(rows, Math.ceil((rd.y + rd.h) / tileSize));
    const isHorizontal = rd.w >= rd.h;
    const isHighland = rd.x >= 3456 && rd.y < 1408;
    const isSpeedway = rd.y === 2816 && rd.x < 3456;

    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        const i = idx(tx, ty);
        const alreadyRoad = roadMask[i] === 1;
        roadMask[i] = 1;

        if (alreadyRoad) {
          // Intersection asphalt base
          ground[i] = T.ASPHALT_PLAIN;
          continue;
        }

        if (isHorizontal) {
          const localRow = ty - y0;
          const midRow = Math.floor((y1 - y0) / 2) - 1;
          if (isSpeedway && localRow === 0 && tx >= 56 && tx <= 104) {
            ground[i] = T.SPEEDWAY_CURB_N;
          } else if (isSpeedway && localRow === y1 - y0 - 1 && tx >= 56 && tx <= 104) {
            ground[i] = T.SPEEDWAY_CURB_S;
          } else if (localRow === midRow) {
            ground[i] = T.ROAD_DASH_H;
          } else if (isHighland) {
            ground[i] = T.HIGHLAND_ASPHALT;
          } else {
            ground[i] = (tx + ty) % 7 === 0 ? T.ASPHALT_WORN : T.ASPHALT_PLAIN;
          }
        } else {
          const localCol = tx - x0;
          const midCol = Math.floor((x1 - x0) / 2) - 1;
          if (localCol === midCol) {
            ground[i] = T.ROAD_DASH_V;
          } else {
            ground[i] = (tx + ty) % 7 === 0 ? T.ASPHALT_WORN : T.ASPHALT_PLAIN;
          }
        }
      }
    }
  }

  // 11. Bridges over River (drawn AFTER rivers & roads so bridge deck & trusses stay crisp!)
  for (const br of district.bridges) {
    const isWoodPier = br.w <= 96;
    const x0 = Math.floor(br.x / tileSize);
    const y0 = Math.floor(br.y / tileSize);
    const x1 = Math.ceil((br.x + br.w) / tileSize);
    const y1 = Math.ceil((br.y + br.h) / tileSize);
    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        if (!inBounds(tx, ty)) continue;
        if (isWoodPier) {
          ground[idx(tx, ty)] = T.WOOD_PIER;
        } else if (tx === x0 || tx === x1 - 1) {
          ground[idx(tx, ty)] = T.BRIDGE_RAIL;
        } else {
          ground[idx(tx, ty)] = T.BRIDGE_DECK;
        }
      }
    }
  }

  // 12. Intersection Crosswalks & Traffic Stop Lines around Traffic Signals
  for (const sig of district.trafficSignals) {
    const cx = Math.floor(sig.x / tileSize);
    const cy = Math.floor(sig.y / tileSize);
    // Crosswalks on all 4 arms of 4-tile-wide intersections
    for (let d = -2; d <= 1; d++) {
      if (inBounds(cx + d, cy - 3)) details[idx(cx + d, cy - 3)] = T.CROSSWALK_H;
      if (inBounds(cx + d, cy + 2)) details[idx(cx + d, cy + 2)] = T.CROSSWALK_H;
      if (inBounds(cx - 3, cy + d)) details[idx(cx - 3, cy + d)] = T.CROSSWALK_V;
      if (inBounds(cx + 2, cy + d)) details[idx(cx + 2, cy + d)] = T.CROSSWALK_V;
    }
    if (inBounds(cx, cy)) details[idx(cx, cy)] = T.PLAZA_ROUNDABOUT;
  }

  // 13. Nitro Boost Pads & Stunt Jump Ramps
  for (const ts of district.turboStrips) {
    fillRect(ground, ts, T.NITRO_PAD);
  }
  for (const sr of district.stuntRamps) {
    fillRect(ground, sr, T.RAMP_TILE);
  }

  // 14. Outer World Perimeter Hazard Trim
  for (let tx = 0; tx < cols; tx++) {
    ground[idx(tx, 0)] = T.BORDER_HAZARD;
  }
  for (let ty = 0; ty < rows; ty++) {
    ground[idx(0, ty)] = T.BORDER_HAZARD;
    ground[idx(cols - 1, ty)] = T.BORDER_HAZARD;
  }

  // 15. Garage aprons & subtle street puddles / grates
  for (const lm of district.landmarks) {
    if (lm.category === '维修与改装') {
      const gx = Math.floor(lm.x / tileSize);
      const gy = Math.floor(lm.y / tileSize);
      for (let dx = -1; dx <= 1; dx++) {
        if (inBounds(gx + dx, gy)) ground[idx(gx + dx, gy)] = T.GARAGE_APRON;
      }
    }
  }
  for (let ty = 3; ty < rows - 4; ty += 3) {
    for (let tx = 4; tx < cols - 4; tx += 4) {
      if (roadMask[idx(tx, ty)] === 1 && details[idx(tx, ty)] === 0) {
        const isUrban = tx < 108 && ty < 94;
        if (isUrban && (tx + ty) % 3 === 0) {
          details[idx(tx, ty)] = T.PUDDLE_CYAN;
        } else if (isUrban && (tx * 2 + ty) % 5 === 0) {
          details[idx(tx, ty)] = T.PUDDLE_PINK;
        } else if ((tx * 3 + ty) % 13 === 0) {
          details[idx(tx, ty)] = T.MANHOLE_GRATE;
        }
      }
    }
  }

  return {
    compressionlevel: -1,
    height: rows,
    width: cols,
    infinite: false,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.2',
    tileheight: tileSize,
    tilewidth: tileSize,
    type: 'map',
    version: '1.10',
    layers: [
      {
        id: 1,
        name: 'Ground',
        type: 'tilelayer',
        width: cols,
        height: rows,
        opacity: 1,
        visible: true,
        x: 0,
        y: 0,
        data: ground,
      },
      {
        id: 2,
        name: 'Details',
        type: 'tilelayer',
        width: cols,
        height: rows,
        opacity: 1,
        visible: true,
        x: 0,
        y: 0,
        data: details,
      },
    ],
    tilesets: [
      {
        columns: 8,
        firstgid: 1,
        image: 'neon_tileset.png',
        imageheight: 320,
        imagewidth: 256,
        margin: 0,
        name: 'neon_tileset',
        spacing: 0,
        tilecount: 80,
        tileheight: tileSize,
        tilewidth: tileSize,
      },
    ],
  };
}
