import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Reorder } from 'framer-motion';
import TaskCard from './TaskCard';
import type { Todo } from '@/hooks/useTodos';
import { CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskListProps {
  todos: Todo[];
  loading: boolean;
  onToggle: (id: string, is_complete: boolean) => void;
  onStatusChange: (id: string, status: Todo['status']) => void;
  onDelete: (id: string) => void;
  onBulkComplete: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onReorder: (todos: Todo[]) => void;
  canReorder: boolean;
  userName?: string;
}

const TaskList = ({ todos, loading, onToggle, onStatusChange, onDelete, onBulkComplete, onBulkDelete, onReorder, canReorder, userName }: TaskListProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCount = selectedIds.length;

  const allVisibleSelected = useMemo(
    () => todos.length > 0 && todos.every(todo => selectedIds.includes(todo.id)),
    [selectedIds, todos],
  );

  const toggleSelected = (id: string, selected: boolean) => {
    setSelectedIds(prev =>
      selected ? [...prev, id] : prev.filter(selectedId => selectedId !== id),
    );
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(todos.map(todo => todo.id));
  };

  const handleBulkComplete = () => {
    onBulkComplete(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    onBulkDelete(selectedIds);
    setSelectedIds([]);
  };

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
        <p className="text-sm text-muted-foreground">No tasks yet. Start by adding one!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/70 p-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-border"
          />
          Select visible
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedCount === 0}
            onClick={handleBulkComplete}
            className="h-8 gap-1 text-xs"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Complete
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedCount === 0}
            onClick={handleBulkDelete}
            className="h-8 gap-1 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <Reorder.Group axis="y" values={todos} onReorder={onReorder} className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {todos.map(todo => (
            <Reorder.Item
              key={todo.id}
              value={todo}
              dragListener={canReorder}
              drag={canReorder}
              whileDrag={{ scale: 1.02 }}
              className="rounded-xl"
            >
              <TaskCard
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                isSelected={selectedIds.includes(todo.id)}
                onSelect={toggleSelected}
                dragEnabled={canReorder}
                userName={userName}
              />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {!canReorder && (
        <p className="text-center text-xs text-muted-foreground">
          Drag and drop is enabled when search and filters are cleared.
        </p>
      )}
    </div>
  );
};

export default TaskList;
