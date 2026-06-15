import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store'; // Penting untuk simpan session user
import 'react-native-url-polyfill/auto';


const supabaseUrl = 'https://akyahililnwxuorbvbey.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreWFoaWxpbG53eHVvcmJ2YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTIxODMsImV4cCI6MjA5NzA2ODE4M30.FZBie-F-TPgufP9zC7gaMRy5JKcwba_KZH-6KTbUHUs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});