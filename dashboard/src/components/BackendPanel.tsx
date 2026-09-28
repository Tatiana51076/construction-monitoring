import { Database, Server, FileJson, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { EQUIPMENT_CLASS_COUNTS, BACKEND_API } from '@/data';

function ClassCountRow({ entry }: { entry: { id: number; label: string; enLabel: string; count: number } }) {
  const maxCount = Math.max(...EQUIPMENT_CLASS_COUNTS.map((e) => e.count), 1);
  const barWidth = (entry.count / maxCount) * 100;
  const isZero = entry.count === 0;

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-6 shrink-0 text-right font-mono text-[10px] text-content-muted">{entry.id}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[11px] font-medium text-content-primary">
            {entry.label}
            <span className="ml-1 text-[9px] text-content-muted">{entry.enLabel}</span>
          </span>
          <span className={`shrink-0 font-mono text-[10px] font-bold ${isZero ? 'text-danger-400' : 'text-content-secondary'}`}>
            {entry.count.toLocaleString('ru-RU')}
          </span>
        </div>
        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-surface-tertiary">
          <div
            className={`h-full rounded-full ${isZero ? 'bg-danger-500/50' : 'bg-gradient-to-r from-accent-500 to-accent-400'}`}
            style={{ width: `${Math.max(barWidth, 0.5)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function DatasetClassCounts() {
  const [showAll, setShowAll] = useState(false);
  const totalImages = EQUIPMENT_CLASS_COUNTS.reduce((s, e) => s + e.count, 0);
  const visible = showAll ? EQUIPMENT_CLASS_COUNTS : EQUIPMENT_CLASS_COUNTS.slice(0, 9);

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary">
      <div className="border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-accent-400" />
          <h3 className="font-display text-sm font-semibold text-content-primary">
            Class counts in dataset (train labels)
          </h3>
        </div>
        <p className="mt-1 text-xs text-content-tertiary">
          {EQUIPMENT_CLASS_COUNTS.length} классов · {totalImages.toLocaleString('ru-RU')} меток всего
        </p>
      </div>

      <div className="px-4 py-3">
        {visible.map((e) => (
          <ClassCountRow key={e.id} entry={e} />
        ))}

        {EQUIPMENT_CLASS_COUNTS.length > 9 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-2 w-full rounded-lg border border-surface-border bg-surface-tertiary/50 py-1.5 text-xs font-semibold text-accent-400 transition hover:bg-surface-tertiary"
          >
            {showAll ? 'Свернуть' : `Показать все ${EQUIPMENT_CLASS_COUNTS.length} классов`}
          </button>
        )}
      </div>
    </div>
  );
}

type FetchState = 'idle' | 'loading' | 'ok' | 'demo';

export function BackendStatus() {
  const [health, setHealth] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [photos, setPhotos] = useState<FetchState>('idle');
  const [objects, setObjects] = useState<FetchState>('idle');
  const [leaderboard, setLeaderboard] = useState<FetchState>('idle');

  const [photosData, setPhotosData] = useState<typeof BACKEND_API.photosResponseExample | null>(null);
  const [objectsData, setObjectsData] = useState<typeof BACKEND_API.objectsResponseExample | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<typeof BACKEND_API.leaderboardResponseExample | null>(null);

  async function checkHealth() {
    setHealth('loading');
    try {
      const res = await fetch(`${BACKEND_API.baseUrl}${BACKEND_API.healthEndpoint}`);
      setHealth(res.ok ? 'ok' : 'error');
    } catch {
      setHealth('error');
    }
  }
  async function getPhotos() {
    setPhotos('loading');
    try {
      const r = await fetch(`${BACKEND_API.baseUrl}${BACKEND_API.photosEndpoint}`);
      if (!r.ok) throw new Error(String(r.status));
      setPhotosData(await r.json());
      setPhotos('ok');
    } catch {
      setPhotosData(BACKEND_API.photosResponseExample);
      setPhotos('demo');
    }
  }
  async function getObjects() {
    setObjects('loading');
    try {
      const r = await fetch(`${BACKEND_API.baseUrl}${BACKEND_API.objectsEndpoint}`);
      if (!r.ok) throw new Error(String(r.status));
      setObjectsData(await r.json());
      setObjects('ok');
    } catch {
      setObjectsData(BACKEND_API.objectsResponseExample);
      setObjects('demo');
    }
  }
  async function getLeaderboard() {
    setLeaderboard('loading');
    try {
      const r = await fetch(`${BACKEND_API.baseUrl}${BACKEND_API.leaderboardEndpoint}`);
      if (!r.ok) throw new Error(String(r.status));
      setLeaderboardData(await r.json());
      setLeaderboard('ok');
    } catch {
      setLeaderboardData(BACKEND_API.leaderboardResponseExample);
      setLeaderboard('demo');
    }
  }

  function StatusIcon({ s }: { s: 'idle' | 'loading' | 'ok' | 'error' | 'demo' }) {
    if (s === 'loading') return <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-400" />;
    if (s === 'ok') return <CheckCircle2 className="h-3.5 w-3.5 text-success-400" />;
    if (s === 'demo') return <span className="text-[10px] font-bold text-warning-300">демо</span>;
    if (s === 'error') return <span className="text-[10px] font-bold text-danger-400">ошибка</span>;
    return null;
  }

  function Row({ method, path, color, state, onClick }: { method: string; path: string; color: string; state: FetchState | 'ok' | 'error'; onClick: () => void }) {
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded-md bg-surface-tertiary px-1.5 py-0.5 font-mono text-[10px] font-bold ${color}`}>{method}</span>
          <span className="font-mono text-[11px] text-content-secondary">{path}</span>
        </div>
        <button onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-tertiary/50 px-2 py-1 text-[10px] font-semibold text-content-secondary transition hover:bg-surface-tertiary">
          <StatusIcon s={state} /> Получить
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary">
      <div className="border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-accent-400" />
          <h3 className="font-display text-sm font-semibold text-content-primary">Backend API (FastAPI)</h3>
        </div>
        <p className="mt-1 text-xs text-content-tertiary">{BACKEND_API.baseUrl || 'тот же сервер'} · при недоступности — демо-ответ</p>
      </div>

      <div className="space-y-2 px-4 py-3">
        <Row method="GET" path="/health" color="text-accent-400" state={health} onClick={checkHealth} />
        <Row method="GET" path="/photos" color="text-accent-400" state={photos} onClick={getPhotos} />
        <Row method="GET" path="/api/foreman/objects" color="text-accent-400" state={objects} onClick={getObjects} />
        <Row method="GET" path="/api/foreman/leaderboard" color="text-accent-400" state={leaderboard} onClick={getLeaderboard} />

        {photosData && (
          <div className="rounded-lg border border-surface-border bg-surface-primary p-2.5">
            <div className="text-[10px] text-content-tertiary">фото в хранилище: {photosData.total}</div>
            {photosData.photos.slice(0, 8).map((p) => (
              <div key={p.id} className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[10px] text-content-secondary">{p.file}</span>
                <span className="text-[9px] text-content-muted">{p.timestamp}</span>
              </div>
            ))}
          </div>
        )}

        {objectsData && (
          <div className="rounded-lg border border-surface-border bg-surface-primary p-2.5">
            {objectsData.objects.map((o) => (
              <div key={o.id} className="py-0.5">
                <div className="text-[11px] text-content-primary">{o.name}</div>
                <div className="text-[10px] text-content-tertiary">бригады: {o.brigades.map((b) => b.name).join(', ')}</div>
              </div>
            ))}
          </div>
        )}

        {leaderboardData && (
          <div className="rounded-lg border border-surface-border bg-surface-primary p-2.5">
            {leaderboardData.brigades.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 py-0.5">
                <span className="text-[11px] text-content-primary">{b.rank}. {b.name}</span>
                <span className="font-mono text-[10px] text-content-secondary">{b.points} · принято {b.accepted} · {b.quality}%</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileJson className="h-3.5 w-3.5 text-content-muted" />
            <span className="font-mono text-[11px] text-content-secondary">/docs</span>
          </div>
          <a
            href={`${BACKEND_API.baseUrl}${BACKEND_API.docsEndpoint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-tertiary/50 px-2 py-1 text-[10px] font-semibold text-accent-400 transition hover:bg-surface-tertiary"
          >
            Открыть
          </a>
        </div>
      </div>
    </div>
  );
}
