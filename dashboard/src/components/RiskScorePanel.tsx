import { Gauge, Lightbulb } from 'lucide-react';
import type { RiskScore } from '@/projects';

function RiskGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#fbbf24' : '#34d399';

  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="animate-grow-bar"
          style={{ transformOrigin: 'center' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold text-content-primary">{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-content-tertiary">из 100</span>
      </div>
    </div>
  );
}

interface RiskScorePanelProps {
  riskScore: RiskScore;
}

export function RiskScorePanel({ riskScore }: RiskScorePanelProps) {
  const riskColor =
    riskScore.total >= 70
      ? 'text-danger-300'
      : riskScore.total >= 40
        ? 'text-warning-300'
        : 'text-success-300';

  return (
    <section className="rounded-2xl border border-surface-border bg-gradient-to-br from-surface-secondary to-surface-primary p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Gauge + verdict */}
        <div className="flex flex-col items-center gap-3">
          <RiskGauge score={riskScore.total} />
          <div className="text-center">
            <div className={`font-display text-xl font-bold ${riskColor}`}>
              {riskScore.verdict} риск
            </div>
            <div className="mt-1 text-xs text-content-tertiary">срыва сроков</div>
          </div>
        </div>

        {/* Components */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-accent-400" />
            <h3 className="font-display text-sm font-semibold text-content-primary">
              Компоненты риска
            </h3>
          </div>

          {riskScore.components.map((comp, i) => (
            <div key={i} className="rounded-xl border border-surface-border bg-surface-tertiary/50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-content-primary">{comp.label}</span>
                  <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[9px] text-content-tertiary">
                    вес {comp.weight}%
                  </span>
                </div>
                <span
                  className={`font-mono text-sm font-bold ${
                    comp.score >= 70
                      ? 'text-danger-300'
                      : comp.score >= 40
                        ? 'text-warning-300'
                        : 'text-success-300'
                  }`}
                >
                  {comp.score}/100
                </span>
              </div>

              {/* Bar */}
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-tertiary">
                <div
                  className={`h-full rounded-full ${
                    comp.score >= 70
                      ? 'bg-gradient-to-r from-danger-600 to-danger-400'
                      : comp.score >= 40
                        ? 'bg-gradient-to-r from-warning-600 to-warning-400'
                        : 'bg-gradient-to-r from-success-600 to-success-400'
                  } animate-grow-bar`}
                  style={{ width: `${comp.score}%`, transformOrigin: 'left' }}
                />
              </div>

              <p className="mt-1.5 text-[11px] text-content-tertiary">{comp.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent-500/20 bg-accent-500/[0.06] px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/20">
          <Lightbulb className="h-4 w-4 text-accent-400" />
        </span>
        <div>
          <div className="text-xs font-semibold text-accent-400">Рекомендация системы</div>
          <p className="mt-1 text-sm text-content-primary">{riskScore.recommendation}</p>
        </div>
      </div>
    </section>
  );
}
