import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { styles } from '@/styles/home/home.styles';

export default function HeroButtons() {
  return (
    <View style={styles.buttonWrapper}>
      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={() => router.push('/solutions')}
      >
        <Text style={styles.primaryButtonText}>Explore Solutions</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.outlineButton}
        activeOpacity={0.85}
        onPress={() => router.push('/contact')}
      >
        <Text style={styles.outlineButtonText}>Contact Us</Text>
      </TouchableOpacity>
    </View>
  );
}