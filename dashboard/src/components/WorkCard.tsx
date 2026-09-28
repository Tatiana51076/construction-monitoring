import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Package,
  Timer,
  ArrowDownToLine,
} from 'lucide-react';
import type { WorkItem } from '@/projects';
import { STATUS_META } from '@/data';
import { VerdictBadge } from './VerdictBadge';
import { ProgressBars } from './ProgressBars';

interface Props {
  item: WorkItem;
  index: number;
}

export function WorkCard({ item, index }: Props) {
  const meta = STATUS_META[item.status];
  const isCritical = item.status === 'requires_reaction';
  const delayColor =
    item.delayDays >= 4
      ? 'text-danger-400 bg-danger-500/15 border-danger-500/30'
      : item.delayDays > 0
        ? 'text-warning-300 bg-warning-400/15 border-warning-400/30'
        : 'text-success-300 bg-success-500/15 border-success-500/30';

  return (
    <article
      className={`
        group relative overflow-hidden rounded-2xl border ${meta.border} ${meta.bg}
        p-4 ring-1 ${meta.ring}
        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl
        animate-slide-up stagger-${Math.min(index + 1, 6)}
        ${isCritical ? 'animate-pulse-ring' : ''}
      `}
    >
      {/* Accent left border */}
      <div
        className={`absolute left-0 top-0 h-full w-1 ${meta.dot} ${isCritical ? 'animate-pulse-dot' : ''}`}
      />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-content-primary">{item.title}</h3>
          <p className="mt-0.5 truncate text-xs text-content-tertiary">{item.contractor}</p>
        </div>

        {/* Delay pill: days + hours */}
        <div
          className={`flex shrink-0 flex-col items-center rounded-lg border px-2 py-1 text-xs font-bold ${delayColor}`}
        >
          {item.delayDays > 0 || item.delayHours > 0 ? (
            <>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                +{item.delayDays} дн
              </div>
              {item.delayHours > 0 && (
                <div className="flex items-center gap-0.5 text-[10px] opacity-80">
                  <Timer className="h-2.5 w-2.5" />
                  +{item.delayHours}ч
                </div>
              )}
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              0 дн
            </>
          )}
        </div>
      </div>

      {/* Status + verdict */}
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${meta.text}`}>
          <span className={`h-2 w-2 rounded-full ${meta.dot} ${isCritical ? 'animate-pulse-dot' : ''}`} />
          {meta.label}
        </span>
        <VerdictBadge verdict={item.verdict} />
      </div>

      {/* Фото прораба (если есть) */}
      {item.photoUrl && (
        <div className="mt-3 pl-2">
          <div className="overflow-hidden rounded-lg border border-surface-border bg-surface-tertiary">
            <img
              src={item.photoUrl}
              alt="Фото прораба"
              className="h-32 w-full object-cover"
              loading="lazy"
            />
            {item.photoStatus && (
              <div className={`px-2 py-1 text-[10px] font-semibold ${
                item.photoStatus === 'confirmed' ? 'bg-success-500/15 text-success-300' :
                item.photoStatus === 'not_confirmed' ? 'bg-danger-500/15 text-danger-300' :
                item.photoStatus === 'review' ? 'bg-warning-500/15 text-warning-300' :
                'bg-content-tertiary/15 text-content-tertiary'
              }`}>
                {item.photoStatus === 'confirmed' ? '✓ Выполнено' :
                 item.photoStatus === 'not_confirmed' ? '✗ Не обнаружено' :
                 item.photoStatus === 'review' ? '⚠ Переснять' : 'Не проверяется'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reallocation / received crews badges */}
      {(item.reallocatedCrews || item.receivedCrews) && (
        <div className="mt-2 flex flex-wrap gap-2 pl-2">
          {item.reallocatedCrews && (
            <span className="inline-flex items-center gap-1 rounded-md border border-accent-500/30 bg-accent-500/10 px-2 py-0.5 text-[10px] font-semibold text-accent-400">
              <Users className="h-3 w-3" />
              {item.reallocatedCrews} чел перенаправлены
            </span>
          )}
          {item.receivedCrews && (
            <span className="inline-flex items-center gap-1 rounded-md border border-success-500/30 bg-success-500/10 px-2 py-0.5 text-[10px] font-semibold text-success-300">
              <ArrowDownToLine className="h-3 w-3" />
              +{item.receivedCrews} чел принято
            </span>
          )}
        </div>
      )}

      {/* Critical detail callout */}
      {item.criticalDetail && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-danger-500/20 bg-danger-500/[0.06] px-3 py-2 pl-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger-400" />
          <p className="text-[11px] leading-relaxed text-danger-200">{item.criticalDetail}</p>
        </div>
      )}

      {/* Progress */}
      {item.status !== 'out_of_scope' ? (
        <div className="mt-4 pl-2">
          <ProgressBars
            planPct={item.planPct}
            confirmedPct={item.confirmedPct}
            reportedPct={item.reportedPct}
          />
        </div>
      ) : (
        <div className="mt-4 pl-2">
          <div className="rounded-lg border border-dashed border-surface-border-strong bg-surface-tertiary/50 px-3 py-2.5 text-xs text-content-tertiary">
            <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 text-warning-400" />
            {item.detail}
          </div>
        </div>
      )}

      {/* Detail count footer */}
      <div className="mt-3 flex items-center justify-between border-t border-surface-border/40 pt-2.5 pl-2 text-[10px] text-content-muted">
        <span className="inline-flex items-center gap-1">
          <Package className="h-3 w-3" />
          {item.detailCount} деталей
        </span>
        <span className={`rounded px-1.5 py-0.5 font-medium ${
          item.phase === 'finishing'
            ? 'bg-accent-500/10 text-accent-400'
            : 'bg-surface-tertiary/40 text-content-tertiary'
        }`}>
          {item.phase === 'finishing' ? 'Отделочные' : 'Черновые'}
        </span>
      </div>
    </article>
  );
}
