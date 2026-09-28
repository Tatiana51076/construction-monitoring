// ─── Equipment types (17 classes from actual dataset) ─────────────────────

export type EquipmentType =
  | 'dump_truck'
  | 'excavator'
  | 'motor_grader'
  | 'roller'
  | 'crane_manipulator'
  | 'gazelle'
  | 'forklift_standard'
  | 'bucket_loader_big'
  | 'mixer'
  | 'tanker'
  | 'bulldozer'
  | 'cleaning_equipment'
  | 'truck'
  | 'trailer'
  | 'forklift_giraffe'
  | 'bucket_loader_standard'
  | 'autocran';

export interface EquipmentMeta {
  id: number;
  label: string;
  shortLabel: string;
  enLabel: string;
  color: string;
  bg: string;
  datasetCount: number;
}

export const EQUIPMENT_META: Record<EquipmentType, EquipmentMeta> = {
  dump_truck: { id: 0, label: 'Самосвал', shortLabel: 'Самосв.', enLabel: 'Dump truck', color: 'text-orange-300', bg: 'bg-orange-400/15', datasetCount: 6004 },
  excavator: { id: 1, label: 'Экскаватор', shortLabel: 'Экск.', enLabel: 'Excavator', color: 'text-amber-300', bg: 'bg-amber-400/15', datasetCount: 6957 },
  motor_grader: { id: 2, label: 'Автогрейдер', shortLabel: 'Грейд.', enLabel: 'Motor grader', color: 'text-stone-300', bg: 'bg-stone-400/15', datasetCount: 576 },
  roller: { id: 3, label: 'Каток', shortLabel: 'Каток', enLabel: 'Roller', color: 'text-zinc-300', bg: 'bg-zinc-400/15', datasetCount: 1 },
  crane_manipulator: { id: 4, label: 'Кран-манипулятор', shortLabel: 'Кран-м.', enLabel: 'Crane manipulator', color: 'text-sky-300', bg: 'bg-sky-400/15', datasetCount: 610 },
  gazelle: { id: 5, label: 'Газель', shortLabel: 'Газель', enLabel: 'Gazelle', color: 'text-slate-300', bg: 'bg-slate-400/15', datasetCount: 4286 },
  forklift_standard: { id: 6, label: 'Погрузчик стандартный', shortLabel: 'Погр.ст.', enLabel: 'Forklift Standart', color: 'text-lime-300', bg: 'bg-lime-400/15', datasetCount: 475 },
  bucket_loader_big: { id: 7, label: 'Большой ковшовый погрузчик', shortLabel: 'Ковш.б.', enLabel: 'Bucket loader Big', color: 'text-yellow-300', bg: 'bg-yellow-400/15', datasetCount: 2225 },
  mixer: { id: 8, label: 'Миксер', shortLabel: 'Миксер', enLabel: 'Mixer', color: 'text-teal-300', bg: 'bg-teal-400/15', datasetCount: 901 },
  tanker: { id: 9, label: 'Цистерна', shortLabel: 'Цист.', enLabel: 'Tanker', color: 'text-cyan-300', bg: 'bg-cyan-400/15', datasetCount: 311 },
  bulldozer: { id: 10, label: 'Бульдозер', shortLabel: 'Бульд.', enLabel: 'Bulldozer', color: 'text-red-300', bg: 'bg-red-400/15', datasetCount: 0 },
  cleaning_equipment: { id: 11, label: 'Уборочная техника', shortLabel: 'Убор.', enLabel: 'Cleaning equipment', color: 'text-green-300', bg: 'bg-green-400/15', datasetCount: 438 },
  truck: { id: 12, label: 'Грузовик', shortLabel: 'Грузов.', enLabel: 'Truck', color: 'text-blue-300', bg: 'bg-blue-400/15', datasetCount: 1191 },
  trailer: { id: 13, label: 'Прицеп', shortLabel: 'Прицеп', enLabel: 'Trailer', color: 'text-indigo-300', bg: 'bg-indigo-400/15', datasetCount: 1735 },
  forklift_giraffe: { id: 14, label: 'Погрузчик «Жираф»', shortLabel: 'Жираф', enLabel: 'Forklift Giraffe', color: 'text-violet-300', bg: 'bg-violet-400/15', datasetCount: 520 },
  bucket_loader_standard: { id: 15, label: 'Стандартный ковшовый погрузчик', shortLabel: 'Ковш.ст.', enLabel: 'Bucket loader Standart', color: 'text-rose-300', bg: 'bg-rose-400/15', datasetCount: 1910 },
  autocran: { id: 16, label: 'Автокран', shortLabel: 'Автокр.', enLabel: 'Autocran', color: 'text-pink-300', bg: 'bg-pink-400/15', datasetCount: 1759 },
};

export const EQUIPMENT_CLASS_COUNTS = Object.values(EQUIPMENT_META).map((e) => ({
  id: e.id,
  label: e.label,
  enLabel: e.enLabel,
  count: e.datasetCount,
}));

// ─── Разбор ответа API детекции ───────────────────────────────────────────

// Формат bbox из ответа /upload: [x, y, w, h], где
//   x, y — координаты ЦЕНТРА бокса (пиксели),
//   w, h — ширина и высота бокса (пиксели).
export type ApiBBox = [number, number, number, number];

export interface ApiDetection {
  class: string;        // слаг или название класса из ответа
  confidence: number;   // 0…1
  bbox: ApiBBox;
}

// GET /works — список работ и их статус
export interface ApiWork {
  id: number;
  name: string;
  status: string; // in_progress | pending | ...
}

// GET /results — результат последней обработки
export interface ApiResults {
  last_upload: string;
  detections: ApiDetection[];
  works_status: { work_id: number; detected: boolean }[];
}

// Приводит класс из ответа к нашему EquipmentType.
// Понимает: слаг ('exhaust' -> dump_truck?), имя ('Dump truck'), вариации
// с пробелами/дефисами/регистром, а также числовой индекс класса (0…16).
const EQUIPMENT_BY_ID: Record<number, EquipmentType> = Object.fromEntries(
  Object.entries(EQUIPMENT_META).map(([k, v]) => [v.id, k as EquipmentType]),
) as Record<number, EquipmentType>;

function normalizeClass(s: string): string {
  return s.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function resolveEquipment(cls: string | number): EquipmentType | null {
  if (typeof cls === 'number' || /^\d+$/.test(String(cls).trim())) {
    return EQUIPMENT_BY_ID[Number(cls)] ?? null;
  }
  const norm = normalizeClass(String(cls));
  for (const key of Object.keys(EQUIPMENT_META) as EquipmentType[]) {
    const meta = EQUIPMENT_META[key];
    if (key === norm) return key;
    if (normalizeClass(meta.enLabel) === norm) return key; // 'Forklift Standart' -> ключ справочника
    if (normalizeClass(meta.label) === norm) return key;
  }
  return null;
}

// ─── Equipment → Works matching matrix ───────────────────────────────────

export interface MatrixEntry {
  equipment: EquipmentType;
  workTypes: string[];
  minCount: number;
  minDurationMin: number;
}

export const EQUIPMENT_WORK_MATRIX: MatrixEntry[] = [
  { equipment: 'excavator', workTypes: ['earthworks', 'foundation', 'pit'], minCount: 1, minDurationMin: 240 },
  { equipment: 'dump_truck', workTypes: ['earthworks', 'foundation', 'concrete'], minCount: 2, minDurationMin: 180 },
  { equipment: 'autocran', workTypes: ['monolith', 'facade', 'structure'], minCount: 1, minDurationMin: 360 },
  { equipment: 'mixer', workTypes: ['concrete', 'foundation'], minCount: 1, minDurationMin: 120 },
  { equipment: 'crane_manipulator', workTypes: ['concrete', 'monolith'], minCount: 1, minDurationMin: 180 },
  { equipment: 'bulldozer', workTypes: ['earthworks', 'pit'], minCount: 1, minDurationMin: 200 },
  { equipment: 'bucket_loader_standard', workTypes: ['earthworks', 'rebar', 'foundation'], minCount: 1, minDurationMin: 240 },
  { equipment: 'roller', workTypes: ['earthworks', 'pit'], minCount: 1, minDurationMin: 180 },
  { equipment: 'motor_grader', workTypes: ['earthworks'], minCount: 1, minDurationMin: 160 },
];

// ─── Backend API ──────────────────────────────────────────────────────────

export const BACKEND_API = {
  // Всегда относительные пути: приложение открывается через прокси (Vite dev/preview,
  // туннель или сервер, где фронт и API на одном origin) — тогда CORS не нужен.
  baseUrl: '',
  healthEndpoint: '/health',
  uploadEndpoint: '/upload',
  photosEndpoint: '/photos',
  objectsEndpoint: '/api/foreman/objects',
  leaderboardEndpoint: '/api/foreman/leaderboard',
  docsEndpoint: '/docs',
  uploadField: 'file', // имя поля файла в POST /upload (multipart/form-data)
  healthResponse: { status: 'ok' },
  // bbox: [x, y, w, h] — центр бокса + размеры, в ПИКСЕЛЯХ
  uploadResponseExample: {
    status: 'ok',
    file: 'snapshot_2026-09-04_0815.jpg',
    image_url: '/uploads/snapshot_2026-09-04_0815.jpg',
    detections: [
      { class: 'Excavator', confidence: 0.92, bbox: [100, 200, 50, 80] },
      { class: 'Dump truck', confidence: 0.87, bbox: [340, 180, 60, 70] },
    ] as ApiDetection[],
  },
  // GET /photos
  photosResponseExample: {
    total: 0,
    photos: [] as Array<{ id: string; file: string; image_url: string; timestamp: string }>,
  },
  // GET /api/foreman/objects
  objectsResponseExample: {
    objects: [
      {
        id: 'obj-severny-2',
        name: 'ЖК «Северный», корпус 2',
        brigades: [
          { id: 'br-1', name: 'Бригада №1', members: 6 },
          { id: 'br-2', name: 'Бригада №2', members: 5 },
        ],
      },
    ],
  },
  // GET /api/foreman/leaderboard
  leaderboardResponseExample: {
    brigades: [
      { id: 'br-2', name: 'Бригада №2', rank: 1, points: 178, accepted: 14, quality: 92 },
      { id: 'br-1', name: 'Бригада №1', rank: 2, points: 150, accepted: 12, quality: 88 },
    ],
    others: [
      { brigade: 'Бригада №2', work: 'Установка дверей', zone: 'зона 4', status: 'accepted' },
    ],
  },
};

// ─── Shared types ─────────────────────────────────────────────────────────

export type WorkStatus = 'requires_reaction' | 'ask_reason' | 'in_progress' | 'out_of_scope';
export type CameraVerdict = 'nothing_found' | 'resources_only' | 'work_seen' | 'not_checked';
export type ConstructionPhase = 'rough' | 'finishing';
export type DeviationVerdict = 'normal' | 'warning' | 'critical';
export type CalendarScale = 'day' | 'week' | 'month';
export type EventStatus = 'confirmed' | 'delayed' | 'idle' | 'reallocated' | 'planned';

// ─── Re-export meta maps (needed by components) ───────────────────────────

export const STATUS_META: Record<WorkStatus, { label: string; ring: string; text: string; bg: string; border: string; dot: string }> = {
  requires_reaction: { label: 'Требует реакции', ring: 'ring-danger-500/40', text: 'text-danger-300', bg: 'bg-danger-500/10', border: 'border-danger-500/40', dot: 'bg-danger-500' },
  ask_reason: { label: 'Спросить причину', ring: 'ring-warning-400/40', text: 'text-warning-300', bg: 'bg-warning-400/10', border: 'border-warning-400/40', dot: 'bg-warning-400' },
  in_progress: { label: 'Идёт', ring: 'ring-success-500/30', text: 'text-success-300', bg: 'bg-success-500/10', border: 'border-success-500/30', dot: 'bg-success-400' },
  out_of_scope: { label: 'Вне охвата', ring: 'ring-ink-400/30', text: 'text-ink-300', bg: 'bg-ink-700/40', border: 'border-ink-600/40', dot: 'bg-ink-400' },
};

export const VERDICT_META: Record<CameraVerdict, { label: string; text: string; bg: string; icon: 'alert' | 'help' | 'check' | 'eye-off' }> = {
  nothing_found: { label: 'Ничего не обнаружено', text: 'text-danger-300', bg: 'bg-danger-500/15', icon: 'alert' },
  resources_only: { label: 'Только ресурсы', text: 'text-warning-300', bg: 'bg-warning-400/15', icon: 'help' },
  work_seen: { label: 'Работа идёт', text: 'text-success-300', bg: 'bg-success-500/15', icon: 'check' },
  not_checked: { label: 'Не проверяется', text: 'text-ink-300', bg: 'bg-ink-700/50', icon: 'eye-off' },
};

export const EVENT_STATUS_META: Record<EventStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  confirmed: { label: 'Подтверждено', bg: 'bg-success-500/20', border: 'border-success-500/40', text: 'text-success-200', dot: 'bg-success-400' },
  delayed: { label: 'Задержка', bg: 'bg-danger-500/20', border: 'border-danger-500/40', text: 'text-danger-200', dot: 'bg-danger-500' },
  idle: { label: 'Простой', bg: 'bg-warning-400/20', border: 'border-warning-400/40', text: 'text-warning-200', dot: 'bg-warning-400' },
  reallocated: { label: 'Перераспределение', bg: 'bg-accent-500/20', border: 'border-accent-500/40', text: 'text-accent-400', dot: 'bg-accent-500' },
  planned: { label: 'Запланировано', bg: 'bg-ink-600/40', border: 'border-ink-500/40', text: 'text-ink-300', dot: 'bg-ink-400' },
};

export const WEAK_LINK_META: Record<'supplier' | 'equipment' | 'crew' | 'weather', { label: string; icon: 'truck' | 'wrench' | 'users' | 'cloud-rain'; text: string; bg: string }> = {
  supplier: { label: 'Поставщик', icon: 'truck', text: 'text-warning-300', bg: 'bg-warning-400/10' },
  equipment: { label: 'Техника', icon: 'wrench', text: 'text-danger-300', bg: 'bg-danger-500/10' },
  crew: { label: 'Бригада', icon: 'users', text: 'text-accent-400', bg: 'bg-accent-500/10' },
  weather: { label: 'Погода', icon: 'cloud-rain', text: 'text-ink-300', bg: 'bg-ink-700/40' },
};

export const DEVIATION_VERDICT_META: Record<DeviationVerdict, { label: string; text: string; bg: string; border: string }> = {
  normal: { label: 'В норме', text: 'text-success-300', bg: 'bg-success-500/10', border: 'border-success-500/30' },
  warning: { label: 'Отклонение', text: 'text-warning-300', bg: 'bg-warning-400/10', border: 'border-warning-400/30' },
  critical: { label: 'Критично', text: 'text-danger-300', bg: 'bg-danger-500/10', border: 'border-danger-500/30' },
};
