import React from 'react';
import { Image, View } from 'react-native';

import { styles } from '@/styles/home.styles';

export default function Logo() {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('@/assets/images/zincycorp.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </View>
  );
}