export interface Mod {
  id: string;
  name: string;
  parody: string;
  icon: string;
  color: string;
  blocks: number;
  desc: string;
  features: string[];
}

export const MODS: Mod[] = [
  {
    id: 'industrial',
    name: 'ЗаводоКрафт',
    parody: 'пародия на IndustrialCraft',
    icon: 'Factory',
    color: '#f2c14e',
    blocks: 412,
    desc: 'Электричество, генераторы, ядерные реакторы и комбайны, которые работают до первого короткого замыкания.',
    features: ['Ядро-печь на картошке', 'Лазерный отбойник', 'Робо-шахтёр Гена', 'Батарейка на 9000 вольт'],
  },
  {
    id: 'thermal',
    name: 'ТеплоТруба',
    parody: 'пародия на Thermal Expansion',
    icon: 'Flame',
    color: '#d83a3a',
    blocks: 287,
    desc: 'Машины качают энергию по трубам. Если перепутать трубу — взорвётся ровно у соседа.',
    features: ['Паровой чайник-3000', 'Жидкостный насос «Кашалот»', 'Динамо-белка'],
  },
  {
    id: 'magic',
    name: 'ВолшеботМагия',
    parody: 'пародия на Thaumcraft',
    icon: 'Sparkles',
    color: '#a855f7',
    blocks: 356,
    desc: 'Аура, узлы магии и посохи. Главное — не сойти с ума, изучая один и тот же свиток.',
    features: ['Жезл «Абракадабра»', 'Котёл варки невезения', 'Гоблин-исследователь'],
  },
  {
    id: 'tech',
    name: 'МехоТех',
    parody: 'пародия на Tinkers Construct',
    icon: 'Wrench',
    color: '#5fd0d8',
    blocks: 198,
    desc: 'Куй инструменты по частям. Сломал лопату — сам виноват, надо было ковать из алмаза, а не из печенья.',
    features: ['Кузня имени деда', 'Молот «Бабах»', 'Кирка с характером'],
  },
  {
    id: 'bees',
    name: 'ПчелоБиз',
    parody: 'пародия на Forestry',
    icon: 'Bug',
    color: '#3fd97a',
    blocks: 240,
    desc: 'Разводи пчёл, скрещивай породы и собирай мёд. Пчёлы иногда устраивают забастовку.',
    features: ['Улей-небоскрёб', 'Пчела-олигарх', 'Мёд категории люкс'],
  },
  {
    id: 'space',
    name: 'КосмоПрыг',
    parody: 'пародия на Galacticraft',
    icon: 'Rocket',
    color: '#60a5fa',
    blocks: 321,
    desc: 'Строй ракету и лети на Луну. Кислород продаётся отдельно, скафандр — в подписке.',
    features: ['Ракета «Поехали!»', 'Лунный трактор', 'Космо-картошка'],
  },
];

export interface Synergy {
  a: string;
  b: string;
  result: string;
  bonus: string;
}

export const SYNERGIES: Synergy[] = [
  { a: 'ЗаводоКрафт', b: 'ТеплоТруба', result: 'Паро-Реактор', bonus: '+200% энергии, −1 сосед' },
  { a: 'ВолшеботМагия', b: 'МехoТех', result: 'Зачарованный молот', bonus: 'Ломает блоки силой мысли' },
  { a: 'ПчелоБиз', b: 'КосмоПрыг', result: 'Космо-пчела', bonus: 'Опыляет звёзды, даёт лунный мёд' },
  { a: 'ЗаводоКрафт', b: 'КосмоПрыг', result: 'Орбитальный завод', bonus: 'Майнит астероиды на автопилоте' },
];
