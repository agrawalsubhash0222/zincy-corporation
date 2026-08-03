import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { getProfile, updateProfile } from '@/services/profile/profileService';
import { styles } from '@/styles/profile/editProfile.styles';
import { getSession, updateSessionUser } from '@/utils/session';

export default function EditProfileScreen() {
    const [mobile, setMobile] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const session = await getSession();

            if (!session?.mobile) {
                router.replace('/auth/login');
                return;
            }

            setMobile(session.mobile);

            const profile = await getProfile();

            setFirstName(profile.firstName || '');
            setLastName(profile.lastName || '');
            setEmail(profile.email || '');
        } catch (error) {
            Alert.alert('Error', 'Unable to load profile.');
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        if (!firstName.trim()) {
            Alert.alert('Required', 'First name is required.');
            return false;
        }

        if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return false;
        }

        return true;
    };

    const handleUpdateProfile = async () => {
        if (!validate()) return;

        try {
            setSaving(true);

            const updatedUser = await updateProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
            });

            await updateSessionUser(updatedUser);

            router.replace('/profile' as Href);
        } catch (error: any) {
            console.log('Update profile error:', error?.response?.data || error?.message);

            Alert.alert(
                'Update Failed',
                typeof error?.response?.data === 'string'
                    ? error.response.data
                    : error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    JSON.stringify(error?.response?.data) ||
                    'Unable to update profile.'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#149BD7" />
            </View>
        );
    }

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/profile' as Href);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleBack}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.avatarBox}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {(firstName || 'U').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.avatarHint}>Update your account details</Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.label}>First Name *</Text>
                    <TextInput
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Enter first name"
                        style={styles.input}
                        placeholderTextColor="#8EA3B7"
                    />

                    <Text style={styles.label}>Last Name</Text>
                    <TextInput
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Enter last name"
                        style={styles.input}
                        placeholderTextColor="#8EA3B7"
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        placeholderTextColor="#8EA3B7"
                    />

                    <Text style={styles.label}>Mobile Number</Text>
                    <TextInput
                        value={mobile}
                        editable={false}
                        style={[styles.input, styles.disabledInput]}
                    />

                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                        onPress={handleUpdateProfile}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.saveBtnText}>Update Profile</Text>
                                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
