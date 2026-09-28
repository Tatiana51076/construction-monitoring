import { CalendarDays, CalendarRange, Calendar } from 'lucide-react';
import type { CalendarScale } from '@/data';

interface Props {
  scale: CalendarScale;
  onChange: (s: CalendarScale) => void;
}

const SCALES: { value: CalendarScale; label: string; icon: typeof CalendarDays }[] = [
  { value: 'day', label: 'День', icon: Calendar },
  { value: 'week', label: 'Неделя', icon: CalendarDays },
  { value: 'month', label: 'Месяц', icon: CalendarRange },
];

export function TimeScaleSwitcher({ scale, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl border border-surface-border bg-surface-secondary/80 p-1">
      {SCALES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            scale === value
              ? 'bg-accent-500/20 text-accent-400 shadow-sm'
              : 'text-content-tertiary hover:bg-surface-tertiary hover:text-content-secondary'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
