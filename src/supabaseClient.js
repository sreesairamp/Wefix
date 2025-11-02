import { createClient } from "@supabase/supabase-js";

// Use environment variables for security
// These should be set in .env.local for development and Netlify environment variables for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://kkckdxtxobzlmvhobpbi.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrY2tkeHR4b2J6bG12aG9icGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4OTc1MzUsImV4cCI6MjA3NzQ3MzUzNX0.9Tm9YKYqOxfdZYxZuVTleDDiCO886kLVpDjivWE2gYg";

// Validate that required environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
