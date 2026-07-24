import { Entypo, Feather, Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { styles } from '@/styles/profile/profile.styles';

export default function SocialLinks() {
  return (
    <View style={styles.socialCard}>
      <Text style={styles.socialTitle}>Connect With Us</Text>

      <View style={styles.socialRow}>
        <TouchableOpacity activeOpacity={0.8} style={styles.socialIcon}>
          <Ionicons name="logo-instagram" size={24} color="#E1306C" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.socialIcon}>
          <Entypo name="twitter" size={24} color="#111827" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.socialIcon}>
          <Ionicons name="logo-facebook" size={24} color="#1877F2" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.socialIcon}>
          <Feather name="youtube" size={24} color="#FF0000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}