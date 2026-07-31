import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },

    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    header: {
        height: 60,
        paddingHorizontal: 18,
        backgroundColor: '#06223A',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },

    backBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
    },

    scrollContent: {
        padding: 18,
        paddingBottom: 40,
    },

    avatarBox: {
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 20,
    },

    avatarCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#38BDF8',
        borderWidth: 4,
        borderColor: '#EAF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#075985',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.16,
        shadowRadius: 9,
        elevation: 5,
    },

    avatarText: {
        color: '#06223A',
        fontSize: 28,
        fontWeight: '900',
    },

    avatarHint: {
        marginTop: 10,
        color: '#5B7188',
        fontSize: 13,
        fontWeight: '700',
    },

    formCard: {
        padding: 18,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#075985',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },

    label: {
        marginTop: 14,
        marginBottom: 8,
        color: '#102A43',
        fontSize: 13,
        fontWeight: '800',
    },

    input: {
        minHeight: 52,
        paddingHorizontal: 15,
        borderRadius: 16,
        backgroundColor: '#F4F8FB',
        borderWidth: 1,
        borderColor: '#D7EAF5',
        color: '#102A43',
        fontSize: 15,
        fontWeight: '700',
    },

    disabledInput: {
        backgroundColor: '#EAF0F5',
        color: '#72869A',
    },

    saveBtn: {
        height: 56,
        marginTop: 26,
        borderRadius: 18,
        backgroundColor: '#149BD7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#0284C7',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.24,
        shadowRadius: 10,
        elevation: 4,
    },

    saveBtnDisabled: {
        opacity: 0.55,
    },

    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
});