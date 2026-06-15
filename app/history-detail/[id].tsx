import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  MapPin,
  Share2,
  Trash2,
  XCircle
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Supabase
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';


interface SOSHistory {
  id: string;
  location: string;
  date_str: string;
  time_str: string;
  recipients: string;
  status: 'Terkirim' | 'Sebagian' | 'Gagal';
  created_at?: string;
}

export default function HistoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [data, setData] = useState<SOSHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [namaMahasiswa, setNamaMahasiswa] = useState('');
  const [npmMahasiswa, setNpmMahasiswa] = useState('-');
  const [prodiMahasiswa, setProdiMahasiswa] = useState('-');

  useEffect(() => {
    if (!id || !session?.user?.id) return;

    const fetchDetail = async () => {
      try {
        setIsLoading(true);

        const { data: result, error } = await supabase
          .from('sos_history')
          .select('*')
          .eq('id', id)
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        setData(result as SOSHistory);
      } catch (e: any) {
        console.error('Gagal memuat detail riwayat:', JSON.stringify({
          message: e?.message,
          code: e?.code,
          details: e?.details,
          hint: e?.hint,
        }, null, 2));
      } finally {
        setIsLoading(false);
      }
    };

    const fetchProfil = async () => {
    try {
      const { data: profil, error } = await supabase
        .from('profiles')  // sesuaikan nama tabel profil kamu
        .select('full_name, npm, prodi')
        .eq('id', session.user.id)
        .single();

      if (!error && profil) {
        setNamaMahasiswa(profil.full_name || '');
        setNpmMahasiswa(profil.npm || '-');
        setProdiMahasiswa(profil.prodi || '-');
      }
    } catch (e) {
      console.error('Gagal fetch profil:', e);
    }
  };

    fetchDetail();
    fetchProfil();
  }, [id, session]);

  const handleOpenMaps = () => {
    if (!data?.location) return;

    // Bersihkan tanda kutip jika ada di awal/akhir string
    const cleanLocation = data.location.replace(/^"|"$/g, '').trim();
    const encoded = encodeURIComponent(cleanLocation);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

    Linking.openURL(googleMapsUrl).catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka Google Maps.');
    });
  };

  const handleCopyMessage = async () => {
    if (!data) return;
    const cleanLocation = data.location.replace(/^"|"$/g, '').trim();
    const text = `[DARURAT - PANIC BUTTON]\n\nSaya membutuhkan bantuan segera!\n\nLokasi saya: ${cleanLocation}\n\nWaktu: ${data.date_str}, ${data.time_str}\nDikirim via PanicButtonApp`;
    await Clipboard.setStringAsync(text);
    Alert.alert('Berhasil', 'Isi pesan darurat berhasil disalin ke clipboard!');
  };

  const handleShareSOS = async () => {
    if (!data) return;
    const cleanLocation = data.location.replace(/^"|"$/g, '').trim();
    try {
      await Share.share({
        message: `Detail SOS PanicButtonApp (ID: ${data.id})\n\nWaktu: ${data.date_str}, ${data.time_str}\nLokasi: ${cleanLocation}\nDikirim ke: ${data.recipients}\nStatus: ${data.status}`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteHistory = () => {
    Alert.alert(
      'Hapus Riwayat',
      'Apakah Anda yakin ingin menghapus catatan riwayat SOS ini secara permanen?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('sos_history')
                .delete()
                .eq('id', id)
                .eq('user_id', session?.user?.id);

              if (error) throw error;

              Alert.alert('Sukses', 'Riwayat berhasil dihapus.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (e) {
              Alert.alert('Error', 'Gagal menghapus riwayat.');
            }
          }
        },
      ]
    );
  };

  // Loading / not found state
  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Detail SOS</Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {isLoading ? 'Memuat data detail riwayat...' : 'Data tidak ditemukan.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSuccess = data.status === 'Terkirim';
  const isPartial = data.status === 'Sebagian';
  const isFailed = data.status === 'Gagal';
  const cleanLocation = data.location.replace(/^"|"$/g, '').trim();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Topbar Navigation */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Detail SOS</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareSOS} activeOpacity={0.7}>
          <Share2 size={18} color="#B91C1C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>

        {/* Status Banner */}
        <View style={[
          styles.statusBanner,
          isSuccess && styles.bannerSuccess,
          isPartial && styles.bannerPartial,
          isFailed && styles.bannerFailed
        ]}>
          {isFailed ? (
            <XCircle size={20} color="#b91c1c" />
          ) : (
            <CheckCircle2 size={20} color={isPartial ? '#a16207' : '#16a34a'} />
          )}
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={[
              styles.bannerTitle,
              { color: isFailed ? '#991b1b' : isPartial ? '#a16207' : '#15803d' }
            ]}>
              {isSuccess ? 'SOS Berhasil Dikirim' : isPartial ? 'SOS Terkirim Sebagian' : 'SOS Gagal Terkirim'}
            </Text>
            <Text style={[
              styles.bannerSub,
              { color: isFailed ? '#b91c1c' : isPartial ? '#a16207' : '#16a34a' }
            ]} numberOfLines={1}>
              Target: {data.recipients}
            </Text>
          </View>
        </View>

        {/* Info Lokasi - Tap untuk buka Google Maps */}
        <TouchableOpacity style={styles.mapWrap} onPress={handleOpenMaps} activeOpacity={0.7}>
          <MapPin size={28} color="#B91C1C" />
          <Text style={styles.mapLabel}>Lokasi saat SOS dikirim</Text>
          <Text style={styles.mapCoord}>{cleanLocation}</Text>
          <Text style={styles.mapHint}>Ketuk untuk buka di Google Maps</Text>
        </TouchableOpacity>

        {/* Log Informasi Detail */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Tanggal</Text>
            <Text style={styles.detailVal}>{data.date_str}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Waktu</Text>
            <Text style={styles.detailVal}>{data.time_str}</Text>
          </View>
          <View style={[styles.detailRow, styles.noBorder]}>
            <Text style={styles.detailKey}>Status Akhir</Text>
            <View style={[
              styles.badge,
              isSuccess && styles.badgeSuccess,
              isPartial && styles.badgePartial,
              isFailed && styles.badgeFailed
            ]}>
              <Text style={[
                styles.badgeText,
                { color: isFailed ? '#b91c1c' : isPartial ? '#a16207' : '#16a34a' }
              ]}>
                {data.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Kartu Preview Konten Pesan SOS */}
        <View style={styles.msgCard}>
          <View style={styles.msgHeader}>
            <Text style={styles.msgLabel}>Format Pesan Terkirim</Text>
            <TouchableOpacity style={styles.msgCopy} onPress={handleCopyMessage} activeOpacity={0.6}>
              <Copy size={12} color="#B91C1C" style={{ marginRight: 4 }} />
              <Text style={styles.msgCopyText}>Salin</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.msgText}>
            [DARURAT - PANIC BUTTON UNILA]{'\n\n'}
                  Saya membutuhkan bantuan segera!{'\n\n'}
                  Nama: {namaMahasiswa}{'\n'}
                  NPM: {npmMahasiswa}{'\n'}
                  Prodi: {prodiMahasiswa}{'\n\n'}
                  Lokasi saya: [Alamat GPS]{'\n'}
                  Koordinat: https://maps.google.com/?q=[koordinat]
          </Text>
        </View>

        {/* Tombol Hapus Riwayat */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteHistory} activeOpacity={0.8}>
          <Trash2 size={16} color="#B91C1C" />
          <Text style={styles.deleteBtnText}>Hapus riwayat ini</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 15 : 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  topbarTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  shareBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  scrollBody: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyText: { fontSize: 13, color: '#aaa' },

  statusBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerSuccess: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  bannerPartial: { backgroundColor: '#fefce8', borderColor: '#fde68a' },
  bannerFailed: { backgroundColor: '#fff1f2', borderColor: '#fecaca' },
  bannerTitle: { fontSize: 13, fontWeight: '600' },
  bannerSub: { fontSize: 11, marginTop: 2 },

  mapWrap: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  mapLabel: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginTop: 6 },
  mapCoord: { fontSize: 11, color: '#3b82f6', marginTop: 4, textAlign: 'center', lineHeight: 16 },
  mapHint: { fontSize: 10, color: '#93c5fd', marginTop: 6, fontStyle: 'italic' },

  detailCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  noBorder: { borderBottomWidth: 0 },
  detailKey: { fontSize: 13, color: '#666' },
  detailVal: { fontSize: 13, color: '#1a1a1a', fontWeight: '500', textAlign: 'right' },

  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeSuccess: { backgroundColor: '#dcfce7' },
  badgePartial: { backgroundColor: '#fef9c3' },
  badgeFailed: { backgroundColor: '#fee2e2' },

  msgCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  msgLabel: { fontSize: 11, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.3 },
  msgCopy: { flexDirection: 'row', alignItems: 'center' },
  msgCopyText: { fontSize: 11, color: '#B91C1C', fontWeight: '600' },
  msgText: { fontSize: 13, color: '#444', lineHeight: 20, backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#f0f0f0' },

  deleteBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: '#B91C1C', marginLeft: 6 },
});