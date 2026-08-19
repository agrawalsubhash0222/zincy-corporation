import { Ionicons } from '@expo/vector-icons';
import {
    router,
    useLocalSearchParams,
} from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProjectConfirmationScreen() {
    const goHome = () => {
        router.replace('/(website)');
    };

    const reviewSubmittedDetails = () => {
        if (
            !Number.isInteger(onboardingRequestId) ||
            onboardingRequestId <= 0
        ) {
            router.replace('/onboarding/check');
            return;
        }

        router.push({
            pathname:
                '/onboarding/submitted-project-details',
            params: {
                onboardingRequestId:
                    String(onboardingRequestId),
            },
        });
    };

    const params = useLocalSearchParams<{
        onboardingRequestId?: string | string[];
    }>();

    const rawOnboardingRequestId =
        Array.isArray(params.onboardingRequestId)
            ? params.onboardingRequestId[0]
            : params.onboardingRequestId;

    const onboardingRequestId =
        Number(rawOnboardingRequestId);

    return (
        <SafeAreaView
            style={styles.container}
            edges={['top', 'left', 'right']}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.successIconOuter}>
                    <View style={styles.successIconInner}>
                        <Ionicons
                            name="checkmark"
                            size={42}
                            color="#FFFFFF"
                        />
                    </View>
                </View>

                <Text style={styles.title}>
                    You&apos;re All Set!
                </Text>

                <Text style={styles.subtitle}>
                    Thank you for choosing Zincy Corporation.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        We&apos;ve received everything we need
                    </Text>

                    <Text style={styles.message}>
                        Your project details and payment have been
                        received successfully. Our team will now review
                        the information you&apos;ve shared and begin
                        planning the next steps for your project.
                    </Text>

                    <Text style={styles.message}>
                        If we need any additional information or
                        clarification during development, our team will
                        contact using the contact
                        details you provided with your request.
                    </Text>

                    <View style={styles.highlightBox}>
                        <Ionicons
                            name="sparkles-outline"
                            size={24}
                            color="#0284C7"
                        />

                        <Text style={styles.highlightText}>
                            For now, you can relax — your project is in
                            good hands. Our team is working to turn your
                            requirements into a reliable and thoughtfully
                            built solution.
                        </Text>
                    </View>
                </View>

                <View style={styles.nextStepsCard}>
                    <Text style={styles.nextStepsTitle}>
                        What happens next?
                    </Text>

                    <Step
                        icon="checkmark-circle"
                        title="Details received"
                        completed
                    />

                    <Step
                        icon="checkmark-circle"
                        title="Payment confirmed"
                        completed
                    />

                    <Step
                        icon="people-outline"
                        title="Project review & planning"
                    />

                    <Step
                        icon="call-outline"
                        title="We&apos;ll contact you if anything else is needed"
                    />
                </View>

                <Text style={styles.footerMessage}>
                    We&apos;ll keep you informed as your project
                    progresses.
                </Text>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    activeOpacity={0.85}
                    onPress={reviewSubmittedDetails}
                >
                    <Text style={styles.secondaryButtonText}>
                        Review Submitted Details
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.85}
                    onPress={goHome}
                >
                    <Text style={styles.primaryButtonText}>
                        Go to Home
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function Step({
    icon,
    title,
    completed = false,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    completed?: boolean;
}) {
    return (
        <View style={styles.step}>
            <Ionicons
                name={icon}
                size={21}
                color={completed ? '#16A34A' : '#0284C7'}
            />

            <Text style={styles.stepText}>
                {title}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 34,
        paddingBottom: 170,
    },

    successIconOuter: {
        width: 112,
        height: 112,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 56,
        backgroundColor: '#DCFCE7',
    },

    successIconInner: {
        width: 72,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 36,
        backgroundColor: '#16A34A',
    },

    title: {
        marginTop: 24,
        color: '#0F172A',
        fontSize: 30,
        lineHeight: 38,
        fontWeight: '900',
        textAlign: 'center',
    },

    subtitle: {
        marginTop: 7,
        color: '#64748B',
        fontSize: 17,
        lineHeight: 25,
        fontWeight: '700',
        textAlign: 'center',
    },

    card: {
        marginTop: 28,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },

    cardTitle: {
        color: '#0F172A',
        fontSize: 18,
        lineHeight: 25,
        fontWeight: '900',
    },

    message: {
        marginTop: 14,
        color: '#475569',
        fontSize: 15,
        lineHeight: 24,
    },

    highlightBox: {
        marginTop: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        backgroundColor: '#F0F9FF',
    },

    highlightText: {
        flex: 1,
        marginLeft: 11,
        color: '#0C4A6E',
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '700',
    },

    nextStepsCard: {
        marginTop: 18,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },

    nextStepsTitle: {
        marginBottom: 7,
        color: '#0F172A',
        fontSize: 17,
        fontWeight: '900',
    },

    step: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
    },

    stepText: {
        flex: 1,
        marginLeft: 10,
        color: '#334155',
        fontSize: 14,
        lineHeight: 21,
        fontWeight: '700',
    },

    footerMessage: {
        marginTop: 22,
        paddingHorizontal: 12,
        color: '#64748B',
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },

    bottomBar: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        left: 0,
        paddingHorizontal: 20,
        paddingTop: 13,
        paddingBottom: 22,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },

    secondaryButton: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#0EA5E9',
        backgroundColor: '#FFFFFF',
    },

    secondaryButtonText: {
        color: '#0284C7',
        fontSize: 14,
        fontWeight: '900',
    },

    primaryButton: {
        minHeight: 52,
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        backgroundColor: '#0EA5E9',
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
});