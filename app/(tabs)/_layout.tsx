// app/(tabs)/_layout.tsx
import { Redirect, Tabs } from 'expo-router';
import { History, Home, ShieldAlert, User } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-url-polyfill/auto';
import { useAuth } from '../context/AuthContext'; // Sesuaikan path-nya

export default function TabLayout() {
  const { session, isLoading } = useAuth();

  // Jika masih loading (mengecek sesi), tampilkan loading indicator
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#B91C1C" />
      </View>
    );
  }

  // Jika tidak ada session, arahkan ke halaman login
  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#B91C1C',
        tabBarInactiveTintColor: '#aaa',
        headerShown: false,
        // ... sisa kode style Anda tetap sama
      }}>
      <Tabs.Screen name="index" options={{ title: 'Beranda', tabBarIcon: ({ color }) => <Home color={color} size={20} /> }} />
      <Tabs.Screen name="contact" options={{ title: 'Kontak', tabBarIcon: ({ color }) => <ShieldAlert color={color} size={20} /> }} />
      <Tabs.Screen name="history" options={{ title: 'Riwayat', tabBarIcon: ({ color }) => <History color={color} size={20} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <User color={color} size={20} /> }} />
      <Tabs.Screen name="contact-form" options={{ href: null }} />
    </Tabs>
  );
}