import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import { styles } from '@/styles/profile/profile.styles';

const LINKS = [
  {
    id: 'faq',
    title: 'FAQs',
    subtitle: 'Get help and common answers',
    icon: 'help-circle-outline' as const,
    route: '/shop/legal/faqs',
  },
  {
    id: 'about',
    title: 'About Us',
    subtitle: 'Know more about Rahul Hardware',
    icon: 'storefront-outline' as const,
    route: '/shop/info/about',
  },
  {
    id: 'contact',
    title: 'Contact Us',
    subtitle: 'Call, WhatsApp, or email support',
    icon: 'call-outline' as const,
    route: '/shop/info/contact',
  },
  {
    id: 'refund',
    title: 'Refund & Cancellation',
    subtitle: 'View refund and cancellation policy',
    icon: 'cash-outline' as const,
    route: '/shop/info/refund-policy',
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    subtitle: 'Read our service policies',
    icon: 'document-text-outline' as const,
    route: '/shop/legal/terms',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    subtitle: 'How your data is protected',
    icon: 'shield-checkmark-outline' as const,
    route: '/shop/legal/privacy',
  },
];

export default function ProfileLinks() {
  return (
    <View style={styles.linksCard}>
      <Text style={styles.linksTitle}>Support & Legal</Text>

      {LINKS.map((item) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.85}
          style={styles.linkItem}
          onPress={() => router.push(item.route as any)}
        >
          <View style={styles.linkIconCircle}>
            <Ionicons name={item.icon} size={21} color="#10B981" />
          </View>

          <View style={styles.linkTextBox}>
            <Text style={styles.linkTitle}>{item.title}</Text>
            <Text style={styles.linkSubtitle}>{item.subtitle}</Text>
          </View>

          <Feather name="chevron-right" size={21} color="#94A3B8" />
        </TouchableOpacity>
      ))}
    </View>
  );
}