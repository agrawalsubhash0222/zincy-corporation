import React from 'react';
import { Text, View } from 'react-native';

import { styles } from '@/styles/home.styles';

export default function HeroBanner() {
  return (
    <View style={styles.bannerTextWrapper}>
      <View style={styles.tiltedBanner}>
        <View style={styles.smallBlueBox}>
          <Text style={styles.bannerBlue}>TRANSFORMING IDEAS</Text>
        </View>

        <Text style={styles.bannerBlack}>INTO</Text>

        <View style={styles.largeBlueBox}>
          <Text style={styles.bannerBlueLarge}>DIGITAL REALITY</Text>
        </View>
      </View>
    </View>
  );
}