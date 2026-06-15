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

const { height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  
  // Nilai animasi untuk progress bar lebar (0 sampai 1)
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Jalankan animasi progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500, // Berjalan selama 2.5 detik
      useNativeDriver: false,
    }).start();

    // 2. Timeout untuk mengalihkan halaman ke Login
    const redirectTimeout = setTimeout(() => {
      // 🔥 SUDAH DIPERBAIKI: Mengarah ke halaman login setelah splash screen selesai
      router.replace("/login"); 
    }, 2800);

    // Bersihkan timeout jika komponen unmount
    return () => clearTimeout(redirectTimeout);
  }, [progressAnim, router]);

  // Melakukan interpolasi nilai angka 0-1 menjadi persentase 0% - 100%
  const widthInterpolate = progressAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: ['0%', '70%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Set status bar perangkat menjadi terang karena background aplikasi merah */}
      <StatusBar barStyle="light-content" backgroundColor="#B91C1C" />

      <View style={styles.contentWrap}>
        {/* Lingkaran pembungkus ikon dengan Simbol SOS */}
        <View style={styles.iconWrap}>
          <ShieldAlert size={36} color="#fff" />
          
          {/* Simbol SOS Merah */}
          <View style={styles.sosBadge}>
            <Text style={styles.sosBadgeText}>SOS</Text>
          </View>
        </View>

        {/* Judul Aplikasi */}
        <Text style={styles.title}>PanicButtonApp</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Panic Button Keamanan Mahasiswa{'\n'}Universitas Lampung
        </Text>

        {/* Progress Bar Container */}
        <View style={styles.progressWrap}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { width: widthInterpolate }
            ]} 
          />
        </View>
      </View>

      {/* Teks Versi di Bagian Bawah */}
      <Text style={styles.version}>v1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    // Menghindari elemen bergeser terlalu jauh jika layar terlalu panjang
    marginTop: -height * 0.05, 
  },
  iconWrap: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    position: 'relative',
  },
  sosBadge: {
    position: 'absolute',
    bottom: -12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sosBadgeText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 56,
  },
  progressWrap: {
    width: 100,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
  version: {
    position: 'absolute',
    bottom: 32,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});