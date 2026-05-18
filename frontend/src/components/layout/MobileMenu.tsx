import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { NAV_ITEMS } from '@/constants/navigation';
import { styles } from '@/styles/home/home.styles';
import { AppPath } from '@/types/navigation.types';

type Props = {
  onNavigate: (path: AppPath) => void;
};

export default function MobileMenu({ onNavigate }: Props) {
  return (
    <View style={styles.mobileMenu}>
      {NAV_ITEMS.map((item, index) => {
        const isLast = index === NAV_ITEMS.length - 1;

        return (
          <TouchableOpacity
            key={item.path}
            style={isLast ? styles.mobileMenuItemLast : styles.mobileMenuItem}
            onPress={() => onNavigate(item.path)}
          >
            <Text style={styles.mobileMenuText}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}