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

export const legalStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BG,
    },

    content: {
        padding: 16,
        paddingBottom: 34,
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

    heroTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    heroIcon: {
        width: 54,
        height: 54,
        borderRadius: 27,
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
        fontSize: 21,
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

    infoCard: {
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

    accordionItem: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },

    lastAccordionItem: {
        borderBottomWidth: 0,
    },

    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    accordionTitle: {
        flex: 1,
        paddingRight: 12,
        fontSize: 15,
        fontWeight: '900',
        color: DARK,
    },

    accordionBody: {
        marginTop: 10,
        fontSize: 13,
        lineHeight: 21,
        fontWeight: '600',
        color: MUTED,
    },

    footerNote: {
        marginTop: 16,
        padding: 14,
        borderRadius: 18,
        backgroundColor: PRIMARY_LIGHT,
        borderWidth: 1,
        borderColor: PRIMARY_BORDER,
        flexDirection: 'row',
        alignItems: 'center',
    },

    footerText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '800',
        color: PRIMARY_DARK,
    },
});