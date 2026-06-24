import { useState } from 'react';
import Icon from '@/components/ui/icon';
import Platformer from '@/components/Platformer';
import { MODS, SYNERGIES } from '@/data/mods';

const BG = 'https://cdn.poehali.dev/projects/f3d3fe0b-e6d9-41a8-b2b5-900661d77bfc/files/b57d1907-ac98-4e5d-b52c-1e3ed14b6826.jpg';

type Tab = 'main' | 'play' | 'inventory' | 'crafting' | 'achievements' | 'mods' | 'settings';

const BLOCKS = [
  { id: 'grass', name: 'Трава', cls: 'blk-grass', count: 64 },
  { id: 'dirt', name: 'Земля', cls: 'blk-dirt', count: 128 },
  { id: 'stone', name: 'Камень', cls: 'blk-stone', count: 256 },
  { id: 'iron', name: 'Железо', cls: 'blk-iron', count: 42 },
  { id: 'gold', name: 'Золото', cls: 'blk-gold', count: 18 },
  { id: 'diamond', name: 'Алмаз', cls: 'blk-diamond', count: 7 },
  { id: 'redstone', name: 'Красныйкамень', cls: 'blk-redstone', count: 91 },
  { id: 'emerald', name: 'Изумруд', cls: 'blk-emerald', count: 3 },
  { id: 'tnt', name: 'Бабах', cls: 'blk-tnt', count: 12 },
];

const RECIPES = [
  { out: 'Паро-Реактор', cls: 'blk-iron', need: ['Железо', 'Красныйкамень', 'Бабах'] },
  { out: 'Алмазная кирка', cls: 'blk-diamond', need: ['Алмаз', 'Алмаз', 'Камень'] },
  { out: 'Космо-пчела', cls: 'blk-emerald', need: ['Изумруд', 'Золото', 'Трава'] },
];

const ACHIEVEMENTS = [
  { icon: 'Pickaxe', name: 'Первый блок', desc: 'Сломал свой первый блок (и палец)', done: true },
  { icon: 'Bomb', name: 'Упс!', desc: 'Взорвал «Бабах» рядом с домом', done: true },
  { icon: 'Zap', name: 'Под напряжением', desc: 'Собрал Паро-Реактор в ЗаводоКрафте', done: true },
  { icon: 'Rocket', name: 'Поехали!', desc: 'Долетел до Луны на картошке', done: false },
  { icon: 'Crown', name: 'Магнат пчёл', desc: 'Развёл 100 пчёл-олигархов', done: false },
  { icon: 'Sparkles', name: 'Сошёл с ума', desc: 'Изучил один свиток 50 раз', done: false },
];

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'main', label: 'Главная', icon: 'Home' },
  { id: 'play', label: 'Играть', icon: 'Gamepad2' },
  { id: 'inventory', label: 'Инвентарь', icon: 'Backpack' },
  { id: 'crafting', label: 'Крафтинг', icon: 'Hammer' },
  { id: 'achievements', label: 'Достижения', icon: 'Trophy' },
  { id: 'mods', label: 'О модах', icon: 'Boxes' },
  { id: 'settings', label: 'Настройки', icon: 'Settings' },
];

export default function Index() {
  const [tab, setTab] = useState<Tab>('main');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen relative overflow-x-hidden text-foreground">
      {/* Фон */}
      <div className="fixed inset-0 -z-10">
        <img src={BG} alt="" className="w-full h-full object-cover pixelated opacity-70" />
        <div className="absolute inset-0 bg-[#10160f]/70" />
        <div className="absolute inset-0 scanlines opacity-30" />
      </div>

      {/* Шапка */}
      <header className="sticky top-0 z-30 bg-[#1a2417]/95 backdrop-blur border-b-4 border-[#0d120b] mc-border-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 blk-grass mc-border-sm animate-float-block" />
            <h1 className="font-pixel text-sm md:text-base text-[#7fd14a] text-pixel-shadow leading-tight">
              БлокоКрафт<span className="text-[#f2c14e]"> 2D</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-2 font-mono text-2xl text-[#cfe6b8]">
            <Icon name="Heart" className="text-[#d83a3a]" size={20} />
            <span>20</span>
            <Icon name="Drumstick" className="text-[#f2c14e] ml-3" size={20} />
            <span>20</span>
          </div>
        </div>
      </header>

      {/* Навигация */}
      <nav className="sticky top-[68px] z-20 bg-[#141c11]/95 backdrop-blur border-b-2 border-[#0d120b]">
        <div className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto py-2">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex items-center gap-2 px-3 py-2 font-pixel text-[10px] whitespace-nowrap mc-border-sm mc-press transition-colors ${
                tab === n.id ? 'bg-[#5fa739] text-[#10160f]' : 'bg-[#2a3a22] text-[#cfe6b8] hover:bg-[#36492b]'
              }`}
            >
              <Icon name={n.icon} size={14} />
              {n.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {tab === 'main' && <MainTab onPlay={() => setTab('play')} onMods={() => setTab('mods')} />}
        {tab === 'play' && <Platformer />}
        {tab === 'inventory' && <InventoryTab selected={selected} setSelected={setSelected} />}
        {tab === 'crafting' && <CraftingTab />}
        {tab === 'achievements' && <AchievementsTab />}
        {tab === 'mods' && <ModsTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center font-mono text-[#7e8c6f] text-lg">
        БлокоКрафт 2D · {MODS.length} модов · сделано в открытом космосе 🚀
      </footer>
    </div>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1c2718]/95 mc-border border-2 border-[#0d120b] p-5 ${className}`}>{children}</div>
  );
}

function MainTab({ onPlay, onMods }: { onPlay: () => void; onMods: () => void }) {
  return (
    <div className="space-y-8 animate-pop-in">
      {/* Герой */}
      <Panel className="text-center py-12 relative overflow-hidden">
        <div className="flex justify-center gap-3 mb-6">
          {['blk-grass', 'blk-stone', 'blk-diamond', 'blk-gold', 'blk-tnt'].map((c, i) => (
            <div
              key={c}
              className={`w-12 h-12 md:w-16 md:h-16 ${c} mc-border animate-float-block`}
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
        <h2 className="font-pixel text-lg md:text-3xl text-[#7fd14a] text-pixel-shadow mb-4 leading-relaxed">
          Построй мир. Сломай его модами.
        </h2>
        <p className="font-mono text-xl md:text-2xl text-[#cfe6b8] max-w-2xl mx-auto mb-8">
          Пиксельная 2D-песочница с кучей оригинальных модов, синергией механик и комбо,
          которые объединяются в нечто абсолютно неуправляемое.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={onPlay}
            className="font-pixel text-xs px-6 py-4 bg-[#5fa739] text-[#10160f] mc-border mc-press hover:bg-[#6dbb4a]"
          >
            ▶ Играть
          </button>
          <button
            onClick={onMods}
            className="font-pixel text-xs px-6 py-4 bg-[#2a3a22] text-[#cfe6b8] mc-border mc-press hover:bg-[#36492b]"
          >
            Список модов
          </button>
        </div>
      </Panel>

      {/* Синергии — фишка проекта */}
      <div>
        <h3 className="font-pixel text-sm text-[#f2c14e] text-pixel-shadow mb-4 flex items-center gap-2">
          <Icon name="GitMerge" size={18} /> Синергия модов
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {SYNERGIES.map((s) => (
            <Panel key={s.result} className="hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-center gap-2 font-pixel text-[10px] text-[#cfe6b8] mb-3">
                <span className="px-2 py-1 bg-[#2a3a22] mc-border-sm">{s.a}</span>
                <Icon name="Plus" size={14} className="text-[#f2c14e]" />
                <span className="px-2 py-1 bg-[#2a3a22] mc-border-sm">{s.b}</span>
              </div>
              <div className="text-center font-pixel text-xs text-[#7fd14a] mb-2">= {s.result}</div>
              <p className="text-center font-mono text-lg text-[#a9c191]">{s.bonus}</p>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}

function InventoryTab({
  selected,
  setSelected,
}: {
  selected: string | null;
  setSelected: (v: string | null) => void;
}) {
  return (
    <div className="animate-pop-in space-y-6">
      <h3 className="font-pixel text-sm text-[#7fd14a] text-pixel-shadow flex items-center gap-2">
        <Icon name="Backpack" size={18} /> Инвентарь
      </h3>
      <Panel>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {BLOCKS.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelected(b.id)}
              className={`relative aspect-square ${b.cls} mc-border-sm mc-press transition-transform hover:scale-105 ${
                selected === b.id ? 'ring-4 ring-[#f2c14e]' : ''
              }`}
            >
              <span className="absolute bottom-0.5 right-1 font-mono text-base text-white drop-shadow-[1px_1px_0_#000]">
                {b.count}
              </span>
            </button>
          ))}
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#0f150c] mc-border-sm" />
          ))}
        </div>
      </Panel>
      <Panel>
        {selected ? (
          (() => {
            const b = BLOCKS.find((x) => x.id === selected)!;
            return (
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${b.cls} mc-border`} />
                <div>
                  <div className="font-pixel text-xs text-[#7fd14a]">{b.name}</div>
                  <div className="font-mono text-xl text-[#a9c191]">В наличии: {b.count} шт.</div>
                </div>
              </div>
            );
          })()
        ) : (
          <p className="font-mono text-xl text-[#7e8c6f] text-center">Выбери блок, чтобы узнать о нём</p>
        )}
      </Panel>
    </div>
  );
}

function CraftingTab() {
  return (
    <div className="animate-pop-in space-y-6">
      <h3 className="font-pixel text-sm text-[#7fd14a] text-pixel-shadow flex items-center gap-2">
        <Icon name="Hammer" size={18} /> Крафтинг
      </h3>
      <div className="grid md:grid-cols-3 gap-4">
        {RECIPES.map((r) => (
          <Panel key={r.out} className="text-center hover:-translate-y-1 transition-transform">
            <div className="grid grid-cols-3 gap-1.5 w-32 mx-auto mb-4">
              {r.need.map((n, i) => {
                const blk = BLOCKS.find((b) => b.name === n);
                return <div key={i} className={`aspect-square ${blk?.cls ?? 'bg-[#0f150c]'} mc-border-sm`} />;
              })}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-[#0f150c] mc-border-sm" />
              ))}
            </div>
            <Icon name="ArrowDown" size={18} className="mx-auto text-[#f2c14e] mb-3" />
            <div className={`w-14 h-14 mx-auto ${r.cls} mc-border mb-3`} />
            <div className="font-pixel text-[10px] text-[#7fd14a]">{r.out}</div>
            <div className="font-mono text-base text-[#a9c191] mt-1">{r.need.join(' + ')}</div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function AchievementsTab() {
  const done = ACHIEVEMENTS.filter((a) => a.done).length;
  return (
    <div className="animate-pop-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-pixel text-sm text-[#7fd14a] text-pixel-shadow flex items-center gap-2">
          <Icon name="Trophy" size={18} /> Достижения
        </h3>
        <span className="font-mono text-xl text-[#f2c14e]">{done} / {ACHIEVEMENTS.length}</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map((a) => (
          <Panel
            key={a.name}
            className={`flex items-start gap-3 ${a.done ? '' : 'opacity-50 grayscale'}`}
          >
            <div
              className={`w-12 h-12 flex items-center justify-center mc-border-sm shrink-0 ${
                a.done ? 'bg-[#f2c14e]' : 'bg-[#2a3a22]'
              }`}
            >
              <Icon name={a.icon} size={22} className={a.done ? 'text-[#10160f]' : 'text-[#7e8c6f]'} />
            </div>
            <div>
              <div className="font-pixel text-[10px] text-[#cfe6b8] mb-1">{a.name}</div>
              <div className="font-mono text-base text-[#a9c191]">{a.desc}</div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function ModsTab() {
  return (
    <div className="animate-pop-in space-y-6">
      <h3 className="font-pixel text-sm text-[#7fd14a] text-pixel-shadow flex items-center gap-2">
        <Icon name="Boxes" size={18} /> Модификации
      </h3>
      <div className="grid md:grid-cols-2 gap-5">
        {MODS.map((m) => (
          <Panel key={m.id} className="hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-4 mb-3">
              <div
                className="w-14 h-14 flex items-center justify-center mc-border-sm shrink-0"
                style={{ background: m.color }}
              >
                <Icon name={m.icon} size={26} className="text-[#10160f]" />
              </div>
              <div>
                <div className="font-pixel text-xs" style={{ color: m.color }}>
                  {m.name}
                </div>
                <div className="font-mono text-base text-[#7e8c6f]">{m.parody}</div>
                <div className="font-mono text-base text-[#a9c191]">{m.blocks} блоков</div>
              </div>
            </div>
            <p className="font-mono text-lg text-[#cfe6b8] mb-3">{m.desc}</p>
            <div className="flex flex-wrap gap-2">
              {m.features.map((f) => (
                <span
                  key={f}
                  className="font-mono text-base px-2 py-1 bg-[#0f150c] mc-border-sm text-[#a9c191]"
                >
                  {f}
                </span>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  const [vol, setVol] = useState(70);
  const [render, setRender] = useState(12);
  const [bobbing, setBobbing] = useState(true);
  return (
    <div className="animate-pop-in space-y-6 max-w-2xl">
      <h3 className="font-pixel text-sm text-[#7fd14a] text-pixel-shadow flex items-center gap-2">
        <Icon name="Settings" size={18} /> Настройки
      </h3>
      <Panel className="space-y-6">
        <Slider label="Громкость" icon="Volume2" value={vol} setValue={setVol} max={100} unit="%" />
        <Slider label="Дальность прорисовки" icon="Eye" value={render} setValue={setRender} max={32} unit=" чанков" />
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[10px] text-[#cfe6b8] flex items-center gap-2">
            <Icon name="Move" size={14} /> Покачивание камеры
          </span>
          <button
            onClick={() => setBobbing((v) => !v)}
            className={`font-pixel text-[10px] px-4 py-2 mc-border-sm mc-press ${
              bobbing ? 'bg-[#5fa739] text-[#10160f]' : 'bg-[#2a3a22] text-[#cfe6b8]'
            }`}
          >
            {bobbing ? 'ВКЛ' : 'ВЫКЛ'}
          </button>
        </div>
      </Panel>
    </div>
  );
}

function Slider({
  label,
  icon,
  value,
  setValue,
  max,
  unit,
}: {
  label: string;
  icon: string;
  value: number;
  setValue: (v: number) => void;
  max: number;
  unit: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-pixel text-[10px] text-[#cfe6b8] flex items-center gap-2">
          <Icon name={icon} size={14} /> {label}
        </span>
        <span className="font-mono text-lg text-[#f2c14e]">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-[#5fa739] h-3"
      />
    </div>
  );
}