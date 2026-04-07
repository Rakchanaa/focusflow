import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, User, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(Notification.permission === 'granted');
  }, []);

  const toggleNotifications = async () => {
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      setNotificationsEnabled(perm === 'granted');
    } else if (Notification.permission === 'granted') {
      setNotificationsEnabled(prev => !prev);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border glass">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/')} className="rounded-lg p-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Account */}
          <div className="card-shadow rounded-xl bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <User className="h-3 w-3" /> Account
            </div>
            <div className="text-sm text-foreground">{user?.email}</div>
          </div>

          {/* Notifications */}
          <div className="card-shadow rounded-xl bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Bell className="h-3 w-3" /> Notifications
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Task reminders</span>
              <Switch checked={notificationsEnabled} onCheckedChange={toggleNotifications} />
            </div>
          </div>

          {/* Theme */}
          <div className="card-shadow rounded-xl bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {theme === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />} Theme
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Dark mode</span>
              <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
            </div>
          </div>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full gap-2 border-border text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
