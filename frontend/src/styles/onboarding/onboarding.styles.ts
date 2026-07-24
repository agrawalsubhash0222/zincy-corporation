import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 24,
        justifyContent: 'space-between',
    },

    content: {
        flex: 1,
        justifyContent: 'center',
    },

    iconContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 28,
    },

    title: {
        fontSize: 30,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        lineHeight: 38,
    },

    subtitle: {
        marginTop: 12,
        fontSize: 16,
        lineHeight: 24,
        color: '#64748B',
        textAlign: 'center',
    },

    infoCard: {
        marginTop: 34,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },

    infoIconBox: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    infoText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        color: '#334155',
        fontWeight: '600',
    },

    primaryButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: '#0ea5e9',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        marginBottom: 30,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
});