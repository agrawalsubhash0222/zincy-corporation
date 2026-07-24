import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 24,
        justifyContent: 'space-between',
    },

    header: {
        marginTop: 30,
        marginBottom: 22,
    },

    step: {
        color: '#0ea5e9',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 8,
    },

    title: {
        fontSize: 27,
        fontWeight: '800',
        color: '#0F172A',
    },

    subtitle: {
        marginTop: 8,
        fontSize: 15,
        color: '#64748B',
        lineHeight: 23,
    },

    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 6,
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
        minHeight: 64,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },

    summaryIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    accordionTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },

    noteCard: {
        marginTop: 22,
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },

    noteText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        lineHeight: 21,
        color: '#1E3A8A',
        fontWeight: '600',
    },

    button: {
        height: 56,
        borderRadius: 16,
        backgroundColor: '#0ea5e9',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 30,
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },

    accordionBody: {
        paddingHorizontal: 16,
        paddingBottom: 14,
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
        width: '42%',
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
    },

    detailValue: {
        flex: 1,
        textAlign: 'right',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
        color: '#0F172A',
    },

    scrollContent: {
        paddingBottom: 120,
    },

    bottomBar: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 18,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },

    buttonDisabled: {
        opacity: 0.75,
    },

    successCard: {
        marginBottom: 16,
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
        marginBottom: 16,
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
    paddingHorizontal: 24,
},

successDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
},

successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
},

dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
},

dialogMessage: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
},

continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
},

continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
},
});