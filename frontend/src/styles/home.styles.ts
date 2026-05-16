import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
  flex: 1,
  backgroundColor: '#fff',
  marginTop: -8,
  margin: 0,
},

  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  overlay: {
    flex: 1,
    paddingTop: 0,
  },

  /* =========================
     NAVBAR
  ========================== */

  navbar: {
  height: 92,

  paddingLeft: 70,
  paddingRight: 80,

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',

  backgroundColor: '#ffffff',

  marginTop: -2,

  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 6,
},

  logoContainer: {
  justifyContent: 'center',
  alignItems: 'flex-start',
  marginLeft: -80,
},

  logoImage: {
    width: 170,
    height: 78,
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

  /* =========================
     HERO SECTION
  ========================== */

  heroContent: {
    width: '55%',
    marginTop: 40,
    marginLeft: 60,
  },

  tagline: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 5,
    color: '#2A73FF',
    marginBottom: 24,
  },

  title: {
    fontSize: 78,
    lineHeight: 82,
    fontWeight: '900',
    color: '#00195B',
  },

  blueText: {
    color: '#2E7BFF',
  },

  subtitle: {
    marginTop: 30,
    width: '88%',

    fontSize: 21,
    lineHeight: 36,

    color: '#1E376D',
    fontWeight: '500',
  },

  /* =========================
     BUTTONS
  ========================== */

  buttonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 42,
    gap: 24,
  },

  primaryButton: {
    backgroundColor: '#246BFF',

    paddingHorizontal: 34,
    paddingVertical: 18,

    borderRadius: 14,

    shadowColor: '#246BFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,

    elevation: 6,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },

  outlineButton: {
    paddingHorizontal: 34,
    paddingVertical: 18,

    borderRadius: 14,

    borderWidth: 2,
    borderColor: '#246BFF',

    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  outlineButtonText: {
    color: '#246BFF',
    fontSize: 20,
    fontWeight: '800',
  },
});