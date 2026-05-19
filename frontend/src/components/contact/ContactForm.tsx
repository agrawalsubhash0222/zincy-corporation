import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Keyboard,
    Modal,
    Pressable,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { submitContactEnquiry } from '@/services/contactService';
import { styles } from '@/styles/contact.styles';

const LOOKING_FOR_OPTIONS = [
    'Mobile App Development',
    'Web Designing & Development',
    'Billing & Invoicing Software',
    'Social Media Marketing',
    'Search Engine Optimization (SEO)',
    'Google Ads',
    'Customized Business Solutions',
];

export default function ContactForm() {
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const [fullNameError, setFullNameError] = useState('');
    const [mobileNumberError, setMobileNumberError] = useState('');
    const [lookingForError, setLookingForError] = useState('');

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const [successVisible, setSuccessVisible] = useState(false);
    const successScale = useRef(new Animated.Value(0.85)).current;
    const successOpacity = useRef(new Animated.Value(0)).current;

    const isAllSelected = selectedOptions.length === LOOKING_FOR_OPTIONS.length;

    const closeDropdown = () => setDropdownOpen(false);
    const [emailError, setEmailError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const showSuccessCard = () => {
        setSuccessVisible(true);

        successScale.setValue(0.85);
        successOpacity.setValue(0);

        Animated.parallel([
            Animated.spring(successScale, {
                toValue: 1,
                friction: 5,
                tension: 80,
                useNativeDriver: true,
            }),
            Animated.timing(successOpacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start();

        // AUTO CLOSE AFTER 5 SECONDS
        setTimeout(() => {
            setSuccessVisible(false);
        }, 5000);
    };

    const toggleOption = (option: string) => {
        setLookingForError('');

        setSelectedOptions(prev =>
            prev.includes(option)
                ? prev.filter(item => item !== option)
                : [...prev, option]
        );
    };

    const toggleSelectAll = () => {
        setLookingForError('');
        setSelectedOptions(isAllSelected ? [] : LOOKING_FOR_OPTIONS);
    };

    const validateForm = () => {
        let isValid = true;

        setFullNameError('');
        setMobileNumberError('');
        setEmailError('');
        setLookingForError('');

        if (!fullName.trim()) {
            setFullNameError('Name is required.');
            isValid = false;
        }

        if (!mobileNumber.trim()) {
            setMobileNumberError('Mobile number is required.');
            isValid = false;
        } else if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
            setMobileNumberError('Please enter a valid 10-digit mobile number.');
            isValid = false;
        }

        // EMAIL VALIDATION
        if (email.trim()) {
            const emailRegex =
                /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

            if (!emailRegex.test(email.trim())) {
                setEmailError('Please enter a valid email address.');
                isValid = false;
            }
        }

        if (selectedOptions.length === 0) {
            setLookingForError('Please select at least one service.');
            isValid = false;
        }

        return isValid;
    };
    const handleSubmit = async () => {
        closeDropdown();
        setSubmitError('');

        if (!validateForm()) return;

        try {
            setLoading(true);

            await submitContactEnquiry({
                fullName: fullName.trim(),
                mobileNumber: mobileNumber.trim(),
                email: email.trim(),
                lookingFor: selectedOptions,
                message: message.trim(),
            });

            setFullName('');
            setMobileNumber('');
            setEmail('');
            setMessage('');
            setSelectedOptions([]);

            showSuccessCard();
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.response?.data ||
                'Something went wrong. Please try again.';

            setSubmitError(
                typeof message === 'string'
                    ? message
                    : 'Unable to submit enquiry. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const selectedText =
        selectedOptions.length === 0
            ? 'Select services'
            : isAllSelected
                ? 'All services selected'
                : `${selectedOptions.length} services selected`;

    return (
        <View style={styles.card}>
            <Text style={styles.label}>
                Full Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
                style={[styles.input, fullNameError && styles.inputError]}
                placeholder="Enter your name"
                placeholderTextColor="#64748B"
                value={fullName}
                onChangeText={text => {
                    setFullName(text);
                    setFullNameError('');
                }}
                onFocus={closeDropdown}
            />
            {!!fullNameError && <Text style={styles.errorText}>{fullNameError}</Text>}

            <Text style={styles.label}>
                Mobile Number <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
                style={[styles.input, mobileNumberError && styles.inputError]}
                placeholder="Enter your mobile number"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={text => {
                    setMobileNumber(text.replace(/[^0-9]/g, ''));
                    setMobileNumberError('');
                }}
                onFocus={closeDropdown}
            />
            {!!mobileNumberError && (
                <Text style={styles.errorText}>{mobileNumberError}</Text>
            )}

            <Text style={styles.label}>Email</Text>

            <TextInput
                style={[styles.input, emailError && styles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={text => {
                    setEmail(text);
                    setEmailError('');
                }}
                onFocus={closeDropdown}
            />

            {!!emailError && (
                <Text style={styles.errorText}>{emailError}</Text>
            )}

            <Text style={styles.label}>
                Looking For <Text style={styles.requiredStar}>*</Text>
            </Text>

            <Pressable
                style={[styles.dropdownInput, lookingForError && styles.inputError]}
                onPress={() => {
                    Keyboard.dismiss();
                    setDropdownOpen(prev => !prev);
                }}
            >
                <Text
                    style={[
                        styles.dropdownText,
                        selectedOptions.length === 0 && styles.dropdownPlaceholder,
                    ]}
                    numberOfLines={1}
                >
                    {selectedText}
                </Text>

                <Ionicons
                    name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#455B7B"
                />
            </Pressable>

            {!!lookingForError && (
                <Text style={styles.errorText}>{lookingForError}</Text>
            )}

            {dropdownOpen && (
                <View style={styles.dropdownBox}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.selectAllRow}
                        onPress={toggleSelectAll}
                    >
                        <View style={[styles.checkbox, isAllSelected && styles.checkboxActive]}>
                            {isAllSelected && <Text style={styles.checkMark}>✓</Text>}
                        </View>

                        <Text style={styles.checkboxText}>Select All</Text>
                    </TouchableOpacity>

                    <View style={styles.checkboxOptionsWrapper}>
                        {LOOKING_FOR_OPTIONS.map(option => {
                            const isSelected = selectedOptions.includes(option);

                            return (
                                <TouchableOpacity
                                    key={option}
                                    activeOpacity={0.8}
                                    style={styles.checkboxRow}
                                    onPress={() => toggleOption(option)}
                                >
                                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                                    </View>

                                    <Text style={styles.checkboxText}>{option}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            <Text style={styles.label}>Message</Text>

            <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Tell us more about your requirement (optional)"
                placeholderTextColor="#64748B"
                multiline
                value={message}
                onChangeText={setMessage}
                onFocus={closeDropdown}
            />

            {!!submitError && (
                <Text style={styles.errorText}>{submitError}</Text>
            )}

            <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Submitting...' : 'Submit Enquiry'}
                </Text>
            </TouchableOpacity>

            <Modal
                visible={successVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSuccessVisible(false)}
            >
                <View style={styles.successOverlay}>
                    <Animated.View
                        style={[
                            styles.successCard,
                            {
                                opacity: successOpacity,
                                transform: [{ scale: successScale }],
                            },
                        ]}
                    >
                        <View style={styles.successIconCircle}>
                            <Ionicons name="checkmark" size={34} color="#FFFFFF" />
                        </View>

                        <Text style={styles.successTitle}>Enquiry Submitted Successfully</Text>

                        <Text style={styles.successMessage}>
                            Thank you for contacting Zincy Corporation Pvt. Ltd. We have received your
                            enquiry, and our team will review your requirements and get back to
                            you shortly.
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.successButton}
                            onPress={() => setSuccessVisible(false)}
                        >
                            <Text style={styles.successButtonText}>Okay, Got It</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}