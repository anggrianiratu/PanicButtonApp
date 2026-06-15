import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Info, Plus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../database/repository';

// Interface disesuaikan dengan tipe kolom SQLite Anda
export interface Contact {
  id: string;
  name: string;
  role: string;
  category: 'Petugas Keamanan' | 'Keluarga' | 'Teman' | 'Lainnya';
  phone: string;
  priority: number;
  initials: string;
  theme: 'red' | 'blue' | 'green' | 'amber';
}

export default function ContactScreen() {
  const router = useRouter();
  const [contactsData, setContactsData] = useState<Contact[]>([]);

  useFocusEffect(
    useCallback(() => {
      try {
        const storedContacts = db.getAllSync(
          'SELECT * FROM contacts ORDER BY category ASC, priority ASC'
        ) as Contact[];
        
        if (storedContacts && storedContacts.length > 0) {
          setContactsData(storedContacts);
        } else {
          setContactsData([]);
        }
      } catch (error) {
        console.error("Gagal memuat kontak dari SQLite:", error);
        setContactsData([]);
      }
    }, [])
  );

  // Navigasi Type-Safe Expo Router tanpa "as any"
  const handleNavigateToForm = (contactId?: string) => {
    if (contactId) {
      router.push({
        pathname: '/contact-form',
        params: { id: contactId }
      });
    } else {
      router.push('/contact-form');
    }
  };

  const renderContactItem = ({ item, index }: { item: Contact; index: number }) => {
    const avatarThemes = {
      red: { bg: styles.avRed, text: '#b91c1c' },
      blue: { bg: styles.avBlue, text: '#1d4ed8' },
      green: { bg: styles.avGreen, text: '#15803d' },
      amber: { bg: styles.avAmber, text: '#a16207' },
    };

    const currentAvatarTheme = avatarThemes[item.theme] || avatarThemes.red;
    const avatarStyles = [styles.avatar, currentAvatarTheme.bg];

    const priorityThemes = {
      1: { bg: styles.badge1, text: '#b91c1c' },
      2: { bg: styles.badge2, text: '#a16207' },
      3: { bg: styles.badge3, text: '#6b7280' },
    };

    const currentPriorityTheme = priorityThemes[item.priority as 1 | 2 | 3] || priorityThemes[3];
    const badgeStyles = [styles.priorityBadge, currentPriorityTheme.bg];
    const showCategoryLabel = index === 0 || contactsData[index - 1].category !== item.category;

    return (
      <View>
        {showCategoryLabel && (
          <Text style={styles.sectionLabel}>{item.category}</Text>
        )}
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => handleNavigateToForm(item.id)}
          activeOpacity={0.7}
        >
          <View style={avatarStyles}>
            <Text style={[styles.avatarText, { color: currentAvatarTheme.text }]}>
              {item.initials}
            </Text>
          </View>
          
          <View style={styles.contactInfo}>
            <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.contactRole} numberOfLines={1}>{item.role}</Text>
            <Text style={styles.contactPhone}>{item.phone}</Text>
          </View>

          <View style={badgeStyles}>
            <Text style={[styles.badgeText, { color: currentPriorityTheme.text }]}>
              P{item.priority}
            </Text>
          </View>

          <ChevronRight size={16} color="#ddd" style={styles.chevron} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Kontak Darurat</Text>
        <TouchableOpacity 
          style={styles.addBtnTop} 
          onPress={() => handleNavigateToForm()}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={contactsData}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        contentContainerStyle={styles.listBody}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          contactsData.length > 0 ? (
            <View style={styles.infoBanner}>
              <Info size={14} color="#991b1b" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Sinyal SOS dikirimkan berurutan via WhatsApp API
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <TouchableOpacity 
            style={styles.addBtnBottom} 
            onPress={() => handleNavigateToForm()}
            activeOpacity={0.7}
          >
            <Plus size={16} color="#B91C1C" />
            <Text style={styles.addBtnBottomText}>Tambah kontak darurat baru</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Info size={40} color="#e5e5e5" />
            <Text style={{ fontSize: 13, color: '#bbb', textAlign: 'center', marginTop: 8 }}>
              Belum ada kontak darurat terdaftar.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 15 : 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  topbarTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  addBtnTop: { width: 34, height: 34, backgroundColor: '#B91C1C', borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  listBody: { paddingBottom: 40, paddingTop: 14, flexGrow: 1 },
  infoBanner: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff5f5', borderColor: '#fecaca', borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { marginRight: 8 },
  infoText: { fontSize: 11, color: '#991b1b' },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
  contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f7f7f7' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '600' },
  avRed: { backgroundColor: '#fee2e2' },
  avBlue: { backgroundColor: '#dbeafe' },
  avGreen: { backgroundColor: '#dcfce7' },
  avAmber: { backgroundColor: '#fef9c3' },
  contactInfo: { flex: 1, marginLeft: 12, paddingRight: 8 },
  contactName: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  contactRole: { fontSize: 11, color: '#888', marginTop: 1 },
  contactPhone: { fontSize: 11, color: '#bbb', marginTop: 1 },
  priorityBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  badgeText: { fontSize: 10, fontWeight: '500' },
  badge1: { backgroundColor: '#fee2e2' },
  badge2: { backgroundColor: '#fef9c3' },
  badge3: { backgroundColor: '#f3f4f6' },
  chevron: { marginLeft: 4 },
  addBtnBottom: { marginHorizontal: 20, marginTop: 12, borderWidth: 1.5, borderColor: '#e5e5e5', borderStyle: 'dashed', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  addBtnBottomText: { fontSize: 13, color: '#aaa', marginLeft: 6, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
});