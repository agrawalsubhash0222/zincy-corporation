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
        height: 118,
        backgroundColor: '#06223A',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingTop: 52,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },

    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitle: {
        color: '#fff',
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
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#00C894',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 5,
        borderColor: '#DDFBF2',
        elevation: 5,
    },

    avatarText: {
        color: '#06223A',
        fontSize: 42,
        fontWeight: '900',
    },

    avatarHint: {
        marginTop: 10,
        color: '#5B7188',
        fontSize: 13,
        fontWeight: '700',
    },

    formCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 18,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },

    label: {
        color: '#102A43',
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 8,
        marginTop: 14,
    },

    input: {
        minHeight: 52,
        borderRadius: 16,
        backgroundColor: '#F4F8FB',
        borderWidth: 1,
        borderColor: '#E3EDF5',
        paddingHorizontal: 15,
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
        borderRadius: 18,
        backgroundColor: '#00B887',
        marginTop: 26,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        elevation: 4,
    },

    saveBtnDisabled: {
        opacity: 0.65,
    },

    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
});