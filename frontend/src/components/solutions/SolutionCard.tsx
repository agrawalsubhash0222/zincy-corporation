import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { solutionItem } from '@/constants/solutions';
import { styles } from '@/styles/solutions/solutions.styles';

type Props = {
  item: solutionItem;
  isActive: boolean;
  onPress: () => void;
};

export default function SolutionCard({ item, isActive, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.solutionCard,
        isActive && styles.activesolutionCard,
      ]}
    >
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>

      <Text style={styles.cardText}>{item.shortText}</Text>

      <View style={[styles.arrowCircle, isActive && styles.activeArrow]}>
        <Ionicons
          name={isActive ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={isActive ? '#ffffff' : '#0875ff'}
        />
      </View>
    </TouchableOpacity>
  );
}