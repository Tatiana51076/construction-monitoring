import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, FolderKanban, Search, Eye } from 'lucide-react';
import type { Project } from '@/projects';

interface Props {
  projects: Project[];
  pinnedIds: string[];
  onPinnedChange: (ids: string[]) => void;
  onOpen: (project: Project) => void;
}

const statusDot = (status: Project['status']) =>
  status === 'critical' ? 'bg-danger-500' : status === 'warning' ? 'bg-warning-400' : 'bg-success-400';

const statusLabel = (status: Project['status']) =>
  status === 'critical' ? 'Критические' : status === 'warning' ? 'Отклонения' : 'В норме';

export function ProjectSelector({ projects, pinnedIds, onPinnedChange, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.address.toLowerCase().includes(query.toLowerCase())
  );

  function togglePin(id: string) {
    if (pinnedIds.includes(id)) {
      onPinnedChange(pinnedIds.filter((x) => x !== id));
    } else {
      onPinnedChange([...pinnedIds, id]);
    }
  }

  function selectAll() {
    onPinnedChange(projects.map((p) => p.id));
  }

  function clearAll() {
    onPinnedChange([]);
  }

  const label = pinnedIds.length === 0
    ? 'Проекты'
    : pinnedIds.length === 1
      ? `Проекты · ${projects.find((p) => p.id === pinnedIds[0])?.name || '1'}`
      : `Проекты · ${pinnedIds.length}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-secondary px-3 py-2 text-sm font-semibold text-content-primary transition-all hover:bg-surface-tertiary"
      >
        <FolderKanban className="h-4 w-4 text-accent-400" />
        <span className="max-w-[200px] truncate">{label}</span>
        <ChevronDown className={`h-4 w-4 text-content-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-2xl border border-surface-border bg-surface-secondary p-3 shadow-2xl animate-slide-up">
          {/* Search */}
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-surface-tertiary px-2.5 py-2">
            <Search className="h-3.5 w-3.5 text-content-tertiary" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск проекта или адреса…"
              className="w-full bg-transparent text-sm text-content-primary placeholder:text-content-muted focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="mb-2 flex items-center justify-between border-b border-surface-border pb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
              <Eye className="h-3 w-3" />
              На главный экран
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="text-xs font-semibold text-accent-400 hover:text-accent-500"
              >
                Все
              </button>
              {pinnedIds.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs font-semibold text-content-tertiary hover:text-danger-400"
                >
                  Снять
                </button>
              )}
            </div>
          </div>

          {/* Project list */}
          <div className="max-h-72 space-y-0.5 overflow-y-auto">
            {filtered.map((p) => {
              const isPinned = pinnedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all hover:bg-surface-tertiary"
                >
                  {/* Checkbox to pin to main screen */}
                  <button
                    onClick={() => togglePin(p.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                      isPinned ? 'border-accent-500 bg-accent-500' : 'border-surface-border-strong'
                    }`}
                  >
                    {isPinned && <Check className="h-3 w-3 text-white" />}
                  </button>

                  <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot(p.status)}`} />

                  {/* Click name to open project */}
                  <button
                    onClick={() => { onOpen(p); setOpen(false); setQuery(''); }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-sm font-medium text-content-primary transition-colors hover:text-accent-400">{p.name}</div>
                    <div className="truncate text-[10px] text-content-tertiary">{p.address}</div>
                  </button>

                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                    p.status === 'critical'
                      ? 'bg-danger-500/15 text-danger-400'
                      : p.status === 'warning'
                        ? 'bg-warning-400/15 text-warning-300'
                        : 'bg-success-500/15 text-success-300'
                  }`}>
                    {statusLabel(p.status)}
                  </span>
                  {p.status !== 'normal' && (
                    <span className="shrink-0 rounded-md bg-surface-tertiary px-1.5 py-0.5 text-[9px] font-bold text-content-secondary">
                      {p.riskScore.total}
                    </span>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-6 text-center text-xs text-content-tertiary">
                Ничего не найдено
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
