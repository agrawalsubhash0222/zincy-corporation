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
    type GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    getMaintenanceSetup,
    saveMaintenanceSetup,
    type MaintenanceBillingType,
    type MaintenanceSetupType,
} from '@/services/maintenanceSetupApi';

const MONTHLY_AMOUNT = 499;
const GST_RATE = 0.18;
const YEARLY_AMOUNT = Math.round(
    MONTHLY_AMOUNT * 12 * 0.9
);

type PriceDetails = {
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
};

// Rounded to 2 decimal places so GST reflects the exact 18%
// instead of being rounded off to the nearest rupee.
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

// Shows decimals only when the amount actually has a
// fractional part (e.g. ₹0 / ₹499 stay whole numbers,
// while ₹89.82 keeps its paise).
const formatCurrency = (amount: number) => {
    const rounded = Math.round(amount * 100) / 100;
    const hasDecimal = rounded % 1 !== 0;

    return `₹${rounded.toLocaleString('en-IN', {
        minimumFractionDigits: hasDecimal ? 2 : 0,
        maximumFractionDigits: 2,
    })}`;
};

// Alert.alert is a no-op on react-native-web, so plain
// validation alerts never appeared on web. This falls back
// to window.alert there while keeping native behavior as-is.
function notify(title: string, message: string) {
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
            window.alert(`${title}\n\n${message}`);
        }
        return;
    }

    Alert.alert(title, message);
}

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
    skipped?: string | string[];
    serverName?: string | string[];
    billingType?: string | string[];
    amount?: string | string[];
    serverTaxAmount?: string | string[];
    serverTotalAmount?: string | string[];

    maintenanceType?: string | string[];
    maintenanceTitle?: string | string[];
    maintenanceBilling?: string | string[];
    maintenanceAmount?: string | string[];
};

type SelectedMaintenance =
    | MaintenanceSetupType
    | '';

type SelectedBilling =
    | Exclude<MaintenanceBillingType, 'NA'>
    | '';

function readParam(
    value: string | string[] | undefined
): string {
    return Array.isArray(value)
        ? value[0] ?? ''
        : value ?? '';
}

function isMaintenanceType(
    value: string
): value is MaintenanceSetupType {
    return (
        value === 'ZINCY_MANAGED'
        || value === 'CLIENT_MANAGED'
        || value === 'DECIDE_LATER'
    );
}

function isSelectedBilling(
    value: string
): value is Exclude<
    MaintenanceBillingType,
    'NA'
> {
    return (
        value === 'MONTHLY'
        || value === 'YEARLY'
    );
}

export default function MaintenanceScreen() {
    const params =
        useLocalSearchParams<RouteParams>();

    const onboardingRequestIdText =
        readParam(params.onboardingRequestId);

    const onboardingRequestId = Number(
        onboardingRequestIdText
    );

    const skipped =
        readParam(params.skipped);

    const serverName =
        readParam(params.serverName);

    const serverBillingType =
        readParam(params.billingType);

    const serverAmount =
        readParam(params.amount);

    const serverTaxAmount =
        readParam(params.serverTaxAmount);

    const serverTotalAmount =
        readParam(params.serverTotalAmount);

    const routeMaintenanceType =
        readParam(params.maintenanceType);

    const routeMaintenanceBilling =
        readParam(params.maintenanceBilling);

    const initialMaintenance =
        isMaintenanceType(routeMaintenanceType)
            ? routeMaintenanceType
            : '';

    const initialBilling =
        isSelectedBilling(routeMaintenanceBilling)
            ? routeMaintenanceBilling
            : '';

    const [selected, setSelected] =
        useState<SelectedMaintenance>(
            initialMaintenance
        );

    const [billing, setBilling] =
        useState<SelectedBilling>(
            initialBilling
        );

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const selectedAmount = useMemo(() => {
        if (selected !== 'ZINCY_MANAGED') {
            return 0;
        }

        if (billing === 'MONTHLY') {
            return MONTHLY_AMOUNT;
        }

        if (billing === 'YEARLY') {
            return YEARLY_AMOUNT;
        }

        return 0;
    }, [selected, billing]);

    const selectedPrice = useMemo(
        () => calculatePrice(selectedAmount),
        [selectedAmount]
    );

    const selectedTitle = useMemo(() => {
        switch (selected) {
            case 'ZINCY_MANAGED':
                return 'Zincy Managed';
            case 'CLIENT_MANAGED':
                return 'Client Managed';
            case 'DECIDE_LATER':
                return 'Decide Later';
            default:
                return '';
        }
    }, [selected]);

    const selectedPlanText = useMemo(() => {
        if (selected !== 'ZINCY_MANAGED') {
            return 'No Charge';
        }

        if (billing === 'MONTHLY') {
            return 'Monthly';
        }

        if (billing === 'YEARLY') {
            return 'Yearly · 10% Off';
        }

        return 'Select billing';
    }, [selected, billing]);

    useEffect(() => {
        let active = true;

        async function loadSelection() {
            /*
             * Route values are the newest values when
             * returning from checkout.
             */
            if (initialMaintenance) {
                setSelected(initialMaintenance);
                setBilling(initialBilling);
                setLoading(false);
                return;
            }

            if (
                !Number.isInteger(onboardingRequestId)
                || onboardingRequestId <= 0
            ) {
                setLoading(false);
                return;
            }

            try {
                const saved =
                    await getMaintenanceSetup(
                        onboardingRequestId
                    );

                if (!active || !saved) {
                    return;
                }

                setSelected(
                    saved.maintenanceType
                );

                setBilling(
                    saved.billingType === 'NA'
                        ? ''
                        : saved.billingType
                );
            } catch (error) {
                console.log(
                    'No saved maintenance setup:',
                    error
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadSelection();

        return () => {
            active = false;
        };
    }, [
        onboardingRequestId,
        initialMaintenance,
        initialBilling,
    ]);

    const goBackToServerSummary =
        useCallback(() => {
            router.replace({
                pathname:
                    '/client-setup/server/server-success',
                params: {
                    onboardingRequestId:
                        onboardingRequestIdText,
                    skipped,
                    serverName,
                    billingType:
                        serverBillingType,
                    amount: serverAmount,
                    serverTaxAmount,
                    serverTotalAmount,
                },
            });
        }, [
            onboardingRequestIdText,
            skipped,
            serverName,
            serverBillingType,
            serverAmount,
            serverTaxAmount,
            serverTotalAmount,
        ]);

    useFocusEffect(
        useCallback(() => {
            const subscription =
                BackHandler.addEventListener(
                    'hardwareBackPress',
                    () => {
                        goBackToServerSummary();
                        return true;
                    }
                );

            return () => {
                subscription.remove();
            };
        }, [goBackToServerSummary])
    );

    const selectMaintenance = (
        value: MaintenanceSetupType
    ) => {
        if (selected === value) {
            setSelected('');
            setBilling('');
            return;
        }

        setSelected(value);

        if (value !== 'ZINCY_MANAGED') {
            setBilling('');
        }
    };

    const selectBilling = (
        value: Exclude<
            MaintenanceBillingType,
            'NA'
        >
    ) => {
        if (
            selected === 'ZINCY_MANAGED'
            && billing === value
        ) {
            setSelected('');
            setBilling('');
            return;
        }

        setSelected('ZINCY_MANAGED');
        setBilling(value);
    };

    const handleBillingPress = (
        event: GestureResponderEvent,
        value: Exclude<MaintenanceBillingType, 'NA'>
    ) => {
        event.stopPropagation();
        selectBilling(value);
    };

    const handleCheckout = async () => {
        if (!selected) {
            notify(
                'Select maintenance option',
                'Please choose one maintenance option to continue.'
            );
            return;
        }

        if (
            selected === 'ZINCY_MANAGED'
            && !billing
        ) {
            notify(
                'Select billing plan',
                'Please choose Monthly or Yearly billing.'
            );
            return;
        }

        if (
            !Number.isInteger(onboardingRequestId)
            || onboardingRequestId <= 0
        ) {
            notify(
                'Missing request',
                'Onboarding request ID is missing.'
            );
            return;
        }

        const maintenanceTitle =
            selected === 'ZINCY_MANAGED'
                ? 'Zincy Managed Maintenance'
                : selected === 'CLIENT_MANAGED'
                    ? 'Client Managed Maintenance'
                    : 'Decide Later';

        const maintenanceBilling: MaintenanceBillingType =
            selected === 'ZINCY_MANAGED'
                ? billing === 'MONTHLY'
                    ? 'MONTHLY'
                    : 'YEARLY'
                : 'NA';

        try {
            setSaving(true);

            const saved =
                await saveMaintenanceSetup({
                    onboardingRequestId,
                    maintenanceType: selected,
                    billingType: maintenanceBilling,
                    baseAmount: selectedAmount,
                });

            router.push({
                pathname:
                    '/client-setup/payment/checkout',
                params: {
                    onboardingRequestId:
                        String(
                            onboardingRequestId
                        ),
                    skipped,
                    serverName,
                    billingType:
                        serverBillingType,
                    amount: serverAmount,
                    serverTaxAmount,
                    serverTotalAmount,

                    maintenanceType:
                        saved.maintenanceType,
                    maintenanceTitle,
                    maintenanceBilling:
                        saved.billingType,
                    maintenanceAmount:
                        String(saved.baseAmount),
                    maintenanceTaxAmount:
                        String(saved.gstAmount),
                    maintenanceTotalAmount:
                        String(saved.totalAmount),
                },
            });
        } catch (error) {
            notify(
                'Unable to save',
                error instanceof Error
                    ? error.message
                    : 'Maintenance setup could not be saved.'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView
                style={styles.container}
                edges={['top', 'left', 'right', 'bottom']}
            >
                <View
                    style={styles.loader}
                >
                    <ActivityIndicator
                        size="large"
                        color="#0EA5E9"
                    />

                    <Text
                        style={styles.loaderText}
                    >
                        Loading maintenance setup...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={styles.container}
            edges={['top', 'left', 'right', 'bottom']}
        >
            <View style={styles.header}>
                <View style={styles.headerInner}>
                    <TouchableOpacity
                        style={styles.backButton}
                        activeOpacity={0.7}
                        onPress={
                            goBackToServerSummary
                        }
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color="#0F172A"
                        />
                    </TouchableOpacity>

                    <View style={styles.headerText}>
                        <Text style={styles.title}>
                            Maintenance
                        </Text>

                        <Text style={styles.subtitle}>
                            Choose project support after delivery.
                        </Text>
                    </View>
                </View>

                <View style={styles.noticeInner}>
                    <View style={styles.notice}>
                        <Ionicons
                            name="information-circle-outline"
                            size={18}
                            color="#B45309"
                        />

                        <Text style={styles.noticeText}>
                            Pricing includes 18% GST. Scope and SLA will be confirmed before the final agreement.
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={
                    styles.scrollOuter
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                <View style={styles.content}>
                    <TouchableOpacity
                        activeOpacity={0.88}
                        style={[
                            styles.card,
                            selected ===
                            'ZINCY_MANAGED'
                            && styles.activeCard,
                        ]}
                        onPress={() =>
                            selectMaintenance(
                                'ZINCY_MANAGED'
                            )
                        }
                    >
                        <OptionHeader
                            title="Zincy Managed Maintenance"
                            tag="Recommended"
                            selected={
                                selected ===
                                'ZINCY_MANAGED'
                            }
                        />

                        <Text
                            style={styles.description}
                        >
                            Updates, bug fixes, monitoring and deployment support.
                        </Text>

                        <View style={styles.planRow}>
                            <PlanCard
                                title="Monthly"
                                period="M"
                                {...calculatePrice(MONTHLY_AMOUNT)}
                                selected={
                                    selected ===
                                    'ZINCY_MANAGED'
                                    && billing ===
                                    'MONTHLY'
                                }
                                onPress={(event) =>
                                    handleBillingPress(
                                        event,
                                        'MONTHLY'
                                    )
                                }
                            />

                            <PlanCard
                                title="Yearly"
                                period="Y"
                                {...calculatePrice(YEARLY_AMOUNT)}
                                oldAmount={
                                    MONTHLY_AMOUNT * 12
                                }
                                discountText="10% Off"
                                selected={
                                    selected ===
                                    'ZINCY_MANAGED'
                                    && billing ===
                                    'YEARLY'
                                }
                                onPress={(event) =>
                                    handleBillingPress(
                                        event,
                                        'YEARLY'
                                    )
                                }
                            />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.88}
                        style={[
                            styles.card,
                            selected ===
                            'CLIENT_MANAGED'
                            && styles.activeCard,
                        ]}
                        onPress={() =>
                            selectMaintenance(
                                'CLIENT_MANAGED'
                            )
                        }
                    >
                        <OptionHeader
                            title="Client Managed Maintenance"
                            tag="Self Managed"
                            selected={
                                selected ===
                                'CLIENT_MANAGED'
                            }
                        />

                        <Text
                            style={styles.description}
                        >
                            Your internal team will maintain the project after handover.
                        </Text>

                        <FreeAmountBox
                            label="Maintenance Charge"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.88}
                        style={[
                            styles.card,
                            selected ===
                            'DECIDE_LATER'
                            && styles.activeCard,
                        ]}
                        onPress={() =>
                            selectMaintenance(
                                'DECIDE_LATER'
                            )
                        }
                    >
                        <OptionHeader
                            title="Decide Later"
                            tag="Optional"
                            selected={
                                selected ===
                                'DECIDE_LATER'
                            }
                        />

                        <Text
                            style={styles.description}
                        >
                            Decide your maintenance preference during the final discussion.
                        </Text>

                        <FreeAmountBox
                            label="Current Charge"
                        />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerInner}>
                    {selected ? (
                        <View style={styles.footerRow}>
                            <View
                                style={styles.selectionBox}
                            >
                                <Text
                                    style={
                                        styles.selectionTitle
                                    }
                                    numberOfLines={1}
                                >
                                    {selectedTitle}
                                </Text>

                                <View
                                    style={styles.selectionMeta}
                                >
                                    <Text
                                        style={[
                                            styles.selectionPlan,
                                            selected ===
                                            'ZINCY_MANAGED'
                                            && !billing
                                            && styles.billingRequired,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {selectedPlanText}
                                    </Text>

                                    <View style={styles.selectionPriceBox}>
                                        <Text style={styles.selectionAmount}>
                                            {formatCurrency(selectedPrice.totalAmount)}
                                        </Text>

                                        {selected === 'ZINCY_MANAGED' && billing ? (
                                            <Text style={styles.selectionGst}>
                                                Includes {formatCurrency(selectedPrice.gstAmount)} GST
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.checkoutButton,
                                    (
                                        saving
                                        || (
                                            selected ===
                                            'ZINCY_MANAGED'
                                            && !billing
                                        )
                                    )
                                    && styles.disabledButton,
                                ]}
                                disabled={
                                    saving
                                    || (
                                        selected ===
                                        'ZINCY_MANAGED'
                                        && !billing
                                    )
                                }
                                activeOpacity={0.85}
                                onPress={handleCheckout}
                            >
                                {saving ? (
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
                                            Checkout
                                        </Text>

                                        <Ionicons
                                            name="arrow-forward"
                                            size={18}
                                            color="#FFFFFF"
                                        />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.selectButton}
                            activeOpacity={0.85}
                            onPress={handleCheckout}
                        >
                            <Text style={styles.buttonText}>
                                Select Option
                            </Text>

                            <Ionicons
                                name="arrow-forward"
                                size={18}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

function OptionHeader({
    title,
    tag,
    selected,
}: {
    title: string;
    tag: string;
    selected: boolean;
}) {
    return (
        <View style={styles.optionHeader}>
            <View style={styles.optionTextBox}>
                <Text style={styles.optionTitle}>
                    {title}
                </Text>

                <Text style={styles.tag}>
                    {tag}
                </Text>
            </View>

            <Ionicons
                name={
                    selected
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                }
                size={22}
                color={
                    selected
                        ? '#0284C7'
                        : '#94A3B8'
                }
            />
        </View>
    );
}

function PlanCard({
    title,
    period,
    baseAmount,
    gstAmount,
    totalAmount,
    selected,
    onPress,
    oldAmount,
    discountText,
}: {
    title: string;
    period: 'M' | 'Y';
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    selected: boolean;
    onPress: (event: GestureResponderEvent) => void;
    oldAmount?: number;
    discountText?: string;
}) {
    return (
        <TouchableOpacity
            style={[
                styles.planCard,
                selected
                && styles.selectedPlanCard,
            ]}
            activeOpacity={0.85}
            onPress={onPress}
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
                    size={19}
                    color={
                        selected
                            ? '#0284C7'
                            : '#94A3B8'
                    }
                />
            </View>

            <View style={styles.priceLine}>
                {oldAmount !== undefined && (
                    <Text style={styles.oldAmount}>
                        {formatCurrency(oldAmount)}
                    </Text>
                )}

                <Text style={styles.planAmount}>
                    {formatCurrency(baseAmount)}/{period}
                </Text>
            </View>

            {!!discountText && (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>
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

function FreeAmountBox({
    label,
}: {
    label: string;
}) {
    return (
        <View style={styles.freeBox}>
            <Text style={styles.freeLabel}>
                {label}
            </Text>

            <Text style={styles.freeAmount}>
                ₹0
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    loader: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loaderText: {
        marginTop: 12,
        color: '#64748B',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
    },

    header: {
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        width: '100%',
    },

    headerInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 14,
        ...webConstrained,
    },

    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },

    headerText: {
        flex: 1,
    },

    title: {
        fontSize: 24,
        lineHeight: 29,
        fontWeight: '900',
        color: '#0F172A',
    },

    subtitle: {
        marginTop: 3,
        color: '#64748B',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
    },

    noticeInner: {
        paddingHorizontal: 20,
        paddingBottom: 14,
        ...webConstrained,
    },

    notice: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
        backgroundColor: '#FFFBEB',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    noticeText: {
        flex: 1,
        marginLeft: 7,
        color: '#92400E',
        fontSize: 11.5,
        lineHeight: 17,
        fontWeight: '700',
    },

    scrollOuter: {
        flexGrow: 1,
        paddingTop: 16,
        paddingBottom: 24,
    },

    content: {
        paddingHorizontal: 20,
        ...webConstrained,
    },

    card: {
        marginBottom: 14,
        padding: 15,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        elevation: 2,
    },

    activeCard: {
        borderColor: '#0EA5E9',
        backgroundColor: '#F0F9FF',
    },

    optionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    optionTextBox: {
        flex: 1,
        paddingRight: 10,
    },

    optionTitle: {
        color: '#0F172A',
        fontSize: 16,
        lineHeight: 20,
        fontWeight: '900',
    },

    tag: {
        marginTop: 3,
        color: '#0284C7',
        fontSize: 11,
        lineHeight: 14,
        fontWeight: '900',
    },

    description: {
        marginTop: 10,
        color: '#64748B',
        fontSize: 12.5,
        lineHeight: 18,
        fontWeight: '600',
    },

    planRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },

    planCard: {
        flex: 1,
        minHeight: 158,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },

    selectedPlanCard: {
        borderColor: '#0EA5E9',
        backgroundColor: '#ECFEFF',
    },

    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    planTitle: {
        color: '#64748B',
        fontSize: 11,
        lineHeight: 14,
        fontWeight: '900',
    },

    priceLine: {
        marginTop: 9,
        minHeight: 22,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
    },

    oldAmount: {
        color: '#94A3B8',
        fontSize: 9.5,
        lineHeight: 12,
        fontWeight: '800',
        textDecorationLine: 'line-through',
    },

    planAmount: {
        color: '#0F172A',
        fontSize: 15,
        lineHeight: 19,
        fontWeight: '900',
    },

    discountBadge: {
        marginTop: 5,
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 99,
        backgroundColor: '#DCFCE7',
    },

    discountBadgeText: {
        fontSize: 9.5,
        lineHeight: 12,
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
        color: '#64748B',
        fontSize: 9.5,
        lineHeight: 12,
        fontWeight: '600',
    },

    taxValue: {
        color: '#64748B',
        fontSize: 9.5,
        lineHeight: 12,
        fontWeight: '700',
    },

    totalRow: {
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    totalLabel: {
        color: '#334155',
        fontSize: 10,
        lineHeight: 13,
        fontWeight: '900',
    },

    totalValue: {
        color: '#0F172A',
        fontSize: 11.5,
        lineHeight: 14,
        fontWeight: '900',
    },

    freeBox: {
        minHeight: 54,
        marginTop: 14,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    freeLabel: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '800',
    },

    freeAmount: {
        color: '#0F172A',
        fontSize: 18,
        lineHeight: 22,
        fontWeight: '900',
    },

    footer: {
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        width: '100%',
    },

    footerInner: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 14,
        ...webConstrained,
    },

    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    // Changed from a fixed height to minHeight so the box
    // grows to fit its content (title + plan row + amount +
    // GST caption) instead of clipping/overlapping text when
    // the GST line is shown.
    selectionBox: {
        flex: 1,
        minHeight: 54,
        paddingHorizontal: 13,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
    },

    selectionTitle: {
        color: '#0F172A',
        fontSize: 12.5,
        lineHeight: 16,
        fontWeight: '900',
    },

    selectionMeta: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    selectionPlan: {
        flex: 1,
        marginRight: 6,
        color: '#16A34A',
        fontSize: 10.5,
        lineHeight: 13,
        fontWeight: '900',
    },

    billingRequired: {
        color: '#D97706',
    },

    selectionPriceBox: {
        alignItems: 'flex-end',
    },

    selectionAmount: {
        color: '#0F172A',
        fontSize: 14,
        lineHeight: 17,
        fontWeight: '900',
    },

    selectionGst: {
        marginTop: 1,
        color: '#64748B',
        fontSize: 7.5,
        lineHeight: 9,
        fontWeight: '600',
        textAlign: 'right',
    },

    // Fixed, modest widths instead of a wide '60%'/percentage
    // spread — keeps the CTA from ballooning on large screens.
    checkoutButton: {
        width: 120,
        height: 54,
        borderRadius: 16,
        backgroundColor: '#0EA5E9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    selectButton: {
        width: 200,
        maxWidth: '70%',
        height: 50,
        alignSelf: 'center',
        borderRadius: 16,
        backgroundColor: '#0EA5E9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    disabledButton: {
        backgroundColor: '#94A3B8',
    },

    buttonText: {
        marginRight: 8,
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 18,
        fontWeight: '900',
    },
});