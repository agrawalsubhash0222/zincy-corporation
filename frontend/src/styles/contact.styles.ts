import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const isMobile = width <= 600;

export const styles = StyleSheet.create({
  contactInfoCard: {
    backgroundColor: '#020B2D',
    borderRadius: isMobile ? 18 : 26,
    padding: isMobile ? 22 : 36,
    marginTop: isMobile ? 24 : 32,
    marginHorizontal: isMobile ? 0 : 0,
    width: '100%',
  },

  contactInfoTitle: {
    color: '#FFFFFF',
    fontSize: isMobile ? 26 : 36,
    fontWeight: '900',
    marginBottom: isMobile ? 20 : 28,
  },

  contactInfoText: {
    color: '#FFFFFF',
    fontSize: isMobile ? 18 : 24,
    fontWeight: '800',
    lineHeight: isMobile ? 30 : 38,
    marginBottom: isMobile ? 8 : 12,
  },

  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  header: {
    paddingTop: 0,
    paddingBottom: 25,
  },

  backText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#008DDA',
    marginBottom: 25,
  },

  title: {
    fontSize: isMobile ? 36 : 54,
    fontWeight: '900',
    color: '#020B2D',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: isMobile ? 16 : 22,
    lineHeight: isMobile ? 28 : 36,
    fontWeight: '500',
    color: '#1E376D',
    maxWidth: 760,
  },

  label: {
    fontSize: 15,
    fontWeight: '800',
    color: '#020B2D',
    marginBottom: 8,
    marginTop: 14,
  },

  messageInput: {
    minHeight: 130,
    textAlignVertical: 'top',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },

  scrollView: {
    flex: 1,
    width: '100%',
  },

  scrollContent: {
    paddingBottom: 60,
  },

  scroll: {
    flex: 1,
    width: '100%',
  },

  content: {
    paddingTop: 70,
    paddingBottom: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  checkboxGrid: {
    width: '100%',
    marginBottom: 18,
    gap: 10,
  },

  dropdownInput: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E5F3',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownText: {
    color: '#020B2D',
    fontSize: 15,
    fontWeight: '700',
  },

  dropdownPlaceholder: {
    color: '#6B7C93',
    fontWeight: '500',
  },

  dropdownBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E5F3',
    padding: 14,
    marginBottom: 18,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFD3EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  checkboxActive: {
    backgroundColor: '#0B8FE8',
    borderColor: '#0B8FE8',
  },

  checkMark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  checkboxText: {
    color: '#020B2D',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  checkboxOptionsWrapper: {
    marginLeft: 32,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7E3F2',
    backgroundColor: '#FFFFFF',

    paddingHorizontal: 22,

    color: '#020B2D',
    fontSize: 16,
    fontWeight: '600',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 11, 45, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  successCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingVertical: 34,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },

  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#020B2D',
    textAlign: 'center',
    marginBottom: 12,
  },

  successMessage: {
    fontSize: 15,
    lineHeight: 24,
    color: '#455B7B',
    textAlign: 'center',
    marginBottom: 26,
  },

  successButton: {
    width: '100%',
    backgroundColor: '#0A96D4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  successButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  container: {
  width: isMobile ? '100%' : '65%',
  maxWidth: 1200,
  alignSelf: 'center',
  paddingHorizontal: isMobile ? 14 : 24,
  marginTop: isMobile ? -20 : -40,
},

card: {
  backgroundColor: '#F7FAFF',
  borderRadius: 22,
  padding: isMobile ? 18 : 34,
  marginTop: 15,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 18,
  elevation: 5,
},

button: {
  backgroundColor: '#008DDA',
  paddingVertical: 16,
  borderRadius: 16,
  marginTop: 24,
  marginBottom: isMobile ? 20 : 0,
  alignItems: 'center',
},

infoBox: {
  marginTop: isMobile ? 60 : 30,
  marginBottom: isMobile ? -50 : -50,

  paddingVertical: isMobile ? 20 : 15,
  paddingHorizontal: isMobile ? 18 : 15,

  borderRadius: 22,
  backgroundColor: '#020B2D',

  width: '100%',
  alignSelf: 'center',
},

infoTitle: {
  color: '#ffffff',
  fontSize: isMobile ? 18 : 24,
  fontWeight: '900',
  marginBottom: 12,
},

infoText: {
  color: '#ffffff',
  fontSize: isMobile ? 14 : 16,
  lineHeight: isMobile ? 24 : 28,
  fontWeight: '600',
},
requiredStar: {
  color: '#EF4444',
  fontWeight: '900',
},

inputError: {
  borderColor: '#EF4444',
},

errorText: {
  color: '#EF4444',
  fontSize: 13,
  fontWeight: '700',
  marginTop: 6,
  marginBottom: 4,
},
});