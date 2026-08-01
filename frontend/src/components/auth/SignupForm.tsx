import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useSignup } from '@/hooks/auth/useSignup';
import { styles } from '@/styles/auth/signup.styles';

export default function SignupForm() {
    const {
        firstName,
        lastName,
        email,
        password,
        mobile,
        otp,
        errorMsg,
        loading,
        otpSent,
        checkingSession,
        setFirstNameValue,
        setLastNameValue,
        setEmailValue,
        setPasswordValue,
        setMobileValue,
        setOtpValue,
        handleOtpSend,
        handleOtpVerify,
    } = useSignup();

    if (checkingSession) return null;

    return (
        <View style={styles.formCard}>
            <View style={styles.iconCircle}>
                <Ionicons name="person-add-outline" size={30} color="#149BD7" />
            </View>

            <Text style={styles.title}>
                {otpSent ? 'Verify Account' : 'Create Account'}
            </Text>

            <Text style={styles.subtitle}>
                {otpSent
                    ? <Text style={styles.subText}>We have sent a 6 digit OTP to +91 {mobile}</Text>
                    : 'Create your account in seconds'}
            </Text>

            {!otpSent ? (
                <>
                    <View style={styles.inputBox}>
                        <Ionicons name="person-outline" size={20} color="#149BD7" />
                        <TextInput
                            placeholder="First name"
                            placeholderTextColor="#94A3B8"
                            value={firstName}
                            onChangeText={setFirstNameValue}
                            autoCapitalize="words"
                            style={styles.input}
                        />
                    </View>

                    <View style={styles.inputBox}>
                        <Ionicons name="person-outline" size={20} color="#149BD7" />
                        <TextInput
                            placeholder="Last name (optional)"
                            placeholderTextColor="#94A3B8"
                            value={lastName}
                            onChangeText={setLastNameValue}
                            autoCapitalize="words"
                            style={styles.input}
                        />
                    </View>

                    <View style={styles.inputBox}>
                        <Ionicons name="mail-outline" size={20} color="#64748B" />
                        <TextInput
                            placeholder="Email address"
                            placeholderTextColor="#94A3B8"
                            value={email}
                            onChangeText={setEmailValue}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />
                    </View>

                    <View style={styles.inputBox}>
                        <Ionicons name="lock-closed-outline" size={20} color="#64748B" />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#94A3B8"
                            value={password}
                            onChangeText={setPasswordValue}
                            secureTextEntry
                            style={styles.input}
                        />
                    </View>

                    <View style={styles.inputBox}>
                        <Ionicons name="call-outline" size={20} color="#64748B" />
                        <TextInput
                            placeholder="Mobile number"
                            placeholderTextColor="#94A3B8"
                            value={mobile}
                            onChangeText={setMobileValue}
                            keyboardType="numeric"
                            maxLength={10}
                            style={styles.input}
                        />
                    </View>
                </>
            ) : (
                <View style={styles.inputBox}>
                    <Ionicons name="keypad-outline" size={20} color="#64748B" />
                    <TextInput
                        placeholder="Enter OTP"
                        placeholderTextColor="#94A3B8"
                        value={otp}
                        onChangeText={setOtpValue}
                        keyboardType="numeric"
                        maxLength={6}
                        style={styles.input}
                    />
                </View>
            )}

            {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

            <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.btn, loading && styles.btnDisabled]}
                disabled={loading}
                onPress={otpSent ? handleOtpVerify : handleOtpSend}
            >
                <Text style={styles.btnText}>
                    {loading
                        ? otpSent
                            ? 'Verifying...'
                            : 'Sending...'
                        : otpSent
                            ? 'Verify OTP'
                            : 'Send OTP'}
                </Text>

                <Ionicons
                    name={otpSent ? 'checkmark-circle-outline' : 'arrow-forward'}
                    size={21}
                    color="#FFFFFF"
                />
            </TouchableOpacity>
        </View>
    );
}