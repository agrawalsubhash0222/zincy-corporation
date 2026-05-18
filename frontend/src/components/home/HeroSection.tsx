import React from 'react';
import { Animated, Text } from 'react-native';

import { useHomeAnimation } from '@/hooks/useHomeAnimation';
import { styles } from '@/styles/home/home.styles';

import HeroBanner from './HeroBanner';
import HeroButtons from './HeroButtons';

export default function HeroSection() {
  const { fade, move } = useHomeAnimation();

  return (
    <Animated.View
      style={[
        styles.heroContent,
        {
          opacity: fade,
          transform: [{ translateY: move }],
        },
      ]}
    >
      <Text style={styles.tagline}>The Future Runs On Technology.</Text>

      <HeroBanner />

      <Text style={styles.subtitle}>
        Zincy Corporation builds and delivers smart, secure, scalable and
        future-ready digital solutions that drive real business impact.
      </Text>

      <HeroButtons />
    </Animated.View>
  );
}