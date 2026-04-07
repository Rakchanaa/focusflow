import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, CalendarDays, Repeat, Clock, Bell, ChevronDown, GripVertical, CircleAlert } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Todo } from '@/hooks/useTodos';
import { Badge } from '@/components/ui/badge';

interface TaskCardProps {
  todo: Todo;
  onToggle: (id: string, is_complete: boolean) => void;
  onStatusChange: (id: string, status: Todo['status']) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  dragEnabled: boolean;
  userName?: string;
}

const repeatLabels: Record<string, string> = {
  none: '',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const statusOptions: Record<Todo['status'], string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const priorityStyles: Record<Todo['priority'], string> = {
  high: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
  low: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
};

const statusStyles: Record<Todo['status'], string> = {
  pending: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  in_progress: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
};

const TaskCard = ({ todo, onToggle, onStatusChange, onDelete, isSelected, onSelect, dragEnabled, userName }: TaskCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const dueMeta = useMemo(() => {
    if (!todo.due_date) return null;
    const dueDateTime = parseISO(`${todo.due_date}T${todo.due_time || '23:59'}:00`);
    const overdue = !todo.is_complete && isPast(dueDateTime);

    let relative = format(dueDateTime, 'MMM d');
    if (isToday(dueDateTime)) relative = 'Due Today';
    if (isTomorrow(dueDateTime)) relative = 'Due Tomorrow';

    return {
      overdue,
      relative,
      full: format(dueDateTime, 'PPP p'),
    };
  }, [todo.due_date, todo.due_time, todo.is_complete]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group card-shadow rounded-xl border bg-card p-3 transition-all hover:card-shadow-hover',
        dueMeta?.overdue && 'border-red-500/40',
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className={cn('mt-0.5 text-muted-foreground/60', dragEnabled ? 'cursor-grab' : 'cursor-not-allowed opacity-50')}
          aria-label="Reorder task"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <input
          type="checkbox"
          checked={isSelected}
          onChange={e => onSelect(todo.id, e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border bg-background"
          aria-label="Select task"
        />

        <button
          onClick={() => onToggle(todo.id, !todo.is_complete)}
          className={cn(
            "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-all",
            todo.is_complete
              ? "border-primary bg-primary"
              : "border-muted-foreground/40 hover:border-primary/60"
          )}
        >
          {todo.is_complete && (
            <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge className={cn('border text-[10px] uppercase tracking-wide', priorityStyles[todo.priority])}>
              {todo.priority}
            </Badge>
            <Badge className={cn('border text-[10px] uppercase tracking-wide', statusStyles[todo.status])}>
              {statusOptions[todo.status]}
            </Badge>
            {todo.category && (
              <Badge variant="secondary" className="text-[10px]">
                {todo.category}
              </Badge>
            )}
            {todo.reminder_minutes && <Bell className="h-3.5 w-3.5 text-amber-500" aria-label="Reminder enabled" />}
            {dueMeta?.overdue && <CircleAlert className="h-3.5 w-3.5 text-red-500" aria-label="Task overdue" />}
          </div>

          <p className={cn(
            'text-sm transition-all',
            todo.is_complete ? "text-muted-foreground line-through" : "text-foreground"
          )}>
            {todo.task_name}
          </p>

          {todo.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {todo.tags.map(tag => (
                <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {dueMeta && (
              <span className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wider',
                dueMeta.overdue ? 'bg-red-500/15 text-red-500' : 'bg-secondary/50 text-muted-foreground',
              )}>
                <CalendarDays className="h-2.5 w-2.5" />
                {dueMeta.relative}
              </span>
            )}
            {todo.due_time && (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {todo.due_time}
              </span>
            )}
            {todo.repeat_type !== 'none' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                <Repeat className="h-2.5 w-2.5" />
                {repeatLabels[todo.repeat_type]}
              </span>
            )}
            {userName && (
              <span className="rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {userName}
              </span>
            )}
          </div>

          {todo.description && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(prev => !prev)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Notes
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showDetails && 'rotate-180')} />
              </button>
              {showDetails && (
                <p className="mt-1 rounded-lg bg-background/70 p-2 text-xs leading-relaxed text-muted-foreground">
                  {todo.description}
                </p>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={todo.status}
              onChange={e => onStatusChange(todo.id, e.target.value as Todo['status'])}
              className="h-7 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {dueMeta && (
              <span className="text-[10px] text-muted-foreground">
                {dueMeta.full}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(todo.id)}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground/40 opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

export default TaskCard;
