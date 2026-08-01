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
    BackHandler,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    SafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/services/api';

const ADVANCE_AMOUNT = 5000;

// Keeps the layout from stretching edge-to-edge on wide
// browser windows. Mobile/native is untouched.
const WEB_CONTENT_MAX_WIDTH = 520;
const isWeb = Platform.OS === 'web';
const webConstrained = isWeb
    ? {
        width: '100%' as const,
        maxWidth: WEB_CONTENT_MAX_WIDTH,
        alignSelf: 'center' as const,
    }
    : {};

type RouteParams = {
    onboardingRequestId?: string | string[];
};

type ServerBillingType = 'MONTHLY' | 'YEARLY' | null;

type MaintenanceType =
    | 'ZINCY_MANAGED'
    | 'CLIENT_MANAGED'
    | 'DECIDE_LATER';

type MaintenanceBillingType =
    | 'MONTHLY'
    | 'YEARLY'
    | 'NA';

type ServerSetupResponse = {
    id: number;
    onboardingRequestId: number;
    serverName: string;
    billingType: ServerBillingType;
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    skipped: boolean;
    serverSetupCompleted: boolean;
};

type MaintenanceSetupResponse = {
    id: number;
    onboardingRequestId: number;
    maintenanceType: MaintenanceType;
    billingType: MaintenanceBillingType;
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    maintenanceSetupCompleted: boolean;
};

type ApiErrorResponse = {
    message?: string;
    error?: string;
};

function readParam(
    value: string | string[] | undefined
): string {
    return Array.isArray(value)
        ? value[0] ?? ''
        : value ?? '';
}

async function parseResponse<T>(
    response: Response,
    fallbackMessage: string
): Promise<T> {
    const responseText = await response.text();

    let responseBody: unknown = null;

    if (responseText) {
        try {
            responseBody = JSON.parse(responseText);
        } catch {
            responseBody = responseText;
        }
    }

    if (!response.ok) {
        const errorBody =
            typeof responseBody === 'object' &&
                responseBody !== null
                ? (responseBody as ApiErrorResponse)
                : null;

        const backendMessage =
            errorBody?.message ||
            errorBody?.error ||
            (typeof responseBody === 'string'
                ? responseBody
                : '');

        throw new Error(
            backendMessage || fallbackMessage
        );
    }

    return responseBody as T;
}

async function getServerSetup(
    onboardingRequestId: number
): Promise<ServerSetupResponse> {
    const response = await fetch(
        `${API_BASE_URL}/server-setup/onboarding/${onboardingRequestId}`,
        {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        }
    );

    const data = await parseResponse<ServerSetupResponse>(
        response,
        'Unable to load saved server setup.'
    );

    return {
        ...data,
        id: Number(data.id),
        onboardingRequestId: Number(
            data.onboardingRequestId
        ),
        baseAmount: Number(data.baseAmount ?? 0),
        gstAmount: Number(data.gstAmount ?? 0),
        totalAmount: Number(data.totalAmount ?? 0),
        skipped: Boolean(data.skipped),
        serverSetupCompleted: Boolean(
            data.serverSetupCompleted
        ),
    };
}

async function getMaintenanceSetup(
    onboardingRequestId: number
): Promise<MaintenanceSetupResponse> {
    const response = await fetch(
        `${API_BASE_URL}/maintenance-setup/onboarding/${onboardingRequestId}`,
        {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        }
    );

    const data =
        await parseResponse<MaintenanceSetupResponse>(
            response,
            'Unable to load saved maintenance setup.'
        );

    return {
        ...data,
        id: Number(data.id),
        onboardingRequestId: Number(
            data.onboardingRequestId
        ),
        baseAmount: Number(data.baseAmount ?? 0),
        gstAmount: Number(data.gstAmount ?? 0),
        totalAmount: Number(data.totalAmount ?? 0),
        maintenanceSetupCompleted: Boolean(
            data.maintenanceSetupCompleted
        ),
    };
}

function getMaintenanceTitle(
    maintenanceType: MaintenanceType | ''
): string {
    switch (maintenanceType) {
        case 'ZINCY_MANAGED':
            return 'Zincy Managed Maintenance';
        case 'CLIENT_MANAGED':
            return 'Client Managed Maintenance';
        case 'DECIDE_LATER':
            return 'Decide Later';
        default:
            return 'Not selected';
    }
}

function formatAmount(value: number): string {
    return `₹${value.toLocaleString('en-IN', {
        minimumFractionDigits:
            Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    })}/-`;
}

function formatBilling(value: string): string {
    const normalizedValue = value
        .trim()
        .toUpperCase();

    if (normalizedValue === 'MONTHLY') {
        return 'Monthly';
    }

    if (normalizedValue === 'YEARLY') {
        return 'Yearly';
    }

    if (normalizedValue === 'ONE_TIME') {
        return 'One-time';
    }

    return 'Not applicable';
}

export default function CheckoutScreen() {
    const params =
        useLocalSearchParams<RouteParams>();

    const insets = useSafeAreaInsets();

    const onboardingRequestId = useMemo(() => {
        const parsed = Number(
            readParam(params.onboardingRequestId)
        );

        return Number.isInteger(parsed) && parsed > 0
            ? parsed
            : null;
    }, [params.onboardingRequestId]);

    const [serverSetup, setServerSetup] =
        useState<ServerSetupResponse | null>(null);

    const handleHome = () => {
        router.replace('/(website)');
    };

    const [maintenanceSetup, setMaintenanceSetup] =
        useState<MaintenanceSetupResponse | null>(
            null
        );

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] =
        useState('');

    const loadCheckoutDetails = useCallback(async () => {
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

            const [savedServer, savedMaintenance] =
                await Promise.all([
                    getServerSetup(
                        onboardingRequestId
                    ),
                    getMaintenanceSetup(
                        onboardingRequestId
                    ),
                ]);

            setServerSetup(savedServer);
            setMaintenanceSetup(savedMaintenance);
        } catch (error) {
            console.error(
                'Checkout details load error:',
                error
            );

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to load checkout details.'
            );
        } finally {
            setLoading(false);
        }
    }, [onboardingRequestId]);

    useFocusEffect(
        useCallback(() => {
            void loadCheckoutDetails();
        }, [loadCheckoutDetails])
    );

    const isServerSkipped =
        serverSetup?.skipped !== false;

    const serverName = isServerSkipped
        ? ''
        : serverSetup?.serverName ?? '';

    const serverBillingType =
        serverSetup?.billingType ?? null;

    const serverAmount = isServerSkipped
        ? 0
        : serverSetup?.baseAmount ?? 0;

    const serverTax = isServerSkipped
        ? 0
        : serverSetup?.gstAmount ?? 0;

    const serverTotal = isServerSkipped
        ? 0
        : serverSetup?.totalAmount ?? 0;

    const maintenanceType =
        maintenanceSetup?.maintenanceType ?? '';

    const maintenanceBilling =
        maintenanceSetup?.billingType ?? 'NA';

    const maintenanceAmount =
        maintenanceSetup?.baseAmount ?? 0;

    const maintenanceTax =
        maintenanceSetup?.gstAmount ?? 0;

    const maintenanceTotal =
        maintenanceSetup?.totalAmount ?? 0;

    const maintenanceTitle =
        getMaintenanceTitle(maintenanceType);

    const isClientManagedMaintenance =
        maintenanceType === 'CLIENT_MANAGED';

    const isPaidMaintenance =
        maintenanceType === 'ZINCY_MANAGED' &&
        maintenanceTotal > 0;

    const totalPayable =
        ADVANCE_AMOUNT +
        serverTotal +
        maintenanceTotal;

    const handleBack = useCallback(() => {
        if (!onboardingRequestId) {
            router.replace('/onboarding/check');
            return;
        }

        router.replace({
            pathname: '/client-setup/maintenance/maintenance',
            params: {
                onboardingRequestId: String(
                    onboardingRequestId
                ),

                skipped: isServerSkipped
                    ? 'true'
                    : 'false',

                serverName,
                billingType:
                    serverBillingType ?? '',
                amount: String(serverAmount),
                serverTaxAmount: String(
                    serverTax
                ),
                serverTotalAmount: String(
                    serverTotal
                ),

                maintenanceType,
                maintenanceTitle,
                maintenanceBilling,
                maintenanceAmount: String(
                    maintenanceAmount
                ),
                maintenanceTaxAmount: String(
                    maintenanceTax
                ),
                maintenanceTotalAmount: String(
                    maintenanceTotal
                ),
            },
        });
    }, [
        onboardingRequestId,
        isServerSkipped,
        serverName,
        serverBillingType,
        serverAmount,
        serverTax,
        serverTotal,
        maintenanceType,
        maintenanceTitle,
        maintenanceBilling,
        maintenanceAmount,
        maintenanceTax,
        maintenanceTotal,
    ]);

    useFocusEffect(
        useCallback(() => {
            const subscription =
                BackHandler.addEventListener(
                    'hardwareBackPress',
                    () => {
                        handleBack();
                        return true;
                    }
                );

            return () => subscription.remove();
        }, [handleBack])
    );

    const handleProceedToPay = () => {
        if (!onboardingRequestId || totalPayable <= 0) {
            return;
        }

        router.push({
            pathname: '/client-setup/payment/payment',
            params: {
                onboardingRequestId: String(onboardingRequestId),
            },
        });
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

                    <Text style={styles.loadingTitle}>
                        Loading checkout
                    </Text>

                    <Text style={styles.loadingMessage}>
                        Retrieving your saved server and
                        maintenance details.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (
        errorMessage ||
        !serverSetup ||
        !maintenanceSetup
    ) {
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
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={25}
                            color="#0F172A"
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.centerContainer}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={48}
                        color="#DC2626"
                    />

                    <Text style={styles.errorTitle}>
                        Unable to load checkout
                    </Text>

                    <Text style={styles.errorMessage}>
                        {errorMessage ||
                            'The saved setup details could not be found.'}
                    </Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        activeOpacity={0.85}
                        onPress={() =>
                            void loadCheckoutDetails()
                        }
                    >
                        <Text
                            style={
                                styles.retryButtonText
                            }
                        >
                            Try Again
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={styles.container}
            edges={['top', 'left', 'right']}
        >
            <View style={styles.fixedHeader}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.backButton}
                        activeOpacity={0.7}
                        hitSlop={{
                            top: 10,
                            bottom: 10,
                            left: 10,
                            right: 10,
                        }}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={25}
                            color="#0F172A"
                        />
                    </TouchableOpacity>

                    <View style={styles.headerTextBox}>
                        <Text style={styles.title}>
                            Checkout
                        </Text>

                        <Text style={styles.subtitle}>
                            Review payable amount before payment.
                        </Text>
                    </View>
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
            </View>

            <View style={styles.fixedSummaryContainer}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>
                        Total Payable Now
                    </Text>

                    <Text style={styles.summaryAmount}>
                        {formatAmount(totalPayable)}
                    </Text>

                    <Text style={styles.summarySubText}>
                        Includes advance payment, selected server and
                        maintenance charges.
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingBottom:
                            110 + insets.bottom,
                    },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>
                    <SectionHeader
                        icon="wallet-outline"
                        title="Advance Payment"
                    />

                    <AmountRow
                        label="Advance Amount"
                        value={formatAmount(
                            ADVANCE_AMOUNT
                        )}
                        strong
                    />

                    <Text style={styles.smallNote}>
                        This amount will be adjusted against your final
                        project bill.
                    </Text>
                </View>

                <View style={styles.card}>
                    <SectionHeader
                        icon="server-outline"
                        title="Server Configuration"
                    />

                    {isServerSkipped ? (
                        <>
                            <InfoRow
                                label="Status"
                                value="Skipped for now"
                            />

                            <AmountRow
                                label="Server Charge"
                                value={formatAmount(0)}
                                strong
                            />
                        </>
                    ) : (
                        <>
                            <InfoRow
                                label="Selected Server"
                                value={serverName}
                            />

                            <InfoRow
                                label="Billing"
                                value={formatBilling(
                                    serverBillingType ?? ''
                                )}
                            />

                            <View style={styles.divider} />

                            <AmountRow
                                label="Base Amount"
                                value={formatAmount(
                                    serverAmount
                                )}
                            />

                            <AmountRow
                                label="GST / Tax (18%)"
                                value={formatAmount(
                                    serverTax
                                )}
                            />

                            <AmountRow
                                label="Server Total"
                                value={formatAmount(
                                    serverTotal
                                )}
                                strong
                            />
                        </>
                    )}
                </View>

                <View style={styles.card}>
                    <SectionHeader
                        icon="construct-outline"
                        title="Maintenance"
                    />

                    <InfoRow
                        label="Plan"
                        value={maintenanceTitle}
                    />

                    {isClientManagedMaintenance ? (
                        <>
                            <InfoRow
                                label="Billing"
                                value="Not applicable"
                            />

                            <AmountRow
                                label="Maintenance Charge"
                                value={formatAmount(0)}
                                strong
                            />
                        </>
                    ) : (
                        <>
                            <InfoRow
                                label="Billing"
                                value={
                                    isPaidMaintenance
                                        ? formatBilling(
                                            maintenanceBilling
                                        )
                                        : 'Not applicable'
                                }
                            />

                            {isPaidMaintenance && (
                                <>
                                    <View
                                        style={
                                            styles.divider
                                        }
                                    />

                                    <AmountRow
                                        label="Base Amount"
                                        value={formatAmount(
                                            maintenanceAmount
                                        )}
                                    />

                                    <AmountRow
                                        label="GST / Tax (18%)"
                                        value={formatAmount(
                                            maintenanceTax
                                        )}
                                    />

                                    <AmountRow
                                        label="Maintenance Total"
                                        value={formatAmount(
                                            maintenanceTotal
                                        )}
                                        strong
                                    />
                                </>
                            )}
                        </>
                    )}
                </View>

                <View style={styles.totalCard}>
                    <AmountRow
                        label="Advance"
                        value={formatAmount(
                            ADVANCE_AMOUNT
                        )}
                        light
                    />

                    <AmountRow
                        label="Server Total"
                        value={formatAmount(serverTotal)}
                        light
                    />

                    <AmountRow
                        label="Maintenance Total"
                        value={formatAmount(
                            maintenanceTotal
                        )}
                        light
                    />

                    <View style={styles.totalDivider} />

                    <View style={styles.finalRow}>
                        <Text style={styles.finalLabel}>
                            Total Payable
                        </Text>

                        <Text style={styles.finalAmount}>
                            {formatAmount(totalPayable)}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons
                        name="information-circle-outline"
                        size={19}
                        color="#B45309"
                        style={styles.infoIcon}
                    />

                    <Text style={styles.infoText}>
                        Final quotation and billing terms will be
                        confirmed before deployment.
                    </Text>
                </View>
            </ScrollView>

            <View
                style={[
                    styles.footer,
                    {
                        paddingBottom: Math.max(
                            insets.bottom,
                            14
                        ),
                    },
                ]}
            >
                <View style={styles.footerInner}>
                    <TouchableOpacity
                        style={styles.button}
                        activeOpacity={0.85}
                        onPress={handleProceedToPay}
                    >
                        <Text style={styles.buttonText}>
                            Proceed to Pay
                        </Text>

                        <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

function SectionHeader({
    icon,
    title,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
}) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
                <Ionicons
                    name={icon}
                    size={19}
                    color="#0284C7"
                />
            </View>

            <Text style={styles.sectionTitle}>
                {title}
            </Text>
        </View>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>
                {label}
            </Text>

            <View style={styles.rowValueContainer}>
                <Text style={styles.rowValue}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

function AmountRow({
    label,
    value,
    strong = false,
    light = false,
}: {
    label: string;
    value: string;
    strong?: boolean;
    light?: boolean;
}) {
    return (
        <View style={styles.row}>
            <Text
                style={[
                    styles.rowLabel,
                    light && styles.lightText,
                ]}
            >
                {label}
            </Text>

            <View style={styles.amountValueContainer}>
                <Text
                    style={[
                        styles.amountValue,
                        strong && styles.strongAmount,
                        light && styles.lightAmount,
                    ]}
                >
                    {value}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    centerContainer: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingTitle: {
        marginTop: 14,
        color: '#0F172A',
        fontSize: 18,
        lineHeight: 22,
        fontWeight: '900',
    },

    loadingMessage: {
        marginTop: 6,
        color: '#64748B',
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },

    errorHeader: {
        height: 56,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },

    errorTitle: {
        marginTop: 14,
        color: '#0F172A',
        fontSize: 19,
        lineHeight: 24,
        fontWeight: '900',
        textAlign: 'center',
    },

    errorMessage: {
        marginTop: 7,
        color: '#64748B',
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },

    retryButton: {
        minWidth: 130,
        height: 48,
        marginTop: 20,
        paddingHorizontal: 18,
        borderRadius: 14,
        backgroundColor: '#0EA5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },

    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },

    fixedHeader: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        width: '100%',
        zIndex: 10,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        ...webConstrained,
    },

    backButton: {
        width: 38,
        height: 38,
        marginRight: 7,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTextBox: {
        flex: 1,
        paddingTop: 1,
    },

    title: {
        fontSize: 23,
        lineHeight: 28,
        fontWeight: '900',
        color: '#0F172A',
    },

    subtitle: {
        marginTop: 3,
        fontSize: 12.5,
        lineHeight: 18,
        color: '#64748B',
        fontWeight: '600',
    },

    fixedSummaryContainer: {
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 12,
        backgroundColor: '#F8FAFC',
        width: '100%',
        zIndex: 15,
        elevation: 3,
    },

    summaryCard: {
        backgroundColor: '#0F172A',
        borderRadius: 18,
        paddingHorizontal: 17,
        paddingVertical: 16,
        shadowColor: '#0F172A',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.14,
        shadowRadius: 8,
        elevation: 4,
        ...webConstrained,
    },

    summaryLabel: {
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '800',
        color: '#CBD5E1',
    },

    summaryAmount: {
        marginTop: 5,
        fontSize: 26,
        lineHeight: 32,
        fontWeight: '900',
        color: '#FFFFFF',
    },

    summarySubText: {
        marginTop: 6,
        maxWidth: 285,
        fontSize: 11.5,
        lineHeight: 17,
        color: '#CBD5E1',
        fontWeight: '600',
    },

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 2,
        ...webConstrained,
    },

    card: {
        marginBottom: 13,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 15,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 2,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 11,
    },

    iconBox: {
        width: 34,
        height: 34,
        marginRight: 10,
        borderRadius: 11,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },

    sectionTitle: {
        flex: 1,
        fontSize: 14.5,
        lineHeight: 20,
        fontWeight: '900',
        color: '#0F172A',
    },

    row: {
        width: '100%',
        minHeight: 31,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    rowLabel: {
        flex: 0.42,
        paddingRight: 10,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '700',
        color: '#64748B',
    },

    rowValueContainer: {
        flex: 0.58,
        alignItems: 'flex-end',
    },

    rowValue: {
        width: '100%',
        textAlign: 'right',
        fontSize: 11.5,
        lineHeight: 17,
        fontWeight: '800',
        color: '#0F172A',
        flexShrink: 1,
    },

    amountValueContainer: {
        flex: 0.58,
        alignItems: 'flex-end',
    },

    amountValue: {
        width: '100%',
        textAlign: 'right',
        fontSize: 12.5,
        lineHeight: 18,
        fontWeight: '800',
        color: '#0F172A',
    },

    strongAmount: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '900',
    },

    smallNote: {
        marginTop: 7,
        fontSize: 11,
        lineHeight: 17,
        color: '#64748B',
        fontWeight: '600',
    },

    divider: {
        height: 1,
        marginVertical: 8,
        backgroundColor: '#E2E8F0',
    },

    totalCard: {
        marginBottom: 13,
        paddingHorizontal: 15,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        shadowColor: '#0F172A',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },

    lightText: {
        color: '#475569',
    },

    lightAmount: {
        color: '#0F172A',
    },

    totalDivider: {
        height: 1,
        marginVertical: 10,
        backgroundColor: '#CBD5E1',
    },

    finalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    finalLabel: {
        flex: 1,
        paddingRight: 12,
        fontSize: 15,
        lineHeight: 21,
        fontWeight: '900',
        color: '#0F172A',
    },

    finalAmount: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'right',
    },

    infoBox: {
        marginBottom: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FFFBEB',
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#FDE68A',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    infoIcon: {
        marginTop: 1,
    },

    infoText: {
        flex: 1,
        marginLeft: 7,
        fontSize: 11,
        lineHeight: 16,
        color: '#92400E',
        fontWeight: '700',
        flexShrink: 1,
    },

    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 18,
        paddingTop: 11,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        zIndex: 30,
        elevation: 10,
        height: 80,
    },

    footerInner: {
        ...webConstrained,
    },

    // Capped instead of an unconstrained '60%' of a full-bleed
    // container — stays a sensible size on large screens.
    button: {
        minHeight: 54,
        borderRadius: 16,
        backgroundColor: '#0EA5E9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0284C7',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 4,
        marginBottom: 10,
        width: '60%',
        maxWidth: 260,
        minWidth: 190,
        alignSelf: 'center',
    },

    buttonText: {
        marginRight: 9,
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '900',
        color: '#FFFFFF',
    },

    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },

    homeButton: {
        alignItems: 'flex-end',
        marginRight: 13,
    },
});