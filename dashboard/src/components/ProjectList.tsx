import {
  AlertTriangle,
  Clock,
  Camera,
  ChevronRight,
  TrendingDown,
  Shield,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import type { Project } from '@/projects';

interface Props {
  projects: Project[];
  onOpen: (project: Project) => void;
}

const STATUS_META = {
  critical: { label: 'Критические проблемы', text: 'text-danger-400', bg: 'bg-danger-500/10', border: 'border-danger-500/30', ring: 'ring-danger-500/30' },
  warning: { label: 'Отклонения', text: 'text-warning-300', bg: 'bg-warning-400/10', border: 'border-warning-400/30', ring: 'ring-warning-400/30' },
  normal: { label: 'В норме', text: 'text-success-300', bg: 'bg-success-500/10', border: 'border-success-500/30', ring: 'ring-success-500/30' },
};

function ProjectCard({ project, index, onOpen }: { project: Project; index: number; onOpen: () => void }) {
  const meta = STATUS_META[project.status];
  const s = project.summary;
  const isCritical = project.status === 'critical';
  const isWarning = project.status === 'warning';

  return (
    <article
      className={`group cursor-pointer overflow-hidden rounded-2xl border ${meta.border} ${meta.bg}
        p-5 ring-1 ${meta.ring}
        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl
        animate-slide-up stagger-${Math.min(index + 1, 6)}
        ${isCritical ? 'animate-pulse-ring' : ''}`}
      onClick={onOpen}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${meta.text.replace('text-', 'bg-').replace('-400', '-500').replace('-300', '-400')} ${isCritical ? 'animate-pulse-dot' : ''}`} />
            <h3 className="font-display text-lg font-bold text-content-primary">{project.name}</h3>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-content-tertiary">
            <MapPin className="h-3 w-3" /> {project.address}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Risk badge */}
          <div className={`flex items-center gap-1 rounded-lg border ${meta.border} ${meta.bg} px-2 py-1`}>
            <Shield className={`h-3.5 w-3.5 ${meta.text}`} />
            <span className={`font-display text-sm font-bold ${meta.text}`}>{project.riskScore.total}</span>
          </div>
          <ChevronRight className="h-5 w-5 text-content-muted transition-transform group-hover:translate-x-1" />
        </div>
      </div>

      {/* Problem summary line */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${meta.text} ${meta.bg}`}>
          {meta.label}
        </span>
        {s.requiresReaction > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-danger-400">
            <AlertTriangle className="h-3 w-3" /> {s.requiresReaction} требуют реакции
          </span>
        )}
        {s.askReason > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-warning-300">
            <TrendingDown className="h-3 w-3" /> {s.askReason} спросить причину
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="rounded-lg bg-surface-tertiary/50 p-2">
          <div className="flex items-center gap-1 text-[10px] text-content-tertiary">
            <Camera className="h-3 w-3" /> камер
          </div>
          <div className="mt-0.5 font-display text-lg font-bold text-content-primary">{s.cameras}</div>
        </div>
        <div className="rounded-lg bg-surface-tertiary/50 p-2">
          <div className="text-[10px] text-content-tertiary">работ</div>
          <div className="mt-0.5 font-display text-lg font-bold text-content-primary">{s.totalWorks}</div>
        </div>
        <div className="rounded-lg bg-surface-tertiary/50 p-2">
          <div className="flex items-center gap-1 text-[10px] text-content-tertiary">
            <Clock className="h-3 w-3" /> зад.
          </div>
          <div className={`mt-0.5 font-display text-lg font-bold ${s.gapDays > 0 ? 'text-danger-400' : 'text-success-300'}`}>
            {s.gapDays}д
          </div>
        </div>
        <div className="rounded-lg bg-surface-tertiary/50 p-2">
          <div className="text-[10px] text-content-tertiary">факт/план</div>
          <div className="mt-0.5 font-display text-lg font-bold text-content-primary">
            {s.confirmedPct}<span className="text-content-muted">/{s.planPct}</span>%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-success-500 to-success-400"
            style={{ width: `${s.confirmedPct}%` }}
          />
          {s.gapPct > 0 && (
            <div
              className="absolute top-0 h-full rounded-full bg-gradient-to-r from-danger-500 to-danger-400 animate-pulse-dot"
              style={{ left: `${s.confirmedPct}%`, width: `${s.gapPct}%` }}
            />
          )}
          <div
            className="absolute top-0 h-full w-0.5 bg-warning-300"
            style={{ left: `${s.planPct}%` }}
          />
        </div>
      </div>
    </article>
  );
}

export function ProjectList({ projects, onOpen }: Props) {
  // Список приходит уже отфильтрованным (проблемные или выбранные) — сортируем по проблемности
  const visibleProjects = [...projects].sort((a, b) => b.problemScore - a.problemScore);

  return (
    <section className="animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-content-primary">Проекты, требующие внимания</h2>
          <p className="mt-0.5 text-xs text-content-tertiary">
            Отсортировано по убыванию проблемности · все проекты доступны в выпадающем списке
          </p>
        </div>
        <span className="rounded-lg bg-surface-tertiary px-3 py-1 text-xs font-semibold text-content-secondary">
          {visibleProjects.length} проблемных
        </span>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="rounded-2xl border border-surface-border bg-surface-secondary p-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success-400" />
          <p className="mt-3 text-sm text-content-secondary">Нет данных для отображения</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleProjects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} onOpen={() => onOpen(p)} />
          ))}
        </div>
      )}
    </section>
  );
}


