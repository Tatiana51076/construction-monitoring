import { Phone, Mail, User } from 'lucide-react';
import type { ProjectContact } from '@/projects';

interface ContactCardProps {
  contact: ProjectContact;
  projectName?: string;
}

export function ContactCard({ contact, projectName }: ContactCardProps) {
  return (
    <section className="rounded-2xl border border-surface-border bg-gradient-to-br from-surface-secondary to-surface-primary p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15">
          <User className="h-4 w-4 text-accent-400" />
        </span>
        <div>
          <h3 className="font-display text-sm font-semibold text-content-primary">С кем связаться</h3>
          {projectName && <p className="text-xs text-content-tertiary">{projectName}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-tertiary/50 px-4 py-3 sm:flex-1">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500/15">
            <User className="h-5 w-5 text-accent-400" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">Ответственный</div>
            <div className="truncate text-sm font-semibold text-content-primary">{contact.name}</div>
          </div>
        </div>

        <a
          href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
          className="flex min-w-0 items-center gap-3 rounded-xl border border-surface-border bg-surface-tertiary/50 px-4 py-3 transition hover:border-accent-500/30 hover:bg-accent-500/[0.06] sm:flex-1"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-500/15">
            <Phone className="h-5 w-5 text-success-300" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">Телефон</div>
            <div className="truncate text-sm font-semibold text-content-primary">{contact.phone}</div>
          </div>
        </a>

        <a
          href={`mailto:${contact.email}`}
          className="flex min-w-0 items-center gap-3 rounded-xl border border-surface-border bg-surface-tertiary/50 px-4 py-3 transition hover:border-accent-500/30 hover:bg-accent-500/[0.06] sm:flex-1"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500/15">
            <Mail className="h-5 w-5 text-accent-400" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">Эл. почта</div>
            <div className="truncate text-sm font-semibold text-content-primary">{contact.email}</div>
          </div>
        </a>
      </div>
    </section>
  );
}
