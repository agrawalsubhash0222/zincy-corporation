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
        marginBottom: 22,
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

    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#334155',
    },

    optionList: {
        gap: 10,
        marginBottom: 18,
    },

    optionCard: {
        minHeight: 54,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    optionCardActive: {
        borderColor: '#0EA5E9',
        backgroundColor: '#EFF6FF',
    },

    optionText: {
        flexShrink: 1,
        paddingRight: 10,
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },

    optionTextActive: {
        color: '#0EA5E9',
    },

    button: {
        width: '88%',
        maxWidth: 420,
        minHeight: 50,
        alignSelf: 'center',
        borderRadius: 13,
        backgroundColor: '#0EA5E9',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 8,
        marginBottom: 2,
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
});