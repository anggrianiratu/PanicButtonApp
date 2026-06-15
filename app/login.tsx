import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react-native';
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
import { supabase } from './database/supabaseClient'; // Import supabase client

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Harap isi email dan kata sandi.');
      return;
    }

    setLoading(true);
    
    // Fungsi Supabase untuk sign in
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Login Gagal', error.message);
    } else {
      // Tidak perlu router.replace manual karena (tabs)/_layout.tsx 
      // akan mendeteksi session dan melakukan redirect otomatis
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerArea}>
            <View style={styles.iconCircle}>
              <ShieldAlert size={40} color="#B91C1C" />
            </View>
            <Text style={styles.brandTitle}>PanicButtonApp</Text>
            <Text style={styles.brandSubtitle}>Universitas Lampung</Text>
          </View>

          <View style={styles.formArea}>
            <Text style={styles.loginLabel}>Masuk Akun</Text>

            <View style={styles.inputWrapper}>
              <Mail size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Mahasiswa"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Kata Sandi"
                placeholderTextColor="#aaa"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                {secureText ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.btnLogin} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnLoginText}>Masuk</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerArea}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>Daftar Sekarang</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  headerArea: { alignItems: 'center', marginBottom: 40 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  formArea: { marginBottom: 24 },
  loginLabel: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 20 },
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
  btnLogin: {
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
  btnLoginText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footerArea: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: '#666', fontSize: 14 },
  registerLink: { color: '#B91C1C', fontSize: 14, fontWeight: '600' },
});