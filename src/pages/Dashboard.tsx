import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTodos } from '@/hooks/useTodos';
import TaskInput from '@/components/TaskInput';
import TaskList from '@/components/TaskList';
import { Input } from '@/components/ui/input';
import { Search, Settings, LogOut, Bell, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { useTheme } from 'next-themes';
import type { Todo } from '@/hooks/useTodos';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    todos,
    loading,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    addTodo,
    toggleComplete,
    deleteTodo,
    updateTodo,
    bulkComplete,
    bulkDelete,
    reorderTodos,
    totalCount,
    completedCount,
    progressValue,
    categoryOptions,
  } = useTodos();
  const { theme, setTheme } = useTheme();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const remindedTaskIdsRef = useRef<Set<string>>(new Set());

  const userName = user?.email?.split('@')[0] || 'User';
  const canReorder = !searchQuery && filters.status === 'all' && filters.priority === 'all' && filters.category === 'all';

  const updateStatus = (id: string, status: Todo['status']) => {
    updateTodo(id, {
      status,
      is_complete: status === 'completed',
    });
  };

  useEffect(() => {
    const canNotify = typeof window !== 'undefined' && 'Notification' in window;

    if (canNotify && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    intervalRef.current = setInterval(() => {
      if (!canNotify) return;
      if (Notification.permission !== 'granted') return;
      const now = new Date();

      todos.forEach(todo => {
        if (todo.is_complete || !todo.due_date || !todo.due_time || !todo.reminder_minutes) return;

        const dueAt = new Date(`${todo.due_date}T${todo.due_time}:00`);
        const reminderAt = new Date(dueAt.getTime() - todo.reminder_minutes * 60 * 1000);

        if (now >= reminderAt && now <= dueAt && !remindedTaskIdsRef.current.has(todo.id)) {
          new Notification(`Upcoming: ${todo.task_name}`, {
            body: `Due at ${todo.due_time}. Reminder set for ${todo.reminder_minutes} minutes before.`,
            icon: '/robots.txt',
          });
          remindedTaskIdsRef.current.add(todo.id);
        }
      });
    }, 60000);

    return () => clearInterval(intervalRef.current);
  }, [todos]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border glass">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="flex-1">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {userName}
            </h1>
            <p className="text-xs text-muted-foreground">
              {totalCount === 0
                ? 'No tasks yet'
                : `${completedCount}/${totalCount} completed (${progressValue}%)`}
            </p>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={signOut}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 rounded-xl border border-border bg-card/80 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="h-10 border-border bg-card pl-9 text-foreground placeholder:text-muted-foreground focus:input-glow"
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as typeof prev.status }))}
            className="h-9 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filters.priority}
            onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value as typeof prev.priority }))}
            className="h-9 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.category}
            onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="h-9 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground"
          >
            <option value="all">All categories</option>
            {categoryOptions.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card/70 px-3 py-2 text-xs text-muted-foreground">
          <Bell className="h-3.5 w-3.5 text-amber-500" />
          Reminder notifications are sent before due time for tasks with reminders enabled.
        </div>

        {/* Task Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <TaskInput onAdd={addTodo} categoryOptions={categoryOptions} />
        </motion.div>

        {/* Task List */}
        <TaskList
          todos={todos}
          loading={loading}
          onToggle={toggleComplete}
          onStatusChange={updateStatus}
          onDelete={deleteTodo}
          onBulkComplete={bulkComplete}
          onBulkDelete={bulkDelete}
          onReorder={reorderTodos}
          canReorder={canReorder}
          userName={userName}
        />
      </main>
    </div>
  );
};

export default Dashboard;
