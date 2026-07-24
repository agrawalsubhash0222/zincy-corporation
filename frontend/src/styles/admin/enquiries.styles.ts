import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    centerBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },

    loadingText: {
        marginTop: 10,
        color: '#64748B',
        fontWeight: '700',
    },

    header: {
        paddingTop: 18,
        paddingHorizontal: 16,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#071B34',
    },

    subtitle: {
        marginTop: 2,
        color: '#64748B',
        fontWeight: '600',
    },

    listContent: {
        padding: 16,
        paddingBottom: 30,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
    },

    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },

    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },

    cardTitleBox: {
        flex: 1,
        marginLeft: 12,
    },

    name: {
        fontSize: 17,
        fontWeight: '900',
        color: '#071B34',
    },

    date: {
        marginTop: 3,
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },

    status: {
        backgroundColor: '#DCFCE7',
        color: '#16A34A',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: '900',
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 7,
    },

    infoText: {
        color: '#0F172A',
        fontWeight: '700',
    },

    lookingBox: {
        marginTop: 14,
        padding: 12,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
    },

    label: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 4,
    },

    lookingText: {
        color: '#071B34',
        fontWeight: '800',
    },

    messageBox: {
        marginTop: 12,
    },

    message: {
        color: '#334155',
        lineHeight: 22,
        fontWeight: '600',
    },

    emptyBox: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        paddingHorizontal: 30,
    },

    emptyTitle: {
        marginTop: 14,
        fontSize: 18,
        fontWeight: '900',
        color: '#071B34',
    },

    emptyText: {
        marginTop: 6,
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '600',
    },
});