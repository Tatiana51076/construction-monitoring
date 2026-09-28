import type { ProjectSummary } from '@/projects';

interface Props {
  summary: ProjectSummary;
}

export function ProgressDial({ summary }: Props) {
  const { confirmedPct, planPct, gapPct } = summary;
  const confirmedDeg = (confirmedPct / 100) * 360;
  const planDeg = (planPct / 100) * 360;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="absolute -inset-3 rounded-full opacity-20 blur-2xl dial-sheen animate-shimmer" style={{ backgroundSize: '200% 200%' }} />
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(var(--surface-tertiary))" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(planDeg / 360) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} opacity="0.35" className="animate-grow-bar" style={{ transformOrigin: 'center' }} />
          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#confirmedGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(confirmedDeg / 360) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} className="animate-grow-bar" style={{ transformOrigin: 'center', animationDelay: '0.15s' }} />
          <defs>
            <linearGradient id="confirmedGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold text-content-primary">{confirmedPct}%</span>
          <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-content-tertiary">подтверждено</span>
        </div>
      </div>
      <span className="mt-2 text-xs text-content-secondary">план {planPct}% · разрыв {gapPct} п.п.</span>
    </div>
  );
}
