import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { styles } from '@/styles/onboarding/projectRequirement.styles';

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
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
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
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                    contentContainerStyle={{
                        paddingBottom: 16,
                    }}
                    automaticallyAdjustKeyboardInsets={
                        Platform.OS === 'ios'
                    }
                >
                    <View style={styles.header}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <TouchableOpacity
                                    onPress={handleBack}
                                    activeOpacity={0.8}
                                    hitSlop={12}
                                    style={{
                                        width: 36,
                                        height: 40,
                                        alignItems: 'flex-start',
                                        justifyContent: 'center',
                                        marginRight: 3,
                                    }}
                                >
                                    <Ionicons
                                        name="arrow-back"
                                        size={25}
                                        color="#0F172A"
                                    />
                                </TouchableOpacity>

                                <Text
                                    style={{
                                        flexShrink: 1,
                                        fontSize: 23,
                                        fontWeight: '900',
                                        color: '#0F172A',
                                    }}
                                >
                                    Project Requirement
                                </Text>
                            </View>

                            <Text
                                style={{
                                    marginLeft: 8,
                                    fontSize: 13,
                                    fontWeight: '900',
                                    color: '#0EA5E9',
                                }}
                            >
                                Step 2 of 4
                            </Text>
                        </View>

                        <Text
                            style={{
                                marginTop: 8,
                                fontSize: 15,
                                color: '#64748B',
                                lineHeight: 22,
                            }}
                        >
                            Select what you want to build and
                            describe your requirement.
                        </Text>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 12,
                        }}
                    >
                        <Text style={styles.sectionTitle}>
                            What do you need?
                        </Text>

                        <Text
                            style={{
                                marginLeft: 3,
                                color: '#EF4444',
                                fontSize: 16,
                                fontWeight: '900',
                            }}
                        >
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
                                    activeOpacity={0.85}
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

                    {errors.projectTypes ? (
                        <Text
                            style={{
                                marginTop: 6,
                                marginBottom: 8,
                                color: '#EF4444',
                                fontSize: 12,
                                fontWeight: '600',
                            }}
                        >
                            {errors.projectTypes}
                        </Text>
                    ) : null}

                    <View style={styles.field}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 8,
                            }}
                        >
                            <Text style={styles.label}>
                                Requirement Details
                            </Text>

                            <Text
                                style={{
                                    marginLeft: 3,
                                    color: '#EF4444',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                *
                            </Text>
                        </View>

                        <TextInput
                            style={[
                                styles.textArea,
                                errors.requirement
                                    ? {
                                        borderColor: '#EF4444',
                                    }
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

                        {errors.requirement ? (
                            <Text
                                style={{
                                    marginTop: 6,
                                    color: '#EF4444',
                                    fontSize: 12,
                                    fontWeight: '600',
                                }}
                            >
                                {errors.requirement}
                            </Text>
                        ) : null}
                    </View>
                </ScrollView>

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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}