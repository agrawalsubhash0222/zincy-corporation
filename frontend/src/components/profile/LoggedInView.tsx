import {
  Feather,
  Ionicons,
  MaterialIcons
} from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import ProfileLinks from '@/components/profile/ProfileLinks';
import SocialLinks from '@/components/profile/SocialLinks';
import { ProfileUser } from '@/hooks/profile/useProfile';
import { styles } from '@/styles/profile/profile.styles';

type Props = {
  user: ProfileUser;
  onLogout: () => void | Promise<void>;
};

type AdminMenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export default function LoggedInView({ user, onLogout }: Props) {
  const isAdmin = user.role?.toLowerCase() === 'admin';

  const fullName =
    `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer';

  const firstLetter = fullName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await onLogout();
    router.replace('/(website)');
  };

  return (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroCircleOne} />
        <View style={styles.heroCircleTwo} />

        <View style={styles.heroTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstLetter}</Text>
          </View>

          <View style={styles.userInfoBox}>
            <Text numberOfLines={1} style={styles.userName}>
              {fullName}
            </Text>

            <Text style={styles.memberText}>Premium Member</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.editBtn}
            onPress={() => router.push('/profile/edit-profile')}
          >
            <Ionicons name="pencil" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.contactCompactBox}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Feather name="smartphone" size={13} color="#38BDF8" />
            </View>
            <Text numberOfLines={1} style={styles.infoText}>
              {user.mobile}
            </Text>
          </View>

          {!!user.email && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialIcons name="mail-outline" size={14} color="#38BDF8" />
              </View>
              <Text numberOfLines={1} style={styles.infoText}>
                {user.email}
              </Text>
            </View>
          )}
        </View>
      </View>

      {isAdmin && (
        <View style={styles.adminSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Admin Panel</Text>
            <Text style={styles.adminBadge}>ADMIN</Text>
          </View>

          <AdminGroupTitle title="Operations" />

          <AdminMenuItem
            icon="mail-unread-outline"
            title="Enquiries"
            subtitle="View website enquiries"
            onPress={() => router.push('/admin/enquiries')}
          />

          <AdminMenuItem
            icon="clipboard-outline"
            title="Onboarding Requests"
            subtitle="View submitted onboarding details"
            onPress={() => router.push('/admin/onboarding/onboarding-requests')}
          />

          <AdminGroupTitle title="Business Intelligence" />
        </View>
      )}

      <ProfileLinks />

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <View>
          <Text style={styles.logoutText}>Log Out</Text>
          <Text style={styles.logoutSubText}>Securely sign out</Text>
        </View>

        <View style={styles.logoutIconCircle}>
          <Feather name="log-out" size={22} color="#EF4444" />
        </View>
      </TouchableOpacity>

      <SocialLinks />
    </>
  );
}

function AdminMenuItem({ icon, title, subtitle, onPress }: AdminMenuItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.adminMenuItem}
      onPress={onPress}
    >
      <View style={styles.adminMenuLeft}>
        <View style={styles.adminIconCircle}>
          <Ionicons name={icon} size={22} color="#149BD7" />
        </View>

        <View style={styles.adminTextBox}>
          <Text style={styles.adminMenuText}>{title}</Text>
          <Text style={styles.adminMenuSubText}>{subtitle}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
    </TouchableOpacity>
  );
}

function AdminGroupTitle({ title }: { title: string }) {
  return (
    <View style={styles.adminGroupHeader}>
      <Text style={styles.adminGroupTitle}>{title}</Text>
      <View style={styles.adminGroupLine} />
    </View>
  );
}