import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const isMobile = width <= 700;

export const detailsStyles = StyleSheet.create({
    detailPanel: {
        width: '100%',

        backgroundColor: '#F4F8FF',

        borderWidth: 1,
        borderColor: '#BFD8FF',

        borderRadius: isMobile ? 24 : 28,

        padding: isMobile ? 18 : 30,

        marginBottom: 28,

        position: 'relative',
        overflow: 'hidden',

        shadowColor: '#08245C',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },

        elevation: 3,
    },

    closeButton: {
        position: 'absolute',

        top: 14,
        right: 14,

        width: 38,
        height: 38,

        borderRadius: 19,

        backgroundColor: '#FFFFFF',

        alignItems: 'center',
        justifyContent: 'center',

        borderWidth: 1,
        borderColor: '#D8E6FF',

        zIndex: 10,
    },

    closeText: {
        fontSize: 26,
        lineHeight: 30,

        color: '#00113F',

        fontWeight: '800',
    },

    detailTop: {
        flexDirection: isMobile ? 'column' : 'row',

        alignItems: isMobile ? 'flex-start' : 'center',

        gap: 16,

        paddingRight: isMobile ? 44 : 60,

        marginBottom: 22,
    },

    detailIconBox: {
        width: isMobile ? 64 : 80,
        height: isMobile ? 64 : 80,

        borderRadius: 22,

        backgroundColor: '#E8F4FF',

        alignItems: 'center',
        justifyContent: 'center',
    },

    detailIcon: {
        fontSize: isMobile ? 34 : 44,
    },

    detailHeadingBox: {
        flex: 1,
        width: '100%',
    },

    detailTitle: {
        fontSize: isMobile ? 28 : 36,
        lineHeight: isMobile ? 36 : 44,

        fontWeight: '900',

        color: '#0066FF',

        marginBottom: 10,
    },

    detailText: {
        fontSize: isMobile ? 16 : 18,
        lineHeight: isMobile ? 26 : 30,

        color: '#243C63',

        fontWeight: '600',

        maxWidth: 700,
    },

    detailBody: {
        flexDirection: isMobile ? 'column' : 'row',

        gap: isMobile ? 22 : 32,

        alignItems: isMobile ? 'stretch' : 'center',
    },

    detailLeft: {
        flex: 1,
        width: '100%',
    },

    detailRight: {
        flex: 1,
        width: '100%',
    },

    pointRow: {
        flexDirection: 'row',
        alignItems: 'center',

        marginBottom: 13,
    },

    checkIcon: {
        width: 26,
        height: 26,

        borderRadius: 13,

        backgroundColor: '#0066FF',

        color: '#FFFFFF',

        textAlign: 'center',

        lineHeight: 26,

        fontSize: 15,
        fontWeight: '900',

        marginRight: 11,
    },

    pointText: {
        flex: 1,

        fontSize: isMobile ? 16 : 17,
        lineHeight: isMobile ? 23 : 25,

        color: '#243C63',

        fontWeight: '800',
    },

    quoteButton: {
        backgroundColor: '#0066FF',

        alignSelf: isMobile ? 'stretch' : 'flex-start',

        paddingHorizontal: 26,
        paddingVertical: 16,

        borderRadius: 14,

        marginTop: 12,

        alignItems: 'center',
    },

    quoteButtonText: {
        color: '#FFFFFF',

        fontSize: 16,
        fontWeight: '900',
    },

    metricGrid: {
        width: '100%',

        flexDirection: 'row',
        flexWrap: 'wrap',

        gap: isMobile ? 12 : 16,

        justifyContent: 'space-between',
    },

    metricCard: {
        width: isMobile ? '48%' : '47%',

        minHeight: isMobile ? 104 : 118,

        backgroundColor: '#FFFFFF',

        borderRadius: 20,

        alignItems: 'center',
        justifyContent: 'center',

        borderWidth: 1,
        borderColor: '#E0EAFF',

        paddingHorizontal: 10,
        paddingVertical: 16,
    },

    metricValue: {
        fontSize: isMobile ? 29 : 34,
        fontWeight: '900',
        color: '#00113F',
    },

    metricLabel: {
        fontSize: isMobile ? 13 : 14,

        color: '#355177',

        marginTop: 6,

        textAlign: 'center',

        fontWeight: '600',
    },
});