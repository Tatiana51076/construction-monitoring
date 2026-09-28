// ─── Живые данные с сервера (переключатель демо ↔ API) ─────────────────────

import type { WorkItem } from '@/projects';
import {
  loadExpectedEquipment,
  loadPhotoStatuses,
  computeVerdict,
  resolveWorkId,
  statusToLabel,
} from './expected_equipment';

const API_BASE = ''; // пустой → относительные пути (работает через прокси Vite)

// Сервер — источник истины. Если сервер ещё не посчитал (unsure) — считаем сами как запасной путь.
export async function loadLiveWorks(
  demoWorks: WorkItem[],
  baseUrl?: string
): Promise<WorkItem[]> {
  try {
    const photos = await loadPhotoStatuses(baseUrl ?? API_BASE);
    const rules = await loadExpectedEquipment();

    return demoWorks.map(work => {
      const photo = photos.find(p => resolveWorkId(p.brigade || '', rules) === work.id);
      if (!photo) return work; // нет фото для этой работы → оставляем демо

      let status = photo.status;
      let found = photo.found || [];
      if (status === 'unsure' && rules) {
        const v = computeVerdict(photo.brigade || '', photo.detections, rules);
        status = v.status;
        found = v.found;
      }

      const newVerdict = status === 'confirmed' ? 'work_seen'
        : status === 'not_confirmed' ? 'nothing_found'
        : status === 'review' ? 'resources_only'
        : 'not_checked';

      return {
        ...work,
        verdict: newVerdict as any,
        verdictLabel: statusToLabel(status),
        confirmedPct: status === 'confirmed' ? work.planPct : 0,
        status: status === 'confirmed' ? 'in_progress'
          : status === 'review' ? 'ask_reason'
          : 'requires_reaction',
        detail: status === 'confirmed'
          ? `Фото получено, найден ${found[0] || 'объект'}, выполнено`
          : status === 'not_confirmed'
          ? `Техника не совпадает с планом (ожидалось: ${work.expectedEquipment?.join(', ') || 'нет данных'})`
          : status === 'review'
          ? 'Требуется переснять фото'
          : 'Фото получено, но данных недостаточно для вердикта',
        photoUrl: photo.file,
        photoStatus: status,
      };
    });
  } catch (err) {
    console.warn('Live data failed, using demo:', err);
    return demoWorks;
  }
}
