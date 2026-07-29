import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    type RefObject,
    useRef,
    useState,
} from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    type TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';

type FormErrors = {
    businessName: string;
    ownerName: string;
    mobile: string;
    email: string;
};

export default function BusinessDetailsScreen() {
    const { data, updateData } = useOnboarding();

    const ownerNameRef = useRef<TextInput>(null);
    const mobileRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);

    const [businessName, setBusinessName] = useState(
        data.businessName ?? ''
    );
    const [ownerName, setOwnerName] = useState(
        data.ownerName ?? ''
    );
    const [mobile, setMobile] = useState(
        data.mobile ?? ''
    );
    const [email, setEmail] = useState(
        data.email ?? ''
    );

    const [errors, setErrors] = useState<FormErrors>({
        businessName: '',
        ownerName: '',
        mobile: '',
        email: '',
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

    const isValidEmail = (value: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    const isValidIndianMobile = (value: string) => {
        return /^[6-9]\d{9}$/.test(value);
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace('/onboarding');
    };

    const handleContinue = () => {
        const finalBusinessName = businessName.trim();
        const finalOwnerName = ownerName.trim();
        const finalMobile = mobile.trim();
        const finalEmail = email.trim().toLowerCase();

        const newErrors: FormErrors = {
            businessName: '',
            ownerName: '',
            mobile: '',
            email: '',
        };

        if (!finalBusinessName) {
            newErrors.businessName =
                'Please enter business name.';
        } else if (finalBusinessName.length < 3) {
            newErrors.businessName =
                'Business name should be at least 3 characters.';
        }

        if (!finalOwnerName) {
            newErrors.ownerName =
                'Please enter owner name.';
        } else if (finalOwnerName.length < 3) {
            newErrors.ownerName =
                'Owner name should be at least 3 characters.';
        }

        if (!finalMobile) {
            newErrors.mobile =
                'Please enter mobile number.';
        } else if (!isValidIndianMobile(finalMobile)) {
            newErrors.mobile =
                'Please enter a valid 10-digit Indian mobile number.';
        }

        if (!finalEmail) {
            newErrors.email =
                'Please enter email address.';
        } else if (!isValidEmail(finalEmail)) {
            newErrors.email =
                'Please enter a valid email address.';
        }

        setErrors(newErrors);

        const hasError = Object.values(newErrors).some(Boolean);

        if (hasError) {
            return;
        }

        updateData({
            businessName: finalBusinessName,
            ownerName: finalOwnerName,
            mobile: finalMobile,
            email: finalEmail,
        });

        router.push(
            '/onboarding/business-information/project-requirement'
        );
    };

    return (
        <SafeAreaView style={pageStyles.safeArea}>
            <KeyboardAvoidingView
                style={pageStyles.keyboardView}
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
                    style={pageStyles.scrollView}
                    contentContainerStyle={
                        pageStyles.scrollContent
                    }
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                    showsVerticalScrollIndicator={false}
                    automaticallyAdjustKeyboardInsets={
                        Platform.OS === 'ios'
                    }
                >
                    <View style={pageStyles.formContent}>
                        <View style={pageStyles.header}>
                            <View style={pageStyles.headerTop}>
                                <View
                                    style={
                                        pageStyles.headingContainer
                                    }
                                >
                                    <TouchableOpacity
                                        onPress={handleBack}
                                        activeOpacity={0.7}
                                        hitSlop={12}
                                        style={
                                            pageStyles.backButton
                                        }
                                    >
                                        <Ionicons
                                            name="arrow-back"
                                            size={25}
                                            color="#0F172A"
                                        />
                                    </TouchableOpacity>

                                    <Text
                                        style={pageStyles.heading}
                                    >
                                        Business Details
                                    </Text>
                                </View>

                                <Text
                                    style={pageStyles.stepText}
                                >
                                    Step 1 of 4
                                </Text>
                            </View>

                            <Text
                                style={pageStyles.description}
                            >
                                Tell us about your business so we
                                can recommend the right solution.
                            </Text>
                        </View>

                        <InputField
                            label="Business Name"
                            icon="business-outline"
                            value={businessName}
                            placeholder="ABC Hardware Store"
                            error={errors.businessName}
                            autoCapitalize="words"
                            returnKeyType="next"
                            onSubmitEditing={() => {
                                ownerNameRef.current?.focus();
                            }}
                            onChangeText={(text) => {
                                setBusinessName(text);
                                clearError('businessName');
                            }}
                        />

                        <InputField
                            inputRef={ownerNameRef}
                            label="Owner Name"
                            icon="person-outline"
                            value={ownerName}
                            placeholder="Rahul Kumar"
                            error={errors.ownerName}
                            autoCapitalize="words"
                            returnKeyType="next"
                            onSubmitEditing={() => {
                                mobileRef.current?.focus();
                            }}
                            onChangeText={(text) => {
                                setOwnerName(text);
                                clearError('ownerName');
                            }}
                        />

                        <InputField
                            inputRef={mobileRef}
                            label="Mobile Number"
                            icon="call-outline"
                            value={mobile}
                            placeholder="9876543210"
                            error={errors.mobile}
                            keyboardType="phone-pad"
                            maxLength={10}
                            returnKeyType="next"
                            onSubmitEditing={() => {
                                emailRef.current?.focus();
                            }}
                            onChangeText={(text) => {
                                const numbersOnly = text
                                    .replace(/\D/g, '')
                                    .slice(0, 10);

                                setMobile(numbersOnly);
                                clearError('mobile');
                            }}
                        />

                        <InputField
                            inputRef={emailRef}
                            label="Email Address"
                            icon="mail-outline"
                            value={email}
                            placeholder="owner@email.com"
                            error={errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="done"
                            onSubmitEditing={handleContinue}
                            onChangeText={(text) => {
                                setEmail(text);
                                clearError('email');
                            }}
                        />
                    </View>
                </ScrollView>

                <View style={pageStyles.footer}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={pageStyles.continueButton}
                        onPress={handleContinue}
                    >
                        <Text
                            style={
                                pageStyles.continueButtonText
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

type InputFieldProps = TextInputProps & {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    error?: string;
    inputRef?: RefObject<TextInput | null>;
};

function InputField({
    label,
    icon,
    error,
    inputRef,
    style,
    ...inputProps
}: InputFieldProps) {
    return (
        <View style={pageStyles.field}>
            <View style={pageStyles.labelContainer}>
                <Text style={pageStyles.label}>
                    {label}
                </Text>

                <Text style={pageStyles.required}>
                    *
                </Text>
            </View>

            <View
                style={[
                    pageStyles.inputContainer,
                    error
                        ? pageStyles.inputContainerError
                        : null,
                ]}
            >
                <View style={pageStyles.iconContainer}>
                    <Ionicons
                        name={icon}
                        size={21}
                        color={
                            error ? '#EF4444' : '#64748B'
                        }
                    />
                </View>

                <TextInput
                    ref={inputRef}
                    {...inputProps}
                    style={[
                        pageStyles.input,
                        style,
                    ]}
                    placeholderTextColor="#94A3B8"
                    selectionColor="#0EA5E9"
                    underlineColorAndroid="transparent"
                    blurOnSubmit={false}
                />
            </View>

            <View style={pageStyles.errorContainer}>
                {error ? (
                    <Text style={pageStyles.errorText}>
                        {error}
                    </Text>
                ) : null}
            </View>
        </View>
    );
}

const pageStyles = StyleSheet.create({
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
        paddingTop: 8,
        paddingBottom: 12,
    },

    formContent: {
        width: 'auto',
        marginHorizontal: 16,
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
    },

    backButton: {
        width: 36,
        height: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 3,
    },

    heading: {
        flexShrink: 1,
        color: '#0F172A',
        fontSize: 23,
        fontWeight: '900',
    },

    stepText: {
        marginLeft: 8,
        color: '#0EA5E9',
        fontSize: 13,
        fontWeight: '800',
    },

    description: {
        marginTop: 8,
        color: '#64748B',
        fontSize: 15,
        lineHeight: 22,
    },

    field: {
        width: '100%',
        marginBottom: 8,
    },

    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 7,
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
        fontWeight: '800',
    },

    inputContainer: {
        width: '100%',
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 13,
    },

    inputContainerError: {
        borderColor: '#EF4444',
    },

    iconContainer: {
        width: 48,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    input: {
        flex: 1,
        height: '100%',
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 14,
        color: '#0F172A',
        backgroundColor: 'transparent',
        borderWidth: 0,
        fontSize: 15,

        ...(Platform.OS === 'web'
            ? ({
                outlineStyle: 'none',
                outlineWidth: 0,
            } as object)
            : {}),
    },

    errorContainer: {
        minHeight: 20,
        justifyContent: 'center',
    },

    errorText: {
        marginTop: 4,
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
    },

    footer: {
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom:
            Platform.OS === 'ios' ? 12 : 14,
        backgroundColor: '#F8FAFC',
    },

    continueButton: {
        width: '88%',
        maxWidth: 420,
        minHeight: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0EA5E9',
        borderRadius: 13,
    },

    continueButtonText: {
        marginRight: 9,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
});