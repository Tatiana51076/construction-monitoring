import { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle2,
  CalendarX,
} from 'lucide-react';
import type { CalendarScale } from '@/data';
import { EVENT_STATUS_META } from '@/data';
import type { CalendarEvent, DaySummary } from '@/projects';
import { TimeScaleSwitcher } from './TimeScaleSwitcher';

// ─── Constants ───────────────────────────────────────────────────────────

const DAY_START = 7;
const DAY_END = 19;
const DAY_SPAN = DAY_END - DAY_START;
const SLOTS_PER_HOUR = 2;
const TOTAL_SLOTS = DAY_SPAN * SLOTS_PER_HOUR;

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
const WEEKDAY_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

const NOW_HOUR = 11 + 45 / 60;

interface Props {
  events: CalendarEvent[];
  monthSummaries: DaySummary[];
  todayDate: string;
  weekDates: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}
function formatDateKey(y: number, m: number, d: number) {
  return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
}
function addDays(s: string, n: number) {
  const { y, m, d } = parseDate(s);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return formatDateKey(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}
function getWeekDates(monday: string) {
  return Array.from({ length: 5 }, (_, i) => addDays(monday, i));
}
function getMonthLabel(monday: string) {
  const { y, m, d } = parseDate(monday);
  const dt = new Date(y, m - 1, d + 2);
  return `${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`;
}
function getWeekRangeLabel(monday: string) {
  const dates = getWeekDates(monday);
  const s = parseDate(dates[0]);
  const e = parseDate(dates[4]);
  const sm = MONTH_NAMES[s.m - 1].slice(0, 3).toLowerCase();
  const em = MONTH_NAMES[e.m - 1].slice(0, 3).toLowerCase();
  return s.m === e.m ? `${s.d}–${e.d} ${em} ${e.y}` : `${s.d} ${sm} – ${e.d} ${em} ${e.y}`;
}
function getDayLabel(dateStr: string) {
  const { y, m, d } = parseDate(dateStr);
  const dt = new Date(y, m - 1, d);
  const dayIdx = (dt.getDay() + 6) % 7;
  return `${d} ${MONTH_NAMES[m - 1].slice(0, 3).toLowerCase()} · ${WEEKDAY_FULL[dayIdx]}`;
}
// Первый понедельник рабочей недели, с которого начинается сетка месяца (Пн–Пт)
function firstMondayOfMonth(y: number, m: number) {
  const first = new Date(y, m - 1, 1);
  const wd = (first.getDay() + 6) % 7; // Пн=0 … Вс=6
  const shift = wd <= 4 ? -wd : (7 - wd); // если 1-е в выходной — берём следующий понедельник
  const monday = new Date(y, m - 1, 1 + shift);
  return formatDateKey(monday.getFullYear(), monday.getMonth() + 1, monday.getDate());
}
// Сдвиг месяца на ±delta (возвращает 1-е число нужного месяца)
function shiftMonth(dateStr: string, delta: number) {
  const { y, m } = parseDate(dateStr);
  const dt = new Date(y, m - 1 + delta, 1);
  return formatDateKey(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}
function hourToLabel(h: number) {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
function minutesToHuman(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}ч ${m}мин`;
  if (h > 0) return `${h}ч`;
  return `${m}мин`;
}

// ─── Overlap layout ──────────────────────────────────────────────────────

interface LaidOutEvent { ev: CalendarEvent; col: number; totalCols: number }

function layoutEvents(events: CalendarEvent[]): LaidOutEvent[] {
  const sorted = [...events].sort((a, b) => a.startHour - b.startHour || a.endHour - b.endHour);
  const result: LaidOutEvent[] = [];
  let columns: number[] = [];

  for (const ev of sorted) {
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      if (columns[c] <= ev.startHour) {
        columns[c] = ev.endHour;
        const cluster = result.filter((r) => r.ev.startHour < ev.endHour && r.ev.endHour > ev.startHour);
        const totalCols = Math.max(c + 1, ...cluster.map((r) => r.col + 1), 1);
        cluster.forEach((r) => (r.totalCols = Math.max(r.totalCols, totalCols)));
        result.push({ ev, col: c, totalCols });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push(ev.endHour);
      const col = columns.length - 1;
      const cluster = result.filter((r) => r.ev.startHour < ev.endHour && r.ev.endHour > ev.startHour);
      const totalCols = Math.max(col + 1, ...cluster.map((r) => r.col + 1), 1);
      cluster.forEach((r) => (r.totalCols = Math.max(r.totalCols, totalCols)));
      result.push({ ev, col, totalCols });
    }
  }
  return result;
}

// ─── Sub-components ──────────────────────────────────────────────────────

function statusIcon(status: CalendarEvent['status']) {
  switch (status) {
    case 'delayed': return AlertTriangle;
    case 'idle': return Clock;
    case 'reallocated': return Users;
    case 'confirmed': return CheckCircle2;
    default: return null;
  }
}

function EventBlock({ laid, isWeekView }: { laid: LaidOutEvent; isWeekView: boolean }) {
  const { ev, col, totalCols } = laid;
  const meta = EVENT_STATUS_META[ev.status];
  const Icon = statusIcon(ev.status);
  const top = ((ev.startHour - DAY_START) / DAY_SPAN) * 100;
  const height = ((ev.endHour - ev.startHour) / DAY_SPAN) * 100;
  const widthPct = 100 / totalCols;
  const leftPct = col * widthPct;

  return (
    <div
      className={`absolute rounded-lg border ${meta.border} ${meta.bg} ${meta.text} px-1.5 py-1 text-[10px] leading-tight overflow-hidden transition-all hover:z-30 hover:shadow-lg hover:brightness-110 cursor-pointer ${ev.status === 'delayed' ? 'animate-pulse-ring' : ''}`}
      style={{ top: `${top}%`, height: `calc(${height}% - 2px)`, left: `calc(${leftPct}% + 2px)`, width: `calc(${widthPct}% - 4px)` }}
      title={ev.note ? `${ev.title} — ${ev.note}` : ev.title}
    >
      <div className="flex items-center gap-1 font-semibold">
        {Icon && <Icon className="h-3 w-3 shrink-0" />}
        <span className="truncate">{ev.title}</span>
      </div>
      {!isWeekView && (
        <>
          <div className="mt-0.5 truncate text-[10px] opacity-80">
            {hourToLabel(ev.startHour)}–{hourToLabel(ev.endHour)}
            {ev.delayMinutes ? ` · +${minutesToHuman(ev.delayMinutes)}` : ''}
          </div>
          {ev.note && <div className="mt-0.5 truncate text-[10px] opacity-60">{ev.note}</div>}
        </>
      )}
      {isWeekView && ev.delayMinutes && (
        <div className="mt-0.5 truncate text-[10px] font-bold text-danger-300">+{minutesToHuman(ev.delayMinutes)}</div>
      )}
    </div>
  );
}

function HourGutter({ compact }: { compact?: boolean }) {
  return (
    <div className="w-14 shrink-0">
      {Array.from({ length: TOTAL_SLOTS + 1 }, (_, i) => DAY_START + i / SLOTS_PER_HOUR).map((h, i) => {
        if (i % SLOTS_PER_HOUR !== 0) return null;
        return (
          <div key={h} className="relative text-right pr-2 text-content-muted" style={{ height: `${(100 / TOTAL_SLOTS) * SLOTS_PER_HOUR}%` }}>
            <span className={`absolute -top-1.5 right-1 ${compact ? 'text-[10px]' : 'text-[10px]'}`}>{hourToLabel(h)}</span>
          </div>
        );
      })}
    </div>
  );
}

function CurrentTimeLine() {
  const topPct = ((NOW_HOUR - DAY_START) / DAY_SPAN) * 100;
  if (NOW_HOUR < DAY_START || NOW_HOUR > DAY_END) return null;
  return (
    <div className="pointer-events-none absolute left-0 right-0 z-20 flex items-center" style={{ top: `${topPct}%` }}>
      <span className="relative -left-1 flex h-3 w-3 items-center justify-center rounded-full bg-danger-500 shadow-md">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      <div className="h-0.5 flex-1 bg-danger-500" />
    </div>
  );
}

function DayColumn({ events, isToday, isWeekView }: { date: string; events: CalendarEvent[]; isToday: boolean; isWeekView: boolean }) {
  const laid = useMemo(() => layoutEvents(events), [events]);
  return (
    <div className={`relative flex-1 border-l border-surface-border/60 ${isToday ? 'bg-accent-500/[0.03]' : ''}`}>
      {Array.from({ length: TOTAL_SLOTS + 1 }, (_, i) => (
        <div
          key={i}
          className={`absolute left-0 right-0 ${i % SLOTS_PER_HOUR === 0 ? 'border-t border-surface-border/30' : 'border-t border-surface-border/15'}`}
          style={{ top: `${(i / TOTAL_SLOTS) * 100}%` }}
        />
      ))}
      <div className="absolute inset-0 px-0.5 py-0.5">
        {laid.map((l) => (<EventBlock key={l.ev.id} laid={l} isWeekView={isWeekView} />))}
      </div>
      {isToday && <CurrentTimeLine />}
    </div>
  );
}

function WeekView({ monday, events, today }: { monday: string; events: CalendarEvent[]; today: string }) {
  const weekDates = getWeekDates(monday);
  const MAX_EVENTS = 4;
  const priority = (ev: CalendarEvent) =>
    ev.status === 'delayed' ? 0 : ev.status === 'reallocated' ? 1 : ev.status === 'idle' ? 2 : 3;
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40">
      <div className="flex border-b border-surface-border">
        <div className="w-14 shrink-0" />
        {weekDates.map((date, i) => {
          const isToday = date === today;
          const dayEvents = events.filter((e) => e.date === date).sort((a, b) => priority(a) - priority(b));
          const hidden = Math.max(0, dayEvents.length - MAX_EVENTS);
          const delayed = dayEvents.filter((e) => e.status === 'delayed').length;
          const reallocated = dayEvents.filter((e) => e.status === 'reallocated').length;
          return (
            <div key={date} className={`flex-1 border-l border-surface-border/60 px-2 py-2 text-center ${isToday ? 'bg-accent-500/10' : ''}`}>
              <div className="text-xs font-medium text-content-tertiary">{WEEKDAY_LABELS[i]}</div>
              <div className={`font-display text-lg font-bold ${isToday ? 'text-accent-400' : 'text-content-primary'}`}>{parseDate(date).d}</div>
              <div className="mt-0.5 flex items-center justify-center gap-1">
                {delayed > 0 && (<span className="inline-flex items-center gap-0.5 rounded-full bg-danger-500/15 px-1.5 text-[10px] font-bold text-danger-300"><AlertTriangle className="h-2.5 w-2.5" />{delayed}</span>)}
                {reallocated > 0 && (<span className="inline-flex items-center gap-0.5 rounded-full bg-accent-500/15 px-1.5 text-[10px] font-bold text-accent-400"><Users className="h-2.5 w-2.5" />{reallocated}</span>)}
                {hidden > 0 && (<span className="inline-flex items-center rounded-full bg-surface-tertiary/60 px-1.5 text-[10px] font-bold text-content-muted">+{hidden}</span>)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex" style={{ height: '600px' }}>
        <HourGutter compact />
        {weekDates.map((date) => {
          const dayEvents = events.filter((e) => e.date === date).sort((a, b) => priority(a) - priority(b)).slice(0, MAX_EVENTS);
          return <DayColumn key={date} date={date} events={dayEvents} isToday={date === today} isWeekView />;
        })}
      </div>
    </div>
  );
}

function DayView({ date, events, today }: { date: string; events: CalendarEvent[]; today: string }) {
  const dayEvents = events.filter((e) => e.date === date);
  const delayed = dayEvents.filter((e) => e.status === 'delayed').length;
  const reallocated = dayEvents.filter((e) => e.status === 'reallocated').length;
  const isToday = date === today;

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div>
          <span className={`font-display text-lg font-bold ${isToday ? 'text-accent-400' : 'text-content-primary'}`}>{getDayLabel(date)}</span>
          {isToday && <span className="ml-2 text-xs text-content-tertiary">Сегодня</span>}
        </div>
        <div className="flex gap-2">
          {delayed > 0 && (<span className="inline-flex items-center gap-1 rounded-lg bg-danger-500/15 px-2 py-1 text-xs font-semibold text-danger-300"><AlertTriangle className="h-3.5 w-3.5" />{delayed} задержек</span>)}
          {reallocated > 0 && (<span className="inline-flex items-center gap-1 rounded-lg bg-accent-500/15 px-2 py-1 text-xs font-semibold text-accent-400"><Users className="h-3.5 w-3.5" />{reallocated} перераспред.</span>)}
          {dayEvents.length === 0 && (<span className="inline-flex items-center gap-1 rounded-lg bg-surface-tertiary/40 px-2 py-1 text-xs text-content-tertiary"><CalendarX className="h-3.5 w-3.5" />нет событий</span>)}
        </div>
      </div>
      <div className="flex" style={{ height: '600px' }}>
        <HourGutter />
        <DayColumn date={date} events={dayEvents} isToday={isToday} isWeekView={false} />
      </div>
    </div>
  );
}

function MonthView({ monthAnchor, events, monthSummaries, today, onSelectDay }: { monthAnchor: string; events: CalendarEvent[]; monthSummaries: DaySummary[]; today: string; onSelectDay: (d: string) => void }) {
  const { y, m } = parseDate(monthAnchor);
  const daysInMonth = new Date(y, m, 0).getDate();

  function getDayData(date: string) {
    const evs = events.filter((e) => e.date === date);
    if (evs.length > 0) return { totalEvents: evs.length, delayedEvents: evs.filter((e) => e.status === 'delayed').length, confirmedEvents: evs.filter((e) => e.status === 'confirmed').length, hasReallocation: evs.some((e) => e.status === 'reallocated') };
    return monthSummaries.find((d) => d.date === date) || null;
  }

  const weeks: string[][] = [];
  const lastDay = formatDateKey(y, m, daysInMonth);
  let cur = firstMondayOfMonth(y, m);
  while (cur <= lastDay) {
    weeks.push(getWeekDates(cur));
    cur = addDays(cur, 7);
  }

  function renderDayCell(date: string) {
    const data = getDayData(date);
    const isToday = date === today;
    const isCurrentMonth = parseDate(date).m === m;
    const dayNum = parseDate(date).d;

    if (!data || !isCurrentMonth) {
      return (<div className={`flex aspect-square flex-col items-center justify-center rounded-lg border border-surface-border/30 ${isCurrentMonth ? 'bg-surface-secondary/20 text-content-muted' : 'bg-transparent text-content-muted/40'}`}><span className="text-sm">{dayNum}</span></div>);
    }
    return (
      <button
        onClick={() => onSelectDay(date)}
        className={`relative flex aspect-square flex-col rounded-lg border p-1.5 text-left transition-all hover:scale-[1.03] hover:shadow-md ${isToday ? 'border-accent-500/60 bg-accent-500/10 ring-1 ring-accent-500/30' : data.delayedEvents > 0 ? 'border-danger-500/30 bg-danger-500/[0.06]' : 'border-surface-border/50 bg-surface-secondary/40'}`}
      >
        <span className={`text-sm font-semibold ${isToday ? 'text-accent-400' : 'text-content-secondary'}`}>{dayNum}</span>
        <div className="mt-auto space-y-0.5">
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(data.totalEvents, 5) }).map((_, i) => {
              const ev = events.filter((e) => e.date === date)[i];
              const color = ev?.status === 'delayed' ? 'bg-danger-500' : ev?.status === 'idle' ? 'bg-warning-400' : ev?.status === 'reallocated' ? 'bg-accent-500' : ev?.status === 'confirmed' ? 'bg-success-400' : i < (data.delayedEvents || 0) ? 'bg-danger-500' : i < (data.delayedEvents || 0) + (data.confirmedEvents || 0) ? 'bg-success-400' : 'bg-content-muted';
              return <div key={i} className={`h-1 flex-1 rounded-full ${color}`} />;
            })}
          </div>
          {data.hasReallocation && (<div className="flex items-center gap-0.5 text-[10px] font-medium text-accent-400"><Users className="h-2 w-2" />перераспред.</div>)}
        </div>
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary/40 p-4">
      <div className="mb-2 grid grid-cols-5 gap-2">{WEEKDAY_LABELS.map((d) => (<div key={d} className="text-center text-xs font-semibold text-content-tertiary">{d}</div>))}</div>
      <div className="grid grid-cols-5 gap-2">{weeks.flat().map((date) => (<div key={date}>{renderDayCell(date)}</div>))}</div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-content-tertiary">
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-4 rounded-full bg-success-400" />подтверждено</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-4 rounded-full bg-danger-500" />задержка</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-4 rounded-full bg-warning-400" />простой</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-4 rounded-full bg-accent-500" />перераспределение</span>
        <span className="ml-auto text-accent-400">клик по дню — открыть</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────

export function CalendarView({ events, monthSummaries, todayDate, weekDates }: Props) {
  const [scale, setScale] = useState<CalendarScale>('week');
  const [currentMonday, setCurrentMonday] = useState(weekDates[0]);
  const [selectedDay, setSelectedDay] = useState(todayDate);
  const [monthAnchor, setMonthAnchor] = useState(todayDate);

  const navLabel = useMemo(() => {
    if (scale === 'day') return getDayLabel(selectedDay);
    if (scale === 'week') return getWeekRangeLabel(currentMonday);
    return getMonthLabel(monthAnchor);
  }, [scale, currentMonday, selectedDay, monthAnchor]);

  const handleScaleChange = useCallback((s: CalendarScale) => setScale(s), []);
  const handlePrev = useCallback(() => {
    if (scale === 'day') setSelectedDay((d) => addDays(d, -1));
    else if (scale === 'week') setCurrentMonday((d) => addDays(d, -5));
    else setMonthAnchor((d) => shiftMonth(d, -1));
  }, [scale]);
  const handleNext = useCallback(() => {
    if (scale === 'day') setSelectedDay((d) => addDays(d, 1));
    else if (scale === 'week') setCurrentMonday((d) => addDays(d, 5));
    else setMonthAnchor((d) => shiftMonth(d, 1));
  }, [scale]);
  const handleToday = useCallback(() => {
    setSelectedDay(todayDate);
    setCurrentMonday(weekDates[0]);
    setMonthAnchor(todayDate);
  }, [todayDate, weekDates]);
  const handleSelectDay = useCallback((date: string) => {
    setSelectedDay(date);
    setMonthAnchor(date);
    const { y, m, d } = parseDate(date);
    const dt = new Date(y, m - 1, d);
    const dow = (dt.getDay() + 6) % 7;
    setCurrentMonday(addDays(date, -dow));
    setScale('day');
  }, []);

  return (
    <section className="animate-slide-up">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={handlePrev} className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface-secondary text-content-tertiary transition hover:bg-surface-tertiary hover:text-content-primary"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={handleToday} className="rounded-lg border border-accent-500/30 bg-accent-500/10 px-3 py-1.5 text-xs font-semibold text-accent-400 transition hover:bg-accent-500/20">Сегодня</button>
          <span className="font-display text-lg font-semibold text-content-primary min-w-[180px] text-center">{navLabel}</span>
          <button onClick={handleNext} className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface-secondary text-content-tertiary transition hover:bg-surface-tertiary hover:text-content-primary"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <TimeScaleSwitcher scale={scale} onChange={handleScaleChange} />
      </div>
      {scale === 'day' && <DayView date={selectedDay} events={events} today={todayDate} />}
      {scale === 'week' && <WeekView monday={currentMonday} events={events} today={todayDate} />}
      {scale === 'month' && <MonthView monthAnchor={monthAnchor} events={events} monthSummaries={monthSummaries} today={todayDate} onSelectDay={handleSelectDay} />}
    </section>
  );
}
