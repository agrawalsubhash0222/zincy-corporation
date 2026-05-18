import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const isMobile = width <= 600;

export const buttonStyles = StyleSheet.create({
    buttonWrapper: {
        flexDirection: isMobile ? 'column' : 'row',

        alignItems: isMobile ? 'stretch' : 'center',

        marginTop: isMobile ? 32 : 42,

        gap: isMobile ? 16 : 24,

        width: isMobile ? '88%' : 'auto',
    },

    primaryButton: {
        backgroundColor: '#008DDA',

        paddingHorizontal: isMobile ? 22 : 34,
        paddingVertical: isMobile ? 16 : 18,

        borderRadius: 16,

        alignItems: 'center',

        shadowColor: '#008DDA',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },

    primaryButtonText: {
        color: '#ffffff',

        fontSize: isMobile ? 15 : 20,
        fontWeight: '800',
    },

    outlineButton: {
        paddingHorizontal: isMobile ? 22 : 34,
        paddingVertical: isMobile ? 16 : 18,

        borderRadius: 16,

        borderWidth: 2,
        borderColor: '#008DDA',

        backgroundColor: 'rgba(255,255,255,0.65)',

        alignItems: 'center',
    },

    outlineButtonText: {
        color: '#008DDA',

        fontSize: isMobile ? 15 : 20,
        fontWeight: '800',
    },
});