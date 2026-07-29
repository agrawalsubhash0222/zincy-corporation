import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type OnboardingRequest = {
    id?: number | string;

    businessName?: string;
    ownerName?: string;
    mobile?: string;
    userMobile?: string;
    email?: string;

    projectTypes?: string[] | string;
    serviceName?: string;
    requirement?: string;
    budget?: string;
    timeline?: string;
    status?: string;

    clientSetupCompleted?: boolean | number | string;
    client_setup_completed?: boolean | number | string;

    serverSetupCompleted?: boolean | number | string;
    server_setup_completed?: boolean | number | string;
};

const isTrueValue = (value: unknown): boolean => {
    return (
        value === true ||
        value === 1 ||
        value === '1' ||
        String(value).toLowerCase() === 'true'
    );
};

const getDisplayValue = (...values: unknown[]): string => {
    const value = values.find((item) => {
        if (item === undefined || item === null) {
            return false;
        }

        if (Array.isArray(item)) {
            return item.length > 0;
        }

        return String(item).trim().length > 0;
    });

    if (Array.isArray(value)) {
        return value.length > 0
            ? value.filter(Boolean).join(', ')
            : 'Not provided';
    }

    return value !== undefined && value !== null
        ? String(value)
        : 'Not provided';
};

const cleanMobile = (mobile: unknown): string => {
    return String(mobile ?? '')
        .replace(/\D/g, '')
        .slice(-10);
};

export default function OnboardingRequestDetailsScreen() {
    const params = useLocalSearchParams<{
        request?: string | string[];
    }>();

    const request = useMemo<OnboardingRequest | null>(() => {
        const rawRequest = Array.isArray(params.request)
            ? params.request[0]
            : params.request;

        if (!rawRequest) {
            return null;
        }

        try {
            return JSON.parse(rawRequest) as OnboardingRequest;
        } catch (error) {
            console.error('Unable to parse onboarding request:', error);
            return null;
        }
    }, [params.request]);

    if (!request) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Ionicons
                        name="document-text-outline"
                        size={44}
                        color="#94A3B8"
                    />

                    <Text style={styles.emptyTitle}>
                        No request details found
                    </Text>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.back()}
                        style={styles.emptyButton}
                    >
                        <Text style={styles.emptyButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const status = String(request.status || 'SUBMITTED').toUpperCase();

    const clientSetupCompleted =
        isTrueValue(request.clientSetupCompleted) ||
        isTrueValue(request.client_setup_completed);

    const handleNextStep = () => {
        if (!request.id) {
            console.error('Missing onboarding request ID');
            return;
        }

        const onboardingRequestId = String(request.id);

        if (clientSetupCompleted) {
            router.push({
                pathname: '/client-setup/completion/success',
                params: {
                    onboardingRequestId,
                    mode: 'view',
                },
            });
            return;
        }

        router.push({
            pathname: '/client-setup/business-information/business-owner-details',
            params: {
                onboardingRequestId,
                businessName: request.businessName || '',
                ownerName: request.ownerName || '',
                mobile: cleanMobile(
                    request.mobile || request.userMobile
                ),
                email: request.email || '',
            },
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.screen}>
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        status === 'APPROVED' && styles.scrollContentWithButton,
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            activeOpacity={0.75}
                            hitSlop={{
                                top: 12,
                                bottom: 12,
                                left: 12,
                                right: 12,
                            }}
                            style={styles.backButton}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={26}
                                color="#0F172A"
                            />
                        </TouchableOpacity>

                        <Text style={styles.title}>Request Details</Text>
                    </View>

                    <Text style={styles.subtitle}>
                        View your submitted onboarding request
                    </Text>

                    <View style={styles.statusCard}>
                        <Text style={styles.statusLabel}>CURRENT STATUS</Text>
                        <Text style={styles.statusValue}>{status}</Text>
                    </View>

                    <Section title="Business Information">
                        <DetailRow
                            label="Business Name"
                            value={getDisplayValue(request.businessName)}
                        />

                        <DetailRow
                            label="Owner Name"
                            value={getDisplayValue(request.ownerName)}
                        />

                        <DetailRow
                            label="Mobile"
                            value={getDisplayValue(
                                cleanMobile(
                                    request.mobile || request.userMobile
                                )
                            )}
                        />

                        <DetailRow
                            label="Email"
                            value={getDisplayValue(request.email)}
                            numberOfLines={1}
                        />
                    </Section>

                    <Section title="Service Information">
                        <DetailRow
                            label="Service"
                            value={getDisplayValue(
                                request.projectTypes,
                                request.serviceName
                            )}
                            numberOfLines={3}
                        />

                        <DetailRow
                            label="Budget"
                            value={getDisplayValue(request.budget)}
                        />

                        <DetailRow
                            label="Timeline"
                            value={getDisplayValue(request.timeline)}
                        />
                    </Section>

                    <View style={styles.requirementCard}>
                        <Text style={styles.sectionTitle}>Requirement</Text>

                        <Text style={styles.requirementText}>
                            {getDisplayValue(request.requirement)}
                        </Text>
                    </View>
                </ScrollView>

                {status === 'APPROVED' && (
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleNextStep}
                            style={styles.nextButton}
                        >
                            <Text style={styles.nextButtonText}>
                                {clientSetupCompleted
                                    ? 'View Submitted Client Details'
                                    : 'Next Step'}
                            </Text>

                            <Ionicons
                                name="arrow-forward"
                                size={20}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

function DetailRow({
    label,
    value,
    numberOfLines = 2,
}: {
    label: string;
    value: string;
    numberOfLines?: number;
}) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>

            <Text
                style={styles.detailValue}
                numberOfLines={numberOfLines}
                adjustsFontSizeToFit={numberOfLines === 1}
                minimumFontScale={0.8}
            >
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    screen: {
        flex: 1,
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 40,
    },

    scrollContentWithButton: {
        paddingBottom: 125,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        marginRight: 6,
    },

    title: {
        flex: 1,
        color: '#0F172A',
        fontSize: 27,
        fontWeight: '900',
    },

    subtitle: {
        marginTop: 4,
        color: '#64748B',
        fontSize: 16,
        lineHeight: 23,
    },

    statusCard: {
        width: '60%',
        alignSelf: 'center',
        alignItems: 'center',
        marginTop: 18,
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: '#E0F2FE',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#38BDF8',
    },

    statusLabel: {
        color: '#0369A1',
        fontSize: 13,
        fontWeight: '900',
    },

    statusValue: {
        marginTop: 5,
        color: '#0284C7',
        fontSize: 24,
        fontWeight: '900',
    },

    section: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingTop: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },

    sectionTitle: {
        marginBottom: 4,
        color: '#0F172A',
        fontSize: 15,
        fontWeight: '900',
    },

    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        paddingVertical: 13,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E2E8F0',
    },

    detailLabel: {
        flex: 0.9,
        color: '#64748B',
        fontSize: 14,
        fontWeight: '700',
    },

    detailValue: {
        flex: 1.3,
        color: '#0F172A',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '900',
        textAlign: 'right',
    },

    requirementCard: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },

    requirementText: {
        marginTop: 10,
        color: '#334155',
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '700',
    },

    bottomContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 22,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },

    nextButton: {
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0EA5E9',
        borderRadius: 14,
        elevation: 4,
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },

    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },

    emptyTitle: {
        marginTop: 14,
        color: '#0F172A',
        fontSize: 18,
        fontWeight: '800',
    },

    emptyButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#0EA5E9',
        borderRadius: 12,
    },

    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
});