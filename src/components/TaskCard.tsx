import { motion } from 'framer-motion';
import { Trash2, CalendarDays, Repeat, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Todo } from '@/hooks/useTodos';

interface TaskCardProps {
  todo: Todo;
  onToggle: (id: string, is_complete: boolean) => void;
  onDelete: (id: string) => void;
  userName?: string;
}

const repeatLabels: Record<string, string> = {
  none: '',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const TaskCard = ({ todo, onToggle, onDelete, userName }: TaskCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="group card-shadow rounded-xl bg-card p-3 transition-all hover:card-shadow-hover"
    >
      <div className="flex items-start gap-3">
        {/* Custom checkbox */}
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
          <p className={cn(
            "text-sm transition-all",
            todo.is_complete ? "text-muted-foreground line-through" : "text-foreground"
          )}>
            {todo.task_name}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {todo.due_date && (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <CalendarDays className="h-2.5 w-2.5" />
                {todo.due_date}
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
