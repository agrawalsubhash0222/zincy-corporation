import { API_BASE_URL } from '@/services/api';
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
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


type SectionKey =
    | 'owner'
    | 'business'
    | 'address'
    | 'tax';

type ClientSetupData = {
    id?: number;
    onboardingRequestId: number | null;

    businessName: string;

    ownerName: string;
    ownerContact: string;
    ownerEmail: string;
    secondaryContact: string;

    contacts: string[];
    email: string;
    whatsappContact: string;
    businessType: string;
    businessLogo: string;

    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;

    gstRegistered: boolean | null;
    gstNumber: string;
    panNumber: string;
    msmeNumber: string;
    fssaiNumber: string;
};

type ApiErrorResponse = {
    message?: string;
    error?: string;
};

const normalizeText = (value: unknown): string => {
    if (value === undefined || value === null) {
        return '';
    }

    return String(value).trim();
};

const normalizeContacts = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map(normalizeText)
            .filter(Boolean);
    }

    if (typeof value !== 'string' || !value.trim()) {
        return [];
    }

    try {
        const parsedValue: unknown = JSON.parse(value);

        if (Array.isArray(parsedValue)) {
            return parsedValue
                .map(normalizeText)
                .filter(Boolean);
        }
    } catch {
        // Supports comma-separated contacts from backend.
    }

    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

const normalizeBoolean = (
    value: unknown
): boolean | null => {
    if (value === true || value === 1) {
        return true;
    }

    if (value === false || value === 0) {
        return false;
    }

    const normalizedValue = normalizeText(value)
        .toLowerCase();

    if (
        normalizedValue === 'true' ||
        normalizedValue === 'yes' ||
        normalizedValue === '1'
    ) {
        return true;
    }

    if (
        normalizedValue === 'false' ||
        normalizedValue === 'no' ||
        normalizedValue === '0'
    ) {
        return false;
    }

    return null;
};

const normalizeClientSetup = (
    response: Record<string, unknown>
): ClientSetupData => {
    const rawId = response.id;
    const rawOnboardingRequestId =
        response.onboardingRequestId;

    return {
        id:
            rawId !== undefined && rawId !== null
                ? Number(rawId)
                : undefined,

        onboardingRequestId:
            rawOnboardingRequestId !== undefined &&
                rawOnboardingRequestId !== null
                ? Number(rawOnboardingRequestId)
                : null,

        businessName: normalizeText(
            response.businessName
        ),

        ownerName: normalizeText(response.ownerName),
        ownerContact: normalizeText(
            response.ownerContact
        ),
        ownerEmail: normalizeText(response.ownerEmail),
        secondaryContact: normalizeText(
            response.secondaryContact
        ),

        contacts: normalizeContacts(response.contacts),

        email: normalizeText(
            response.email ?? response.businessEmail
        ),

        whatsappContact: normalizeText(
            response.whatsappContact
        ),

        businessType: normalizeText(
            response.businessType
        ),

        businessLogo: normalizeText(
            response.businessLogo ??
            response.businessLogoUrl
        ),

        addressLine1: normalizeText(
            response.addressLine1
        ),
        addressLine2: normalizeText(
            response.addressLine2
        ),
        city: normalizeText(response.city),
        state: normalizeText(response.state),
        pincode: normalizeText(response.pincode),

        gstRegistered: normalizeBoolean(
            response.gstRegistered
        ),

        gstNumber: normalizeText(response.gstNumber),
        panNumber: normalizeText(response.panNumber),

        msmeNumber: normalizeText(
            response.msmeNumber ??
            response.udyamNumber
        ),

        fssaiNumber: normalizeText(
            response.fssaiNumber ??
            response.fssaiLicenseNumber
        ),
    };
};

const getDisplayValue = (value: unknown): string => {
    return normalizeText(value) || 'Not provided';
};

const getDisplayPhone = (value: unknown): string => {
    const originalValue = normalizeText(value);

    if (!originalValue) {
        return 'Not provided';
    }

    const digits = originalValue.replace(/\D/g, '');

    if (!digits) {
        return originalValue;
    }

    return digits.length > 10
        ? digits.slice(-10)
        : digits;
};

const getRouteParam = (
    value: string | string[] | undefined
): string => {
    return Array.isArray(value)
        ? value[0] ?? ''
        : value ?? '';
};

// Keeps the page content from stretching edge-to-edge on
// wide browser windows, matching the boxed/centered layout
// used elsewhere. Mobile/native is untouched.
const WEB_CONTENT_MAX_WIDTH = 520;
const isWeb = Platform.OS === 'web';
const webConstrained = isWeb
    ? {
        width: '100%' as const,
        maxWidth: WEB_CONTENT_MAX_WIDTH,
        alignSelf: 'center' as const,
    }
    : {};

export default function ClientSetupSuccessScreen() {
    const params = useLocalSearchParams<{
    onboardingRequestId?: string | string[];
    serverName?: string | string[];
    billingType?: string | string[];
    amount?: string | string[];
}>();

const savedServerName = getRouteParam(
    params.serverName
);

const savedBillingType = getRouteParam(
    params.billingType
);

const savedServerAmount = getRouteParam(
    params.amount
);

const onboardingRequestId = useMemo(() => {
    const rawValue = getRouteParam(
        params.onboardingRequestId
    );

    const parsedValue = Number(rawValue);

    return Number.isFinite(parsedValue) &&
        parsedValue > 0
        ? parsedValue
        : null;
}, [params.onboardingRequestId]);

const [data, setData] =
    useState<ClientSetupData | null>(null);

const [loading, setLoading] = useState(true);
const [errorMessage, setErrorMessage] =
    useState('');

const [expandedSection, setExpandedSection] =
    useState<SectionKey | null>(null);

const loadSavedDetails = useCallback(async () => {
    if (!onboardingRequestId) {
        setLoading(false);
        setErrorMessage(
            'Onboarding request ID was not provided.'
        );
        return;
    }

    try {
        setLoading(true);
        setErrorMessage('');

        const response = await fetch(
            `${API_BASE_URL}/client-business-setup/onboarding/${onboardingRequestId}`,
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            }
        );

        const rawResponse = await response.text();

        let responseBody: unknown = null;

        if (rawResponse) {
            try {
                responseBody =
                    JSON.parse(rawResponse);
            } catch {
                responseBody = rawResponse;
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
                backendMessage ||
                `Unable to load submitted details. Status: ${response.status}`
            );
        }

        if (
            typeof responseBody !== 'object' ||
            responseBody === null ||
            Array.isArray(responseBody)
        ) {
            throw new Error(
                'The server returned an invalid response.'
            );
        }

        setData(
            normalizeClientSetup(
                responseBody as Record<
                    string,
                    unknown
                >
            )
        );
    } catch (error) {
        console.error(
            'Load client setup details error:',
            error
        );

        setErrorMessage(
            error instanceof Error
                ? error.message
                : 'Unable to load submitted client details.'
        );
    } finally {
        setLoading(false);
    }
}, [onboardingRequestId]);

useFocusEffect(
    useCallback(() => {
        void loadSavedDetails();
    }, [loadSavedDetails])
);

const toggleSection = (section: SectionKey) => {
    setExpandedSection((currentSection) =>
        currentSection === section ? null : section
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

const handleContinue = () => {
    if (!onboardingRequestId) {
        Alert.alert(
            'Request unavailable',
            'The onboarding request ID is missing. Please reopen this page from your onboarding requests.'
        );
        return;
    }

    router.push({
        pathname: '/client-setup/server/server-setup',
        params: {
            onboardingRequestId: String(
                onboardingRequestId
            ),

            ...(savedServerName
                ? {
                    serverName: savedServerName,
                }
                : {}),

            ...(savedBillingType
                ? {
                    billingType: savedBillingType,
                }
                : {}),

            ...(savedServerAmount
                ? {
                    amount: savedServerAmount,
                }
                : {}),
        },
    });
};

if (loading) {
    return (
        <SafeAreaView
            style={styles.container}
            edges={['top', 'left', 'right']}
        >
            <View style={styles.pageInner}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator
                        size="large"
                        color="#0EA5E9"
                    />

                    <Text style={styles.loadingTitle}>
                        Loading submitted details
                    </Text>

                    <Text style={styles.loadingMessage}>
                        Please wait while we retrieve your
                        saved business information.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

if (errorMessage || !data) {
    return (
        <SafeAreaView
            style={styles.container}
            edges={['top', 'left', 'right']}
        >
            <View style={styles.pageInner}>
                <View style={styles.errorHeader}>
                    <TouchableOpacity
                        onPress={handleBack}
                        activeOpacity={0.7}
                        style={styles.iconButton}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color="#0F172A"
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.centerContainer}>
                    <View style={styles.errorIcon}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={38}
                            color="#DC2626"
                        />
                    </View>

                    <Text style={styles.errorTitle}>
                        Unable to load details
                    </Text>

                    <Text style={styles.errorMessage}>
                        {errorMessage ||
                            'Submitted details could not be found.'}
                    </Text>

                    <TouchableOpacity
                        onPress={() =>
                            void loadSavedDetails()
                        }
                        activeOpacity={0.85}
                        style={styles.retryButton}
                    >
                        <Ionicons
                            name="refresh"
                            size={18}
                            color="#FFFFFF"
                        />

                        <Text style={styles.retryText}>
                            Try Again
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const fullAddress = [
    data.addressLine1,
    data.addressLine2,
]
    .filter(Boolean)
    .join(', ');

const location = [data.city, data.state]
    .filter(Boolean)
    .join(', ');

const businessContacts =
    data.contacts.length > 0
        ? data.contacts
            .map(getDisplayPhone)
            .join(', ')
        : 'Not provided';

const gstStatus =
    data.gstRegistered === true
        ? 'Yes'
        : data.gstRegistered === false
            ? 'No'
            : 'Not provided';
        

return (

    <SafeAreaView
        style={styles.container}
        edges={['top', 'left', 'right']}
    >
        <View style={styles.pageInner}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleBack}
                    activeOpacity={0.7}
                    style={styles.iconButton}
                    accessibilityLabel="Go back"
                >
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#0F172A"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Submitted Details
                </Text>

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

            <View style={styles.successCard}>
                <View style={styles.successIcon}>
                    <Ionicons
                        name="checkmark"
                        size={25}
                        color="#FFFFFF"
                    />
                </View>

                <View style={styles.successContent}>
                    <Text style={styles.successTitle}>
                        Details saved successfully
                    </Text>

                    <Text style={styles.successMessage}>
                        Your business information is saved
                        and ready for the next stage.
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={
                    styles.scrollContent
                }
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.instruction}>
                    Tap a section to view submitted information.
                </Text>

                <View style={styles.sectionsContainer}>
                    <AccordionSection
                        title="Business Owner"
                        subtitle="Owner and primary contact"
                        icon="person-outline"
                        expanded={
                            expandedSection === 'owner'
                        }
                        onPress={() =>
                            toggleSection('owner')
                        }
                    >
                        <InfoRow
                            label="Owner name"
                            value={getDisplayValue(
                                data.ownerName
                            )}
                        />

                        <InfoRow
                            label="Owner contact"
                            value={getDisplayPhone(
                                data.ownerContact
                            )}
                        />

                        <InfoRow
                            label="Owner email"
                            value={getDisplayValue(
                                data.ownerEmail
                            )}
                        />

                        <InfoRow
                            label="Secondary contact"
                            value={getDisplayPhone(
                                data.secondaryContact
                            )}
                            last
                        />
                    </AccordionSection>

                    <AccordionSection
                        title="Business Profile"
                        subtitle="Business and communication"
                        icon="business-outline"
                        expanded={
                            expandedSection === 'business'
                        }
                        onPress={() =>
                            toggleSection('business')
                        }
                    >
                        <InfoRow
                            label="Business name"
                            value={getDisplayValue(
                                data.businessName
                            )}
                        />

                        <InfoRow
                            label="Business type"
                            value={getDisplayValue(
                                data.businessType
                            )}
                        />

                        <InfoRow
                            label="Contacts"
                            value={businessContacts}
                        />

                        <InfoRow
                            label="Business email"
                            value={getDisplayValue(
                                data.email
                            )}
                        />

                        <InfoRow
                            label="WhatsApp"
                            value={getDisplayPhone(
                                data.whatsappContact
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
                            toggleSection('address')
                        }
                    >
                        <InfoRow
                            label="Address"
                            value={getDisplayValue(
                                fullAddress
                            )}
                        />

                        <InfoRow
                            label="City / State"
                            value={getDisplayValue(
                                location
                            )}
                        />

                        <InfoRow
                            label="Pincode"
                            value={getDisplayValue(
                                data.pincode
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
                            toggleSection('tax')
                        }
                        last
                    >
                        <InfoRow
                            label="GST registered"
                            value={gstStatus}
                        />

                        {data.gstRegistered === true && (
                            <InfoRow
                                label="GST number"
                                value={getDisplayValue(
                                    data.gstNumber
                                )}
                            />
                        )}

                        <InfoRow
                            label="PAN number"
                            value={getDisplayValue(
                                data.panNumber
                            )}
                        />

                        <InfoRow
                            label="MSME / Udyam"
                            value={getDisplayValue(
                                data.msmeNumber
                            )}
                        />

                        <InfoRow
                            label="FSSAI number"
                            value={getDisplayValue(
                                data.fssaiNumber
                            )}
                            last
                        />
                    </AccordionSection>
                </View>

                <View style={styles.nextStepCard}>
                    <View style={styles.nextStepHeader}>
                        <View style={styles.nextStepIcon}>
                            <Ionicons
                                name="server-outline"
                                size={23}
                                color="#0284C7"
                            />
                        </View>

                        <View style={styles.nextStepTitleContainer}>
                            <Text style={styles.nextStepLabel}>
                                NEXT STEP
                            </Text>

                            <Text style={styles.nextStepTitle}>
                                Server Setup
                            </Text>
                        </View>
                    </View>



                    <View style={styles.nextStepInfo}>
                        <Ionicons
                            name="information-circle-outline"
                            size={19}
                            color="#0369A1"
                        />

                        <Text
                            style={styles.nextStepInfoText}
                        >
                            Start with Server Setup to configure your hosting and server details for your business website.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleContinue}
                        activeOpacity={0.85}
                        style={styles.continueButton}
                    >
                        <Text
                            style={
                                styles.continueButtonText
                            }
                        >
                            Continue to Server Setup
                        </Text>

                        <Ionicons
                            name="arrow-forward"
                            size={19}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>
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
                last && styles.accordionSectionLast,
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.75}
                style={styles.accordionHeader}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
            >
                <View style={styles.sectionIcon}>
                    <Ionicons
                        name={icon}
                        size={20}
                        color="#0284C7"
                    />
                </View>

                <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>
                        {title}
                    </Text>

                    <Text style={styles.sectionSubtitle}>
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
                <View style={styles.accordionContent}>
                    {children}
                </View>
            )}
        </View>
    );
}

type InfoRowProps = {
    label: string;
    value: string;
    last?: boolean;
};

function InfoRow({
    label,
    value,
    last = false,
}: InfoRowProps) {
    const notProvided = value === 'Not provided';

    return (
        <View
            style={[
                styles.infoRow,
                last && styles.infoRowLast,
            ]}
        >
            <Text style={styles.infoLabel}>
                {label}
            </Text>

            <Text
                selectable
                style={[
                    styles.infoValue,
                    notProvided &&
                    styles.infoValueNotProvided,
                ]}
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

    // Wraps header + successCard + ScrollView so the whole
    // page content is constrained to a centered, card-width
    // column on web instead of stretching full width.
    pageInner: {
        flex: 1,
        width: '100%',
        ...webConstrained,
    },

    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 30,
    },

    header: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginLeft: 20,
    },

    headerTitle: {
        flex: 1,
        color: '#0F172A',
        fontSize: 19,
        fontWeight: '800',
    },

    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },

    homeButton: {
        alignItems: 'flex-end',
        marginRight: 30,
    },

    successCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginHorizontal: 16,
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BAE6FD',
        borderRadius: 14,
    },

    successIcon: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0EA5E9',
        borderRadius: 21,
    },

    successContent: {
        flex: 1,
        marginLeft: 12,
    },

    successTitle: {
        color: '#0F172A',
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '800',
    },

    successMessage: {
        marginTop: 2,
        color: '#64748B',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '500',
    },

    instruction: {
        marginTop: 15,
        marginBottom: 8,
        color: '#64748B',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '600',
    },

    sectionsContainer: {
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
    },

    accordionSection: {
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },

    accordionSectionLast: {
        borderBottomWidth: 0,
    },

    accordionHeader: {
        minHeight: 66,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },

    sectionIcon: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F9FF',
        borderRadius: 10,
    },

    sectionTitleContainer: {
        flex: 1,
        marginHorizontal: 11,
    },

    sectionTitle: {
        color: '#0F172A',
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '800',
    },

    sectionSubtitle: {
        marginTop: 1,
        color: '#94A3B8',
        fontSize: 11,
        lineHeight: 16,
        fontWeight: '500',
    },

    accordionContent: {
        paddingHorizontal: 12,
        backgroundColor: '#FCFDFE',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },

    infoRow: {
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 11,
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

    infoValueNotProvided: {
        color: '#94A3B8',
        fontStyle: 'italic',
        fontWeight: '600',
    },

    nextStepCard: {
        marginTop: 86,
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        borderRadius: 14,
    },

    nextStepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    nextStepIcon: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        borderRadius: 11,
    },

    nextStepTitleContainer: {
        marginLeft: 11,
    },

    nextStepLabel: {
        color: '#0284C7',
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '800',
        letterSpacing: 0.7,
    },

    nextStepTitle: {
        marginTop: 1,
        color: '#0F172A',
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '800',
    },

    nextStepMessage: {
        marginTop: 12,
        color: '#475569',
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '500',
    },

    nextStepInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        padding: 11,
        backgroundColor: '#F0F9FF',
        borderRadius: 10,
    },

    nextStepInfoText: {
        flex: 1,
        marginLeft: 7,
        color: '#444f06',
        fontSize: 11,
        lineHeight: 17,
        fontWeight: '600',
    },

    continueButton: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        backgroundColor: '#0EA5E9',
        borderRadius: 12,
    },

    continueButtonText: {
        marginRight: 8,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },

    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },

    loadingTitle: {
        marginTop: 15,
        color: '#0F172A',
        fontSize: 17,
        fontWeight: '800',
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
        justifyContent: 'center',
        paddingHorizontal: 16,
    },

    errorIcon: {
        width: 66,
        height: 66,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 33,
    },

    errorTitle: {
        marginTop: 15,
        color: '#0F172A',
        fontSize: 19,
        fontWeight: '800',
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        paddingHorizontal: 20,
        backgroundColor: '#0EA5E9',
        borderRadius: 11,
    },

    retryText: {
        marginLeft: 7,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
});