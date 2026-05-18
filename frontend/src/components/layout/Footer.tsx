import React from 'react';
import { Text, View } from 'react-native';

import { styles } from '@/styles/footer.styles';

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        © {new Date().getFullYear()} Zincy Corporation Pvt. Ltd. All Rights Reserved.
      </Text>
    </View>
  );
}