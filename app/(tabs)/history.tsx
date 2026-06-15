import { useFocusEffect, useRouter } from 'expo-router';
import { Inbox, MapPin, Sliders, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// INTEGRASI SUPABASE
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../database/supabaseClient';

// Definisi tipe data struktur riwayat (Type-Safe & Match Supabase)
export interface HistoryItem {
  id: string;
  created_at?: string;
  date_str: string;
  time_str: string;
  monthGroup?: string;
  status: 'Terkirim' | 'Gagal' | 'Sebagian';
  location: string;
  recipients: string;
  extraInfo?: string;
  user_id?: string;
}

type FilterType = 'Semua' | 'Terkirim' | 'Gagal';

export default function HistoryScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('Semua');
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk Modal Filter Lanjutan
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('Semua');

  // Load data riwayat SOS dari Supabase secara Realtime / Focus
  useFocusEffect(
    useCallback(() => {
      const fetchHistoryFromSupabase = async () => {
        if (!session?.user?.id) return;
        
        try {
          setIsLoading(true);
          
          // Mengambil data dari tabel 'sos_history' milik user yang sedang login
          const { data, error } = await supabase
            .from('sos_history')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (data) {
            setHistoryData(data as HistoryItem[]);
          }
        } catch (error) {
          // Paksa tipe data menjadi 'any' di dalam variabel baru agar TS tidak komplain
          const errorAman = error as any;
          
          console.error('Gagal memuat riwayat SOS dari Supabase:', errorAman.message || errorAman);
          console.log('Detail Error Supabase:', JSON.stringify(errorAman, null, 2));
        } finally {
          setIsLoading(false);
        }
      };

      fetchHistoryFromSupabase();
    }, [session])
  );

  // Mendapatkan daftar 3 bulan terakhir secara otomatis
  const availableMonths = useMemo(() => {
    const months = ['Semua'];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      months.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));
    }
    return months;
  }, []);

  const totalSos = historyData.length;
  const totalSuccess = historyData.filter(item => item.status === 'Terkirim' || item.status === 'Sebagian').length;
  const totalFailed = historyData.filter(item => item.status === 'Gagal').length;

  // Memfilter data berdasarkan Tab Status DAN Bulan
  const filteredHistory = historyData.filter(item => {
    const matchStatus = 
      activeFilter === 'Semua' ||
      (activeFilter === 'Terkirim' && (item.status === 'Terkirim' || item.status === 'Sebagian')) ||
      (activeFilter === 'Gagal' && item.status === 'Gagal');

    const matchMonth = selectedMonthFilter === 'Semua' || item.monthGroup === selectedMonthFilter;

    return matchStatus && matchMonth;
  });

  // Mengelompokkan riwayat berdasarkan kelompok bulan
  const groups = filteredHistory.reduce((acc, item) => {
  const month = item.monthGroup ?? 'Tidak diketahui';

  if (!acc[month]) {
    acc[month] = [];
  }

  acc[month].push(item);

  return acc;
}, {} as Record<string, HistoryItem[]>);

  const getBadgeStyle = (status: HistoryItem['status']) => {
    switch (status) {
      case 'Terkirim': return styles.badgeSuccess;
      case 'Gagal': return styles.badgeFail;
      case 'Sebagian': return styles.badgePartial;
    }
  };

  const getBadgeTextStyle = (status: HistoryItem['status']) => {
    switch (status) {
      case 'Terkirim': return styles.badgeTextSuccess;
      case 'Gagal': return styles.badgeTextFail;
      case 'Sebagian': return styles.badgeTextPartial;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Topbar Layout */}
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Riwayat SOS</Text>
        <TouchableOpacity 
          onPress={() => setIsFilterModalVisible(true)}
          style={[styles.filterBtn, selectedMonthFilter !== 'Semua' && styles.filterBtnActive]}
        >
          <Sliders size={18} color={selectedMonthFilter !== 'Semua' ? '#B91C1C' : '#aaa'} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs Component */}
      <View style={styles.filterTabs}>
        {(['Semua', 'Terkirim', 'Gagal'] as FilterType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeFilter === tab && styles.tabActive]}
            onPress={() => setActiveFilter(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeFilter === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tampilan Ringkasan Statistik */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalSos}</Text>
          <Text style={styles.statLabel}>Total SOS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, styles.textGreen]}>{totalSuccess}</Text>
          <Text style={styles.statLabel}>Berhasil</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, styles.textRed]}>{totalFailed}</Text>
          <Text style={styles.statLabel}>Gagal</Text>
        </View>
      </View>

      {/* Konten Utama Daftar Riwayat */}
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Memuat riwayat SOS...</Text>
          </View>
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Inbox size={44} color="#e5e5e5" />
            <Text style={styles.emptyStateText}>
              {selectedMonthFilter !== 'Semua' 
                ? `Tidak ada riwayat SOS pada periode ${selectedMonthFilter}.`
                : 'Belum ada riwayat SOS terdaftar.'
              }
            </Text>
          </View>
        ) : (
          Object.keys(groups).map((month) => (
            <View key={month}>
              <Text style={styles.monthLabel}>{month}</Text>
              {groups[month].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.histItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    // Berpindah ke rute dinamis detail secara type-safe dengan segment objek path
                    router.push({
                      pathname: '/history-detail/[id]',
                      params: { id: item.id }
                    });
                  }}
                >
                  <View style={styles.histHeader}>
                    <Text style={styles.histTime}>{item.date_str}, {item.time_str}</Text>
                    <View style={[styles.badge, getBadgeStyle(item.status)]}>
                      <Text style={[styles.badgeText, getBadgeTextStyle(item.status)]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.histLoc}>
                    <MapPin size={12} color="#B91C1C" />
                    <Text style={styles.locText} numberOfLines={1}>{item.location}</Text>
                  </View>
                  
                  <Text style={styles.histTo}>
                    Dikirim ke: <Text style={styles.histToSpan}>{item.recipients}</Text>
                    {item.extraInfo && <Text style={styles.histToSub}> {item.extraInfo}</Text>}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Bottom Sheet Filter Lanjutan */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Lanjutan</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <X size={20} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Berdasarkan Bulan/Periode</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthOptionsWrap}>
              {availableMonths.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthOptionCard,
                    selectedMonthFilter === month && styles.monthOptionCardActive
                  ]}
                  onPress={() => setSelectedMonthFilter(month)}
                >
                  <Text style={[
                    styles.monthOptionText,
                    selectedMonthFilter === month && styles.monthOptionTextActive
                  ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.applyBtn}
              onPress={() => setIsFilterModalVisible(false)}
            >
              <Text style={styles.applyBtnText}>Terapkan Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 15 : 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  topbarTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  filterBtn: { padding: 4, borderRadius: 6 },
  filterBtnActive: { backgroundColor: '#fff5f5' },
  filterTabs: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 4 },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 },
  tabActive: { backgroundColor: '#fff5f5' },
  tabText: { fontSize: 12, fontWeight: '500', color: '#aaa' },
  tabTextActive: { color: '#B91C1C' },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  statCard: { flex: 1, backgroundColor: '#fafafa', borderRadius: 10, padding: 10, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  statLabel: { fontSize: 10, color: '#aaa', marginTop: 2 },
  textRed: { color: '#B91C1C' },
  textGreen: { color: '#16a34a' },
  scrollBody: { backgroundColor: '#fff', paddingBottom: 30, flexGrow: 1 },
  monthLabel: { fontSize: 11, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4, backgroundColor: '#f5f5f5' },
  histItem: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f7f7f7' },
  histHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  histTime: { fontSize: 13, fontWeight: '500', color: '#1a1a1a' },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '500' },
  badgeSuccess: { backgroundColor: '#dcfce7' },
  badgeTextSuccess: { color: '#15803d' },
  badgeFail: { backgroundColor: '#fee2e2' },
  badgeTextFail: { color: '#b91c1c' },
  badgePartial: { backgroundColor: '#fef9c3' },
  badgeTextPartial: { color: '#a16207' },
  histLoc: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  locText: { fontSize: 12, color: '#888', flex: 1 },
  histTo: { fontSize: 11, color: '#bbb' },
  histToSpan: { color: '#888', fontWeight: '500' },
  histToSub: { color: '#ef4444' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24, gap: 10 },
  emptyStateText: { fontSize: 13, color: '#bbb', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  filterSectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 12 },
  monthOptionsWrap: { gap: 8, paddingBottom: 4 },
  monthOptionCard: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#f5f5f5' },
  monthOptionCardActive: { backgroundColor: '#fff5f5', borderColor: '#fecaca' },
  monthOptionText: { fontSize: 12, color: '#555', fontWeight: '500' },
  monthOptionTextActive: { color: '#B91C1C', fontWeight: '600' },
  applyBtn: { backgroundColor: '#B91C1C', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  applyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' }
});