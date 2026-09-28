import { AlertTriangle, HelpCircle, CheckCircle2, EyeOff } from 'lucide-react';
import type { CameraVerdict } from '@/data';
import { VERDICT_META } from '@/data';

interface Props {
  verdict: CameraVerdict;
}

export function VerdictBadge({ verdict }: Props) {
  const meta = VERDICT_META[verdict];
  const icons = {
    alert: AlertTriangle,
    help: HelpCircle,
    check: CheckCircle2,
    'eye-off': EyeOff,
  } as const;
  const Icon = icons[meta.icon];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.bg} ${meta.text}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
