import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const isMobile = width <= 700;

export const tabsStyles = StyleSheet.create({
    tabWrapper: {
        width: isMobile ? '100%' : 450,
        alignSelf: 'center',

        flexDirection: 'row',

        backgroundColor: '#FFFFFF',

        borderWidth: 1,
        borderColor: '#DFE8F6',

        borderRadius: 999,

        padding: 5,
        marginBottom: 26,

        shadowColor: '#08245C',
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },

        elevation: 3,
    },

    tabButton: {
        flex: 1,

        paddingHorizontal: isMobile ? 6 : 18,
        paddingVertical: isMobile ? 12 : 13,

        borderRadius: 999,

        alignItems: 'center',
        justifyContent: 'center',
    },

    tabText: {
        color: '#020B2D',

        fontSize: isMobile ? 12 : 15,
        lineHeight: isMobile ? 17 : 20,

        fontWeight: '800',
        textAlign: 'center',
    },

    activeTabButton: {
        backgroundColor: '#0066FF',
    },

    activeTabText: {
        color: '#FFFFFF',
    },
});