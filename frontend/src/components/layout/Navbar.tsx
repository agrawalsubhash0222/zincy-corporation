import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { NAV_ITEMS } from '@/constants/navigation';
import { styles } from '@/styles/home/home.styles';
import { AppPath } from '@/types/navigation.types';

import Logo from './Logo';
import MobileMenu from './MobileMenu';

const MOBILE_BREAKPOINT = 600;
const NAVBAR_HEIGHT = 72;

export default function Navbar() {
  const { width } = useWindowDimensions();
  const isMobile = width <= MOBILE_BREAKPOINT;

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setMenuOpen(false);
    }
  }, [isMobile]);

  const goTo = (path: AppPath) => {
    setMenuOpen(false);
    router.push(path);
  };

  const goToProfile = () => {
    setMenuOpen(false);
    router.push('/profile');
  };

  return (
    <>
      <View style={[styles.navbar, localStyles.navbar]}>
        {isMobile ? (
          <>
            <View style={localStyles.sideSection}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  menuOpen
                    ? 'Close navigation menu'
                    : 'Open navigation menu'
                }
                hitSlop={10}
                onPress={() =>
                  setMenuOpen(previous => !previous)
                }
                style={styles.hamburgerButton}
              >
                <Text style={styles.hamburger}>
                  {menuOpen ? '×' : '☰'}
                </Text>
              </Pressable>
            </View>

            <View style={localStyles.mobileLogoSection}>
              <Logo />
            </View>

            <View
              style={[
                localStyles.sideSection,
                localStyles.rightSection,
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                hitSlop={10}
                onPress={goToProfile}
                style={[styles.profileButton, localStyles.profileButton]}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={32}

                  color="#1f2121"
                />
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={localStyles.desktopSideSection}>
              <Logo />
            </View>

            <View
              style={[
                styles.menu,
                localStyles.desktopMenu,
              ]}
            >
              {NAV_ITEMS.map(item => (
                <Pressable
                  key={item.path}
                  onPress={() => goTo(item.path)}
                  hitSlop={6}
                >
                  <Text style={styles.menuItem}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View
              style={[
                localStyles.desktopSideSection,
                localStyles.rightSection,
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                hitSlop={10}
                onPress={goToProfile}
                style={[
                  styles.profileButton,
                  localStyles.profileButton,
                ]}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={32}
                  color="#1f2121"
                />
              </Pressable>
            </View>
          </>
        )}
      </View>

      {isMobile && (
        <Modal
          visible={menuOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setMenuOpen(false)}
        >
          <View style={localStyles.mobileMenuLayer}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setMenuOpen(false)}
              accessibilityLabel="Close navigation menu"
            />

            <View
              style={localStyles.mobileMenuPanel}
              onStartShouldSetResponder={() => true}
            >
              <MobileMenu onNavigate={goTo} />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const localStyles = StyleSheet.create({
  navbar: {
    minHeight: NAVBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },

  sideSection: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  rightSection: {
    alignItems: 'flex-end',
  },

  mobileLogoSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  desktopSideSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  desktopMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
    marginRight: 0,
  },

  mobileMenuLayer: {
    flex: 1,
    paddingTop: NAVBAR_HEIGHT,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },

  mobileMenuPanel: {
    width: '100%',
    backgroundColor: '#FFFFFF',
  },

  profileButton: {
    position: 'relative',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    margin: 0,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});