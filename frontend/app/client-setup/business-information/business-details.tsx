import { useClientSetup } from '@/context/ClientSetupContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
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

const BUSINESS_TYPES = ['Retail', 'Wholesale', 'Both'];

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

export default function ContactsScreen() {
    const { data, updateData } = useClientSetup();
    const scrollRef = useRef<ScrollView>(null);

    const [errors, setErrors] = useState<any>({});
    const [fieldPositions, setFieldPositions] = useState<any>({});

    const contacts = data.contacts?.length ? data.contacts : [''];

    useEffect(() => {
        updateData({
            contacts: data.contacts?.length ? data.contacts : [''],
            email: data.email || '',
            whatsappContact: data.whatsappContact || '',
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

    const isValidMobile = (value: string) => /^[6-9]\d{9}$/.test(value.trim());

    const isValidEmail = (value: string) =>
        !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

    const updateContact = (index: number, value: string) => {
        const updated = [...contacts];
        updated[index] = value.replace(/\D/g, '').slice(0, 10);
        updateData({ contacts: updated });
        setErrors((prev: any) => ({ ...prev, [`contact_${index}`]: '' }));
    };

    const addContact = () => {
        updateData({ contacts: [...contacts, ''] });
    };

    const removeContact = (index: number) => {
        const updated = contacts.filter((_, i) => i !== index);
        updateData({ contacts: updated.length ? updated : [''] });
    };

    const validate = () => {
        const newErrors: any = {};

        if (!data.businessName?.trim()) {
            newErrors.businessName = 'Business name is required';
        }

        contacts.forEach((contact, index) => {
            if (!isValidMobile(contact)) {
                newErrors[`contact_${index}`] = 'Enter valid 10-digit mobile number';
            }
        });

        if (!isValidEmail(data.email || '')) {
            newErrors.email = 'Enter valid business email';
        }

        if (!data.businessType) {
            newErrors.businessType = 'Select business type';
        }

        if (!isValidMobile(data.whatsappContact || '')) {
            newErrors.whatsappContact = 'Enter valid WhatsApp number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const pickLogo = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow photo library permission.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
        });

        if (!result.canceled) {
            updateData({ businessLogo: result.assets[0].uri });
        }
    };

    const handleContinue = () => {
        if (!validate()) {
            Alert.alert('Invalid Details', 'Please fix the highlighted fields.');
            return;
        }

        router.push('/client-setup/business-information/business-address');
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
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={26} color="#0F172A" />
                        </TouchableOpacity>

                        <Text style={styles.title}>Business Details</Text>
                    </View>

                    <Text style={styles.subtitle}>Step 2 of 4 - Business contact and profile</Text>

                    <View style={styles.card}>
                        <View style={styles.infoBox}>
                            <Ionicons name="storefront-outline" size={28} color="#0284C7" />

                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoTitle}>
                                    Setup customer-facing business details
                                </Text>
                                <Text style={styles.infoText}>
                                    Add the public business details that customers will see.
                                </Text>
                            </View>
                        </View>

                        <InputField
                            field="businessName"
                            label="Business Name *"
                            value={data.businessName || ''}
                            placeholder="Enter business name"
                            error={errors.businessName}
                            setFieldPositions={setFieldPositions}
                            onFocus={scrollToInput}
                            onChangeText={(value) => {
                                updateData({ businessName: value });
                                setErrors((prev: any) => ({ ...prev, businessName: '' }));
                            }}
                        />

                        {contacts.map((contact, index) => (
                            <View
                                key={`contact-${index}`}
                                style={styles.inputGroup}
                                onLayout={(event) => {
                                    const y = event.nativeEvent.layout.y;
                                    setFieldPositions((prev: any) => ({
                                        ...prev,
                                        [`contact_${index}`]: y,
                                    }));
                                }}
                            >
                                <Text style={styles.label}>
                                    Business Contact {index + 1}
                                    <Text style={styles.required}> *</Text>
                                </Text>

                                <View style={styles.row}>
                                    <TextInput
                                        value={contact || ''}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        placeholder="Enter 10-digit mobile number"
                                        placeholderTextColor="#94A3B8"
                                        onFocus={() => scrollToInput(`contact_${index}`)}
                                        onChangeText={(value) => updateContact(index, value)}
                                        style={[
                                            styles.input,
                                            { flex: 1 },
                                            errors[`contact_${index}`] ? styles.inputError : null,
                                        ]}
                                    />

                                    {contacts.length > 1 ? (
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => removeContact(index)}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#DC2626" />
                                        </TouchableOpacity>
                                    ) : null}
                                </View>

                                {errors[`contact_${index}`] ? (
                                    <Text style={styles.errorText}>
                                        {errors[`contact_${index}`]}
                                    </Text>
                                ) : null}
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addButton} onPress={addContact}>
                            <Ionicons name="add-circle-outline" size={20} color="#0284C7" />
                            <Text style={styles.addButtonText}>Add Another Contact</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <InputField
                            field="email"
                            label="Business Email (Optional)"
                            value={data.email || ''}
                            placeholder="Enter business email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                            setFieldPositions={setFieldPositions}
                            onFocus={scrollToInput}
                            onChangeText={(value) => {
                                updateData({ email: value });
                                setErrors((prev: any) => ({ ...prev, email: '' }));
                            }}
                        />

                        <Text style={styles.label}>
                            Business Type
                            <Text style={styles.required}> *</Text>
                        </Text>

                        <View style={styles.radioRow}>
                            {BUSINESS_TYPES.map((type) => {
                                const selected = data.businessType === type;

                                return (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.radioOption, selected ? styles.radioSelected : null]}
                                        onPress={() => {
                                            updateData({ businessType: type });
                                            setErrors((prev: any) => ({ ...prev, businessType: '' }));
                                        }}
                                    >
                                        <Ionicons
                                            name={selected ? 'radio-button-on' : 'radio-button-off'}
                                            size={18}
                                            color={selected ? '#0284C7' : '#64748B'}
                                        />
                                        <Text
                                            style={[
                                                styles.radioText,
                                                selected ? styles.radioTextSelected : null,
                                            ]}
                                        >
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {errors.businessType ? (
                            <Text style={styles.errorText}>{errors.businessType}</Text>
                        ) : null}

                        <View style={{ height: 18 }} />

                        <InputField
                            field="whatsappContact"
                            label="WhatsApp Integration Number *"
                            value={data.whatsappContact || ''}
                            placeholder="Enter WhatsApp number"
                            keyboardType="phone-pad"
                            maxLength={10}
                            error={errors.whatsappContact}
                            setFieldPositions={setFieldPositions}
                            onFocus={scrollToInput}
                            onChangeText={(value) => {
                                updateData({
                                    whatsappContact: value.replace(/\D/g, '').slice(0, 10),
                                });
                                setErrors((prev: any) => ({ ...prev, whatsappContact: '' }));
                            }}
                        />

                        <Text style={styles.label}>Business Logo</Text>

                        <TouchableOpacity style={styles.logoBox} activeOpacity={0.8} onPress={pickLogo}>
                            <Ionicons
                                name={data.businessLogo ? 'checkmark-circle' : 'cloud-upload-outline'}
                                size={24}
                                color="#0284C7"
                            />

                            <Text style={styles.logoText}>
                                {data.businessLogo ? 'Logo Selected' : 'Upload Business Logo (Optional)'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.nextButton} onPress={handleContinue}>
                        <Text style={styles.nextButtonText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function InputField({
    field,
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
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
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
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
                {label.replace(' *', '')}
                {label.endsWith('*') ? <Text style={styles.required}> *</Text> : null}
            </Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                maxLength={maxLength}
                onFocus={() => onFocus(field)}
                style={[styles.input, error ? styles.inputError : null]}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    // webConstrained keeps this from stretching edge-to-edge
    // on wide browser windows; mobile padding is unchanged.
    scroll: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 50,
        ...webConstrained,
    },

    headerRow: {
        marginTop: 0,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    backButton: { marginRight: 12 },

    title: {
        flex: 1,
        fontSize: 27,
        fontWeight: '900',
        color: '#0F172A',
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
        marginBottom: 24,
    },

    infoTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0F172A',
    },

    infoText: {
        marginTop: 5,
        fontSize: 13,
        color: '#64748B',
        lineHeight: 19,
        fontWeight: '600',
    },

    inputGroup: { marginBottom: 18 },

    label: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '800',
        color: '#334155',
    },

    required: { color: '#EF4444' },

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

    inputError: { borderColor: '#EF4444' },

    errorText: {
        marginTop: 6,
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '700',
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    deleteButton: {
        width: 48,
        height: 48,
        marginLeft: 10,
        borderRadius: 14,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
    },

    addButton: {
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#38BDF8',
        backgroundColor: '#F0F9FF',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    addButtonText: {
        marginLeft: 8,
        color: '#0284C7',
        fontWeight: '900',
        fontSize: 15,
    },

    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 22,
    },

    radioRow: {
        flexDirection: 'row',
        gap: 10,
    },

    radioOption: {
        flex: 1,
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    radioSelected: {
        borderColor: '#38BDF8',
        backgroundColor: '#F0F9FF',
    },

    radioText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748B',
    },

    radioTextSelected: {
        color: '#0284C7',
    },

    logoBox: {
        height: 54,
        borderRadius: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#38BDF8',
        backgroundColor: '#F0F9FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    logoText: {
        color: '#0284C7',
        fontWeight: '800',
        fontSize: 14,
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