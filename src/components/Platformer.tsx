import { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';

const TILE = 36;
const COLS = 40;
const ROWS = 16;
const GRAVITY = 0.55;
const MOVE = 0.9;
const FRICTION = 0.8;
const MAX_VX = 5;
const JUMP = 11;
const REACH = 4.2; // в тайлах

// Типы блоков: 0 = воздух
type BlockType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface BlockDef {
  name: string;
  top: string;
  body: string;
  solid: boolean;
}

const BLOCKS: Record<number, BlockDef> = {
  1: { name: 'Трава', top: '#7fd14a', body: '#6b4626', solid: true },
  2: { name: 'Земля', top: '#7a5230', body: '#6b4626', solid: true },
  3: { name: 'Камень', top: '#8c8c8c', body: '#7d7d7d', solid: true },
  4: { name: 'Доски', top: '#c89b5a', body: '#a87a3c', solid: true },
  5: { name: 'Алмаз', top: '#5fd0d8', body: '#7d7d7d', solid: true },
  6: { name: 'Золото', top: '#f2c14e', body: '#8c8c8c', solid: true },
  7: { name: 'Бабах', top: '#d83a3a', body: '#e0e0e0', solid: true },
  8: { name: 'Листва', top: '#3fa92f', body: '#2f7d22', solid: true },
};

const PALETTE: number[] = [1, 2, 3, 4, 5, 6, 8, 7];

function genWorld(): number[][] {
  const g: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const groundY = ROWS - 4;
  for (let x = 0; x < COLS; x++) {
    const h = groundY + Math.round(Math.sin(x * 0.4) * 1.3 + Math.cos(x * 0.13) * 1);
    for (let y = h; y < ROWS; y++) {
      if (y === h) g[y][x] = 1;
      else if (y < h + 3) g[y][x] = 2;
      else g[y][x] = 3;
    }
    // вкрапления руды
    if (Math.random() < 0.08 && h + 3 < ROWS) g[ROWS - 1][x] = Math.random() < 0.5 ? 5 : 6;
  }
  // парящие платформы из досок
  for (const px of [8, 9, 10, 20, 21, 28, 29, 30]) {
    g[groundY - 4][px] = 4;
  }
  // деревья
  for (const tx of [5, 16, 25, 34]) {
    let ty = 0;
    for (let y = 0; y < ROWS; y++) if (g[y][tx] !== 0) { ty = y; break; }
    for (let k = 1; k <= 3; k++) if (ty - k >= 0) g[ty - k][tx] = 2;
    for (let dy = -5; dy <= -3; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const yy = ty + dy, xx = tx + dx;
        if (yy >= 0 && xx >= 0 && xx < COLS) g[yy][xx] = 8;
      }
  }
  return g;
}

export default function Platformer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<number[][]>(genWorld());
  const keys = useRef<Record<string, boolean>>({});
  const player = useRef({ x: 3 * TILE, y: 2 * TILE, vx: 0, vy: 0, onGround: false, face: 1 });
  const camX = useRef(0);
  const mouse = useRef({ tx: -1, ty: -1, down: false, right: false });

  const [selected, setSelected] = useState<number>(1);
  const selectedRef = useRef(1);
  selectedRef.current = selected;
  const [counts, setCounts] = useState<Record<number, number>>({
    1: 40, 2: 60, 3: 60, 4: 30, 5: 5, 6: 8, 8: 25, 7: 6,
  });
  const countsRef = useRef(counts);
  countsRef.current = counts;

  const solidAt = (tx: number, ty: number) => {
    if (ty < 0 || ty >= ROWS || tx < 0 || tx >= COLS) return false;
    const b = worldRef.current[ty][tx];
    return b !== 0 && BLOCKS[b]?.solid;
  };

  // Клавиатура
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // мышь: копать / ставить
  const mineOrPlace = useCallback((place: boolean) => {
    const { tx, ty } = mouse.current;
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
    const p = player.current;
    const ptx = (p.x + TILE / 2) / TILE;
    const pty = (p.y + TILE / 2) / TILE;
    if (Math.hypot(tx + 0.5 - ptx, ty + 0.5 - pty) > REACH) return;

    const world = worldRef.current;
    if (place) {
      if (world[ty][tx] !== 0) return;
      // не ставить внутрь игрока
      const pl = p.x, pr = p.x + TILE - 1, ptp = p.y, pb = p.y + TILE * 1.8 - 1;
      const bl = tx * TILE, br = bl + TILE - 1, bt = ty * TILE, bb = bt + TILE - 1;
      if (pr >= bl && pl <= br && pb >= bt && ptp <= bb) return;
      const sel = selectedRef.current;
      if ((countsRef.current[sel] ?? 0) <= 0) return;
      world[ty][tx] = sel;
      setCounts((c) => ({ ...c, [sel]: c[sel] - 1 }));
    } else {
      const b = world[ty][tx];
      if (b === 0) return;
      world[ty][tx] = 0;
      setCounts((c) => ({ ...c, [b]: (c[b] ?? 0) + 1 }));
    }
  }, []);

  // игровой цикл
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const drawBlock = (x: number, y: number, b: number) => {
      const d = BLOCKS[b];
      ctx.fillStyle = d.body;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = d.top;
      ctx.fillRect(x, y, TILE, b === 1 || b === 8 ? Math.floor(TILE / 3) : TILE);
      // пиксельная текстура-крапинки
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + 4, y + TILE - 10, 6, 6);
      ctx.fillRect(x + TILE - 12, y + 10, 5, 5);
      // объёмная рамка
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x, y, TILE, 3);
      ctx.fillRect(x, y, 3, TILE);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x, y + TILE - 3, TILE, 3);
      ctx.fillRect(x + TILE - 3, y, 3, TILE);
    };

    const loop = () => {
      const p = player.current;
      const k = keys.current;
      const left = k['a'] || k['arrowleft'];
      const right = k['d'] || k['arrowright'];
      const jump = k['w'] || k['arrowup'] || k[' '];

      if (left) { p.vx -= MOVE; p.face = -1; }
      if (right) { p.vx += MOVE; p.face = 1; }
      if (!left && !right) p.vx *= FRICTION;
      p.vx = Math.max(-MAX_VX, Math.min(MAX_VX, p.vx));
      if (jump && p.onGround) { p.vy = -JUMP; p.onGround = false; }

      p.vy += GRAVITY;
      if (p.vy > 16) p.vy = 16;

      const W = TILE, H = Math.round(TILE * 1.8);

      // движение по X с коллизиями
      p.x += p.vx;
      {
        const t = p.y, b = p.y + H - 1;
        const ty0 = Math.floor(t / TILE), ty1 = Math.floor(b / TILE);
        if (p.vx > 0) {
          const tx = Math.floor((p.x + W - 1) / TILE);
          for (let yy = ty0; yy <= ty1; yy++) if (solidAt(tx, yy)) { p.x = tx * TILE - W; p.vx = 0; break; }
        } else if (p.vx < 0) {
          const tx = Math.floor(p.x / TILE);
          for (let yy = ty0; yy <= ty1; yy++) if (solidAt(tx, yy)) { p.x = (tx + 1) * TILE; p.vx = 0; break; }
        }
      }

      // движение по Y
      p.y += p.vy;
      p.onGround = false;
      {
        const l = p.x, r = p.x + W - 1;
        const tx0 = Math.floor(l / TILE), tx1 = Math.floor(r / TILE);
        if (p.vy > 0) {
          const ty = Math.floor((p.y + H - 1) / TILE);
          for (let xx = tx0; xx <= tx1; xx++) if (solidAt(xx, ty)) { p.y = ty * TILE - H; p.vy = 0; p.onGround = true; break; }
        } else if (p.vy < 0) {
          const ty = Math.floor(p.y / TILE);
          for (let xx = tx0; xx <= tx1; xx++) if (solidAt(xx, ty)) { p.y = (ty + 1) * TILE; p.vy = 0; break; }
        }
      }

      // респаун если упал
      if (p.y > ROWS * TILE + 200) { p.x = 3 * TILE; p.y = 0; p.vx = 0; p.vy = 0; }

      // ограничение по краям мира
      p.x = Math.max(0, Math.min(COLS * TILE - W, p.x));

      // камера
      const target = p.x - canvas.width / 2 + W / 2;
      camX.current += (Math.max(0, Math.min(COLS * TILE - canvas.width, target)) - camX.current) * 0.12;

      // ===== отрисовка =====
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#5b8fd6');
      grad.addColorStop(0.6, '#8fc1e8');
      grad.addColorStop(1, '#cfe6b8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // облака
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 260 - camX.current * 0.3) % (canvas.width + 200)) - 100;
        const cy = 40 + (i % 3) * 30;
        ctx.fillRect(cx, cy, 70, 18);
        ctx.fillRect(cx + 18, cy - 12, 40, 14);
      }

      ctx.save();
      ctx.translate(-Math.round(camX.current), 0);

      const world = worldRef.current;
      const startCol = Math.max(0, Math.floor(camX.current / TILE));
      const endCol = Math.min(COLS, Math.ceil((camX.current + canvas.width) / TILE) + 1);
      for (let y = 0; y < ROWS; y++)
        for (let x = startCol; x < endCol; x++) {
          const b = world[y][x];
          if (b !== 0) drawBlock(x * TILE, y * TILE, b);
        }

      // подсветка целевого блока
      const { tx, ty } = mouse.current;
      if (tx >= 0 && ty >= 0) {
        const ptx = (p.x + W / 2) / TILE, pty = (p.y + H / 2) / TILE;
        const inReach = Math.hypot(tx + 0.5 - ptx, ty + 0.5 - pty) <= REACH;
        ctx.strokeStyle = inReach ? '#ffffff' : 'rgba(255,80,80,0.7)';
        ctx.lineWidth = 3;
        ctx.strokeRect(tx * TILE + 1, ty * TILE + 1, TILE - 2, TILE - 2);
      }

      // игрок (пиксельный человечек)
      const px = Math.round(p.x), py = Math.round(p.y);
      ctx.fillStyle = '#3a7ad6'; ctx.fillRect(px, py + H * 0.45, W, H * 0.55); // штаны/тело
      ctx.fillStyle = '#5fd0d8'; ctx.fillRect(px, py + H * 0.32, W, H * 0.18); // куртка
      ctx.fillStyle = '#e8b98a'; ctx.fillRect(px + 4, py, W - 8, H * 0.32); // голова
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(px + 2, py, W - 4, 7); // волосы
      ctx.fillStyle = '#10160f';
      const eo = p.face > 0 ? 6 : -6;
      ctx.fillRect(px + W / 2 - 2 + eo / 2, py + 12, 4, 5); // глаз
      ctx.restore();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // координаты мыши -> тайл
  const updateMouse = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const wx = (clientX - rect.left) * scaleX + camX.current;
    const wy = (clientY - rect.top) * scaleY;
    mouse.current.tx = Math.floor(wx / TILE);
    mouse.current.ty = Math.floor(wy / TILE);
  };

  const setKey = (name: string, val: boolean) => () => { keys.current[name] = val; };

  return (
    <div className="space-y-4 animate-pop-in">
      <h3 className="font-pixel text-sm text-[#7fd14a] text-pixel-shadow flex items-center gap-2">
        <Icon name="Gamepad2" size={18} /> Платформер
      </h3>

      <div className="bg-[#1c2718]/95 mc-border border-2 border-[#0d120b] p-3">
        <canvas
          ref={canvasRef}
          width={COLS > 24 ? 24 * TILE : COLS * TILE}
          height={ROWS * TILE}
          className="w-full pixelated touch-none mc-border-sm cursor-crosshair bg-[#5b8fd6]"
          onMouseMove={(e) => updateMouse(e.clientX, e.clientY)}
          onMouseDown={(e) => { e.preventDefault(); updateMouse(e.clientX, e.clientY); mineOrPlace(e.button === 2); }}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            const t = e.touches[0];
            updateMouse(t.clientX, t.clientY);
            mineOrPlace(false);
          }}
        />
      </div>

      {/* Инвентарь-хотбар */}
      <div className="bg-[#1c2718]/95 mc-border border-2 border-[#0d120b] p-3">
        <div className="font-mono text-base text-[#a9c191] mb-2 text-center">
          Выбран блок: <span className="text-[#f2c14e]">{BLOCKS[selected]?.name}</span> · ставь — он закончится
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {PALETTE.map((b) => (
            <button
              key={b}
              onClick={() => setSelected(b)}
              className={`relative w-12 h-12 mc-border-sm mc-press ${selected === b ? 'ring-4 ring-[#f2c14e]' : ''}`}
              style={{ background: BLOCKS[b].body }}
            >
              <span className="absolute inset-0 top-0" style={{ background: BLOCKS[b].top, height: '34%' }} />
              <span className="absolute bottom-0.5 right-1 font-mono text-base text-white drop-shadow-[1px_1px_0_#000] z-10">
                {counts[b] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Управление */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-[#1c2718]/95 mc-border border-2 border-[#0d120b] p-3 font-mono text-lg text-[#cfe6b8]">
          <div className="font-pixel text-[10px] text-[#7fd14a] mb-2">🖥 Клавиатура</div>
          <p>A / D или ← → — бег</p>
          <p>W / Пробел / ↑ — прыжок</p>
          <p>ЛКМ — копать · ПКМ — поставить блок</p>
        </div>

        {/* Экранные кнопки */}
        <div className="bg-[#1c2718]/95 mc-border border-2 border-[#0d120b] p-3">
          <div className="font-pixel text-[10px] text-[#7fd14a] mb-2">📱 Кнопки</div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <CtrlBtn icon="ArrowLeft" onDown={setKey('a', true)} onUp={setKey('a', false)} />
              <CtrlBtn icon="ArrowRight" onDown={setKey('d', true)} onUp={setKey('d', false)} />
            </div>
            <div className="flex gap-2">
              <CtrlBtn icon="Pickaxe" label="Копать" onDown={() => mineOrPlace(false)} onUp={() => {}} />
              <CtrlBtn icon="Box" label="Ставить" onDown={() => mineOrPlace(true)} onUp={() => {}} />
              <CtrlBtn icon="ChevronUp" onDown={setKey(' ', true)} onUp={setKey(' ', false)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtrlBtn({
  icon, label, onDown, onUp,
}: { icon: string; label?: string; onDown: () => void; onUp: () => void }) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onDown(); }}
      onPointerUp={(e) => { e.preventDefault(); onUp(); }}
      onPointerLeave={() => onUp()}
      className="flex flex-col items-center justify-center gap-1 min-w-12 h-12 px-2 bg-[#2a3a22] text-[#cfe6b8] mc-border-sm mc-press select-none touch-none active:bg-[#5fa739] active:text-[#10160f]"
    >
      <Icon name={icon} size={18} />
      {label && <span className="font-mono text-xs leading-none">{label}</span>}
    </button>
  );
}
