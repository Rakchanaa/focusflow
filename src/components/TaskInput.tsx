import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Plus, List, Tag, Flag, BellRing, FolderKanban, StickyNote } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface TaskInputProps {
  categoryOptions: string[];
  onAdd: (task: {
    task_name: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    category: string;
    tags: string[];
    reminder_minutes: number | null;
    due_date: string | null;
    due_time: string | null;
    repeat_type: 'none' | 'daily' | 'weekly' | 'monthly';
  }) => void;
}

const TaskInput = ({ onAdd, categoryOptions }: TaskInputProps) => {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [dueTime, setDueTime] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [category, setCategory] = useState('General');
  const [tagsInput, setTagsInput] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(15);
  const [repeatType, setRepeatType] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [batchMode, setBatchMode] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const parseTags = () =>
    tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

  const handleAdd = () => {
    if (!taskName.trim()) return;
    onAdd({
      task_name: taskName.trim(),
      description: description.trim() || null,
      status,
      priority,
      category: category.trim() || 'General',
      tags: parseTags(),
      reminder_minutes: reminderMinutes,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
      due_time: dueTime || null,
      repeat_type: repeatType,
    });
    setTaskName('');
    setDescription('');
    setDueDate(undefined);
    setDueTime('');
    setStatus('pending');
    setPriority('medium');
    setCategory('General');
    setTagsInput('');
    setReminderMinutes(15);
    setRepeatType('none');
  };

  const handleBatchAdd = () => {
    const tasks = batchText.split(',').map(t => t.trim()).filter(Boolean);
    if (!tasks.length) return;
    tasks.forEach(name => {
      onAdd({
        task_name: name,
        description: null,
        status,
        priority,
        category: category.trim() || 'General',
        tags: parseTags(),
        reminder_minutes: reminderMinutes,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        due_time: dueTime || null,
        repeat_type: repeatType,
      });
    });
    setBatchText('');
    toast.success(`${tasks.length} tasks added`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      batchMode ? handleBatchAdd() : handleAdd();
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (batchMode) {
        setBatchText(prev => (prev ? prev + ', ' : '') + transcript);
      } else {
        setTaskName(transcript);
      }
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  return (
    <div className="card-shadow rounded-xl bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setBatchMode(false)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            !batchMode ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Single
        </button>
        <button
          onClick={() => setBatchMode(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            batchMode ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List className="h-3 w-3" /> Batch
        </button>
      </div>

      <AnimatePresence mode="wait">
        {batchMode ? (
          <motion.div key="batch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <textarea
              value={batchText}
              onChange={e => setBatchText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task 1, Task 2, Task 3..."
              className="min-h-[80px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:input-glow focus:outline-none"
            />
          </motion.div>
        ) : (
          <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                className="h-10 flex-1 border-border bg-background text-foreground placeholder:text-muted-foreground focus:input-glow"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleVoice}
                className={cn("h-10 w-10 shrink-0 self-end sm:self-auto", isListening && "text-primary animate-pulse-glow")}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-2">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add optional notes"
                className="min-h-[72px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:input-glow focus:outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
          <Flag className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as 'high' | 'medium' | 'low')}
            className="h-6 w-full bg-transparent text-xs text-muted-foreground focus:outline-none"
          >
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
          <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={status}
            onChange={e => setStatus(e.target.value as 'pending' | 'in_progress' | 'completed')}
            className="h-6 w-full bg-transparent text-xs text-muted-foreground focus:outline-none"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
          <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={category}
            onChange={e => setCategory(e.target.value)}
            list="category-options"
            placeholder="Category"
            className="h-6 border-0 bg-transparent p-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
          />
          <datalist id="category-options">
            {categoryOptions.map(option => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 sm:col-span-2 lg:col-span-1">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="Tags: sprint, urgent"
            className="h-6 border-0 bg-transparent p-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
          <BellRing className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={reminderMinutes ?? 0}
            onChange={e => {
              const minutes = Number(e.target.value);
              setReminderMinutes(minutes === 0 ? null : minutes);
            }}
            className="h-6 w-full bg-transparent text-xs text-muted-foreground focus:outline-none"
          >
            <option value={0}>No reminder</option>
            <option value={5}>5 mins before</option>
            <option value={10}>10 mins before</option>
            <option value={15}>15 mins before</option>
            <option value={30}>30 mins before</option>
            <option value={60}>1 hour before</option>
          </select>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-full justify-start gap-1.5 border-border bg-background text-xs text-muted-foreground hover:text-foreground">
              <CalendarIcon className="h-3 w-3" />
              {dueDate ? format(dueDate, 'MMM d') : 'Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dueDate} onSelect={setDueDate} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <Input
          type="time"
          value={dueTime}
          onChange={e => setDueTime(e.target.value)}
          className="h-8 w-full border-border bg-background text-xs text-muted-foreground"
        />

        <select
          value={repeatType}
          onChange={e => setRepeatType(e.target.value as any)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground focus:outline-none"
        >
          <option value="none">No repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          onClick={batchMode ? handleBatchAdd : handleAdd}
          size="sm"
          className="h-8 gap-1.5 bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          {batchMode ? 'Add All' : 'Add'}
        </Button>
      </div>
    </div>
  );
};

export default TaskInput;
