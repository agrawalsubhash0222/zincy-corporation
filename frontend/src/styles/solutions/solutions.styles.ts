import { Dimensions, StyleSheet } from 'react-native';

import { cardStyles } from './card.styles';
import { ctaStyles } from './cta.styles';
import { detailsStyles } from './details.styles';
import { tabsStyles } from './tabs.styles';

const { width } = Dimensions.get('window');

const isMobile = width <= 700;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',

    paddingHorizontal: isMobile ? 16 : 76,
  },

  scrollContent: {
    paddingBottom: isMobile ? 110 : 70,
  },

  header: {
    paddingTop: isMobile ? 24 : 55,
    paddingBottom: isMobile ? 22 : 28,
  },

  title: {
    fontSize: isMobile ? 28 : 46,
    lineHeight: isMobile ? 36 : 58,

    fontWeight: '900',

    color: '#020B2D',

    marginBottom: 12,
  },

  subtitle: {
    fontSize: isMobile ? 15 : 18,
    lineHeight: isMobile ? 25 : 31,

    color: '#4A5D7A',

    maxWidth: 760,

    fontWeight: '500',
  },

  ...tabsStyles,
  ...cardStyles,
  ...detailsStyles,
  ...ctaStyles,
});