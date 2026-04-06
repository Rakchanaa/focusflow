import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Todo {
  id: string;
  user_id: string;
  task_name: string;
  description: string | null;
  is_complete: boolean;
  due_date: string | null;
  due_time: string | null;
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly';
  created_at: string;
}

export function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTodos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch tasks');
      console.error(error);
    } else {
      setTodos(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (todo: Omit<Todo, 'id' | 'user_id' | 'created_at' | 'is_complete'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('todos')
      .insert({ ...todo, user_id: user.id, is_complete: false })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add task');
      console.error(error);
    } else if (data) {
      setTodos(prev => [data, ...prev]);
      toast.success('Task added');
    }
  };

  const toggleComplete = async (id: string, is_complete: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_complete })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update task');
    } else {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, is_complete } : t));
      toast.success(is_complete ? 'Task completed' : 'Task reopened');
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete task');
    } else {
      setTodos(prev => prev.filter(t => t.id !== id));
      toast.success('Task archived');
    }
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    const { error } = await supabase.from('todos').update(updates).eq('id', id);
    if (error) {
      toast.error('Failed to update task');
    } else {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  };

  const filteredTodos = todos.filter(t =>
    t.task_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.is_complete).length;

  return {
    todos: filteredTodos,
    loading,
    searchQuery,
    setSearchQuery,
    addTodo,
    toggleComplete,
    deleteTodo,
    updateTodo,
    totalCount,
    completedCount,
    refetch: fetchTodos,
  };
}
