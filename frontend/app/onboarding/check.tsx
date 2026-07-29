import type {
    CustomerOnboardingRequest,
} from '@/services/onboardingRequestService';
import {
    getMyOnboardingRequests,
    getOnboardingRequestProgress,
} from '@/services/onboardingRequestService';
import { getSession } from '@/utils/session';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
    router,
    useFocusEffect,
} from 'expo-router';
import {
    useCallback,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    SafeAreaView,
} from 'react-native-safe-area-context';

export default function OnboardingCheckScreen() {
    const [loading, setLoading] = useState(true);

    const [requests, setRequests] =
        useState<CustomerOnboardingRequest[]>([]);

    const [
        openingRequestId,
        setOpeningRequestId,
    ] = useState<number | null>(null);

    const checkRequests = useCallback(async () => {
        try {
            setLoading(true);

            const session = await getSession();

            if (!session?.mobile) {
                router.replace('/profile');
                return;
            }

            const response =
                await getMyOnboardingRequests(
                    session.mobile,
                );

            if (
                !Array.isArray(response) ||
                response.length === 0
            ) {
                router.replace('/onboarding');
                return;
            }

            setRequests(response);
        } catch (error) {
            console.error(
                'Check onboarding request error:',
                error,
            );

            Alert.alert(
                'Unable to Load Requests',
                'Your onboarding requests could not be loaded. Please try again.',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    /*
     * Reload every time the user returns to this page.
     *
     * This is important after completing client setup because the
     * backend now returns clientSetupCompleted = true.
     */
    useFocusEffect(
        useCallback(() => {
            void checkRequests();

            const handleHardwareBack = () => {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/(website)');
                }

                return true;
            };

            const subscription =
                BackHandler.addEventListener(
                    'hardwareBackPress',
                    handleHardwareBack,
                );

            return () => {
                subscription.remove();
            };
        }, [checkRequests]),
    );

    const handleStartAnother = () => {
        router.push({
            pathname: '/onboarding',
            params: {
                mode: 'new',
            },
        });
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace('/(website)');
    };

    const openRequestDetails = async (
        item: CustomerOnboardingRequest
    ) => {
        const requestId = Number(item.id);

        if (
            !Number.isFinite(requestId) ||
            requestId <= 0
        ) {
            Alert.alert(
                'Request Unavailable',
                'The onboarding request ID is missing.'
            );
            return;
        }

        if (openingRequestId !== null) {
            return;
        }

        try {
            setOpeningRequestId(requestId);

            /*
             * Re-fetch this request immediately before routing.
             * This prevents navigation using stale list data after
             * completing server or maintenance setup.
             */
            const progress =
                await getOnboardingRequestProgress(
                    requestId
                );

            const commonParams = {
                onboardingRequestId:
                    String(requestId),
            };

            switch (progress.nextStep) {
                case 'CHECKOUT':
                    router.push({
                        pathname:
                            '/client-setup/payment/checkout',
                        params: commonParams,
                    });
                    return;

                case 'SERVER_SETUP_SUCCESS':
                    router.push({
                        pathname:
                            '/client-setup/server/server-success',
                        params: commonParams,
                    });
                    return;

                case 'CLIENT_SETUP_SUCCESS':
                    router.push({
                        pathname:
                            '/client-setup/completion/success',
                        params: commonParams,
                    });
                    return;

                case 'REQUEST_DETAILS':
                default:
                    router.push({
                        pathname:
                            '/onboarding/request-details',
                        params: {
                            request:
                                JSON.stringify(progress),
                        },
                    });
            }
        } catch (error) {
            console.error(
                'Onboarding progress check failed:',
                error
            );

            /*
             * Safe fallback using the request-list response.
             * The priority still remains:
             * maintenance -> server -> client.
             */
            if (
                item.maintenanceSetupCompleted === true
            ) {
                router.push({
                    pathname:
                        '/client-setup/payment/checkout',
                    params: {
                        onboardingRequestId:
                            String(requestId),
                    },
                });
                return;
            }

            if (
                item.serverSetupCompleted === true
            ) {
                router.push({
                    pathname:
                        '/client-setup/server/server-success',
                    params: {
                        onboardingRequestId:
                            String(requestId),
                    },
                });
                return;
            }

            if (
                item.clientSetupCompleted === true
            ) {
                router.push({
                    pathname:
                        '/client-setup/completion/success',
                    params: {
                        onboardingRequestId:
                            String(requestId),
                    },
                });
                return;
            }

            Alert.alert(
                'Unable to Verify Setup',
                error instanceof Error
                    ? error.message
                    : 'We could not verify the request progress. Please try again.'
            );
        } finally {
            setOpeningRequestId(null);
        }
    };

    const formatProjectTypes = (
        projectTypes?: string[] | string,
    ): string => {
        if (
            Array.isArray(projectTypes) &&
            projectTypes.length > 0
        ) {
            return projectTypes.join(', ');
        }

        if (
            typeof projectTypes === 'string' &&
            projectTypes.trim()
        ) {
            /*
             * Also handles JSON-formatted project types when the
             * backend returns them as a String.
             */
            try {
                const parsed = JSON.parse(
                    projectTypes,
                );

                if (
                    Array.isArray(parsed) &&
                    parsed.length > 0
                ) {
                    return parsed.join(', ');
                }
            } catch {
                // It is already a normal display string.
            }

            return projectTypes;
        }

        return 'Digital Service';
    };

    if (loading) {
        return (
            <SafeAreaView
                style={styles.container}
                edges={['top', 'left', 'right']}
            >
                <View style={styles.centerContainer}>
                    <ActivityIndicator
                        size="large"
                        color="#0EA5E9"
                    />

                    <Text style={styles.loadingText}>
                        Checking your onboarding requests...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={styles.container}
            edges={['top', 'left', 'right']}
        >
            <View style={styles.screen}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={
                        styles.scrollContent
                    }
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={handleBack}
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
                                size={27}
                                color="#0F172A"
                            />
                        </TouchableOpacity>

                        <Text style={styles.title}>
                            Request Already Submitted
                        </Text>
                    </View>

                    <Text style={styles.description}>
                        Hi Sir/Madam, you have already
                        submitted one or more onboarding
                        requests. You can check your submitted
                        business and service details below.
                    </Text>

                    {requests.map((item, index) => {
                        const requestId = Number(item.id);

                        const opening =
                            openingRequestId === requestId;

                        const disabled =
                            openingRequestId !== null;

                        return (
                            <TouchableOpacity
                                key={
                                    item.id?.toString() ??
                                    `request-${index}`
                                }
                                activeOpacity={0.85}
                                disabled={disabled}
                                onPress={() =>
                                    void openRequestDetails(
                                        item,
                                    )
                                }
                                style={[
                                    styles.requestCard,
                                    disabled &&
                                        !opening
                                        ? styles.disabledCard
                                        : null,
                                ]}
                            >
                                <Text
                                    style={
                                        styles.detailText
                                    }
                                >
                                    Business Name:{' '}
                                    <Text
                                        style={
                                            styles.detailValue
                                        }
                                    >
                                        {item.businessName ||
                                            'N/A'}
                                    </Text>
                                </Text>

                                <Text
                                    style={[
                                        styles.detailText,
                                        styles.detailSpacing,
                                    ]}
                                >
                                    Service Requested:{' '}
                                    <Text
                                        style={
                                            styles.detailValue
                                        }
                                    >
                                        {formatProjectTypes(
                                            item.projectTypes,
                                        )}
                                    </Text>
                                </Text>

                                <Text
                                    style={[
                                        styles.detailText,
                                        styles.detailSpacing,
                                    ]}
                                >
                                    Current Status:{' '}
                                    <Text
                                        style={
                                            styles.statusText
                                        }
                                    >
                                        {item.status ||
                                            'SUBMITTED'}
                                    </Text>
                                </Text>

                                <View
                                    style={
                                        styles.cardFooter
                                    }
                                >
                                    <Text
                                        style={
                                            styles.tapText
                                        }
                                    >
                                        {opening
                                            ? 'Checking submitted details...'
                                            : 'Tap to view full details'}
                                    </Text>

                                    {opening ? (
                                        <ActivityIndicator
                                            size="small"
                                            color="#0EA5E9"
                                        />
                                    ) : (
                                        <Ionicons
                                            name="chevron-forward"
                                            size={20}
                                            color="#94A3B8"
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        onPress={handleStartAnother}
                        activeOpacity={0.85}
                        disabled={
                            openingRequestId !== null
                        }
                        style={[
                            styles.newRequestButton,
                            openingRequestId !== null
                                ? styles.buttonDisabled
                                : null,
                        ]}
                    >
                        <Text
                            style={
                                styles.newRequestButtonText
                            }
                        >
                            Make Another Onboarding Request
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
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

    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },

    loadingText: {
        marginTop: 12,
        color: '#475569',
        textAlign: 'center',
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 145,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    backButton: {
        width: 40,
        height: 40,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },

    title: {
        flex: 1,
        color: '#0F172A',
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '900',
    },

    description: {
        marginTop: 10,
        color: '#475569',
        fontSize: 15,
        lineHeight: 23,
    },

    requestCard: {
        marginTop: 18,
        padding: 18,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        elevation: 4,
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    disabledCard: {
        opacity: 0.6,
    },

    detailText: {
        color: '#475569',
        fontSize: 15,
        lineHeight: 22,
    },

    detailSpacing: {
        marginTop: 10,
    },

    detailValue: {
        color: '#0F172A',
        fontWeight: '900',
    },

    statusText: {
        color: '#0EA5E9',
        fontWeight: '900',
    },

    cardFooter: {
        minHeight: 24,
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },

    tapText: {
        flex: 1,
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '700',
    },

    bottomBar: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        left: 0,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 22,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },

    newRequestButton: {
        minHeight: 54,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15,
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

    buttonDisabled: {
        opacity: 0.65,
    },

    newRequestButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        textAlign: 'center',
        fontWeight: '900',
    },
});
