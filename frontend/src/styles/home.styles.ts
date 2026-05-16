import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const isMobile = width < 768;
const isTablet = width >= 768 && width < 1024;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },

  backgroundImage: {
    flex: 1,
    width: '100%',
    minHeight: height,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  navbar: {
    width: '100%',
    height: isMobile ? 72 : 92,
    paddingHorizontal: isMobile ? 14 : 80,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: '#ffffff',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,

    zIndex: 100,
  },

  logoContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  logoImage: {
    width: isMobile ? 118 : 170,
    height: isMobile ? 52 : 78,
    resizeMode: 'contain',
  },

  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isMobile ? 12 : 44,
  },

  menuItem: {
    fontSize: isMobile ? 12 : 18,
    fontWeight: '700',
    color: '#020B2D',
  },

  heroContainer: {
    flex: 1,
    justifyContent: isMobile ? 'flex-start' : 'center',

    paddingHorizontal: isMobile ? 20 : 70,
    paddingTop: isMobile ? 44 : 20,
    paddingBottom: isMobile ? 60 : 80,
  },

  heroContent: {
    width: isMobile ? '100%' : isTablet ? '75%' : '55%',
    maxWidth: isMobile ? 360 : 720,
    marginTop: isMobile ? 10 : 40,
    marginLeft: isMobile ? 0 : 60,
  },

  tagline: {
    fontSize: isMobile ? 13 : 20,
    lineHeight: isMobile ? 22 : 28,
    fontWeight: '800',
    letterSpacing: isMobile ? 3 : 5,
    color: '#2A73FF',
    marginBottom: isMobile ? 18 : 24,
  },

  title: {
    fontSize: isMobile ? 34 : isTablet ? 58 : 78,
    lineHeight: isMobile ? 41 : isTablet ? 64 : 82,
    fontWeight: '900',
    color: '#00195B',
    textTransform: 'uppercase',

    width: '100%',
    maxWidth: '100%',

    ...(Platform.OS === 'web'
      ? {
          whiteSpace: 'normal' as any,
          wordBreak: 'keep-all' as any,
          overflowWrap: 'normal' as any,
        }
      : {}),
  },

  blueText: {
    color: '#2E7BFF',
  },

  subtitle: {
    marginTop: isMobile ? 20 : 30,
    width: isMobile ? '100%' : '88%',

    fontSize: isMobile ? 15 : 21,
    lineHeight: isMobile ? 25 : 36,

    color: '#1E376D',
    fontWeight: '500',
  },

  buttonWrapper: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',

    marginTop: isMobile ? 28 : 42,
    gap: isMobile ? 14 : 24,

    width: isMobile ? '100%' : 'auto',
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
    fontSize: isMobile ? 16 : 20,
    fontWeight: '800',
  },

  outlineButton: {
    paddingHorizontal: isMobile ? 22 : 34,
    paddingVertical: isMobile ? 15 : 18,

    borderRadius: 14,

    borderWidth: 2,
    borderColor: '#246BFF',

    backgroundColor: 'rgba(255,255,255,0.60)',
    alignItems: 'center',
  },

  outlineButtonText: {
    color: '#246BFF',
    fontSize: isMobile ? 16 : 20,
    fontWeight: '800',
  },

  mobileMenuButton: {
    display: isMobile ? 'flex' : 'none',
  },

  desktopOnly: {
    display: isMobile ? 'none' : 'flex',
  },

  mobileOnly: {
    display: isMobile ? 'flex' : 'none',
  },
});