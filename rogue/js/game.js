const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const boardEl = document.querySelector(".board");
const statsEl = document.getElementById("stats");
const logEl = document.getElementById("log");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const overlayBtn = document.getElementById("overlay-btn");

const TILE = 24;
const VIEW_W = canvas.width / TILE;
const VIEW_H = canvas.height / TILE;
const SIGHT = 7;
const BEST_KEY = "rogue-best";

// Monstres par profondeur minimale d'apparition
const MONSTERS = [
  { name: "Rat", glyph: "🐀", hp: 4, atk: 2, def: 0, xp: 2, minDepth: 1 },
  { name: "Chauve-souris", glyph: "🦇", hp: 5, atk: 3, def: 0, xp: 3, minDepth: 1 },
  { name: "Gobelin", glyph: "👺", hp: 9, atk: 4, def: 1, xp: 5, minDepth: 2 },
  { name: "Squelette", glyph: "💀", hp: 12, atk: 5, def: 2, xp: 8, minDepth: 3 },
  { name: "Orc", glyph: "👹", hp: 18, atk: 7, def: 2, xp: 12, minDepth: 4 },
  { name: "Fantôme", glyph: "👻", hp: 14, atk: 8, def: 4, xp: 15, minDepth: 5 },
  { name: "Dragon", glyph: "🐉", hp: 35, atk: 10, def: 4, xp: 40, minDepth: 7 },
];

const ITEMS = [
  { kind: "potion", glyph: "🧪", weight: 4 },
  { kind: "gold", glyph: "💰", weight: 5 },
  { kind: "sword", glyph: "🗡️", weight: 1 },
  { kind: "shield", glyph: "🛡️", weight: 1 },
];

let state = null;

// ==== Utilitaires ====

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // stockage indisponible : le meilleur score ne sera pas conservé
  }
}

function log(msg) {
  state.messages.unshift(msg);
  state.messages.length = Math.min(state.messages.length, 4);
}

function weightedPick(list) {
  const total = list.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  return list.find((i) => (roll -= i.weight) < 0);
}

function entityAt(x, y) {
  return state.monsters.find((m) => m.x === x && m.y === y);
}

function score() {
  return state.gold + state.depth * 50 + state.kills * 5;
}

// ==== Nouvelle partie / nouvel étage ====

function newGame() {
  state = {
    player: { x: 0, y: 0, hp: 20, maxHp: 20, atk: 3, def: 0, level: 1, xp: 0 },
    depth: 0,
    gold: 0,
    kills: 0,
    messages: [],
    over: false,
  };
  nextFloor();
  log("Tu entres dans le donjon…");
  overlay.hidden = true;
  render();
}

function nextFloor() {
  state.depth++;
  let dungeon = generateDungeon();
  while (dungeon.rooms.length < 2) dungeon = generateDungeon();
  const { tiles, rooms } = dungeon;
  state.tiles = tiles;
  state.explored = new Set();
  state.monsters = [];
  state.items = [];

  const start = center(rooms[0]);
  state.player.x = start.x;
  state.player.y = start.y;
  state.stairs = center(rooms[rooms.length - 1]);

  const occupied = (x, y) =>
    (x === start.x && y === start.y) ||
    (x === state.stairs.x && y === state.stairs.y) ||
    entityAt(x, y) ||
    state.items.some((i) => i.x === x && i.y === y);

  const pool = MONSTERS.filter((m) => m.minDepth <= state.depth);

  rooms.slice(1).forEach((room) => {
    const monsterCount = randInt(0, 1 + Math.floor(state.depth / 3));
    for (let i = 0; i < monsterCount; i++) {
      const pos = randomFloorIn(room);
      if (occupied(pos.x, pos.y)) continue;
      const base = pick(pool);
      state.monsters.push({ ...base, ...pos, maxHp: base.hp, awake: false });
    }
    if (Math.random() < 0.6) {
      const pos = randomFloorIn(room);
      if (!occupied(pos.x, pos.y)) state.items.push({ ...weightedPick(ITEMS), ...pos });
    }
  });

  updateVisibility();
}

function updateVisibility() {
  state.visible = computeVisible(state.tiles, state.player.x, state.player.y, SIGHT);
  state.visible.forEach((idx) => state.explored.add(idx));
}

// ==== Combat ====

function damage(atk, def) {
  return Math.max(1, atk + randInt(0, 2) - def);
}

function attackMonster(monster) {
  const p = state.player;
  const dmg = damage(p.atk, monster.def);
  monster.hp -= dmg;
  monster.awake = true;

  if (monster.hp > 0) {
    log(`Tu frappes ${monster.name} (−${dmg}).`);
    return;
  }

  state.monsters = state.monsters.filter((m) => m !== monster);
  state.kills++;
  p.xp += monster.xp;
  log(`${monster.name} est vaincu ! (+${monster.xp} XP)`);

  const needed = p.level * 10;
  if (p.xp >= needed) {
    p.xp -= needed;
    p.level++;
    p.maxHp += 5;
    p.atk++;
    p.hp = p.maxHp;
    log(`✨ Niveau ${p.level} ! PV max +5, attaque +1.`);
  }
}

function monsterAttacks(monster) {
  const p = state.player;
  const dmg = damage(monster.atk, p.def);
  p.hp -= dmg;
  log(`${monster.name} te blesse (−${dmg}).`);
  boardEl.classList.remove("hit");
  void boardEl.offsetWidth;
  boardEl.classList.add("hit");

  if (p.hp <= 0) {
    p.hp = 0;
    gameOver(`Tué par ${monster.name}`);
  }
}

// ==== Tour de jeu ====

function pickUp(item) {
  const p = state.player;
  state.items = state.items.filter((i) => i !== item);

  switch (item.kind) {
    case "potion": {
      const healed = Math.min(10, p.maxHp - p.hp);
      p.hp += healed;
      log(`🧪 Potion bue (+${healed} PV).`);
      break;
    }
    case "gold": {
      const amount = randInt(5, 15) * state.depth;
      state.gold += amount;
      log(`💰 ${amount} pièces d'or.`);
      break;
    }
    case "sword":
      p.atk++;
      log("🗡️ Une meilleure épée ! Attaque +1.");
      break;
    case "shield":
      p.def++;
      log("🛡️ Un bouclier ! Défense +1.");
      break;
  }
}

function playerTurn(dx, dy) {
  if (state.over) return;
  const p = state.player;

  if (dx !== 0 || dy !== 0) {
    const nx = p.x + dx;
    const ny = p.y + dy;
    if (state.tiles[ny]?.[nx] !== FLOOR) return; // mur : pas de tour consommé

    const monster = entityAt(nx, ny);
    if (monster) {
      attackMonster(monster);
    } else {
      p.x = nx;
      p.y = ny;

      const item = state.items.find((i) => i.x === nx && i.y === ny);
      if (item) pickUp(item);

      if (nx === state.stairs.x && ny === state.stairs.y) {
        nextFloor();
        log(`🔽 Tu descends à l'étage ${state.depth}.`);
        render();
        return;
      }
    }
  }

  updateVisibility();
  monstersTurn();
  updateVisibility();
  render();
}

function monstersTurn() {
  const p = state.player;
  const dist = distanceMap(state.tiles, p.x, p.y);

  for (const m of state.monsters) {
    if (state.over) return;
    if (state.visible.has(m.y * MAP_W + m.x)) m.awake = true;
    if (!m.awake) continue;

    if (Math.abs(m.x - p.x) + Math.abs(m.y - p.y) === 1) {
      monsterAttacks(m);
      continue;
    }

    // Avance vers la case voisine la plus proche du joueur
    let best = null;
    let bestDist = dist[m.y * MAP_W + m.x];
    for (const [dx, dy] of DIRECTIONS) {
      const nx = m.x + dx;
      const ny = m.y + dy;
      const d = dist[ny * MAP_W + nx];
      if (d < bestDist && !entityAt(nx, ny)) {
        best = { x: nx, y: ny };
        bestDist = d;
      }
    }
    if (best) {
      m.x = best.x;
      m.y = best.y;
    }
  }
}

function gameOver(reason) {
  state.over = true;
  const final = score();
  const best = readBest();
  const record = final > best;
  if (record) saveBest(final);

  overlayTitle.textContent = "💀 Game over";
  overlayText.textContent =
    `${reason} à l'étage ${state.depth}.\n` +
    `Score : ${final}${record ? " — nouveau record !" : `\nRecord : ${best}`}`;
  overlayBtn.textContent = "Rejouer";
  overlay.hidden = false;
}

// ==== Rendu ====

function drawGlyph(glyph, sx, sy) {
  ctx.fillText(glyph, sx + TILE / 2, sy + TILE / 2 + 1);
}

function render() {
  const p = state.player;
  const camX = Math.max(0, Math.min(MAP_W - VIEW_W, p.x - Math.floor(VIEW_W / 2)));
  const camY = Math.max(0, Math.min(MAP_H - VIEW_H, p.y - Math.floor(VIEW_H / 2)));

  ctx.fillStyle = "#0f0c16";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${TILE - 6}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let vy = 0; vy < VIEW_H; vy++) {
    for (let vx = 0; vx < VIEW_W; vx++) {
      const x = camX + vx;
      const y = camY + vy;
      const idx = y * MAP_W + x;
      if (!state.explored.has(idx)) continue;

      const sx = vx * TILE;
      const sy = vy * TILE;
      const seen = state.visible.has(idx);
      const wall = state.tiles[y][x] === WALL;

      ctx.fillStyle = wall ? (seen ? "#5b4d73" : "#2e2740") : (seen ? "#2c2538" : "#1a1624");
      ctx.fillRect(sx, sy, TILE, TILE);
      if (wall) {
        ctx.fillStyle = seen ? "#6f5f8a" : "#372f4b";
        ctx.fillRect(sx, sy, TILE, 4);
      }

      ctx.globalAlpha = seen ? 1 : 0.4;
      if (x === state.stairs.x && y === state.stairs.y) drawGlyph("🔽", sx, sy);
      const item = state.items.find((i) => i.x === x && i.y === y);
      if (item) drawGlyph(item.glyph, sx, sy);
      ctx.globalAlpha = 1;

      if (seen) {
        const m = entityAt(x, y);
        if (m) {
          drawGlyph(m.glyph, sx, sy);
          ctx.fillStyle = "#ef6f6c";
          ctx.fillRect(sx + 2, sy + TILE - 3, (TILE - 4) * (m.hp / m.maxHp), 2);
        }
      }
    }
  }

  drawGlyph("🧙", (p.x - camX) * TILE, (p.y - camY) * TILE);

  renderStats();
  logEl.innerHTML = state.messages.map((m) => `<li>${m}</li>`).join("");
}

function renderStats() {
  const p = state.player;
  const ratio = p.hp / p.maxHp;
  statsEl.innerHTML = `
    <span class="stat">❤️ ${p.hp}/${p.maxHp}</span>
    <span class="stat">⚔️ ${p.atk}</span>
    <span class="stat">🛡️ ${p.def}</span>
    <span class="stat">⭐ Niv. ${p.level} (${p.xp}/${p.level * 10})</span>
    <span class="stat">🔽 Étage ${state.depth}</span>
    <span class="stat">💰 ${state.gold}</span>
    <div class="hp-bar"><div class="hp-fill${ratio < 0.3 ? " low" : ""}" style="width:${ratio * 100}%"></div></div>
  `;
}

// ==== Contrôles ====

const KEYS = {
  ArrowUp: [0, -1], z: [0, -1], w: [0, -1],
  ArrowDown: [0, 1], s: [0, 1],
  ArrowLeft: [-1, 0], q: [-1, 0], a: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0],
  " ": [0, 0], ".": [0, 0],
};

document.addEventListener("keydown", (e) => {
  if (helpModal.classList.contains("active")) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if (key === "r" || (key === "Enter" && !overlay.hidden)) {
    newGame();
    e.preventDefault();
    return;
  }
  if (!state || !KEYS[key]) return;
  e.preventDefault();
  playerTurn(...KEYS[key]);
});

document.querySelectorAll(".dpad button").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state) playerTurn(...btn.dataset.dir.split(",").map(Number));
  });
});

overlayBtn.addEventListener("click", newGame);

const helpModal = document.getElementById("help-modal");
document.getElementById("help-btn").addEventListener("click", () => helpModal.classList.add("active"));
document.getElementById("close-help").addEventListener("click", () => helpModal.classList.remove("active"));
helpModal.addEventListener("click", (e) => {
  if (e.target === helpModal) helpModal.classList.remove("active");
});

// ==== Démarrage ====

overlayText.textContent = `Descends le plus bas possible.\nRecord : ${readBest()}`;
