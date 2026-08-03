import { Entypo, Feather, Ionicons } from '@expo/vector-icons';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

import { styles } from '@/styles/profile/profile.styles';

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/zincycorporation/',
  twitter: 'https://x.com/YOUR_USERNAME',
  facebook: 'https://www.facebook.com/profile.php?id=61592121954303',
  youtube: 'https://www.youtube.com/@YOUR_CHANNEL',
};

export default function SocialLinks() {
  const openSocialLink = async (url: string) => {
    await Linking.openURL(url);
  };

  return (
    <View style={styles.socialCard}>
      <Text style={styles.socialTitle}>Connect With Us</Text>

      <View style={styles.socialRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.socialIcon}
          accessibilityRole="link"
          accessibilityLabel="Open Instagram"
          onPress={() => openSocialLink(SOCIAL_LINKS.instagram)}
        >
          <Ionicons name="logo-instagram" size={24} color="#E1306C" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.socialIcon}
          // accessibilityRole="link"
          // accessibilityLabel="Open X"
          // onPress={() => openSocialLink(SOCIAL_LINKS.twitter)}
        >
          <Entypo name="twitter" size={24} color="#111827" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.socialIcon}
          accessibilityRole="link"
          accessibilityLabel="Open Facebook"
          onPress={() => openSocialLink(SOCIAL_LINKS.facebook)}
        >
          <Ionicons name="logo-facebook" size={24} color="#1877F2" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.socialIcon}
          // accessibilityRole="link"
          // accessibilityLabel="Open YouTube"
          // onPress={() => openSocialLink(SOCIAL_LINKS.youtube)}
        >
          <Feather name="youtube" size={24} color="#FF0000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}