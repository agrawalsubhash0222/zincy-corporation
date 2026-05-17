import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const isMobile = width <= 600;
const isTablet = width > 600 && width <= 1024;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isMobile ? 20 : 76,
  },

  header: {
    paddingTop: isMobile ? 28 : 55,
    paddingBottom: 28,
  },

  backText: {
    color: '#0066FF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 20,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF3FF',
    color: '#0066FF',
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 16,
  },

  title: {
    fontSize: isMobile ? 23: 36,
    lineHeight: isMobile ? 44 : 62,
    fontWeight: '900',
    color: '#020B2D',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: isMobile ? 15 : 18,
    lineHeight: isMobile ? 26 : 31,
    color: '#4A5D7A',
    maxWidth: 720,
    fontWeight: '500',
  },

  tabWrapper: {
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE8F6',
    borderRadius: 999,
    padding: 5,
    marginBottom: 28,
    shadowColor: '#08245C',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  tabButton: {
    paddingHorizontal: isMobile ? 14 : 28,
    paddingVertical: 12,
    borderRadius: 999,
  },

  activeTabButton: {
    backgroundColor: '#0066FF',
  },

  tabText: {
    color: '#020B2D',
    fontSize: isMobile ? 13 : 15,
    fontWeight: '800',
  },

  activeTabText: {
    color: '#FFFFFF',
  },

  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginBottom: 20,
  },

  solutionCard: {
    width: isMobile ? '100%' : isTablet ? '47%' : '31.8%',
    minHeight: isMobile ? 210 : 250,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE8F6',
    borderRadius: 22,
    padding: 26,
    position: 'relative',
    shadowColor: '#08245C',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  activesolutionCard: {
    borderColor: '#0066FF',
    backgroundColor: '#F8FBFF',
  },

  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#EAF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  icon: {
    fontSize: 30,
  },

  cardTitle: {
    color: '#020B2D',
    fontSize: isMobile ? 22 : 24,
    lineHeight: isMobile ? 30 : 32,
    fontWeight: '900',
    marginBottom: 12,
    maxWidth: 330,
  },

  cardText: {
    color: '#455B7B',
    fontSize: 16,
    lineHeight: 27,
    fontWeight: '500',
  },

  arrowCircle: {
    position: 'absolute',
    top: 26,
    right: 26,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#D9E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  activeArrow: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },

  arrowText: {
    fontSize: 30,
    lineHeight: 31,
    color: '#0066FF',
    fontWeight: '700',
  },

  activeArrowText: {
    color: '#FFFFFF',
  },

  detailPanel: {
    flexDirection: isMobile ? 'column' : 'row',
    backgroundColor: '#F4F9FF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#D7E8FF',
    padding: isMobile ? 24 : 36,
    marginTop: 12,
    marginBottom: 50,
    gap: 30,
  },

  detailLeft: {
    flex: 1.15,
  },

  detailRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailTitle: {
    fontSize: isMobile ? 25 : 30,
    fontWeight: '900',
    color: '#0066FF',
    marginBottom: 12,
  },

  detailText: {
    fontSize: 16,
    lineHeight: 27,
    color: '#243C63',
    fontWeight: '500',
    marginBottom: 18,
    maxWidth: 520,
  },

  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },

  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0066FF',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 13,
    fontWeight: '900',
    marginRight: 10,
  },

  pointText: {
    fontSize: 15,
    color: '#243C63',
    fontWeight: '700',
  },

  quoteButton: {
    backgroundColor: '#0066FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 14,
  },

  quoteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  bigIcon: {
    fontSize: isMobile ? 90 : 135,
    marginBottom: 18,
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },

  metricCard: {
    width: isMobile ? 95 : 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1ECFA',
  },

  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#020B2D',
  },

  metricLabel: {
    fontSize: 13,
    color: '#52627A',
    fontWeight: '700',
    marginTop: 4,
  },

  ctaBox: {
    backgroundColor: '#020B2D',
    borderRadius: 22,
    padding: isMobile ? 24 : 34,
    marginBottom: 50,
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    gap: 20,
  },

  ctaTitle: {
    color: '#FFFFFF',
    fontSize: isMobile ? 22 : 26,
    fontWeight: '900',
    marginBottom: 8,
  },

  ctaText: {
    color: '#DCE8FF',
    fontSize: 16,
    fontWeight: '500',
  },

  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 12,
  },

  ctaButtonText: {
    color: '#0066FF',
    fontSize: 15,
    fontWeight: '900',
  },
  illustrationBox: {
  width: '100%',
  minHeight: 320,
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
},

phoneMockup: {
  width: 170,
  height: 300,
  borderRadius: 36,
  backgroundColor: '#DCE9FF',
  borderWidth: 6,
  borderColor: '#244B9B',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#003087',
  shadowOpacity: 0.18,
  shadowRadius: 18,
  shadowOffset: {
    width: 0,
    height: 12,
  },
  elevation: 8,
},

phoneEmoji: {
  fontSize: 74,
},

socialBubbleFacebook: {
  position: 'absolute',
  top: 40,
  right: 30,
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: '#1877F2',
  alignItems: 'center',
  justifyContent: 'center',
},

socialBubbleYoutube: {
  position: 'absolute',
  top: 135,
  right: 10,
  width: 64,
  height: 64,
  borderRadius: 20,
  backgroundColor: '#FF0000',
  alignItems: 'center',
  justifyContent: 'center',
},

socialBubbleInstagram: {
  position: 'absolute',
  bottom: 50,
  right: 30,
  width: 68,
  height: 68,
  borderRadius: 22,
  backgroundColor: '#E1306C',
  alignItems: 'center',
  justifyContent: 'center',
},

socialText: {
  color: '#FFFFFF',
  fontSize: 34,
  fontWeight: '900',
},

statsCard: {
  position: 'absolute',
  left: 10,
  bottom: 90,
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 18,
  paddingVertical: 14,
  borderRadius: 18,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: {
    width: 0,
    height: 4,
  },
  elevation: 4,
},

followersCard: {
  position: 'absolute',
  right: 20,
  bottom: -5,
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 18,
  paddingVertical: 14,
  borderRadius: 18,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: {
    width: 0,
    height: 4,
  },
  elevation: 4,
},

statsValue: {
  fontSize: 24,
  fontWeight: '900',
  color: '#020B2D',
},

statsLabel: {
  fontSize: 13,
  fontWeight: '700',
  color: '#5B6B85',
  marginTop: 4,
},
});