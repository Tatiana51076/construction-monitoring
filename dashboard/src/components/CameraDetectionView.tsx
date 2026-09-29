import { useState, type ChangeEvent, type CSSProperties } from 'react';
import {
  Camera,
  ScanLine,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { EQUIPMENT_META, BACKEND_API, resolveEquipment } from '@/data';
import type { EquipmentType, ApiDetection } from '@/data';
import { BackendStatus, DatasetClassCounts } from './BackendPanel';
import { LiveDataStatus } from './LiveDataStatus';
import { ForemanPhotos } from './ForemanPhotos';
import type { Project, CameraSnapshot, BoundingBox, EquipmentObservation, SiteZone, ProjectKPIs } from '@/projects';

function DetectionBox({ box }: { box: BoundingBox }) {
  const meta = EQUIPMENT_META[box.equipment as EquipmentType];
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="absolute border-2 rounded transition-all cursor-pointer"
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.w}%`,
        height: `${box.h}%`,
        borderColor: hovered ? '#34d399' : '#0ea5e9',
        boxShadow: hovered ? '0 0 12px rgba(14,165,233,0.5)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold ${hovered ? 'bg-success-500 text-white' : 'bg-accent-500 text-white'}`}>
        {meta.shortLabel} {Math.round(box.confidence * 100)}%
      </div>
    </div>
  );
}

function SnapshotCard({ snapshot, zoneName }: { snapshot: CameraSnapshot; zoneName: string }) {
  const [showBoxes, setShowBoxes] = useState(true);
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-accent-400" />
          <span className="text-sm font-semibold text-content-primary">{zoneName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-content-tertiary">{snapshot.timestamp}</span>
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${showBoxes ? 'bg-accent-500/20 text-accent-400' : 'bg-surface-tertiary text-content-tertiary'}`}
          >
            <ScanLine className="mr-1 inline h-3 w-3" />
            {showBoxes ? 'Детекции вкл' : 'Детекции выкл'}
          </button>
        </div>
      </div>
      <div className="relative aspect-video bg-surface-primary">
        <img src={snapshot.image} alt={zoneName} className="h-full w-full object-cover" />
        {showBoxes && snapshot.detections.map((d: BoundingBox, i: number) => <DetectionBox key={i} box={d} />)}
        {showBoxes && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-0 right-0 h-0.5 bg-accent-400/40" style={{ animation: 'scanline 3s linear infinite' }} />
          </div>
        )}
      </div>
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">Обнаружено {snapshot.detections.length} объектов</span>
          <span className="text-[10px] text-content-muted">
            ср. уверенность {snapshot.detections.length > 0 ? Math.round((snapshot.detections.reduce((s: number, d: BoundingBox) => s + d.confidence, 0) / snapshot.detections.length) * 100) : 0}%
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {snapshot.detections.map((d: BoundingBox, i: number) => {
            const meta = EQUIPMENT_META[d.equipment as EquipmentType];
            return (
              <span key={i} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ${meta.bg} ${meta.color}`}>
                {meta.label}
                <span className="opacity-60">{Math.round(d.confidence * 100)}%</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ObservationTable({ observations, zones }: { observations: EquipmentObservation[]; zones: SiteZone[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40">
      <div className="border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent-400" />
          <h3 className="font-display text-sm font-semibold text-content-primary">Агрегация наблюдений за 5 дней</h3>
        </div>
        <p className="mt-1 text-xs text-content-tertiary">Подсчёт техники, время присутствия, динамика — по серии снимков с каждой камеры</p>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-[10px] uppercase tracking-wider text-content-tertiary">
              <th className="px-4 py-2 font-semibold">Зона</th>
              <th className="px-3 py-2 font-semibold">Техника</th>
              <th className="px-3 py-2 text-center font-semibold">Ср. кол-во/день</th>
              <th className="px-3 py-2 text-center font-semibold">Активность, мин</th>
              <th className="px-3 py-2 text-center font-semibold">Дней присут.</th>
              <th className="px-3 py-2 font-semibold">Тренд</th>
            </tr>
          </thead>
          <tbody>
            {observations.map((obs: EquipmentObservation, i: number) => {
              const meta = EQUIPMENT_META[obs.equipment as EquipmentType];
              const zone = zones.find((z: SiteZone) => z.id === obs.zoneId);
              const trendColor = obs.trend === 'stable' ? 'text-success-300' : obs.trend === 'increasing' ? 'text-accent-400' : obs.trend === 'decreasing' ? 'text-warning-300' : 'text-danger-300';
              const trendLabel = obs.trend === 'stable' ? '→ стабильно' : obs.trend === 'increasing' ? '↑ растёт' : obs.trend === 'decreasing' ? '↓ падает' : '✕ нет';
              return (
                <tr key={i} className="border-b border-surface-border/30 hover:bg-surface-tertiary/20">
                  <td className="px-4 py-2.5 text-xs text-content-secondary">{zone?.name}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${meta.color}`}>
                      <span className={`h-2 w-2 rounded-full ${meta.bg.replace('/15', '')}`} />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-xs text-content-primary">{obs.avgCountPerDay}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-xs text-content-primary">{obs.avgActiveMinutes}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-xs text-content-primary">{obs.presentDays}/5</td>
                  <td className={`px-3 py-2.5 text-xs font-semibold ${trendColor}`}>{trendLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PipelineStages({ kpis, cameraCount, totalDetections }: { kpis: ProjectKPIs; cameraCount: number; totalDetections: number }) {
  const stages = [
    { icon: Camera, label: 'Снимки с камер', detail: `${cameraCount} камеры · ${kpis.framesProcessed} кадров/день`, color: 'text-accent-400', bg: 'bg-accent-500/15' },
    { icon: ScanLine, label: 'YOLO детекция', detail: `${totalDetections} объектов · ср. ${Math.round(kpis.avgDetectionConfidence * 100)}% точность`, color: 'text-sky-300', bg: 'bg-sky-400/15' },
    { icon: Layers, label: 'Агрегация', detail: 'подсчёт + время + тренд', color: 'text-teal-300', bg: 'bg-teal-400/15' },
    { icon: ArrowRight, label: 'Привязка к графику', detail: `матрица техника→работы · ${Math.round(kpis.matchingAccuracy * 100)}%`, color: 'text-amber-300', bg: 'bg-amber-400/15' },
    { icon: Activity, label: 'Отклонения + риск', detail: '3 оси · score вычисляется', color: 'text-danger-300', bg: 'bg-danger-500/15' },
  ];
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-secondary/40 p-4">
      <h3 className="mb-3 font-display text-sm font-semibold text-content-primary">Конвейер обработки: видео → отклонение → риск</h3>
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((s, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 rounded-xl border border-surface-border ${s.bg} px-3 py-2`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <div>
                <div className="text-xs font-semibold text-content-primary">{s.label}</div>
                <div className="text-[10px] text-content-tertiary">{s.detail}</div>
              </div>
            </div>
            {i < stages.length - 1 && <ArrowRight className="h-4 w-4 text-content-muted" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiRow({ kpis }: { kpis: ProjectKPIs }) {
  const items = [
    { label: 'SPI (факт/план)', value: kpis.schedulePerformanceIndex.toFixed(2), good: kpis.schedulePerformanceIndex >= 1, warn: kpis.schedulePerformanceIndex < 0.7 },
    { label: 'Загрузка техники', value: `${Math.round(kpis.equipmentUtilization * 100)}%`, good: false, warn: kpis.equipmentUtilization < 0.5 },
    { label: 'Точность детекции', value: `${Math.round(kpis.avgDetectionConfidence * 100)}%`, good: true, warn: false },
    { label: 'Точность привязки', value: `${Math.round(kpis.matchingAccuracy * 100)}%`, good: true, warn: false },
    { label: 'Кадров обработано', value: kpis.framesProcessed.toString(), good: true, warn: false },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((k) => (
        <div key={k.label} className="rounded-xl border border-surface-border bg-surface-secondary/40 px-3 py-2.5">
          <div className="text-[10px] text-content-tertiary">{k.label}</div>
          <div className={`mt-1 font-display text-lg font-bold ${k.warn ? 'text-danger-300' : k.good ? 'text-success-300' : 'text-content-primary'}`}>{k.value}</div>
        </div>
      ))}
    </div>
  );
}

const WORK_OPTIONS = [
  { slug: 'concrete', label: 'Бетонирование' },
  { slug: 'pit', label: 'Котлован' },
  { slug: 'rebar', label: 'Армирование' },
];

function UploadPanel({ devMode, onUploaded }: { devMode: boolean; onUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [work, setWork] = useState('concrete');
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [response, setResponse] = useState<{ status: string; file: string; detections: ApiDetection[]; work?: string; work_status?: string; found?: string[] } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [demo, setDemo] = useState(false);
  const [demoSize, setDemoSize] = useState<{ w: number; h: number } | null>(null);

  function onPick(ev: ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0] || null;
    setFile(f);
    setResponse(null);
    setStatus('idle');
    setSize(null);
    setDemo(false);
    setDemoSize(null);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function send() {
    if (!file) return;
    setStatus('loading');
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const renamed = new File([file], `t-${work}.${ext}`, { type: file.type });
      const fd = new FormData();
      fd.append(BACKEND_API.uploadField, renamed);
      const res = await fetch(`${BACKEND_API.baseUrl}${BACKEND_API.uploadEndpoint}`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResponse(data);
      setDemo(false);
      setDemoSize(null);
      setStatus('ok');
      onUploaded?.();
    } catch {
      // бэкенд недоступен — честно показываем ошибку, НЕ рисуем выдуманные рамки
      setResponse(null);
      setDemo(false);
      setDemoSize(null);
      setStatus('error');
    }
  }

  // bbox: [x_центр, y_центр, w, h] в пикселях → проценты для наложения на картинку
  function boxStyle(d: ApiDetection): CSSProperties | null {
    const ref = demo ? demoSize : size;
    if (!ref) return null;
    const [cx, cy, w, h] = d.bbox;
    const left = ((cx - w / 2) / ref.w) * 100;
    const top = ((cy - h / 2) / ref.h) * 100;
    return { left: `${left}%`, top: `${top}%`, width: `${(w / ref.w) * 100}%`, height: `${(h / ref.h) * 100}%` };
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40">
      <div className="border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-accent-400" />
          <h3 className="font-display text-sm font-semibold text-content-primary">Загрузка снимка (POST /upload)</h3>
        </div>
        <p className="mt-1 text-xs text-content-tertiary">
          {devMode
            ? 'Файл → нейросеть → JSON с детекциями (class, confidence, bbox: центр + размеры)'
            : 'Загрузите снимок — ИИ распознает технику'}
        </p>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-content-tertiary">Работа:</span>
          <select
            value={work}
            onChange={(e) => setWork(e.target.value)}
            className="rounded-xl border border-surface-border bg-surface-tertiary/50 px-3 py-2 text-xs font-semibold text-content-primary outline-none"
          >
            {WORK_OPTIONS.map((w) => (
              <option key={w.slug} value={w.slug}>{w.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-border bg-surface-tertiary/50 px-3 py-2 text-xs font-semibold text-content-secondary transition hover:bg-surface-tertiary">
            <Upload className="h-3.5 w-3.5" />
            {file ? 'Выбрать другое' : 'Выбрать снимок'}
            <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={onPick} />
          </label>
          <button
            onClick={send}
            disabled={!file || status === 'loading'}
            className="flex items-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 px-4 py-2 text-sm font-semibold text-accent-400 transition hover:bg-accent-500/20 disabled:opacity-50"
          >
            {status === 'loading' ? (
              <><Clock className="h-4 w-4 animate-spin" /> Обработка…</>
            ) : (
              <><ScanLine className="h-4 w-4" /> Отправить в /upload</>
            )}
          </button>
          {file && <span className="text-[10px] text-content-tertiary">{file.name}</span>}
        </div>

        {status === 'error' && (
          <div className="rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-xs text-danger-300">
            Не удалось обратиться к {BACKEND_API.baseUrl}{BACKEND_API.uploadEndpoint}.
            Проверьте, что бэкенд запущен и разрешён CORS.
          </div>
        )}

        {demo && (
          <div className="rounded-lg border border-warning-400/30 bg-warning-400/10 px-3 py-2 text-xs text-warning-300">
            Бэкенд недоступен — показан демонстрационный ответ (рамки нарисованы по формату bbox = центр+размеры, px).
          </div>
        )}

        {preview && (
          <div className="relative aspect-video overflow-hidden rounded-xl border border-surface-border bg-surface-primary">
            <img
              src={preview}
              alt="снимок"
              className="h-full w-full object-contain"
              onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            />
            {status === 'ok' && response?.detections?.map((d, i) => {
              const st = boxStyle(d);
              if (!st) return null;
              const eq = resolveEquipment(d.class);
              const label = eq ? EQUIPMENT_META[eq].label : d.class;
              const conf = Math.round(d.confidence * 100);
              const low = d.confidence < 0.6;
              // Обычный режим — единый аккуратный цвет; тех. режим — цвет по уверенности
              const color = devMode
                ? (d.confidence >= 0.8 ? '#34d399' : d.confidence >= 0.6 ? '#fbbf24' : '#f87171')
                : '#0ea5e9';
              return (
                <div key={i} className="absolute rounded border-2" style={{ ...st, borderColor: color }}>
                  <span
                    className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {label} {conf}%{low ? ' · низкая' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {status === 'ok' && response && (
          <div className="rounded-lg border border-surface-border bg-surface-primary p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-content-secondary">
                Обнаружено объектов: {response.detections?.length ?? 0}
              </span>
              {response.work_status && (
                <span className="rounded-md bg-success-500/15 px-1.5 py-0.5 text-[9px] font-bold text-success-300">{response.work_status}</span>
              )}
            </div>
            {response.detections && response.detections.length > 0 && (
              <ul className="mt-2 space-y-1">
                {response.detections.map((d, i) => {
                  const eq = resolveEquipment(d.class);
                  const label = eq ? EQUIPMENT_META[eq].label : d.class;
                  return (
                    <li key={i} className="flex items-center gap-2 text-[11px] text-content-secondary">
                      <span className="font-semibold text-content-primary">{label}</span>
                      <span className="font-mono text-[10px]">{Math.round(d.confidence * 100)}%</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {response.work && (
              <div className="mt-2 text-[11px] text-content-secondary">
                Работа: <span className="font-semibold text-content-primary">{response.work}</span>
                {response.found && response.found.length > 0 && (
                  <span className="text-content-tertiary"> · найдено: {response.found.join(', ')}</span>
                )}
              </div>
            )}
            {devMode && (
              <pre className="mt-2 overflow-x-auto text-[10px] leading-relaxed text-content-secondary scrollbar-thin">
{JSON.stringify(response, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  project: Project;
  devMode?: boolean;
  onUploaded?: () => void;
}

export function CameraDetectionView({ project, devMode, onUploaded }: Props) {
  return (
    <div className="space-y-6 animate-slide-up">
      <PipelineStages kpis={project.kpis} cameraCount={project.summary.cameras} totalDetections={project.kpis.totalDetections} />
      <KpiRow kpis={project.kpis} />

      <ForemanPhotos />

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Camera className="h-4 w-4 text-accent-400" />
          <h2 className="font-display text-base font-semibold text-content-primary">Снимки с камер и детекция техники</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {project.cameraSnapshots.map((snap: CameraSnapshot) => {
            const zone = project.siteZones.find((z: SiteZone) => z.id === snap.zoneId);
            return <SnapshotCard key={snap.id} snapshot={snap} zoneName={zone?.name || ''} />;
          })}
        </div>
      </div>

      <UploadPanel devMode={!!devMode} onUploaded={onUploaded} />
      <ObservationTable observations={project.equipmentObservations} zones={project.siteZones} />
      {devMode && (
        <div className="space-y-6 rounded-2xl border border-dashed border-accent-500/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-accent-400">
            Технический режим · проверка API
          </div>
          <LiveDataStatus />
          <BackendStatus />
          <DatasetClassCounts />
        </div>
      )}
    </div>
  );
}
