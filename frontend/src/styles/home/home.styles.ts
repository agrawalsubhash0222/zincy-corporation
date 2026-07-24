import { Dimensions, StyleSheet } from 'react-native';

import { buttonStyles } from './button.styles';
import { heroStyles } from './hero.styles';
import { mobileMenuStyles } from './mobileMenu.styles';
import { navbarStyles } from './navbar.styles';

const { width } = Dimensions.get('window');
const isMobile = width < 768;
const { height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: 0,
  },

  backgroundImage: {
    flex: 1,
    width: '100%',
    minHeight: height,
  },

  overlay: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  ...navbarStyles,
  ...mobileMenuStyles,
  ...heroStyles,
  ...buttonStyles,

  // keep this AFTER navbarStyles, otherwise it may get overridden
  navbar: {
    ...navbarStyles.navbar,
    position: 'relative',
    zIndex: 9999,
    elevation: 9999,
  },

  profileButton: {
    position: 'absolute',
    right: isMobile ? 8 : 24,
    top: 18,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  onboardingButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  onboardingButton: {
    marginTop: 50,
    marginBottom: 10,

    width: '72%',          // adjust to your liking
    alignSelf: 'flex-end', // <-- right align

    backgroundColor: '#03113b',

    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#0B1F5B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },

  onboardingIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  onboardingTextBox: {
    flex: 1,
  },

  onboardingButtonTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  onboardingButtonSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    marginTop: 2,
  },

  whatsappFloatingButton: {
    marginTop: -40,
    right: 8,
    bottom: -70,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },

  phoneFloatingButton: {
    position: 'absolute',
    left: -10,
    bottom: 10, // Positioned below WhatsApp and above onboarding button
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0A74DA',
    justifyContent: 'center',
    alignItems: 'center',

    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
});