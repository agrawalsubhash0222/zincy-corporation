import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },

    formCard: {
        width: '86%',
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 22,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EAF6FF',
        borderWidth: 1,
        borderColor: '#BAE6FD',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 18,
    },

    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 8,
    },

    subText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },

    mobileText: {
        fontSize: 14,
        color: '#149BD7',
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 26,
    },

    inputBox: {
        height: 52,
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
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: 3,
    },

    error: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 14,
        textAlign: 'center',
    },

    btn: {
        height: 52,
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

    disabled: {
        opacity: 0.65,
    },

    btnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
});