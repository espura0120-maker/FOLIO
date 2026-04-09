import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://pzezpdlnpyozomqgtltt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZXpwZGxucHlvem9tcWd0bHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NDUwNjcsImV4cCI6MjA5MTIyMTA2N30.zt-AOMqpuz0cuZrWxdXhC6KqKwmhBcHUPz2zH9pcCGE',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
)
