import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import { styles } from '@/styles/profile/profile.styles';

export default function ProfileHeader() {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace('/(website)')}
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color="#fff"
        />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>My Account</Text>
    </View>
  );
}