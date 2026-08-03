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
    Platform,
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

// Keeps the layout from stretching edge-to-edge on wide
// browser windows. Mobile is untouched — this only kicks in
// on web, where the SafeAreaView otherwise fills the full
// viewport width.
const WEB_CONTENT_MAX_WIDTH = 520;
const isWeb = Platform.OS === 'web';

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
    skipped: boolean;
};

type PriceDetails = {
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
};

const calculatePrice = (baseAmount: number): PriceDetails => {
    const gstAmount =
        Math.round(baseAmount * GST_RATE * 100) / 100;
    const totalAmount =
        Math.round((baseAmount + gstAmount) * 100) / 100;

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
    `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
    })}`;

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
                credentials: 'include',
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
                <View style={styles.headerInner}>
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
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollOuter}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.scrollContent}>
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
                                        period="M"
                                        selected={monthlySelected}
                                        baseAmount={monthlyPrice.baseAmount}
                                        gstAmount={monthlyPrice.gstAmount}
                                        totalAmount={monthlyPrice.totalAmount}
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
                                        period="Y"
                                        selected={yearlySelected}
                                        originalAmount={yearlyOriginal}
                                        baseAmount={yearlyPrice.baseAmount}
                                        gstAmount={yearlyPrice.gstAmount}
                                        totalAmount={yearlyPrice.totalAmount}
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
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerInner}>
                    {selectedPlan ? (
                        <View style={styles.footerRow}>
                            <View style={styles.selectionSummary}>
                                <Text style={styles.selectedServer} numberOfLines={1}>
                                    {selectedPlan.serverName}
                                </Text>

                                <View style={styles.selectedDetails}>
                                    <Text style={styles.selectedPlan} numberOfLines={1}>
                                        {selectedPlanLabel}
                                    </Text>

                                    <View style={styles.selectedPriceBox}>
                                        <Text style={styles.selectedTotal}>
                                            {formatCurrency(selectedPlan.totalAmount)}
                                        </Text>

                                        <Text style={styles.gstIncluded}>
                                            Includes {formatCurrency(selectedPlan.gstAmount)} GST
                                        </Text>
                                    </View>
                                </View>
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
            </View>
        </SafeAreaView>
    );
}

type PlanCardProps = {
    title: string;
    period: 'M' | 'Y';
    selected: boolean;
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    originalAmount?: number;
    discountText?: string;
    disabled?: boolean;
    onPress: () => void;
};

function PlanCard({
    title,
    period,
    selected,
    baseAmount,
    gstAmount,
    totalAmount,
    originalAmount,
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
                <Text style={styles.planTitle}>{title}</Text>

                <Ionicons
                    name={
                        selected
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                    }
                    size={20}
                    color={selected ? '#149BD7' : '#94A3B8'}
                />
            </View>

            <View style={styles.priceLine}>
                {!!originalAmount && (
                    <Text style={styles.originalPrice}>
                        {formatCurrency(originalAmount)}
                    </Text>
                )}

                <Text style={styles.basePrice}>
                    {formatCurrency(baseAmount)}/{period}
                </Text>
            </View>

            {!!discountText && (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                        {discountText}
                    </Text>
                </View>
            )}

            <View style={styles.taxDivider} />

            <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>18% GST</Text>

                <Text style={styles.taxValue}>
                    + {formatCurrency(gstAmount)}
                </Text>
            </View>

            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>

                <Text style={styles.totalValue}>
                    {formatCurrency(totalAmount)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

// Shared "shrink to a sane reading width on web, stay full
// width on native" rule used by the header/footer/scroll
// content wrappers below.
const webConstrained = isWeb
    ? {
        width: '100%' as const,
        maxWidth: WEB_CONTENT_MAX_WIDTH,
        alignSelf: 'center' as const,
    }
    : {};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    header: {
        paddingTop: 6,
        paddingBottom: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        // full-bleed band; the inner content is what gets
        // constrained on web
        width: '100%',
    },

    headerInner: {
        paddingHorizontal: 14,
        ...webConstrained,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    backButton: {
        width: 32,
        height: 32,
        marginRight: 6,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerContent: {
        flex: 1,
    },

    title: {
        fontSize: 21,
        fontWeight: '900',
        color: '#0F172A',
    },

    subtitle: {
        marginTop: 1,
        fontSize: 11.5,
        lineHeight: 16,
        fontWeight: '600',
        color: '#64748B',
    },

    notice: {
        marginTop: 7,
        paddingHorizontal: 9,
        paddingVertical: 7,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
        backgroundColor: '#FFFBEB',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    noticeText: {
        flex: 1,
        marginLeft: 6,
        fontSize: 10.5,
        lineHeight: 15,
        fontWeight: '600',
        color: '#92400E',
    },

    scrollOuter: {
        flexGrow: 1,
        paddingTop: 8,
        paddingBottom: 105,
    },

    scrollContent: {
        paddingHorizontal: 14,
        ...webConstrained,
    },

    serverCard: {
        marginBottom: 8,
        padding: 11,
        borderRadius: 14,
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
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
    },

    serverTag: {
        marginTop: 1,
        fontSize: 9.5,
        fontWeight: '800',
        color: '#149BD7',
    },

    description: {
        marginTop: 4,
        fontSize: 10.5,
        lineHeight: 14,
        fontWeight: '500',
        color: '#64748B',
    },

    planRow: {
        marginTop: 7,
        flexDirection: 'row',
        gap: 7,
    },

    planCard: {
        flex: 1,
        paddingHorizontal: 11,
        paddingTop: 10,
        paddingBottom: 9,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },

    selectedPlanCard: {
        borderColor: '#149BD7',
        backgroundColor: '#F0F9FF',
    },

    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    planTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
    },

    priceLine: {
        marginTop: 5,
        minHeight: 22,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
    },

    originalPrice: {
        fontSize: 8.5,
        fontWeight: '700',
        color: '#94A3B8',
        textDecorationLine: 'line-through',
    },

    basePrice: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
    },

    discountBadge: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 99,
        backgroundColor: '#fafdfb',
    },

    discountText: {
        fontSize: 7.5,
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
        paddingTop: 6,
        paddingBottom: 6,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        width: '100%',
    },

    footerInner: {
        paddingHorizontal: 14,
        ...webConstrained,
    },

    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    selectionSummary: {
        flex: 1,
        minHeight: 48,
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
    },

    selectedServer: {
        fontSize: 10.5,
        lineHeight: 13,
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
        flex: 1,
        marginRight: 6,
        fontSize: 8,
        lineHeight: 10,
        fontWeight: '900',
        color: '#15803D',
    },

    selectedPriceBox: {
        alignItems: 'flex-end',
    },

    selectedTotal: {
        fontSize: 13,
        lineHeight: 15,
        fontWeight: '900',
        color: '#0F172A',
    },
    gstIncluded: {
        marginTop: 2,
        fontSize: 7,
        lineHeight: 9,
        fontWeight: '600',
        color: '#64748B',
        textAlign: 'right',
    },

    continueButton: {
        width: 126,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#149BD7',
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

    priceSummary: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    taxText: {
        fontSize: 8.5,
        fontWeight: '600',
        color: '#64748B',
    },

    totalText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#0F172A',
    },
});
