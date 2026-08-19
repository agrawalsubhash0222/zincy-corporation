import { Ionicons } from '@expo/vector-icons';
import {
    router,
    useFocusEffect,
    useLocalSearchParams,
} from 'expo-router';
import {
    ReactNode,
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

import {
    getClientBusinessSetupByOnboardingId,
    type ClientBusinessSetupResponse,
} from '@/services/clientBusinessSetupService';

import {
    getOnboardingRequestProgress,
    type CustomerOnboardingRequest,
} from '@/services/onboardingRequestService';

import {
    getMaintenanceSetupSummary,
    getServerSetupSummary,
    type MaintenanceSetupSummary,
    type ServerSetupSummary,
} from '@/services/setupSummaryApi';

type SectionKey =
    | 'request'
    | 'owner'
    | 'business'
    | 'address'
    | 'tax'
    | 'server'
    | 'maintenance';

function readParam(
    value: string | string[] | undefined
): string {
    return Array.isArray(value)
        ? value[0] ?? ''
        : value ?? '';
}

function display(value: unknown): string {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ''
    ) {
        return 'Not provided';
    }

    return String(value).trim();
}

function displayPhone(value: unknown): string {
    const raw = display(value);

    if (raw === 'Not provided') {
        return raw;
    }

    const digits = raw.replace(/\D/g, '');

    if (!digits) {
        return raw;
    }

    return digits.length > 10
        ? digits.slice(-10)
        : digits;
}

function displayBoolean(
    value: boolean | string | undefined
): string {
    if (
        value === true ||
        String(value).toLowerCase() === 'true'
    ) {
        return 'Yes';
    }

    if (
        value === false ||
        String(value).toLowerCase() === 'false'
    ) {
        return 'No';
    }

    return 'Not provided';
}

function formatEnum(value?: string | null): string {
    if (!value) {
        return 'Not provided';
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

function formatAmount(
    value?: number | null
): string {
    if (
        value === undefined ||
        value === null ||
        !Number.isFinite(Number(value))
    ) {
        return 'Not provided';
    }

    return `₹${Number(value).toLocaleString(
        'en-IN',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    )}`;
}

function formatContacts(
    value?: string | string[]
): string {
    if (Array.isArray(value)) {
        return value.length
            ? value
                .filter(Boolean)
                .map(displayPhone)
                .join(', ')
            : 'Not provided';
    }

    if (!value?.trim()) {
        return 'Not provided';
    }

    try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
            return parsed
                .filter(Boolean)
                .map(displayPhone)
                .join(', ');
        }
    } catch {
        // Supports ordinary comma-separated strings.
    }

    return value
        .split(',')
        .map((item) => displayPhone(item))
        .filter(Boolean)
        .join(', ');
}

function formatServices(value?: string): string {
    if (!value?.trim()) {
        return 'Not provided';
    }

    try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
            return parsed
                .filter(Boolean)
                .join(', ');
        }
    } catch {
        // Backend normally returns a display string.
    }

    return value;
}

export default function SubmittedProjectDetailsScreen() {
    const params = useLocalSearchParams<{
        onboardingRequestId?: string | string[];
    }>();

    const onboardingRequestId = useMemo(() => {
        const value = Number(
            readParam(params.onboardingRequestId)
        );

        return Number.isInteger(value) &&
            value > 0
            ? value
            : null;
    }, [params.onboardingRequestId]);

    const [
        request,
        setRequest,
    ] =
        useState<CustomerOnboardingRequest | null>(
            null
        );

    const [
        clientSetup,
        setClientSetup,
    ] =
        useState<ClientBusinessSetupResponse | null>(
            null
        );

    const [
        serverSetup,
        setServerSetup,
    ] =
        useState<ServerSetupSummary | null>(null);

    const [
        maintenanceSetup,
        setMaintenanceSetup,
    ] =
        useState<MaintenanceSetupSummary | null>(
            null
        );

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] =
        useState('');

    const [expandedSection, setExpandedSection] =
    useState<SectionKey | null>(null);

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

            /*
             * Request + client setup are essential.
             * Server/Maintenance are loaded independently below so a
             * temporarily unavailable summary does not hide all of the
             * customer's other submitted information.
             */
            const [
                requestResult,
                clientResult,
                serverResult,
                maintenanceResult,
            ] = await Promise.allSettled([
                getOnboardingRequestProgress(
                    onboardingRequestId
                ),
                getClientBusinessSetupByOnboardingId(
                    onboardingRequestId
                ),
                getServerSetupSummary(
                    onboardingRequestId
                ),
                getMaintenanceSetupSummary(
                    onboardingRequestId
                ),
            ]);

            if (
                requestResult.status === 'rejected'
            ) {
                throw requestResult.reason;
            }

            if (
                clientResult.status === 'rejected'
            ) {
                throw clientResult.reason;
            }

            setRequest(requestResult.value);
            setClientSetup(clientResult.value);

            setServerSetup(
                serverResult.status === 'fulfilled'
                    ? serverResult.value
                    : null
            );

            setMaintenanceSetup(
                maintenanceResult.status ===
                    'fulfilled'
                    ? maintenanceResult.value
                    : null
            );

            if (
                serverResult.status === 'rejected'
            ) {
                console.warn(
                    'Unable to load server setup summary:',
                    serverResult.reason
                );
            }

            if (
                maintenanceResult.status ===
                'rejected'
            ) {
                console.warn(
                    'Unable to load maintenance setup summary:',
                    maintenanceResult.reason
                );
            }
        } catch (error) {
            console.error(
                'Load submitted project details error:',
                error
            );

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to load your submitted project details.'
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

    const toggleSection = (
        section: SectionKey
    ) => {
        setExpandedSection((current) =>
            current === section
                ? null
                : section
        );
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace('/onboarding/check');
    };

    const handleHome = () => {
        router.replace('/(website)');
    };

    if (loading) {
        return (
            <SafeAreaView
                style={styles.container}
                edges={[
                    'top',
                    'left',
                    'right',
                ]}
            >
                <View style={styles.center}>
                    <ActivityIndicator
                        size="large"
                        color="#0EA5E9"
                    />

                    <Text
                        style={
                            styles.loadingTitle
                        }
                    >
                        Loading submitted details
                    </Text>

                    <Text
                        style={
                            styles.loadingMessage
                        }
                    >
                        Please wait while we
                        retrieve your project
                        information.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (
        errorMessage ||
        !request ||
        !clientSetup
    ) {
        return (
            <SafeAreaView
                style={styles.container}
                edges={[
                    'top',
                    'left',
                    'right',
                ]}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={
                            styles.iconButton
                        }
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color="#0F172A"
                        />
                    </TouchableOpacity>

                    <Text
                        style={
                            styles.headerTitle
                        }
                    >
                        Submitted Details
                    </Text>

                    <View
                        style={
                            styles.iconButton
                        }
                    />
                </View>

                <View style={styles.center}>
                    <View
                        style={
                            styles.errorIcon
                        }
                    >
                        <Ionicons
                            name="alert-circle-outline"
                            size={38}
                            color="#DC2626"
                        />
                    </View>

                    <Text
                        style={
                            styles.errorTitle
                        }
                    >
                        Unable to load details
                    </Text>

                    <Text
                        style={
                            styles.errorMessage
                        }
                    >
                        {errorMessage ||
                            'Submitted project details could not be found.'}
                    </Text>

                    <TouchableOpacity
                        onPress={() =>
                            void loadDetails()
                        }
                        activeOpacity={0.85}
                        style={
                            styles.retryButton
                        }
                    >
                        <Ionicons
                            name="refresh"
                            size={18}
                            color="#FFFFFF"
                        />

                        <Text
                            style={
                                styles.retryText
                            }
                        >
                            Try Again
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const fullAddress = [
        clientSetup.addressLine1,
        clientSetup.addressLine2,
    ]
        .filter(Boolean)
        .join(', ');

    const location = [
        clientSetup.city,
        clientSetup.state,
    ]
        .filter(Boolean)
        .join(', ');

    const maintenanceManaged =
        maintenanceSetup?.maintenanceType ===
        'ZINCY_MANAGED';

    return (
        <SafeAreaView
            style={styles.container}
            edges={[
                'top',
                'left',
                'right',
            ]}
        >
            <View style={styles.screen}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={handleBack}
                        activeOpacity={0.75}
                        style={
                            styles.iconButton
                        }
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color="#0F172A"
                        />
                    </TouchableOpacity>

                    <Text
                        style={
                            styles.headerTitle
                        }
                    >
                        Submitted Project Details
                    </Text>

                    <TouchableOpacity
                        onPress={handleHome}
                        activeOpacity={0.75}
                        style={[
                            styles.iconButton,
                            styles.homeButton,
                        ]}
                    >
                        <Ionicons
                            name="home-outline"
                            size={22}
                            color="#0284C7"
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={
                        false
                    }
                    contentContainerStyle={
                        styles.scrollContent
                    }
                >
                    <View
                        style={
                            styles.summaryCard
                        }
                    >
                        <View
                            style={
                                styles.summaryIcon
                            }
                        >
                            <Ionicons
                                name="document-text-outline"
                                size={24}
                                color="#0284C7"
                            />
                        </View>

                        <View
                            style={
                                styles.summaryContent
                            }
                        >
                            <Text
                                style={
                                    styles.summaryTitle
                                }
                            >
                                Review your submitted
                                information
                            </Text>

                            <Text
                                style={
                                    styles.summaryMessage
                                }
                            >
                                These details are
                                read-only and represent
                                the information currently
                                recorded for your project.
                            </Text>
                        </View>
                    </View>

                    <View
                        style={
                            styles.sectionsContainer
                        }
                    >
                        <AccordionSection
                            title="Original Request"
                            subtitle="Project and service requirements"
                            icon="reader-outline"
                            expanded={
                                expandedSection === 'request'
                            }
                            onPress={() =>
                                toggleSection(
                                    'request'
                                )
                            }
                        >
                            <InfoRow
                                label="Business name"
                                value={display(
                                    request.businessName
                                )}
                            />

                            <InfoRow
                                label="Owner name"
                                value={display(
                                    request.ownerName
                                )}
                            />

                            <InfoRow
                                label="Mobile"
                                value={displayPhone(
                                    request.mobile ||
                                    request.userMobile
                                )}
                            />

                            <InfoRow
                                label="Email"
                                value={display(
                                    request.email
                                )}
                            />

                            <InfoRow
                                label="Services"
                                value={formatServices(
                                    request.projectTypes
                                )}
                            />

                            <InfoRow
                                label="Budget"
                                value={display(
                                    request.budget
                                )}
                            />

                            <InfoRow
                                label="Timeline"
                                value={display(
                                    request.timeline
                                )}
                            />

                            <InfoRow
                                label="Requirement"
                                value={display(
                                    request.requirement
                                )}
                                last
                            />
                        </AccordionSection>

                        <AccordionSection
                            title="Business Owner"
                            subtitle="Owner and primary contact"
                            icon="person-outline"
                            expanded={
                                expandedSection === 'owner'
                            }
                            onPress={() =>
                                toggleSection(
                                    'owner'
                                )
                            }
                        >
                            <InfoRow
                                label="Owner name"
                                value={display(
                                    clientSetup.ownerName
                                )}
                            />

                            <InfoRow
                                label="Owner contact"
                                value={displayPhone(
                                    clientSetup.ownerContact
                                )}
                            />

                            <InfoRow
                                label="Owner email"
                                value={display(
                                    clientSetup.ownerEmail
                                )}
                            />

                            <InfoRow
                                label="Secondary contact"
                                value={displayPhone(
                                    clientSetup.secondaryContact
                                )}
                                last
                            />
                        </AccordionSection>

                        <AccordionSection
                            title="Business Profile"
                            subtitle="Business and communication details"
                            icon="business-outline"
                            expanded={
                                expandedSection === 'business'
                            }
                            onPress={() =>
                                toggleSection(
                                    'business'
                                )
                            }
                        >
                            <InfoRow
                                label="Business name"
                                value={display(
                                    clientSetup.businessName
                                )}
                            />

                            <InfoRow
                                label="Business type"
                                value={display(
                                    clientSetup.businessType
                                )}
                            />

                            <InfoRow
                                label="Contacts"
                                value={formatContacts(
                                    clientSetup.contacts
                                )}
                            />

                            <InfoRow
                                label="Business email"
                                value={display(
                                    clientSetup.businessEmail ||
                                    clientSetup.email
                                )}
                            />

                            <InfoRow
                                label="WhatsApp"
                                value={displayPhone(
                                    clientSetup.whatsappContact
                                )}
                                last
                            />
                        </AccordionSection>

                        <AccordionSection
                            title="Business Address"
                            subtitle="Registered operating address"
                            icon="location-outline"
                            expanded={
                                expandedSection === 'address'
                            }
                            onPress={() =>
                                toggleSection(
                                    'address'
                                )
                            }
                        >
                            <InfoRow
                                label="Address"
                                value={display(
                                    fullAddress
                                )}
                            />

                            <InfoRow
                                label="City / State"
                                value={display(
                                    location
                                )}
                            />

                            <InfoRow
                                label="Pincode"
                                value={display(
                                    clientSetup.pincode
                                )}
                                last
                            />
                        </AccordionSection>

                        <AccordionSection
                            title="Tax & Legal"
                            subtitle="Registration and compliance"
                            icon="document-text-outline"
                            expanded={
                                expandedSection === 'tax'
                            }
                            onPress={() =>
                                toggleSection(
                                    'tax'
                                )
                            }
                        >
                            <InfoRow
                                label="GST registered"
                                value={displayBoolean(
                                    clientSetup.gstRegistered
                                )}
                            />

                            <InfoRow
                                label="GST number"
                                value={display(
                                    clientSetup.gstNumber
                                )}
                            />

                            <InfoRow
                                label="PAN number"
                                value={display(
                                    clientSetup.panNumber
                                )}
                            />

                            <InfoRow
                                label="MSME / Udyam"
                                value={display(
                                    clientSetup.msmeNumber ||
                                    clientSetup.udyamNumber
                                )}
                            />

                            <InfoRow
                                label="FSSAI number"
                                value={display(
                                    clientSetup.fssaiNumber ||
                                    clientSetup.fssaiLicenseNumber
                                )}
                                last
                            />
                        </AccordionSection>

                        <AccordionSection
                            title="Server Configuration"
                            subtitle="Hosting and server selection"
                            icon="server-outline"
                            expanded={
                                expandedSection === 'server'
                            }
                            onPress={() =>
                                toggleSection(
                                    'server'
                                )
                            }
                        >
                            {serverSetup ? (
                                serverSetup.skipped ? (
                                    <>
                                        <InfoRow
                                            label="Status"
                                            value="Skipped for now"
                                        />

                                        <InfoRow
                                            label="Server charge"
                                            value={formatAmount(
                                                0
                                            )}
                                            last
                                        />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow
                                            label="Server name"
                                            value={display(
                                                serverSetup.serverName
                                            )}
                                        />

                                        <InfoRow
                                            label="Billing cycle"
                                            value={formatEnum(
                                                serverSetup.billingType
                                            )}
                                        />

                                        <InfoRow
                                            label="Base amount"
                                            value={formatAmount(
                                                serverSetup.baseAmount
                                            )}
                                        />

                                        <InfoRow
                                            label="GST"
                                            value={formatAmount(
                                                serverSetup.gstAmount
                                            )}
                                        />

                                        <InfoRow
                                            label="Total"
                                            value={formatAmount(
                                                serverSetup.totalAmount
                                            )}
                                            last
                                        />
                                    </>
                                )
                            ) : (
                                <UnavailableMessage
                                    message="Server configuration is not available."
                                />
                            )}
                        </AccordionSection>

                        <AccordionSection
                            title="Maintenance Setup"
                            subtitle="Support and maintenance preference"
                            icon="construct-outline"
                            expanded={
                                expandedSection === 'maintenance'
                            }
                            onPress={() =>
                                toggleSection(
                                    'maintenance'
                                )
                            }
                            last
                        >
                            {maintenanceSetup ? (
                                <>
                                    <InfoRow
                                        label="Maintenance type"
                                        value={formatEnum(
                                            maintenanceSetup.maintenanceType
                                        )}
                                    />

                                    <InfoRow
                                        label="Billing cycle"
                                        value={formatEnum(
                                            maintenanceSetup.billingType
                                        )}
                                    />

                                    {maintenanceManaged && (
                                        <>
                                            <InfoRow
                                                label="Base amount"
                                                value={formatAmount(
                                                    maintenanceSetup.baseAmount
                                                )}
                                            />

                                            <InfoRow
                                                label="GST"
                                                value={formatAmount(
                                                    maintenanceSetup.gstAmount
                                                )}
                                            />

                                            <InfoRow
                                                label="Total"
                                                value={formatAmount(
                                                    maintenanceSetup.totalAmount
                                                )}
                                                last
                                            />
                                        </>
                                    )}

                                    {!maintenanceManaged && (
                                        <InfoRow
                                            label="Maintenance charge"
                                            value={formatAmount(
                                                maintenanceSetup.totalAmount
                                            )}
                                            last
                                        />
                                    )}
                                </>
                            ) : (
                                <UnavailableMessage
                                    message="Maintenance details are not available."
                                />
                            )}
                        </AccordionSection>
                    </View>

                    <View
                        style={
                            styles.readOnlyNotice
                        }
                    >
                        <Ionicons
                            name="lock-closed-outline"
                            size={18}
                            color="#64748B"
                        />

                        <Text
                            style={
                                styles.readOnlyText
                            }
                        >
                            These details are
                            currently view-only. If
                            any information needs to
                            be changed, please contact
                            the Zincy team.
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

type AccordionSectionProps = {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    expanded: boolean;
    onPress: () => void;
    children: ReactNode;
    last?: boolean;
};

function AccordionSection({
    title,
    subtitle,
    icon,
    expanded,
    onPress,
    children,
    last = false,
}: AccordionSectionProps) {
    return (
        <View
            style={[
                styles.accordionSection,
                last &&
                styles.accordionSectionLast,
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.75}
                style={styles.accordionHeader}
                accessibilityRole="button"
                accessibilityState={{
                    expanded,
                }}
            >
                <View
                    style={
                        styles.sectionIcon
                    }
                >
                    <Ionicons
                        name={icon}
                        size={20}
                        color="#0284C7"
                    />
                </View>

                <View
                    style={
                        styles.sectionTitleContainer
                    }
                >
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        {title}
                    </Text>

                    <Text
                        style={
                            styles.sectionSubtitle
                        }
                    >
                        {subtitle}
                    </Text>
                </View>

                <Ionicons
                    name={
                        expanded
                            ? 'chevron-up'
                            : 'chevron-down'
                    }
                    size={19}
                    color="#64748B"
                />
            </TouchableOpacity>

            {expanded && (
                <View
                    style={
                        styles.accordionContent
                    }
                >
                    {children}
                </View>
            )}
        </View>
    );
}

function InfoRow({
    label,
    value,
    last = false,
}: {
    label: string;
    value: string;
    last?: boolean;
}) {
    const empty =
        value === 'Not provided';

    return (
        <View
            style={[
                styles.infoRow,
                last &&
                styles.infoRowLast,
            ]}
        >
            <Text style={styles.infoLabel}>
                {label}
            </Text>

            <Text
                selectable
                style={[
                    styles.infoValue,
                    empty &&
                    styles.infoValueEmpty,
                ]}
            >
                {value}
            </Text>
        </View>
    );
}

function UnavailableMessage({
    message,
}: {
    message: string;
}) {
    return (
        <View
            style={
                styles.unavailableBox
            }
        >
            <Ionicons
                name="information-circle-outline"
                size={18}
                color="#64748B"
            />

            <Text
                style={
                    styles.unavailableText
                }
            >
                {message}
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

    header: {
        height: 58,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },

    iconButton: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
    },

    homeButton: {
        alignItems: 'flex-end',
    },

    headerTitle: {
        flex: 1,
        color: '#0F172A',
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
    },

    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 36,
    },

    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        borderRadius: 16,
        backgroundColor: '#F0F9FF',
    },

    summaryIcon: {
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 13,
        backgroundColor: '#E0F2FE',
    },

    summaryContent: {
        flex: 1,
        marginLeft: 12,
    },

    summaryTitle: {
        color: '#0F172A',
        fontSize: 15,
        fontWeight: '900',
    },

    summaryMessage: {
        marginTop: 3,
        color: '#475569',
        fontSize: 12,
        lineHeight: 18,
    },

    sectionsContainer: {
        marginTop: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
    },

    accordionSection: {
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },

    accordionSectionLast: {
        borderBottomWidth: 0,
    },

    accordionHeader: {
        minHeight: 68,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 13,
        paddingVertical: 10,
    },

    sectionIcon: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 11,
        backgroundColor: '#F0F9FF',
    },

    sectionTitleContainer: {
        flex: 1,
        marginHorizontal: 11,
    },

    sectionTitle: {
        color: '#0F172A',
        fontSize: 14,
        fontWeight: '900',
    },

    sectionSubtitle: {
        marginTop: 2,
        color: '#94A3B8',
        fontSize: 11,
        lineHeight: 16,
    },

    accordionContent: {
        paddingHorizontal: 13,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FCFDFE',
    },

    infoRow: {
        minHeight: 50,
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth:
            StyleSheet.hairlineWidth,
        borderBottomColor: '#E2E8F0',
    },

    infoRowLast: {
        borderBottomWidth: 0,
    },

    infoLabel: {
        width: '42%',
        paddingRight: 10,
        color: '#64748B',
        fontSize: 11,
        lineHeight: 17,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    infoValue: {
        flex: 1,
        color: '#0F172A',
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '700',
        textAlign: 'right',
    },

    infoValueEmpty: {
        color: '#94A3B8',
        fontStyle: 'italic',
        fontWeight: '600',
    },

    unavailableBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },

    unavailableText: {
        flex: 1,
        marginLeft: 8,
        color: '#64748B',
        fontSize: 12,
        lineHeight: 18,
    },

    readOnlyNotice: {
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
    },

    readOnlyText: {
        flex: 1,
        marginLeft: 9,
        color: '#64748B',
        fontSize: 12,
        lineHeight: 19,
    },

    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },

    loadingTitle: {
        marginTop: 15,
        color: '#0F172A',
        fontSize: 17,
        fontWeight: '900',
    },

    loadingMessage: {
        marginTop: 6,
        color: '#64748B',
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },

    errorIcon: {
        width: 66,
        height: 66,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 33,
        backgroundColor: '#FEF2F2',
    },

    errorTitle: {
        marginTop: 15,
        color: '#0F172A',
        fontSize: 19,
        fontWeight: '900',
    },

    errorMessage: {
        marginTop: 7,
        color: '#64748B',
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },

    retryButton: {
        height: 46,
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 11,
        backgroundColor: '#0EA5E9',
    },

    retryText: {
        marginLeft: 7,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
});