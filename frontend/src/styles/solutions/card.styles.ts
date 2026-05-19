import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const isMobile = width <= 700;
const isTablet = width > 700 && width <= 1050;

export const cardStyles = StyleSheet.create({
  servicesWrapper: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },

  cardGrid: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,

    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: isMobile ? 18 : 24,

    marginBottom: 24,
  },

  solutionCard: {
    width: isMobile ? '100%' : isTablet ? '48%' : '31%',
    maxWidth: '100%',
    minWidth: 0,

    flexShrink: 1,
    flexGrow: 1,

    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,

    borderWidth: 1,
    borderColor: '#E3ECF7',

    marginBottom: 18,

    overflow: 'hidden',
  },

  activesolutionCard: {
    borderColor: '#0066FF',
    backgroundColor: '#F8FBFF',
  },

  cardTop: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',

    marginBottom: 18,
  },

  solutionCardContent: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,

    flexShrink: 1,
  },

  iconBox: {
    width: isMobile ? 58 : 64,
    height: isMobile ? 58 : 64,

    borderRadius: 18,

    backgroundColor: '#EAF6FF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: isMobile ? 28 : 30,
  },

  cardTitle: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,

    color: '#020B2D',

    fontSize: isMobile ? 22 : 24,
    lineHeight: isMobile ? 29 : 32,

    fontWeight: '900',

    marginBottom: 10,

    flexShrink: 1,
    flexWrap: 'wrap',
  },

  cardText: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,

    color: '#455B7B',

    fontSize: isMobile ? 15 : 16,
    lineHeight: isMobile ? 24 : 27,

    fontWeight: '500',

    flexShrink: 1,
    flexWrap: 'wrap',
  },

  arrowCircle: {
    width: isMobile ? 44 : 46,
    height: isMobile ? 44 : 46,

    borderRadius: 23,

    borderWidth: 1,
    borderColor: '#dbeafe',

    backgroundColor: '#ffffff',

    alignItems: 'center',
    justifyContent: 'center',
  },

  activeArrow: {
    backgroundColor: '#0875ff',
    borderColor: '#0875ff',
  },

  solutionTitle: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,

    color: '#020B2D',
    fontSize: 24,
    fontWeight: '900',

    marginTop: 18,
    marginBottom: 12,

    flexShrink: 1,
    flexWrap: 'wrap',
  },

  solutionDescription: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,

    color: '#4C6380',
    fontSize: 16,
    lineHeight: 26,

    flexShrink: 1,
    flexWrap: 'wrap',
  },
});