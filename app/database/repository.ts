// app/database/repository.ts
import * as SQLite from 'expo-sqlite';
import { supabase } from './supabaseClient'; // Pastikan path ini sesuai dengan struktur folder Anda

// Database lokal SQLite (Tetap dipertahankan jika Anda menggunakannya untuk cache offline)
export const db = SQLite.openDatabaseSync('sos_system.db');

// ==========================================
// FUNGSI SUPABASE
// ==========================================

// 1. Mengambil data profil pengguna
export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Gagal mengambil profil:', error);
    throw error;
  }
  
  return data;
};

// 2. Mengambil data Kontak
export const fetchContacts = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Gagal mendapatkan user saat fetch kontak:', authError);
    return [];
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('priority', { ascending: true });

  if (error) {
    console.error('Gagal mengambil kontak:', error);
    throw error;
  }

  return data;
};

// 3. Mengambil data Riwayat (History)
export const fetchHistory = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Gagal mendapatkan user saat fetch riwayat:', authError);
    return [];
  }

  const { data, error } = await supabase
    .from('sos_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Gagal mengambil riwayat:', error);
    throw error;
  }

  return data;
};

// 4. Menambahkan History baru
export const addHistory = async (historyData: {
  user_id: string;
  location: string;
  date_str: string;
  time_str: string;
  recipients: string;
  status: string;
  monthGroup?: string; // Menyesuaikan dengan kebutuhan di history.tsx
  extraInfo?: string;  // Menyesuaikan dengan kebutuhan di history.tsx
}) => {
  const { data, error } = await supabase
    .from('sos_history')
    .insert([historyData])
    .select();

  if (error) {
    console.error('Gagal merekam riwayat SOS ke Supabase:', error);
    throw error;
  }

  return data;
};