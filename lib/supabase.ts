import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project URL and anon key
const supabaseUrl = 'https://bkwpabeqmhkfsirycsqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd3BhYmVxbWhrZnNpcnljc3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjc1NzQsImV4cCI6MjA5MDg0MzU3NH0.qH1kFQhKWaYx2I4g8yvixGyYfgE1TZkUMjhGI9bCEw0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
