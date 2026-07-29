import { Platform, StyleSheet } from 'react-native';

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

    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 22,
    },

    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },

    chipActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#0EA5E9',
    },

    chipText: {
        marginLeft: 7,
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
    },

    chipTextActive: {
        color: '#0EA5E9',
    },

    field: {
        marginBottom: 12,
    },

    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },

    textArea: {
        minHeight: 130,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 14,
        padding: 14,
        fontSize: 15,
        color: '#0F172A',
        lineHeight: 22,

        ...(Platform.OS === 'web'
            ? ({
                outlineStyle: 'none',
                outlineWidth: 0,
            } as object)
            : {}),
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