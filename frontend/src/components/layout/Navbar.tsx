import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { NAV_ITEMS } from '@/constants/navigation';
import { styles } from '@/styles/home/home.styles';
import { AppPath } from '@/types/navigation.types';

import Logo from './Logo';
import MobileMenu from './MobileMenu';

export default function Navbar() {
  const { width } = useWindowDimensions();
  const isMobile = width <= 600;

  const [menuOpen, setMenuOpen] = useState(false);

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
      <View style={styles.navbar}>
        {isMobile && (
          <Pressable
            style={styles.hamburgerButton}
            onPress={() => setMenuOpen(prev => !prev)}
          >
            <Text style={styles.hamburger}>
              {menuOpen ? '×' : '☰'}
            </Text>
          </Pressable>
        )}

        <Logo />

        {!isMobile && (
          <View style={styles.menu}>
            {NAV_ITEMS.map(item => (
              <Pressable
                key={item.path}
                onPress={() => goTo(item.path)}
              >
                <Text style={styles.menuItem}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          style={styles.loginButton}
          onPress={goToProfile}
        >
          <Ionicons
            name="person-circle-outline"
            size={32}
            color="#1f2121"
          />
        </Pressable>
      </View>

      {isMobile && menuOpen && (
        <MobileMenu onNavigate={goTo} />
      )}
    </>
  );
}