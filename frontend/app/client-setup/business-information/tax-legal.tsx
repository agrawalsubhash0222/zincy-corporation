import { useClientSetup } from '@/context/ClientSetupContext';
import { saveClientBusinessSetup } from '@/services/clientBusinessSetupService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GST_OPTIONS = ['Yes', 'No'] as const;

type GstOption = (typeof GST_OPTIONS)[number];

type FormErrors = {
    gstRegistered?: string;
    gstNumber?: string;
    panNumber?: string;
};

type FieldPositions = Record<string, number>;

const normalizeText = (value: unknown): string => {
    return typeof value === 'string' ? value.trim() : '';
};

const normalizeContacts = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => String(item ?? '').trim())
        .filter(Boolean);
};

export default function TaxBusinessScreen() {
    const { data, updateData } = useClientSetup();

    const scrollRef = useRef<ScrollView>(null);

    const [errors, setErrors] = useState<FormErrors>({});
    const [fieldPositions, setFieldPositions] =
        useState<FieldPositions>({});
    const [saving, setSaving] = useState(false);

    const gstRegistered = normalizeText(
        data.gstRegistered,
    ) as GstOption | '';

    const scrollToInput = (field: string) => {
        const position = fieldPositions[field];

        if (position === undefined) {
            return;
        }

        setTimeout(() => {
            scrollRef.current?.scrollTo({
                y: Math.max(0, position - 110),
                animated: true,
            });
        }, 180);
    };

    const validateGST = (gstNumber: string): boolean => {
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
            gstNumber.trim(),
        );
    };

    const validatePAN = (panNumber: string): boolean => {
        if (!panNumber) {
            return true;
        }

        return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
            panNumber.trim(),
        );
    };

    const validate = (): boolean => {
        const validationErrors: FormErrors = {};

        if (!gstRegistered) {
            validationErrors.gstRegistered =
                'Please select GST registration status';
        }

        if (
            gstRegistered === 'Yes' &&
            !validateGST(normalizeText(data.gstNumber))
        ) {
            validationErrors.gstNumber =
                'Enter a valid 15-character GST number';
        }

        if (!validatePAN(normalizeText(data.panNumber))) {
            validationErrors.panNumber =
                'Enter a valid 10-character PAN number';
        }

        setErrors(validationErrors);

        return Object.keys(validationErrors).length === 0;
    };

    const updateField = (
        field: string,
        value: string,
    ) => {
        updateData({
            [field]: value,
        });

        setErrors((currentErrors) => ({
            ...currentErrors,
            [field]: undefined,
        }));
    };

    const handleGstSelection = (option: GstOption) => {
        updateData({
            gstRegistered: option,
            ...(option === 'No'
                ? {
                    gstNumber: '',
                }
                : {}),
        });

        setErrors((currentErrors) => ({
            ...currentErrors,
            gstRegistered: undefined,
            gstNumber:
                option === 'No'
                    ? undefined
                    : currentErrors.gstNumber,
        }));
    };

    const handleSave = async () => {
        if (saving) {
            return;
        }

        if (!validate()) {
            Alert.alert(
                'Invalid Details',
                'Please fix the highlighted fields before continuing.',
            );
            return;
        }

        const onboardingRequestId = Number(
            data.onboardingRequestId,
        );

        if (
            !Number.isFinite(onboardingRequestId) ||
            onboardingRequestId <= 0
        ) {
            Alert.alert(
                'Unable to Save',
                'Onboarding request ID is missing. Please reopen this setup from your approved onboarding request.',
            );
            return;
        }

        const payload = {
            onboardingRequestId,

            businessName: normalizeText(
                data.businessName,
            ),

            ownerName: normalizeText(
                data.ownerName,
            ),

            ownerContact: normalizeText(
                data.ownerContact,
            ),

            ownerEmail: normalizeText(
                data.ownerEmail,
            ),

            secondaryContact: normalizeText(
                data.secondaryContact,
            ),

            contacts: normalizeContacts(
                data.contacts,
            ),

            email: normalizeText(
                data.email,
            ),

            businessEmail: normalizeText(
                data.email,
            ),

            whatsappContact: normalizeText(
                data.whatsappContact,
            ),

            businessType: normalizeText(
                data.businessType,
            ),

            businessLogo: normalizeText(
                data.businessLogo,
            ),

            businessLogoUrl: normalizeText(
                data.businessLogo,
            ),

            addressLine1: normalizeText(
                data.addressLine1,
            ),

            addressLine2: normalizeText(
                data.addressLine2,
            ),

            city: normalizeText(
                data.city,
            ),

            state: normalizeText(
                data.state,
            ),

            pincode: normalizeText(
                data.pincode,
            ),

            gstRegistered:
                data.gstRegistered === 'Yes',

            gstNumber:
                data.gstRegistered === 'Yes'
                    ? normalizeText(data.gstNumber)
                    : '',

            panNumber: normalizeText(
                data.panNumber,
            ),

            msmeNumber: normalizeText(
                data.msmeNumber,
            ),

            udyamNumber: normalizeText(
                data.msmeNumber,
            ),

            fssaiNumber: normalizeText(
                data.fssaiNumber,
            ),

            fssaiLicenseNumber: normalizeText(
                data.fssaiNumber,
            ),
        };

        try {
            setSaving(true);

            console.log(
                'CLIENT SETUP PAYLOAD:',
                JSON.stringify(payload, null, 2),
            );

            await saveClientBusinessSetup(payload);

            /*
             * The backend has now:
             * 1. Saved client_business_setup
             * 2. Updated onboarding_requests.client_setup_completed = 1
             */

            router.replace({
                pathname: '/client-setup/completion/success',
                params: {
                    onboardingRequestId:
                        String(onboardingRequestId),
                },
            });
        } catch (error) {
            console.error(
                'Client business setup save failed:',
                error,
            );

            const message =
                error instanceof Error &&
                    error.message
                    ? error.message
                    : 'Your business details could not be saved. Please check your connection and try again.';

            Alert.alert(
                'Unable to Save',
                message,
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView
            style={styles.container}
            edges={['top', 'bottom']}
        >
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
                keyboardVerticalOffset={
                    Platform.OS === 'ios' ? 70 : 0
                }
            >
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={
                        styles.scrollContent
                    }
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    <View style={styles.contentWrap}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            activeOpacity={0.75}
                            onPress={() => router.back()}
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                        >
                            <Ionicons
                                name="arrow-back"
                                size={22}
                                color="#0F172A"
                            />
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <Text style={styles.title}>
                                Tax & Legal Information
                            </Text>

                            <Text style={styles.subtitle}>
                                Step 4 of 4 · Compliance and
                                billing setup
                            </Text>
                        </View>
                    </View>

                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: '100%' }]} />
                    </View>

                    <View style={styles.card}>
                        <View style={styles.infoBox}>
                            <View style={styles.infoIconWrap}>
                                <Ionicons
                                    name="document-text-outline"
                                    size={20}
                                    color="#0284C7"
                                />
                            </View>

                            <View style={styles.infoContent}>
                                <Text style={styles.infoTitle}>
                                    Business compliance
                                    details
                                </Text>

                                <Text style={styles.infoText}>
                                    These details help with
                                    billing, invoices, tax
                                    records and future
                                    verification.
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.label}>
                            GST Registered?
                            <Text style={styles.required}>
                                {' '}
                                *
                            </Text>
                        </Text>

                        <View style={styles.radioRow}>
                            {GST_OPTIONS.map(
                                (option, index) => {
                                    const selected =
                                        gstRegistered ===
                                        option;

                                    return (
                                        <TouchableOpacity
                                            key={option}
                                            activeOpacity={0.8}
                                            style={[
                                                styles.radioOption,
                                                index === 0
                                                    ? styles.radioOptionSpacing
                                                    : null,
                                                selected
                                                    ? styles.radioOptionSelected
                                                    : null,
                                            ]}
                                            onPress={() =>
                                                handleGstSelection(
                                                    option,
                                                )
                                            }
                                        >
                                            <Ionicons
                                                name={
                                                    selected
                                                        ? 'radio-button-on'
                                                        : 'radio-button-off'
                                                }
                                                size={19}
                                                color={
                                                    selected
                                                        ? '#0284C7'
                                                        : '#64748B'
                                                }
                                            />

                                            <Text
                                                style={[
                                                    styles.radioText,
                                                    selected
                                                        ? styles.radioTextSelected
                                                        : null,
                                                ]}
                                            >
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                },
                            )}
                        </View>

                        {errors.gstRegistered ? (
                            <View style={styles.errorRow}>
                                <Ionicons name="alert-circle" size={13} color="#EF4444" />
                                <Text style={styles.errorText}>
                                    {errors.gstRegistered}
                                </Text>
                            </View>
                        ) : null}

                        {gstRegistered === 'Yes' ? (
                            <View style={styles.fieldSpacing}>
                                <InputField
                                    field="gstNumber"
                                    label="GST Number"
                                    required
                                    value={normalizeText(
                                        data.gstNumber,
                                    )}
                                    placeholder="Example: 22AAAAA0000A1Z5"
                                    autoCapitalize="characters"
                                    maxLength={15}
                                    error={errors.gstNumber}
                                    setFieldPositions={
                                        setFieldPositions
                                    }
                                    onFocus={scrollToInput}
                                    onChangeText={(value) =>
                                        updateField(
                                            'gstNumber',
                                            value
                                                .toUpperCase()
                                                .replace(
                                                    /\s/g,
                                                    '',
                                                ),
                                        )
                                    }
                                />
                            </View>
                        ) : null}

                        <View style={styles.divider} />

                        <InputField
                            field="panNumber"
                            label="PAN Number"
                            value={normalizeText(
                                data.panNumber,
                            )}
                            placeholder="Example: ABCDE1234F"
                            autoCapitalize="characters"
                            maxLength={10}
                            error={errors.panNumber}
                            setFieldPositions={
                                setFieldPositions
                            }
                            onFocus={scrollToInput}
                            onChangeText={(value) =>
                                updateField(
                                    'panNumber',
                                    value
                                        .toUpperCase()
                                        .replace(/\s/g, ''),
                                )
                            }
                        />

                        <Text style={styles.helperText}>
                            Optional, but useful for KYC,
                            vendor setup and payment
                            verification.
                        </Text>

                        <View style={styles.fieldSpacing}>
                            <InputField
                                field="msmeNumber"
                                label="MSME / Udyam Registration Number"
                                value={normalizeText(
                                    data.msmeNumber,
                                )}
                                placeholder="Optional registration number"
                                autoCapitalize="characters"
                                setFieldPositions={
                                    setFieldPositions
                                }
                                onFocus={scrollToInput}
                                onChangeText={(value) =>
                                    updateField(
                                        'msmeNumber',
                                        value.toUpperCase(),
                                    )
                                }
                            />
                        </View>

                        <Text style={styles.helperText}>
                            Optional, helpful for B2B benefits
                            and business verification.
                        </Text>

                        <View style={styles.fieldSpacing}>
                            <InputField
                                field="fssaiNumber"
                                label="FSSAI License Number"
                                value={normalizeText(
                                    data.fssaiNumber,
                                )}
                                placeholder="Only for food-related businesses"
                                keyboardType="number-pad"
                                maxLength={14}
                                setFieldPositions={
                                    setFieldPositions
                                }
                                onFocus={scrollToInput}
                                onChangeText={(value) =>
                                    updateField(
                                        'fssaiNumber',
                                        value
                                            .replace(
                                                /\D/g,
                                                '',
                                            )
                                            .slice(0, 14),
                                    )
                                }
                            />
                        </View>

                        <Text style={styles.helperText}>
                            Required only for food, grocery,
                            restaurant or edible-product
                            businesses.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            saving
                                ? styles.saveButtonDisabled
                                : null,
                        ]}
                        activeOpacity={0.85}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Text style={styles.saveButtonText}>
                            {saving
                                ? 'Saving...'
                                : 'Save & Continue'}
                        </Text>

                        <Ionicons
                            name={
                                saving
                                    ? 'hourglass-outline'
                                    : 'checkmark-circle-outline'
                            }
                            size={19}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

type InputFieldProps = {
    field: string;
    label: string;
    value: string;
    placeholder: string;
    onChangeText: (value: string) => void;
    setFieldPositions: React.Dispatch<
        React.SetStateAction<FieldPositions>
    >;
    onFocus: (field: string) => void;
    required?: boolean;
    error?: string;
    maxLength?: number;
    keyboardType?: 'default' | 'number-pad';
    autoCapitalize?:
    | 'none'
    | 'sentences'
    | 'words'
    | 'characters';
};

function InputField({
    field,
    label,
    value,
    placeholder,
    onChangeText,
    setFieldPositions,
    onFocus,
    required = false,
    error,
    maxLength,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
}: InputFieldProps) {
    return (
        <View
            style={styles.inputGroup}
            onLayout={(event) => {
                const { y } = event.nativeEvent.layout;

                setFieldPositions(
                    (currentPositions) => ({
                        ...currentPositions,
                        [field]: y,
                    }),
                );
            }}
        >
            <Text style={styles.label}>
                {label}

                {required ? (
                    <Text style={styles.required}>
                        {' '}
                        *
                    </Text>
                ) : null}
            </Text>

            <TextInput
                value={value}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                autoCorrect={false}
                maxLength={maxLength}
                onFocus={() => onFocus(field)}
                onChangeText={onChangeText}
                style={[
                    styles.input,
                    error ? styles.inputError : null,
                ]}
            />

            {error ? (
                <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color="#EF4444" />
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },

    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
        alignItems: 'center',
    },

    contentWrap: {
        width: '100%',
        maxWidth: 520,
    },

    header: {
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    headerContent: {
        flex: 1,
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
        lineHeight: 18,
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
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
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
        padding: 14,
        marginBottom: 22,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        borderRadius: 16,
        backgroundColor: '#F0F9FF',
    },

    infoIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },

    infoContent: {
        flex: 1,
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
        fontWeight: '500',
        color: '#64748B',
    },

    label: {
        marginBottom: 10,
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },

    required: {
        color: '#EF4444',
    },

    radioRow: {
        flexDirection: 'row',
    },

    radioOption: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    radioOptionSpacing: {
        marginRight: 12,
    },

    radioOptionSelected: {
        borderColor: '#38BDF8',
        backgroundColor: '#F0F9FF',
    },

    radioText: {
        marginLeft: 7,
        fontSize: 13.5,
        fontWeight: '700',
        color: '#64748B',
    },

    radioTextSelected: {
        color: '#0284C7',
    },

    fieldSpacing: {
        marginTop: 18,
    },

    inputGroup: {
        width: '100%',
    },

    input: {
        minHeight: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 14.5,
        fontWeight: '500',
        color: '#0F172A',
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
        fontSize: 12,
        fontWeight: '600',
        color: '#EF4444',
    },

    helperText: {
        marginTop: 7,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '500',
        color: '#64748B',
    },

    divider: {
        height: 1,
        marginVertical: 22,
        backgroundColor: '#E2E8F0',
    },

    saveButton: {
        height: 52,
        marginTop: 24,
        borderRadius: 14,
        backgroundColor: '#0EA5E9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },

    saveButtonDisabled: {
        opacity: 0.65,
    },

    saveButtonText: {
        fontSize: 15.5,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});