import type { EquipmentType, WorkStatus, CameraVerdict, ConstructionPhase, DeviationVerdict, EventStatus, CalendarScale } from '@/data';
export { loadLiveWorks } from './liveData';

// Локальная дата в формате YYYY-MM-DD (не UTC)
export function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Локальная дата для шапки: «29 сен 2026»
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export function dateLabelString(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

// Пн–Пт текущей недели (неделя начинается с понедельника)
export function currentWeekDates(): string[] {
  const base = new Date();
  const dow = (base.getDay() + 6) % 7; // Пн=0 … Вс=6
  const monday = new Date(base);
  monday.setDate(base.getDate() - dow);
  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(localDateString(d));
  }
  return dates;
}

// ─── Domain types ─────────────────────────────────────────────────────────

export interface WorkItem {
  id: string;
  title: string;
  contractor: string;
  status: WorkStatus;
  verdict: CameraVerdict;
  verdictLabel: string;
  planPct: number;
  confirmedPct: number;
  reportedPct?: number;
  delayDays: number;
  delayHours: number;
  detail: string;
  phase: ConstructionPhase;
  detailCount: number;
  criticalDetail?: string;
  reallocatedCrews?: number;
  receivedCrews?: number;
  zoneId?: string;
  expectedEquipment?: EquipmentType[];
  photoUrl?: string; // URL фото прораба (из /photos)
  photoStatus?: 'confirmed' | 'not_confirmed' | 'review' | 'unsure';
  timestamp?: string; // время съёмки фото (из /photos)
}

export interface SiteZone {
  id: string;
  name: string;
  cameraId: string;
  cameraImage: string;
  x: number;
  y: number;
  w: number;
  h: number;
  currentWorkId: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  equipment: EquipmentType;
  confidence: number;
}

export interface CameraSnapshot {
  id: string;
  zoneId: string;
  cameraId: string;
  timestamp: string;
  image: string;
  detections: BoundingBox[];
}

export interface EquipmentObservation {
  zoneId: string;
  equipment: EquipmentType;
  avgCountPerDay: number;
  avgActiveMinutes: number;
  presentDays: number;
  trend: 'stable' | 'increasing' | 'decreasing' | 'absent';
}

export interface DeviationAnalysis {
  zoneId: string;
  zoneName: string;
  workId: string;
  workTitle: string;
  expectedEquipment: EquipmentType[];
  observedEquipment: EquipmentType[];
  axes: {
    presence: { verdict: DeviationVerdict; expected: number; observed: number; note: string };
    intensity: { verdict: DeviationVerdict; expected: number; observed: number; note: string };
    dynamics: { verdict: DeviationVerdict; note: string };
  };
  overallVerdict: DeviationVerdict;
  overallNote: string;
}

export interface RiskComponent {
  label: string;
  weight: number;
  score: number;
  description: string;
}

export interface RiskScore {
  total: number;
  components: RiskComponent[];
  verdict: 'Низкий' | 'Средний' | 'Высокий' | 'Критический';
  recommendation: string;
}

export interface Reallocation {
  id: string;
  fromWorkId: string;
  fromTitle: string;
  toWorkId: string;
  toTitle: string;
  date: string;
  crewCount: number;
  hoursRedirected: number;
  compensationDays: number;
  note: string;
}

export interface WeakLink {
  id: string;
  type: 'supplier' | 'equipment' | 'crew' | 'weather';
  name: string;
  description: string;
  affectedWorkIds: string[];
  affectedWorkTitles: string[];
  delayContributionDays: number;
  delayContributionHours: number;
}

export interface CalendarEvent {
  id: string;
  workId: string;
  title: string;
  contractor: string;
  date: string;
  startHour: number;
  endHour: number;
  status: EventStatus;
  delayMinutes?: number;
  note?: string;
}

export interface DaySummary {
  date: string;
  totalEvents: number;
  delayedEvents: number;
  confirmedEvents: number;
  hasReallocation: boolean;
}

export interface ProjectSummary {
  objectName: string;
  dateLabel: string;
  schedule: string;
  cameras: number;
  totalWorks: number;
  requiresReaction: number;
  askReason: number;
  inProgress: number;
  outOfScope: number;
  planPct: number;
  confirmedPct: number;
  gapPct: number;
  gapDays: number;
  totalDelayDays: number;
  compensatedDays: number;
  netDelayDays: number;
  penaltyRisk: boolean;
  penaltyNote: string;
  roughDetailCount: number;
  finishingDetailCount: number;
  totalDetailCount: number;
  totalDelayHours: number;
}

// Подсчёт сводных плиток из живых работ
export function computeSummaryStats(workItems: WorkItem[]): { requiresReaction: number; askReason: number; inProgress: number; outOfScope: number; totalWorks: number } {
  const stats = { requiresReaction: 0, askReason: 0, inProgress: 0, outOfScope: 0, totalWorks: workItems.length };
  for (const w of workItems) {
    if (w.status === 'requires_reaction') stats.requiresReaction++;
    else if (w.status === 'ask_reason') stats.askReason++;
    else if (w.status === 'in_progress') stats.inProgress++;
    else if (w.status === 'out_of_scope') stats.outOfScope++;
  }
  return stats;
}

export interface ProjectKPIs {
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  equipmentUtilization: number;
  avgDetectionConfidence: number;
  totalDetections: number;
  framesProcessed: number;
  matchingAccuracy: number;
}

// ─── Project definition ───────────────────────────────────────────────────

export interface ProjectContact {
  name: string;
  phone: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  status: 'critical' | 'warning' | 'normal';
  problemScore: number; // higher = more problems
  contact: ProjectContact;
  summary: ProjectSummary;
  workItems: WorkItem[];
  siteZones: SiteZone[];
  cameraSnapshots: CameraSnapshot[];
  equipmentObservations: EquipmentObservation[];
  deviationAnalyses: DeviationAnalysis[];
  riskScore: RiskScore;
  kpis: ProjectKPIs;
  reallocations: Reallocation[];
  weakLinks: WeakLink[];
  calendarEvents: CalendarEvent[];
  monthSummaries: DaySummary[];
  todayDate: string;
  weekDates: string[];
}

// ─── Project 1: ЖК «Северный» — critical ─────────────────────────────────

const severnySummary: ProjectSummary = {
  objectName: 'ЖК «Северный», корпус 2',
  dateLabel: dateLabelString(new Date()),
  schedule: 'Пятидневка',
  cameras: 3,
  totalWorks: 6,
  requiresReaction: 2,
  askReason: 1,
  inProgress: 2,
  outOfScope: 1,
  planPct: 52, confirmedPct: 31, gapPct: 21, gapDays: 6,
  totalDelayDays: 6, compensatedDays: 1, netDelayDays: 5,
  penaltyRisk: false, penaltyNote: 'Штраф не грозит, но слабое звено — поставщик арматуры',
  roughDetailCount: 127, finishingDetailCount: 180, totalDetailCount: 307, totalDelayHours: 6,
};

const severnyWorkItems: WorkItem[] = [
  { id: 'armature-2', title: 'Армирование, зона 2', contractor: 'ООО СтройМонтаж', status: 'requires_reaction', verdict: 'nothing_found', verdictLabel: 'Ничего не обнаружено', planPct: 68, confirmedPct: 12, reportedPct: 100, delayDays: 6, delayHours: 3, detail: 'Закрыто на 100 %, камера не видела технику 0 из 5 дней', phase: 'rough', detailCount: 35, criticalDetail: 'Доставка арматуры Ø12 — опоздание 3ч 20мин', reallocatedCrews: 14, zoneId: 'zone-c', expectedEquipment: ['bucket_loader_standard', 'dump_truck'] },
  { id: 'concrete-c', title: 'Бетонирование, секция C', contractor: 'ООО ФундаментСтрой', status: 'ask_reason', verdict: 'resources_only', verdictLabel: 'Только ресурсы', planPct: 55, confirmedPct: 30, delayDays: 3, delayHours: 1, detail: 'Техника стоит 4 дня подряд', phase: 'rough', detailCount: 22, criticalDetail: 'Бетоновоз опоздал 1ч 15мин, насос простаивает 4 дня', zoneId: 'zone-b', expectedEquipment: ['mixer', 'crane_manipulator', 'autocran'] },
  { id: 'monolith-c', title: 'Монолит, секция C', contractor: 'ООО ФундаментСтрой', status: 'requires_reaction', verdict: 'nothing_found', verdictLabel: 'Ничего не обнаружено', planPct: 50, confirmedPct: 25, reportedPct: 55, delayDays: 4, delayHours: 2, detail: 'Заявлено 55 %, камера подтверждает 25 %', phase: 'rough', detailCount: 40, criticalDetail: 'Опалубка не доставлена, простой 2ч 40мин', expectedEquipment: ['autocran', 'crane_manipulator'] },
  { id: 'pit-a', title: 'Котлован, зона A', contractor: 'ООО СтройМонтаж', status: 'in_progress', verdict: 'work_seen', verdictLabel: 'Работа идёт', planPct: 40, confirmedPct: 40, delayDays: 0, delayHours: 0, detail: 'Ровный ритм, план и факт совпадают', phase: 'rough', detailCount: 12, receivedCrews: 8, zoneId: 'zone-a', expectedEquipment: ['excavator', 'dump_truck', 'bucket_loader_standard'] },
  { id: 'foundation-b', title: 'Фундамент, зона B', contractor: 'ООО ФундаментСтрой', status: 'in_progress', verdict: 'work_seen', verdictLabel: 'Работа идёт', planPct: 35, confirmedPct: 35, delayDays: 0, delayHours: 0, detail: 'План и факт совпадают', phase: 'rough', detailCount: 18, receivedCrews: 6, expectedEquipment: ['mixer', 'excavator'] },
  { id: 'facade-1', title: 'Фасад и отделка, захватка 1', contractor: 'Не проверяется', status: 'out_of_scope', verdict: 'not_checked', verdictLabel: 'Не проверяется', planPct: 0, confirmedPct: 0, delayDays: 0, delayHours: 0, detail: 'Нет видимых с камеры признаков', phase: 'finishing', detailCount: 180 },
];

const severnyZones: SiteZone[] = [
  { id: 'zone-a', name: 'Зона A — Котлован', cameraId: 'cam-1', cameraImage: './camera-zone-a.webp', x: 5, y: 10, w: 35, h: 40, currentWorkId: 'pit-a' },
  { id: 'zone-b', name: 'Зона B — Бетонирование', cameraId: 'cam-2', cameraImage: './camera-zone-b.webp', x: 45, y: 10, w: 35, h: 45, currentWorkId: 'concrete-c' },
  { id: 'zone-c', name: 'Зона C — Армирование', cameraId: 'cam-3', cameraImage: './camera-zone-c.webp', x: 5, y: 55, w: 35, h: 35, currentWorkId: 'armature-2' },
];

const severnySnapshots: CameraSnapshot[] = [
  { id: 'snap-1', zoneId: 'zone-a', cameraId: 'cam-1', timestamp: '2026-09-28 08:15', image: './camera-zone-a.webp', detections: [
    { x: 15, y: 40, w: 18, h: 22, equipment: 'excavator', confidence: 0.92 },
    { x: 45, y: 55, w: 14, h: 18, equipment: 'dump_truck', confidence: 0.87 },
    { x: 62, y: 58, w: 13, h: 16, equipment: 'dump_truck', confidence: 0.81 },
    { x: 75, y: 20, w: 10, h: 15, equipment: 'autocran', confidence: 0.95 },
  ] },
  { id: 'snap-2', zoneId: 'zone-b', cameraId: 'cam-2', timestamp: '2026-09-28 08:15', image: './camera-zone-b.webp', detections: [
    { x: 20, y: 35, w: 16, h: 20, equipment: 'crane_manipulator', confidence: 0.89 },
    { x: 50, y: 50, w: 15, h: 18, equipment: 'mixer', confidence: 0.85 },
    { x: 72, y: 25, w: 12, h: 16, equipment: 'autocran', confidence: 0.93 },
  ] },
  { id: 'snap-3', zoneId: 'zone-c', cameraId: 'cam-3', timestamp: '2026-09-28 08:15', image: './camera-zone-c.webp', detections: [
    { x: 25, y: 45, w: 15, h: 19, equipment: 'bucket_loader_standard', confidence: 0.84 },
    { x: 55, y: 30, w: 12, h: 15, equipment: 'dump_truck', confidence: 0.76 },
  ] },
];

const severnyObservations: EquipmentObservation[] = [
  { zoneId: 'zone-a', equipment: 'excavator', avgCountPerDay: 1, avgActiveMinutes: 280, presentDays: 5, trend: 'stable' },
  { zoneId: 'zone-a', equipment: 'dump_truck', avgCountPerDay: 2, avgActiveMinutes: 220, presentDays: 5, trend: 'stable' },
  { zoneId: 'zone-a', equipment: 'bucket_loader_standard', avgCountPerDay: 1, avgActiveMinutes: 210, presentDays: 4, trend: 'increasing' },
  { zoneId: 'zone-b', equipment: 'crane_manipulator', avgCountPerDay: 1, avgActiveMinutes: 30, presentDays: 4, trend: 'decreasing' },
  { zoneId: 'zone-b', equipment: 'mixer', avgCountPerDay: 0.3, avgActiveMinutes: 45, presentDays: 1, trend: 'decreasing' },
  { zoneId: 'zone-c', equipment: 'bucket_loader_standard', avgCountPerDay: 0.4, avgActiveMinutes: 60, presentDays: 2, trend: 'decreasing' },
  { zoneId: 'zone-c', equipment: 'dump_truck', avgCountPerDay: 0.2, avgActiveMinutes: 20, presentDays: 1, trend: 'absent' },
];

const severnyDeviations: DeviationAnalysis[] = [
  { zoneId: 'zone-a', zoneName: 'Зона A — Котлован', workId: 'pit-a', workTitle: 'Котлован, зона A', expectedEquipment: ['excavator', 'dump_truck', 'bucket_loader_standard'], observedEquipment: ['excavator', 'dump_truck', 'bucket_loader_standard'], axes: { presence: { verdict: 'normal', expected: 3, observed: 3, note: 'Вся ожидаемая техника на площадке' }, intensity: { verdict: 'normal', expected: 240, observed: 280, note: 'Активность выше порога (280мин vs 240мин)' }, dynamics: { verdict: 'normal', note: 'Стабильное присутствие 5 из 5 дней' } }, overallVerdict: 'normal', overallNote: 'Работа идёт по графику, техника активна' },
  { zoneId: 'zone-b', zoneName: 'Зона B — Бетонирование', workId: 'concrete-c', workTitle: 'Бетонирование, секция C', expectedEquipment: ['mixer', 'crane_manipulator', 'autocran'], observedEquipment: ['crane_manipulator', 'autocran'], axes: { presence: { verdict: 'warning', expected: 3, observed: 2, note: 'Миксер отсутствует 4 из 5 дней' }, intensity: { verdict: 'critical', expected: 180, observed: 30, note: 'Насос простаивает: 30мин/день vs 180мин нормы' }, dynamics: { verdict: 'warning', note: 'Активность падает 4 дня подряд' } }, overallVerdict: 'warning', overallNote: 'Техника есть, но простаивает — поставка бетона не совпадает с окном заливки' },
  { zoneId: 'zone-c', zoneName: 'Зона C — Армирование', workId: 'armature-2', workTitle: 'Армирование, зона 2', expectedEquipment: ['bucket_loader_standard', 'dump_truck'], observedEquipment: ['bucket_loader_standard'], axes: { presence: { verdict: 'critical', expected: 2, observed: 1, note: 'Самосвал не появлялся 4 из 5 дней' }, intensity: { verdict: 'critical', expected: 240, observed: 60, note: 'Погрузчик работает 60мин/день vs 240мин нормы' }, dynamics: { verdict: 'critical', note: 'Состав техники сокращается, арматура не доставляется' } }, overallVerdict: 'critical', overallNote: 'Критическое отставание — техника почти отсутствует, работы не идут' },
];

const severnyRisk: RiskScore = {
  total: 72,
  components: [
    { label: 'Отставание по времени', weight: 35, score: 85, description: '6 дней задержки при 30-дневном графике — 20% сдвига' },
    { label: 'Нехватка техники', weight: 30, score: 70, description: '2 из 3 зон с критическим дефицитом оборудования' },
    { label: 'Длительность задержки', weight: 20, score: 65, description: 'Простой нарастает 4 дня без признаков восстановления' },
    { label: 'Компенсация', weight: 15, score: 40, description: 'Перенаправление 14 человек компенсирует 1 день из 6' },
  ],
  verdict: 'Высокий',
  recommendation: 'Срочно заменить поставщика арматуры. Риск штрафа умеренный, но слабое звено блокирует 2 из 6 работ.',
};

const severnyKpis: ProjectKPIs = {
  schedulePerformanceIndex: 0.6, costPerformanceIndex: 0.85, equipmentUtilization: 0.34, avgDetectionConfidence: 0.88, totalDetections: 9, framesProcessed: 240, matchingAccuracy: 0.91,
};

const severnyReallocations: Reallocation[] = [
  { id: 'r1', fromWorkId: 'armature-2', fromTitle: 'Армирование, зона 2', toWorkId: 'pit-a', toTitle: 'Котлован, зона A', date: '2026-09-25', crewCount: 8, hoursRedirected: 4, compensationDays: 0.5, note: 'Бригада отправлена на Котлован — опережение графика' },
  { id: 'r2', fromWorkId: 'armature-2', fromTitle: 'Армирование, зона 2', toWorkId: 'foundation-b', toTitle: 'Фундамент, зона B', date: '2026-09-28', crewCount: 6, hoursRedirected: 4, compensationDays: 0.5, note: 'Бригада отправлена на Фундамент — ускорение' },
];

const severnyWeakLinks: WeakLink[] = [
  { id: 'wl1', type: 'supplier', name: 'Поставщик арматуры «МеталлСервис»', description: 'Поставка арматуры Ø12 задержана на 3 дня. Машина приезжает на 3+ часа позже графика.', affectedWorkIds: ['armature-2', 'monolith-c'], affectedWorkTitles: ['Армирование, зона 2', 'Монолит, секция C'], delayContributionDays: 5, delayContributionHours: 3 },
  { id: 'wl2', type: 'supplier', name: 'Поставщик бетона «БетонТранс»', description: 'Бетоновозы системно опаздывают на 1–2 часа. Доставка не совпадает с окном заливки.', affectedWorkIds: ['concrete-c'], affectedWorkTitles: ['Бетонирование, секция C'], delayContributionDays: 2, delayContributionHours: 1 },
  { id: 'wl3', type: 'equipment', name: 'Кран-манипулятор (аренда)', description: 'Простаивает 4 дня подряд. Техника на площадке, но без бетона работать не может.', affectedWorkIds: ['concrete-c'], affectedWorkTitles: ['Бетонирование, секция C'], delayContributionDays: 4, delayContributionHours: 0 },
];

const severnyEvents: CalendarEvent[] = [
  { id: 'e1', workId: 'pit-a', title: 'Котлован, зона A', contractor: 'СтройМонтаж', date: '2026-09-24', startHour: 7, endHour: 11, status: 'confirmed' },
  { id: 'e2', workId: 'foundation-b', title: 'Фундамент, зона B', contractor: 'ФундаментСтрой', date: '2026-09-24', startHour: 8, endHour: 12, status: 'confirmed' },
  { id: 'e3', workId: 'armature-2', title: 'Армирование, зона 2', contractor: 'СтройМонтаж', date: '2026-09-24', startHour: 9, endHour: 13, status: 'delayed', delayMinutes: 200, note: 'Арматура не доставлена' },
  { id: 'e4', workId: 'monolith-c', title: 'Монолит, секция C', contractor: 'ФундаментСтрой', date: '2026-09-24', startHour: 14, endHour: 17, status: 'planned' },
  { id: 'e5', workId: 'concrete-c', title: 'Бетонирование, секция C', contractor: 'ФундаментСтрой', date: '2026-09-25', startHour: 7, endHour: 12, status: 'delayed', delayMinutes: 75, note: 'Бетоновоз опоздал 1ч 15мин' },
  { id: 'e6', workId: 'pit-a', title: 'Котлован, зона A', contractor: 'СтройМонтаж', date: '2026-09-25', startHour: 8.5, endHour: 11, status: 'confirmed' },
  { id: 'e7', workId: 'foundation-b', title: 'Фундамент, зона B', contractor: 'ФундаментСтрой', date: '2026-09-25', startHour: 13, endHour: 17, status: 'confirmed' },
  { id: 'e8', workId: 'armature-2', title: 'Армирование → Котлован', contractor: 'СтройМонтаж', date: '2026-09-25', startHour: 14, endHour: 18, status: 'reallocated', note: '8 человек перенаправлены' },
  { id: 'e9', workId: 'armature-2', title: 'Армирование, зона 2', contractor: 'СтройМонтаж', date: '2026-09-26', startHour: 7, endHour: 10, status: 'delayed', delayMinutes: 180, note: 'Нет поставки арматуры' },
  { id: 'e10', workId: 'monolith-c', title: 'Монолит, секция C', contractor: 'ФундаментСтрой', date: '2026-09-26', startHour: 8.5, endHour: 13, status: 'delayed', delayMinutes: 120, note: 'Опалубка не доставлена' },
  { id: 'e11', workId: 'concrete-c', title: 'Бетонирование, секция C', contractor: 'ФундаментСтрой', date: '2026-09-26', startHour: 14, endHour: 17, status: 'idle', note: 'Насос стоит, 2-й день' },
  { id: 'e12', workId: 'pit-a', title: 'Котлован, зона A', contractor: 'СтройМонтаж', date: '2026-09-27', startHour: 7, endHour: 11, status: 'confirmed' },
  { id: 'e13', workId: 'foundation-b', title: 'Фундамент, зона B', contractor: 'ФундаментСтрой', date: '2026-09-27', startHour: 8, endHour: 12, status: 'confirmed' },
  { id: 'e14', workId: 'monolith-c', title: 'Монолит, секция C', contractor: 'ФундаментСтрой', date: '2026-09-27', startHour: 9.5, endHour: 15, status: 'delayed', delayMinutes: 150, note: 'Опалубка не доставлена' },
  { id: 'e15', workId: 'concrete-c', title: 'Бетонирование, секция C', contractor: 'ФундаментСтрой', date: '2026-09-27', startHour: 13, endHour: 17, status: 'idle', note: 'Насос стоит, 3-й день' },
  { id: 'e16', workId: 'pit-a', title: 'Котлован, зона A', contractor: 'СтройМонтаж', date: '2026-09-28', startHour: 7, endHour: 11, status: 'confirmed' },
  { id: 'e17', workId: 'foundation-b', title: 'Фундамент, зона B', contractor: 'ФундаментСтрой', date: '2026-09-28', startHour: 8, endHour: 12, status: 'confirmed' },
  { id: 'e18', workId: 'armature-2', title: 'Армирование → Фундамент', contractor: 'СтройМонтаж', date: '2026-09-28', startHour: 9, endHour: 13, status: 'reallocated', note: '6 человек перенаправлены' },
  { id: 'e19', workId: 'monolith-c', title: 'Монолит, секция C', contractor: 'ФундаментСтрой', date: '2026-09-28', startHour: 10, endHour: 14, status: 'delayed', delayMinutes: 140, note: 'Опалубка не доставлена' },
  { id: 'e20', workId: 'concrete-c', title: 'Бетонирование, секция C', contractor: 'ФундаментСтрой', date: '2026-09-28', startHour: 14, endHour: 17, status: 'idle', note: 'Насос стоит, 4-й день' },
  { id: 'e21', workId: 'facade-1', title: 'Доставка плитки (критичная)', contractor: 'ТД Керамика', date: '2026-09-28', startHour: 11.5, endHour: 12.5, status: 'delayed', delayMinutes: 45, note: 'Опоздание 45мин — монтаж стоит' },
  { id: 'e22', workId: 'pit-a', title: 'Котлован, зона A', contractor: 'ООО СтройМонтаж', date: new Date().toISOString().split('T')[0], startHour: 8, endHour: 12, status: 'confirmed', note: 'Работа по плану' },
];

const severnyMonthSummaries: DaySummary[] = [
  { date: '2026-10-01', totalEvents: 4, delayedEvents: 1, confirmedEvents: 3, hasReallocation: false },
  { date: '2026-10-02', totalEvents: 5, delayedEvents: 2, confirmedEvents: 2, hasReallocation: true },
  { date: '2026-10-03', totalEvents: 4, delayedEvents: 0, confirmedEvents: 4, hasReallocation: false },
  { date: '2026-09-10', totalEvents: 3, delayedEvents: 1, confirmedEvents: 2, hasReallocation: false },
  { date: '2026-09-11', totalEvents: 5, delayedEvents: 2, confirmedEvents: 3, hasReallocation: true },
  { date: '2026-09-14', totalEvents: 4, delayedEvents: 0, confirmedEvents: 4, hasReallocation: false },
  { date: '2026-09-15', totalEvents: 5, delayedEvents: 1, confirmedEvents: 4, hasReallocation: false },
  { date: '2026-09-16', totalEvents: 4, delayedEvents: 1, confirmedEvents: 3, hasReallocation: false },
  { date: '2026-09-17', totalEvents: 3, delayedEvents: 0, confirmedEvents: 3, hasReallocation: false },
  { date: '2026-09-18', totalEvents: 5, delayedEvents: 1, confirmedEvents: 4, hasReallocation: true },
  { date: '2026-09-21', totalEvents: 4, delayedEvents: 2, confirmedEvents: 2, hasReallocation: false },
  { date: '2026-09-22', totalEvents: 5, delayedEvents: 1, confirmedEvents: 3, hasReallocation: false },
  { date: '2026-09-24', totalEvents: 4, delayedEvents: 0, confirmedEvents: 4, hasReallocation: false },
  { date: '2026-09-25', totalEvents: 3, delayedEvents: 0, confirmedEvents: 3, hasReallocation: false },
  { date: '2026-09-26', totalEvents: 4, delayedEvents: 1, confirmedEvents: 3, hasReallocation: false },
  { date: '2026-09-28', totalEvents: 5, delayedEvents: 1, confirmedEvents: 4, hasReallocation: false },
  { date: '2026-09-29', totalEvents: 4, delayedEvents: 0, confirmedEvents: 4, hasReallocation: false },
  { date: '2026-10-01', totalEvents: 3, delayedEvents: 0, confirmedEvents: 3, hasReallocation: false },
];

// ─── Project 2: Торговый центр «Меридиан» — warning ──────────────────────

const meridianSummary: ProjectSummary = {
  objectName: 'ТЦ «Меридиан»',
  dateLabel: dateLabelString(new Date()), schedule: 'Пятидневка', cameras: 2,
  totalWorks: 4, requiresReaction: 0, askReason: 1, inProgress: 2, outOfScope: 1,
  planPct: 48, confirmedPct: 42, gapPct: 6, gapDays: 2,
  totalDelayDays: 2, compensatedDays: 0, netDelayDays: 2,
  penaltyRisk: false, penaltyNote: 'Небольшое отставание, в пределах нормы',
  roughDetailCount: 80, finishingDetailCount: 60, totalDetailCount: 140, totalDelayHours: 2,
};

const meridianWorkItems: WorkItem[] = [
  { id: 'm1', title: 'Каркас, секция 1', contractor: 'ООО МеталлоСтрой', status: 'in_progress', verdict: 'work_seen', verdictLabel: 'Работа идёт', planPct: 45, confirmedPct: 45, delayDays: 0, delayHours: 0, detail: 'План и факт совпадают', phase: 'rough', detailCount: 20, zoneId: 'mz-a', expectedEquipment: ['autocran', 'truck'] },
  { id: 'm2', title: 'Монолит, секция 2', contractor: 'ООО ФундаментСтрой', status: 'ask_reason', verdict: 'resources_only', verdictLabel: 'Только ресурсы', planPct: 50, confirmedPct: 35, delayDays: 2, delayHours: 1, detail: 'Миксер на площадке, но работа не идёт 2 дня', phase: 'rough', detailCount: 30, criticalDetail: 'Миксер опоздал 1ч, заливка отложена', zoneId: 'mz-b', expectedEquipment: ['mixer', 'crane_manipulator'] },
  { id: 'm3', title: 'Земляные работы, зона 3', contractor: 'ООО СтройМонтаж', status: 'in_progress', verdict: 'work_seen', verdictLabel: 'Работа идёт', planPct: 55, confirmedPct: 50, delayDays: 0, delayHours: 0, detail: 'Ровный ритм', phase: 'rough', detailCount: 10, zoneId: 'mz-a', expectedEquipment: ['excavator', 'dump_truck'] },
  { id: 'm4', title: 'Отделка фасада', contractor: 'Не проверяется', status: 'out_of_scope', verdict: 'not_checked', verdictLabel: 'Не проверяется', planPct: 0, confirmedPct: 0, delayDays: 0, delayHours: 0, detail: 'Не видна с камеры', phase: 'finishing', detailCount: 60 },
];

const meridianZones: SiteZone[] = [
  { id: 'mz-a', name: 'Зона 1 — Каркас', cameraId: 'cam-1', cameraImage: './camera-zone-a.webp', x: 10, y: 15, w: 40, h: 40, currentWorkId: 'm1' },
  { id: 'mz-b', name: 'Зона 2 — Монолит', cameraId: 'cam-2', cameraImage: './camera-zone-b.webp', x: 55, y: 15, w: 35, h: 40, currentWorkId: 'm2' },
];

const meridianSnapshots: CameraSnapshot[] = [
  { id: 'ms1', zoneId: 'mz-a', cameraId: 'cam-1', timestamp: '2026-09-28 08:15', image: './camera-zone-a.webp', detections: [
    { x: 25, y: 30, w: 20, h: 25, equipment: 'autocran', confidence: 0.93 },
    { x: 55, y: 45, w: 16, h: 20, equipment: 'truck', confidence: 0.88 },
  ] },
  { id: 'ms2', zoneId: 'mz-b', cameraId: 'cam-2', timestamp: '2026-09-28 08:15', image: './camera-zone-b.webp', detections: [
    { x: 25, y: 40, w: 15, h: 19, equipment: 'mixer', confidence: 0.88 },
  ] },
];

const meridianObservations: EquipmentObservation[] = [
  { zoneId: 'mz-a', equipment: 'autocran', avgCountPerDay: 1, avgActiveMinutes: 320, presentDays: 5, trend: 'stable' },
  { zoneId: 'mz-a', equipment: 'truck', avgCountPerDay: 1, avgActiveMinutes: 150, presentDays: 4, trend: 'stable' },
  { zoneId: 'mz-b', equipment: 'mixer', avgCountPerDay: 0.8, avgActiveMinutes: 90, presentDays: 3, trend: 'decreasing' },
];

const meridianDeviations: DeviationAnalysis[] = [
  { zoneId: 'mz-a', zoneName: 'Зона 1 — Каркас', workId: 'm1', workTitle: 'Каркас, секция 1', expectedEquipment: ['autocran', 'truck'], observedEquipment: ['autocran', 'truck'], axes: { presence: { verdict: 'normal', expected: 2, observed: 2, note: 'Вся техника на площадке' }, intensity: { verdict: 'normal', expected: 240, observed: 320, note: 'Активность выше нормы' }, dynamics: { verdict: 'normal', note: 'Стабильно 5 дней' } }, overallVerdict: 'normal', overallNote: 'Работа идёт по графику' },
  { zoneId: 'mz-b', zoneName: 'Зона 2 — Монолит', workId: 'm2', workTitle: 'Монолит, секция 2', expectedEquipment: ['mixer', 'crane_manipulator'], observedEquipment: ['mixer'], axes: { presence: { verdict: 'warning', expected: 2, observed: 1, note: 'Кран-манипулятор отсутствует' }, intensity: { verdict: 'warning', expected: 180, observed: 90, note: 'Активность 90мин vs 180мин нормы' }, dynamics: { verdict: 'warning', note: 'Активность падает 2 дня' } }, overallVerdict: 'warning', overallNote: 'Миксер есть, но кран-манипулятор не приехал — заливка отложена' },
];

const meridianRisk: RiskScore = {
  total: 35,
  components: [
    { label: 'Отставание по времени', weight: 35, score: 30, description: '2 дня задержки — в пределах нормы' },
    { label: 'Нехватка техники', weight: 30, score: 40, description: '1 из 2 зон с отклонением' },
    { label: 'Длительность задержки', weight: 20, score: 25, description: 'Задержка 2 дня, не нарастает' },
    { label: 'Компенсация', weight: 15, score: 50, description: 'Перераспределения не требуется' },
  ],
  verdict: 'Средний',
  recommendation: 'Контролировать поставку крана-манипулятора. Риск низкий, но может вырасти при задержке >3 дней.',
};

const meridianKpis: ProjectKPIs = {
  schedulePerformanceIndex: 0.88, costPerformanceIndex: 0.92, equipmentUtilization: 0.61, avgDetectionConfidence: 0.86, totalDetections: 3, framesProcessed: 160, matchingAccuracy: 0.89,
};

const meridianReallocations: Reallocation[] = [];

const meridianWeakLinks: WeakLink[] = [
  { id: 'mwl1', type: 'equipment', name: 'Кран-манипулятор (заказ)', description: 'Не доставлен на площадку. Заливка монолита отложена на 2 дня.', affectedWorkIds: ['m2'], affectedWorkTitles: ['Монолит, секция 2'], delayContributionDays: 2, delayContributionHours: 1 },
];

const meridianEvents: CalendarEvent[] = [
  { id: 'me1', workId: 'm1', title: 'Каркас, секция 1', contractor: 'МеталлоСтрой', date: '2026-09-28', startHour: 8, endHour: 12, status: 'confirmed' },
  { id: 'me2', workId: 'm3', title: 'Земляные работы', contractor: 'СтройМонтаж', date: '2026-09-28', startHour: 7, endHour: 11, status: 'confirmed' },
  { id: 'me3', workId: 'm2', title: 'Монолит, секция 2', contractor: 'ФундаментСтрой', date: '2026-09-28', startHour: 13, endHour: 17, status: 'delayed', delayMinutes: 60, note: 'Кран не доставлен' },
];

const meridianMonthSummaries: DaySummary[] = [
  { date: '2026-10-01', totalEvents: 3, delayedEvents: 0, confirmedEvents: 3, hasReallocation: false },
  { date: '2026-10-02', totalEvents: 3, delayedEvents: 1, confirmedEvents: 2, hasReallocation: false },
  { date: '2026-10-03', totalEvents: 4, delayedEvents: 0, confirmedEvents: 4, hasReallocation: false },
  { date: '2026-09-10', totalEvents: 3, delayedEvents: 1, confirmedEvents: 2, hasReallocation: false },
  { date: '2026-09-11', totalEvents: 3, delayedEvents: 0, confirmedEvents: 3, hasReallocation: false },
];

// ─── Project 3: Школа №147 — normal (no problems) ────────────────────────

const schoolSummary: ProjectSummary = {
  objectName: 'Школа №147',
  dateLabel: dateLabelString(new Date()), schedule: 'Пятидневка', cameras: 2,
  totalWorks: 3, requiresReaction: 0, askReason: 0, inProgress: 3, outOfScope: 0,
  planPct: 60, confirmedPct: 60, gapPct: 0, gapDays: 0,
  totalDelayDays: 0, compensatedDays: 0, netDelayDays: 0,
  penaltyRisk: false, penaltyNote: 'Без отклонений',
  roughDetailCount: 50, finishingDetailCount: 30, totalDetailCount: 80, totalDelayHours: 0,
};

const schoolWorkItems: WorkItem[] = [
  { id: 's1', title: 'Отделка, 1 этаж', contractor: 'ООО ФинишСтрой', status: 'in_progress', verdict: 'work_seen', verdictLabel: 'Работа идёт', planPct: 65, confirmedPct: 65, delayDays: 0, delayHours: 0, detail: 'План и факт совпадают', phase: 'finishing', detailCount: 25, zoneId: 'sz-a', expectedEquipment: ['gazelle', 'truck'] },
  { id: 's2', title: 'Отделка, 2 этаж', contractor: 'ООО ФинишСтрой', status: 'in_progress', verdict: 'work_seen', verdictLabel: 'Работа идёт', planPct: 55, confirmedPct: 55, delayDays: 0, delayHours: 0, detail: 'Ровный ритм', phase: 'finishing', detailCount: 20, zoneId: 'sz-b', expectedEquipment: ['gazelle'] },
  { id: 's3', title: 'Благоустройство', contractor: 'ООО СтройМонтаж', status: 'in_progress', verdict: 'work_seen', verdictLabel: 'Работа идёт', planPct: 70, confirmedPct: 70, delayDays: 0, delayHours: 0, detail: 'Опережение графика', phase: 'rough', detailCount: 10, zoneId: 'sz-a', expectedEquipment: ['excavator', 'dump_truck'] },
];

const schoolZones: SiteZone[] = [
  { id: 'sz-a', name: 'Зона 1 — Благоустройство', cameraId: 'cam-1', cameraImage: './camera-zone-c.webp', x: 10, y: 15, w: 40, h: 40, currentWorkId: 's3' },
  { id: 'sz-b', name: 'Зона 2 — Отделка', cameraId: 'cam-2', cameraImage: './camera-zone-b.webp', x: 55, y: 15, w: 35, h: 40, currentWorkId: 's2' },
];

const schoolSnapshots: CameraSnapshot[] = [
  { id: 'ss1', zoneId: 'sz-a', cameraId: 'cam-1', timestamp: '2026-09-28 08:15', image: './camera-zone-c.webp', detections: [
    { x: 30, y: 35, w: 18, h: 22, equipment: 'excavator', confidence: 0.90 },
    { x: 60, y: 50, w: 14, h: 18, equipment: 'dump_truck', confidence: 0.84 },
  ] },
  { id: 'ss2', zoneId: 'sz-b', cameraId: 'cam-2', timestamp: '2026-09-28 08:15', image: './camera-zone-b.webp', detections: [
    { x: 30, y: 35, w: 15, h: 20, equipment: 'gazelle', confidence: 0.87 },
  ] },
];

const schoolObservations: EquipmentObservation[] = [
  { zoneId: 'sz-a', equipment: 'excavator', avgCountPerDay: 1, avgActiveMinutes: 300, presentDays: 5, trend: 'stable' },
  { zoneId: 'sz-a', equipment: 'gazelle', avgCountPerDay: 1, avgActiveMinutes: 180, presentDays: 5, trend: 'stable' },
  { zoneId: 'sz-b', equipment: 'gazelle', avgCountPerDay: 1, avgActiveMinutes: 220, presentDays: 5, trend: 'stable' },
];

const schoolDeviations: DeviationAnalysis[] = [
  { zoneId: 'sz-a', zoneName: 'Зона 1 — Благоустройство', workId: 's3', workTitle: 'Благоустройство', expectedEquipment: ['excavator', 'dump_truck'], observedEquipment: ['excavator', 'gazelle'], axes: { presence: { verdict: 'normal', expected: 2, observed: 2, note: 'Техника на площадке' }, intensity: { verdict: 'normal', expected: 200, observed: 300, note: 'Выше нормы' }, dynamics: { verdict: 'normal', note: 'Стабильно 5 дней' } }, overallVerdict: 'normal', overallNote: 'Работа идёт с опережением' },
  { zoneId: 'sz-b', zoneName: 'Зона 2 — Отделка', workId: 's2', workTitle: 'Отделка, 2 этаж', expectedEquipment: ['gazelle'], observedEquipment: ['gazelle'], axes: { presence: { verdict: 'normal', expected: 1, observed: 1, note: 'Газель на площадке' }, intensity: { verdict: 'normal', expected: 120, observed: 220, note: 'Выше нормы' }, dynamics: { verdict: 'normal', note: 'Стабильно' } }, overallVerdict: 'normal', overallNote: 'Работа идёт по графику' },
];

const schoolRisk: RiskScore = {
  total: 8,
  components: [
    { label: 'Отставание по времени', weight: 35, score: 5, description: 'Без задержек' },
    { label: 'Нехватка техники', weight: 30, score: 5, description: 'Все зоны в норме' },
    { label: 'Длительность задержки', weight: 20, score: 0, description: 'Нет задержек' },
    { label: 'Компенсация', weight: 15, score: 20, description: 'Не требуется' },
  ],
  verdict: 'Низкий',
  recommendation: 'Объект в норме. Дополнительных действий не требуется.',
};

const schoolKpis: ProjectKPIs = {
  schedulePerformanceIndex: 1.0, costPerformanceIndex: 0.95, equipmentUtilization: 0.78, avgDetectionConfidence: 0.89, totalDetections: 3, framesProcessed: 160, matchingAccuracy: 0.93,
};

const schoolReallocations: Reallocation[] = [];
const schoolWeakLinks: WeakLink[] = [];

const schoolEvents: CalendarEvent[] = [
  { id: 'se1', workId: 's1', title: 'Отделка, 1 этаж', contractor: 'ФинишСтрой', date: '2026-09-28', startHour: 8, endHour: 14, status: 'confirmed' },
  { id: 'se2', workId: 's2', title: 'Отделка, 2 этаж', contractor: 'ФинишСтрой', date: '2026-09-28', startHour: 9, endHour: 13, status: 'confirmed' },
  { id: 'se3', workId: 's3', title: 'Благоустройство', contractor: 'СтройМонтаж', date: '2026-09-28', startHour: 7, endHour: 12, status: 'confirmed' },
];

const schoolMonthSummaries: DaySummary[] = [
  { date: '2026-10-01', totalEvents: 3, delayedEvents: 0, confirmedEvents: 3, hasReallocation: false },
  { date: '2026-10-02', totalEvents: 3, delayedEvents: 0, confirmedEvents: 3, hasReallocation: false },
  { date: '2026-10-03', totalEvents: 4, delayedEvents: 0, confirmedEvents: 4, hasReallocation: false },
  { date: '2026-09-10', totalEvents: 3, delayedEvents: 0, confirmedEvents: 3, hasReallocation: false },
  { date: '2026-09-11', totalEvents: 3, delayedEvents: 0, confirmedEvents: 3, hasReallocation: false },
];

// ─── All projects ─────────────────────────────────────────────────────────

export const PROJECTS: Project[] = [
  {
    id: 'severny',
    name: 'ЖК «Северный», корпус 2',
    address: 'ул. Северная, 15',
    status: 'critical',
    problemScore: 72,
    contact: { name: 'Иванов Сергей Петрович', phone: '+7 (916) 555-32-18', email: 's.ivanov@stroyservice.ru' },
    summary: severnySummary,
    workItems: severnyWorkItems,
    siteZones: severnyZones,
    cameraSnapshots: severnySnapshots,
    equipmentObservations: severnyObservations,
    deviationAnalyses: severnyDeviations,
    riskScore: severnyRisk,
    kpis: severnyKpis,
    reallocations: severnyReallocations,
    weakLinks: severnyWeakLinks,
    calendarEvents: severnyEvents,
    monthSummaries: severnyMonthSummaries,
    todayDate: localDateString(new Date()),
    weekDates: currentWeekDates(),
  },
  {
    id: 'meridian',
    name: 'ТЦ «Меридиан»',
    address: 'пр. Ленина, 42',
    status: 'warning',
    problemScore: 35,
    contact: { name: 'Петрова Анна Михайловна', phone: '+7 (903) 444-87-02', email: 'a.petrova@meridian-dev.ru' },
    summary: meridianSummary,
    workItems: meridianWorkItems,
    siteZones: meridianZones,
    cameraSnapshots: meridianSnapshots,
    equipmentObservations: meridianObservations,
    deviationAnalyses: meridianDeviations,
    riskScore: meridianRisk,
    kpis: meridianKpis,
    reallocations: meridianReallocations,
    weakLinks: meridianWeakLinks,
    calendarEvents: meridianEvents,
    monthSummaries: meridianMonthSummaries,
    todayDate: localDateString(new Date()),
    weekDates: currentWeekDates(),
  },
  {
    id: 'school147',
    name: 'Школа №147',
    address: 'ул. Школьная, 8',
    status: 'normal',
    problemScore: 8,
    contact: { name: 'Сидоров Дмитрий Алексеевич', phone: '+7 (925) 333-19-55', email: 'd.sidorov@gorstroi.ru' },
    summary: schoolSummary,
    workItems: schoolWorkItems,
    siteZones: schoolZones,
    cameraSnapshots: schoolSnapshots,
    equipmentObservations: schoolObservations,
    deviationAnalyses: schoolDeviations,
    riskScore: schoolRisk,
    kpis: schoolKpis,
    reallocations: schoolReallocations,
    weakLinks: schoolWeakLinks,
    calendarEvents: schoolEvents,
    monthSummaries: schoolMonthSummaries,
    todayDate: localDateString(new Date()),
    weekDates: currentWeekDates(),
  },
];
