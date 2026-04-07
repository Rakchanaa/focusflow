import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mlutfjyfgdqojesmtvap.supabase.co';
const supabaseKey =
	import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
	import.meta.env.VITE_SUPABASE_ANON_KEY ||
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sdXRmanlmZ2Rxb2plc210dmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDg1MzUsImV4cCI6MjA4OTA4NDUzNX0.6AV2jNq0380XuwMBg85fQ5CZKNeCY4kSTenAZuOWU5s';

export const supabase = createClient(supabaseUrl, supabaseKey);
