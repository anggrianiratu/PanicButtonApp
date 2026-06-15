// app/database/repository.ts
import * as SQLite from 'expo-sqlite';
import { supabase } from './supabaseClient';

// Tambahkan ini agar bisa diimpor di file lain
export const db = SQLite.openDatabaseSync('sos_system.db');

// ... sisa kode export fungsi supabase Anda tetap di sini
// 1. Mengambil data profil pengguna
export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// 2. Mengambil data Kontak (Jika Anda punya tabel 'contacts' di Supabase)
export const fetchContacts = async () => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('priority', { ascending: true });

  if (error) throw error;
  return data;
};

// 3. Mengambil data Riwayat (History)
export const fetchHistory = async () => {
  const { data, error } = await supabase
    .from('history')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data;
};

// 4. Menambahkan History baru
export const addHistory = async (historyData: any) => {
  const { data, error } = await supabase
    .from('history')
    .insert([historyData]);

  if (error) throw error;
  return data;
};


// Catatan: Fungsi initDatabase, exportDatabase, dan debug 
// tidak lagi diperlukan karena sudah dikelola oleh infrastruktur Supabase.