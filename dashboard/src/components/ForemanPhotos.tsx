import { useEffect, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import {
  loadPhotoStatuses,
  loadExpectedEquipment,
  resolveWork,
  statusToLabel,
  type PhotoStatus,
  type ExpectedEquipmentData,
} from '@/expected_equipment';

function chip(status: PhotoStatus['status']): { label: string; cls: string } {
  switch (status) {
    case 'confirmed': return { label: statusToLabel(status), cls: 'bg-success-500/15 text-success-300 border-success-500/30' };
    case 'not_confirmed': return { label: statusToLabel(status), cls: 'bg-danger-500/15 text-danger-300 border-danger-500/30' };
    case 'review': return { label: statusToLabel(status), cls: 'bg-warning-500/15 text-warning-300 border-warning-500/30' };
    default: return { label: statusToLabel(status), cls: 'bg-content-tertiary/15 text-content-tertiary border-surface-border' };
  }
}

export function ForemanPhotos() {
  const [photos, setPhotos] = useState<PhotoStatus[] | null>(null);
  const [rules, setRules] = useState<ExpectedEquipmentData | null>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    setLoading(true);
    try {
      setPhotos(await loadPhotoStatuses(''));
      setRules(await loadExpectedEquipment());
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  useEffect(() => {
    check();
  }, []);

  const workPhotos = (photos || []).filter((p) => p.work || (rules ? resolveWork(p.brigade || '', rules) : null));

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-accent-400" />
          <h2 className="font-display text-base font-semibold text-content-primary">Фото прораба (живые данные)</h2>
        </div>
        <button
          onClick={check}
          className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-tertiary/50 px-2 py-1 text-[10px] font-semibold text-content-secondary transition hover:bg-surface-tertiary"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-accent-400' : ''}`} />
          Обновить
        </button>
      </div>

      {photos === null ? (
        <div className="p-4 text-xs text-content-tertiary">Загрузка…</div>
      ) : workPhotos.length === 0 ? (
        <div className="p-4 text-xs text-content-tertiary">Фото прораба пока нет.</div>
      ) : (
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {workPhotos.map((p, i) => {
            const rw = rules ? resolveWork(p.brigade || '', rules) : null;
            const c = chip(p.status);
            return (
              <div key={i} className="overflow-hidden rounded-xl border border-surface-border bg-surface-primary">
                <img src={p.file} alt="" className="h-40 w-full object-cover" loading="lazy" />
                <div className="space-y-1 p-3">
                  <div className="text-sm font-semibold text-content-primary">{rw?.workName || p.work || '—'}</div>
                  {p.zone && <div className="text-[11px] text-content-tertiary">{p.zone}</div>}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${c.cls}`}>{c.label}</span>
                    {p.found && p.found.length > 0 && (
                      <span className="text-[10px] text-content-muted">найдено: {p.found.join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
