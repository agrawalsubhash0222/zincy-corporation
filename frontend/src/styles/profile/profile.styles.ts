import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    adminSubItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 22,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginTop: 16,
    },

    subIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },

    subTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#08233D',
    },

    subSubTitle: {
        marginTop: 4,
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    
    header: {
        height: 58,
        backgroundColor: '#06223A',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingTop: 0,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },

    backButton: {
        width: 25,
        height: 25,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.13)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitle: {
        marginLeft: 14,
        fontSize: 23,
        fontWeight: '900',
        color: '#FFFFFF',
    },

    editButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },

    contactBox: {
        width: '100%',
        marginTop: 18,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.11)',
        padding: 14,
        gap: 10,
    },

    linksCard: {
        marginHorizontal: 16,
        marginTop: 18,
        borderRadius: 26,
        backgroundColor: '#FFFFFF',
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },

    linksTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#071B34',
        marginBottom: 10,
    },

    linkItem: {
        minHeight: 62,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },

    linkIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
    },

    linkTextBox: {
        flex: 1,
        marginLeft: 12,
    },

    linkTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#071B34',
    },

    linkSubtitle: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },

    logoutButton: {
        marginHorizontal: 16,
        marginTop: 18,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        padding: 16,
        minHeight: 70,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    logoutText: {
        fontSize: 17,
        fontWeight: '900',
        color: '#EF4444',
    },

    logoutSubText: {
        marginTop: 3,
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
    },

    logoutIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },

    socialCard: {
        marginHorizontal: 16,
        marginTop: 18,
        marginBottom: 120,
        borderRadius: 26,
        backgroundColor: '#FFFFFF',
        padding: 16,
    },

    socialTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#071B34',
        marginBottom: 14,
    },

    socialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    socialIcon: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },

    userCard: {},
    patternOverlay: {},
    userNameRow: {},
    divider: {
        height: 12,
    },

    guestCard: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 18,
    padding: 20,
    borderRadius: 26,
    backgroundColor: '#EAF6FF',
    overflow: 'hidden',

    borderWidth: 1,
    borderColor: '#BAE6FD',

    shadowColor: '#075985',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
},

guestGlowOne: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(14, 165, 233, 0.16)',
    top: -75,
    right: -45,
},

guestGlowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    bottom: -55,
    left: -35,
},

guestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
},

guestAvatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#7DD3FC',
},

guestTextBox: {
    flex: 1,
},

guestTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#06213B',
    letterSpacing: 0.2,
},

guestMiniText: {
    marginTop: 4,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0369A1',
},

guestSubtitle: {
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    color: '#334155',
},

loginButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: '#149BD7',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.25,
    shadowRadius: 11,
    elevation: 5,
},

loginButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
},

loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '900',
},

loginArrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
},

    guestBenefitsRow: {
        marginTop: 15,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(5, 150, 105, 0.16)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    guestBenefit: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    guestBenefitText: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#065f46',
    },

    guestDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#a7f3d0',
        marginHorizontal: 16,
    },

    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },

    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },

    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 110,
    },

    adminSection: {
        marginHorizontal: 16,
        marginTop: 18,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },

    sectionHeader: {
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: '900',
        color: '#071B34',
    },

    adminBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: '#ECFDF5',
        fontSize: 10,
        fontWeight: '900',
        color: '#10B981',
    },

    adminGroupHeader: {
        marginTop: 16,
        marginBottom: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    adminGroupTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },

    adminGroupLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },

    adminMenuItem: {
        minHeight: 64,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    adminSupportItem: {
        minHeight: 64,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    adminMenuLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    adminTextBox: {
        flex: 1,
    },

    adminIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
    },

    adminIconCircleDark: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#071B34',
        alignItems: 'center',
        justifyContent: 'center',
    },

    adminMenuText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#071B34',
    },

    adminMenuSubText: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },

    adminSubMenu: {
        marginLeft: 10,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#E2E8F0',
    },

    heroCard: {
        marginHorizontal: 18,
        marginTop: 16,
        padding: 18,
        borderRadius: 22,
        backgroundColor: '#06213B',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 5,
    },

    heroCircleOne: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#10B981',
        opacity: 0.08,
        right: -30,
        top: -25,
    },

    heroCircleTwo: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFFFFF',
        opacity: 0.06,
        left: -22,
        bottom: -28,
    },

    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    avatar: {
        width: 35,
        height: 35,
        borderRadius: 29,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.16)',
    },

    avatarText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#06213B',
    },

    userInfoBox: {
        flex: 1,
        marginLeft: 14,
    },

    userName: {
        fontSize: 19,
        fontWeight: '900',
        color: '#FFFFFF',
    },

    memberText: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '700',
        color: '#A7F3D0',
    },

    editBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },

    contactCompactBox: {
        marginTop: 16,
        gap: 10,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    infoIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    infoText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    quickActions: {
        marginHorizontal: 18,
        marginTop: 14,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    quickActionItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    subIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EAF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
},

editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#149BD7',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
},

linkIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF6FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
},

adminBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#EAF6FF',
    fontSize: 10,
    fontWeight: '900',
    color: '#149BD7',
},

adminIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF6FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
},

heroCircleOne: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#149BD7',
    opacity: 0.12,
    right: -30,
    top: -25,
},

avatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
},

avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#06213B',
},

memberText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#BAE6FD',
},

editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#149BD7',
    alignItems: 'center',
    justifyContent: 'center',
},

quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF6FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
},

    quickActionText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#071B34',
    },
});