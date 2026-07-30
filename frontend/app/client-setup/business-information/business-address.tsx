import { useClientSetup } from '@/context/ClientSetupContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
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

export default function BusinessAddressScreen() {
    const { data, updateData } = useClientSetup();
    const scrollRef = useRef<ScrollView>(null);

    const [errors, setErrors] = useState<any>({});
    const [fieldPositions, setFieldPositions] = useState<any>({});

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

    const validate = () => {
        const newErrors: any = {};

        if (!data.addressLine1?.trim()) {
            newErrors.addressLine1 = 'Address Line 1 is required';
        }

        if (!data.addressLine2?.trim()) {
            newErrors.addressLine2 = 'Address Line 2 is required';
        }

        if (!data.city?.trim()) {
            newErrors.city = 'City is required';
        }

        if (!data.state?.trim()) {
            newErrors.state = 'State is required';
        }

        if (!/^\d{6}$/.test(data.pincode || '')) {
            newErrors.pincode = 'Enter valid 6-digit pincode';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        if (!validate()) {
            Alert.alert('Invalid Details', 'Please fill all mandatory fields.');
            return;
        }

        router.push('/client-setup/business-information/tax-legal');
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

                        <Text style={styles.title}>Business Address</Text>
                    </View>

                    <Text style={styles.subtitle}>
                        Step 3 of 4 • Complete business address
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.infoBox}>
                            <Ionicons name="location-outline" size={26} color="#0284C7" />

                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoTitle}>
                                    Where is your business located?
                                </Text>

                                <Text style={styles.infoText}>
                                    This address will be used in your business application, invoice,
                                    contact page, and customer communication.
                                </Text>
                            </View>
                        </View>

                        <Input
                            field="addressLine1"
                            label="Address Line 1"
                            value={data.addressLine1 || ''}
                            placeholder="Shop no, building, street"
                            error={errors.addressLine1}
                            setFieldPositions={setFieldPositions}
                            onFocus={scrollToInput}
                            onChangeText={(value) => {
                                updateData({ addressLine1: value });
                                setErrors((prev: any) => ({ ...prev, addressLine1: '' }));
                            }}
                        />

                        <Input
                            field="addressLine2"
                            label="Address Line 2"
                            value={data.addressLine2 || ''}
                            placeholder="Area, landmark"
                            error={errors.addressLine2}
                            setFieldPositions={setFieldPositions}
                            onFocus={scrollToInput}
                            onChangeText={(value) => {
                                updateData({ addressLine2: value });
                                setErrors((prev: any) => ({ ...prev, addressLine2: '' }));
                            }}
                        />

                        <Input
                            field="city"
                            label="City"
                            value={data.city || ''}
                            placeholder="Enter city"
                            error={errors.city}
                            setFieldPositions={setFieldPositions}
                            onFocus={scrollToInput}
                            onChangeText={(value) => {
                                updateData({ city: value });
                                setErrors((prev: any) => ({ ...prev, city: '' }));
                            }}
                        />

                        <Input
                            field="state"
                            label="State"
                            value={data.state || ''}
                            placeholder="Enter state"
                            error={errors.state}
                            setFieldPositions={setFieldPositions}
                            onFocus={scrollToInput}
                            onChangeText={(value) => {
                                updateData({ state: value });
                                setErrors((prev: any) => ({ ...prev, state: '' }));
                            }}
                        />

                        <Input
                            field="pincode"
                            label="Pincode"
                            value={data.pincode || ''}
                            placeholder="Enter pincode"
                            keyboardType="number-pad"
                            maxLength={6}
                            error={errors.pincode}
                            setFieldPositions={setFieldPositions}
                            onFocus={scrollToInput}
                            onChangeText={(value) => {
                                updateData({
                                    pincode: value.replace(/\D/g, '').slice(0, 6),
                                });
                                setErrors((prev: any) => ({ ...prev, pincode: '' }));
                            }}
                        />
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

function Input({
    field,
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    maxLength,
    error,
    setFieldPositions,
    onFocus,
}: {
    field: string;
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'number-pad';
    maxLength?: number;
    error?: string;
    setFieldPositions: React.Dispatch<React.SetStateAction<any>>;
    onFocus: (field: string) => void;
}) {
    return (
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
                {label} <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType={keyboardType}
                maxLength={maxLength}
                style={[styles.input, error && styles.inputError]}
                onFocus={() => onFocus(field)}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    scroll: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 50,
    },

    headerRow: {
        marginTop: 0,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    backButton: {
        marginRight: 12,
    },

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

    inputGroup: {
        marginBottom: 18,
    },

    label: {
        marginBottom: 8,
        color: '#334155',
        fontWeight: '800',
        fontSize: 14,
    },

    required: {
        color: '#EF4444',
    },

    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '600',
    },

    inputError: {
        borderColor: '#EF4444',
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