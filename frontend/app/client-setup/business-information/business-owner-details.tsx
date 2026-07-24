import { useClientSetup } from '@/context/ClientSetupContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
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

export default function BusinessInfoScreen() {
    const params = useLocalSearchParams();
    const { data, updateData } = useClientSetup();
    const scrollRef = useRef<ScrollView>(null);

    const [errors, setErrors] = useState<any>({});
    const [fieldPositions, setFieldPositions] = useState<any>({});

    const cleanMobile = (mobile: any) => {
        return String(mobile || '')
            .replace(/\D/g, '')
            .slice(-10);
    };

    useEffect(() => {
        updateData({
            onboardingRequestId: Number(params.onboardingRequestId),

            businessName: data.businessName || String(params.businessName || ''),
            ownerName: data.ownerName || String(params.ownerName || ''),
            ownerContact: data.ownerContact || cleanMobile(params.mobile),
            ownerEmail: data.ownerEmail || String(params.email || ''),
        });
    }, []);

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

    const validateName = (name: string) => /^[A-Za-z ]{3,50}$/.test(name.trim());
    const validateContact = (mobile: string) => /^[6-9]\d{9}$/.test(mobile.trim());
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    const handleContinue = () => {
        const newErrors: any = {};

        if (!validateName(data.ownerName || '')) {
            newErrors.ownerName = 'Enter a valid owner name';
        }

        if (!validateContact(data.ownerContact || '')) {
            newErrors.ownerContact = 'Enter a valid 10-digit mobile number';
        }

        if (!validateEmail(data.ownerEmail || '')) {
            newErrors.ownerEmail = 'Enter a valid email address';
        }

        if (data.secondaryContact && !validateContact(data.secondaryContact)) {
            newErrors.secondaryContact = 'Enter a valid 10-digit mobile number';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            Alert.alert('Invalid Details', 'Please fix the highlighted fields.');
            return;
        }

        router.push('/client-setup/business-information/business-details');
    };

    const renderInput = ({
        label,
        value,
        field,
        placeholder,
        keyboardType = 'default',
        mandatory = false,
        maxLength,
    }: any) => (
        <View
            style={styles.inputGroup}
            onLayout={(event) => {
                const y = event.nativeEvent.layout.y;
                setFieldPositions((prev: any) => ({
                    ...prev,
                    [field]: y,
                }));
            }}
        >
            <Text style={styles.label}>
                {label}
                {mandatory && <Text style={styles.required}> *</Text>}
            </Text>

            <View style={[styles.inputWrap, errors[field] && styles.inputError]}>
                <TextInput
                    value={value || ''}
                    onFocus={() => scrollToInput(field)}
                    onChangeText={(text) => {
                        const finalText =
                            keyboardType === 'phone-pad'
                                ? text.replace(/\D/g, '').slice(0, 10)
                                : text;

                        updateData({ [field]: finalText });
                        setErrors((prev: any) => ({ ...prev, [field]: '' }));
                    }}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
                />
            </View>

            {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            activeOpacity={0.75}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={26} color="#0F172A" />
                        </TouchableOpacity>

                        <Text style={styles.title}>Business Owner Details</Text>
                    </View>

                    <Text style={styles.subtitle}>
                        Step 1 of 4 • Owner contact information
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.infoBox}>
                            <Ionicons name="person-circle-outline" size={30} color="#0284C7" />

                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoTitle}>
                                    Confirm business owner details
                                </Text>
                                <Text style={styles.infoText}>
                                    These details are prefilled from the submitted onboarding request.
                                </Text>
                            </View>
                        </View>

                        {renderInput({
                            label: 'Business Owner Name',
                            value: data.ownerName,
                            field: 'ownerName',
                            placeholder: 'Enter business owner name',
                            mandatory: true,
                        })}

                        {renderInput({
                            label: 'Business Owner Contact',
                            value: data.ownerContact,
                            field: 'ownerContact',
                            placeholder: 'Enter 10-digit mobile number',
                            keyboardType: 'phone-pad',
                            mandatory: true,
                            maxLength: 10,
                        })}

                        {renderInput({
                            label: 'Business Owner Email',
                            value: data.ownerEmail,
                            field: 'ownerEmail',
                            placeholder: 'Enter owner email address',
                            keyboardType: 'email-address',
                            mandatory: true,
                        })}

                        {renderInput({
                            label: 'Secondary Contact (Optional)',
                            value: data.secondaryContact,
                            field: 'secondaryContact',
                            placeholder: 'Alternate contact number',
                            keyboardType: 'phone-pad',
                            maxLength: 10,
                        })}
                    </View>

                    <TouchableOpacity
                        style={styles.nextButton}
                        activeOpacity={0.85}
                        onPress={handleContinue}
                    >
                        <Text style={styles.nextButtonText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    scroll: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 50,
    },

    headerRow: {
        marginTop: 30,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    backButton: { marginRight: 12 },

    title: {
        fontSize: 27,
        fontWeight: '900',
        color: '#0F172A',
        flex: 1,
    },

    subtitle: {
        marginTop: 6,
        fontSize: 15,
        color: '#64748B',
        marginLeft: 38,
    },

    card: {
        marginTop: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },

    infoBox: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        marginBottom: 22,
    },

    infoTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0F172A',
    },

    infoText: {
        marginTop: 5,
        fontSize: 13,
        lineHeight: 19,
        color: '#64748B',
        fontWeight: '600',
    },

    inputGroup: { marginBottom: 18 },

    label: {
        color: '#334155',
        fontWeight: '800',
        fontSize: 14,
        marginBottom: 8,
    },

    required: { color: '#EF4444' },

    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 14,
    },

    inputError: { borderColor: '#EF4444' },

    input: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
        paddingRight: 48,
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '600',
    },

    errorText: {
        marginTop: 6,
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '700',
    },

    nextButton: {
        marginTop: 28,
        height: 54,
        borderRadius: 16,
        backgroundColor: '#0EA5E9',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },

    nextButtonText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 16,
        marginRight: 8,
    },
});