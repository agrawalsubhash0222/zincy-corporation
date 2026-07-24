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
        marginTop: 6,
    },

    optionList: {
        gap: 12,
        marginBottom: 28,
    },

    optionCard: {
        minHeight: 58,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    optionCardActive: {
        borderColor: '#0ea5e9',
        backgroundColor: '#EFF6FF',
    },

    optionText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#334155',
    },

    optionTextActive: {
        color: '#0ea5e9',
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