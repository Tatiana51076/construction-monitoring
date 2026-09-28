import { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
} from 'lucide-react';
import {
  loadPhotoStatuses,
  loadExpectedEquipment,
  computeVerdict,
  resolveWork,
  type PhotoStatus,
} from '@/expected_equipment';

type HealthState = 'idle' | 'ok' | 'error';

function statusChip(s: PhotoStatus['status']): { label: string; cls: string } {
  switch (s) {
    case 'confirmed': return { label: 'Выполнено', cls: 'bg-success-500/15 text-success-300 border-success-500/30' };
    case 'not_confirmed': return { label: 'Не обнаружено', cls: 'bg-danger-500/15 text-danger-300 border-danger-500/30' };
    case 'review': return { label: 'Переснять', cls: 'bg-warning-500/15 text-warning-300 border-warning-500/30' };
    case 'unsure': return { label: 'Не проверяется', cls: 'bg-content-tertiary/15 text-content-tertiary border-surface-border' };
    default: return { label: s, cls: 'bg-content-tertiary/15 text-content-tertiary' };
  }
}

export function LiveDataStatus() {
  const [health, setHealth] = useState<HealthState>('idle');
  const [photos, setPhotos] = useState<PhotoStatus[] | null>(null);
  const [photosError, setPhotosError] = useState(false);
  const [rules, setRules] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    setLoading(true);
    setHealth('idle');
    try {
      const r = await fetch('/health');
      setHealth(r.ok ? 'ok' : 'error');
    } catch {
      setHealth('error');
    }

    setPhotosError(false);
    try {
      setPhotos(await loadPhotoStatuses(''));
    } catch {
      setPhotosError(true);
      setPhotos(null);
    }

    try {
      setRules(await loadExpectedEquipment());
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  useEffect(() => {
    check();
  }, []);

  const live = !photosError && photos !== null;
  const counts: Record<PhotoStatus['status'], number> = {
    confirmed: 0, not_confirmed: 0, review: 0, unsure: 0,
  };
  photos?.forEach((p) => {
    let s = p.status;
    if (s === 'unsure' && rules) s = computeVerdict(p.brigade || '', p.detections, rules).status;
    counts[s] += 1;
  });

  // Уникальные наряды (по work/brigade) + вердикт
  const slugs = new Map<string, { workName: string; workId: string; count: number; status: PhotoStatus['status'] }>();
  photos?.forEach((p) => {
    const rw = rules ? resolveWork(p.brigade || '', rules) : null;
    if (!rw) return;
    let st = p.status;
    if (st === 'unsure' && rules) st = computeVerdict(p.brigade || '', p.detections, rules).status;
    const existing = slugs.get(rw.workId);
    if (existing) {
      existing.count += 1;
    } else {
      slugs.set(rw.workId, { workName: rw.workName, workId: rw.workId, count: 1, status: st });
    }
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent-400" />
          <h3 className="font-display text-sm font-semibold text-content-primary">
            Живые данные · диагностика
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-success-500/30 bg-success-500/10 px-2 py-0.5 text-[10px] font-bold text-success-300">
              <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
              ЖИВЫЕ ДАННЫЕ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-warning-500/30 bg-warning-500/10 px-2 py-0.5 text-[10px] font-bold text-warning-300">
              <span className="h-1.5 w-1.5 rounded-full bg-warning-400" />
              ДЕМО-РЕЖИМ
            </span>
          )}
          <button
            onClick={check}
            className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-tertiary/50 px-2 py-1 text-[10px] font-semibold text-content-secondary transition hover:bg-surface-tertiary"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-accent-400' : ''}`} />
            Проверить
          </button>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        {/* API health */}
        <div className="flex items-center gap-2">
          {health === 'ok' ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-success-400" />
          ) : health === 'error' ? (
            <XCircle className="h-3.5 w-3.5 text-danger-400" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent-400" />
          )}
          <span className="text-[11px] text-content-secondary">
            API <span className="font-mono">/health</span>
          </span>
          <span className={`font-mono text-[11px] font-bold ${health === 'ok' ? 'text-success-400' : health === 'error' ? 'text-danger-400' : 'text-content-muted'}`}>
            {health === 'ok' ? '{"status":"ok"}' : health === 'error' ? 'недоступен' : '…'}
          </span>
        </div>

        {/* Photos */}
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-content-muted" />
          <span className="text-[11px] text-content-secondary">
            Фото <span className="font-mono">/photos</span>
          </span>
          <span className="font-mono text-[11px] font-bold text-content-primary">
            {photos === null ? (photosError ? 'ошибка' : '…') : `${photos.length} шт`}
          </span>
          {photos && photos.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(['confirmed', 'not_confirmed', 'review', 'unsure'] as const).map((s) => {
                if (!counts[s]) return null;
                const c = statusChip(s);
                return (
                  <span key={s} className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${c.cls}`}>
                    {c.label}: {counts[s]}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Work matching */}
        {slugs.size > 0 && (
          <div className="rounded-lg border border-surface-border bg-surface-primary p-2.5">
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-content-tertiary">
              Сопоставление нарядов · вердикт от сервера
            </div>
            <div className="space-y-1">
              {Array.from(slugs.entries()).map(([workId, info]) => (
                <div key={workId} className="flex items-center gap-2 text-[11px]">
                  <span className="text-content-primary">{info.workName}</span>
                  <span className="font-mono text-[10px] text-content-muted">({workId})</span>
                  <CheckCircle2 className="h-3 w-3 text-success-400" />
                  <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${statusChip(info.status).cls}`}>
                    {statusChip(info.status).label}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-content-muted">×{info.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
