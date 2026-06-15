import { useRouter } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';

// Tambah import ini
import { supabase } from '../lib/supabase';

const { height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    const redirectTimeout = setTimeout(async () => {
      // Cek session — kalau sudah login langsung ke beranda
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }, 2800);

    return () => clearTimeout(redirectTimeout);
  }, [progressAnim, router]);

  const widthInterpolate = progressAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: ['0%', '70%', '100%'],
  });

  // JSX dan styles tidak berubah sama sekali
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#B91C1C" />
      <View style={styles.contentWrap}>
        <View style={styles.iconWrap}>
          <ShieldAlert size={36} color="#fff" />
          <View style={styles.sosBadge}>
            <Text style={styles.sosBadgeText}>SOS</Text>
          </View>
        </View>
        <Text style={styles.title}>PanicButtonApp</Text>
        <Text style={styles.subtitle}>
          Panic Button Keamanan Mahasiswa{'\n'}Universitas Lampung
        </Text>
        <View style={styles.progressWrap}>
          <Animated.View 
            style={[styles.progressBar, { width: widthInterpolate }]} 
          />
        </View>
      </View>
      <Text style={styles.version}>v1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#B91C1C', alignItems: 'center', justifyContent: 'center' },
  contentWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, marginTop: -height * 0.05 },
  iconWrap: { width: 80, height: 80, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.25)', position: 'relative' },
  sosBadge: { position: 'absolute', bottom: -12, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 2, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  sosBadgeText: { color: '#B91C1C', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.65)', textAlign: 'center', lineHeight: 19, marginBottom: 56 },
  progressWrap: { width: 100, height: 4, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 2 },
  version: { position: 'absolute', bottom: 32, fontSize: 11, color: 'rgba(255, 255, 255, 0.4)' },
});