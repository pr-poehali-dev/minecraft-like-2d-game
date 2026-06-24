import { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';

// ─── Константы мира ───────────────────────────────────────────────────────────
const TILE  = 32;
const COLS  = 60;
const ROWS  = 20;

// Физика
const GRAVITY   = 0.45;
const MOVE_ACCEL= 0.85;
const FRICTION  = 0.78;
const MAX_VX    = 4.5;
const JUMP_V    = -10.5;
const MAX_VY    = 18;
const REACH     = 5; // тайлов

// Размер игрока (px)
const PW = 24;
const PH = 36;

// ─── Типы блоков ─────────────────────────────────────────────────────────────
interface BlockDef {
  name: string;
  draw: (ctx: OffscreenCanvasRenderingContext2D, S: number) => void;
}

// Рисуем пиксельные текстуры: data — строки-паттерн, palette — Record<символ, цвет>
function px(ctx: OffscreenCanvasRenderingContext2D, data: string[], palette: Record<string, string>, S: number) {
  const ps = S / data[0].length;
  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < data[row].length; col++) {
      const c = data[row][col];
      if (c === '.') continue;
      const color = palette[c];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(col * ps), Math.floor(row * ps), Math.ceil(ps), Math.ceil(ps));
    }
  }
}

const BLOCK_DEFS: Record<number, BlockDef> = {
  // 1 — Трава
  1: {
    name: 'Трава',
    draw(ctx, S) {
      // Земля (низ)
      px(ctx, [
        '....',
        'cbac',
        'acba',
        'bacb',
        'cbac',
        'acba',
        'bacb',
        'cbac',
        'acba',
        'bacb',
        'cbac',
        'acba',
      ], { a: '#8B5E3C', b: '#7A5230', c: '#6B4020' }, S);
      // Верхняя полоска трава (4px)
      px(ctx, [
        'ABBA',
        'BABC',
        'CBAB',
        'ABBA',
      ], { A: '#5DA832', B: '#4C9626', C: '#6CC43A' }, S);
      // Объём
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 0, 2, S);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, S - 2, S, 2);
      ctx.fillRect(S - 2, 0, 2, S);
    },
  },

  // 2 — Земля
  2: {
    name: 'Земля',
    draw(ctx, S) {
      px(ctx, [
        'cbacbac',
        'abcacba',
        'bacabac',
        'cbacbac',
        'abcacba',
        'bacabac',
        'cbacbac',
      ], { a: '#8B5E3C', b: '#7A5230', c: '#6B4020' }, S);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 0, 2, S);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, S - 2, S, 2);
      ctx.fillRect(S - 2, 0, 2, S);
    },
  },

  // 3 — Камень
  3: {
    name: 'Камень',
    draw(ctx, S) {
      ctx.fillStyle = '#7d7d7d';
      ctx.fillRect(0, 0, S, S);
      px(ctx, [
        'abababa',
        'bababab',
        'abababa',
        'bababab',
        'abababa',
        'bababab',
        'abababa',
      ], { a: '#8c8c8c', b: '#6e6e6e' }, S);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 0, 2, S);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, S - 2, S, 2);
      ctx.fillRect(S - 2, 0, 2, S);
    },
  },

  // 4 — Деревянные доски
  4: {
    name: 'Доски',
    draw(ctx, S) {
      ctx.fillStyle = '#B88B4A';
      ctx.fillRect(0, 0, S, S);
      // вертикальные полосы
      const stripe = S / 4;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#C49A56' : '#A47A3C';
        ctx.fillRect(i * stripe, 0, stripe, S);
      }
      // горизонтальный шов посередине
      ctx.fillStyle = '#7A5A2A';
      ctx.fillRect(0, S / 2 - 1, S, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 0, 2, S);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, S - 2, S, 2);
      ctx.fillRect(S - 2, 0, 2, S);
    },
  },

  // 5 — Алмазная руда
  5: {
    name: 'Алмаз',
    draw(ctx, S) {
      // Основа — камень
      BLOCK_DEFS[3].draw(ctx, S);
      // Кристаллы алмаза
      const spots = [[4,4],[10,8],[6,12],[12,4],[2,10]];
      for (const [sx, sy] of spots) {
        const gx = (sx / 16) * S, gy = (sy / 16) * S, gs = S * 4 / 16;
        ctx.fillStyle = '#5FD0D8';
        ctx.fillRect(gx, gy, gs, gs);
        ctx.fillStyle = '#3ABAC4';
        ctx.fillRect(gx + 1, gy + 1, gs - 2, gs - 2);
        ctx.fillStyle = '#8AEAF0';
        ctx.fillRect(gx, gy, 2, 2);
      }
    },
  },

  // 6 — Золотая руда
  6: {
    name: 'Золото',
    draw(ctx, S) {
      BLOCK_DEFS[3].draw(ctx, S);
      const spots = [[3,5],[9,3],[7,11],[13,7],[5,13]];
      for (const [sx, sy] of spots) {
        const gx = (sx / 16) * S, gy = (sy / 16) * S, gs = S * 4 / 16;
        ctx.fillStyle = '#F2C14E';
        ctx.fillRect(gx, gy, gs, gs);
        ctx.fillStyle = '#D4A032';
        ctx.fillRect(gx + 1, gy + 1, gs - 2, gs - 2);
        ctx.fillStyle = '#FFE080';
        ctx.fillRect(gx, gy, 2, 2);
      }
    },
  },

  // 7 — ТНТ (Бабах)
  7: {
    name: 'Бабах',
    draw(ctx, S) {
      // Белые и красные полосы по бокам
      ctx.fillStyle = '#E8E8E8';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#CC3030';
      ctx.fillRect(0, Math.floor(S * 0.25), S, Math.floor(S * 0.5));
      // Надпись TNT пиксельная
      const half = S / 2;
      ctx.fillStyle = '#E8E8E8';
      // T
      ctx.fillRect(S*0.08, S*0.3, S*0.2, S*0.07);
      ctx.fillRect(S*0.155, S*0.37, S*0.06, S*0.24);
      // N
      ctx.fillRect(S*0.32, S*0.3, S*0.055, S*0.31);
      ctx.fillRect(S*0.32, S*0.3, S*0.19, S*0.055);
      ctx.fillRect(S*0.455, S*0.3, S*0.055, S*0.31);
      // T
      ctx.fillRect(S*0.58, S*0.3, S*0.2, S*0.07);
      ctx.fillRect(S*0.655, S*0.37, S*0.06, S*0.24);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 0, 2, S);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(0, S-2, S, 2);
      ctx.fillRect(S-2, 0, 2, S);
    },
  },

  // 8 — Листва
  8: {
    name: 'Листва',
    draw(ctx, S) {
      ctx.fillStyle = '#3A8020';
      ctx.fillRect(0, 0, S, S);
      // Пятна листьев
      const leaf = [
        [2,2],[6,1],[10,3],[14,1],
        [1,6],[5,5],[9,6],[13,5],
        [3,10],[7,9],[11,10],[15,9],
        [2,14],[6,13],[10,14],[14,13],
      ];
      for (const [lx, ly] of leaf) {
        const gx = (lx / 16) * S, gy = (ly / 16) * S, gs = S * 3 / 16;
        ctx.fillStyle = '#4CAF30';
        ctx.fillRect(gx, gy, gs, gs);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, S - 2, S, 2);
      ctx.fillRect(S - 2, 0, 2, S);
    },
  },

  // 9 — Ствол дерева
  9: {
    name: 'Дерево',
    draw(ctx, S) {
      ctx.fillStyle = '#6B4A28';
      ctx.fillRect(0, 0, S, S);
      // кольца / волокна
      const s1 = Math.floor(S * 0.25), s2 = Math.floor(S * 0.5);
      ctx.fillStyle = '#7A5A38';
      ctx.fillRect(s1, 0, s2, S);
      ctx.fillStyle = '#5A3A18';
      ctx.fillRect(s1 + 2, 0, s2 - 4, S);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 0, 2, S);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, S - 2, S, 2);
      ctx.fillRect(S - 2, 0, 2, S);
    },
  },

  // 10 — Песок
  10: {
    name: 'Песок',
    draw(ctx, S) {
      ctx.fillStyle = '#DBC98A';
      ctx.fillRect(0, 0, S, S);
      px(ctx, [
        'abbaabb',
        'baabbaa',
        'abbaabb',
        'baabbaa',
        'abbaabb',
        'baabbaa',
        'abbaabb',
      ], { a: '#D4B870', b: '#E8D8A0' }, S);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 0, 2, S);
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.fillRect(0, S - 2, S, 2);
      ctx.fillRect(S - 2, 0, 2, S);
    },
  },
};

// ─── Кеш отрисованных текстур ─────────────────────────────────────────────────
const textureCache = new Map<number, ImageBitmap>();

async function getTexture(id: number): Promise<ImageBitmap> {
  if (textureCache.has(id)) return textureCache.get(id)!;
  const oc = new OffscreenCanvas(TILE, TILE);
  const c = oc.getContext('2d')!;
  BLOCK_DEFS[id]?.draw(c, TILE);
  const bm = await createImageBitmap(oc);
  textureCache.set(id, bm);
  return bm;
}

// ─── Генерация мира ────────────────────────────────────────────────────────────
function genWorld(): number[][] {
  const g = Array.from({ length: ROWS }, () => new Array(COLS).fill(0) as number[]);
  const BASE = ROWS - 6;

  for (let x = 0; x < COLS; x++) {
    // плавный холмистый рельеф
    const h = BASE + Math.round(
      Math.sin(x * 0.28) * 2.2 +
      Math.cos(x * 0.11) * 1.5 +
      Math.sin(x * 0.55) * 0.8
    );
    for (let y = 0; y < ROWS; y++) {
      if (y < h) continue;
      if (y === h) g[y][x] = 1; // трава
      else if (y < h + 3) g[y][x] = 2; // земля
      else g[y][x] = 3; // камень
    }
    // руды
    for (let y = h + 4; y < ROWS; y++) {
      const r = Math.random();
      if (r < 0.06) g[y][x] = 5; // алмаз
      else if (r < 0.14) g[y][x] = 6; // золото
    }
  }

  // Парящие платформы (доски)
  const platforms = [[8,3],[9,3],[10,3],[18,4],[19,4],[20,4],[28,3],[29,3],[30,3],[38,5],[39,5],[46,3],[47,3]];
  for (const [px, py] of platforms) {
    const gy = BASE - py;
    if (gy >= 0 && gy < ROWS) g[gy][px] = 4;
  }

  // Деревья
  for (const tx of [4, 14, 24, 35, 48]) {
    let groundY = -1;
    for (let y = 0; y < ROWS; y++) {
      if (g[y][tx] !== 0) { groundY = y; break; }
    }
    if (groundY < 0) continue;
    // Ствол
    for (let k = 1; k <= 4; k++) {
      if (groundY - k >= 0) g[groundY - k][tx] = 9;
    }
    // Крона
    for (let dy = -6; dy <= -2; dy++) {
      const spread = dy <= -4 ? 2 : 1;
      for (let dx = -spread; dx <= spread; dx++) {
        const yy = groundY + dy, xx = tx + dx;
        if (yy >= 0 && yy < ROWS && xx >= 0 && xx < COLS) {
          if (g[yy][xx] === 0) g[yy][xx] = 8;
        }
      }
    }
  }

  // Небольшие пляжи/переходы с песком
  for (let x = 10; x < 15; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (g[y][x] === 1) { g[y][x] = 10; break; }
    }
  }

  return g;
}

const PALETTE_IDS = [1, 2, 3, 4, 9, 10, 5, 6, 8, 7];

// ─── Компонент ────────────────────────────────────────────────────────────────
export default function Platformer() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const worldRef   = useRef<number[][]>(genWorld());
  const keys       = useRef<Record<string, boolean>>({});
  const playerRef  = useRef({ x: 3 * TILE, y: 0, vx: 0, vy: 0, onGround: false, face: 1 });
  const camXRef    = useRef(0);
  const mouseRef   = useRef({ wx: -1, wy: -1 }); // мировые координаты
  const texReady   = useRef(false);
  const bmRef      = useRef<Map<number, ImageBitmap>>(new Map());

  const [selBlock, setSelBlock]   = useState(1);
  const selRef = useRef(1);
  selRef.current = selBlock;

  const [inv, setInv] = useState<Record<number, number>>({
    1: 50, 2: 64, 3: 64, 4: 30, 9: 20, 10: 20, 5: 8, 6: 12, 8: 30, 7: 5,
  });
  const invRef = useRef(inv);
  invRef.current = inv;

  // ─── Загрузка текстур ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all(
      Object.keys(BLOCK_DEFS).map(async (k) => {
        const id = Number(k);
        const bm = await getTexture(id);
        bmRef.current.set(id, bm);
      })
    ).then(() => { texReady.current = true; });
  }, []);

  // ─── Клавиатура ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      if ([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // ─── Вспомогалки ────────────────────────────────────────────────────────
  const solidAt = useCallback((tx: number, ty: number) => {
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return ty >= ROWS; // пол за границей
    const b = worldRef.current[ty]?.[tx] ?? 0;
    return b !== 0;
  }, []);

  // ─── Копать / Ставить ────────────────────────────────────────────────────
  const interact = useCallback((place: boolean) => {
    const { wx, wy } = mouseRef.current;
    if (wx < 0) return;
    const tx = Math.floor(wx / TILE);
    const ty = Math.floor(wy / TILE);
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return;

    const p = playerRef.current;
    const pcx = p.x + PW / 2, pcy = p.y + PH / 2;
    const bcx = tx * TILE + TILE / 2, bcy = ty * TILE + TILE / 2;
    if (Math.hypot((pcx - bcx) / TILE, (pcy - bcy) / TILE) > REACH) return;

    const world = worldRef.current;
    if (!place) {
      const b = world[ty][tx];
      if (b === 0) return;
      world[ty][tx] = 0;
      setInv((prev) => ({ ...prev, [b]: (prev[b] ?? 0) + 1 }));
    } else {
      if (world[ty][tx] !== 0) return;
      // Не ставить внутрь игрока
      const pl = p.x, pr = p.x + PW;
      const pt = p.y, pb = p.y + PH;
      const bl = tx * TILE, br = (tx + 1) * TILE;
      const bt = ty * TILE, bb = (ty + 1) * TILE;
      if (pr > bl && pl < br && pb > bt && pt < bb) return;
      const sel = selRef.current;
      if ((invRef.current[sel] ?? 0) <= 0) return;
      world[ty][tx] = sel;
      setInv((prev) => ({ ...prev, [sel]: (prev[sel] ?? 1) - 1 }));
    }
  }, []);

  // ─── Игровой цикл ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;

    // Спавним игрока над землёй
    const p = playerRef.current;
    for (let y = 0; y < ROWS; y++) {
      if (worldRef.current[y][3] !== 0) { p.y = y * TILE - PH - 1; break; }
    }

    const loop = () => {
      const k = keys.current;
      const left  = k['a'] || k['arrowleft'];
      const right = k['d'] || k['arrowright'];
      const jump  = k['w'] || k['arrowup']  || k[' '];

      // Горизонталь
      if (left)  { p.vx -= MOVE_ACCEL; p.face = -1; }
      if (right) { p.vx += MOVE_ACCEL; p.face =  1; }
      if (!left && !right) p.vx *= FRICTION;
      p.vx = Math.max(-MAX_VX, Math.min(MAX_VX, p.vx));

      // Прыжок
      if (jump && p.onGround) { p.vy = JUMP_V; p.onGround = false; }

      // Гравитация
      p.vy = Math.min(p.vy + GRAVITY, MAX_VY);

      // ── Коллизия по X ──────────────────────────────────────────────────
      p.x += p.vx;
      {
        const rowTop    = Math.floor(p.y / TILE);
        const rowBottom = Math.floor((p.y + PH - 1) / TILE);
        if (p.vx > 0) {
          const col = Math.floor((p.x + PW - 1) / TILE);
          for (let row = rowTop; row <= rowBottom; row++) {
            if (solidAt(col, row)) { p.x = col * TILE - PW; p.vx = 0; break; }
          }
        } else if (p.vx < 0) {
          const col = Math.floor(p.x / TILE);
          for (let row = rowTop; row <= rowBottom; row++) {
            if (solidAt(col, row)) { p.x = (col + 1) * TILE; p.vx = 0; break; }
          }
        }
      }

      // ── Коллизия по Y ──────────────────────────────────────────────────
      p.y += p.vy;
      p.onGround = false;
      {
        const colLeft  = Math.floor(p.x / TILE);
        const colRight = Math.floor((p.x + PW - 1) / TILE);
        if (p.vy > 0) {
          const row = Math.floor((p.y + PH - 1) / TILE);
          let hit = false;
          for (let col = colLeft; col <= colRight; col++) {
            if (solidAt(col, row)) { hit = true; break; }
          }
          if (hit) { p.y = row * TILE - PH; p.vy = 0; p.onGround = true; }
        } else if (p.vy < 0) {
          const row = Math.floor(p.y / TILE);
          let hit = false;
          for (let col = colLeft; col <= colRight; col++) {
            if (solidAt(col, row)) { hit = true; break; }
          }
          if (hit) { p.y = (row + 1) * TILE; p.vy = 0; }
        }
      }

      // Клэмп X по миру
      p.x = Math.max(0, Math.min(COLS * TILE - PW, p.x));
      // Респолн при падении
      if (p.y > ROWS * TILE + 300) {
        p.x = 3 * TILE; p.y = -PH * 2; p.vx = 0; p.vy = 0;
      }

      // Камера: плавно следует за игроком по X
      const targetCamX = p.x + PW / 2 - canvas.width / 2;
      const clampedCam = Math.max(0, Math.min(COLS * TILE - canvas.width, targetCamX));
      camXRef.current += (clampedCam - camXRef.current) * 0.1;
      const camX = Math.round(camXRef.current);

      // ── Рендеринг ──────────────────────────────────────────────────────
      // Небо
      const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
      sky.addColorStop(0,   '#1A6ECC');
      sky.addColorStop(0.6, '#5BA8E5');
      sky.addColorStop(1,   '#A8D0F0');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Облака (параллакс 30%)
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      const cloudOff = camX * 0.3;
      const clouds = [[120,30,90,22],[320,55,70,18],[560,25,110,24],[800,45,80,20],[1050,35,95,22]];
      for (const [cx, cy, cw, ch] of clouds) {
        const rx = ((cx - cloudOff) % (canvas.width + 200) + canvas.width + 200) % (canvas.width + 200) - 100;
        ctx.fillRect(rx, cy, cw, ch);
        ctx.fillRect(rx + cw * 0.2, cy - ch * 0.5, cw * 0.6, ch * 0.7);
      }

      // Блоки
      ctx.save();
      ctx.translate(-camX, 0);

      const startCol = Math.max(0, Math.floor(camX / TILE));
      const endCol   = Math.min(COLS, Math.ceil((camX + canvas.width) / TILE) + 1);
      const world = worldRef.current;
      const bms   = bmRef.current;

      for (let row = 0; row < ROWS; row++) {
        for (let col = startCol; col < endCol; col++) {
          const b = world[row][col];
          if (b === 0) continue;
          const bx = col * TILE, by = row * TILE;
          const bm = bms.get(b);
          if (bm) {
            ctx.drawImage(bm, bx, by, TILE, TILE);
          } else {
            ctx.fillStyle = '#7d7d7d';
            ctx.fillRect(bx, by, TILE, TILE);
          }
        }
      }

      // Подсветка блока под курсором
      const { wx, wy } = mouseRef.current;
      if (wx >= 0 && wy >= 0) {
        const htx = Math.floor(wx / TILE), hty = Math.floor(wy / TILE);
        const pcx = p.x + PW / 2, pcy = p.y + PH / 2;
        const bcx = htx * TILE + TILE / 2, bcy = hty * TILE + TILE / 2;
        const dist = Math.hypot((pcx - bcx) / TILE, (pcy - bcy) / TILE);
        ctx.strokeStyle = dist <= REACH ? 'rgba(0,0,0,0.6)' : 'rgba(255,60,60,0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(htx * TILE + 1, hty * TILE + 1, TILE - 2, TILE - 2);
        if (dist <= REACH && world[hty]?.[htx]) {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(htx * TILE, hty * TILE, TILE, TILE);
        }
      }

      // ── Игрок ──────────────────────────────────────────────────────────
      const px = Math.round(p.x), py = Math.round(p.y);
      const fl = p.face < 0; // смотрит влево

      // Тело (синяя куртка)
      ctx.fillStyle = '#4A7ED6';
      ctx.fillRect(px + 4, py + PH * 0.42, PW - 8, PH * 0.36);
      // Штаны
      ctx.fillStyle = '#2A5AA8';
      ctx.fillRect(px + 4, py + PH * 0.6, PW * 0.4, PH * 0.38);
      ctx.fillRect(px + PW * 0.4, py + PH * 0.6, PW * 0.42, PH * 0.38);
      // Голова
      ctx.fillStyle = '#E8B870';
      ctx.fillRect(px + 3, py + 2, PW - 6, PH * 0.38);
      // Волосы
      ctx.fillStyle = '#5A3010';
      ctx.fillRect(px + 3, py + 2, PW - 6, 6);
      // Глаз
      ctx.fillStyle = '#1A1A1A';
      const eyeX = fl ? px + 6 : px + PW - 11;
      ctx.fillRect(eyeX, py + 10, 4, 5);
      // Белок
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(eyeX, py + 10, 3, 4);
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(fl ? eyeX : eyeX + 1, py + 11, 2, 3);
      // Руки
      ctx.fillStyle = '#E8B870';
      ctx.fillRect(fl ? px + PW - 5 : px + 1, py + PH * 0.42, 4, PH * 0.3);
      ctx.fillRect(fl ? px + 1 : px + PW - 5, py + PH * 0.42, 4, PH * 0.3);
      // Ноги (анимация при движении)
      const legAnim = p.onGround && Math.abs(p.vx) > 0.5
        ? Math.sin(Date.now() / 120) * 4
        : 0;
      ctx.fillStyle = '#3A4A8A';
      ctx.fillRect(px + 5, py + PH * 0.78 + legAnim, 6, PH * 0.2);
      ctx.fillRect(px + PW - 11, py + PH * 0.78 - legAnim, 6, PH * 0.2);

      ctx.restore();

      // HUD: жизни и полоска
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(8, 8, 200, 18);
      ctx.fillStyle = '#CC3030';
      ctx.fillRect(10, 10, 196, 14);
      ctx.fillStyle = '#FF5050';
      ctx.fillRect(10, 10, 196, 7);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('❤ 20 / 20', 14, 22);

      // Координаты (debug лёгкий)
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(8, 30, 130, 16);
      ctx.fillStyle = '#AAFFAA';
      ctx.font = '10px monospace';
      ctx.fillText(`XYZ: ${Math.floor(p.x/TILE)} / ${Math.floor(p.y/TILE)}`, 12, 42);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Мышь → мировые координаты ──────────────────────────────────────────
  const updateMouse = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (clientX - rect.left) * scaleX;
    const sy = (clientY - rect.top)  * scaleY;
    mouseRef.current = { wx: sx + Math.round(camXRef.current), wy: sy };
  }, []);

  // ─── Экранные кнопки ─────────────────────────────────────────────────────
  const pressKey  = (k: string) => { keys.current[k] = true; };
  const releaseKey= (k: string) => { keys.current[k] = false; };

  const canvasW = Math.min(COLS, 26) * TILE; // ~832px (ограничиваем viewport)

  return (
    <div className="space-y-3 animate-pop-in select-none">
      <h3 className="font-pixel text-sm text-[#7fd14a] text-pixel-shadow flex items-center gap-2">
        <Icon name="Gamepad2" size={18} /> Играть
      </h3>

      {/* Канвас */}
      <div className="bg-[#0a100a] mc-border border-2 border-[#0d120b] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={ROWS * TILE}
          style={{ imageRendering: 'pixelated', display: 'block', width: '100%' }}
          className="touch-none cursor-crosshair"
          onMouseMove={(e) => updateMouse(e.clientX, e.clientY)}
          onMouseDown={(e) => {
            e.preventDefault();
            updateMouse(e.clientX, e.clientY);
            interact(e.button === 2);
          }}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            e.preventDefault();
            const t = e.touches[0];
            updateMouse(t.clientX, t.clientY);
            interact(false);
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            updateMouse(t.clientX, t.clientY);
          }}
        />
      </div>

      {/* Хотбар */}
      <div className="bg-[#1c2718]/95 mc-border border-2 border-[#0d120b] p-2">
        <div className="font-mono text-base text-[#a9c191] mb-2 text-center">
          Выбран: <span className="text-[#f2c14e] font-bold">{BLOCK_DEFS[selBlock]?.name}</span>
          &nbsp;·&nbsp; ЛКМ — сломать &nbsp;·&nbsp; ПКМ — поставить
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {PALETTE_IDS.map((id) => {
            const bm = bmRef.current.get(id);
            return (
              <button
                key={id}
                onClick={() => setSelBlock(id)}
                className={`relative w-11 h-11 mc-border-sm mc-press overflow-hidden bg-[#0f150c] ${selBlock === id ? 'ring-4 ring-[#f2c14e]' : ''}`}
              >
                {bm
                  ? <TexturePreview bm={bm} />
                  : <div className="w-full h-full bg-[#555]" />
                }
                <span className="absolute bottom-0 right-0.5 font-mono text-xs text-white drop-shadow-[1px_1px_0_#000] leading-tight">
                  {inv[id] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Управление */}
      <div className="grid sm:grid-cols-2 gap-3">
        {/* Инфо клавиатуры */}
        <div className="bg-[#1c2718]/95 mc-border border-2 border-[#0d120b] p-3 font-mono text-base text-[#cfe6b8] space-y-0.5">
          <div className="font-pixel text-[9px] text-[#7fd14a] mb-2">🖥 Клавиатура</div>
          <p>A / D / ← → — движение</p>
          <p>W / Пробел / ↑ — прыжок</p>
          <p>ЛКМ — сломать блок</p>
          <p>ПКМ — поставить блок</p>
        </div>

        {/* Экранные кнопки */}
        <div className="bg-[#1c2718]/95 mc-border border-2 border-[#0d120b] p-3">
          <div className="font-pixel text-[9px] text-[#7fd14a] mb-2">📱 Тач-управление</div>
          <div className="flex items-end justify-between gap-2">
            {/* Движение */}
            <div className="flex gap-1">
              <TouchBtn
                icon="ChevronLeft"
                onDown={() => pressKey('a')}
                onUp={() => releaseKey('a')}
              />
              <TouchBtn
                icon="ChevronRight"
                onDown={() => pressKey('d')}
                onUp={() => releaseKey('d')}
              />
            </div>
            {/* Действия */}
            <div className="flex gap-1">
              <TouchBtn
                icon="Pickaxe"
                label="Ломать"
                onDown={() => interact(false)}
                onUp={() => {}}
              />
              <TouchBtn
                icon="Square"
                label="Ставить"
                onDown={() => interact(true)}
                onUp={() => {}}
              />
              <TouchBtn
                icon="ChevronUp"
                onDown={() => pressKey(' ')}
                onUp={() => releaseKey(' ')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Превью текстуры через canvas
function TexturePreview({ bm }: { bm: ImageBitmap }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bm, 0, 0, c.width, c.height);
  }, [bm]);
  return <canvas ref={ref} width={44} height={44} style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }} />;
}

function TouchBtn({
  icon, label, onDown, onUp,
}: {
  icon: string; label?: string; onDown: () => void; onUp: () => void;
}) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onDown(); }}
      onPointerUp={(e)   => { e.preventDefault(); onUp();   }}
      onPointerLeave={onUp}
      className="flex flex-col items-center justify-center gap-0.5 w-12 h-12 bg-[#2a3a22] text-[#cfe6b8] mc-border-sm mc-press touch-none active:bg-[#5fa739] active:text-[#10160f]"
    >
      <Icon name={icon} size={18} />
      {label && <span className="font-mono text-[10px] leading-none">{label}</span>}
    </button>
  );
}