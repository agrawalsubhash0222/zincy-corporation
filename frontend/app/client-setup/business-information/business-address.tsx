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
                    <View style={styles.contentWrap}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            activeOpacity={0.75}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={22} color="#0F172A" />
                        </TouchableOpacity>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>Business Address</Text>
                            <Text style={styles.subtitle}>
                                Step 3 of 4 · Complete business address
                            </Text>
                        </View>
                    </View>

                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: '75%' }]} />
                    </View>

                    <View style={styles.card}>
                        <View style={styles.infoBox}>
                            <View style={styles.infoIconWrap}>
                                <Ionicons name="location-outline" size={20} color="#0284C7" />
                            </View>

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

                        <View style={styles.row}>
                            <View style={styles.rowItem}>
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
                                    noMargin
                                />
                            </View>

                            <View style={styles.rowItem}>
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
                                    noMargin
                                />
                            </View>
                        </View>

                        <View style={styles.spacer} />

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
                            noMargin
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
                    </View>
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
    noMargin,
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
    noMargin?: boolean;
}) {
    return (
        <View
            style={[styles.inputGroup, noMargin && { marginBottom: 0 }]}
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

            {error ? (
                <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}
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
        paddingTop: 12,
        paddingBottom: 40,
        alignItems: 'center',
    },

    contentWrap: {
        width: '100%',
        maxWidth: 520,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.3,
    },

    subtitle: {
        marginTop: 4,
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },

    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E2E8F0',
        overflow: 'hidden',
        marginBottom: 24,
    },

    progressFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: '#0EA5E9',
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },

    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        marginBottom: 22,
    },

    infoIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },

    infoTitle: {
        fontSize: 14.5,
        fontWeight: '800',
        color: '#0F172A',
    },

    infoText: {
        marginTop: 4,
        fontSize: 12.5,
        lineHeight: 18,
        color: '#64748B',
        fontWeight: '500',
    },

    row: {
        flexDirection: 'row',
        gap: 12,
    },

    rowItem: {
        flex: 1,
    },

    spacer: {
        height: 18,
    },

    inputGroup: {
        marginBottom: 18,
    },

    label: {
        marginBottom: 7,
        color: '#334155',
        fontWeight: '700',
        fontSize: 13,
    },

    required: {
        color: '#EF4444',
    },

    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 14.5,
        color: '#0F172A',
        fontWeight: '500',
    },

    inputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },

    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },

    errorText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
    },

    nextButton: {
        marginTop: 24,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#0EA5E9',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },

    nextButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15.5,
    },
});