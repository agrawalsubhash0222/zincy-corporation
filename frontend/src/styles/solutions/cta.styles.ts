import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const isMobile = width <= 700;

export const ctaStyles = StyleSheet.create({
    ctaBox: {
        backgroundColor: '#020B2D',

        borderRadius: 24,

        padding: isMobile ? 22 : 13,

        marginBottom: -50,

        flexDirection: isMobile ? 'column' : 'row',

        alignItems: isMobile ? 'stretch' : 'center',

        justifyContent: 'space-between',

        gap: 20,
    },

    ctaContent: {
        flex: 1,
    },

    ctaTitle: {
        color: '#FFFFFF',

        fontSize: isMobile ? 20 : 26,

        fontWeight: '900',

        marginBottom: 8,
    },

    ctaText: {
        color: '#DCE8FF',

        fontSize: isMobile ? 15 : 16,
        lineHeight: isMobile ? 23 : 24,

        fontWeight: '500',

        marginLeft: isMobile ? 30 : 45,
    },

    ctaButton: {
        backgroundColor: '#FFFFFF',

        paddingHorizontal: 28,
        paddingVertical: 15,

        borderRadius: 14,

        alignItems: 'center',
    },

    ctaButtonText: {
        color: '#0066FF',

        fontSize: 15,
        fontWeight: '900',
    },
});