import { useState, useEffect } from 'react';
import { PROJECTS, type Project, loadLiveWorks } from '@/projects';
import { SummaryPanel } from '@/components/SummaryPanel';
import { WorkGroups } from '@/components/WorkGroups';
import { ReallocationPanel } from '@/components/ReallocationPanel';
import { CalendarView } from '@/components/CalendarView';
import { CameraDetectionView } from '@/components/CameraDetectionView';
import { MethodologyView } from '@/components/MethodologyView';
import { RiskScorePanel } from '@/components/RiskScorePanel';
import { SiteMapView } from '@/components/SiteMapView';
import { ProjectList } from '@/components/ProjectList';
import { ProjectSelector } from '@/components/ProjectSelector';
import { OverviewViews } from '@/components/OverviewViews';
import { ContactCard } from '@/components/ContactCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  LayoutGrid,
  CalendarRange,
  Camera,
  GitBranch,
  ShieldAlert,
  Map,
  ArrowLeft,
  FolderKanban,
  CheckCircle2,
  HelpCircle,
  Activity,
  EyeOff,
  Users,
  Package,
  Wrench,
} from 'lucide-react';

type ViewMode = 'planfact' | 'calendar' | 'cv' | 'methodology' | 'risk' | 'map';

const VIEWS: { mode: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { mode: 'planfact', label: 'План / Факт', icon: LayoutGrid },
  { mode: 'calendar', label: 'Календарь', icon: CalendarRange },
  { mode: 'cv', label: 'Камеры / CV', icon: Camera },
  { mode: 'methodology', label: 'Методология', icon: GitBranch },
  { mode: 'risk', label: 'Риск', icon: ShieldAlert },
  { mode: 'map', label: 'Карта', icon: Map },
];

const LEGEND = [
  { icon: Activity, label: 'Работа идёт', color: 'text-success-300' },
  { icon: HelpCircle, label: 'Только ресурсы — спросить причину', color: 'text-warning-300' },
  { icon: CheckCircle2, label: 'Ничего не обнаружено', color: 'text-danger-300' },
  { icon: EyeOff, label: 'Не проверяется', color: 'text-content-tertiary' },
  { icon: Users, label: 'Перераспределение бригад', color: 'text-accent-400' },
];

const VALID_MODES: ViewMode[] = ['planfact', 'calendar', 'cv', 'methodology', 'risk', 'map'];

function parseHash(): { projectId: string | null; mode: ViewMode } {
  const h = window.location.hash.replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  const first = parts[0] || '';
  if (PROJECTS.some((p) => p.id === first)) {
    return { projectId: first, mode: (parts[1] as ViewMode) || 'planfact' };
  }
  return { projectId: null, mode: VALID_MODES.includes(first as ViewMode) ? (first as ViewMode) : 'planfact' };
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => {
    const id = parseHash().projectId;
    return PROJECTS.find((p) => p.id === id) || null;
  });
  const [mode, setMode] = useState<ViewMode>(() => parseHash().mode);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [devMode, setDevMode] = useState(false);
  const [liveData, setLiveData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveKey, setLiveKey] = useState(0);

  // Что показывать на экране:
  //  - выбраны проекты → только они;
  //  - ничего не выбрано → все проблемные (беспроблемные не выводим).
  const visibleProjects =
    pinnedIds.length > 0
      ? PROJECTS.filter((p) => pinnedIds.includes(p.id))
      : PROJECTS.filter((p) => p.status !== 'normal');


  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    function onHashChange() {
      const { projectId, mode: m } = parseHash();
      setSelectedProject(PROJECTS.find((p) => p.id === projectId) || null);
      setMode(m);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setLiveData(null);
      return;
    }
    setLoading(true);
    // Пытаемся загрузить живые данные с сервера (если доступен)
    loadLiveWorks(selectedProject.workItems, devMode ? '' : undefined)
      .then(liveWorks => {
        setLiveData({ ...selectedProject, workItems: liveWorks });
      })
      .catch(() => {
        setLiveData(selectedProject); // fallback на демо
      })
      .finally(() => setLoading(false));
  }, [selectedProject, devMode, liveKey]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function navigate(projectId: string | null, m: ViewMode = 'planfact') {
    window.location.hash = projectId ? `/${projectId}/${m}` : (m === 'planfact' ? '/' : `/${m}`);
  }

  function openProject(project: Project) {
    navigate(project.id, 'planfact');
  }

  function backToList() {
    navigate(null);
  }

  return (
    <div className="app-bg min-h-screen">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-danger-500/10 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-success-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top bar: logo + project selector + theme toggle */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15">
              <FolderKanban className="h-5 w-5 text-accent-400" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-content-primary">Объектив</h1>
              <p className="text-[10px] text-content-tertiary">Цифровая стройка · план/факт по камерам</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProjectSelector
              projects={PROJECTS}
              pinnedIds={pinnedIds}
              onPinnedChange={setPinnedIds}
              onOpen={openProject}
            />
            <button
              onClick={() => setDevMode((v) => !v)}
              title="Технический режим: отладка API и служебные данные"
              className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                devMode
                  ? 'border-accent-500/40 bg-accent-500/15 text-accent-400'
                  : 'border-surface-border bg-surface-secondary text-content-tertiary hover:bg-surface-tertiary'
              }`}
            >
              <Wrench className="h-4 w-4" />
              Тех. режим
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>

        {/* Navigation tabs — always visible */}
        <div className="sticky top-0 z-40 mb-6 flex items-center gap-1 overflow-x-auto rounded-2xl border border-surface-border bg-surface-secondary/95 p-1.5 backdrop-blur-sm scrollbar-thin">
          {VIEWS.map(({ mode: m, label, icon: Icon }) => (
            <button
              key={m}
              onClick={() => navigate(selectedProject?.id || null, m)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                mode === m
                  ? 'bg-accent-500/20 text-accent-400 shadow-sm'
                  : 'text-content-tertiary hover:bg-surface-tertiary hover:text-content-secondary'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {selectedProject ? (
          /* ─── Project detail view ─── */
          <>
            {/* Back button + project title */}
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={backToList}
                className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-secondary px-3 py-1.5 text-xs font-semibold text-content-secondary transition hover:bg-surface-tertiary hover:text-content-primary"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                К списку проектов
              </button>
            </div>

            <SummaryPanel summary={(liveData || selectedProject).summary} />

            <div className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-content-tertiary">
                  Загрузка живых данных...
                </div>
              ) : mode === 'planfact' && (
                <>
                  <WorkGroups workItems={(liveData || selectedProject).workItems} />
                  <div className="mt-8">
                    <h2 className="mb-4 font-display text-xl font-bold text-content-primary">
                      Перераспределение и слабые звенья
                    </h2>
                    <ReallocationPanel
                      reallocations={selectedProject.reallocations}
                      weakLinks={selectedProject.weakLinks}
                      summary={selectedProject.summary}
                    />
                  </div>
                </>
              )}
              {mode === 'calendar' && (
                <CalendarView
                  events={selectedProject.calendarEvents}
                  monthSummaries={selectedProject.monthSummaries}
                  todayDate={selectedProject.todayDate}
                  weekDates={selectedProject.weekDates}
                />
              )}
              {mode === 'cv' && <CameraDetectionView project={selectedProject} devMode={devMode} onUploaded={() => setLiveKey(k => k + 1)} />}
              {mode === 'methodology' && <MethodologyView project={selectedProject} />}
              {mode === 'risk' && <RiskScorePanel riskScore={selectedProject.riskScore} />}
              {mode === 'map' && <SiteMapView project={selectedProject} />}
            </div>

            {/* Contact card — always visible in project detail */}
            <div className="mt-6">
              <ContactCard contact={selectedProject.contact} projectName={selectedProject.name} />
            </div>
          </>
        ) : (
          /* ─── Overview / project list view ─── */
          <>
            {mode === 'planfact' && (
              <ProjectList projects={visibleProjects} onOpen={openProject} />
            )}
            <div className={mode === 'planfact' ? 'mt-8' : ''}>
              <OverviewViews projects={visibleProjects} mode={mode} onOpen={openProject} />
            </div>

            {/* Contacts overview — always visible on main screen */}
            <div className="mt-6 space-y-3">
              <h2 className="font-display text-lg font-bold text-content-primary">Контакты ответственных</h2>
              {visibleProjects.map((p) => (
                <ContactCard key={p.id} contact={p.contact} projectName={p.name} />
              ))}
            </div>
          </>
        )}

        {/* Legend */}
        <footer className="mt-8 rounded-2xl border border-surface-border bg-surface-secondary/50 p-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <span className="font-semibold uppercase tracking-wider text-content-tertiary">Легенда</span>
            {LEGEND.map(({ icon: Icon, label, color }) => (
              <span key={label} className={`inline-flex items-center gap-1.5 ${color}`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-3 text-content-tertiary">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-6 rounded-full bg-gradient-to-r from-success-500 to-success-400" />
                факт
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-6 rounded-full bg-gradient-to-r from-danger-500 to-danger-400" />
                отставание
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-0.5 bg-warning-300" />
                план
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                номенклатура растёт на отделке
              </span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
