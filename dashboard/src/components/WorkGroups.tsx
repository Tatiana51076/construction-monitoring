import { AlertTriangle, HelpCircle, Activity, EyeOff } from 'lucide-react';
import type { WorkStatus } from '@/data';
import { STATUS_META } from '@/data';
import type { WorkItem } from '@/projects';
import { WorkCard } from './WorkCard';

const GROUPS: { status: WorkStatus; icon: typeof AlertTriangle }[] = [
  { status: 'requires_reaction', icon: AlertTriangle },
  { status: 'ask_reason', icon: HelpCircle },
  { status: 'in_progress', icon: Activity },
  { status: 'out_of_scope', icon: EyeOff },
];

interface WorkGroupsProps {
  workItems: WorkItem[];
}

export function WorkGroups({ workItems }: WorkGroupsProps) {
  return (
    <div className="space-y-7">
      {GROUPS.map(({ status, icon: Icon }) => {
        const items = workItems.filter((w) => w.status === status);
        if (items.length === 0) return null;
        const meta = STATUS_META[status];

        return (
          <section key={status}>
            <div className="mb-3 flex items-center gap-2.5">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.bg} ${meta.text}`}>
                <Icon className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-semibold text-content-primary">{meta.label}</h2>
              <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-bold text-content-secondary">
                {items.length}
              </span>
              <div className="ml-2 h-px flex-1 bg-surface-border" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item, i) => (
                <WorkCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
