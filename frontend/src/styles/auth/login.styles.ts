import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: '100%',
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },

    formCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 22,
        shadowColor: '#0F172A',
        shadowOpacity: 0.1,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 7,
    },

    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#bbe6f9',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 18,
    },

    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 8,
    },

    subtitle: {
        fontSize: 14,
        lineHeight: 21,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 26,
    },

    inputBox: {
        height: 56,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },

    input: {
        flex: 1,
        height: '100%',
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },

    error: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 14,
        textAlign: 'center',
    },

    btn: {
        height: 56,
        borderRadius: 18,
        backgroundColor: '#149BD7',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
        shadowColor: '#149BD7',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 5,
    },

    btnDisabled: {
        opacity: 0.65,
    },

    btnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },

    footerBox: {
        marginTop: 22,
        alignItems: 'center',
    },

    footerText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },

    link: {
        color: '#149BD7',
        fontWeight: '900',
    },
});