import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Eye, EyeOff, GraduationCap, Lock, Mail, Phone, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from './database/supabaseClient';

export default function RegisterScreen() {
  const router = useRouter();
  
  // State Input Form
  const [name, setName] = useState('');
  const [npm, setNpm] = useState('');
  const [prodi, setProdi] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // State UI/UX Controller
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Trim input untuk menghindari spasi kosong yang tidak disengaja
    const trimmedName = name.trim();
    const trimmedNpm = npm.trim();
    const trimmedProdi = prodi.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedNpm || !trimmedProdi || !trimmedEmail || !trimmedPhone || !password) {
      Alert.alert('Error', 'Harap lengkapi semua data pendaftaran.');
      return;
    }

    // Validasi sederhana panjang password (Supabase default minimal 6 karakter)
    if (password.length < 6) {
      Alert.alert('Peringatan', 'Kata sandi minimal harus terdiri dari 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      // 1. Daftar akun di auth Supabase
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            full_name: trimmedName,
          },
        },
      });

      if (error) {
        Alert.alert('Gagal Daftar', error.message);
        setLoading(false);
        return;
      }

      // 2. Simpan profil tambahan ke tabel 'profiles' jika user berhasil di-generate
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id, // ID relasional diambil langsung dari auth UID
              full_name: trimmedName,
              npm: trimmedNpm,
              prodi: trimmedProdi,
              phone: trimmedPhone 
            },
          ]);

        if (profileError) {
          console.log('--- ERROR INSERT PROFIL ---');
          console.log('Error Code:', profileError.code);
          console.log('Error Message:', profileError.message);
          console.log('Error Details:', profileError.details);
          Alert.alert('Gagal Simpan', `Error: ${profileError.message}`);
        }
      }
    } catch (catchError) {
      console.error('Sistem error saat registrasi:', catchError);
      Alert.alert('Error', 'Terjadi kesalahan sistem internal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* TOMBOL KEMBALI */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.titleArea}>
            <Text style={styles.mainTitle}>Daftar Akun</Text>
            <Text style={styles.subTitle}>Buat akun SafeCampus untuk akses tombol darurat</Text>
          </View>

          {/* FORM REGISTER */}
          <View style={styles.formArea}>
            
            {/* Input Nama Lengkap */}
            <View style={styles.inputWrapper}>
              <User size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nama Lengkap Mahasiswa"
                placeholderTextColor="#aaa"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Input NPM */}
            <View style={styles.inputWrapper}>
              <GraduationCap size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="NPM"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={npm}
                onChangeText={setNpm}
              />
            </View>

            {/* Input Program Studi */}
            <View style={styles.inputWrapper}>
              <BookOpen size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Program Studi"
                placeholderTextColor="#aaa"
                value={prodi}
                onChangeText={setProdi}
              />
            </View>

            {/* Input Email */}
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Mahasiswa (npm@unila.ac.id)"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Input No WhatsApp */}
            <View style={styles.inputWrapper}>
              <Phone size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nomor WhatsApp Aktif"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Input Password */}
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Kata Sandi Baru"
                placeholderTextColor="#aaa"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon} activeOpacity={0.6}>
                {secureText ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
              </TouchableOpacity>
            </View>

            {/* Tombol Buat Akun */}
            <TouchableOpacity 
              style={[styles.btnRegister, loading && { opacity: 0.8 }]} 
              onPress={handleRegister} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnRegisterText}>Daftar Akun</Text>}
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <View style={styles.footerArea}>
            <Text style={styles.footerText}>Sudah memiliki akun? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.6}>
              <Text style={styles.loginLink}>Masuk</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 8 },
  scrollContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  titleArea: { marginBottom: 32, marginTop: 10 },
  mainTitle: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  subTitle: { fontSize: 14, color: '#666', marginTop: 6, lineHeight: 20 },
  formArea: { marginBottom: 24 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 54,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#1a1a1a', fontSize: 14 },
  eyeIcon: { padding: 4 },
  btnRegister: {
    backgroundColor: '#B91C1C',
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#B91C1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  btnRegisterText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footerArea: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText: { color: '#666', fontSize: 14 },
  loginLink: { color: '#B91C1C', fontSize: 14, fontWeight: '600' },
});