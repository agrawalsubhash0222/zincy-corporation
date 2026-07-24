import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import ProfileLinks from '@/components/profile/ProfileLinks';
import SocialLinks from '@/components/profile/SocialLinks';
import { styles } from '@/styles/profile/profile.styles';

export default function GuestView() {
  return (
    <>
      <View style={styles.guestCard}>
        <View style={styles.guestGlowOne} />
        <View style={styles.guestGlowTwo} />

        <View style={styles.guestTopRow}>
          <View style={styles.guestAvatar}>
            <Ionicons name="person-outline" size={30} color="#064e3b" />
          </View>

          <View style={styles.guestTextBox}>
            <Text style={styles.guestTitle}>Welcome Guest !</Text>
            <Text style={styles.guestMiniText}>Login for a better shopping experience</Text>
          </View>
        </View>

        <Text style={styles.guestSubtitle}>
          To track orders, save addresses, get faster checkout and unlock exclusive deals...
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.loginButton}
          onPress={() => router.push('/auth/login')}
        >
          <View style={styles.loginButtonLeft}>
            <Ionicons name="log-in-outline" size={21} color="#fff" />
            <Text style={styles.loginButtonText}>Log In / Sign Up</Text>
          </View>

          <View style={styles.loginArrowCircle}>
            <Ionicons name="arrow-forward" size={18} color="#16a34a" />
          </View>
        </TouchableOpacity>

        <View style={styles.guestBenefitsRow}>
          <View style={styles.guestBenefit}>
            <Ionicons name="flash-outline" size={15} color="#065f46" />
            <Text style={styles.guestBenefitText}>Fast Delivery</Text>
          </View>

          <View style={styles.guestDivider} />

          <View style={styles.guestBenefit}>
            <Ionicons name="pricetag-outline" size={15} color="#065f46" />
            <Text style={styles.guestBenefitText}>Best Deals</Text>
          </View>
        </View>
      </View>

      <ProfileLinks />
      <SocialLinks />
    </>
  );
}