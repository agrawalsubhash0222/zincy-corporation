import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const isMobile = width <= 700;
const isTablet = width > 700 && width <= 1050;

export const cardStyles = StyleSheet.create({
    servicesWrapper: {
        width: '100%',
    },

    cardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',

        gap: isMobile ? 18 : 24,

        marginBottom: 24,
    },

    solutionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D8E8FF',
    borderRadius: 26,
    padding: isMobile ? 28 : 36,
    minHeight: isMobile ? 310 : 330,
    flex: isMobile ? undefined : 1,
    shadowColor: '#0877FF',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  
    activesolutionCard: {
        borderColor: '#0066FF',
        backgroundColor: '#F8FBFF',
    },

    iconBox: {
        width: isMobile ? 58 : 64,
        height: isMobile ? 58 : 64,

        borderRadius: 18,

        backgroundColor: '#EAF6FF',

        alignItems: 'center',
        justifyContent: 'center',

        marginBottom: 20,
    },

    icon: {
        fontSize: isMobile ? 28 : 30,
    },

    cardTitle: {
        color: '#020B2D',

        fontSize: isMobile ? 22 : 24,
        lineHeight: isMobile ? 29 : 32,

        fontWeight: '900',

        marginBottom: 10,

        paddingRight: 58,
    },

    cardText: {
        color: '#455B7B',

        fontSize: isMobile ? 15 : 16,
        lineHeight: isMobile ? 24 : 27,

        fontWeight: '500',

        paddingRight: isMobile ? 8 : 0,
    },

    arrowCircle: {
        position: 'absolute',

        top: isMobile ? 24 : 34,
        right: isMobile ? 22 : 34,

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
});