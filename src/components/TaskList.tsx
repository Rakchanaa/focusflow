import { AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';
import type { Todo } from '@/hooks/useTodos';
import { Loader2 } from 'lucide-react';

interface TaskListProps {
  todos: Todo[];
  loading: boolean;
  onToggle: (id: string, is_complete: boolean) => void;
  onDelete: (id: string) => void;
  userName?: string;
}

const TaskList = ({ todos, loading, onToggle, onDelete, userName }: TaskListProps) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    );
  }

  if (!todos.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Clear horizon. Add a task to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {todos.map(todo => (
          <TaskCard
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            userName={userName}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TaskList;
