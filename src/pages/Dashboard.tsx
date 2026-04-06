import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTodos } from '@/hooks/useTodos';
import TaskInput from '@/components/TaskInput';
import TaskList from '@/components/TaskList';
import { Input } from '@/components/ui/input';
import { Search, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    todos, loading, searchQuery, setSearchQuery,
    addTodo, toggleComplete, deleteTodo,
    totalCount, completedCount,
  } = useTodos();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const userName = user?.email?.split('@')[0] || 'User';

  // Notification checker
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    intervalRef.current = setInterval(() => {
      if (Notification.permission !== 'granted') return;
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      todos.forEach(todo => {
        if (!todo.is_complete && todo.due_date === currentDate && todo.due_time === currentTime) {
          new Notification(todo.task_name, { body: 'Task is due now!' });
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
                : `${completedCount}/${totalCount} completed`}
            </p>
          </div>
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

        {/* Task Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <TaskInput onAdd={addTodo} />
        </motion.div>

        {/* Task List */}
        <TaskList
          todos={todos}
          loading={loading}
          onToggle={toggleComplete}
          onDelete={deleteTodo}
          userName={userName}
        />
      </main>
    </div>
  );
};

export default Dashboard;
