import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/admin/lib/utils';

interface InlineDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MINUTE_OPTIONS = ['00', '15', '30', '45'] as const;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function parseValue(value: string) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  );
}

function toInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isPastDay(day: Date, now = new Date()) {
  return startOfDay(day).getTime() < startOfDay(now).getTime();
}

function isPastDateTime(date: Date, now = new Date()) {
  return date.getTime() <= now.getTime();
}

function getEarliestAvailableToday(now = new Date()) {
  for (let hour = now.getHours(); hour < 24; hour += 1) {
    for (const minute of MINUTE_OPTIONS) {
      const minuteValue = Number(minute);
      const candidate = new Date(now);
      candidate.setHours(hour, minuteValue, 0, 0);
      if (candidate.getTime() > now.getTime()) {
        return { hour, minute: minuteValue };
      }
    }
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return { hour: tomorrow.getHours(), minute: tomorrow.getMinutes(), date: tomorrow };
}

function clampToFuture(date: Date, now = new Date()) {
  if (!isPastDateTime(date, now)) return date;
  if (isSameDay(date, now)) {
    const earliest = getEarliestAvailableToday(now);
    const next = new Date(date);
    if (earliest.date) {
      return earliest.date;
    }
    next.setHours(earliest.hour, earliest.minute, 0, 0);
    return next;
  }
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return next;
}

export function InlineDateTimePicker({ value, onChange, className }: InlineDateTimePickerProps) {
  const now = new Date();
  const parsed = parseValue(value);
  const selected = parsed ? clampToFuture(parsed, now) : now;
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected));
  const selectedIsToday = isSameDay(selected, now);
  const canGoPrev =
    viewMonth.getFullYear() > now.getFullYear() ||
    (viewMonth.getFullYear() === now.getFullYear() && viewMonth.getMonth() > now.getMonth());

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewMonth),
    [viewMonth],
  );

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(viewMonth);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const cells: Array<Date | null> = [];

    for (let index = 0; index < startOffset; index += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
    }
    return cells;
  }, [viewMonth]);

  const hour = selected.getHours();
  const minute = selected.getMinutes();
  const nearestMinute = MINUTE_OPTIONS.reduce((closest, option) => {
    const optionValue = Number(option);
    return Math.abs(optionValue - minute) < Math.abs(Number(closest) - minute) ? option : closest;
  }, MINUTE_OPTIONS[0]);

  const updateDate = (date: Date) => {
    if (isPastDay(date, now)) return;
    const next = new Date(date);
    let nextHour = hour;
    let nextMinute = Number(nearestMinute);
    if (isSameDay(date, now)) {
      const earliest = getEarliestAvailableToday(now);
      if (earliest.date) {
        onChange(toInputValue(earliest.date));
        return;
      }
      nextHour = earliest.hour;
      nextMinute = earliest.minute;
    }
    next.setHours(nextHour, nextMinute, 0, 0);
    onChange(toInputValue(next));
  };

  const updateTime = (nextHour: number, nextMinute: string) => {
    const next = new Date(selected);
    next.setHours(nextHour, Number(nextMinute), 0, 0);
    if (isPastDateTime(next, now)) return;
    onChange(toInputValue(next));
  };

  const isPastTime = (nextHour: number, nextMinute: string) => {
    if (!selectedIsToday) return false;
    const candidate = new Date(selected);
    candidate.setHours(nextHour, Number(nextMinute), 0, 0);
    return isPastDateTime(candidate, now);
  };

  const hourOptions = Array.from({ length: 24 }, (_, index) => pad(index));

  return (
    <div className={cn('w-full max-w-full overflow-hidden rounded-xl border border-border bg-card', className)}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <button
          type="button"
          onClick={() => canGoPrev && setViewMonth((current) => addMonths(current, -1))}
          disabled={!canGoPrev}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setViewMonth((current) => addMonths(current, 1))}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {WEEKDAYS.map((day) => (
            <span key={day} className="py-1">
              {day}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <span key={`empty-${index}`} className="h-9" />;
            }

            const isSelected = value ? isSameDay(day, selected) : false;
            const isToday = isSameDay(day, now);
            const isDisabled = isPastDay(day, now);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => updateDate(day)}
                disabled={isDisabled}
                className={cn(
                  'flex h-9 items-center justify-center rounded-lg text-sm transition-colors',
                  isDisabled && 'cursor-not-allowed text-muted-foreground/40',
                  !isDisabled && isSelected && 'bg-primary font-semibold text-primary-foreground',
                  !isDisabled &&
                    !isSelected &&
                    isToday &&
                    'border border-primary/30 text-foreground',
                  !isDisabled && !isSelected && !isToday && 'text-foreground hover:bg-muted',
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border px-3 py-3">
        <div className="space-y-1.5">
          <label htmlFor="contact-hour" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hour
          </label>
          <select
            id="contact-hour"
            value={pad(hour)}
            onChange={(event) => updateTime(Number(event.target.value), nearestMinute)}
            className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {hourOptions.map((option) => {
              const optionHour = Number(option);
              const hourDisabled = MINUTE_OPTIONS.every((minute) => isPastTime(optionHour, minute));
              return (
                <option key={option} value={option} disabled={hourDisabled}>
                  {option}
                </option>
              );
            })}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="contact-minute" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Minute
          </label>
          <select
            id="contact-minute"
            value={nearestMinute}
            onChange={(event) => updateTime(hour, event.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {MINUTE_OPTIONS.map((option) => (
              <option key={option} value={option} disabled={isPastTime(hour, option)}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {value && (
        <p className="border-t border-border px-3 py-2.5 text-xs text-muted-foreground">
          Selected:{' '}
          <span className="font-medium text-foreground">
            {new Intl.DateTimeFormat('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }).format(selected)}
          </span>
        </p>
      )}
    </div>
  );
}
