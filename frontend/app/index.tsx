import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { styles } from '@/styles/home.styles';

const isMobile = Dimensions.get('window').width <= 600;

type AppPath = '/' | '/about' | '/services' | '/contact';

export default function HomeScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  const move = useRef(new Animated.Value(30)).current;

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(move, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, move]);

  const goTo = (path: AppPath) => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require('@/assets/images/hero-banner.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.98)',
            'rgba(255,255,255,0.92)',
            'rgba(255,255,255,0.72)',
            'rgba(255,255,255,0.35)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.overlay}
        >
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

            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/zincycorp.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {isMobile ? (
              <View style={styles.rightSpace} />
            ) : (
              <View style={styles.menu}>
                <TouchableOpacity onPress={() => goTo('/')}>
                  <Text style={styles.menuItem}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => goTo('/about')}>
                  <Text style={styles.menuItem}>About</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => goTo('/services')}>
                  <Text style={styles.menuItem}>Services</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => goTo('/contact')}>
                  <Text style={styles.menuItem}>Contact</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {isMobile && menuOpen && (
            <View style={styles.mobileMenu}>
              <TouchableOpacity style={styles.mobileMenuItem} onPress={() => goTo('/')}>
                <Text style={styles.mobileMenuText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mobileMenuItem} onPress={() => goTo('/about')}>
                <Text style={styles.mobileMenuText}>About</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mobileMenuItem} onPress={() => goTo('/services')}>
                <Text style={styles.mobileMenuText}>Services</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mobileMenuItemLast} onPress={() => goTo('/contact')}>
                <Text style={styles.mobileMenuText}>Contact</Text>
              </TouchableOpacity>
            </View>
          )}

          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: fade,
                transform: [{ translateY: move }],
              },
            ]}
          >
            <Text style={styles.tagline}>INNOVATE • INTEGRATE • INSPIRE</Text>

            <Text style={styles.title}>TECHNOLOGY</Text>
            <Text style={styles.title}>THAT</Text>
            <Text style={styles.title}>EMPOWERS</Text>
            <Text style={styles.title}>
              <Text style={styles.blueText}>YOUR</Text> BUSINESS
            </Text>

            <Text style={styles.subtitle}>
              Zincy Corporation delivers smart, scalable and secure technology
              solutions to drive real business impact.
            </Text>

            <View style={styles.buttonWrapper}>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => router.push('/services')}
              >
                <Text style={styles.primaryButtonText}>Explore Solutions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineButton}
                activeOpacity={0.85}
                onPress={() => router.push('/contact')}
              >
                <Text style={styles.outlineButtonText}>Contact Us</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}