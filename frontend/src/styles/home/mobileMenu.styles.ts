import { StyleSheet } from 'react-native';

export const mobileMenuStyles = StyleSheet.create({
    mobileMenu: {
        position: 'absolute',
        top: 72,
        left: 0,
        right: 0,

        backgroundColor: '#ffffff',

        paddingHorizontal: 26,
        paddingVertical: 14,

        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
        elevation: 10,

        zIndex: 25,
    },

    mobileMenuItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEA',
    },

    mobileMenuItemLast: {
        paddingVertical: 16,
    },

    mobileMenuText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#00195B',
    },
});