// styles/onboarding/loginRequired.styles.ts

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FAFF',
        justifyContent: 'center',
        paddingHorizontal: 22,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },

    iconBox: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: '#EAF4FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },

    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#081C3A',
        textAlign: 'center',
        marginBottom: 10,
    },

    description: {
        fontSize: 15,
        lineHeight: 23,
        color: '#344767',
        textAlign: 'center',
        marginBottom: 12,
    },

    note: {
        fontSize: 13,
        lineHeight: 20,
        color: '#6B7A90',
        textAlign: 'center',
        marginBottom: 24,
    },

    primaryButton: {
        width: '100%',
        height: 52,
        borderRadius: 14,
        backgroundColor: '#009FE3',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    secondaryButton: {
        width: '100%',
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#D5E3F3',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },

    secondaryButtonText: {
        color: '#344767',
        fontSize: 14,
        fontWeight: '700',
    },
});