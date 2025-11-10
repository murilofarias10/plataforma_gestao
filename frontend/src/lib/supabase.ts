import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://haxmuzigoywxxbjuiutg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhheG11emlnb3l3eHhianVpdXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MzA5MTYsImV4cCI6MjA3ODMwNjkxNn0.2xyqITv0ZTSNSGJDvVAfaLcmqosBozxyeIzvFPaRuSQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User role types
export type UserRole = 'super_admin' | 'visitor';

// Extended user profile interface
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at?: string;
}

