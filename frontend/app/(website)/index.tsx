import React from 'react';
import { ScrollView } from 'react-native';

import HomeBanner from '@/components/home/HomeBanner';

import { styles } from '@/styles/home/home.styles';

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <HomeBanner />
    </ScrollView>
  );
}