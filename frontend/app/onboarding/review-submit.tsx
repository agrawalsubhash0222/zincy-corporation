import { useOnboarding } from '@/context/OnboardingContext';
import api from '@/services/api';
import { getSession } from '@/utils/session';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Modal,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { styles } from '@/styles/onboarding/reviewSubmit.styles';

type SectionKey = 'business' | 'project' | 'budget' | null;

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
        return values.length > 0 ? values.join(', ') : 'Not provided';
    };

    const toggleSection = (section: SectionKey) => {
        if (success) return;
        setExpandedSection((prev) => (prev === section ? null : section));
    };

    const handleSubmit = async () => {
        if (submitting || success) return;

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
            console.log('Submit onboarding error:', error);
            setErrorMsg('Something went wrong. Please try submitting again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleContinue = () => {
        resetData();
        router.replace('/(website)');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={{ marginRight: 12 }}>
                                <Ionicons name="arrow-back" size={24} color="#0F172A" />
                            </TouchableOpacity>

                            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A' }}>
                                Review & Submit
                            </Text>
                        </View>

                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#0EA5E9' }}>
                            Step 4 of 4
                        </Text>
                    </View>

                    <Text style={{ marginTop: 12, marginLeft: 0, fontSize: 15, color: '#64748B', lineHeight: 22 }}>
                        Please review your onboarding details before submitting.
                    </Text>
                </View>

                {!!errorMsg && (
                    <View style={styles.errorCard}>
                        <Ionicons name="alert-circle" size={22} color="#DC2626" />
                        <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                )}

                <View style={styles.summaryCard}>
                    <AccordionSection
                        icon="business-outline"
                        title="Business Details"
                        expanded={expandedSection === 'business'}
                        onPress={() => toggleSection('business')}
                    >
                        <DetailRow label="Business Name" value={getText(data.businessName)} />
                        <DetailRow label="Owner Name" value={getText(data.ownerName)} />
                        <DetailRow label="Mobile Number" value={getText(data.mobile)} />
                        <DetailRow label="Email Address" value={getText(data.email)} />
                    </AccordionSection>

                    <AccordionSection
                        icon="layers-outline"
                        title="Project Requirement"
                        expanded={expandedSection === 'project'}
                        onPress={() => toggleSection('project')}
                    >
                        <DetailRow label="Selected Services" value={getListText(data.projectTypes)} />
                        <DetailRow label="Requirement" value={getText(data.requirement)} />
                    </AccordionSection>

                    <AccordionSection
                        icon="wallet-outline"
                        title="Budget & Timeline"
                        expanded={expandedSection === 'budget'}
                        onPress={() => toggleSection('budget')}
                        isLast
                    >
                        <DetailRow label="Budget" value={getText(data.budget)} />
                        <DetailRow label="Timeline" value={getText(data.timeline)} />
                    </AccordionSection>
                </View>

                <View style={styles.noteCard}>
                    <Ionicons
                        name="information-circle-outline"
                        size={22}
                        color="#0ea5e9"
                    />
                    <Text style={styles.noteText}>
                        After submission, our team will review your details and contact you for the next steps.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                        styles.button,
                        (submitting || success) && styles.buttonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={submitting || success}
                >
                    <Text style={styles.buttonText}>
                        {submitting ? 'Submitting...' : success ? 'Submitted' : 'Submit Onboarding'}
                    </Text>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <Modal
                visible={success}
                transparent
                animationType="fade"
                onRequestClose={() => { }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.successDialog}>
                        <View style={styles.successIconCircle}>
                            <Ionicons name="checkmark-circle" size={46} color="#16A34A" />
                        </View>

                        <Text style={styles.dialogTitle}>
                            Onboarding Submitted
                        </Text>

                        <Text style={styles.dialogMessage}>
                            Onboarding submitted successfully! Our team will review your details and contact you shortly for the next steps.
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.continueButton}
                            onPress={handleContinue}
                        >
                            <Text style={styles.continueButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
    children: React.ReactNode;
    isLast?: boolean;
};

function AccordionSection({
    icon,
    title,
    expanded,
    onPress,
    children,
    isLast,
}: AccordionSectionProps) {
    return (
        <View
            style={[
                styles.accordionSection,
                isLast && styles.accordionSectionLast,
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.accordionHeader}
                onPress={onPress}
            >
                <View style={styles.summaryIconBox}>
                    <Ionicons name={icon} size={20} color="#0ea5e9" />
                </View>

                <Text style={styles.accordionTitle}>{title}</Text>

                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color="#64748B"
                />
            </TouchableOpacity>

            {expanded && <View style={styles.accordionBody}>{children}</View>}
        </View>
    );
}

type DetailRowProps = {
    label: string;
    value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>

            <Text style={styles.detailValue} numberOfLines={2}>
                {value}
            </Text>
        </View>
    );
}