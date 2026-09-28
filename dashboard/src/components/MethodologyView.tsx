import {
  Grid3x3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitBranch,
  Target,
  ScanLine,
} from 'lucide-react';
import {
  EQUIPMENT_WORK_MATRIX,
  EQUIPMENT_META,
  DEVIATION_VERDICT_META,
  type EquipmentType,
  type DeviationVerdict,
} from '@/data';
import type { Project, DeviationAnalysis } from '@/projects';

// ─── Equipment → Works matching matrix ───────────────────────────────────

function MatchingMatrix() {
  // Collect all unique work type keys
  const workTypes = Array.from(
    new Set(EQUIPMENT_WORK_MATRIX.flatMap((e) => e.workTypes))
  );
  const workTypeLabels: Record<string, string> = {
    earthworks: 'Земляные',
    foundation: 'Фундамент',
    pit: 'Котлован',
    concrete: 'Бетонирование',
    monolith: 'Монолит',
    facade: 'Фасад',
    structure: 'Каркас',
    rebar: 'Армирование',
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-tertiary/50">
      <div className="border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-accent-400" />
          <h3 className="font-display text-sm font-semibold text-content-primary">
            Матрица соответствия «тип техники ↔ вид работ»
          </h3>
        </div>
        <p className="mt-1 text-xs text-content-tertiary">
          Интерпретируемые экспертные правила — основа привязки наблюдений к графику
        </p>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-[10px] uppercase tracking-wider text-content-tertiary">
              <th className="sticky left-0 bg-surface-secondary/95 px-4 py-2 font-semibold">Техника</th>
              {workTypes.map((wt) => (
                <th key={wt} className="px-2 py-2 text-center font-semibold">
                  {workTypeLabels[wt] || wt}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-semibold">Мин. кол-во</th>
              <th className="px-3 py-2 text-center font-semibold">Мин. мин/день</th>
            </tr>
          </thead>
          <tbody>
            {EQUIPMENT_WORK_MATRIX.map((entry) => {
              const meta = EQUIPMENT_META[entry.equipment as EquipmentType];
              return (
                <tr key={entry.equipment} className="border-b border-surface-border/30 hover:bg-surface-tertiary/20">
                  <td className="sticky left-0 bg-surface-secondary/95 px-4 py-2.5">
                    <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                  </td>
                  {workTypes.map((wt) => {
                    const matched = entry.workTypes.includes(wt);
                    return (
                      <td key={wt} className="px-2 py-2.5 text-center">
                        {matched ? (
                          <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-success-400" />
                        ) : (
                          <span className="text-content-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-center font-mono text-xs text-content-primary">
                    {entry.minCount}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-xs text-content-primary">
                    {entry.minDurationMin}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 3-axis deviation analysis ───────────────────────────────────────────

function AxisCard({
  axis,
  verdict,
  expected,
  observed,
  note,
}: {
  axis: string;
  verdict: DeviationVerdict;
  expected?: number;
  observed?: number;
  note: string;
}) {
  const meta = DEVIATION_VERDICT_META[verdict];
  const icons = {
    normal: CheckCircle2,
    warning: AlertTriangle,
    critical: XCircle,
  };
  const Icon = icons[verdict];

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-3`}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
          {axis}
        </span>
        <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] font-bold ${meta.text}`}>
          <Icon className="h-3 w-3 shrink-0" />
          {meta.label}
        </span>
      </div>
      {expected !== undefined && observed !== undefined && (
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-mono text-sm text-content-primary">{observed}</span>
          <span className="text-[10px] text-content-muted">/ {expected} ожид.</span>
        </div>
      )}
      <p className="mt-1 text-[11px] leading-relaxed text-content-secondary">{note}</p>
    </div>
  );
}

function DeviationCard({
  analysis,
  index,
}: {
  analysis: DeviationAnalysis;
  index: number;
}) {
  const meta = DEVIATION_VERDICT_META[analysis.overallVerdict];
  const isCritical = analysis.overallVerdict === 'critical';

  return (
    <article
      className={`rounded-2xl border ${meta.border} ${meta.bg} p-4 ring-1 ring-surface-border/30 transition-all animate-slide-up stagger-${Math.min(index + 1, 6)} ${
        isCritical ? 'animate-pulse-ring' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-content-primary">{analysis.zoneName}</h3>
          <p className="mt-0.5 text-xs text-content-tertiary">{analysis.workTitle}</p>
        </div>
        <span className={`shrink-0 rounded-lg border ${meta.border} ${meta.bg} px-2.5 py-1 text-xs font-bold ${meta.text}`}>
          {meta.label}
        </span>
      </div>

      {/* Expected vs observed equipment */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-content-tertiary">Ожидается:</span>
        {analysis.expectedEquipment.map((eq) => {
          const m = EQUIPMENT_META[eq as EquipmentType];
          const found = analysis.observedEquipment.includes(eq);
          return (
            <span
              key={eq}
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] ${m.bg} ${m.color} ${
                !found ? 'opacity-40 line-through' : ''
              }`}
            >
              {m.shortLabel}
            </span>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-content-secondary">{analysis.overallNote}</p>

      {/* 3 axes */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <AxisCard
          axis="Наличие"
          verdict={analysis.axes.presence.verdict}
          expected={analysis.axes.presence.expected}
          observed={analysis.axes.presence.observed}
          note={analysis.axes.presence.note}
        />
        <AxisCard
          axis="Интенсивность"
          verdict={analysis.axes.intensity.verdict}
          expected={analysis.axes.intensity.expected}
          observed={analysis.axes.intensity.observed}
          note={analysis.axes.intensity.note}
        />
        <AxisCard
          axis="Динамика"
          verdict={analysis.axes.dynamics.verdict}
          note={analysis.axes.dynamics.note}
        />
      </div>
    </article>
  );
}

// ─── Logic explanation ───────────────────────────────────────────────────

function LogicExplanation() {
  const steps = [
    {
      icon: Target,
      title: '1. Определяем текущий этап',
      text: 'По календарному графику на сегодня — какие работы должны идти в каждой зоне',
      color: 'text-accent-400',
      bg: 'bg-accent-500/10',
    },
    {
      icon: GitBranch,
      title: '2. Матрица: какая техника ожидается',
      text: 'По экспертной матрице «тип техники → вид работ» определяем ожидаемый состав оборудования',
      color: 'text-amber-300',
      bg: 'bg-amber-400/10',
    },
    {
      icon: ScanLine,
      title: '3. Сравниваем: факт vs ожидание',
      text: 'По 3 осям: наличие (есть ли?), интенсивность (достаточно ли?), динамика (как меняется?)',
      color: 'text-sky-300',
      bg: 'bg-sky-400/10',
    },
    {
      icon: AlertTriangle,
      title: '4. Статус: норма / отклонение / риск',
      text: 'Правила с порогами дают объяснимый вердикт — жюри понимает за минуту',
      color: 'text-danger-300',
      bg: 'bg-danger-500/10',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <div
          key={i}
          className={`rounded-xl border border-surface-border ${s.bg} p-4 animate-slide-up stagger-${i + 1}`}
        >
          <s.icon className={`h-5 w-5 ${s.color}`} />
          <h4 className="mt-2 text-sm font-semibold text-content-primary">{s.title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-content-tertiary">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

interface MethodologyViewProps {
  project: Project;
}

export function MethodologyView({ project }: MethodologyViewProps) {
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Logic explanation */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-accent-400" />
          <h2 className="font-display text-base font-semibold text-content-primary">
            Методология: как мы выявляем отклонения
          </h2>
        </div>
        <LogicExplanation />
      </div>

      {/* Matching matrix */}
      <MatchingMatrix />

      {/* Deviation analyses */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-accent-400" />
          <h2 className="font-display text-base font-semibold text-content-primary">
            Анализ отклонений по 3 осям
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {project.deviationAnalyses.map((a, i) => (
            <DeviationCard key={a.zoneId} analysis={a} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
