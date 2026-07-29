import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
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

import { styles } from '@/styles/onboarding/businessDetails.styles';

export default function BusinessDetailsScreen() {
    const { data, updateData } = useOnboarding();
    const scrollRef = useRef<ScrollView>(null);

    const [businessName, setBusinessName] = useState(data.businessName || '');
    const [ownerName, setOwnerName] = useState(data.ownerName || '');
    const [mobile, setMobile] = useState(data.mobile || '');
    const [email, setEmail] = useState(data.email || '');

    const [fieldPositions, setFieldPositions] = useState<any>({});

    const [errors, setErrors] = useState({
        businessName: '',
        ownerName: '',
        mobile: '',
        email: '',
    });

    const scrollToInput = (field: string) => {
        const y = fieldPositions[field];

        if (y === undefined) return;

        setTimeout(() => {
            scrollRef.current?.scrollTo({
                y: Math.max(0, y - 110),
                animated: true,
            });
        }, 180);
    };

    const isValidEmail = (value: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    };

    const isValidIndianMobile = (value: string) => {
        return /^[6-9]\d{9}$/.test(value);
    };

    const handleContinue = () => {
        const finalBusinessName = businessName.trim();
        const finalOwnerName = ownerName.trim();
        const finalMobile = mobile.trim();
        const finalEmail = email.trim();

        const newErrors = {
            businessName: '',
            ownerName: '',
            mobile: '',
            email: '',
        };

        if (!finalBusinessName) {
            newErrors.businessName = 'Please enter business name.';
        } else if (finalBusinessName.length < 3) {
            newErrors.businessName = 'Business name should be at least 3 characters.';
        }

        if (!finalOwnerName) {
            newErrors.ownerName = 'Please enter owner name.';
        } else if (finalOwnerName.length < 3) {
            newErrors.ownerName = 'Owner name should be at least 3 characters.';
        }

        if (!finalMobile) {
            newErrors.mobile = 'Please enter mobile number.';
        } else if (!isValidIndianMobile(finalMobile)) {
            newErrors.mobile = 'Please enter a valid 10-digit Indian mobile number.';
        }

        if (!finalEmail) {
            newErrors.email = 'Please enter email address.';
        } else if (!isValidEmail(finalEmail)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        setErrors(newErrors);

        const hasError = Object.values(newErrors).some((error) => error !== '');

        if (hasError) {
            return;
        }

        updateData({
            businessName: finalBusinessName,
            ownerName: finalOwnerName,
            mobile: finalMobile,
            email: finalEmail,
        });

        router.push('/onboarding/business-information/project-requirement');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 50 }}
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
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    flex: 1,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    activeOpacity={0.8}
                                    style={{ marginRight: 12 }}
                                >
                                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                                </TouchableOpacity>

                                <Text
                                    style={{
                                        fontSize: 24,
                                        fontWeight: '900',
                                        color: '#0F172A',
                                    }}
                                >
                                    Business Details
                                </Text>
                            </View>

                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: '900',
                                    color: '#0EA5E9',
                                }}
                            >
                                Step 1 of 4
                            </Text>
                        </View>

                        <Text
                            style={{
                                marginTop: 12,
                                fontSize: 15,
                                color: '#64748B',
                                lineHeight: 22,
                            }}
                        >
                            Tell us about your business so we can recommend the right solution.
                        </Text>
                    </View>

                    <InputField
                        field="businessName"
                        label="Business Name"
                        icon="business-outline"
                        value={businessName}
                        placeholder="ABC Hardware Store"
                        error={errors.businessName}
                        setFieldPositions={setFieldPositions}
                        onFocus={scrollToInput}
                        onChangeText={(text) => {
                            setBusinessName(text);
                            setErrors((prev) => ({ ...prev, businessName: '' }));
                        }}
                    />

                    <InputField
                        field="ownerName"
                        label="Owner Name"
                        icon="person-outline"
                        value={ownerName}
                        placeholder="Rahul Kumar"
                        error={errors.ownerName}
                        setFieldPositions={setFieldPositions}
                        onFocus={scrollToInput}
                        onChangeText={(text) => {
                            setOwnerName(text);
                            setErrors((prev) => ({ ...prev, ownerName: '' }));
                        }}
                    />

                    <InputField
                        field="mobile"
                        label="Mobile Number"
                        icon="call-outline"
                        value={mobile}
                        placeholder="9876543210"
                        keyboardType="phone-pad"
                        maxLength={10}
                        error={errors.mobile}
                        setFieldPositions={setFieldPositions}
                        onFocus={scrollToInput}
                        onChangeText={(text) => {
                            const numbersOnly = text.replace(/\D/g, '').slice(0, 10);
                            setMobile(numbersOnly);
                            setErrors((prev) => ({ ...prev, mobile: '' }));
                        }}
                    />

                    <InputField
                        field="email"
                        label="Email Address"
                        icon="mail-outline"
                        value={email}
                        placeholder="owner@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                        setFieldPositions={setFieldPositions}
                        onFocus={scrollToInput}
                        onChangeText={(text) => {
                            setEmail(text);
                            setErrors((prev) => ({ ...prev, email: '' }));
                        }}
                    />
                </ScrollView>

                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.button}
                    onPress={handleContinue}
                >
                    <Text style={styles.buttonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

type InputProps = {
    field: string;
    label: string;
    placeholder: string;
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    onChangeText: (value: string) => void;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    maxLength?: number;
    error?: string;
    setFieldPositions: React.Dispatch<React.SetStateAction<any>>;
    onFocus: (field: string) => void;
};

function InputField({
    field,
    label,
    placeholder,
    icon,
    value,
    onChangeText,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    maxLength,
    error,
    setFieldPositions,
    onFocus,
}: InputProps) {
    return (
        <View
            style={styles.field}
            onLayout={(event) => {
                const y = event.nativeEvent.layout.y;
                setFieldPositions((prev: any) => ({
                    ...prev,
                    [field]: y,
                }));
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.label}>{label}</Text>
                <Text
                    style={{
                        color: '#EF4444',
                        fontSize: 16,
                        fontWeight: '900',
                        marginLeft: 3,
                    }}
                >
                    *
                </Text>
            </View>

            <View
                style={[
                    styles.inputContainer,
                    error
                        ? {
                            borderColor: '#EF4444',
                        }
                        : null,
                ]}
            >
                <Ionicons name={icon} size={20} color={error ? '#EF4444' : '#64748B'} />

                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    maxLength={maxLength}
                    onFocus={() => onFocus(field)}
                />
            </View>

            {error ? (
                <Text
                    style={{
                        marginTop: 6,
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#EF4444',
                    }}
                >
                    {error}
                </Text>
            ) : null}
        </View>
    );
}