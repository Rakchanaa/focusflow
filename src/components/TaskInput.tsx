import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Plus, List } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface TaskInputProps {
  onAdd: (task: {
    task_name: string;
    description: string | null;
    due_date: string | null;
    due_time: string | null;
    repeat_type: 'none' | 'daily' | 'weekly' | 'monthly';
  }) => void;
}

const TaskInput = ({ onAdd }: TaskInputProps) => {
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [dueTime, setDueTime] = useState('');
  const [repeatType, setRepeatType] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [batchMode, setBatchMode] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleAdd = () => {
    if (!taskName.trim()) return;
    onAdd({
      task_name: taskName.trim(),
      description: null,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
      due_time: dueTime || null,
      repeat_type: repeatType,
    });
    setTaskName('');
    setDueDate(undefined);
    setDueTime('');
    setRepeatType('none');
  };

  const handleBatchAdd = () => {
    const tasks = batchText.split(',').map(t => t.trim()).filter(Boolean);
    if (!tasks.length) return;
    tasks.forEach(name => {
      onAdd({
        task_name: name,
        description: null,
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
            <div className="flex gap-2">
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
                className={cn("h-10 w-10 shrink-0", isListening && "text-primary animate-pulse-glow")}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border bg-background text-xs text-muted-foreground hover:text-foreground">
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
          className="h-8 w-[110px] border-border bg-background text-xs text-muted-foreground"
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

        <div className="ml-auto">
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
    </div>
  );
};

export default TaskInput;
