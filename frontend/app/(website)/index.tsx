import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, ScrollView } from 'react-native';

import HeroSection from '@/components/HeroSection';
import Navbar from '@/components/Navbar';
import { styles } from '@/styles/home.styles';

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <ImageBackground
        source={require('@/assets/images/hero-banner.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.98)',
            'rgba(255,255,255,0.92)',
            'rgba(255,255,255,0.72)',
            'rgba(255,255,255,0.35)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.overlay}
        >
          <Navbar />
          <HeroSection />
        </LinearGradient>
      </ImageBackground>
    </ScrollView>
  );
}