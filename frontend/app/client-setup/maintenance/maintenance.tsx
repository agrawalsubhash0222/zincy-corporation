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
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    getMaintenanceSetup,
    saveMaintenanceSetup,
    type MaintenanceBillingType,
    type MaintenanceSetupType,
} from '@/services/maintenanceSetupApi';

const MONTHLY_AMOUNT = 499;
const YEARLY_AMOUNT = Math.round(
    MONTHLY_AMOUNT * 12 * 0.9
);

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
        setSelected('ZINCY_MANAGED');
        setBilling(value);
    };

    const handleCheckout = async () => {
        if (!selected) {
            Alert.alert(
                'Select maintenance option',
                'Please choose one maintenance option to continue.'
            );
            return;
        }

        if (
            selected === 'ZINCY_MANAGED'
            && !billing
        ) {
            Alert.alert(
                'Select billing plan',
                'Please choose Monthly or Yearly billing.'
            );
            return;
        }

        if (
            !Number.isInteger(onboardingRequestId)
            || onboardingRequestId <= 0
        ) {
            Alert.alert(
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
            Alert.alert(
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
        >
            <View style={styles.header}>
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

            <View style={styles.notice}>
                <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#B45309"
                />

                <Text style={styles.noticeText}>
                    Scope and SLA will be confirmed before the final agreement.
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
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
                            amount={MONTHLY_AMOUNT}
                            subtitle="per month"
                            selected={
                                selected ===
                                'ZINCY_MANAGED'
                                && billing ===
                                'MONTHLY'
                            }
                            onPress={() =>
                                selectBilling(
                                    'MONTHLY'
                                )
                            }
                        />

                        <PlanCard
                            title="Yearly"
                            amount={YEARLY_AMOUNT}
                            oldAmount={
                                MONTHLY_AMOUNT * 12
                            }
                            subtitle="10% Off"
                            selected={
                                selected ===
                                'ZINCY_MANAGED'
                                && billing ===
                                'YEARLY'
                            }
                            onPress={() =>
                                selectBilling(
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
            </ScrollView>

            <View style={styles.footer}>
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
                                >
                                    {selectedPlanText}
                                </Text>

                                <Text
                                    style={styles.selectionAmount}
                                >
                                    ₹
                                    {selectedAmount.toLocaleString(
                                        'en-IN'
                                    )}
                                </Text>
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
    amount,
    subtitle,
    selected,
    onPress,
    oldAmount,
}: {
    title: string;
    amount: number;
    subtitle: string;
    selected: boolean;
    onPress: () => void;
    oldAmount?: number;
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

            {oldAmount !== undefined && (
                <Text style={styles.oldAmount}>
                    ₹
                    {oldAmount.toLocaleString(
                        'en-IN'
                    )}
                </Text>
            )}

            <Text style={styles.planAmount}>
                ₹
                {amount.toLocaleString(
                    'en-IN'
                )}
            </Text>

            <Text
                style={[
                    styles.planSubtitle,
                    oldAmount !== undefined
                    && styles.discountText,
                ]}
            >
                {subtitle}
            </Text>
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
        fontWeight: '700',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 44,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
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
        fontWeight: '900',
        color: '#0F172A',
    },

    subtitle: {
        marginTop: 3,
        color: '#64748B',
        fontSize: 13,
        fontWeight: '600',
    },

    notice: {
        marginHorizontal: 20,
        marginTop: 14,
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

    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 125,
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
        fontWeight: '900',
    },

    tag: {
        marginTop: 3,
        color: '#0284C7',
        fontSize: 11,
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
        minHeight: 116,
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
        fontWeight: '900',
    },

    oldAmount: {
        marginTop: 8,
        color: '#94A3B8',
        fontSize: 10.5,
        fontWeight: '800',
        textDecorationLine: 'line-through',
    },

    planAmount: {
        marginTop: 7,
        color: '#0F172A',
        fontSize: 18,
        fontWeight: '900',
    },

    planSubtitle: {
        marginTop: 4,
        color: '#94A3B8',
        fontSize: 10.5,
        fontWeight: '700',
    },

    discountText: {
        color: '#15803D',
    },

    freeBox: {
        height: 54,
        marginTop: 14,
        paddingHorizontal: 13,
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
        fontWeight: '800',
    },

    freeAmount: {
        color: '#0F172A',
        fontSize: 18,
        fontWeight: '900',
    },

    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 36,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },

    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    selectionBox: {
        flex: 1,
        height: 58,
        paddingHorizontal: 13,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
    },

    selectionTitle: {
        color: '#0F172A',
        fontSize: 12.5,
        fontWeight: '900',
    },

    selectionMeta: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    selectionPlan: {
        color: '#16A34A',
        fontSize: 10.5,
        fontWeight: '900',
    },

    billingRequired: {
        color: '#D97706',
    },

    selectionAmount: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '900',
    },

    checkoutButton: {
        width: 132,
        height: 58,
        borderRadius: 16,
        backgroundColor: '#0EA5E9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    selectButton: {
        width: '60%',
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
        fontWeight: '900',
    },
});
