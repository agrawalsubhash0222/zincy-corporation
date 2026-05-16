import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const isMobile = width <= 600;
const isTablet = width > 600 && width <= 1024;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginTop: -15,
  },

  backgroundImage: {
    flex: 1,
    width: '100%',
    minHeight: height,
  },

  overlay: {
    flex: 1,
  },

  navbar: {
    width: '100%',
    height: isMobile ? 72 : 92,

    paddingHorizontal: isMobile ? 20 : 80,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: isMobile ? 'space-between' : 'space-between',

    backgroundColor: isMobile ? '#ffffff' : '#ffffff',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,

    zIndex: 30,
  },

  hamburgerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    marginTop: 14,
  },

  hamburger: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: '#00195B',
  },

  rightSpace: {
    width: 44,
    height: 44,
  },

  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',

    marginLeft:
      Platform.OS === 'web' && width > 768
        ? -100
        : 0,
  },

  logoImage: {
    width: isMobile ? 125 : 170,
    height: isMobile ? 58 : 78,
  },

  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 44,
  },

  menuItem: {
    fontSize: 18,
    fontWeight: '700',
    color: '#020B2D',
  },

  mobileMenu: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,

    backgroundColor: '#ffffff',

    paddingHorizontal: 26,
    paddingVertical: 14,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 10,

    zIndex: 25,
  },

  mobileMenuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },

  mobileMenuItemLast: {
    paddingVertical: 16,
  },

  mobileMenuText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00195B',
  },

  heroContent: {
    width: isMobile ? '92%' : isTablet ? '70%' : '55%',
    marginTop: isMobile ? 34 : 40,
    marginLeft: isMobile ? 24 : 60,
  },

  tagline: {
    fontSize: isMobile ? 12 : 20,
    lineHeight: isMobile ? 22 : 28,
    fontWeight: '800',
    letterSpacing: isMobile ? 3 : 5,
    color: '#2A73FF',
    marginBottom: isMobile ? 22 : 24,
  },

  title: {
    fontSize: isMobile ? 34 : isTablet ? 58 : 78,
    lineHeight: isMobile ? 41 : isTablet ? 64 : 82,
    fontWeight: '900',
    color: '#00195B',
  },

  blueText: {
    color: '#2E7BFF',
  },

  subtitle: {
    marginTop: isMobile ? 22 : 30,
    width: isMobile ? '90%' : '88%',
    fontSize: isMobile ? 14 : 21,
    lineHeight: isMobile ? 24 : 36,
    color: '#1E376D',
    fontWeight: '500',
  },

  buttonWrapper: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    marginTop: isMobile ? 28 : 42,
    gap: isMobile ? 14 : 24,
    width: isMobile ? '88%' : 'auto',
  },

  primaryButton: {
    backgroundColor: '#246BFF',
    paddingHorizontal: isMobile ? 22 : 34,
    paddingVertical: isMobile ? 15 : 18,
    borderRadius: 14,
    alignItems: 'center',

    shadowColor: '#246BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: isMobile ? 15 : 20,
    fontWeight: '800',
  },

  outlineButton: {
    paddingHorizontal: isMobile ? 22 : 34,
    paddingVertical: isMobile ? 15 : 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#246BFF',
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
  },

  outlineButtonText: {
    color: '#246BFF',
    fontSize: isMobile ? 15 : 20,
    fontWeight: '800',
  },
});