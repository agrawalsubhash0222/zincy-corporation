import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const isMobile = width <= 600;
const isTablet = width > 600 && width <= 1024;

export const heroStyles = StyleSheet.create({
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

    bannerTextWrapper: {
        marginTop: isMobile ? 26 : 35,
        marginBottom: 28,
        alignSelf: 'flex-start',
    },

    tiltedBanner: {
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