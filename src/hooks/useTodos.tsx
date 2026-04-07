import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Todo {
  id: string;
  user_id: string;
  task_name: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  category: string;
  tags: string[];
  reminder_minutes: number | null;
  sort_order: number;
  is_complete: boolean;
  due_date: string | null;
  due_time: string | null;
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly';
  created_at: string;
}

interface TodoFilters {
  status: 'all' | Todo['status'];
  priority: 'all' | Todo['priority'];
  category: 'all' | string;
}

const defaultFilters: TodoFilters = {
  status: 'all',
  priority: 'all',
  category: 'all',
};

const safeUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const safeStorageGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore write failures in restricted browser contexts.
  }
};

const safeStorageRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore remove failures in restricted browser contexts.
  }
};

const parseTaskExtras = (rawDescription: string | null) => {
  if (!rawDescription?.startsWith('__META__')) {
    return {
      description: rawDescription,
      status: 'pending' as Todo['status'],
      priority: 'medium' as Todo['priority'],
      category: 'General',
      tags: [] as string[],
      reminder_minutes: 15 as number | null,
    };
  }

  try {
    const parsed = JSON.parse(rawDescription.replace('__META__', ''));
    return {
      description: parsed.description ?? null,
      status: parsed.status ?? 'pending',
      priority: parsed.priority ?? 'medium',
      category: parsed.category ?? 'General',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      reminder_minutes: typeof parsed.reminder_minutes === 'number' ? parsed.reminder_minutes : 15,
    };
  } catch {
    return {
      description: null,
      status: 'pending' as Todo['status'],
      priority: 'medium' as Todo['priority'],
      category: 'General',
      tags: [] as string[],
      reminder_minutes: 15 as number | null,
    };
  }
};

const normalizeTodo = (todo: Partial<Todo>, index: number): Todo => {
  const extras = parseTaskExtras(todo.description ?? null);
  const status = (todo.status ?? extras.status ?? (todo.is_complete ? 'completed' : 'pending')) as Todo['status'];
  const is_complete = status === 'completed' || Boolean(todo.is_complete);

  return {
    id: todo.id || safeUuid(),
    user_id: todo.user_id || '',
    task_name: todo.task_name || 'Untitled Task',
    description: extras.description,
    status: is_complete ? 'completed' : status,
    priority: (todo.priority ?? extras.priority ?? 'medium') as Todo['priority'],
    category: todo.category ?? extras.category ?? 'General',
    tags: Array.isArray(todo.tags) ? todo.tags : extras.tags,
    reminder_minutes: todo.reminder_minutes ?? extras.reminder_minutes,
    sort_order: typeof todo.sort_order === 'number' ? todo.sort_order : index,
    is_complete,
    due_date: todo.due_date ?? null,
    due_time: todo.due_time ?? null,
    repeat_type: todo.repeat_type ?? 'none',
    created_at: todo.created_at || new Date().toISOString(),
  };
};

const toDbDescription = (description: string | null) => description;

export function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TodoFilters>(defaultFilters);

  const storageKey = `focusflow.todos.${user?.id ?? 'anonymous'}`;

  const fetchTodos = useCallback(async () => {
    if (!user) {
      setTodos([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Always prefer Supabase so tasks are shared/persistent across sessions.
    const { data, error } = await supabase.from('todos').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    if (error) {
      console.error(error);

      // Fallback to local cache when network/Supabase is unavailable.
      const localRaw = safeStorageGet(storageKey);
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw) as Partial<Todo>[];
          const normalized = parsed.map((todo, index) => normalizeTodo(todo, index));
          normalized.sort((a, b) => a.sort_order - b.sort_order);
          setTodos(normalized);
        } catch {
          safeStorageRemove(storageKey);
          setTodos([]);
        }
      } else {
        setTodos([]);
      }
      toast.error('Failed to fetch tasks from Supabase');
    } else {
      const normalized = (data || []).map((todo, index) => normalizeTodo(todo, index));
      normalized.sort((a, b) => a.sort_order - b.sort_order);
      setTodos(normalized);
    }

    setLoading(false);
  }, [storageKey, user]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    if (loading || !user) return;
    safeStorageSet(storageKey, JSON.stringify(todos));
  }, [loading, storageKey, todos, user]);

  const addTodo = async (todo: Omit<Todo, 'id' | 'user_id' | 'created_at' | 'is_complete' | 'sort_order'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        task_name: todo.task_name,
        description: toDbDescription(todo.description),
        is_complete: todo.status === 'completed',
        due_date: todo.due_date,
        due_time: todo.due_time,
        repeat_type: todo.repeat_type,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error('Failed to add task to Supabase');
      console.error(error);
      return;
    }

    const nextTodo = normalizeTodo(
      {
        ...data,
        status: todo.status,
        priority: todo.priority,
        category: todo.category,
        tags: todo.tags,
        reminder_minutes: todo.reminder_minutes,
      },
      0,
    );

    setTodos(prev => [{ ...nextTodo, sort_order: 0 }, ...prev.map(t => ({ ...t, sort_order: t.sort_order + 1 }))]);
    toast.success('Task added');
  };

  const toggleComplete = async (id: string, is_complete: boolean) => {
    const { error } = await supabase.from('todos').update({ is_complete }).eq('id', id);

    if (error) {
      toast.error('Failed to update task');
      console.error(error);
      return;
    }

    setTodos(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              is_complete,
              status: is_complete ? 'completed' : 'pending',
            }
          : t,
      ),
    );
    toast.success(is_complete ? 'Task completed' : 'Task reopened');
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete task');
      console.error(error);
      return;
    }

    setTodos(prev => prev.filter(t => t.id !== id).map((todo, index) => ({ ...todo, sort_order: index })));
    toast.success('Task archived');
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    const patch: Record<string, unknown> = {};

    if (typeof updates.task_name === 'string') patch.task_name = updates.task_name;
    if (updates.description !== undefined) patch.description = toDbDescription(updates.description ?? null);
    if (typeof updates.is_complete === 'boolean') patch.is_complete = updates.is_complete;
    if (updates.due_date !== undefined) patch.due_date = updates.due_date;
    if (updates.due_time !== undefined) patch.due_time = updates.due_time;
    if (updates.repeat_type !== undefined) patch.repeat_type = updates.repeat_type;

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from('todos').update(patch).eq('id', id);
      if (error) {
        toast.error('Failed to update task');
        console.error(error);
        return;
      }
    }

    setTodos(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const status = updates.status ?? t.status;
        return {
          ...t,
          ...updates,
          status,
          is_complete: status === 'completed',
        };
      }),
    );
  };

  const bulkComplete = async (ids: string[]) => {
    if (!ids.length) return;

    const { error } = await supabase.from('todos').update({ is_complete: true }).in('id', ids);
    if (error) {
      toast.error('Failed to complete selected tasks');
      console.error(error);
      return;
    }

    setTodos(prev =>
      prev.map(todo =>
        ids.includes(todo.id)
          ? { ...todo, status: 'completed', is_complete: true }
          : todo,
      ),
    );
    toast.success(`${ids.length} tasks marked completed`);
  };

  const bulkDelete = async (ids: string[]) => {
    if (!ids.length) return;

    const { error } = await supabase.from('todos').delete().in('id', ids);
    if (error) {
      toast.error('Failed to delete selected tasks');
      console.error(error);
      return;
    }

    setTodos(prev => prev.filter(todo => !ids.includes(todo.id)).map((todo, index) => ({ ...todo, sort_order: index })));
    toast.success(`${ids.length} tasks removed`);
  };

  const reorderTodos = async (orderedVisibleTodos: Todo[]) => {
    setTodos(prev => {
      const visibleIds = new Set(orderedVisibleTodos.map(todo => todo.id));
      const hidden = prev.filter(todo => !visibleIds.has(todo.id));
      return [...orderedVisibleTodos, ...hidden].map((todo, index) => ({ ...todo, sort_order: index }));
    });
  };

  const categoryOptions = useMemo(
    () => Array.from(new Set(todos.map(todo => todo.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [todos],
  );

  const filteredTodos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return todos
      .filter(todo => {
        const matchesSearch =
          !query ||
          todo.task_name.toLowerCase().includes(query) ||
          (todo.description || '').toLowerCase().includes(query) ||
          todo.category.toLowerCase().includes(query) ||
          todo.tags.some(tag => tag.toLowerCase().includes(query));

        const matchesStatus = filters.status === 'all' || todo.status === filters.status;
        const matchesPriority = filters.priority === 'all' || todo.priority === filters.priority;
        const matchesCategory = filters.category === 'all' || todo.category === filters.category;

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [filters.category, filters.priority, filters.status, searchQuery, todos]);

  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.status === 'completed').length;
  const progressValue = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return {
    todos: filteredTodos,
    rawTodos: todos,
    loading,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    categoryOptions,
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
    refetch: fetchTodos,
  };
}
