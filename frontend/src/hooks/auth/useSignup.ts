import { Href, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { sendOtpSignUpUI } from '@/services/auth/signUpTwilio/sendOtpSignUpUI';
import { verifyOtpSignUpUI } from '@/services/auth/signUpTwilio/verifyOtpSignUpUI';
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
    const [name, setName] = useState('');
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

    const setNameValue = (text: string) => {
        setName(text);
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

        if (!name.trim()) {
            setErrorMsg('Enter name');
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
            await sendOtpSignUpUI(mobile, 'SIGNUP');
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

            const response = await verifyOtpSignUpUI(
                name.trim(),
                email.trim().toLowerCase(),
                password,
                mobile,
                otp,
                'SIGNUP'
            );

            const userData =
                response?.user ??
                response?.data?.user ??
                response?.data ??
                response;

            await saveSession({
                id: userData.id,
                name: userData.name ?? name.trim(),
                email: userData.email ?? email.trim().toLowerCase(),
                mobile: userData.mobile ?? mobile,
                role: userData.role ?? 'user',
            });

            setName('');
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
        name,
        email,
        password,
        mobile,
        otp,
        errorMsg,
        loading,
        otpSent,
        checkingSession,
        setNameValue,
        setEmailValue,
        setPasswordValue,
        setMobileValue,
        setOtpValue,
        handleOtpSend,
        handleOtpVerify,
    };
}