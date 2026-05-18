import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground } from 'react-native';

import Navbar from '@/components/layout/Navbar';
import { styles } from '@/styles/home/home.styles';

import HeroSection from './HeroSection';

export default function HomeBanner() {
    return (
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
    );
}