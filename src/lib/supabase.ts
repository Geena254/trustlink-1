import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are present before initialization
const supabaseUrl = 'https://ozvfnaancojxsizqqtnt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dmZuYWFuY29qeHNpenFxdG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDI0NjUsImV4cCI6MjA5MDk3ODQ2NX0.hEjaMCkGwmF7JBCyrNbbfZ5DmFOF9ghXLhQYI-Iy-tg';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. " +
    "Check your .env file. The application will not be able to interact with the database."
  );
}

// Use placeholders to prevent top-level module crash if variables are missing
export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-key"
);