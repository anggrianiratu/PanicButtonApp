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
  X,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile } from '../database/repository';

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const [namaMahasiswa, setNamaMahasiswa] = useState('Nama Mahasiswa');
  const [npmMahasiswa, setNpmMahasiswa] = useState('-');
  const [prodiMahasiswa, setProdiMahasiswa] = useState('-');

  const [isGpsEnabled, setIsGpsEnabled] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [isFaqModalVisible, setIsFaqModalVisible] = useState(false);

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

      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') cekStatusIzin();
      });

      return () => subscription.remove();
    }, [session])
  );

  const getAvatarText = (nama: string) => {
    if (!nama || nama === 'Nama Mahasiswa') return '--';
    const parts = nama.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nama.substring(0, 2).toUpperCase();
  };

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

  const handleLogout = () => {
    Alert.alert(
      'Keluar Akun',
      'Apakah Anda yakin ingin keluar dari akun PanicButtonApp?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
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

      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Profil & Pengaturan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>

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
          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => setIsPrivacyModalVisible(true)}
          >
            <View style={[styles.settingIcon, styles.siGray]}>
              <Shield size={16} color="#6b7280" />
            </View>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Kebijakan Privasi</Text>
            </View>
            <ChevronRight size={14} color="#ddd" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => setIsFaqModalVisible(true)}
          >
            <View style={[styles.settingIcon, styles.siGray]}>
              <HelpCircle size={16} color="#6b7280" />
            </View>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Bantuan & FAQ</Text>
            </View>
            <ChevronRight size={14} color="#ddd" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color="#B91C1C" />
          <Text style={styles.logoutBtnText}>Keluar dari akun</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>PanicButtonApp v1.0.0 · © 2026</Text>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Template Pesan SOS</Text>
              <TouchableOpacity onPress={() => setIsTemplateModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Pesan ini akan otomatis dikirim ke semua kontak darurat kamu saat tombol SOS ditekan.
            </Text>

            <View style={styles.waBubbleWrapper}>
              <View style={styles.waBubble}>
                <Text style={styles.waBubbleText}>
                  [DARURAT - PANIC BUTTON UNILA]{'\n\n'}Saya membutuhkan bantuan segera!{'\n\n'}Nama: {namaMahasiswa}{'\n'}NPM: {npmMahasiswa}{'\n'}Prodi: {prodiMahasiswa}{'\n\n'}Lokasi saya: [Alamat GPS]{'\n'}Koordinat: https://maps.google.com/?q=[koordinat]
                </Text>
                <Text style={styles.waBubbleTime}>✓✓ Terkirim</Text>
              </View>
            </View>

            <Text style={styles.modalNote}>
              ℹ️ Lokasi dan koordinat akan otomatis terisi saat pesan dikirim.
            </Text>
          </View>
        </View>
      </Modal>

      {/* MODAL KEBIJAKAN PRIVASI */}
      <Modal
        visible={isPrivacyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPrivacyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentTall]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kebijakan Privasi</Text>
              <TouchableOpacity onPress={() => setIsPrivacyModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.privacySection}>1. Informasi yang Kami Kumpulkan</Text>
              <Text style={styles.privacyText}>
                PanicButtonApp mengumpulkan informasi yang Anda berikan saat mendaftar, termasuk nama lengkap, NPM, program studi, dan nomor kontak darurat. Aplikasi juga mengakses data lokasi GPS perangkat Anda secara real-time hanya saat fitur SOS diaktifkan.
              </Text>

              <Text style={styles.privacySection}>2. Penggunaan Informasi</Text>
              <Text style={styles.privacyText}>
                Informasi yang dikumpulkan digunakan semata-mata untuk mengirimkan pesan darurat kepada kontak yang telah Anda daftarkan. Data lokasi hanya digunakan pada saat tombol SOS ditekan dan tidak disimpan secara terus-menerus.
              </Text>

              <Text style={styles.privacySection}>3. Penyimpanan Data</Text>
              <Text style={styles.privacyText}>
                Data profil dan riwayat pengiriman SOS disimpan secara aman di server menggunakan layanan Supabase dengan enkripsi standar industri. Kami tidak menjual atau membagikan data Anda kepada pihak ketiga manapun.
              </Text>

              <Text style={styles.privacySection}>4. Keamanan Data</Text>
              <Text style={styles.privacyText}>
                Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang wajar untuk melindungi data pribadi Anda dari akses, pengungkapan, perubahan, atau penghancuran yang tidak sah.
              </Text>

              <Text style={styles.privacySection}>5. Hak Pengguna</Text>
<Text style={styles.privacyText}>
  Data profil yang telah didaftarkan bersifat permanen dan tidak dapat diubah atau dihapus secara mandiri oleh pengguna. Hal ini bertujuan untuk menjaga keakuratan identitas pengguna dalam situasi darurat. Jika terdapat kesalahan data, silakan hubungi administrator atau tim pengembang aplikasi untuk penanganan lebih lanjut.
</Text>

              <Text style={styles.privacySection}>6. Perubahan Kebijakan</Text>
              <Text style={styles.privacyText}>
                Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui notifikasi dalam aplikasi. Dengan terus menggunakan aplikasi, Anda menyetujui kebijakan yang berlaku.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL BANTUAN & FAQ */}
      <Modal
        visible={isFaqModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFaqModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentTall]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bantuan & FAQ</Text>
              <TouchableOpacity onPress={() => setIsFaqModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Bagaimana cara menggunakan tombol SOS?</Text>
                <Text style={styles.faqAnswer}>
                  Tekan tombol SOS merah di halaman beranda. Sistem akan menghitung mundur selama 3 detik sebelum mengirim pesan darurat. Anda dapat membatalkan pengiriman selama hitungan mundur berlangsung.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Kenapa pesan SOS saya gagal terkirim?</Text>
                <Text style={styles.faqAnswer}>
                  Pesan SOS membutuhkan koneksi internet aktif untuk dikirim melalui WhatsApp. Pastikan HP Anda terhubung ke jaringan WiFi atau data seluler saat menggunakan fitur ini.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Bagaimana cara menambah kontak darurat?</Text>
                <Text style={styles.faqAnswer}>
                  Buka menu Kontak Darurat di bagian bawah layar, lalu tekan tombol tambah (+). Isi nama, nomor telepon, dan hubungan kontak, kemudian simpan. Kontak yang ditambahkan akan menerima pesan SOS saat tombol ditekan.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Apakah GPS harus selalu aktif?</Text>
                <Text style={styles.faqAnswer}>
                  GPS tidak harus selalu aktif, namun sangat disarankan agar lokasi Anda dapat terdeteksi dengan akurat saat mengirim SOS. Aktifkan GPS sebelum menggunakan fitur panic button untuk hasil terbaik.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Berapa banyak kontak darurat yang bisa didaftarkan?</Text>
                <Text style={styles.faqAnswer}>
                  Anda dapat mendaftarkan hingga beberapa kontak darurat sekaligus. Semua kontak yang terdaftar akan menerima pesan SOS secara bersamaan saat tombol ditekan.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Bagaimana cara melihat riwayat pengiriman SOS?</Text>
                <Text style={styles.faqAnswer}>
                  Buka menu Riwayat di bagian bawah layar. Di sana Anda dapat melihat seluruh catatan pengiriman SOS beserta status, waktu, lokasi, dan kontak yang dihubungi.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Apa yang dimaksud status "Terkirim Sebagian"?</Text>
                <Text style={styles.faqAnswer}>
                  Status ini muncul ketika pesan SOS berhasil dikirim ke sebagian kontak darurat, namun gagal ke kontak lainnya. Cek koneksi internet atau pastikan nomor kontak yang didaftarkan sudah benar dan aktif di WhatsApp.
                </Text>
              </View>
            </ScrollView>
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
  modalContentTall: { maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  modalCloseBtn: { padding: 4 },
  modalSubtitle: { fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 20 },

  waBubbleWrapper: { backgroundColor: '#e5ddd5', borderRadius: 12, padding: 16, marginBottom: 14 },
  waBubble: { backgroundColor: '#dcf8c6', borderRadius: 10, borderTopRightRadius: 2, padding: 12, alignSelf: 'flex-end', maxWidth: '95%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  waBubbleText: { fontSize: 13, color: '#1a1a1a', lineHeight: 20 },
  waBubbleTime: { fontSize: 10, color: '#4fc3f7', textAlign: 'right', marginTop: 6 },
  modalNote: { fontSize: 11, color: '#94a3b8', lineHeight: 16 },

  privacySection: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginTop: 16, marginBottom: 6 },
  privacyText: { fontSize: 13, color: '#475569', lineHeight: 20 },

  faqItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  faqQuestion: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  faqAnswer: { fontSize: 13, color: '#475569', lineHeight: 20 },
});