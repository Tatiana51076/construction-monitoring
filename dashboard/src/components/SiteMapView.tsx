import { MapPin, Camera, Truck } from 'lucide-react';
import { EQUIPMENT_META, type EquipmentType } from '@/data';
import type { Project, SiteZone, DeviationAnalysis, WorkItem, EquipmentObservation } from '@/projects';

interface ZoneBoxProps {
  zone: SiteZone;
  deviationAnalyses: DeviationAnalysis[];
  workItems: WorkItem[];
  equipmentObservations: EquipmentObservation[];
}

function ZoneBox({ zone, deviationAnalyses, workItems, equipmentObservations }: ZoneBoxProps) {
  const analysis = deviationAnalyses.find((a) => a.zoneId === zone.id);
  const work = workItems.find((w) => w.id === zone.currentWorkId);
  const verdict = analysis?.overallVerdict || 'normal';

  const borderColor =
    verdict === 'critical'
      ? 'border-danger-500/50'
      : verdict === 'warning'
        ? 'border-warning-400/50'
        : 'border-success-500/40';

  const bgColor =
    verdict === 'critical'
      ? 'bg-danger-500/[0.06]'
      : verdict === 'warning'
        ? 'bg-warning-400/[0.04]'
        : 'bg-success-500/[0.04]';

  const glow =
    verdict === 'critical'
      ? 'shadow-[0_0_20px_rgba(239,68,68,0.15)]'
      : verdict === 'warning'
        ? 'shadow-[0_0_15px_rgba(251,191,36,0.1)]'
        : 'shadow-[0_0_15px_rgba(52,211,153,0.08)]';

  // Equipment in this zone
  const zoneEquipment = equipmentObservations.filter((o) => o.zoneId === zone.id);

  return (
    <div
      className={`absolute rounded-xl border-2 ${borderColor} ${bgColor} ${glow} p-2 transition-all hover:brightness-125 cursor-pointer`}
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.w}%`,
        height: `${zone.h}%`,
      }}
    >
      <div className="flex items-center gap-1">
        <Camera className="h-3 w-3 text-accent-400" />
        <span className="truncate text-[10px] font-semibold text-content-primary">{zone.name}</span>
      </div>

      {/* Equipment icons */}
      <div className="mt-1.5 hidden space-y-0.5 sm:block">
        {zoneEquipment.map((obs, i) => {
          const meta = EQUIPMENT_META[obs.equipment as EquipmentType];
          const isAbsent = obs.trend === 'absent' || obs.avgCountPerDay < 0.5;
          return (
            <div
              key={i}
              className={`flex items-center gap-1 text-[10px] ${
                isAbsent ? 'opacity-30 line-through' : ''
              }`}
            >
              <Truck className={`h-2.5 w-2.5 ${meta.color}`} />
              <span className={meta.color}>{meta.shortLabel}</span>
              <span className="text-content-muted">
                {obs.avgCountPerDay > 0 ? `${obs.avgActiveMinutes}м` : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Work status at bottom */}
      <div className="absolute bottom-1.5 left-2 right-2">
        <div className="truncate text-[10px] text-content-tertiary">{work?.title}</div>
        <div
          className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
            verdict === 'critical'
              ? 'bg-danger-500/20 text-danger-300'
              : verdict === 'warning'
                ? 'bg-warning-400/20 text-warning-300'
                : 'bg-success-500/20 text-success-300'
          }`}
        >
          {verdict === 'critical' ? 'Критично' : verdict === 'warning' ? 'Отклонение' : 'В норме'}
        </div>
      </div>
    </div>
  );
}

interface SiteMapViewProps {
  project: Project;
}

export function SiteMapView({ project }: SiteMapViewProps) {
  const { siteZones, deviationAnalyses, workItems, equipmentObservations } = project;

  return (
    <section className="animate-slide-up">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-accent-400" />
        <h2 className="font-display text-base font-semibold text-content-primary">
          Карта стройплощадки
        </h2>
        <span className="text-xs text-content-tertiary">· 3 зоны · 3 камеры</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-tertiary/50 p-4">
        {/* Stylized site map */}
        <div className="relative aspect-[4/3] w-full rounded-xl border border-surface-border-strong/50 bg-surface-primary/60 overflow-hidden sm:aspect-[16/9]">
          {/* Grid lines for "blueprint" feel */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, #475569 1px, transparent 1px),
                linear-gradient(to bottom, #475569 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Zone boxes */}
          {siteZones.map((zone) => (
            <ZoneBox
              key={zone.id}
              zone={zone}
              deviationAnalyses={deviationAnalyses}
              workItems={workItems}
              equipmentObservations={equipmentObservations}
            />
          ))}

          {/* Camera markers */}
          {siteZones.map((zone) => (
            <div
              key={`cam-${zone.id}`}
              className="absolute flex items-center justify-center"
              style={{
                left: `${zone.x + zone.w / 2 - 1}%`,
                top: `${zone.y - 1}%`,
              }}
            >
              <div className="relative">
                <Camera className="h-5 w-5 text-accent-400" />
                <span className="absolute -right-1 -top-1 flex h-2 w-2">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
                  <span className="h-2 w-2 rounded-full bg-accent-400" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-content-tertiary">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-4 rounded border-2 border-success-500/40" /> в норме
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-4 rounded border-2 border-warning-400/50" /> отклонение
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-4 rounded border-2 border-danger-500/50" /> критично
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-accent-400">
            <Camera className="h-3 w-3" /> камера
          </span>
        </div>
      </div>
    </section>
  );
}
