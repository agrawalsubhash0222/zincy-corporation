import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const isMobile = width <= 600;
const isTablet = width > 600 && width <= 1024;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
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

  /* =========================
     NAVBAR
  ========================= */

  navbar: {
  width: '100%',

  height: 64,

  paddingHorizontal: 32,
  paddingVertical: 0,

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',

  backgroundColor: '#ffffff',

  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 10,

  zIndex: 30,
},

  hamburgerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },

  hamburger: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: '#00195B',
    marginLeft: -35,
  },

  rightSpace: {
    width: 44,
    height: 44,
  },

 logoContainer: {
  justifyContent: 'center',
  alignItems: 'center',

  height: 64,

  marginLeft:
    Platform.OS === 'web' && width > 768
      ? -10
      : 0,
},

 logoImage: {
  width: isMobile ? 88 : 100,
  height: isMobile ? 50 : 55,

  resizeMode: 'contain',
  alignItems: 'center',
},

  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 44,
  },

  menuItem: {
    fontSize: 16,
    fontWeight: '700',
    color: '#020B2D',
  },

  /* =========================
     MOBILE MENU
  ========================= */

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

  /* =========================
     HERO SECTION
  ========================= */

  heroContent: {
    width: isMobile ? '92%' : isTablet ? '70%' : '55%',

    marginTop: isMobile ? 18 : 40,
    marginLeft: isMobile ? 22 : 60,

    paddingBottom: isMobile ? 40 : 80,
  },

  tagline: {
    fontSize: isMobile ? 12 : 20,
    lineHeight: isMobile ? 22 : 28,
    fontWeight: '800',
    letterSpacing: isMobile ? 3 : 5,
    color: '#111',

    marginBottom: isMobile ? 10 : 24,
  },

  subtitle: {
    marginTop: isMobile ? 24 : 30,
    width: isMobile ? '90%' : '88%',

    fontSize: isMobile ? 14 : 21,
    lineHeight: isMobile ? 24 : 36,

    color: '#1E376D',
    fontWeight: '500',
  },

  /* =========================
     HERO BANNER TEXT
  ========================= */

  bannerTextWrapper: {
    marginTop: isMobile ? 26 : 35,
    marginBottom: 28,
    alignSelf: 'flex-start',
  },

  tiltedBanner: {
    transform: [{ rotate: '-6deg' }],
    alignSelf: 'flex-start',
  },

  smallBlueBox: {
    backgroundColor: '#0B94D9',
    alignSelf: 'flex-start',

    paddingHorizontal: isMobile ? 18 : 24,
    paddingVertical: isMobile ? 8 : 10,
  },

  bannerBlue: {
    color: '#FFFFFF',

    fontSize: isMobile ? 16 : 28,
    fontWeight: '900',

    letterSpacing: 1,
  },

  bannerBlack: {
    color: '#111111',

    fontSize: isMobile ? 58 : 110,
    fontWeight: '900',

    lineHeight: isMobile ? 65 : 120,

    marginTop: isMobile ? 0 : 8,
    marginBottom: isMobile ? -4 : 8,

    marginLeft: 6,

    letterSpacing: 2,
  },

  largeBlueBox: {
    backgroundColor: '#0B94D9',
    alignSelf: 'flex-start',

    marginTop: isMobile ? 8 : 0,

    paddingHorizontal: isMobile ? 18 : 24,
    paddingVertical: isMobile ? 10 : 12,
  },

  bannerBlueLarge: {
    color: '#FFFFFF',

    fontSize: isMobile ? 34 : 64,
    fontWeight: '900',

    letterSpacing: 2,
  },

  /* =========================
     BUTTONS
  ========================= */

  buttonWrapper: {
    flexDirection: isMobile ? 'column' : 'row',

    alignItems: isMobile ? 'stretch' : 'center',

    marginTop: isMobile ? 32 : 42,

    gap: isMobile ? 16 : 24,

    width: isMobile ? '88%' : 'auto',
  },

  primaryButton: {
    backgroundColor: '#008DDA',

    paddingHorizontal: isMobile ? 22 : 34,
    paddingVertical: isMobile ? 16 : 18,

    borderRadius: 16,

    alignItems: 'center',

    shadowColor: '#008DDA',
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
    paddingVertical: isMobile ? 16 : 18,

    borderRadius: 16,

    borderWidth: 2,
    borderColor: '#008DDA',

    backgroundColor: 'rgba(255,255,255,0.65)',

    alignItems: 'center',
  },

  outlineButtonText: {
    color: '#008DDA',

    fontSize: isMobile ? 15 : 20,
    fontWeight: '800',
  },

  /* =========================
     EXTRA
  ========================= */

  withUsContainer: {
    backgroundColor: '#008DDA',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 8,
  },

  ideaText: {
    marginTop: 18,
    fontSize: isMobile ? 18 : 24,
    color: '#222',
    fontStyle: 'italic',
    fontWeight: '600',
  },
});