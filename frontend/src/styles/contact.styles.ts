import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const isMobile = width <= 600;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: isMobile ? 22 : 80,
  },

  header: {
    paddingTop: isMobile ? 35 : 55,
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
    lineHeight: isMobile ? 26 : 34,
    color: '#1E376D',
    maxWidth: 760,
  },

  card: {
    backgroundColor: '#F7FAFF',
    borderRadius: 22,
    padding: isMobile ? 22 : 34,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },

  label: {
    fontSize: 15,
    fontWeight: '800',
    color: '#020B2D',
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#DDE7F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111111',
  },

  messageInput: {
    minHeight: 130,
    textAlignVertical: 'top',
  },

  button: {
    backgroundColor: '#008DDA',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },

  infoBox: {
    marginTop: 30,
    marginBottom: 50,
    padding: isMobile ? 22 : 30,
    borderRadius: 22,
    backgroundColor: '#020B2D',
  },

  infoTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 15,
  },

  infoText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '600',
  },
});