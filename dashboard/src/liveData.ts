// ─── Живые данные с сервера (переключатель демо ↔ API) ─────────────────────

import type { WorkItem } from '@/projects';
import {
  loadExpectedEquipment,
  loadPhotoStatuses,
  computeVerdict,
  resolveWorkId,
  statusToLabel,
  type PhotoStatus,
} from './expected_equipment';

const API_BASE = ''; // пустой → относительные пути (работает через прокси Vite)

// Сервер — источник истины. Вердикт работы считаем по БОЛЬШИНСТВУ фото этой работы.
export async function loadLiveWorks(
  demoWorks: WorkItem[],
  baseUrl?: string
): Promise<WorkItem[]> {
  try {
    const photos = await loadPhotoStatuses(baseUrl ?? API_BASE);
    const rules = await loadExpectedEquipment();

    return demoWorks.map(work => {
      // Сопоставляем фото с работой: проверяем и brigade, и work (из мобильного приложения)
      const workPhotos = photos.filter(p => {
        const hint = p.work || p.brigade || '';
        return resolveWorkId(hint, rules) === work.id;
      });
      if (workPhotos.length === 0) {
        // сервер жив, но фото по этой работе нет → честно «не проверяется»
        return {
          ...work,
          verdict: 'not_checked',
          verdictLabel: 'Не проверяется',
          status: 'out_of_scope',
          confirmedPct: 0,
          detail: 'Нет фото с площадки — не проверяется',
          photoUrl: undefined,
          photoStatus: undefined,
          timestamp: undefined,
        };
      }

      // Подсчёт статусов по всем фото работы
      const counts: Record<'confirmed' | 'not_confirmed' | 'review', number> = {
        confirmed: 0, not_confirmed: 0, review: 0,
      };
      workPhotos.forEach(p => {
        let st = p.status;
        if (st === 'unsure' && rules) {
          const hint = p.work || p.brigade || '';
          st = computeVerdict(hint, p.detections, rules).status;
        }
        if (st === 'confirmed' || st === 'not_confirmed' || st === 'review') {
          counts[st] += 1;
        }
      });

      // Большинство; при равенстве приоритет: confirmed > not_confirmed > review
      let status: 'confirmed' | 'not_confirmed' | 'review' = 'review';
      let best = -1;
      for (const s of ['confirmed', 'not_confirmed', 'review'] as const) {
        if (counts[s] > best) { status = s; best = counts[s]; }
      }

      const photo = workPhotos.find(p => p.status === 'confirmed') || workPhotos[0];
      const found = photo.found || [];
      const total = workPhotos.length;

      const newVerdict = status === 'confirmed' ? 'work_seen'
        : status === 'not_confirmed' ? 'nothing_found'
        : 'resources_only';

      return {
        ...work,
        verdict: newVerdict as any,
        verdictLabel: statusToLabel(status),
        confirmedPct: status === 'confirmed' ? work.planPct : 0,
        status: status === 'confirmed' ? 'in_progress'
          : status === 'review' ? 'ask_reason'
          : 'requires_reaction',
        detail: status === 'confirmed'
          ? `Подтверждено ${counts.confirmed} из ${total} фото · найден ${found[0] || 'объект'}`
          : status === 'not_confirmed'
          ? `Техника не совпадает с планом (${counts.not_confirmed} из ${total} фото)`
          : `Требуется переснять (${counts.review} из ${total} фото)`,
        photoUrl: photo.file,
        photoStatus: status,
        timestamp: photo.timestamp || '',
      };
    });
  } catch (err) {
    console.warn('Live data failed:', err);
    // Возвращаем работы с статусом "не проверяется" вместо демо
    return demoWorks.map(work => ({
      ...work,
      verdict: 'not_checked' as const,
      verdictLabel: 'Не проверяется',
      status: 'out_of_scope' as const,
      confirmedPct: 0,
      detail: 'Сервер недоступен — живые данные не загружены',
      photoUrl: undefined,
      photoStatus: undefined,
    }));
  }
}
