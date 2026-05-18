import { router } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

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

  return (
    <>
      <View style={styles.navbar}>
        {isMobile && (
          <TouchableOpacity
            style={styles.hamburgerButton}
            onPress={() => setMenuOpen(prev => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.hamburger}>{menuOpen ? '×' : '☰'}</Text>
          </TouchableOpacity>
        )}

        <Logo />

        {isMobile ? (
          <View style={styles.rightSpace} />
        ) : (
          <View style={styles.menu}>
            {NAV_ITEMS.map(item => (
              <TouchableOpacity key={item.path} onPress={() => goTo(item.path)}>
                <Text style={styles.menuItem}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isMobile && menuOpen && <MobileMenu onNavigate={goTo} />}
    </>
  );
}