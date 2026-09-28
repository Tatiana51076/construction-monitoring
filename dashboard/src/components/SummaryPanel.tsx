import {
  AlertTriangle,
  HelpCircle,
  Activity,
  EyeOff,
  Camera,
  Calendar,
  Layers,
  Shield,
  Users,
  Package,
  Timer,
} from 'lucide-react';
import type { ProjectSummary } from '@/projects';
import { ProgressDial } from './ProgressDial';

interface StatCardProps {
  label: string;
  value: number;
  icon: typeof AlertTriangle;
  accent: string;
  ring: string;
}

function StatCard({ label, value, icon: Icon, accent, ring }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border ${ring} bg-surface-tertiary/50 p-3`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-display text-2xl font-bold text-content-primary">{value}</span>
      </div>
      <p className="mt-1.5 text-xs text-content-tertiary">{label}</p>
    </div>
  );
}

interface SummaryPanelProps {
  summary: ProjectSummary;
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  return (
    <section className="rounded-3xl border border-surface-border bg-gradient-to-br from-surface-secondary to-surface-primary p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-content-tertiary">
            <span className="rounded-md bg-surface-tertiary px-2 py-0.5">Объектив</span>
            <span>·</span>
            <span>План / Факт по работам</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-content-primary text-balance">
            {summary.objectName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-content-tertiary">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {summary.dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> {summary.schedule}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" /> {summary.cameras} камеры
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> {summary.totalWorks} работ
            </span>
          </div>
        </div>

        {/* Dial */}
        <ProgressDial summary={summary} />
      </div>

      {/* Gap callout */}
      <div className="mt-5 flex items-center gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger-500/20 animate-pulse-dot">
          <AlertTriangle className="h-5 w-5 text-danger-400" />
        </span>
        <p className="text-sm text-content-primary">
          По графику объект должен быть готов на{' '}
          <strong className="text-warning-300">{summary.planPct}%</strong>, камера подтверждает{' '}
          <strong className="text-success-300">{summary.confirmedPct}%</strong>. Разрыв —{' '}
          <strong className="text-danger-300">{summary.gapPct} п.п.</strong> (≈{summary.gapDays}{' '}
          рабочих дней отставания)
        </p>
      </div>

      {/* Compensation row */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-accent-500/25 bg-accent-500/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent-400" />
            <span className="text-xs font-semibold text-content-secondary">Компенсировано</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-xl font-bold text-accent-400">{summary.compensatedDays} дн</span>
            <span className="text-xs text-content-tertiary">из {summary.totalDelayDays}</span>
          </div>
        </div>

        <div className="rounded-xl border border-danger-500/25 bg-danger-500/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-danger-400" />
            <span className="text-xs font-semibold text-content-secondary">Часовые опоздания</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-xl font-bold text-danger-300">{summary.totalDelayHours}ч</span>
            <span className="text-xs text-content-tertiary">по критичным деталям</span>
          </div>
        </div>

        <div
          className={`rounded-xl border px-4 py-3 ${
            summary.penaltyRisk
              ? 'border-danger-500/30 bg-danger-500/10'
              : 'border-success-500/25 bg-success-500/[0.06]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield
              className={`h-4 w-4 ${summary.penaltyRisk ? 'text-danger-400' : 'text-success-300'}`}
            />
            <span className="text-xs font-semibold text-content-secondary">Штраф застройщику</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span
              className={`font-display text-xl font-bold ${
                summary.penaltyRisk ? 'text-danger-300' : 'text-success-300'
              }`}
            >
              {summary.penaltyRisk ? 'Риск' : 'Нет риска'}
            </span>
            <span className="text-xs text-content-tertiary">· {summary.netDelayDays} дн чистых</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Требует реакции"
          value={summary.requiresReaction}
          icon={AlertTriangle}
          accent="bg-danger-500/20 text-danger-400"
          ring="border-danger-500/30"
        />
        <StatCard
          label="Спросить причину"
          value={summary.askReason}
          icon={HelpCircle}
          accent="bg-warning-400/20 text-warning-300"
          ring="border-warning-400/30"
        />
        <StatCard
          label="Идёт"
          value={summary.inProgress}
          icon={Activity}
          accent="bg-success-500/20 text-success-300"
          ring="border-success-500/30"
        />
        <StatCard
          label="Вне охвата"
          value={summary.outOfScope}
          icon={EyeOff}
          accent="bg-surface-tertiary/40 text-content-secondary"
          ring="border-surface-border-strong/40"
        />
      </div>

      {/* Detail count bar */}
      <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-surface-border bg-surface-tertiary/50 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-secondary">
          <Package className="h-3.5 w-3.5" /> Номенклатура деталей
        </span>
        <div className="flex flex-1 items-center gap-2">
          <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-surface-tertiary">
            <div
              className="h-full bg-gradient-to-r from-content-muted to-content-tertiary"
              style={{ width: `${(summary.roughDetailCount / summary.totalDetailCount) * 100}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-accent-500 to-accent-400"
              style={{ width: `${(summary.finishingDetailCount / summary.totalDetailCount) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-content-tertiary">
            <span className="h-2 w-3 rounded-full bg-content-tertiary" />
            черновые {summary.roughDetailCount}
          </span>
          <span className="inline-flex items-center gap-1 text-accent-400">
            <span className="h-2 w-3 rounded-full bg-accent-400" />
            отделочные {summary.finishingDetailCount}
          </span>
          <span className="font-semibold text-content-primary">· {summary.totalDetailCount} всего</span>
        </div>
      </div>
    </section>
  );
}
