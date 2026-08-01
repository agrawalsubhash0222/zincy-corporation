import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const BUDGET_OPTIONS = [
    'Below ₹25,000',
    '₹25,000 - ₹50,000',
    '₹50,000 - ₹1,00,000',
    'Above ₹1,00,000',
    'Not Sure',
];

const TIMELINE_OPTIONS = [
    'Within 7 Days',
    'Within 15 Days',
    'Within 1 Month',
    'Flexible',
];

type FormErrors = {
    budget: string;
    timeline: string;
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

export default function BudgetTimelineScreen() {
    const { data, updateData } = useOnboarding();

    const [budget, setBudget] = useState(data.budget ?? '');
    const [timeline, setTimeline] = useState(data.timeline ?? '');

    const [errors, setErrors] = useState<FormErrors>({
        budget: '',
        timeline: '',
    });

    const clearError = (field: keyof FormErrors) => {
        setErrors((currentErrors) => {
            if (!currentErrors[field]) {
                return currentErrors;
            }

            return {
                ...currentErrors,
                [field]: '',
            };
        });
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace(
            '/onboarding/business-information/project-requirement'
        );
    };

    const handleContinue = () => {
        const newErrors: FormErrors = {
            budget: '',
            timeline: '',
        };

        if (!budget) {
            newErrors.budget =
                'Please select your estimated budget.';
        }

        if (!timeline) {
            newErrors.timeline =
                'Please select your expected timeline.';
        }

        setErrors(newErrors);

        if (Object.values(newErrors).some(Boolean)) {
            return;
        }

        updateData({
            budget,
            timeline,
        });

        router.push('/onboarding/review-submit');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.page}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.headerTop}>
                                <View style={styles.headingContainer}>
                                    <TouchableOpacity
                                        onPress={handleBack}
                                        activeOpacity={0.7}
                                        hitSlop={12}
                                        style={styles.backButton}
                                    >
                                        <Ionicons
                                            name="arrow-back"
                                            size={25}
                                            color="#0F172A"
                                        />
                                    </TouchableOpacity>

                                    <Text style={styles.heading}>
                                        Budget &amp; Timeline
                                    </Text>
                                </View>

                                <Text style={styles.stepText}>
                                    Step 3 of 4
                                </Text>
                            </View>

                            <Text style={styles.description}>
                                This helps us suggest a realistic plan
                                for your project.
                            </Text>
                        </View>

                        <SectionLabel text="Estimated Budget" />

                        <View style={styles.optionList}>
                            {BUDGET_OPTIONS.map((item) => (
                                <OptionCard
                                    key={item}
                                    label={item}
                                    selected={budget === item}
                                    onPress={() => {
                                        setBudget(item);
                                        clearError('budget');
                                    }}
                                />
                            ))}
                        </View>

                        <View style={styles.errorContainer}>
                            {errors.budget ? (
                                <Text style={styles.errorText}>
                                    {errors.budget}
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.timelineSection}>
                            <SectionLabel
                                text="Expected Timeline"
                            />

                            <View style={styles.optionList}>
                                {TIMELINE_OPTIONS.map((item) => (
                                    <OptionCard
                                        key={item}
                                        label={item}
                                        selected={timeline === item}
                                        onPress={() => {
                                            setTimeline(item);
                                            clearError('timeline');
                                        }}
                                    />
                                ))}
                            </View>

                            <View style={styles.errorContainer}>
                                {errors.timeline ? (
                                    <Text style={styles.errorText}>
                                        {errors.timeline}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.button}
                        onPress={handleContinue}
                    >
                        <Text style={styles.buttonText}>
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
        </SafeAreaView>
    );
}

function SectionLabel({ text }: { text: string }) {
    return (
        <View style={styles.labelRow}>
            <Text style={styles.sectionTitle}>
                {text}
            </Text>

            <Text style={styles.required}>
                *
            </Text>
        </View>
    );
}

type OptionCardProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
};

function OptionCard({
    label,
    selected,
    onPress,
}: OptionCardProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={[
                styles.optionCard,
                selected ? styles.optionCardActive : null,
            ]}
            onPress={onPress}
        >
            <Text
                style={[
                    styles.optionText,
                    selected ? styles.optionTextActive : null,
                ]}
            >
                {label}
            </Text>

            <Ionicons
                name={
                    selected
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                }
                size={21}
                color={selected ? '#0EA5E9' : '#CBD5E1'}
            />
        </TouchableOpacity>
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

    // webConstrained keeps this from stretching edge-to-edge
    // on wide browser windows; mobile padding is unchanged.
    content: {
        width: '100%',
        paddingHorizontal: 16,
        ...webConstrained,
    },

    header: {
        marginBottom: 22,
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

    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },

    sectionTitle: {
        color: '#334155',
        fontSize: 14,
        fontWeight: '800',
    },

    required: {
        marginLeft: 3,
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '900',
    },

    optionList: {
        gap: 10,
    },

    optionCard: {
        width: '100%',
        minHeight: 52,
        paddingHorizontal: 14,
        paddingVertical: 11,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 14,
    },

    optionCardActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#0EA5E9',
    },

    optionText: {
        flex: 1,
        paddingRight: 10,
        color: '#334155',
        fontSize: 14,
        fontWeight: '700',
    },

    optionTextActive: {
        color: '#0EA5E9',
    },

    errorContainer: {
        minHeight: 28,
        justifyContent: 'center',
    },

    errorText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
    },

    timelineSection: {
        marginTop: 8,
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

    buttonText: {
        marginRight: 8,
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
});