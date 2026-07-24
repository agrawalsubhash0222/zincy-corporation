import { Ionicons } from '@expo/vector-icons';
import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from 'expo-router';
import {
    useCallback,
    useMemo,
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
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    getServerSetupSummary,
    type ServerSetupSummary,
} from '@/services/setupSummaryApi';

type BillingType = 'MONTHLY' | 'YEARLY';

type RouteParams = {
    onboardingRequestId?: string | string[];
    skipped?: string | string[];
    serverName?: string | string[];
    billingType?: string | string[];
    baseAmount?: string | string[];
    gstAmount?: string | string[];
    totalAmount?: string | string[];

    // Older navigation compatibility.
    amount?: string | string[];
    serverTaxAmount?: string | string[];
    serverTotalAmount?: string | string[];
};

function readParam(
    value: string | string[] | undefined
): string {
    return Array.isArray(value)
        ? value[0] ?? ''
        : value ?? '';
}

function readNumber(
    value: string | string[] | undefined
): number {
    const parsed = Number(readParam(value));

    return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number): string {
    return `₹${value.toLocaleString('en-IN', {
        minimumFractionDigits:
            Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    })}`;
}

export default function ServerSuccessScreen() {
    const params = useLocalSearchParams<RouteParams>();

    const onboardingRequestId = useMemo(() => {
        const parsed = Number(
            readParam(params.onboardingRequestId)
        );

        return Number.isInteger(parsed) && parsed > 0
            ? parsed
            : null;
    }, [params.onboardingRequestId]);

    /*
     * Route parameters are used only as an immediate fallback.
     * Database values replace them once the GET request completes.
     */
    const routeFallback =
        useMemo<ServerSetupSummary | null>(() => {
            if (!onboardingRequestId) {
                return null;
            }

            const skipped =
                readParam(params.skipped) === 'true';

            const baseAmount =
                readNumber(params.baseAmount) ||
                readNumber(params.amount);

            const gstAmount =
                readNumber(params.gstAmount) ||
                readNumber(params.serverTaxAmount);

            const totalAmount =
                readNumber(params.totalAmount) ||
                readNumber(params.serverTotalAmount) ||
                baseAmount + gstAmount;

            return {
                id: 0,
                onboardingRequestId,
                serverName:
                    readParam(params.serverName) ||
                    (skipped ? 'SKIPPED' : ''),
                billingType:
                    (readParam(
                        params.billingType
                    ) as BillingType) || null,
                baseAmount,
                gstAmount,
                totalAmount,
                skipped,
                serverSetupCompleted: true,
            };
        }, [
            onboardingRequestId,
            params.skipped,
            params.serverName,
            params.billingType,
            params.baseAmount,
            params.amount,
            params.gstAmount,
            params.serverTaxAmount,
            params.totalAmount,
            params.serverTotalAmount,
        ]);

    const [serverSetup, setServerSetup] =
        useState<ServerSetupSummary | null>(
            routeFallback
        );

    const [loading, setLoading] = useState(
        routeFallback === null
    );

    const [errorMessage, setErrorMessage] =
        useState('');

    const handleHome = () => {
        router.replace('/(website)');
    };

    const loadServerSetup = useCallback(async () => {
        if (!onboardingRequestId) {
            setLoading(false);
            setErrorMessage(
                'Onboarding request ID is missing.'
            );
            return;
        }

        try {
            setLoading(true);
            setErrorMessage('');

            const savedSetup =
                await getServerSetupSummary(
                    onboardingRequestId
                );

            setServerSetup(savedSetup);
        } catch (error) {
            console.error(
                'Load server setup error:',
                error
            );

            /*
             * Keep valid route data when the API temporarily fails.
             */
            if (!routeFallback) {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load saved server setup.'
                );
            }
        } finally {
            setLoading(false);
        }
    }, [onboardingRequestId, routeFallback]);

    useFocusEffect(
        useCallback(() => {
            void loadServerSetup();
        }, [loadServerSetup])
    );

    const navigateToServerSetup =
        useCallback(() => {
            if (!onboardingRequestId) {
                router.replace('/onboarding/check');
                return;
            }

            router.replace({
                pathname:
                    '/client-setup/server/server-setup',
                params: {
                    onboardingRequestId: String(
                        onboardingRequestId
                    ),

                    ...(serverSetup &&
                        !serverSetup.skipped
                        ? {
                            serverName:
                                serverSetup.serverName,
                            billingType:
                                serverSetup.billingType ??
                                '',
                            amount: String(
                                serverSetup.baseAmount
                            ),
                        }
                        : {}),
                },
            });
        }, [
            onboardingRequestId,
            serverSetup,
        ]);

    useFocusEffect(
        useCallback(() => {
            const subscription =
                BackHandler.addEventListener(
                    'hardwareBackPress',
                    () => {
                        navigateToServerSetup();
                        return true;
                    }
                );

            return () => subscription.remove();
        }, [navigateToServerSetup])
    );

    const handleContinue = () => {
        if (!onboardingRequestId || !serverSetup) {
            Alert.alert(
                'Setup unavailable',
                'Saved server setup could not be loaded.'
            );
            return;
        }

        router.push({
            pathname: '/client-setup/maintenance/maintenance',
            params: {
                onboardingRequestId: String(
                    onboardingRequestId
                ),

                skipped: serverSetup.skipped
                    ? 'true'
                    : 'false',

                serverName: serverSetup.skipped
                    ? ''
                    : serverSetup.serverName,

                billingType:
                    serverSetup.billingType ?? '',

                amount: String(
                    serverSetup.baseAmount
                ),

                serverTaxAmount: String(
                    serverSetup.gstAmount
                ),

                serverTotalAmount: String(
                    serverSetup.totalAmount
                ),
            },
        });
    };

    if (loading && !serverSetup) {
        return (
            <SafeAreaView
                style={styles.container}
                edges={['top', 'left', 'right']}
            >
                <View style={styles.center}>
                    <ActivityIndicator
                        size="large"
                        color="#0EA5E9"
                    />

                    <Text style={styles.loadingTitle}>
                        Loading server setup
                    </Text>

                    <Text style={styles.loadingText}>
                        Retrieving your saved server
                        preference.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (errorMessage || !serverSetup) {
        return (
            <SafeAreaView
                style={styles.container}
                edges={['top', 'left', 'right']}
            >
                <View style={styles.errorHeader}>
                    <TouchableOpacity
                        onPress={() =>
                            router.replace(
                                '/onboarding/check'
                            )
                        }
                        style={styles.backButton}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color="#0F172A"
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.center}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={48}
                        color="#DC2626"
                    />

                    <Text style={styles.errorTitle}>
                        Unable to load server setup
                    </Text>

                    <Text style={styles.errorText}>
                        {errorMessage ||
                            'No saved server setup was found.'}
                    </Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() =>
                            void loadServerSetup()
                        }
                    >
                        <Text style={styles.retryText}>
                            Try Again
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const skipped = serverSetup.skipped;

    const billingLabel =
        serverSetup.billingType === 'YEARLY'
            ? 'Yearly'
            : serverSetup.billingType === 'MONTHLY'
                ? 'Monthly'
                : 'Not selected';

    return (
        <SafeAreaView
            style={styles.container}
            edges={['top', 'left', 'right']}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={navigateToServerSetup}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color="#0F172A"
                    />
                </TouchableOpacity>

                <View style={styles.headerTextBox}>
                    <Text style={styles.headerTitle}>
                        Server Summary
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Review your deployment preference.
                    </Text>
                </View>

                {loading && (
                    <ActivityIndicator
                        size="small"
                        color="#0EA5E9"
                    />
                )}

                <TouchableOpacity
                    onPress={handleHome}
                    activeOpacity={0.7}
                    style={[
                        styles.iconButton,
                        styles.homeButton,
                    ]}
                    accessibilityLabel="Go to home"
                >
                    <Ionicons
                        name="home-outline"
                        size={22}
                        color="#0284C7"
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.statusIconBox}>
                    <Ionicons
                        name={
                            skipped
                                ? 'information-circle'
                                : 'checkmark-circle'
                        }
                        size={48}
                        color={
                            skipped
                                ? '#0284C7'
                                : '#16A34A'
                        }
                    />
                </View>

                <Text style={styles.title}>
                    {skipped
                        ? 'Server Setup Skipped'
                        : 'Server Preference Saved'}
                </Text>

                <Text style={styles.subtitle}>
                    {skipped
                        ? 'You can finalize the server setup later during the deployment discussion.'
                        : 'Your selected server preference has been saved for deployment planning.'}
                </Text>

                {skipped ? (
                    <View style={styles.infoCard}>
                        <View style={styles.cardIcon}>
                            <Ionicons
                                name="information-circle-outline"
                                size={22}
                                color="#0284C7"
                            />
                        </View>

                        <View style={styles.flexOne}>
                            <Text style={styles.cardTitle}>
                                Server can be selected later
                            </Text>

                            <Text style={styles.cardText}>
                                Our team will suggest a suitable
                                hosting option based on your
                                application, traffic and budget.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.summaryCard}>
                        <View style={styles.serverHeader}>
                            <View style={styles.flexOne}>
                                <Text style={styles.label}>
                                    Selected Server
                                </Text>

                                <Text style={styles.serverName}>
                                    {serverSetup.serverName}
                                </Text>
                            </View>

                            <View style={styles.planBadge}>
                                <Text
                                    style={
                                        styles.planBadgeText
                                    }
                                >
                                    {billingLabel}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.priceTop}>
                            <Text style={styles.totalLabel}>
                                Estimated Total
                            </Text>

                            <Text style={styles.totalAmount}>
                                {formatAmount(
                                    serverSetup.totalAmount
                                )}
                            </Text>
                        </View>

                        <View style={styles.breakupBox}>
                            <AmountRow
                                label="Server Estimated Amount"
                                value={serverSetup.baseAmount}
                            />

                            <AmountRow
                                label="GST / Tax (18%)"
                                value={serverSetup.gstAmount}
                            />

                            <View
                                style={
                                    styles.breakupDivider
                                }
                            />

                            <AmountRow
                                label="Payable Estimate"
                                value={serverSetup.totalAmount}
                                strong
                                last
                            />
                        </View>

                        <View style={styles.noteBox}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={17}
                                color="#92400E"
                            />

                            <Text style={styles.noteText}>
                                Final billing may vary based on
                                provider pricing, taxes, storage,
                                bandwidth and deployment
                                configuration.
                            </Text>
                        </View>
                    </View>
                )}

                <View style={styles.nextCard}>
                    <View style={styles.nextIconBox}>
                        <Ionicons
                            name="construct-outline"
                            size={24}
                            color="#0EA5E9"
                        />
                    </View>

                    <View style={styles.flexOne}>
                        <Text style={styles.nextTitle}>
                            Next Step: Maintenance
                        </Text>

                        <Text style={styles.nextText}>
                            Choose how your application should
                            be maintained after deployment.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.85}
                    onPress={handleContinue}
                >
                    <Text style={styles.buttonText}>
                        Continue to Maintenance
                    </Text>

                    <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function AmountRow({
    label,
    value,
    strong = false,
    last = false,
}: {
    label: string;
    value: number;
    strong?: boolean;
    last?: boolean;
}) {
    return (
        <View
            style={[
                styles.breakupRow,
                last && styles.lastBreakupRow,
            ]}
        >
            <Text
                style={
                    strong
                        ? styles.payableLabel
                        : styles.breakupLabel
                }
            >
                {label}
            </Text>

            <Text
                style={
                    strong
                        ? styles.payableValue
                        : styles.breakupValue
                }
            >
                {formatAmount(value)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    flexOne: {
        flex: 1,
    },

    center: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingTitle: {
        marginTop: 14,
        color: '#0F172A',
        fontSize: 17,
        fontWeight: '900',
    },

    loadingText: {
        marginTop: 5,
        color: '#64748B',
        fontSize: 13,
        textAlign: 'center',
    },

    errorHeader: {
        height: 56,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },

    errorTitle: {
        marginTop: 14,
        color: '#0F172A',
        fontSize: 19,
        fontWeight: '900',
        textAlign: 'center',
    },

    errorText: {
        marginTop: 7,
        color: '#64748B',
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },

    retryButton: {
        marginTop: 20,
        minWidth: 130,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0EA5E9',
    },

    retryText: {
        color: '#FFFFFF',
        fontWeight: '900',
    },

    header: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
    },

    backButton: {
        width: 38,
        height: 38,
        marginRight: 8,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTextBox: {
        flex: 1,
    },

    headerTitle: {
        fontSize: 23,
        fontWeight: '900',
        color: '#0F172A',
    },

    headerSubtitle: {
        marginTop: 3,
        fontSize: 12.5,
        lineHeight: 18,
        fontWeight: '600',
        color: '#64748B',
    },

    scroll: {
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 120,
        alignItems: 'center',
    },

    statusIconBox: {
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },

    title: {
        marginTop: 18,
        fontSize: 23,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
    },

    subtitle: {
        maxWidth: 520,
        marginTop: 8,
        fontSize: 13.5,
        lineHeight: 20,
        fontWeight: '600',
        color: '#64748B',
        textAlign: 'center',
    },

    infoCard: {
        width: '100%',
        marginTop: 24,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    cardIcon: {
        width: 38,
        height: 38,
        marginRight: 12,
        borderRadius: 19,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },

    cardTitle: {
        fontSize: 14.5,
        fontWeight: '900',
        color: '#0F172A',
    },

    cardText: {
        marginTop: 5,
        fontSize: 12.5,
        lineHeight: 19,
        fontWeight: '600',
        color: '#64748B',
    },

    summaryCard: {
        width: '100%',
        marginTop: 24,
        padding: 17,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        elevation: 2,
    },

    serverHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },

    label: {
        fontSize: 11.5,
        fontWeight: '900',
        color: '#64748B',
    },

    serverName: {
        marginTop: 4,
        fontSize: 17,
        fontWeight: '900',
        color: '#0F172A',
    },

    planBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#E0F2FE',
    },

    planBadgeText: {
        fontSize: 11.5,
        fontWeight: '900',
        color: '#0284C7',
    },

    divider: {
        height: 1,
        marginVertical: 15,
        backgroundColor: '#E2E8F0',
    },

    priceTop: {
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },

    totalLabel: {
        flex: 1,
        fontSize: 12.5,
        fontWeight: '800',
        color: '#64748B',
    },

    totalAmount: {
        fontSize: 25,
        fontWeight: '900',
        color: '#16A34A',
    },

    breakupBox: {
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },

    breakupRow: {
        marginBottom: 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    lastBreakupRow: {
        marginBottom: 0,
        marginTop: 7,
    },

    breakupLabel: {
        flex: 1,
        fontSize: 12.5,
        fontWeight: '700',
        color: '#64748B',
    },

    breakupValue: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0F172A',
    },

    breakupDivider: {
        height: 1,
        marginVertical: 3,
        backgroundColor: '#E2E8F0',
    },

    payableLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: '900',
        color: '#0F172A',
    },

    payableValue: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0F172A',
    },

    noteBox: {
        marginTop: 13,
        padding: 11,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
        backgroundColor: '#FFFBEB',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    noteText: {
        flex: 1,
        marginLeft: 7,
        fontSize: 11.5,
        lineHeight: 17,
        fontWeight: '700',
        color: '#92400E',
    },

    nextCard: {
        width: '100%',
        marginTop: 18,
        padding: 15,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        backgroundColor: '#F0F9FF',
        flexDirection: 'row',
        alignItems: 'center',
    },

    nextIconBox: {
        width: 42,
        height: 42,
        marginRight: 12,
        borderRadius: 21,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },

    nextTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
    },

    nextText: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '600',
        color: '#64748B',
    },

    footer: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        left: 0,
        paddingHorizontal: 20,
        paddingTop: 13,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },

    button: {
        minHeight: 54,
        borderRadius: 16,
        backgroundColor: '#0EA5E9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    buttonText: {
        marginRight: 8,
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },

    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },

    homeButton: {
        alignItems: 'flex-end',
        marginRight: 12,
    },
});