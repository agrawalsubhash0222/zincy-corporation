import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const PROJECT_TYPES = [
    'Mobile App',
    'Website',
    'Admin Panel',
    'E-Commerce',
    'Inventory System',
    'CRM',
    'AI Integration',
    'UI/UX Design',
];

type FormErrors = {
    projectTypes: string;
    requirement: string;
};

export default function ProjectRequirementScreen() {
    const { data, updateData } = useOnboarding();

    const [selectedTypes, setSelectedTypes] = useState<string[]>(
        data.projectTypes ?? []
    );

    const [requirement, setRequirement] = useState(
        data.requirement ?? ''
    );

    const [errors, setErrors] = useState<FormErrors>({
        projectTypes: '',
        requirement: '',
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

    const toggleType = (type: string) => {
        setSelectedTypes((currentTypes) => {
            if (currentTypes.includes(type)) {
                return currentTypes.filter(
                    (item) => item !== type
                );
            }

            return [...currentTypes, type];
        });

        clearError('projectTypes');
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace(
            '/onboarding/business-information/business-details'
        );
    };

    const handleContinue = () => {
        const finalRequirement = requirement.trim();

        const newErrors: FormErrors = {
            projectTypes: '',
            requirement: '',
        };

        if (selectedTypes.length === 0) {
            newErrors.projectTypes =
                'Please select at least one project type.';
        }

        if (!finalRequirement) {
            newErrors.requirement =
                'Please describe your project requirement.';
        } else if (finalRequirement.length < 20) {
            newErrors.requirement =
                'Requirement details should be at least 20 characters.';
        }

        setErrors(newErrors);

        const hasError = Object.values(newErrors).some(Boolean);

        if (hasError) {
            return;
        }

        updateData({
            projectTypes: selectedTypes,
            requirement: finalRequirement,
        });

        router.push('/onboarding/budget-timeline');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
                keyboardVerticalOffset={
                    Platform.OS === 'ios' ? 10 : 0
                }
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={
                        styles.scrollContent
                    }
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                    automaticallyAdjustKeyboardInsets={
                        Platform.OS === 'ios'
                    }
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
                                        style={styles.backButton}
                                    >
                                        <Ionicons
                                            name="arrow-back"
                                            size={25}
                                            color="#0F172A"
                                        />
                                    </TouchableOpacity>

                                    <Text style={styles.heading}>
                                        Project Requirement
                                    </Text>
                                </View>

                                <Text style={styles.stepText}>
                                    Step 2 of 4
                                </Text>
                            </View>

                            <Text style={styles.description}>
                                Select what you want to build and
                                describe your requirement.
                            </Text>
                        </View>

                        <View style={styles.labelRow}>
                            <Text style={styles.sectionTitle}>
                                What do you need?
                            </Text>

                            <Text style={styles.required}>
                                *
                            </Text>
                        </View>

                        <View style={styles.chipWrap}>
                            {PROJECT_TYPES.map((type) => {
                                const selected =
                                    selectedTypes.includes(type);

                                return (
                                    <TouchableOpacity
                                        key={type}
                                        activeOpacity={0.8}
                                        style={[
                                            styles.chip,
                                            selected
                                                ? styles.chipActive
                                                : null,
                                        ]}
                                        onPress={() => {
                                            toggleType(type);
                                        }}
                                    >
                                        <Ionicons
                                            name={
                                                selected
                                                    ? 'checkmark-circle'
                                                    : 'add-circle-outline'
                                            }
                                            size={18}
                                            color={
                                                selected
                                                    ? '#0EA5E9'
                                                    : '#64748B'
                                            }
                                        />

                                        <Text
                                            style={[
                                                styles.chipText,
                                                selected
                                                    ? styles.chipTextActive
                                                    : null,
                                            ]}
                                        >
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.errorContainer}>
                            {errors.projectTypes ? (
                                <Text style={styles.errorText}>
                                    {errors.projectTypes}
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.field}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>
                                    Requirement Details
                                </Text>

                                <Text style={styles.required}>
                                    *
                                </Text>
                            </View>

                            <TextInput
                                style={[
                                    styles.textArea,
                                    errors.requirement
                                        ? styles.textAreaError
                                        : null,
                                ]}
                                placeholder="Example: I need an app where customers can view products, place orders, track status, and admin can manage everything."
                                placeholderTextColor="#94A3B8"
                                selectionColor="#0EA5E9"
                                underlineColorAndroid="transparent"
                                multiline
                                textAlignVertical="top"
                                value={requirement}
                                onChangeText={(text) => {
                                    setRequirement(text);
                                    clearError('requirement');
                                }}
                            />

                            <View
                                style={
                                    styles.requirementErrorContainer
                                }
                            >
                                {errors.requirement ? (
                                    <Text style={styles.errorText}>
                                        {errors.requirement}
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    keyboardView: {
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

    /*
     * This inner wrapper guarantees equal mobile spacing.
     * Do not move this padding to SafeAreaView or ScrollView.
     */
    content: {
        width: '100%',
        paddingHorizontal: 16,
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
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 0,
    },

    backButton: {
        width: 36,
        height: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 4,
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

    label: {
        color: '#334155',
        fontSize: 14,
        fontWeight: '700',
    },

    required: {
        marginLeft: 3,
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '900',
    },

    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 9,
    },

    chip: {
        minHeight: 40,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },

    chipActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#0EA5E9',
    },

    chipText: {
        marginLeft: 7,
        color: '#475569',
        fontSize: 13,
        fontWeight: '700',
    },

    chipTextActive: {
        color: '#0EA5E9',
    },

    errorContainer: {
        minHeight: 28,
        justifyContent: 'center',
    },

    field: {
        width: '100%',
    },

    textArea: {
        width: '100%',
        minHeight: 130,
        maxHeight: 190,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingTop: 13,
        paddingBottom: 13,
        color: '#0F172A',
        fontSize: 14,
        lineHeight: 21,

        ...(Platform.OS === 'web'
            ? ({
                  outlineStyle: 'none',
                  outlineWidth: 0,
                  boxSizing: 'border-box',
              } as object)
            : {}),
    },

    textAreaError: {
        borderColor: '#EF4444',
    },

    requirementErrorContainer: {
        minHeight: 24,
        justifyContent: 'center',
    },

    errorText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
    },

    footer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 10,
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