import { Href, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import {
    sendWhatsAppOtp,
    verifyWhatsAppOtp,
} from '@/services/auth/loginWhatsapp/whatsappOtpService';
import { getSession, saveSession } from '@/utils/session';

function extractErrorMessage(error: any) {
    const data = error?.response?.data;

    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    return 'Something went wrong';
}

function isValidMobile(mobile: string) {
    return /^[6-9]\d{9}$/.test(mobile);
}

function isValidOtp(otp: string) {
    return /^\d{6}$/.test(otp);
}

export function useSignup(redirectTo?: string | string[]) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');

    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    const redirectPath = useMemo(() => {
        const path = Array.isArray(redirectTo)
            ? redirectTo[0]
            : redirectTo || '/(website)';

        return path as Href;
    }, [redirectTo]);

    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const session = await getSession();

                if (session?.mobile) {
                    router.dismissAll();
                    router.replace(redirectPath);
                    return;
                }
            } catch (error) {
                console.log('Signup session check error:', error);
            } finally {
                setCheckingSession(false);
            }
        };

        checkExistingSession();
    }, [redirectPath]);

    const clearError = () => setErrorMsg('');

    const setFirstNameValue = (text: string) => {
        setFirstName(text);
        clearError();
    };

    const setLastNameValue = (text: string) => {
        setLastName(text);
        clearError();
    };

    const setEmailValue = (text: string) => {
        setEmail(text.trim().toLowerCase());
        clearError();
    };

    const setPasswordValue = (text: string) => {
        setPassword(text);
        clearError();
    };

    const setMobileValue = (text: string) => {
        setMobile(text.replace(/[^0-9]/g, '').slice(0, 10));
        clearError();
    };

    const setOtpValue = (text: string) => {
        setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
        clearError();
    };

    const handleOtpSend = async () => {
        clearError();

        if (!firstName.trim()) {
            setErrorMsg('Enter first name');
            return;
        }

        if (!email.trim()) {
            setErrorMsg('Enter email');
            return;
        }

        if (!password.trim()) {
            setErrorMsg('Enter password');
            return;
        }

        if (!isValidMobile(mobile)) {
            setErrorMsg('Enter valid mobile number');
            return;
        }

        try {
            setLoading(true);
            await sendWhatsAppOtp(mobile, 'SIGNUP');
            setOtpSent(true);
        } catch (error: any) {
            setErrorMsg(extractErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerify = async () => {
        clearError();

        if (!isValidOtp(otp)) {
            setErrorMsg('Enter valid OTP');
            return;
        }

        try {
            setLoading(true);

            const response = await verifyWhatsAppOtp({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                password,
                mobile,
                otp,
                type: 'SIGNUP',
            });

            const userData =
                response?.user ??
                response?.data?.user ??
                response?.data ??
                response;

            await saveSession({
                id: userData.id,
                firstName: userData.firstName ?? firstName.trim(),
                lastName: userData.lastName ?? lastName.trim(),
                email: userData.email ?? email.trim().toLowerCase(),
                mobile: userData.mobile ?? mobile,
                role: userData.role ?? 'user',
            });

            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setMobile('');
            setOtp('');
            setOtpSent(false);

            router.dismissAll();
            router.replace(redirectPath);
        } catch (error: any) {
            setErrorMsg(extractErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return {
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
    };
}