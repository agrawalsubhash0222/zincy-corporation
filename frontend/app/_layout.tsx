import { Stack } from 'expo-router';
import { View } from 'react-native';

import Footer from '@/common/Footer';

import './global.css';

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      <Footer />
    </View>
  );
}