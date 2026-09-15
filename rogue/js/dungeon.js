// ==== Génération du donjon ====

const MAP_W = 48;
const MAP_H = 32;
const WALL = 0;
const FLOOR = 1;

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function carveRoom(tiles, room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) tiles[y][x] = FLOOR;
  }
}

function carveCorridor(tiles, a, b) {
  let { x, y } = a;
  const horizontalFirst = Math.random() < 0.5;
  const stepX = () => { while (x !== b.x) { tiles[y][x] = FLOOR; x += Math.sign(b.x - x); } };
  const stepY = () => { while (y !== b.y) { tiles[y][x] = FLOOR; y += Math.sign(b.y - y); } };
  if (horizontalFirst) { stepX(); stepY(); } else { stepY(); stepX(); }
  tiles[y][x] = FLOOR;
}

function overlaps(a, b) {
  return a.x - 1 < b.x + b.w && a.x + a.w + 1 > b.x && a.y - 1 < b.y + b.h && a.y + a.h + 1 > b.y;
}

function center(room) {
  return { x: Math.floor(room.x + room.w / 2), y: Math.floor(room.y + room.h / 2) };
}

// Retourne { tiles, rooms } : des salles rectangulaires reliées en chaîne par des couloirs en L
function generateDungeon() {
  const tiles = Array.from({ length: MAP_H }, () => new Array(MAP_W).fill(WALL));
  const rooms = [];

  for (let tries = 0; tries < 80 && rooms.length < 10; tries++) {
    const w = randInt(4, 9);
    const h = randInt(4, 7);
    const room = { x: randInt(1, MAP_W - w - 2), y: randInt(1, MAP_H - h - 2), w, h };
    if (rooms.some((r) => overlaps(r, room))) continue;

    carveRoom(tiles, room);
    if (rooms.length > 0) carveCorridor(tiles, center(rooms[rooms.length - 1]), center(room));
    rooms.push(room);
  }

  return { tiles, rooms };
}

function randomFloorIn(room) {
  return { x: randInt(room.x, room.x + room.w - 1), y: randInt(room.y, room.y + room.h - 1) };
}

// ==== Champ de vision (lancer de rayons de Bresenham) ====

function lineIsClear(tiles, x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;

  while (x !== x1 || y !== y1) {
    if ((x !== x0 || y !== y0) && tiles[y][x] === WALL) return false;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
  return true;
}

function computeVisible(tiles, px, py, radius) {
  const visible = new Set();
  for (let y = py - radius; y <= py + radius; y++) {
    for (let x = px - radius; x <= px + radius; x++) {
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
      if ((x - px) ** 2 + (y - py) ** 2 > radius * radius) continue;
      if (lineIsClear(tiles, px, py, x, y)) visible.add(y * MAP_W + x);
    }
  }
  return visible;
}

// ==== Carte des distances depuis le joueur (pour que les monstres le poursuivent) ====

function distanceMap(tiles, fromX, fromY) {
  const dist = new Array(MAP_W * MAP_H).fill(Infinity);
  const queue = [[fromX, fromY]];
  dist[fromY * MAP_W + fromX] = 0;

  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    const d = dist[y * MAP_W + x];
    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx;
      const ny = y + dy;
      const idx = ny * MAP_W + nx;
      if (tiles[ny]?.[nx] !== FLOOR || dist[idx] !== Infinity) continue;
      dist[idx] = d + 1;
      queue.push([nx, ny]);
    }
  }
  return dist;
}

const DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
