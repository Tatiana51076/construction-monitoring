import { useMemo } from 'react';

interface Props {
  planPct: number;
  confirmedPct: number;
  reportedPct?: number;
}

export function ProgressBars({ planPct, confirmedPct, reportedPct }: Props) {
  const gap = Math.max(0, planPct - confirmedPct);

  const segments = useMemo(() => {
    const confirmedW = confirmedPct;
    const gapW = gap;
    const restW = Math.max(0, 100 - confirmedPct - gap);
    return { confirmedW, gapW, restW };
  }, [confirmedPct, gap]);

  return (
    <div className="space-y-1.5">
      {/* Single stacked bar: confirmed | gap | remaining */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-tertiary">
        {/* Plan marker line */}
        <div
          className="absolute top-0 z-20 h-full w-0.5 bg-warning-300"
          style={{ left: `${planPct}%` }}
          title={`План ${planPct}%`}
        >
          <span className="absolute -top-1 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold text-warning-300">
            ▼
          </span>
        </div>

        {/* Reported (ghost) bar if present */}
        {reportedPct !== undefined && (
          <div
            className="absolute top-0 h-full rounded-full border border-dashed border-content-muted/50"
            style={{ width: `${reportedPct}%` }}
            title={`Заявлено ${reportedPct}%`}
          />
        )}

        {/* Confirmed (solid green) */}
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-success-500 to-success-400 animate-grow-bar"
          style={{ width: `${segments.confirmedW}%`, transformOrigin: 'left' }}
        />
        {/* Gap (pulsing red) */}
        {segments.gapW > 0 && (
          <div
            className="absolute top-0 h-full rounded-full bg-gradient-to-r from-danger-500 to-danger-400 animate-pulse-dot"
            style={{ left: `${segments.confirmedW}%`, width: `${segments.gapW}%` }}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-success-300"> факт {confirmedPct}%</span>
        {reportedPct !== undefined && (
          <span className="text-content-tertiary"> заявлено {reportedPct}%</span>
        )}
        <span className="text-content-tertiary">план {planPct}%</span>
      </div>
    </div>
  );
}
