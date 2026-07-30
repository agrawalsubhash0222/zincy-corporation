import { StyleSheet } from 'react-native';

const PRIMARY = '#149BD7';
const PRIMARY_DARK = '#075985';
const PRIMARY_LIGHT = '#EAF6FF';
const PRIMARY_BORDER = '#BAE6FD';

const DARK = '#0F172A';
const MUTED = '#64748B';
const BG = '#F8FAFC';
const BORDER = '#E2E8F0';
const WHITE = '#FFFFFF';

export const infoStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BG,
    },

    content: {
        padding: 16,
        paddingBottom: 36,
    },

    heroCard: {
        marginBottom: 16,
        padding: 18,
        borderRadius: 26,
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BORDER,
        shadowColor: PRIMARY_DARK,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    heroIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 14,
        backgroundColor: PRIMARY_LIGHT,
        borderWidth: 1,
        borderColor: PRIMARY_BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },

    heroTextBox: {
        flex: 1,
    },

    heroTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: DARK,
    },

    heroSubtitle: {
        marginTop: 5,
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '600',
        color: MUTED,
    },

    badge: {
        marginTop: 10,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: PRIMARY_LIGHT,
    },

    badgeText: {
        fontSize: 11,
        fontWeight: '900',
        color: PRIMARY_DARK,
    },

    actionCard: {
        marginBottom: 16,
        borderRadius: 24,
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: 'hidden',
        shadowColor: PRIMARY_DARK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },

    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },

    lastActionItem: {
        borderBottomWidth: 0,
    },

    actionIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        marginRight: 12,
        backgroundColor: PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },

    actionTextBox: {
        flex: 1,
    },

    actionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: DARK,
    },

    actionSubtitle: {
        marginTop: 3,
        fontSize: 12,
        fontWeight: '600',
        color: MUTED,
    },

    sectionCard: {
        marginBottom: 12,
        padding: 16,
        borderRadius: 20,
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BORDER,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 9,
    },

    sectionIconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 9,
        backgroundColor: PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },

    sectionTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '900',
        color: DARK,
    },

    sectionBody: {
        fontSize: 13,
        lineHeight: 21,
        fontWeight: '600',
        color: MUTED,
    },

    footerCard: {
        marginTop: 4,
        padding: 16,
        borderRadius: 20,
        backgroundColor: PRIMARY_LIGHT,
        borderWidth: 1,
        borderColor: PRIMARY_BORDER,
        alignItems: 'center',
    },

    footerTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: PRIMARY_DARK,
    },

    footerText: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '700',
        color: PRIMARY_DARK,
    },

    footerVersion: {
        marginTop: 8,
        fontSize: 11,
        fontWeight: '700',
        color: PRIMARY,
    },
});