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
            <Ionicons name="person-outline" size={30} color="#075985" />
          </View>

          <View style={styles.guestTextBox}>
            <Text style={styles.guestTitle}>Welcome to Zincy</Text>
            <Text style={styles.guestMiniText}>
              Sign in to access your account
            </Text>
          </View>
        </View>

        <Text style={styles.guestSubtitle}>
          Manage your profile, submit enquiries, and stay connected with
          Zincy Corporation.
        </Text>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.loginButton}
          onPress={() => router.push('/auth/login')}
        >
          <View style={styles.loginButtonLeft}>
            <Ionicons name="log-in-outline" size={21} color="#FFFFFF" />
            <Text style={styles.loginButtonText}>Log In / Sign Up</Text>
          </View>

          <View style={styles.loginArrowCircle}>
            <Ionicons name="arrow-forward" size={18} color="#0284C7" />
          </View>
        </TouchableOpacity>
      </View>

      <ProfileLinks />
      <SocialLinks />
    </>
  );
}