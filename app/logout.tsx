import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';

const handleLogout = async () => {
  try {
    await AsyncStorage.removeItem('isLoggedIn');

    router.replace('/login');
  } catch (error) {
    Alert.alert('Eror', 'Gagal logout');
  }
};