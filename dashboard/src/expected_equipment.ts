// ─── ЕДИНЫЙ источник: ожидаемая техника (импорт из JSON) ──────────────────

export interface EquipmentClass {
  id: number;
  slug: string;
  ru: string;
  en: string;
}

export interface WorkRequired {
  workId: string;
  required: Record<string, number>; // { class_slug: min_count }
}

export interface ExpectedEquipmentData {
  version: string;
  note: string;
  classes: EquipmentClass[];
  works: Record<string, WorkRequired>;
  synonyms: Record<string, string>;
  work_slugs: Record<string, string>;
  verdict: {
    min_confidence: number;
    confirmed: string;
    not_confirmed: string;
    review: string;
    unsure: string;
  };
}

export interface DetectionItem {
  class: string;
  confidence: number;
}

export interface PhotoStatus {
  file: string;            // URL фото (image_url)
  brigade?: string;        // work-подсказка (название работы / slug / t-slug)
  work?: string;           // название работы от сервера
  zone?: string;           // зона
  timestamp?: string;      // время съёмки (taken_at) или загрузки
  status: 'confirmed' | 'not_confirmed' | 'review' | 'unsure';
  found?: string[];
  confidence?: number;
  detections?: DetectionItem[];
}

// Загрузка таблицы (из того же каталога, где лежит этот файл)
export async function loadExpectedEquipment(): Promise<ExpectedEquipmentData> {
  const resp = await fetch(new URL('./expected_equipment.json', import.meta.url));
  if (!resp.ok) throw new Error(`Failed to load expected_equipment.json: ${resp.status}`);
  return resp.json();
}

// Преобразование статуса сервера в понятный текст
export function statusToLabel(status: PhotoStatus['status']): string {
  switch (status) {
    case 'confirmed': return 'Выполнено';
    case 'not_confirmed': return 'Не обнаружено';
    case 'review': return 'Переснять';
    case 'unsure': return 'Не проверяется';
    default: return status;
  }
}

// Преобразование статуса в цвет (под существующую легенду)
export function statusToColor(status: PhotoStatus['status']): string {
  switch (status) {
    case 'confirmed': return 'text-success-300';
    case 'not_confirmed': return 'text-danger-300';
    case 'review': return 'text-warning-300';
    case 'unsure': return 'text-content-tertiary';
    default: return 'text-content-tertiary';
  }
}

// Загрузка статусов с сервера. Реальный формат Георгия:
//   { total, photos: [{ image_url, brigade, detections, works_status:[{status,found}] }] }
export async function loadPhotoStatuses(baseUrl = ''): Promise<PhotoStatus[]> {
  const resp = await fetch(`${baseUrl}/photos`);
  if (!resp.ok) return [];
  const data = await resp.json();
  const list: any[] = Array.isArray(data) ? data : (data.photos || []);
  return list.map((p: any) => ({
    file: p.image_url || p.file || '',
    brigade: p.brigade || p.work || '', // приоритет brigade, fallback на work
    work: p.work || '',
    zone: p.zone || '',
    timestamp: p.taken_at || p.timestamp || '',
    status: (p.works_status?.[0]?.status || p.status || 'unsure') as PhotoStatus['status'],
    found: p.works_status?.[0]?.found || p.found || [],
    confidence: p.detections?.[0]?.confidence,
    detections: (p.detections || []).map((d: any) => ({ class: d.class || '', confidence: d.confidence || 0, bbox: d.bbox || [] })),
  }));
}

// Определяем работу по "подсказке" (work/brigade): русское имя, slug или t-<slug>
export function resolveWork(
  hint: string,
  rules: ExpectedEquipmentData
): { workName: string; workId: string } | null {
  const h = (hint || '').trim();
  if (!h) return null;
  // 1) русское название работы напрямую («Бетонирование»)
  if (rules.works[h]) return { workName: h, workId: rules.works[h].workId };
  // 2) slug: «t-concrete», «t-concrete-0922» или голый «concrete»
  let slug: string | null = null;
  const m = h.match(/t-([a-z]+)/i);
  if (m) slug = m[1].toLowerCase();
  else if (/^[a-z]+$/.test(h)) slug = h.toLowerCase();
  if (slug) {
    const workName = rules.work_slugs?.[slug];
    if (workName && rules.works[workName]) return { workName, workId: rules.works[workName].workId };
  }
  return null;
}

export function resolveWorkId(hint: string, rules: ExpectedEquipmentData): string | null {
  return resolveWork(hint, rules)?.workId ?? null;
}

// Класс из YOLO (Excavator / excavator / Экскаватор) → slug модели
export function resolveClassSlug(name: string, rules: ExpectedEquipmentData): string {
  const n = (name || '').trim().toLowerCase();
  for (const c of rules.classes) {
    if (n === c.slug.toLowerCase() || n === (c.en || '').toLowerCase() || n === (c.ru || '').toLowerCase()) {
      return c.slug;
    }
  }
  for (const c of rules.classes) {
    const en = (c.en || '').toLowerCase();
    if (en && (en.includes(n) || n.includes(en))) return c.slug;
  }
  return n;
}

// Считаем вердикт НА СТОРОНЕ ДАШБОРДА (не доверяем статусу сервера)
export function computeVerdict(
  brigade: string,
  detections: DetectionItem[] | undefined,
  rules: ExpectedEquipmentData
): { workId: string | null; workName: string | null; status: PhotoStatus['status']; found: string[] } {
  const rw = resolveWork(brigade, rules);
  if (!rw) return { workId: null, workName: null, status: 'unsure', found: [] };
  const { workId, workName } = rw;
  const required = rules.works[workName].required;
  const minConf = rules.verdict?.min_confidence ?? 0.5;

  const dets = detections || [];
  const found: string[] = [];
  for (const d of dets) {
    if ((d.confidence || 0) >= minConf) found.push(resolveClassSlug(d.class, rules));
  }

  let status: PhotoStatus['status'];
  if (dets.length === 0) status = 'review';
  else if (found.some(cls => required[cls] !== undefined)) status = 'confirmed';
  else status = 'not_confirmed';

  return { workId, workName, status, found };
}

// Сопоставление работы из плана со статусом из /photos
export function matchWorkToStatus(
  workId: string,
  photos: PhotoStatus[],
  rules: ExpectedEquipmentData
): PhotoStatus | undefined {
  return photos.find(p => resolveWorkId(p.brigade || '', rules) === workId);
}
