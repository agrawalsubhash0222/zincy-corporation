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
        marginBottom: 28,
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

    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#334155',
        marginBottom: 14,
    },

    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 28,
    },

    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },

    chipActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#0ea5e9',
    },

    chipText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },

    chipTextActive: {
        color: '#0ea5e9',
    },

    field: {
        marginBottom: 24,
    },

    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
    },

    textArea: {
        minHeight: 150,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: '#0F172A',
        lineHeight: 22,
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
});