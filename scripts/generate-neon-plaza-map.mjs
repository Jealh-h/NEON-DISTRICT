import fs from 'node:fs';
import path from 'node:path';

const COLS = 100; // 100 * 32 = 3200
const ROWS = 75;  // 75 * 32 = 2400
const TILE_SIZE = 32;

const T = {
  EMPTY: 0,
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
  DISTRICT_GATE_W: 26,
  DISTRICT_GATE_S: 27,
  GARAGE_APRON: 28,
  RIVER_DEEP: 29,
  RIVER_SHORE: 30,
  BRIDGE_DECK: 31,
  BRIDGE_RAIL: 32,
  MOUNTAIN_BASE: 33,
  MOUNTAIN_CLIFF: 34,
  MOUNTAIN_PEAK: 35,
  PARK_TURF: 36,
  WOOD_PIER: 37,
  RIVER_FOAM: 38,
  NITRO_PAD: 39,
  RAMP_TILE: 40,
  DOCK_CONCRETE: 41,
  HELIPAD_TILE: 42,
  CHROME_FLOOR: 43,
  SAND_SHORE: 44,
};

const ground = new Array(COLS * ROWS).fill(T.SIDEWALK_BASE);
const detail = new Array(COLS * ROWS).fill(T.EMPTY);

const idx = (c, r) => r * COLS + c;
const setGround = (c, r, tile) => {
  if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
    ground[idx(c, r)] = tile;
  }
};
const setDetail = (c, r, tile) => {
  if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
    detail[idx(c, r)] = tile;
  }
};

// 1. District ground bases
// 1a. Skyline Highlands East of river (cols 58..98, rows 1..48)
for (let r = 1; r <= 48; r++) {
  for (let c = 58; c < COLS - 1; c++) {
    setGround(c, r, T.MOUNTAIN_BASE);
  }
}

// 1b. Chrome Town Industrial South-East (cols 58..98, rows 49..73)
for (let r = 49; r < ROWS - 1; r++) {
  for (let c = 58; c < COLS - 1; c++) {
    setGround(c, r, T.CHROME_FLOOR);
  }
}

// 1c. Riverside Park (cols 1..50, rows 37..48)
for (let r = 37; r <= 48; r++) {
  for (let c = 1; c <= 50; c++) {
    setGround(c, r, T.PARK_TURF);
  }
}
for (let r = 37; r <= 48; r++) {
  for (let c = 23; c <= 26; c++) {
    setGround(c, r, T.SIDEWALK_BASE);
  }
}
for (let c = 13; c <= 36; c++) {
  setGround(c, 39, T.SIDEWALK_BASE);
  setGround(c, 46, T.SIDEWALK_BASE);
}

// 1d. Dark Harbor Industrial Docks (cols 1..50, rows 53..68)
for (let r = 53; r <= 68; r++) {
  for (let c = 1; c <= 50; c++) {
    setGround(c, r, T.DOCK_CONCRETE);
  }
}

// Helipad in West Dark Harbor (cols 3..7, rows 55..59)
for (let r = 55; r <= 59; r++) {
  for (let c = 3; c <= 7; c++) {
    setGround(c, r, T.HELIPAD_TILE);
  }
}

// 2. Alley pavers in Neon Plaza
for (let r = 1; r <= 7; r++) {
  for (let c = 23; c <= 25; c++) setGround(c, r, T.ALLEY_PAVER);
}
for (let r = 18; r <= 19; r++) {
  for (let c = 1; c <= 8; c++) setGround(c, r, T.ALLEY_PAVER);
}

// 3. Central Neon Plaza & connectors
for (let r = 17; r <= 20; r++) {
  for (let c = 16; c <= 33; c++) {
    const isEdge = r === 17 || r === 20 || c === 16 || c === 33;
    const isInner = (c === 24 || c === 25) && (r === 18 || r === 19);
    if (isInner) {
      setGround(c, r, T.PLAZA_CENTER_CREST);
    } else if (isEdge) {
      setGround(c, r, (c + r) % 2 === 0 ? T.PLAZA_TILE_NEON_P : T.PLAZA_TILE_NEON_K);
    } else {
      setGround(c, r, T.PLAZA_TILE_DARK);
    }
  }
}
for (let r = 12; r <= 16; r++) {
  for (let c = 23; c <= 26; c++) {
    setGround(c, r, c === 23 || c === 26 ? T.PLAZA_TILE_NEON_P : T.PLAZA_TILE_DARK);
  }
}
for (let r = 21; r <= 25; r++) {
  for (let c = 22; c <= 27; c++) {
    setGround(c, r, c === 22 || c === 27 ? T.PLAZA_TILE_NEON_K : T.PLAZA_TILE_DARK);
  }
}

// 4. Parking lot (cols 42..47, rows 13..24) & Garage apron
for (let r = 13; r <= 24; r++) {
  for (let c = 42; c <= 47; c++) {
    setGround(c, r, T.PARKING_TARMAC);
  }
}
for (let r = 15; r <= 23; r++) {
  if (r % 2 === 1) {
    setGround(46, r, T.PARKING_STALL);
    setGround(47, r, T.PARKING_STALL);
  }
}
for (let c = 43; c <= 46; c++) {
  setGround(c, 30, T.GARAGE_APRON);
}

// 5. Full City Road Network (3200 x 2400)
const isHorizRoad = (r, c) =>
  (((r >= 8 && r <= 11) || (r >= 26 && r <= 29) || (r >= 49 && r <= 52)) && c >= 1 && c <= 91) ||
  ((r >= 65 && r <= 68) && c >= 9 && c <= 91);

const isVertRoad = (c, r) =>
  (((c >= 9 && c <= 12) || (c >= 37 && c <= 40)) && r >= 1 && r <= 68) ||
  ((c >= 59 && c <= 62) && r >= 8 && r <= 68) ||
  ((c >= 68 && c <= 70) && r >= 8 && r <= 52) ||
  ((c >= 73 && c <= 76) && r >= 49 && r <= 68) ||
  ((c >= 88 && c <= 91) && r >= 8 && r <= 68);

for (let r = 1; r < ROWS - 1; r++) {
  for (let c = 1; c < COLS - 1; c++) {
    const hRoad = isHorizRoad(r, c);
    const vRoad = isVertRoad(c, r);

    if (hRoad && vRoad) {
      setGround(c, r, T.ASPHALT_PLAIN);
    } else if (hRoad) {
      const isEdge = r === 8 || r === 11 || r === 26 || r === 29 || r === 49 || r === 52 || r === 65 || r === 68;
      const isDash = r === 9 || r === 27 || r === 50 || r === 66;
      if (isDash) {
        setGround(c, r, T.ROAD_DASH_H);
      } else if (isEdge) {
        setGround(c, r, T.ASPHALT_WORN);
      } else {
        setGround(c, r, T.ASPHALT_PLAIN);
      }
    } else if (vRoad) {
      const isDash = c === 10 || c === 38 || c === 60 || c === 69 || c === 74 || c === 89;
      const isEdge =
        c === 9 || c === 12 || c === 37 || c === 40 || c === 59 || c === 62 ||
        c === 68 || c === 70 || c === 73 || c === 76 || c === 88 || c === 91;
      if (isDash) {
        setGround(c, r, T.ROAD_DASH_V);
      } else if (isEdge) {
        setGround(c, r, T.ASPHALT_WORN);
      } else {
        setGround(c, r, T.ASPHALT_PLAIN);
      }
    }
  }
}

// 6. Crosswalks & stop lines at core downtown intersections
const intCols = [9, 37];
const intRows = [8, 26, 49, 65];
for (const ic of intCols) {
  for (const ir of intRows) {
    for (let dc = 0; dc < 4; dc++) {
      if (ir > 2) {
        setGround(ic + dc, ir - 1, T.CROSSWALK_H);
        setDetail(ic + dc, ir - 2, T.ROAD_STOP_LINE_H);
      }
      if (ir + 4 < 69) {
        setGround(ic + dc, ir + 4, T.CROSSWALK_H);
        setDetail(ic + dc, ir + 5, T.ROAD_STOP_LINE_H);
      }
    }
    for (let dr = 0; dr < 4; dr++) {
      setGround(ic - 1, ir + dr, T.CROSSWALK_V);
      setGround(ic + 4, ir + dr, T.CROSSWALK_V);
      setDetail(ic - 2, ir + dr, T.ROAD_STOP_LINE_V);
      setDetail(ic + 5, ir + dr, T.ROAD_STOP_LINE_V);
    }
  }
}

// 7. Neon Cyber River (cols 52..56, rows 1..68) + 4 Drivable Bridges
const isBridgeRow = (r) =>
  (r >= 8 && r <= 11) || (r >= 26 && r <= 29) || (r >= 49 && r <= 52) || (r >= 65 && r <= 68);
const isBridgeRailRow = (r) =>
  r === 7 || r === 12 || r === 25 || r === 30 || r === 48 || r === 53 || r === 64;

for (let r = 1; r <= 68; r++) {
  if (isBridgeRow(r)) {
    for (let c = 51; c <= 57; c++) {
      setGround(c, r, T.BRIDGE_DECK);
      setDetail(c, r, T.EMPTY);
    }
    if (r === 9 || r === 27 || r === 50 || r === 66) {
      for (let c = 51; c <= 57; c++) {
        setDetail(c, r, T.ROAD_STOP_LINE_V);
      }
    }
  } else {
    setGround(51, r, T.RIVER_SHORE);
    setGround(57, r, T.RIVER_SHORE);
    for (let c = 52; c <= 56; c++) {
      if (isBridgeRailRow(r)) {
        setGround(c, r, T.BRIDGE_RAIL);
      } else {
        setGround(c, r, T.RIVER_DEEP);
        if ((c + r * 3) % 7 === 0) {
          setDetail(c, r, T.RIVER_FOAM);
        }
      }
    }
  }
}

// 7b. Southern Dark Harbor Bay (cols 1..57, rows 69..73) + West & East Cargo Piers
for (let r = 69; r <= 73; r++) {
  for (let c = 1; c <= 57; c++) {
    const isWestPier = c >= 14 && c <= 18 && r >= 69 && r <= 72;
    const isEastPier = c >= 32 && c <= 36 && r >= 69 && r <= 72;
    if (isWestPier || isEastPier) {
      setGround(c, r, T.WOOD_PIER);
      setDetail(c, r, T.EMPTY);
    } else if (r === 69 && c <= 51) {
      setGround(c, r, T.SAND_SHORE);
      setDetail(c, r, T.EMPTY);
    } else {
      setGround(c, r, T.RIVER_DEEP);
      if ((c + r * 2) % 6 === 0) {
        setDetail(c, r, T.RIVER_FOAM);
      }
    }
  }
}

// 8. Riverside Park Emerald Lagoon (cols 16..33, rows 41..44) + Center Wooden Pier Bridge (cols 23..26)
for (let r = 40; r <= 45; r++) {
  for (let c = 15; c <= 34; c++) {
    const isPier = c >= 23 && c <= 26;
    const isLagoonWater = r >= 41 && r <= 44 && c >= 16 && c <= 33;
    if (isPier && isLagoonWater) {
      setGround(c, r, T.WOOD_PIER);
    } else if (isLagoonWater) {
      setGround(c, r, T.RIVER_DEEP);
      if ((c * 2 + r) % 6 === 0) {
        setDetail(c, r, T.RIVER_FOAM);
      }
    } else if (!isPier) {
      setGround(c, r, T.RIVER_SHORE);
    }
  }
}

// 9. Highland Mountains (Cliffs & Peaks across East Highlands)
const fillMountainBlock = (c1, r1, c2, r2) => {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const isInner = c > c1 && c < c2 && r > r1 && r < r2;
      setGround(c, r, isInner ? T.MOUNTAIN_PEAK : T.MOUNTAIN_CLIFF);
      setDetail(c, r, T.EMPTY);
    }
  }
};

fillMountainBlock(59, 2, 88, 6);
fillMountainBlock(64, 13, 66, 24);
fillMountainBlock(71, 12, 86, 24);
fillMountainBlock(64, 32, 66, 46);
fillMountainBlock(71, 31, 86, 46);
fillMountainBlock(93, 12, 97, 46);

// 10. Turbo Boost Pads & Stunt Jump Ramps
const nitroPads = [
  [64, 50], [65, 50], [64, 51], [65, 51],
  [79, 50], [80, 50], [79, 51], [80, 51],
  [66, 66], [67, 66], [66, 67], [67, 67],
  [81, 66], [82, 66], [81, 67], [82, 67],
  [89, 18], [90, 18], [89, 19], [90, 19],
  [89, 38], [90, 38], [89, 39], [90, 39],
  [89, 57], [90, 57], [89, 58], [90, 58],
  [77, 9], [78, 9], [77, 10], [78, 10],
  [22, 66], [23, 66], [22, 67], [23, 67],
];
for (const [c, r] of nitroPads) {
  setGround(c, r, T.NITRO_PAD);
}

const rampTiles = [
  [6, 60], [7, 60], [6, 61], [7, 61],
  [46, 9], [47, 9], [46, 10], [47, 10],
  [83, 50], [84, 50], [83, 51], [84, 51],
  [33, 69], [34, 69], [35, 69],
  [60, 39], [61, 39], [60, 40], [61, 40],
];
for (const [c, r] of rampTiles) {
  setGround(c, r, T.RAMP_TILE);
}

// 11. Road directional arrows & district exit gates
for (const r of [11, 29, 52, 68]) {
  setDetail(20, r, T.ROAD_ARROW_E);
  setDetail(32, r, T.ROAD_ARROW_E);
  setDetail(54, r, T.ROAD_ARROW_E);
  setDetail(72, r, T.ROAD_ARROW_E);
}
for (const r of [8, 26, 49, 65]) {
  setDetail(21, r, T.ROAD_ARROW_W);
  setDetail(33, r, T.ROAD_ARROW_W);
  setDetail(54, r, T.ROAD_ARROW_W);
  setDetail(72, r, T.ROAD_ARROW_W);
}

for (let r = 8; r <= 11; r++) setDetail(1, r, T.DISTRICT_GATE_W);

// 12. Outer perimeter hazard border
for (let c = 0; c < COLS; c++) {
  setGround(c, 0, T.BORDER_HAZARD);
  setGround(c, ROWS - 1, T.BORDER_HAZARD);
}
for (let r = 0; r < ROWS; r++) {
  setGround(0, r, T.BORDER_HAZARD);
  setGround(COLS - 1, r, T.BORDER_HAZARD);
}

// 13. Street details: manholes, puddles, sidewalk drains
const manholes = [
  [18, 10], [31, 9], [11, 18], [39, 19], [20, 28], [34, 27],
  [20, 50], [44, 51], [60, 20], [69, 36], [26, 66], [70, 51], [89, 28],
];
for (const [c, r] of manholes) setDetail(c, r, T.MANHOLE_GRATE);

const cyanPuddles = [
  [15, 11], [27, 9], [10, 22], [38, 15], [29, 28],
  [45, 9], [60, 14], [18, 51], [69, 44], [16, 66], [42, 67], [84, 66],
];
for (const [c, r] of cyanPuddles) setDetail(c, r, T.PUDDLE_CYAN);

const pinkPuddles = [
  [6, 10], [23, 27], [12, 15], [39, 24], [43, 19],
  [45, 28], [60, 40], [32, 50], [28, 67], [63, 51], [74, 58],
];
for (const [c, r] of pinkPuddles) setDetail(c, r, T.PUDDLE_PINK);

const drains = [
  [14, 12], [22, 12], [27, 12], [35, 12], [14, 25], [35, 25],
];
for (const [c, r] of drains) setDetail(c, r, T.SIDEWALK_DRAIN);

const tiledMap = {
  compressionlevel: -1,
  height: ROWS,
  infinite: false,
  layers: [
    {
      data: ground,
      height: ROWS,
      id: 1,
      name: 'Ground',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      width: COLS,
      x: 0,
      y: 0,
    },
    {
      data: detail,
      height: ROWS,
      id: 2,
      name: 'Details',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      width: COLS,
      x: 0,
      y: 0,
    },
  ],
  nextlayerid: 3,
  nextobjectid: 1,
  orientation: 'orthogonal',
  renderorder: 'right-down',
  tiledversion: '1.10.2',
  tileheight: TILE_SIZE,
  tilesets: [
    {
      columns: 8,
      firstgid: 1,
      image: 'neon_tileset',
      imageheight: 192,
      imagewidth: 256,
      margin: 0,
      name: 'neon_tileset',
      spacing: 0,
      tilecount: 48,
      tileheight: TILE_SIZE,
      tilewidth: TILE_SIZE,
    },
  ],
  tilewidth: TILE_SIZE,
  type: 'map',
  version: '1.10',
  width: COLS,
};

const outDir = path.resolve(process.cwd(), 'public', 'maps');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'neon_plaza.json'), JSON.stringify(tiledMap));
console.log(`Generated ${path.join(outDir, 'neon_plaza.json')} (${COLS}x${ROWS})`);
