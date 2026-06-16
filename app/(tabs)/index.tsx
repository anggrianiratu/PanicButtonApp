import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {
  Bell,
  MapPin,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  TriangleAlert
} from 'lucide-react-native';

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SMS from 'expo-sms';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { addHistory, fetchContacts, fetchUserProfile } from '../database/repository';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const NOTIF_STORAGE_KEY = 'app_notifications';

interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  timestamp: number;
}

const sendWhatsAppSOS = async (target: string, message: string, retries = 2): Promise<boolean> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const params = new URLSearchParams();
      params.append('target', target);
      params.append('message', message);

      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': 'K15NCj1YiKzUCB1sPG2m',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const jsonResult = await response.json();

      if (jsonResult.status) {
        return true;
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.log("Detail Error WhatsApp:", error.message);
    }

    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
};

// Fungsi format waktu
const formatTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export default function HomeScreen() {
  const { session } = useAuth();
  const [currentDate, setCurrentDate] = useState('');
  const [locationName, setLocationName] = useState('Mencari lokasi GPS...');
  const [coordinates, setCoordinates] = useState('Menghubungkan sinyal...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [namaUser, setNamaUser] = useState('Memuat nama...');
  const [npmUser, setNpmUser] = useState('');
  const [prodiUser, setProdiUser] = useState('');

  const [daftarNomor, setDaftarNomor] = useState<string[]>([]);
  const [namaKontak, setNamaKontak] = useState<string[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isToastVisible, setIsToastVisible] = useState(false);

  const [isNotifVisible, setIsNotifVisible] = useState(false);
  const [pushNotifications, setPushNotifications] = useState<AppNotification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  const progressWidth = useRef(new Animated.Value(100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Muat notifikasi dari AsyncStorage saat pertama kali buka
  const muatNotifikasi = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIF_STORAGE_KEY);
      let existing: AppNotification[] = stored ? JSON.parse(stored) : [];

      // Tambahkan notif "Sistem Keamanan Aktif" setiap kali buka aplikasi
      const notifSistem: AppNotification = {
        id: `system-${Date.now()}`,
        title: 'Sistem Keamanan Aktif',
        body: 'Layanan pemantauan GPS dan Panic Button berjalan dengan baik.',
        time: formatTime(),
        timestamp: Date.now(),
      };

      const updated = [notifSistem, ...existing];
      await AsyncStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      setPushNotifications(updated);
      setHasUnread(true);
    } catch (e) {
      console.error('Gagal memuat notifikasi:', e);
    }
  };

  // Simpan notifikasi baru ke AsyncStorage dan state
  const simpanNotifikasi = async (title: string, body: string) => {
    try {
      const newNotif: AppNotification = {
        id: `NOTIF-${Date.now()}`,
        title,
        body,
        time: formatTime(),
        timestamp: Date.now(),
      };

      const stored = await AsyncStorage.getItem(NOTIF_STORAGE_KEY);
      const existing: AppNotification[] = stored ? JSON.parse(stored) : [];
      const updated = [newNotif, ...existing];

      await AsyncStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      setPushNotifications(updated);
      setHasUnread(true);
    } catch (e) {
      console.error('Gagal menyimpan notifikasi:', e);
    }
  };

  const hapusSemuaNotifikasi = async () => {
    try {
      await AsyncStorage.removeItem(NOTIF_STORAGE_KEY);
      setPushNotifications([]);
      setHasUnread(false);
    } catch (e) {
      console.error('Gagal menghapus notifikasi:', e);
    }
  };

  // Sinkronisasi data real-time dari Supabase setiap kali layar mendapat fokus
  useFocusEffect(
    useCallback(() => {
      const syncDataDariSupabase = async () => {
        try {
          const storedContacts = await fetchContacts();
          if (storedContacts && storedContacts.length > 0) {
            setDaftarNomor(storedContacts.map((c: any) => c.phone));
            setNamaKontak(storedContacts.map((c: any) => c.name || c.phone));
          } else {
            setDaftarNomor([]);
            setNamaKontak([]);
          }
        } catch (e) {
          console.error("Gagal sinkronisasi data dari Supabase:", e);
        }
      };

      syncDataDariSupabase();
    }, [])
  );

  useEffect(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const now = new Date();
    const formattedDate = `${days[now.getDay()]} , ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    setCurrentDate(formattedDate);

    ambilNamaPengguna();
    ambilLokasiGPS(false);
    muatNotifikasi();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [session]);

  const ambilNamaPengguna = async () => {
    if (!session?.user?.id) return;
    try {
      const userProfile = await fetchUserProfile(session.user.id);
      if (userProfile) {
        setNamaUser(userProfile.full_name || 'Mahasiswa');
        setNpmUser(userProfile.npm || '-');
        setProdiUser(userProfile.prodi || '-');
      }
    } catch (e) {
      setNamaUser('Mahasiswa');
    }
  };

  const ambilLokasiGPS = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    setLocationName('Memperbarui lokasi...');
    setCoordinates('Membaca satelit GPS...');

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationName('Akses GPS Ditolak');
        setCoordinates('Izin lokasi tidak diberikan');
        if (isManualRefresh) {
          Alert.alert('Izin Ditolak', 'Aktifkan izin lokasi di pengaturan HP untuk mendeteksi posisi darurat.');
        }
        return;
      }

      let currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentPosition.coords;
      setCoordinates(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);

      let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (reverseGeocode.length > 0) {
        let alamat = reverseGeocode[0];
        let namaTempat = alamat.name || alamat.street || 'Lokasi Terdeteksi';
        let subDaerah = alamat.district || alamat.subregion || '';
        setLocationName(`${namaTempat}${subDaerah ? ', ' + subDaerah : ''}`);
      } else {
        setLocationName('Koordinat Berhasil Terkunci');
      }

    } catch (error) {
      setLocationName('Gagal Mendapatkan Lokasi');
      setCoordinates('Pastikan GPS HP aktif');
    } finally {
      if (isManualRefresh) setIsRefreshing(false);
    }
  };

  const refreshLocation = () => {
    ambilLokasiGPS(true);
  };

  const triggerSOS = () => {
    if (daftarNomor.length === 0) {
      Alert.alert(
        "Peringatan Kontak",
        "Anda belum mengisi daftar kontak darurat. Silakan isi kontak yang dapat dihubungi terlebih dahulu pada menu pengaturan/profil.",
        [{ text: "Mengerti" }]
      );
      return;
    }

    setIsModalVisible(true);
    setCountdown(3);
    progressWidth.setValue(100);

    Animated.timing(progressWidth, {
      toValue: 0,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownInterval.current) clearInterval(countdownInterval.current);
          executeSendSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    if (countdownInterval.current !== null) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    progressWidth.stopAnimation();
    setIsModalVisible(false);
  };

  const simpanRiwayatSOS = async (
    statusKirim: 'Terkirim' | 'Gagal' | 'Sebagian',
    lokasiSaatIni: string,
    kontakYangDikirimi: string[]
  ) => {
    try {
      if (!session?.user?.id) {
        console.error("User tidak ditemukan (belum login)");
        return;
      }

      const today = new Date();
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      const dateStr = `${today.getDate()} ${monthsShort[today.getMonth()]} ${today.getFullYear()}`;
      const timeStr = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
      const recipients = kontakYangDikirimi.join(', ');

      await addHistory({
        user_id: session.user.id,
        location: JSON.stringify(lokasiSaatIni),
        date_str: dateStr,
        time_str: timeStr,
        recipients,
        status: statusKirim
      });

    } catch (error) {
      console.error("Gagal merekam riwayat SOS ke Supabase:", error);
    }
  };

  const executeSendSOS = async () => {
    setIsModalVisible(false);
    setIsToastVisible(true);

    await ambilLokasiGPS(false);

    const teksPesan = `[DARURAT - PANIC BUTTON UNILA]\n\nSaya membutuhkan bantuan segera!\n\nNama: ${namaUser}\nNPM: ${npmUser}\nProdi: ${prodiUser}\n\nLokasi saya: ${locationName}\nKoordinat: https://maps.google.com/?q=${coordinates.replace(/\s+/g, '')}`;

    let berhasil: string[] = [];
    let gagal: string[] = [];
    const smsAman = await SMS.isAvailableAsync();

    for (let i = 0; i < daftarNomor.length; i++) {
      const nomor = daftarNomor[i];
      const nama = namaKontak[i] || nomor;

      const isWhatsAppSuccess = await sendWhatsAppSOS(nomor, teksPesan);

      if (isWhatsAppSuccess) {
        berhasil.push(nama);
      } else {
        gagal.push(nama);

        if (smsAman) {
          try {
            await SMS.sendSMSAsync([nomor], teksPesan);
            berhasil.push(nama);
            gagal.pop();
          } catch (e) {
            console.log("Pengiriman SMS otomatis gagal.");
          }
        } else {
          Linking.openURL(`sms:${nomor}?body=${encodeURIComponent(teksPesan)}`);
        }
      }
    }

    let statusAkhir: 'Terkirim' | 'Gagal' | 'Sebagian';
    let notifTitle = '';
    let notifBody = '';

    if (gagal.length === 0) {
      statusAkhir = 'Terkirim';
      notifTitle = '✅ Sinyal SOS Terkirim';
      notifBody = `Pesan darurat berhasil dikirim ke ${berhasil.length} kontak darurat Anda.`;
    } else if (berhasil.length === 0) {
      statusAkhir = 'Gagal';
      notifTitle = '❌ Sinyal SOS Gagal';
      notifBody = `Pesan darurat gagal dikirim ke semua kontak. Harap periksa jaringan internet atau pulsa Anda!`;
    } else {
      statusAkhir = 'Sebagian';
      notifTitle = '⚠️ SOS Terkirim Sebagian';
      notifBody = `Pesan berhasil dikirim ke ${berhasil.length} kontak, namun gagal dikirim ke ${gagal.length} kontak lainnya.`;
    }

    await simpanRiwayatSOS(statusAkhir, locationName, berhasil.length > 0 ? berhasil : namaKontak);
    await simpanNotifikasi(notifTitle, notifBody);

    try {
      const { status: statusNotif } = await Notifications.requestPermissionsAsync();
      if (statusNotif === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notifTitle,
            body: notifBody,
            sound: true,
          },
          trigger: null,
        });
      }
    } catch (err) {
      console.log('Notifikasi push terhambat:', err);
    }

    setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* TOPBAR */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.topbarGreeting}>Halo, <Text style={styles.topbarName}>{namaUser}</Text></Text>
        </View>

        <TouchableOpacity
          style={styles.topbarIcon}
          onPress={() => {
            setIsNotifVisible(true);
            setHasUnread(false);
          }}
        >
          <Bell size={24} color="#334155" />
          {hasUnread ? <View style={styles.notifDot} /> : null}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <ShieldCheck size={20} color="#059669" />
            <Text style={styles.infoTitle}>Sistem Keamanan Aktif</Text>
          </View>
          <Text style={styles.infoDesc}>
            Aplikasi siap merespons keadaan darurat Anda. Pastikan GPS dan koneksi internet selalu stabil.
          </Text>
        </View>

        {/* LOCATION CARD */}
        <View style={styles.locCard}>
          <View style={styles.locHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin size={16} color="#B91C1C" />
              <Text style={styles.locLabel}>Lokasi GPS Terkini</Text>
            </View>
            <TouchableOpacity onPress={refreshLocation} disabled={isRefreshing} style={styles.refreshBtn}>
              <RefreshCw size={14} color="#64748b" style={isRefreshing ? { opacity: 0.5 } : undefined} />
            </TouchableOpacity>
          </View>

          <Text style={styles.locText} numberOfLines={2}>{locationName}</Text>
          <Text style={styles.locCoord}>{coordinates}</Text>
        </View>

        {/* SOS SECTION */}
        <View style={styles.sosSection}>
          <Text style={styles.sosHintTop}>Butuh Bantuan Cepat?</Text>

          <View style={styles.sosRingOuter}>
            <Animated.View style={[styles.sosRingInner, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity style={styles.sosBtn} onPress={triggerSOS} activeOpacity={0.8}>
                <TriangleAlert size={36} color="#fff" />
                <Text style={styles.sosBtnText}>SOS</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Text style={styles.sosHint}>Tekan untuk mengirim pesan & koordinat</Text>
        </View>

        {/* QUICK CONTACT STATUS */}
        <View style={styles.contactStatusCard}>
          <PhoneCall size={20} color="#475569" />
          <View style={styles.contactStatusText}>
            <Text style={styles.contactTitle}>Kontak Darurat Tersimpan</Text>
            <Text style={styles.contactDesc}>
              {daftarNomor.length > 0
                ? `${daftarNomor.length} kontak siap dihubungi saat darurat.`
                : 'Belum ada kontak. Harap isi sekarang!'}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* NOTIFICATION MODAL */}
      <Modal visible={isNotifVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '60%' }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.modalTitle}>Notifikasi</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                {pushNotifications.length > 0 && (
                  <TouchableOpacity onPress={hapusSemuaNotifikasi}>
                    <Text style={styles.btnClearText}>Hapus Semua</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsNotifVisible(false)}>
                  <Text style={styles.btnCloseText}>Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>

            {pushNotifications.length === 0 ? (
              <Text style={styles.emptyNotif}>Belum ada notifikasi.</Text>
            ) : (
              <FlatList
                data={pushNotifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.notifItem}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifBody}>{item.body}</Text>
                    <Text style={styles.notifTime}>{item.time}</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* SOS COUNTDOWN MODAL */}
      <Modal transparent visible={isModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitleSOS}>Mengirim Sinyal SOS…</Text>
            <Text style={styles.modalCountdown}>{countdown}</Text>

            <View style={styles.modalProgressContainer}>
              <Animated.View
                style={[
                  styles.modalProgressBar,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
            </View>

            <TouchableOpacity onPress={cancelSOS} style={styles.btnCancel}>
              <Text style={styles.btnCancelText}>Batalkan Pengiriman</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TOAST */}
      {isToastVisible && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ Sistem sedang memproses...</Text>
        </View>
      )}

    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  btnClearText: { fontSize: 14, color: '#ef4444', fontWeight: '600' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dateText: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  topbarGreeting: { fontSize: 18, color: '#334155' },
  topbarName: { fontWeight: '700', color: '#0f172a' },
  topbarIcon: { position: 'relative', padding: 4 },
  notifDot: { position: 'absolute', width: 10, height: 10, backgroundColor: '#ef4444', borderRadius: 5, top: 2, right: 4, borderWidth: 1.5, borderColor: '#fff' },

  body: { padding: 20 },

  infoCard: { backgroundColor: '#ecfdf5', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#d1fae5' },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoTitle: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#065f46' },
  infoDesc: { fontSize: 12, color: '#047857', lineHeight: 18 },

  locCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, marginBottom: 30 },
  locHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  locLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginLeft: 6 },
  refreshBtn: { padding: 4 },
  locText: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  locCoord: { fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' },

  sosSection: { alignItems: 'center', marginVertical: 10 },
  sosHintTop: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 20 },
  sosRingOuter: { width: 180, height: 180, borderRadius: 90, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fee2e2' },
  sosRingInner: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fca5a5' },
  sosBtn: { backgroundColor: '#dc2626', width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  sosBtnText: { color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 4 },
  sosHint: { fontSize: 13, color: '#64748b', marginTop: 20 },

  contactStatusCard: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 16, marginTop: 30, borderRadius: 12, alignItems: 'center' },
  contactStatusText: { marginLeft: 12, flex: 1 },
  contactTitle: { fontSize: 13, fontWeight: '600', color: '#334155' },
  contactDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.6)' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalTitleSOS: { fontSize: 18, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  btnCloseText: { fontSize: 14, color: '#0284c7', fontWeight: '600' },

  emptyNotif: { textAlign: 'center', color: '#94a3b8', marginTop: 20 },
  notifItem: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 10 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  notifBody: { fontSize: 13, color: '#475569', lineHeight: 18 },
  notifTime: { fontSize: 11, color: '#94a3b8', marginTop: 8, textAlign: 'right' },

  modalCountdown: { fontSize: 56, fontWeight: '800', textAlign: 'center', color: '#dc2626', marginVertical: 20 },
  modalProgressContainer: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 24 },
  modalProgressBar: { height: '100%', backgroundColor: '#dc2626' },
  btnCancel: { padding: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, alignItems: 'center' },
  btnCancelText: { fontWeight: '700', color: '#475569', fontSize: 15 },

  toast: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, elevation: 4 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '500' },
});