import {
    AdminOnboardingDetails,
    getAdminOnboardingDetails,
} from '@/services/onboardingRequestService';

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
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SectionKey =
    | 'request'
    | 'client'
    | 'server'
    | 'maintenance';

type RouteParams = {
    onboardingRequestId?: string | string[];
};

function readParam(
    value: string | string[] | undefined
): string {
    return Array.isArray(value)
        ? value[0] ?? ''
        : value ?? '';
}

function display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return 'Not provided';
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    return String(value);
}

function formatAmount(value: number | undefined): string {
    const amount = Number(value ?? 0);

    return `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits:
            Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
    })}/-`;
}

function formatDate(value?: string): string {
    if (!value) {
        return 'Not available';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('en-IN');
}

function formatEnum(value?: string | null): string {
    if (!value) {
        return 'Not applicable';
    }

    return value
        .toLowerCase()
        .split('_')
        .map(
            (part) =>
                part.charAt(0).toUpperCase() +
                part.slice(1)
        )
        .join(' ');
}

export default function AdminOnboardingRequestDetailsScreen() {
    const params = useLocalSearchParams<RouteParams>();

    const onboardingRequestId = useMemo(() => {
        const id = Number(
            readParam(params.onboardingRequestId)
        );

        return Number.isInteger(id) && id > 0
            ? id
            : null;
    }, [params.onboardingRequestId]);

    const [details, setDetails] =
        useState<AdminOnboardingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] =
        useState('');

    const [expanded, setExpanded] = useState<
        Record<SectionKey, boolean>
    >({
        request: true,
        client: false,
        server: false,
        maintenance: false,
    });

    const loadDetails = useCallback(async () => {
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

            const data =
                await getAdminOnboardingDetails(
                    onboardingRequestId
                );

            setDetails(data);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to load request details.'
            );
        } finally {
            setLoading(false);
        }
    }, [onboardingRequestId]);

    useFocusEffect(
        useCallback(() => {
            void loadDetails();
        }, [loadDetails])
    );

    const toggleSection = (key: SectionKey) => {
        setExpanded((current) => ({
            ...current,
            [key]: !current[key],
        }));
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator
                        size="large"
                        color="#0EA5E9"
                    />
                    <Text style={styles.centerTitle}>
                        Loading request details
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (errorMessage || !details) {
        return (
            <SafeAreaView style={styles.container}>
                <Header title="Request Details" />

                <View style={styles.center}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={46}
                        color="#DC2626"
                    />
                    <Text style={styles.centerTitle}>
                        Unable to load details
                    </Text>
                    <Text style={styles.centerMessage}>
                        {errorMessage}
                    </Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => void loadDetails()}
                    >
                        <Text style={styles.retryText}>
                            Try Again
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const request = details.onboardingRequest;

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Request Details" />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.summaryCard}>
                    <View style={styles.summaryTop}>
                        <View style={styles.businessIcon}>
                            <Ionicons
                                name="business-outline"
                                size={22}
                                color="#0284C7"
                            />
                        </View>

                        <View style={styles.summaryText}>
                            <Text style={styles.businessName}>
                                {display(request.businessName)}
                            </Text>
                            <Text style={styles.ownerName}>
                                {display(request.ownerName)}
                            </Text>
                        </View>

                        <StatusPill
                            label={display(request.status)}
                            completed={
                                request.status === 'APPROVED'
                            }
                        />
                    </View>

                    <View style={styles.progressRow}>
                        <ProgressItem
                            label="Client"
                            completed={
                                details.clientSetupCompleted
                            }
                        />
                        <ProgressItem
                            label="Server"
                            completed={
                                details.serverSetupCompleted
                            }
                        />
                        <ProgressItem
                            label="Maintenance"
                            completed={
                                details.maintenanceSetupCompleted
                            }
                        />
                    </View>
                </View>

                <Accordion
                    title="Initial Request"
                    icon="document-text-outline"
                    expanded={expanded.request}
                    completed
                    onPress={() =>
                        toggleSection('request')
                    }
                >
                    <DetailRow
                        label="Request ID"
                        value={display(request.id)}
                    />
                    <DetailRow
                        label="Business Name"
                        value={display(
                            request.businessName
                        )}
                    />
                    <DetailRow
                        label="Owner Name"
                        value={display(request.ownerName)}
                    />
                    <DetailRow
                        label="Mobile No."
                        value={display(request.mobile)}
                    />
                    <DetailRow
                        label="User Mobile (Login)"
                        value={display(
                            request.userMobile
                        )}
                    />
                    <DetailRow
                        label="Owner Email"
                        value={display(request.email)}
                    />
                    <DetailRow
                        label="Services"
                        value={display(
                            request.projectTypes
                        )}
                    />
                    <DetailRow
                        label="Budget"
                        value={display(request.budget)}
                    />
                    <DetailRow
                        label="Timeline"
                        value={display(
                            request.timeline
                        )}
                    />
                    <DetailRow
                        label="Requirement"
                        value={display(
                            request.requirement
                        )}
                    />
                    <DetailRow
                        label="Submitted On"
                        value={formatDate(
                            request.createdAt
                        )}
                    />
                </Accordion>

                <Accordion
                    title="Client Business Setup"
                    icon="person-circle-outline"
                    expanded={expanded.client}
                    completed={
                        details.clientSetupCompleted
                    }
                    onPress={() =>
                        toggleSection('client')
                    }
                >
                    {details.clientSetup ? (
                        <>
                            <DetailRow
                                label="Business Name"
                                value={display(
                                    details.clientSetup
                                        .businessName
                                )}
                            />
                            <DetailRow
                                label="Business Type"
                                value={display(
                                    details.clientSetup
                                        .businessType
                                )}
                            />
                            <DetailRow
                                label="Owner Name"
                                value={display(
                                    details.clientSetup
                                        .ownerName
                                )}
                            />
                            <DetailRow
                                label="Owner Contact"
                                value={display(
                                    details.clientSetup
                                        .ownerContact
                                )}
                            />
                            <DetailRow
                                label="Owner Email"
                                value={display(
                                    details.clientSetup
                                        .ownerEmail
                                )}
                            />
                            <DetailRow
                                label="Owner Secondary Contact"
                                value={display(
                                    details.clientSetup
                                        .secondaryContact
                                )}
                            />
                            <DetailRow
                                label="Business Contacts"
                                value={display(
                                    details.clientSetup
                                        .contacts
                                )}
                            />
                            <DetailRow
                                label="Business Email"
                                value={display(
                                    details.clientSetup
                                        .businessEmail
                                )}
                            />
                            <DetailRow
                                label="WhatsApp No."
                                value={display(
                                    details.clientSetup
                                        .whatsappContact
                                )}
                            />
                            <DetailRow
                                label="Address"
                                value={[
                                    details.clientSetup
                                        .addressLine1,
                                    details.clientSetup
                                        .addressLine2,
                                    details.clientSetup.city,
                                    details.clientSetup.state,
                                    details.clientSetup.pincode,
                                ]
                                    .filter(Boolean)
                                    .join(', ') ||
                                    'Not provided'}
                            />
                            <DetailRow
                                label="GST Registered"
                                value={display(
                                    details.clientSetup
                                        .gstRegistered
                                )}
                            />
                            <DetailRow
                                label="GST Number"
                                value={display(
                                    details.clientSetup
                                        .gstNumber
                                )}
                            />
                            <DetailRow
                                label="PAN"
                                value={display(
                                    details.clientSetup
                                        .panNumber
                                )}
                            />
                            <DetailRow
                                label="Udyam"
                                value={display(
                                    details.clientSetup
                                        .udyamNumber
                                )}
                            />
                            <DetailRow
                                label="FSSAI"
                                value={display(
                                    details.clientSetup
                                        .fssaiLicenseNumber
                                )}
                            />
                        </>
                    ) : (
                        <PendingMessage />
                    )}
                </Accordion>

                <Accordion
                    title="Server Configuration"
                    icon="server-outline"
                    expanded={expanded.server}
                    completed={
                        details.serverSetupCompleted
                    }
                    onPress={() =>
                        toggleSection('server')
                    }
                >
                    {details.serverSetup ? (
                        details.serverSetup.skipped ? (
                            <>
                                <DetailRow
                                    label="Status"
                                    value="Skipped for now"
                                />
                                <DetailRow
                                    label="Server Charge"
                                    value={formatAmount(0)}
                                />
                            </>
                        ) : (
                            <>
                                <DetailRow
                                    label="Server Name"
                                    value={display(
                                        details.serverSetup
                                            .serverName
                                    )}
                                />
                                <DetailRow
                                    label="Billing Cycle"
                                    value={formatEnum(
                                        details.serverSetup
                                            .billingType
                                    )}
                                />
                                <DetailRow
                                    label="Base Amount"
                                    value={formatAmount(
                                        details.serverSetup
                                            .baseAmount
                                    )}
                                />
                                <DetailRow
                                    label="GST/TAX (18%)"
                                    value={formatAmount(
                                        details.serverSetup
                                            .gstAmount
                                    )}
                                />
                                <DetailRow
                                    label="Total"
                                    value={formatAmount(
                                        details.serverSetup
                                            .totalAmount
                                    )}
                                    strong
                                />
                            </>
                        )
                    ) : (
                        <PendingMessage />
                    )}
                </Accordion>

                <Accordion
                    title="Maintenance Setup"
                    icon="construct-outline"
                    expanded={expanded.maintenance}
                    completed={
                        details.maintenanceSetupCompleted
                    }
                    onPress={() =>
                        toggleSection('maintenance')
                    }
                >
                    {details.maintenanceSetup ? (
                        <>
                            <DetailRow
                                label="Plan Name"
                                value={formatEnum(
                                    details
                                        .maintenanceSetup
                                        .maintenanceType
                                )}
                            />
                            <DetailRow
                                label="Billing Cycle"
                                value={formatEnum(
                                    details
                                        .maintenanceSetup
                                        .billingType
                                )}
                            />
                            <DetailRow
                                label="Base Amount"
                                value={formatAmount(
                                    details
                                        .maintenanceSetup
                                        .baseAmount
                                )}
                            />
                            <DetailRow
                                label="GST/TAX (18%)"
                                value={formatAmount(
                                    details
                                        .maintenanceSetup
                                        .gstAmount
                                )}
                            />
                            <DetailRow
                                label="Total"
                                value={formatAmount(
                                    details
                                        .maintenanceSetup
                                        .totalAmount
                                )}
                                strong
                            />
                        </>
                    ) : (
                        <PendingMessage />
                    )}
                </Accordion>
            </ScrollView>
        </SafeAreaView>
    );
}

function Header({ title }: { title: string }) {
    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons
                    name="arrow-back"
                    size={24}
                    color="#0F172A"
                />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
                {title}
            </Text>
        </View>
    );
}

function Accordion({
    title,
    icon,
    expanded,
    completed,
    onPress,
    children,
}: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    expanded: boolean;
    completed: boolean;
    onPress: () => void;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.sectionCard}>
            <TouchableOpacity
                style={styles.sectionHeader}
                activeOpacity={0.8}
                onPress={onPress}
            >
                <View style={styles.sectionIcon}>
                    <Ionicons
                        name={icon}
                        size={20}
                        color="#0284C7"
                    />
                </View>

                <View style={styles.sectionTitleBox}>
                    <Text style={styles.sectionTitle}>
                        {title}
                    </Text>
                    <Text
                        style={[
                            styles.sectionStatus,
                            completed
                                ? styles.completedText
                                : styles.pendingText,
                        ]}
                    >
                        {completed
                            ? 'Completed'
                            : 'Pending'}
                    </Text>
                </View>

                <Ionicons
                    name={
                        expanded
                            ? 'chevron-up'
                            : 'chevron-down'
                    }
                    size={20}
                    color="#64748B"
                />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.sectionBody}>
                    {children}
                </View>
            )}
        </View>
    );
}

function DetailRow({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
                {label}
            </Text>

            <Text
                style={[
                    styles.detailValue,
                    strong && styles.strongValue,
                ]}
            >
                {value}
            </Text>
        </View>
    );
}

function PendingMessage() {
    return (
        <View style={styles.pendingBox}>
            <Ionicons
                name="time-outline"
                size={20}
                color="#B45309"
            />
            <Text style={styles.pendingMessage}>
                This stage has not been completed by the
                client yet.
            </Text>
        </View>
    );
}

function ProgressItem({
    label,
    completed,
}: {
    label: string;
    completed: boolean;
}) {
    return (
        <View style={styles.progressItem}>
            <Ionicons
                name={
                    completed
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                }
                size={18}
                color={
                    completed ? '#16A34A' : '#94A3B8'
                }
            />
            <Text style={styles.progressLabel}>
                {label}
            </Text>
        </View>
    );
}

function StatusPill({
    label,
    completed,
}: {
    label: string;
    completed: boolean;
}) {
    return (
        <View
            style={[
                styles.statusPill,
                completed
                    ? styles.statusApproved
                    : styles.statusNeutral,
            ]}
        >
            <Text
                style={[
                    styles.statusText,
                    completed
                        ? styles.statusApprovedText
                        : styles.statusNeutralText,
                ]}
            >
                {formatEnum(label)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        minHeight: 58,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
    },
    content: {
        padding: 16,
        paddingBottom: 34,
    },
    center: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
    },
    centerMessage: {
        marginTop: 7,
        fontSize: 13,
        lineHeight: 20,
        color: '#64748B',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 18,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#0EA5E9',
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: '900',
    },
    summaryCard: {
        padding: 16,
        marginBottom: 14,
        borderRadius: 18,
        backgroundColor: '#0F172A',
    },
    summaryTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    businessIcon: {
        width: 42,
        height: 42,
        marginRight: 11,
        borderRadius: 13,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryText: {
        flex: 1,
        paddingRight: 8,
    },
    businessName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    ownerName: {
        marginTop: 3,
        fontSize: 12,
        color: '#CBD5E1',
    },
    progressRow: {
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressLabel: {
        marginLeft: 5,
        fontSize: 11,
        fontWeight: '700',
        color: '#E2E8F0',
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusApproved: {
        backgroundColor: '#DCFCE7',
    },
    statusNeutral: {
        backgroundColor: '#FEF3C7',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
    },
    statusApprovedText: {
        color: '#15803D',
    },
    statusNeutralText: {
        color: '#92400E',
    },
    sectionCard: {
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    sectionHeader: {
        minHeight: 68,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionIcon: {
        width: 38,
        height: 38,
        marginRight: 11,
        borderRadius: 12,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitleBox: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
    },
    sectionStatus: {
        marginTop: 3,
        fontSize: 11,
        fontWeight: '800',
    },
    completedText: {
        color: '#15803D',
    },
    pendingText: {
        color: '#B45309',
    },
    sectionBody: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    detailRow: {
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    detailLabel: {
        flex: 0.42,
        paddingRight: 10,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '700',
        color: '#64748B',
    },
    detailValue: {
        flex: 0.58,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '800',
        textAlign: 'right',
        color: '#0F172A',
    },
    strongValue: {
        fontSize: 14,
        fontWeight: '900',
    },
    pendingBox: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        flexDirection: 'row',
        alignItems: 'center',
    },
    pendingMessage: {
        flex: 1,
        marginLeft: 8,
        color: '#92400E',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '700',
    },
});
