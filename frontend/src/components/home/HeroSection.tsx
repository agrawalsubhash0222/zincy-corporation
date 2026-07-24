import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Alert,
  Animated,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useHomeAnimation } from '@/hooks/useHomeAnimation';
import { styles } from '@/styles/home/home.styles';
import { getSession } from '@/utils/session';

import HeroBanner from './HeroBanner';
import HeroButtons from './HeroButtons';

export default function HeroSection() {
  const { fade, move } = useHomeAnimation();

  const openWhatsApp = () => {
    const phone = '917033097278';
    const message =
      'Hello Zincy Corporation, I want to know more about your services.';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(url);
  };

  const makePhoneCall = async () => {
    const phoneNumber = '+917033097278';
    const url = `tel:${phoneNumber}`;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Unable to open phone dialer.');
    }
  };

  const handleStartOnboarding = async () => {
    const session = await getSession();

    if (session?.mobile) {
      router.push('/onboarding/check');
    } else {
      router.push('/onboarding/login-required');
    }
  };

  return (
    <Animated.View
      style={[
        styles.heroContent,
        {
          opacity: fade,
          transform: [{ translateY: move }],
        },
      ]}
    >
      <Text style={styles.tagline}>The Future Runs On Technology.</Text>

      <HeroBanner />

      <Text style={styles.subtitle}>
        Zincy Corporation builds and delivers smart, secure, scalable and
        future-ready digital solutions that drive real business impact.
      </Text>

      <HeroButtons />

      {/* WhatsApp Floating Button */}
      <TouchableOpacity
        style={styles.whatsappFloatingButton}
        activeOpacity={0.9}
        onPress={openWhatsApp}
      >
        <Ionicons name="logo-whatsapp" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Phone Floating Button */}
      <TouchableOpacity
        style={styles.phoneFloatingButton}
        activeOpacity={0.9}
        onPress={makePhoneCall}
      >
        <Ionicons name="call" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Start Onboarding */}
      <TouchableOpacity
        style={styles.onboardingButton}
        activeOpacity={0.9}
        onPress={handleStartOnboarding}
      >
        <Ionicons name="add-circle" size={22} color="#fff" />

        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.onboardingButtonTitle}>
            Start Onboarding
          </Text>

          <Text style={styles.onboardingButtonSubtitle}>
            Let's build your digital journey
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}