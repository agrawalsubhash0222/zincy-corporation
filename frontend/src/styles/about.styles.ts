import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const isMobile = width <= 600;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  content: {
    paddingHorizontal: isMobile ? 22 : 80,
    paddingTop: isMobile ? 35 : 60,
    paddingBottom: 70,
  },

  badge: {
    color: '#008DDA',
    fontSize: isMobile ? 13 : 15,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },

  title: {
    color: '#020B2D',
    fontSize: isMobile ? 34 : 56,
    lineHeight: isMobile ? 44 : 68,
    fontWeight: '900',
    maxWidth: 900,
    marginBottom: 22,
  },

  description: {
    color: '#1E376D',
    fontSize: isMobile ? 16 : 22,
    lineHeight: isMobile ? 28 : 36,
    fontWeight: '500',
    maxWidth: 900,
    marginBottom: 34,
  },

  card: {
    backgroundColor: '#F7FAFF',
    borderRadius: 22,
    padding: isMobile ? 22 : 32,
    marginBottom: 20,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },

  cardTitle: {
    color: '#020B2D',
    fontSize: isMobile ? 22 : 28,
    fontWeight: '900',
    marginBottom: 10,
  },

  cardText: {
    color: '#1E376D',
    fontSize: isMobile ? 15 : 19,
    lineHeight: isMobile ? 25 : 31,
    fontWeight: '500',
  },
});