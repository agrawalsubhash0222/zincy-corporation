import { Ionicons } from '@expo/vector-icons';
import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from 'expo-router';
import {
    useCallback,
    useEffect,
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

import { API_BASE_URL } from '@/services/api';

const GST_RATE = 0.18;
const YEARLY_DISCOUNT_RATE = 0.1;

const SERVERS = [
    {
        name: 'Hostinger VPS',
        tag: 'Budget Friendly',
        monthly: 799,
        description:
            'Good for small business apps, websites, and admin panels.',
    },
    {
        name: 'Railway',
        tag: 'Quick Setup',
        monthly: 1299,
        description:
            'Useful for faster deployment during the early project stage.',
    },
    {
        name: 'Render',
        tag: 'Developer Friendly',
        monthly: 1699,
        description:
            'Good for quick backend deployment and managed hosting.',
    },
    {
        name: 'DigitalOcean',
        tag: 'Reliable VPS',
        monthly: 1899,
        description:
            'Balanced option for backend, database, and production apps.',
    },
    {
        name: 'AWS',
        tag: 'Scalable',
        monthly: 2599,
        description:
            'Best for high traffic, enterprise-level, and scalable apps.',
    },
] as const;

type BillingType = 'MONTHLY' | 'YEARLY';

type SelectedPlan = {
    serverName: string;
    billingType: BillingType;
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
};

type ServerSetupPayload = {
    onboardingRequestId: number;
    serverName?: string;
    billingType?: BillingType;
    amount?: number;
    skipped: boolean;
};

type PriceDetails = {
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
};

const calculatePrice = (baseAmount: number): PriceDetails => {
    const gstAmount = Math.round(baseAmount * GST_RATE);
    const totalAmount = baseAmount + gstAmount;

    return {
        baseAmount,
        gstAmount,
        totalAmount,
    };
};

const calculateYearlyPrice = (monthlyAmount: number) => {
    const yearlyOriginal = monthlyAmount * 12;

    return Math.round(
        yearlyOriginal * (1 - YEARLY_DISCOUNT_RATE)
    );
};

const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString('en-IN')}`;

const parseSingleParam = (
    value: string | string[] | undefined
): string => {
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }

    return value ?? '';
};

export default function ServerSetupScreen() {
    const params = useLocalSearchParams<{
        onboardingRequestId?: string | string[];
        serverName?: string | string[];
        billingType?: string | string[];
        amount?: string | string[];
    }>();

    const onboardingRequestId = Number(
        parseSingleParam(params.onboardingRequestId)
    );

    const paramServerName = parseSingleParam(params.serverName);
    const paramBillingType = parseSingleParam(params.billingType);
    const paramAmount = Number(parseSingleParam(params.amount));

    const [selectedPlan, setSelectedPlan] =
        useState<SelectedPlan | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const validBillingType =
            paramBillingType === 'MONTHLY' ||
            paramBillingType === 'YEARLY';

        if (
            !paramServerName ||
            !validBillingType ||
            !Number.isFinite(paramAmount) ||
            paramAmount <= 0
        ) {
            return;
        }

        const price = calculatePrice(paramAmount);

        setSelectedPlan({
            serverName: paramServerName,
            billingType: paramBillingType as BillingType,
            ...price,
        });
    }, [
        paramServerName,
        paramBillingType,
        paramAmount,
    ]);

    const selectedPlanLabel = useMemo(() => {
        if (!selectedPlan) {
            return '';
        }

        return selectedPlan.billingType === 'YEARLY'
            ? 'Yearly · 10% Off'
            : 'Monthly';
    }, [selectedPlan]);

    const isSelected = (
        serverName: string,
        billingType: BillingType
    ) =>
        selectedPlan?.serverName === serverName &&
        selectedPlan?.billingType === billingType;

    const handleSelectPlan = (
        serverName: string,
        billingType: BillingType,
        baseAmount: number
    ) => {
        if (isSubmitting) {
            return;
        }

        setSelectedPlan((currentPlan) => {
            const alreadySelected =
                currentPlan?.serverName === serverName &&
                currentPlan?.billingType === billingType;

            if (alreadySelected) {
                return null;
            }

            return {
                serverName,
                billingType,
                ...calculatePrice(baseAmount),
            };
        });
    };

    const saveServerSetup = async (
        payload: ServerSetupPayload
    ) => {
        const response = await fetch(
            `${API_BASE_URL}/server-setup`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        );

        const responseText = await response.text();

        let responseData: any = null;

        if (responseText) {
            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = responseText;
            }
        }

        if (!response.ok) {
            const errorMessage =
                responseData?.message ||
                responseData?.error ||
                (typeof responseData === 'string'
                    ? responseData
                    : 'Unable to save server setup.');

            throw new Error(errorMessage);
        }

        return responseData;
    };

    const handleNext = async () => {
        if (isSubmitting) {
            return;
        }

        if (
            !Number.isInteger(onboardingRequestId) ||
            onboardingRequestId <= 0
        ) {
            Alert.alert(
                'Missing request',
                'Onboarding request ID is unavailable.'
            );
            return;
        }

        setIsSubmitting(true);

        try {
            if (!selectedPlan) {
                await saveServerSetup({
                    onboardingRequestId,
                    skipped: true,
                });

                router.replace({
                    pathname: '/client-setup/server/server-success',
                    params: {
                        onboardingRequestId: String(onboardingRequestId),
                        skipped: 'true',
                    },
                });

                return;
            }

            await saveServerSetup({
                onboardingRequestId,
                serverName: selectedPlan.serverName,
                billingType: selectedPlan.billingType,

                // Send base price only.
                // Backend will calculate 18% GST and total amount.
                amount: selectedPlan.baseAmount,

                skipped: false,
            });

            router.replace({
                pathname: '/client-setup/server/server-success',
                params: {
                    onboardingRequestId: String(onboardingRequestId),
                    skipped: 'false',
                    serverName: selectedPlan.serverName,
                    billingType: selectedPlan.billingType,
                    baseAmount: String(selectedPlan.baseAmount),
                    gstAmount: String(selectedPlan.gstAmount),
                    totalAmount: String(selectedPlan.totalAmount),
                },
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unable to save server setup. Please try again.';

            Alert.alert('Save failed', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = useCallback(() => {
        router.replace({
            pathname: '/client-setup/completion/success',
            params: {
                onboardingRequestId: String(
                    onboardingRequestId
                ),

                ...(selectedPlan
                    ? {
                        serverName:
                            selectedPlan.serverName,
                        billingType:
                            selectedPlan.billingType,
                        amount: String(
                            selectedPlan.baseAmount
                        ),
                    }
                    : {}),
            },
        });
    }, [onboardingRequestId, selectedPlan]);

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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.backButton}
                        disabled={isSubmitting}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color="#0F172A"
                        />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={styles.title}>
                            Server Setup
                        </Text>

                        <Text style={styles.subtitle}>
                            Select a deployment plan or skip
                            this step for now.
                        </Text>
                    </View>
                </View>

                <View style={styles.notice}>
                    <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color="#B45309"
                    />

                    <Text style={styles.noticeText}>
                        Pricing is estimated and includes 18%
                        GST. Final cost will be confirmed before
                        deployment.
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {SERVERS.map((server) => {
                    const monthlyPrice = calculatePrice(
                        server.monthly
                    );

                    const yearlyOriginal =
                        server.monthly * 12;

                    const yearlyBase =
                        calculateYearlyPrice(server.monthly);

                    const yearlyPrice =
                        calculatePrice(yearlyBase);

                    const monthlySelected = isSelected(
                        server.name,
                        'MONTHLY'
                    );

                    const yearlySelected = isSelected(
                        server.name,
                        'YEARLY'
                    );

                    return (
                        <View
                            key={server.name}
                            style={styles.serverCard}
                        >
                            <View style={styles.serverHeader}>
                                <View style={styles.serverTitleBox}>
                                    <Text style={styles.serverName}>
                                        {server.name}
                                    </Text>

                                    <Text style={styles.serverTag}>
                                        {server.tag}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.description}>
                                {server.description}
                            </Text>

                            <View style={styles.planRow}>
                                <PlanCard
                                    title="Monthly"
                                    selected={monthlySelected}
                                    baseAmount={
                                        monthlyPrice.baseAmount
                                    }
                                    gstAmount={
                                        monthlyPrice.gstAmount
                                    }
                                    totalAmount={
                                        monthlyPrice.totalAmount
                                    }
                                    footerText="per month"
                                    disabled={isSubmitting}
                                    onPress={() =>
                                        handleSelectPlan(
                                            server.name,
                                            'MONTHLY',
                                            server.monthly
                                        )
                                    }
                                />

                                <PlanCard
                                    title="Yearly"
                                    selected={yearlySelected}
                                    originalAmount={
                                        yearlyOriginal
                                    }
                                    baseAmount={
                                        yearlyPrice.baseAmount
                                    }
                                    gstAmount={
                                        yearlyPrice.gstAmount
                                    }
                                    totalAmount={
                                        yearlyPrice.totalAmount
                                    }
                                    discountText="10% Off"
                                    disabled={isSubmitting}
                                    onPress={() =>
                                        handleSelectPlan(
                                            server.name,
                                            'YEARLY',
                                            yearlyBase
                                        )
                                    }
                                />
                            </View>
                        </View>
                    );
                })}

                <View style={styles.skipInfo}>
                    <Ionicons
                        name="help-circle-outline"
                        size={18}
                        color="#64748B"
                    />

                    <Text style={styles.skipInfoText}>
                        Not sure which plan to choose? Skip for
                        now and our team will recommend a suitable
                        server during project planning.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                {selectedPlan ? (
                    <View style={styles.footerRow}>
                        <View style={styles.selectionSummary}>
                            <Text
                                style={styles.selectedServer}
                                numberOfLines={1}
                            >
                                {selectedPlan.serverName}
                            </Text>

                            <View style={styles.selectedDetails}>
                                <Text style={styles.selectedPlan}>
                                    {selectedPlanLabel}
                                </Text>

                                <Text style={styles.selectedTotal}>
                                    {formatCurrency(
                                        selectedPlan.totalAmount
                                    )}
                                </Text>
                            </View>

                            <Text style={styles.gstIncluded}>
                                Includes{' '}
                                {formatCurrency(
                                    selectedPlan.gstAmount
                                )}{' '}
                                GST
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                isSubmitting &&
                                styles.disabledButton,
                            ]}
                            activeOpacity={0.85}
                            onPress={handleNext}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                />
                            ) : (
                                <>
                                    <Text
                                        style={
                                            styles.buttonText
                                        }
                                    >
                                        Continue
                                    </Text>

                                    <Ionicons
                                        name="arrow-forward"
                                        size={17}
                                        color="#FFFFFF"
                                    />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.skipButton,
                            isSubmitting &&
                            styles.disabledButton,
                        ]}
                        activeOpacity={0.85}
                        onPress={handleNext}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                            />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>
                                    Skip for Now
                                </Text>

                                <Ionicons
                                    name="arrow-forward"
                                    size={18}
                                    color="#FFFFFF"
                                />
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

type PlanCardProps = {
    title: string;
    selected: boolean;
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    originalAmount?: number;
    footerText?: string;
    discountText?: string;
    disabled?: boolean;
    onPress: () => void;
};

function PlanCard({
    title,
    selected,
    baseAmount,
    gstAmount,
    totalAmount,
    originalAmount,
    footerText,
    discountText,
    disabled,
    onPress,
}: PlanCardProps) {
    return (
        <TouchableOpacity
            style={[
                styles.planCard,
                selected && styles.selectedPlanCard,
            ]}
            activeOpacity={0.85}
            onPress={onPress}
            disabled={disabled}
        >
            <View style={styles.planHeader}>
                <Text style={styles.planTitle}>
                    {title}
                </Text>

                <Ionicons
                    name={
                        selected
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                    }
                    size={20}
                    color={
                        selected ? '#0284C7' : '#94A3B8'
                    }
                />
            </View>

            <View style={styles.priceLine}>
                {originalAmount ? (
                    <Text style={styles.originalPrice}>
                        {formatCurrency(originalAmount)}
                    </Text>
                ) : null}

                <Text style={styles.basePrice}>
                    {formatCurrency(baseAmount)}
                </Text>
            </View>

            {discountText ? (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                        {discountText}
                    </Text>
                </View>
            ) : footerText ? (
                <Text style={styles.billingPeriod}>
                    {footerText}
                </Text>
            ) : null}

            <View style={styles.taxDivider} />

            <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>
                    18% GST
                </Text>

                <Text style={styles.taxValue}>
                    + {formatCurrency(gstAmount)}
                </Text>
            </View>

            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                    Total
                </Text>

                <Text style={styles.totalValue}>
                    {formatCurrency(totalAmount)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    header: {
        marginTop: 0,
        paddingTop: 44,
        paddingHorizontal: 18,
        paddingBottom: 13,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    backButton: {
        width: 36,
        height: 36,
        marginRight: 8,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerContent: {
        flex: 1,
    },

    title: {
        fontSize: 23,
        fontWeight: '900',
        color: '#0F172A',
    },

    subtitle: {
        marginTop: 3,
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '600',
        color: '#64748B',
    },

    notice: {
        marginTop: 13,
        paddingHorizontal: 11,
        paddingVertical: 9,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        backgroundColor: '#FFFBEB',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    noticeText: {
        flex: 1,
        marginLeft: 7,
        fontSize: 11.5,
        lineHeight: 17,
        fontWeight: '600',
        color: '#92400E',
    },

    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 125,
    },

    serverCard: {
        marginBottom: 12,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        elevation: 1,
    },

    serverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    serverTitleBox: {
        flex: 1,
    },

    serverName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },

    serverTag: {
        marginTop: 2,
        fontSize: 10.5,
        fontWeight: '800',
        color: '#0284C7',
    },

    description: {
        marginTop: 8,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '500',
        color: '#64748B',
    },

    planRow: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 9,
    },

    planCard: {
        flex: 1,
        minHeight: 176,
        padding: 11,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },

    selectedPlanCard: {
        borderColor: '#0EA5E9',
        backgroundColor: '#F0F9FF',
    },

    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    planTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748B',
    },

    priceLine: {
        minHeight: 28,
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: 5,
    },

    originalPrice: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        textDecorationLine: 'line-through',
    },

    basePrice: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },

    billingPeriod: {
        marginTop: 2,
        fontSize: 9.5,
        fontWeight: '600',
        color: '#94A3B8',
    },

    discountBadge: {
        alignSelf: 'flex-start',
        marginTop: 2,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 99,
        backgroundColor: '#DCFCE7',
    },

    discountText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#15803D',
    },

    taxDivider: {
        marginTop: 9,
        marginBottom: 7,
        height: 1,
        backgroundColor: '#E2E8F0',
    },

    taxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    taxLabel: {
        fontSize: 9.5,
        fontWeight: '600',
        color: '#64748B',
    },

    taxValue: {
        fontSize: 9.5,
        fontWeight: '700',
        color: '#64748B',
    },

    totalRow: {
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    totalLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#334155',
    },

    totalValue: {
        fontSize: 11.5,
        fontWeight: '900',
        color: '#0F172A',
    },

    skipInfo: {
        marginTop: 2,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },

    skipInfoText: {
        flex: 1,
        marginLeft: 7,
        fontSize: 11.5,
        lineHeight: 17,
        textAlign: 'center',
        fontWeight: '500',
        color: '#64748B',
    },

    footer: {
        paddingHorizontal: 18,
        paddingTop: 11,
        paddingBottom: 48,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },

    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },

    selectionSummary: {
        flex: 1,
        minHeight: 65,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
    },

    selectedServer: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0F172A',
    },

    selectedDetails: {
        marginTop: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    selectedPlan: {
        fontSize: 9.5,
        fontWeight: '800',
        color: '#15803D',
    },

    selectedTotal: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0F172A',
    },

    gstIncluded: {
        marginTop: 2,
        fontSize: 8.5,
        fontWeight: '600',
        color: '#64748B',
        textAlign: 'right',
    },

    continueButton: {
        width: 126,
        minHeight: 65,
        borderRadius: 14,
        backgroundColor: '#0EA5E9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    skipButton: {
        alignSelf: 'center',
        width: '62%',
        height: 50,
        borderRadius: 14,
        backgroundColor: '#0EA5E9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    disabledButton: {
        opacity: 0.65,
    },

    buttonText: {
        marginRight: 7,
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});