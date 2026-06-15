import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  MapPin,
  Shield,
  Star,
  X,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// INTEGRASI SUPABASE
import { supabase } from '../../lib/supabase'; // <-- PASTIKAN PATH INI SESUAI DENGAN LOKASI SUPABASE CLIENT ANDA
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile } from '../database/repository';

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth(); // Cukup ambil session, hapus signOut / logout dari destructuring hook ini

  // State Data Profil
  const [namaMahasiswa, setNamaMahasiswa] = useState('Nama Mahasiswa');
  const [npmMahasiswa, setNpmMahasiswa] = useState('-');
  const [prodiMahasiswa, setProdiMahasiswa] = useState('-');

  // State Fitur & Izin
  const [isGpsEnabled, setIsGpsEnabled] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);

  // Fungsi mengecek izin langsung dari OS
  const cekStatusIzin = async () => {
    try {
      const { status: gpsStatus } = await Location.getForegroundPermissionsAsync();
      setIsGpsEnabled(gpsStatus === 'granted');

      const { status: notifStatus } = await Notifications.getPermissionsAsync();
      setIsNotificationEnabled(notifStatus === 'granted');
    } catch (e) {
      console.error('Gagal cek izin:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const muatProfilDariSupabase = async () => {
        if (!session?.user?.id) return;
        try {
          const profileData = await fetchUserProfile(session.user.id);
          if (profileData) {
            setNamaMahasiswa(profileData.full_name || 'Nama Mahasiswa');
            setNpmMahasiswa(profileData.npm || '-');
            setProdiMahasiswa(profileData.prodi || '-');
          }
        } catch (error) {
          console.error('Gagal memuat profil dari Supabase:', error);
        }
      };

      muatProfilDariSupabase();
      cekStatusIzin();

      // Listener: Jika user kembali dari Pengaturan HP, cek ulang izinnya otomatis
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') cekStatusIzin();
      });

      return () => subscription.remove();
    }, [session])
  );

  // Mencegah error jika string nama kosong atau hanya berisi spasi
  const getAvatarText = (nama: string) => {
    if (!nama || nama === 'Nama Mahasiswa') return '--';
    const parts = nama.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nama.substring(0, 2).toUpperCase();
  };

  // Handler Izin GPS
  const handleToggleGps = async (val: boolean) => {
    if (val) {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setIsGpsEnabled(true);
      } else if (!canAskAgain) {
        Alert.alert(
          'Izin Lokasi Diperlukan',
          'Izin lokasi telah ditolak permanen. Aktifkan secara manual di pengaturan perangkat.',
          [
            { text: 'Batal', style: 'cancel', onPress: cekStatusIzin },
            { text: 'Buka Pengaturan', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        setIsGpsEnabled(false);
      }
    } else {
      Alert.alert(
        'Nonaktifkan Lokasi',
        'Untuk menonaktifkan izin lokasi, silakan ubah langsung di pengaturan perangkat OS Anda.',
        [
          { text: 'Batal', style: 'cancel', onPress: cekStatusIzin },
          { text: 'Buka Pengaturan', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  // Handler Izin Notifikasi
  const handleToggleNotifikasi = async (val: boolean) => {
    if (val) {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setIsNotificationEnabled(true);
      } else if (!canAskAgain) {
        Alert.alert(
          'Izin Notifikasi Diperlukan',
          'Izin notifikasi telah ditolak permanen. Aktifkan secara manual di pengaturan perangkat.',
          [
            { text: 'Batal', style: 'cancel', onPress: cekStatusIzin },
            { text: 'Buka Pengaturan', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        setIsNotificationEnabled(false);
      }
    } else {
      Alert.alert(
        'Nonaktifkan Notifikasi',
        'Untuk menonaktifkan notifikasi, silakan ubah di pengaturan perangkat OS Anda.',
        [
          { text: 'Batal', style: 'cancel', onPress: cekStatusIzin },
          { text: 'Buka Pengaturan', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  // Handler Keluar Akun
  const handleLogout = () => {
    Alert.alert(
      'Keluar Akun',
      'Apakah Anda yakin ingin keluar dari akun SafeCampus?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Memanggil langsung dari instance auth Supabase client tanpa lewat context
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Gagal melakukan proses logout.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Profil & Pengaturan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        
        {/* Profile Gradient Card */}
        <LinearGradient
          colors={['#B91C1C', '#7f1d1d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profAvatar}>
            <Text style={styles.avatarText}>{getAvatarText(namaMahasiswa)}</Text>
          </View>
          <View style={styles.profInfo}>
            <Text style={styles.profName}>{namaMahasiswa}</Text>
            <Text style={styles.profNpm}>NPM: {npmMahasiswa}</Text>
            <Text style={styles.profDept}>{prodiMahasiswa} · UNILA</Text>
          </View>
        </LinearGradient>

        {/* Section: Izin & Sensor */}
        <Text style={styles.sectionHeader}>Izin & Sensor</Text>
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={[styles.settingIcon, styles.siRed]}>
              <MapPin size={16} color="#b91c1c" />
            </View>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Izin Lokasi GPS</Text>
              <Text style={styles.settingSub}>Dibutuhkan untuk fitur SOS</Text>
            </View>
            <Switch
              value={isGpsEnabled}
              onValueChange={handleToggleGps}
              trackColor={{ false: '#e5e5e5', true: '#B91C1C' }}
              thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={[styles.settingIcon, styles.siBlue]}>
              <Bell size={16} color="#1d4ed8" />
            </View>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Notifikasi Push</Text>
              <Text style={styles.settingSub}>Status pengiriman SOS</Text>
            </View>
            <Switch
              value={isNotificationEnabled}
              onValueChange={handleToggleNotifikasi}
              trackColor={{ false: '#e5e5e5', true: '#B91C1C' }}
              thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
            />
          </View>
        </View>

        {/* Section: Pengiriman SOS */}
        <Text style={styles.sectionHeader}>Pengiriman SOS</Text>
        <View style={styles.settingGroup}>
          <TouchableOpacity
            key="template-sos"
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => setIsTemplateModalVisible(true)}
          >
            <View style={[styles.settingIcon, styles.siRed]}>
              <FileText size={16} color="#b91c1c" />
            </View>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Template Pesan SOS</Text>
            </View>
            <ChevronRight size={14} color="#ddd" />
          </TouchableOpacity>
        </View>

        {/* Section: Lainnya */}
        <Text style={styles.sectionHeader}>Lainnya</Text>
        <View style={styles.settingGroup}>
          <TouchableOpacity key="privacy-policy" style={styles.settingItem} activeOpacity={0.7}>
            <View style={[styles.settingIcon, styles.siGray]}>
              <Shield size={16} color="#6b7280" />
            </View>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Kebijakan Privasi</Text>
            </View>
            <ChevronRight size={14} color="#ddd" />
          </TouchableOpacity>

          <TouchableOpacity key="faq-help" style={styles.settingItem} activeOpacity={0.7}>
            <View style={[styles.settingIcon, styles.siGray]}>
              <HelpCircle size={16} color="#6b7280" />
            </View>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Bantuan & FAQ</Text>
            </View>
            <ChevronRight size={14} color="#ddd" />
          </TouchableOpacity>

          <TouchableOpacity key="review-app" style={styles.settingItem} activeOpacity={0.7}>
            <View style={[styles.settingIcon, styles.siGray]}>
              <Star size={16} color="#6b7280" />
            </View>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Beri Ulasan</Text>
            </View>
            <ChevronRight size={14} color="#ddd" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color="#B91C1C" />
          <Text style={styles.logoutBtnText}>Keluar dari akun</Text>
        </TouchableOpacity>

        {/* Version Footer */}
        <Text style={styles.versionText}>SafeCampus v1.0.0 · © 2026</Text>
      </ScrollView>

      {/* MODAL TEMPLATE PESAN SOS */}
      <Modal
        visible={isTemplateModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsTemplateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Template Pesan SOS</Text>
              <TouchableOpacity onPress={() => setIsTemplateModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Pesan ini akan otomatis dikirim ke semua kontak darurat kamu saat tombol SOS ditekan.
            </Text>

            {/* WhatsApp-style bubble */}
            <View style={styles.waBubbleWrapper}>
              <View style={styles.waBubble}>
                <Text style={styles.waBubbleText}>
                  [DARURAT - PANIC BUTTON UNILA]{'\n\n'}
                  Saya membutuhkan bantuan segera!{'\n\n'}
                  Nama: {namaMahasiswa}{'\n'}
                  NPM: {npmMahasiswa}{'\n'}
                  Prodi: {prodiMahasiswa}{'\n\n'}
                  Lokasi saya: [Alamat GPS]{'\n'}
                  Koordinat: https://maps.google.com/?q=[koordinat]
                </Text>
                <Text style={styles.waBubbleTime}>✓✓ Terkirim</Text>
              </View>
            </View>

            <Text style={styles.modalNote}>
              ℹ️ Lokasi dan koordinat akan otomatis terisi saat pesan dikirim.
            </Text>

            <TouchableOpacity
              style={styles.modalCloseFooterBtn}
              onPress={() => setIsTemplateModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseFooterText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 15 : 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  topbarTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  scrollBody: { backgroundColor: '#f5f5f5', paddingBottom: Platform.OS === 'ios' ? 100 : 80 },
  profileCard: { marginHorizontal: 20, marginTop: 16, marginBottom: 16, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center' },
  profAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.3)' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  profInfo: { marginLeft: 14, flex: 1 },
  profName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  profNpm: { fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 },
  profDept: { fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', marginTop: 1 },
  sectionHeader: { fontSize: 11, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
  settingGroup: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', marginBottom: 4 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f7f7f7' },
  settingIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  siRed: { backgroundColor: '#fee2e2' },
  siBlue: { backgroundColor: '#dbeafe' },
  siGreen: { backgroundColor: '#dcfce7' },
  siAmber: { backgroundColor: '#fef9c3' },
  siGray: { backgroundColor: '#f3f4f6' },
  settingLabel: { flex: 1, marginLeft: 12 },
  settingText: { fontSize: 14, color: '#1a1a1a' },
  settingSub: { fontSize: 11, color: '#aaa', marginTop: 1 },
  logoutBtn: { marginHorizontal: 20, marginTop: 16, marginBottom: 20, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#fecaca', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutBtnText: { fontSize: 14, fontWeight: '600', color: '#B91C1C', marginLeft: 6 },
  versionText: { textAlign: 'center', fontSize: 11, color: '#ddd', paddingBottom: 24 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.6)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  modalCloseBtn: { padding: 4 },
  modalSubtitle: { fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 20 },
  waBubbleWrapper: { backgroundColor: '#e5ddd5', borderRadius: 12, padding: 16, marginBottom: 14 },
  waBubble: { backgroundColor: '#dcf8c6', borderRadius: 10, borderTopRightRadius: 2, padding: 12, alignSelf: 'flex-end', maxWidth: '95%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  waBubbleText: { fontSize: 13, color: '#1a1a1a', lineHeight: 20 },
  waBubbleTime: { fontSize: 10, color: '#4fc3f7', textAlign: 'right', marginTop: 6 },
  modalNote: { fontSize: 11, color: '#94a3b8', lineHeight: 16, marginBottom: 20 },
  modalCloseFooterBtn: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCloseFooterText: { fontSize: 14, fontWeight: '600', color: '#475569' },
});