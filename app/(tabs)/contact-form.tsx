import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../database/supabaseClient';

type RelationType = 'Keluarga' | 'Petugas Keamanan' | 'Teman' | 'Lainnya';

export default function ContactFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relation, setRelation] = useState<RelationType>('Keluarga');
  const [priority, setPriority] = useState('3');
  const [initials, setInitials] = useState('--');
  const [existingTheme, setExistingTheme] = useState<'red' | 'blue' | 'green' | 'amber'>('red');

  useFocusEffect(
    useCallback(() => {
      if (id && id.trim() !== '') {
        loadExistingContact(id);
      } else {
        setFullName('');
        setPhoneNumber('');
        setRelation('Keluarga');
        setPriority('3');
        setInitials('--');
        setExistingTheme('red');
      }
    }, [id])
  );

  useEffect(() => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      setInitials('--');
      return;
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      setInitials((parts[0][0] + parts[1][0]).toUpperCase());
    } else {
      setInitials(trimmed.slice(0, 2).toUpperCase());
    }
  }, [fullName]);

  const loadExistingContact = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', Number(contactId))
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.name);
        setPhoneNumber(data.phone);
        setRelation((data.relation || 'Keluarga') as RelationType);
        setPriority((data.priority || 3).toString());
        setExistingTheme((data.theme || 'red') as any);
      }
    } catch (error) {
      console.error('Gagal memuat kontak:', error);
    }
  };

  const handleSaveContact = async () => {
    if (!fullName || !phoneNumber) {
      Alert.alert(
        'Peringatan',
        'Mohon lengkapi Nama Lengkap dan Nomor Telepon.'
      );
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'Pengguna belum login.');
        return;
      }

      const themes: Array<'red' | 'blue' | 'green' | 'amber'> = [
        'red',
        'blue',
        'green',
        'amber',
      ];

      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      const isEditMode = Boolean(id && id.trim() !== '');
      const targetTheme = isEditMode ? existingTheme : randomTheme;
      const numericPriority = parseInt(priority, 10);
      const roleLabel = relation === 'Petugas Keamanan' ? 'Petugas' : relation;

      if (isEditMode) {
        const { error } = await supabase
          .from('contacts')
          .update({
            name: fullName,
            phone: phoneNumber,
            relation,
            priority: numericPriority,
            initials,
            theme: targetTheme,
            role: roleLabel,
          })
          .eq('id', Number(id));

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert([
            {
              user_id: user.id,
              name: fullName,
              phone: phoneNumber,
              relation,
              priority: numericPriority,
              initials,
              theme: targetTheme,
              role: roleLabel,
            },
          ]);

        if (error) throw error;
      }

      Alert.alert('Berhasil', 'Kontak berhasil disimpan!', [
        {
          text: 'OK',
          onPress: () => router.push('/contact'),
        },
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Gagal menyimpan kontak.');
    }
  };

  const handleDeleteContact = () => {
    Alert.alert(
      'Hapus Kontak',
      'Apakah Anda yakin ingin menghapus kontak ini secara permanen?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              if (id) {
                const { error } = await supabase
                  .from('contacts')
                  .delete()
                  .eq('id', Number(id));

                if (error) throw error;
              }

              router.push('/contact');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus kontak.');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const isEditMode = Boolean(id && id.trim() !== '');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/contact')}>
          <ArrowLeft size={20} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>{isEditMode ? 'Edit Kontak' : 'Tambah Kontak'}</Text>
        {isEditMode ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteContact}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 34 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarPreview}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nama Lengkap</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="Contoh: Satpam Kampus"
            placeholderTextColor="#ccc"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nomor Telepon</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="+62 8xx-xxxx-xxxx"
            placeholderTextColor="#ccc"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Hubungan</Text>
          <View style={styles.radioGroup}>
            {(['Keluarga', 'Petugas Keamanan', 'Teman', 'Lainnya'] as RelationType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.radioOpt, relation === type && styles.radioOptSelected]}
                onPress={() => setRelation(type)}
                activeOpacity={0.7}
              >
                <Text style={[styles.radioText, relation === type && styles.radioTextSelected]}>
                  {type === 'Petugas Keamanan' ? 'Petugas' : type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Urutan Prioritas Notifikasi</Text>
          <View style={styles.selectWrap}>
            <Picker
              selectedValue={priority}
              onValueChange={(itemValue) => setPriority(itemValue)}
              style={styles.fieldSelect}
            >
              <Picker.Item label="Prioritas 1 – Utama" value="1" color="#1a1a1a" />
              <Picker.Item label="Prioritas 2" value="2" color="#1a1a1a" />
              <Picker.Item label="Prioritas 3" value="3" color="#1a1a1a" />
            </Picker>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={[styles.fieldLabel, { marginBottom: 10 }]}>Metode Pengiriman</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            Pesan darurat akan dikirimkan melalui <Text style={styles.infoBoxBold}>WhatsApp</Text> ke nomor kontak yang telah didaftarkan.
          </Text>
        </View>

        <View style={styles.divider} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveContact} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>{isEditMode ? 'Simpan Perubahan' : 'Simpan Kontak'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 15 : 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  topbarTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  deleteBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  scrollBody: { padding: 20, paddingBottom: 40 },
  avatarPreview: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#b91c1c', fontSize: 22, fontWeight: '600' },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  fieldInput: { width: '100%', paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#f0f0f0', borderRadius: 10, fontSize: 14, color: '#1a1a1a', backgroundColor: '#fafafa' },
  selectWrap: { borderWidth: 1.5, borderColor: '#f0f0f0', borderRadius: 10, backgroundColor: '#fafafa', overflow: 'hidden', justifyContent: 'center' },
  fieldSelect: { width: '100%', height: 50 },
  radioGroup: { flexDirection: 'row', gap: 8 },
  radioOpt: { flex: 1, paddingVertical: 10, borderWidth: 1.5, borderColor: '#f0f0f0', borderRadius: 10, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center' },
  radioOptSelected: { borderColor: '#B91C1C', backgroundColor: '#fff5f5' },
  radioText: { fontSize: 12, fontWeight: '500', color: '#888' },
  radioTextSelected: { color: '#B91C1C' },
  infoBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14 },
  infoBoxText: { fontSize: 13, color: '#166534', lineHeight: 20 },
  infoBoxBold: { fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 20 },
  saveBtn: { width: '100%', padding: 15, borderRadius: 12, backgroundColor: '#B91C1C', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});