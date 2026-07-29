import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
    },

    header: {
        marginTop: 0,
        marginBottom: 20,
    },

    step: {
        color: '#0EA5E9',
        fontWeight: '700',
        fontSize: 13,
        marginBottom: 8,
    },

    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
    },

    subtitle: {
        marginTop: 8,
        fontSize: 15,
        color: '#64748B',
        lineHeight: 22,
    },

    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 4,
        overflow: 'hidden',
    },

    accordionSection: {
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },

    accordionSectionLast: {
        borderBottomWidth: 0,
    },

    accordionHeader: {
        minHeight: 60,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },

    summaryIconBox: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    accordionTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },

    accordionBody: {
        paddingHorizontal: 14,
        paddingBottom: 12,
    },

    detailRow: {
        minHeight: 38,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    detailLabel: {
        width: '40%',
        paddingRight: 8,
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
    },

    detailValue: {
        flex: 1,
        textAlign: 'right',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '700',
        color: '#0F172A',
    },

    noteCard: {
        marginTop: 16,
        backgroundColor: '#EFF6FF',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },

    noteText: {
        flex: 1,
        marginLeft: 9,
        fontSize: 13,
        lineHeight: 20,
        color: '#1E3A8A',
        fontWeight: '600',
    },

    scrollContent: {
        paddingBottom: 20,
    },

    bottomBar: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 2,
        backgroundColor: '#F8FAFC',
    },

    button: {
        width: '88%',
        maxWidth: 420,
        minHeight: 50,
        borderRadius: 13,
        backgroundColor: '#0EA5E9',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        marginRight: 8,
    },

    buttonDisabled: {
        opacity: 0.7,
    },

    successCard: {
        marginBottom: 14,
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },

    successText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '700',
        color: '#166534',
    },

    errorCard: {
        marginBottom: 14,
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },

    errorText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '700',
        color: '#991B1B',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },

    successDialog: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 22,
        alignItems: 'center',
    },

    successIconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },

    dialogTitle: {
        marginBottom: 9,
        color: '#0F172A',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },

    dialogMessage: {
        marginBottom: 20,
        color: '#475569',
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },

    continueButton: {
        width: '88%',
        minHeight: 50,
        borderRadius: 13,
        backgroundColor: '#0EA5E9',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },

    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
});