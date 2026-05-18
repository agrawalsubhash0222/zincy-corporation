import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const isMobile = width <= 600;

export const navbarStyles = StyleSheet.create({
    navbar: {
        width: '100%',
        height: 64,

        paddingHorizontal: 32,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        backgroundColor: '#ffffff',

        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 10,

        zIndex: 30,
    },

    hamburgerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -6,
    },

    hamburger: {
        fontSize: 34,
        lineHeight: 38,
        fontWeight: '800',
        color: '#00195B',
        marginLeft: -35,
    },

    rightSpace: {
        width: 44,
        height: 44,
    },

    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',

        height: 64,

        marginLeft:
            Platform.OS === 'web' && width > 768
                ? -10
                : 0,
    },

    logoImage: {
        width: isMobile ? 88 : 100,
        height: isMobile ? 50 : 55,

        resizeMode: 'contain',
        alignItems: 'center',
    },

    menu: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 44,
    },

    menuItem: {
        fontSize: 16,
        fontWeight: '700',
        color: '#020B2D',
    },
});