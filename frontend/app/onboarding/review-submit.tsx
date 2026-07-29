import { useOnboarding } from '@/context/OnboardingContext';
import api from '@/services/api';
import { getSession } from '@/utils/session';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    type ReactNode,
    useState,
} from 'react';
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type SectionKey =
    | 'business'
    | 'project'
    | 'budget'
    | null;

export default function ReviewSubmitScreen() {
    const { data, resetData } = useOnboarding();

    const [expandedSection, setExpandedSection] =
        useState<SectionKey>('business');

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const getText = (value: string) => {
        return value?.trim() ? value : 'Not provided';
    };

    const getListText = (values: string[]) => {
        return values?.length > 0
            ? values.join(', ')
            : 'Not provided';
    };

    const toggleSection = (section: SectionKey) => {
        if (success) {
            return;
        }

        setExpandedSection((currentSection) =>
            currentSection === section ? null : section
        );
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace('/onboarding/budget-timeline');
    };

    const handleSubmit = async () => {
        if (submitting || success) {
            return;
        }

        try {
            setSubmitting(true);
            setErrorMsg('');

            const session = await getSession();

            await api.post('/onboarding-requests', {
                businessName: data.businessName,
                ownerName: data.ownerName,
                mobile: data.mobile,
                userMobile: session?.mobile || data.mobile,
                email: data.email,
                projectTypes: data.projectTypes,
                requirement: data.requirement,
                budget: data.budget,
                timeline: data.timeline,
            });

            setExpandedSection(null);
            setSuccess(true);
        } catch (error) {
            console.log(
                'Submit onboarding error:',
                error
            );

            setErrorMsg(
                'Something went wrong. Please try submitting again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleContinue = () => {
        resetData();
        router.replace('/');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.page}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={
                        styles.scrollContent
                    }
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.headerTop}>
                                <View
                                    style={
                                        styles.headingContainer
                                    }
                                >
                                    <TouchableOpacity
                                        onPress={handleBack}
                                        activeOpacity={0.7}
                                        hitSlop={12}
                                        style={
                                            styles.backButton
                                        }
                                    >
                                        <Ionicons
                                            name="arrow-back"
                                            size={25}
                                            color="#0F172A"
                                        />
                                    </TouchableOpacity>

                                    <Text style={styles.heading}>
                                        Review &amp; Submit
                                    </Text>
                                </View>

                                <Text style={styles.stepText}>
                                    Step 4 of 4
                                </Text>
                            </View>

                            <Text
                                style={styles.description}
                            >
                                Please review your onboarding
                                details before submitting.
                            </Text>
                        </View>

                        {errorMsg ? (
                            <View style={styles.errorCard}>
                                <Ionicons
                                    name="alert-circle"
                                    size={21}
                                    color="#DC2626"
                                />

                                <Text
                                    style={styles.errorText}
                                >
                                    {errorMsg}
                                </Text>
                            </View>
                        ) : null}

                        <View style={styles.summaryCard}>
                            <AccordionSection
                                icon="business-outline"
                                title="Business Details"
                                expanded={
                                    expandedSection ===
                                    'business'
                                }
                                onPress={() => {
                                    toggleSection('business');
                                }}
                            >
                                <DetailRow
                                    label="Business Name"
                                    value={getText(
                                        data.businessName
                                    )}
                                />

                                <DetailRow
                                    label="Owner Name"
                                    value={getText(
                                        data.ownerName
                                    )}
                                />

                                <DetailRow
                                    label="Mobile Number"
                                    value={getText(
                                        data.mobile
                                    )}
                                />

                                <DetailRow
                                    label="Email Address"
                                    value={getText(
                                        data.email
                                    )}
                                />
                            </AccordionSection>

                            <AccordionSection
                                icon="layers-outline"
                                title="Project Requirement"
                                expanded={
                                    expandedSection ===
                                    'project'
                                }
                                onPress={() => {
                                    toggleSection('project');
                                }}
                            >
                                <DetailRow
                                    label="Selected Services"
                                    value={getListText(
                                        data.projectTypes
                                    )}
                                />

                                <DetailRow
                                    label="Requirement"
                                    value={getText(
                                        data.requirement
                                    )}
                                />
                            </AccordionSection>

                            <AccordionSection
                                icon="wallet-outline"
                                title="Budget & Timeline"
                                expanded={
                                    expandedSection ===
                                    'budget'
                                }
                                onPress={() => {
                                    toggleSection('budget');
                                }}
                                isLast
                            >
                                <DetailRow
                                    label="Budget"
                                    value={getText(
                                        data.budget
                                    )}
                                />

                                <DetailRow
                                    label="Timeline"
                                    value={getText(
                                        data.timeline
                                    )}
                                />
                            </AccordionSection>
                        </View>

                        <View style={styles.noteCard}>
                            <Ionicons
                                name="information-circle-outline"
                                size={21}
                                color="#0EA5E9"
                            />

                            <Text style={styles.noteText}>
                                After submission, our team will
                                review your details and contact
                                you for the next steps.
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={[
                            styles.button,
                            submitting || success
                                ? styles.buttonDisabled
                                : null,
                        ]}
                        onPress={handleSubmit}
                        disabled={submitting || success}
                    >
                        <Text style={styles.buttonText}>
                            {submitting
                                ? 'Submitting...'
                                : success
                                  ? 'Submitted'
                                  : 'Submit Onboarding'}
                        </Text>

                        <Ionicons
                            name="checkmark-circle"
                            size={19}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={success}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => {}}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.successDialog}>
                        <View
                            style={
                                styles.successIconCircle
                            }
                        >
                            <Ionicons
                                name="checkmark-circle"
                                size={44}
                                color="#16A34A"
                            />
                        </View>

                        <Text style={styles.dialogTitle}>
                            Onboarding Submitted
                        </Text>

                        <Text style={styles.dialogMessage}>
                            Onboarding submitted successfully!
                            Our team will review your details and
                            contact you shortly for the next
                            steps.
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.continueButton}
                            onPress={handleContinue}
                        >
                            <Text
                                style={
                                    styles.continueButtonText
                                }
                            >
                                Continue
                            </Text>

                            <Ionicons
                                name="arrow-forward"
                                size={18}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

type AccordionSectionProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    expanded: boolean;
    onPress: () => void;
    children: ReactNode;
    isLast?: boolean;
};

function AccordionSection({
    icon,
    title,
    expanded,
    onPress,
    children,
    isLast = false,
}: AccordionSectionProps) {
    return (
        <View
            style={[
                styles.accordionSection,
                isLast
                    ? styles.accordionSectionLast
                    : null,
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.accordionHeader}
                onPress={onPress}
            >
                <View style={styles.summaryIconBox}>
                    <Ionicons
                        name={icon}
                        size={19}
                        color="#0EA5E9"
                    />
                </View>

                <Text style={styles.accordionTitle}>
                    {title}
                </Text>

                <Ionicons
                    name={
                        expanded
                            ? 'chevron-up'
                            : 'chevron-down'
                    }
                    size={21}
                    color="#64748B"
                />
            </TouchableOpacity>

            {expanded ? (
                <View style={styles.accordionBody}>
                    {children}
                </View>
            ) : null}
        </View>
    );
}

type DetailRowProps = {
    label: string;
    value: string;
};

function DetailRow({
    label,
    value,
}: DetailRowProps) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
                {label}
            </Text>

            <Text style={styles.detailValue}>
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    page: {
        flex: 1,
    },

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
        paddingTop: 10,
        paddingBottom: 8,
    },

    content: {
        width: '100%',
        paddingHorizontal: 16,
    },

    header: {
        marginBottom: 20,
    },

    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    headingContainer: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },

    backButton: {
        width: 36,
        height: 40,
        marginRight: 4,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },

    heading: {
        flexShrink: 1,
        color: '#0F172A',
        fontSize: 22,
        fontWeight: '900',
    },

    stepText: {
        marginLeft: 8,
        color: '#0EA5E9',
        fontSize: 12,
        fontWeight: '900',
    },

    description: {
        marginTop: 8,
        color: '#64748B',
        fontSize: 14,
        lineHeight: 21,
    },

    summaryCard: {
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
    },

    accordionSection: {
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },

    accordionSectionLast: {
        borderBottomWidth: 0,
    },

    accordionHeader: {
        minHeight: 58,
        paddingHorizontal: 13,
        paddingVertical: 11,
        flexDirection: 'row',
        alignItems: 'center',
    },

    summaryIconBox: {
        width: 34,
        height: 34,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        borderRadius: 17,
    },

    accordionTitle: {
        flex: 1,
        color: '#0F172A',
        fontSize: 14,
        fontWeight: '800',
    },

    accordionBody: {
        paddingHorizontal: 13,
        paddingBottom: 11,
    },

    detailRow: {
        minHeight: 38,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },

    detailLabel: {
        width: '40%',
        paddingRight: 8,
        color: '#64748B',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },

    detailValue: {
        flex: 1,
        color: '#0F172A',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '700',
        textAlign: 'right',
    },

    noteCard: {
        marginTop: 16,
        padding: 13,
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 14,
    },

    noteText: {
        flex: 1,
        marginLeft: 9,
        color: '#1E3A8A',
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '600',
    },

    errorCard: {
        marginBottom: 14,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 9,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 14,
    },

    errorText: {
        flex: 1,
        color: '#991B1B',
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '700',
    },

    footer: {
        width: '100%',
        paddingTop: 8,
        paddingBottom: 10,
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },

    button: {
        width: '88%',
        maxWidth: 420,
        minHeight: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0EA5E9',
        borderRadius: 13,
    },

    buttonDisabled: {
        opacity: 0.7,
    },

    buttonText: {
        marginRight: 8,
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    modalOverlay: {
        flex: 1,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
    },

    successDialog: {
        width: '100%',
        maxWidth: 420,
        padding: 22,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
    },

    successIconCircle: {
        width: 68,
        height: 68,
        marginBottom: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DCFCE7',
        borderRadius: 34,
    },

    dialogTitle: {
        marginBottom: 9,
        color: '#0F172A',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },

    dialogMessage: {
        marginBottom: 20,
        color: '#475569',
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },

    continueButton: {
        width: '88%',
        minHeight: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0EA5E9',
        borderRadius: 13,
    },

    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
});