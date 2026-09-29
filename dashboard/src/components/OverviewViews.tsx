import {
  AlertTriangle,
  HelpCircle,
  Activity,
  EyeOff,
  Shield,
  Clock,
  Camera,
  Users,
  Package,
  Timer,
  MapPin,
  TrendingDown,
  ChevronRight,
  CheckCircle2,
  CalendarX,
  Gauge,
  Lightbulb,
  Layers,
  GitBranch,
  Target,
  ScanLine,
  CalendarRange,
} from 'lucide-react';
import { dateLabelString, type Project, type ProjectSummary, type RiskScore, type CalendarEvent, type DaySummary } from '@/projects';
import { STATUS_META, EQUIPMENT_META, DEVIATION_VERDICT_META, EVENT_STATUS_META, type EquipmentType, type DeviationVerdict } from '@/data';
import { CalendarView } from './CalendarView';

interface Props {
  projects: Project[];
  mode: 'planfact' | 'calendar' | 'cv' | 'methodology' | 'risk' | 'map';
  onOpen: (project: Project) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function aggregateSummaries(projects: Project[]): ProjectSummary & { projectCount: number } {
  const s = projects.reduce(
    (acc, p) => {
      acc.cameras += p.summary.cameras;
      acc.totalWorks += p.summary.totalWorks;
      acc.requiresReaction += p.summary.requiresReaction;
      acc.askReason += p.summary.askReason;
      acc.inProgress += p.summary.inProgress;
      acc.outOfScope += p.summary.outOfScope;
      acc.planPct += p.summary.planPct;
      acc.confirmedPct += p.summary.confirmedPct;
      acc.gapPct += p.summary.gapPct;
      acc.gapDays += p.summary.gapDays;
      acc.totalDelayDays += p.summary.totalDelayDays;
      acc.compensatedDays += p.summary.compensatedDays;
      acc.netDelayDays += p.summary.netDelayDays;
      acc.roughDetailCount += p.summary.roughDetailCount;
      acc.finishingDetailCount += p.summary.finishingDetailCount;
      acc.totalDetailCount += p.summary.totalDetailCount;
      acc.totalDelayHours += p.summary.totalDelayHours;
      acc.penaltyRisk = acc.penaltyRisk || p.summary.penaltyRisk;
      return acc;
    },
    {
      objectName: '', dateLabel: dateLabelString(new Date()), schedule: 'Пятидневка',
      cameras: 0, totalWorks: 0, requiresReaction: 0, askReason: 0, inProgress: 0, outOfScope: 0,
      planPct: 0, confirmedPct: 0, gapPct: 0, gapDays: 0,
      totalDelayDays: 0, compensatedDays: 0, netDelayDays: 0,
      penaltyRisk: false, penaltyNote: '',
      roughDetailCount: 0, finishingDetailCount: 0, totalDetailCount: 0, totalDelayHours: 0,
    } as ProjectSummary,
  );
  const n = projects.length;
  return {
    ...s,
    projectCount: n,
    planPct: Math.round(s.planPct / n),
    confirmedPct: Math.round(s.confirmedPct / n),
    gapPct: Math.round(s.gapPct / n),
    penaltyNote: s.penaltyRisk ? 'Есть объекты с риском штрафа' : 'Штрафы не грозят ни одному объекту',
  };
}

// ─── Plan / Fact overview ─────────────────────────────────────────────────

function PlanFactOverview({ projects, onOpen }: { projects: Project[]; onOpen: (p: Project) => void }) {
  const agg = aggregateSummaries(projects);
  const sorted = [...projects].sort((a, b) => b.problemScore - a.problemScore);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Aggregate summary card */}
      <section className="rounded-3xl border border-surface-border bg-gradient-to-br from-surface-secondary to-surface-primary p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-content-tertiary">
              <span className="rounded-md bg-surface-tertiary px-2 py-0.5">Объектив</span>
              <span>·</span>
              <span>Сводка по всем объектам</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold text-content-primary">
              {agg.projectCount} объекта · {agg.totalWorks} работ
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-content-tertiary">
              <span className="inline-flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> {agg.cameras} камер</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {agg.gapDays} дней отставания</span>
              <span className="inline-flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> {agg.inProgress} работ идёт</span>
            </div>
          </div>
          {/* Mini dial substitute */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="font-display text-4xl font-bold text-success-300">{agg.confirmedPct}%</div>
              <div className="text-[10px] uppercase tracking-wider text-content-tertiary">факт</div>
            </div>
            <div className="text-content-muted">/</div>
            <div className="text-center">
              <div className="font-display text-4xl font-bold text-warning-300">{agg.planPct}%</div>
              <div className="text-[10px] uppercase tracking-wider text-content-tertiary">план</div>
            </div>
          </div>
        </div>

        {/* Aggregate progress bar */}
        <div className="mt-5">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-tertiary">
            <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-success-500 to-success-400" style={{ width: `${agg.confirmedPct}%` }} />
            {agg.gapPct > 0 && (
              <div className="absolute top-0 h-full rounded-full bg-gradient-to-r from-danger-500 to-danger-400 animate-pulse-dot" style={{ left: `${agg.confirmedPct}%`, width: `${agg.gapPct}%` }} />
            )}
            <div className="absolute top-0 h-full w-0.5 bg-warning-300" style={{ left: `${agg.planPct}%` }} />
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Требует реакции', value: agg.requiresReaction, icon: AlertTriangle, accent: 'bg-danger-500/20 text-danger-400', ring: 'border-danger-500/30' },
            { label: 'Спросить причину', value: agg.askReason, icon: HelpCircle, accent: 'bg-warning-400/20 text-warning-300', ring: 'border-warning-400/30' },
            { label: 'Идёт', value: agg.inProgress, icon: Activity, accent: 'bg-success-500/20 text-success-300', ring: 'border-success-500/30' },
            { label: 'Вне охвата', value: agg.outOfScope, icon: EyeOff, accent: 'bg-surface-tertiary/40 text-content-secondary', ring: 'border-surface-border-strong/40' },
          ].map(({ label, value, icon: Icon, accent, ring }) => (
            <div key={label} className={`relative overflow-hidden rounded-xl border ${ring} bg-surface-tertiary/50 p-3`}>
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}><Icon className="h-4 w-4" /></span>
                <span className="font-display text-2xl font-bold text-content-primary">{value}</span>
              </div>
              <p className="mt-1.5 text-xs text-content-tertiary">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Per-project work status table */}
      <section className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40">
        <div className="border-b border-surface-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent-400" />
            <h2 className="font-display text-sm font-semibold text-content-primary">Статус работ по объектам</h2>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-[10px] uppercase tracking-wider text-content-tertiary">
                <th className="px-4 py-2 font-semibold">Объект</th>
                <th className="px-3 py-2 text-center font-semibold">Требует реакции</th>
                <th className="px-3 py-2 text-center font-semibold">Спросить причину</th>
                <th className="px-3 py-2 text-center font-semibold">Идёт</th>
                <th className="px-3 py-2 text-center font-semibold">Факт/План</th>
                <th className="px-3 py-2 text-center font-semibold">Отставание</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const s = p.summary;
                return (
                  <tr key={p.id} className="cursor-pointer border-b border-surface-border/30 transition hover:bg-surface-tertiary/20" onClick={() => onOpen(p)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${p.status === 'critical' ? 'bg-danger-500' : p.status === 'warning' ? 'bg-warning-400' : 'bg-success-400'}`} />
                        <span className="text-xs font-medium text-content-primary">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs">
                      {s.requiresReaction > 0 ? <span className="font-bold text-danger-300">{s.requiresReaction}</span> : <span className="text-content-muted">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs">
                      {s.askReason > 0 ? <span className="font-bold text-warning-300">{s.askReason}</span> : <span className="text-content-muted">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs">
                      {s.inProgress > 0 ? <span className="font-bold text-success-300">{s.inProgress}</span> : <span className="text-content-muted">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs text-content-primary">
                      {s.confirmedPct}<span className="text-content-muted">/{s.planPct}</span>%
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-xs">
                      {s.gapDays > 0 ? <span className="font-bold text-danger-300">{s.gapDays}д</span> : <span className="text-success-300">0д</span>}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ChevronRight className="h-4 w-4 text-content-muted" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* All work items grouped by status across projects */}
      <AllWorkGroups projects={projects} onOpen={onOpen} />

      {/* Compensation overview */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-accent-500/25 bg-accent-500/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent-400" />
            <span className="text-xs font-semibold text-content-secondary">Компенсировано всего</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-xl font-bold text-accent-400">{agg.compensatedDays} дн</span>
            <span className="text-xs text-content-tertiary">из {agg.totalDelayDays}</span>
          </div>
        </div>
        <div className="rounded-xl border border-danger-500/25 bg-danger-500/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-danger-400" />
            <span className="text-xs font-semibold text-content-secondary">Часовые опоздания</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-xl font-bold text-danger-300">{agg.totalDelayHours}ч</span>
            <span className="text-xs text-content-tertiary">по критичным деталям</span>
          </div>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${agg.penaltyRisk ? 'border-danger-500/30 bg-danger-500/10' : 'border-success-500/25 bg-success-500/[0.06]'}`}>
          <div className="flex items-center gap-2">
            <Shield className={`h-4 w-4 ${agg.penaltyRisk ? 'text-danger-400' : 'text-success-300'}`} />
            <span className="text-xs font-semibold text-content-secondary">Риск штрафа</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className={`font-display text-xl font-bold ${agg.penaltyRisk ? 'text-danger-300' : 'text-success-300'}`}>
              {agg.penaltyRisk ? 'Есть' : 'Нет'}
            </span>
            <span className="text-xs text-content-tertiary">· {agg.netDelayDays} дн чистых</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function AllWorkGroups({ projects, onOpen }: { projects: Project[]; onOpen: (p: Project) => void }) {
  const GROUPS = [
    { status: 'requires_reaction' as const, icon: AlertTriangle },
    { status: 'ask_reason' as const, icon: HelpCircle },
    { status: 'in_progress' as const, icon: Activity },
    { status: 'out_of_scope' as const, icon: EyeOff },
  ];

  return (
    <div className="space-y-5">
      {GROUPS.map(({ status, icon: Icon }) => {
        const items = projects.flatMap((p) => p.workItems.filter((w) => w.status === status).map((w) => ({ work: w, project: p })));
        if (items.length === 0) return null;
        const meta = STATUS_META[status];
        return (
          <section key={status}>
            <div className="mb-3 flex items-center gap-2.5">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.bg} ${meta.text}`}><Icon className="h-4 w-4" /></span>
              <h2 className="font-display text-lg font-semibold text-content-primary">{meta.label}</h2>
              <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-bold text-content-secondary">{items.length}</span>
              <div className="ml-2 h-px flex-1 bg-surface-border" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map(({ work, project }, i) => {
                const projMeta = project.status === 'critical' ? 'border-danger-500/30' : project.status === 'warning' ? 'border-warning-400/30' : 'border-success-500/30';
                return (
                  <div key={`${project.id}-${work.id}`} className={`rounded-xl border ${projMeta} bg-surface-secondary/40 p-3 transition hover:bg-surface-tertiary/30 cursor-pointer animate-slide-up stagger-${Math.min(i + 1, 6)}`} onClick={() => onOpen(project)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-content-primary">{work.title}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-content-tertiary">
                      <span className={`h-1.5 w-1.5 rounded-full ${project.status === 'critical' ? 'bg-danger-500' : project.status === 'warning' ? 'bg-warning-400' : 'bg-success-400'}`} />
                      {project.name}
                    </div>
                    <p className="mt-1.5 text-xs text-content-secondary">{work.detail}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px]">
                      <span className="text-content-tertiary">факт {work.confirmedPct}%</span>
                      {work.delayDays > 0 && <span className="font-bold text-danger-300">+{work.delayDays}д</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─── Calendar overview ────────────────────────────────────────────────────

function CalendarOverview({ projects }: { projects: Project[] }) {
  const allEvents: (CalendarEvent & { projectName: string; projectColor: string })[] = projects.flatMap((p) =>
    p.calendarEvents.map((e) => ({
      ...e,
      projectName: p.name,
      projectColor: p.status === 'critical' ? 'text-danger-300' : p.status === 'warning' ? 'text-warning-300' : 'text-success-300',
    })),
  );
  const allMonthSummaries: DaySummary[] = projects.flatMap((p) => p.monthSummaries);
  const todayDate = projects[0]?.todayDate || '2026-09-28';
  const weekDates = projects[0]?.weekDates || [];

  // Aggregate day stats
  const dayStats = new Map<string, { total: number; delayed: number; confirmed: number; reallocated: number }>();
  for (const e of allEvents) {
    const s = dayStats.get(e.date) || { total: 0, delayed: 0, confirmed: 0, reallocated: 0 };
    s.total++;
    if (e.status === 'delayed') s.delayed++;
    if (e.status === 'confirmed') s.confirmed++;
    if (e.status === 'reallocated') s.reallocated++;
    dayStats.set(e.date, s);
  }

  const totalDelayed = allEvents.filter((e) => e.status === 'delayed').length;
  const totalConfirmed = allEvents.filter((e) => e.status === 'confirmed').length;
  const totalReallocated = allEvents.filter((e) => e.status === 'reallocated').length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-surface-border bg-surface-secondary/40 p-4">
          <div className="text-[10px] uppercase tracking-wider text-content-tertiary">Всего событий</div>
          <div className="mt-1 font-display text-2xl font-bold text-content-primary">{allEvents.length}</div>
        </div>
        <div className="rounded-xl border border-danger-500/30 bg-danger-500/[0.06] p-4">
          <div className="text-[10px] uppercase tracking-wider text-content-tertiary">Задержек</div>
          <div className="mt-1 font-display text-2xl font-bold text-danger-300">{totalDelayed}</div>
        </div>
        <div className="rounded-xl border border-success-500/30 bg-success-500/[0.06] p-4">
          <div className="text-[10px] uppercase tracking-wider text-content-tertiary">Подтверждено</div>
          <div className="mt-1 font-display text-2xl font-bold text-success-300">{totalConfirmed}</div>
        </div>
        <div className="rounded-xl border border-accent-500/30 bg-accent-500/[0.06] p-4">
          <div className="text-[10px] uppercase tracking-wider text-content-tertiary">Перераспред.</div>
          <div className="mt-1 font-display text-2xl font-bold text-accent-400">{totalReallocated}</div>
        </div>
      </div>

      {/* Общий календарь: день / неделя / месяц (для руководителя) */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-accent-400" />
          <h2 className="font-display text-sm font-semibold text-content-primary">Общий календарь по проектам</h2>
          <span className="text-xs text-content-tertiary">· день / неделя / месяц</span>
        </div>
        <CalendarView
          events={allEvents}
          monthSummaries={allMonthSummaries}
          todayDate={todayDate}
          weekDates={weekDates}
        />
      </section>

      {/* Per-project event summary */}
      <section className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40">
        <div className="border-b border-surface-border px-4 py-3">
          <h2 className="font-display text-sm font-semibold text-content-primary">События по объектам</h2>
        </div>
        <div className="divide-y divide-surface-border/30">
          {projects.map((p) => {
            const evs = p.calendarEvents;
            const delayed = evs.filter((e) => e.status === 'delayed').length;
            const confirmed = evs.filter((e) => e.status === 'confirmed').length;
            const idle = evs.filter((e) => e.status === 'idle').length;
            return (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                <span className={`h-2 w-2 rounded-full ${p.status === 'critical' ? 'bg-danger-500' : p.status === 'warning' ? 'bg-warning-400' : 'bg-success-400'}`} />
                <span className="flex-1 text-sm font-medium text-content-primary">{p.name}</span>
                <span className="text-xs text-content-tertiary">{evs.length} событий</span>
                {delayed > 0 && <span className="inline-flex items-center gap-1 rounded-lg bg-danger-500/15 px-2 py-1 text-xs font-semibold text-danger-300"><AlertTriangle className="h-3 w-3" />{delayed}</span>}
                {idle > 0 && <span className="inline-flex items-center gap-1 rounded-lg bg-warning-400/15 px-2 py-1 text-xs font-semibold text-warning-300"><Clock className="h-3 w-3" />{idle}</span>}
                {confirmed > 0 && <span className="inline-flex items-center gap-1 rounded-lg bg-success-500/15 px-2 py-1 text-xs font-semibold text-success-300"><CheckCircle2 className="h-3 w-3" />{confirmed}</span>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Week heat map */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <CalendarX className="h-4 w-4 text-accent-400" />
          <h2 className="font-display text-sm font-semibold text-content-primary">Загруженность по дням недели</h2>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {weekDates.map((date, i) => {
            const stats = dayStats.get(date);
            const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
            const isToday = date === todayDate;
            const total = stats?.total || 0;
            const delayed = stats?.delayed || 0;
            const intensity = total > 0 ? Math.min(total / 10, 1) : 0;
            return (
              <div key={date} className={`rounded-xl border p-3 ${isToday ? 'border-accent-500/40 bg-accent-500/[0.06]' : 'border-surface-border bg-surface-secondary/40'}`}>
                <div className="text-xs font-medium text-content-tertiary">{weekdayLabels[i]}</div>
                <div className={`font-display text-2xl font-bold ${isToday ? 'text-accent-400' : 'text-content-primary'}`}>{date.split('-')[2]}</div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400" style={{ width: `${intensity * 100}%` }} />
                </div>
                <div className="mt-1.5 text-[10px] text-content-tertiary">{total} событий</div>
                {delayed > 0 && <div className="text-[10px] font-bold text-danger-300">{delayed} задержек</div>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─── CV / Cameras overview ────────────────────────────────────────────────

function CameraOverview({ projects }: { projects: Project[] }) {
  const totalCameras = projects.reduce((s, p) => s + p.summary.cameras, 0);
  const totalDetections = projects.reduce((s, p) => s + p.kpis.totalDetections, 0);
  const totalFrames = projects.reduce((s, p) => s + p.kpis.framesProcessed, 0);
  const avgConfidence = projects.reduce((s, p) => s + p.kpis.avgDetectionConfidence, 0) / projects.length;
  const avgUtilization = projects.reduce((s, p) => s + p.kpis.equipmentUtilization, 0) / projects.length;
  const avgMatching = projects.reduce((s, p) => s + p.kpis.matchingAccuracy, 0) / projects.length;

  // Aggregate equipment observations
  const equipmentCounts = new Map<string, { count: number; activeMin: number; entries: number }>();
  for (const p of projects) {
    for (const obs of p.equipmentObservations) {
      const cur = equipmentCounts.get(obs.equipment) || { count: 0, activeMin: 0, entries: 0 };
      cur.count += obs.avgCountPerDay;
      cur.activeMin += obs.avgActiveMinutes;
      cur.entries++;
      equipmentCounts.set(obs.equipment, cur);
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Aggregate KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Камер всего', value: String(totalCameras), warn: false },
          { label: 'Детекций', value: String(totalDetections), warn: false },
          { label: 'Загрузка техники', value: `${Math.round(avgUtilization * 100)}%`, warn: avgUtilization < 0.5 },
          { label: 'Точность детекции', value: `${Math.round(avgConfidence * 100)}%`, warn: false },
          { label: 'Точность привязки', value: `${Math.round(avgMatching * 100)}%`, warn: false },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-surface-border bg-surface-secondary/40 px-3 py-2.5">
            <div className="text-[10px] text-content-tertiary">{k.label}</div>
            <div className={`mt-1 font-display text-lg font-bold ${k.warn ? 'text-danger-300' : 'text-content-primary'}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Per-project camera summary — no photos */}
      <section className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40">
        <div className="border-b border-surface-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-accent-400" />
            <h2 className="font-display text-sm font-semibold text-content-primary">Камеры по объектам</h2>
          </div>
          <p className="mt-1 text-xs text-content-tertiary">Снимки доступны внутри конкретного объекта</p>
        </div>
        <div className="divide-y divide-surface-border/30">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-4 py-3">
              <span className={`h-2 w-2 rounded-full ${p.status === 'critical' ? 'bg-danger-500' : p.status === 'warning' ? 'bg-warning-400' : 'bg-success-400'}`} />
              <span className="flex-1 text-sm font-medium text-content-primary">{p.name}</span>
              <span className="inline-flex items-center gap-1 text-xs text-content-tertiary"><Camera className="h-3 w-3" /> {p.summary.cameras}</span>
              <span className="text-xs text-content-tertiary">{p.kpis.totalDetections} детекций</span>
              <span className={`text-xs font-semibold ${p.kpis.equipmentUtilization < 0.5 ? 'text-danger-300' : 'text-success-300'}`}>{Math.round(p.kpis.equipmentUtilization * 100)}% загрузка</span>
            </div>
          ))}
        </div>
      </section>

      {/* Equipment distribution across all projects */}
      <section className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40">
        <div className="border-b border-surface-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-accent-400" />
            <h2 className="font-display text-sm font-semibold text-content-primary">Распределение техники по всем объектам</h2>
          </div>
        </div>
        <div className="p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from(equipmentCounts.entries()).map(([eq, data]) => {
              const meta = EQUIPMENT_META[eq as EquipmentType];
              return (
                <div key={eq} className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-tertiary/40 p-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.bg.replace('/15', '/40')}`} />
                  <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                  <span className="ml-auto font-mono text-xs text-content-secondary">{data.count.toFixed(1)}/день</span>
                  <span className="font-mono text-[10px] text-content-tertiary">{Math.round(data.activeMin / data.entries)}мин</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pipeline (static, shared) */}
      <div className="rounded-2xl border border-surface-border bg-surface-secondary/40 p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-content-primary">Конвейер обработки</h3>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { icon: Camera, label: 'Снимки', detail: `${totalCameras} камер · ${totalFrames} кадров/день`, color: 'text-accent-400', bg: 'bg-accent-500/15' },
            { icon: ScanLine, label: 'YOLO детекция', detail: `${totalDetections} объектов`, color: 'text-sky-300', bg: 'bg-sky-400/15' },
            { icon: Layers, label: 'Агрегация', detail: 'подсчёт + тренд', color: 'text-teal-300', bg: 'bg-teal-400/15' },
            { icon: Activity, label: 'Отклонения', detail: `${Math.round(avgMatching * 100)}% точность привязки`, color: 'text-danger-300', bg: 'bg-danger-500/15' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 rounded-xl border border-surface-border ${s.bg} px-3 py-2`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <div>
                  <div className="text-xs font-semibold text-content-primary">{s.label}</div>
                  <div className="text-[10px] text-content-tertiary">{s.detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Methodology overview ─────────────────────────────────────────────────

function MethodologyOverview({ projects }: { projects: Project[] }) {
  const allDeviations = projects.flatMap((p) => p.deviationAnalyses.map((a) => ({ analysis: a, project: p })));
  const critical = allDeviations.filter((d) => d.analysis.overallVerdict === 'critical');
  const warnings = allDeviations.filter((d) => d.analysis.overallVerdict === 'warning');
  const normal = allDeviations.filter((d) => d.analysis.overallVerdict === 'normal');

  const steps = [
    { icon: Target, title: '1. Определяем текущий этап', text: 'По календарному графику — какие работы должны идти в каждой зоне', color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { icon: GitBranch, title: '2. Матрица: какая техника ожидается', text: 'По экспертной матрице «тип техники → вид работ» определяем состав', color: 'text-amber-300', bg: 'bg-amber-400/10' },
    { icon: ScanLine, title: '3. Сравниваем: факт vs ожидание', text: 'По 3 осям: наличие, интенсивность, динамика', color: 'text-sky-300', bg: 'bg-sky-400/10' },
    { icon: AlertTriangle, title: '4. Статус: норма / отклонение / риск', text: 'Правила с порогами дают объяснимый вердикт', color: 'text-danger-300', bg: 'bg-danger-500/10' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Logic explanation */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-accent-400" />
          <h2 className="font-display text-base font-semibold text-content-primary">Методология: как мы выявляем отклонения</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={i} className={`rounded-xl border border-surface-border ${s.bg} p-4 animate-slide-up stagger-${i + 1}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <h4 className="mt-2 text-sm font-semibold text-content-primary">{s.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-content-tertiary">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deviation summary across all projects */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-danger-500/30 bg-danger-500/[0.06] p-4 text-center">
          <div className="font-display text-3xl font-bold text-danger-300">{critical.length}</div>
          <div className="mt-1 text-xs text-content-tertiary">критичных зон</div>
        </div>
        <div className="rounded-xl border border-warning-400/30 bg-warning-400/[0.06] p-4 text-center">
          <div className="font-display text-3xl font-bold text-warning-300">{warnings.length}</div>
          <div className="mt-1 text-xs text-content-tertiary">зон с отклонениями</div>
        </div>
        <div className="rounded-xl border border-success-500/30 bg-success-500/[0.06] p-4 text-center">
          <div className="font-display text-3xl font-bold text-success-300">{normal.length}</div>
          <div className="mt-1 text-xs text-content-tertiary">зон в норме</div>
        </div>
      </div>

      {/* All deviation cards */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-accent-400" />
          <h2 className="font-display text-base font-semibold text-content-primary">Анализ отклонений по всем объектам</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {allDeviations
            .sort((a, b) => {
              const order = { critical: 0, warning: 1, normal: 2 };
              return order[a.analysis.overallVerdict] - order[b.analysis.overallVerdict];
            })
            .map(({ analysis, project }, i) => {
              const meta = DEVIATION_VERDICT_META[analysis.overallVerdict as DeviationVerdict];
              const isCritical = analysis.overallVerdict === 'critical';
              return (
                <article key={`${project.id}-${analysis.zoneId}`} className={`rounded-2xl border ${meta.border} ${meta.bg} p-4 ring-1 ring-surface-border/30 transition-all animate-slide-up stagger-${Math.min(i + 1, 6)} ${isCritical ? 'animate-pulse-ring' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-semibold text-content-primary">{analysis.zoneName}</h3>
                      <p className="mt-0.5 text-xs text-content-tertiary">{analysis.workTitle}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-content-secondary">{project.name}</p>
                    </div>
                    <span className={`shrink-0 rounded-lg border ${meta.border} ${meta.bg} px-2.5 py-1 text-xs font-bold ${meta.text}`}>{meta.label}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-content-tertiary">Ожидается:</span>
                    {analysis.expectedEquipment.map((eq) => {
                      const m = EQUIPMENT_META[eq as EquipmentType];
                      const found = analysis.observedEquipment.includes(eq);
                      return <span key={eq} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] ${m.bg} ${m.color} ${!found ? 'opacity-40 line-through' : ''}`}>{m.shortLabel}</span>;
                    })}
                  </div>
                  <p className="mt-2 text-xs text-content-secondary">{analysis.overallNote}</p>
                </article>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// ─── Risk overview ────────────────────────────────────────────────────────

function RiskOverview({ projects, onOpen }: { projects: Project[]; onOpen: (p: Project) => void }) {
  const sorted = [...projects].sort((a, b) => b.riskScore.total - a.riskScore.total);
  const avgScore = Math.round(projects.reduce((s, p) => s + p.riskScore.total, 0) / projects.length);
  const highRisk = projects.filter((p) => p.riskScore.total >= 70).length;
  const medRisk = projects.filter((p) => p.riskScore.total >= 40 && p.riskScore.total < 70).length;
  const lowRisk = projects.filter((p) => p.riskScore.total < 40).length;

  function RiskGauge({ score }: { score: number }) {
    const circumference = 2 * Math.PI * 52;
    const dashOffset = circumference - (score / 100) * circumference;
    const color = score >= 70 ? '#ef4444' : score >= 40 ? '#fbbf24' : '#34d399';
    return (
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" style={{ stroke: 'rgb(var(--surface-tertiary))' }} />
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} className="animate-grow-bar" style={{ transformOrigin: 'center' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-content-primary">{score}</span>
          <span className="text-[9px] uppercase tracking-wider text-content-tertiary">из 100</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Aggregate risk summary */}
      <section className="rounded-2xl border border-surface-border bg-gradient-to-br from-surface-secondary to-surface-primary p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            <RiskGauge score={avgScore} />
            <div className="text-center">
              <div className={`font-display text-xl font-bold ${avgScore >= 70 ? 'text-danger-300' : avgScore >= 40 ? 'text-warning-300' : 'text-success-300'}`}>
                {avgScore >= 70 ? 'Высокий' : avgScore >= 40 ? 'Средний' : 'Низкий'} риск
              </div>
              <div className="mt-1 text-xs text-content-tertiary">средний по портфелю</div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-accent-400" />
              <h3 className="font-display text-sm font-semibold text-content-primary">Распределение объектов по риску</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-danger-500/30 bg-danger-500/[0.06] p-3 text-center">
                <div className="font-display text-2xl font-bold text-danger-300">{highRisk}</div>
                <div className="text-[10px] text-content-tertiary">высокий риск</div>
              </div>
              <div className="rounded-xl border border-warning-400/30 bg-warning-400/[0.06] p-3 text-center">
                <div className="font-display text-2xl font-bold text-warning-300">{medRisk}</div>
                <div className="text-[10px] text-content-tertiary">средний риск</div>
              </div>
              <div className="rounded-xl border border-success-500/30 bg-success-500/[0.06] p-3 text-center">
                <div className="font-display text-2xl font-bold text-success-300">{lowRisk}</div>
                <div className="text-[10px] text-content-tertiary">низкий риск</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Per-project risk cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {sorted.map((p, i) => {
          const risk = p.riskScore;
          const riskColor = risk.total >= 70 ? 'text-danger-300' : risk.total >= 40 ? 'text-warning-300' : 'text-success-300';
          return (
            <article key={p.id} className={`rounded-2xl border border-surface-border bg-surface-secondary/40 p-5 transition-all cursor-pointer hover:bg-surface-tertiary/30 animate-slide-up stagger-${Math.min(i + 1, 6)}`} onClick={() => onOpen(p)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${p.status === 'critical' ? 'bg-danger-500' : p.status === 'warning' ? 'bg-warning-400' : 'bg-success-400'}`} />
                  <h3 className="font-display text-base font-bold text-content-primary">{p.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-display text-2xl font-bold ${riskColor}`}>{risk.total}</span>
                  <ChevronRight className="h-4 w-4 text-content-muted" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {risk.components.map((comp, ci) => (
                  <span key={ci} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${comp.score >= 70 ? 'bg-danger-500/15 text-danger-300' : comp.score >= 40 ? 'bg-warning-400/15 text-warning-300' : 'bg-success-500/15 text-success-300'}`}>
                    {comp.label}: {comp.score}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-accent-500/20 bg-accent-500/[0.06] px-3 py-2">
                <Lightbulb className="h-3.5 w-3.5 shrink-0 text-accent-400" />
                <p className="text-xs text-content-secondary">{risk.recommendation}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ─── Map overview ─────────────────────────────────────────────────────────

function MapOverview({ projects, onOpen }: { projects: Project[]; onOpen: (p: Project) => void }) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-accent-400" />
        <h2 className="font-display text-base font-semibold text-content-primary">Объекты на карте</h2>
        <span className="text-xs text-content-tertiary">· {projects.length} объекта</span>
      </div>

      {/* Stylized map grid — no camera photos */}
      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-tertiary/50 p-4">
        <div className="relative aspect-[16/9] w-full rounded-xl border border-surface-border-strong/50 bg-surface-primary/60 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
          {projects.map((p, i) => {
            const positions = [
              { x: 10, y: 15, w: 30, h: 35 },
              { x: 45, y: 20, w: 30, h: 30 },
              { x: 20, y: 55, w: 28, h: 30 },
            ];
            const pos = positions[i % positions.length];
            const borderColor = p.status === 'critical' ? 'border-danger-500/50' : p.status === 'warning' ? 'border-warning-400/50' : 'border-success-500/40';
            const bgColor = p.status === 'critical' ? 'bg-danger-500/[0.06]' : p.status === 'warning' ? 'bg-warning-400/[0.04]' : 'bg-success-500/[0.04]';
            const glow = p.status === 'critical' ? 'shadow-[0_0_20px_rgba(239,68,68,0.15)]' : p.status === 'warning' ? 'shadow-[0_0_15px_rgba(251,191,36,0.1)]' : 'shadow-[0_0_15px_rgba(52,211,153,0.08)]';
            return (
              <div key={p.id} className={`absolute rounded-xl border-2 ${borderColor} ${bgColor} ${glow} p-2 transition-all hover:brightness-125 cursor-pointer`} style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${pos.w}%`, height: `${pos.h}%` }} onClick={() => onOpen(p)}>
                <div className="flex items-center gap-1">
                  <Camera className="h-3 w-3 text-accent-400" />
                  <span className="truncate text-[10px] font-semibold text-content-primary">{p.name}</span>
                </div>
                <div className="mt-1.5 space-y-0.5">
                  <div className="text-[9px] text-content-tertiary">{p.address}</div>
                  <div className="text-[9px] text-content-secondary">{p.summary.cameras} камер · {p.summary.totalWorks} работ</div>
                </div>
                <div className="absolute bottom-1.5 left-2 right-2">
                  <div className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold ${p.status === 'critical' ? 'bg-danger-500/20 text-danger-300' : p.status === 'warning' ? 'bg-warning-400/20 text-warning-300' : 'bg-success-500/20 text-success-300'}`}>
                    {p.status === 'critical' ? 'Критично' : p.status === 'warning' ? 'Отклонение' : 'В норме'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-content-tertiary">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded border-2 border-success-500/40" /> в норме</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded border-2 border-warning-400/50" /> отклонение</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-4 rounded border-2 border-danger-500/50" /> критично</span>
        </div>
      </div>

      {/* Per-project zone summary table */}
      <section className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40">
        <div className="border-b border-surface-border px-4 py-3">
          <h2 className="font-display text-sm font-semibold text-content-primary">Зоны по объектам</h2>
        </div>
        <div className="divide-y divide-surface-border/30">
          {projects.map((p) => (
            <div key={p.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${p.status === 'critical' ? 'bg-danger-500' : p.status === 'warning' ? 'bg-warning-400' : 'bg-success-400'}`} />
                <span className="text-sm font-medium text-content-primary">{p.name}</span>
                <span className="ml-auto text-xs text-content-tertiary">{p.siteZones.length} зон</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.deviationAnalyses.map((a) => {
                  const meta = DEVIATION_VERDICT_META[a.overallVerdict];
                  return <span key={a.zoneId} className={`inline-flex items-center gap-1 rounded-md border ${meta.border} ${meta.bg} px-2 py-0.5 text-[10px] font-semibold ${meta.text}`}>{a.zoneName}: {meta.label}</span>;
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────

export function OverviewViews({ projects, mode, onOpen }: Props) {
  switch (mode) {
    case 'planfact':
      return <PlanFactOverview projects={projects} onOpen={onOpen} />;
    case 'calendar':
      return <CalendarOverview projects={projects} />;
    case 'cv':
      return <CameraOverview projects={projects} />;
    case 'methodology':
      return <MethodologyOverview projects={projects} />;
    case 'risk':
      return <RiskOverview projects={projects} onOpen={onOpen} />;
    case 'map':
      return <MapOverview projects={projects} onOpen={onOpen} />;
    default:
      return <PlanFactOverview projects={projects} onOpen={onOpen} />;
  }
}
