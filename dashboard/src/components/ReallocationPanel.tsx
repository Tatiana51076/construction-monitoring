import { Users, AlertTriangle, Truck, Wrench, Shield, TrendingDown, ArrowRight } from 'lucide-react';
import { WEAK_LINK_META } from '@/data';
import type { Reallocation, WeakLink, ProjectSummary } from '@/projects';

const WEAK_LINK_ICONS = {
  truck: Truck,
  wrench: Wrench,
  users: Users,
  'cloud-rain': AlertTriangle,
} as const;

interface ReallocationPanelProps {
  reallocations: Reallocation[];
  weakLinks: WeakLink[];
  summary: ProjectSummary;
}

export function ReallocationPanel({ reallocations, weakLinks, summary }: ReallocationPanelProps) {
  return (
    <section className="space-y-5">
      {/* Compensation summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Net delay card */}
        <div className="rounded-2xl border border-danger-500/30 bg-danger-500/[0.06] p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-500/20">
              <TrendingDown className="h-4 w-4 text-danger-400" />
            </span>
            <h3 className="font-display text-sm font-semibold text-content-primary">Суммарное отставание</h3>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold text-danger-300">{summary.totalDelayDays}</span>
            <span className="text-sm text-content-tertiary">рабочих дней</span>
          </div>
          <p className="mt-1 text-xs text-content-tertiary">{summary.totalDelayHours}ч опозданий по критичным деталям</p>
        </div>

        {/* Compensation card */}
        <div className="rounded-2xl border border-accent-500/30 bg-accent-500/[0.06] p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/20">
              <Users className="h-4 w-4 text-accent-400" />
            </span>
            <h3 className="font-display text-sm font-semibold text-content-primary">Компенсировано</h3>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold text-accent-400">{summary.compensatedDays}</span>
            <span className="text-sm text-content-tertiary">рабочих дней</span>
          </div>
          <p className="mt-1 text-xs text-content-tertiary">
            За счёт перенаправления {reallocations.reduce((s, r) => s + r.crewCount, 0)} человек на опережающие работы
          </p>
        </div>

        {/* Penalty risk card */}
        <div
          className={`rounded-2xl border p-5 ${
            summary.penaltyRisk
              ? 'border-danger-500/40 bg-danger-500/10'
              : 'border-success-500/30 bg-success-500/[0.06]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                summary.penaltyRisk ? 'bg-danger-500/20' : 'bg-success-500/20'
              }`}
            >
              <Shield
                className={`h-4 w-4 ${summary.penaltyRisk ? 'text-danger-400' : 'text-success-300'}`}
              />
            </span>
            <h3 className="font-display text-sm font-semibold text-content-primary">Риск штрафа</h3>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span
              className={`font-display text-3xl font-bold ${
                summary.penaltyRisk ? 'text-danger-300' : 'text-success-300'
              }`}
            >
              {summary.penaltyRisk ? 'ЕСТЬ' : 'НЕТ'}
            </span>
            <span className="text-sm text-content-tertiary">· {summary.netDelayDays} дн чистая задержка</span>
          </div>
          <p className="mt-1 text-xs text-content-tertiary">{summary.penaltyNote}</p>
        </div>
      </div>

      {/* Reallocation flow */}
      <div className="rounded-2xl border border-surface-border bg-surface-tertiary/50 p-5">
        <h3 className="font-display text-base font-semibold text-content-primary">Перенаправление бригад</h3>
        <p className="mt-1 text-xs text-content-tertiary">
          Прораб перенаправил людей с простаивающих работ на опережающие — сроки компенсируются, но слабое звено видно
        </p>

        <div className="mt-4 space-y-3">
          {reallocations.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-accent-500/20 bg-accent-500/[0.04] p-4 sm:flex-row sm:items-center"
            >
              {/* From */}
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-danger-300">Откуда</div>
                <div className="mt-1 text-sm font-medium text-content-primary">{r.fromTitle}</div>
                <div className="text-xs text-content-tertiary">Простой из-за поставки</div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-2 text-accent-400">
                <div className="flex flex-col items-center">
                  <span className="rounded-lg bg-accent-500/15 px-2 py-0.5 text-xs font-bold text-accent-400">
                    {r.crewCount} чел
                  </span>
                  <ArrowRight className="hidden h-5 w-5 sm:block" />
                  <ArrowRight className="h-5 w-5 rotate-90 sm:hidden" />
                </div>
              </div>

              {/* To */}
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-success-300">Куда</div>
                <div className="mt-1 text-sm font-medium text-content-primary">{r.toTitle}</div>
                <div className="text-xs text-content-tertiary">Опережение графика</div>
              </div>

              {/* Compensation */}
              <div className="shrink-0 text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">Компенсация</div>
                <div className="mt-1 font-display text-lg font-bold text-accent-400">+{r.compensationDays} дн</div>
                <div className="text-[10px] text-content-tertiary">{r.hoursRedirected}ч перенаправлено</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak links */}
      <div className="rounded-2xl border border-warning-400/20 bg-warning-400/[0.03] p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-400/15">
            <AlertTriangle className="h-4 w-4 text-warning-300" />
          </span>
          <h3 className="font-display text-base font-semibold text-content-primary">Слабые звенья</h3>
        </div>
        <p className="mt-1 text-xs text-content-tertiary">
          Корневые причины задержек — кто тянет сроки и почему
        </p>

        <div className="mt-4 space-y-3">
          {weakLinks.map((wl) => {
            const meta = WEAK_LINK_META[wl.type];
            const Icon = WEAK_LINK_ICONS[meta.icon];
            return (
              <div
                key={wl.id}
                className={`rounded-xl border ${meta.bg} border-surface-border/60 p-4 transition-all hover:border-warning-400/30`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.text}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${meta.text}`}>
                        {meta.label}
                      </span>
                      <span className="rounded-full bg-danger-500/15 px-2 py-0.5 text-[10px] font-bold text-danger-300">
                        +{wl.delayContributionDays} дн {wl.delayContributionHours > 0 && `${wl.delayContributionHours}ч`}
                      </span>
                    </div>
                    <h4 className="mt-1 text-sm font-semibold text-content-primary">{wl.name}</h4>
                    <p className="mt-1 text-xs text-content-tertiary">{wl.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {wl.affectedWorkTitles.map((title) => (
                        <span
                          key={title}
                          className="rounded-md border border-surface-border-strong/50 bg-surface-tertiary/40 px-2 py-0.5 text-[10px] text-content-secondary"
                        >
                          {title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
