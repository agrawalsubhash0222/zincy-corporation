import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { verifyOtpLoginUI } from '@/services/auth/loginTwilio/verifyOtpLoginUI';
import { saveSession } from '@/utils/session';

function extractErrorMessage(error: any) {
    const data = error?.response?.data;

    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    return 'Something went wrong';
}

export function useOtpVerify(redirectTo?: string | string[]) {
    const router = useRouter();

    const params = useLocalSearchParams<{
        mobile?: string | string[];
        redirectTo?: string | string[];
    }>();

    const mobile = Array.isArray(params.mobile)
        ? params.mobile[0]
        : params.mobile || '';

    const resolvedRedirectTo =
        Array.isArray(redirectTo)
            ? redirectTo[0]
            : redirectTo ||
            (Array.isArray(params.redirectTo)
                ? params.redirectTo[0]
                : params.redirectTo) ||
            '/(website)';

    const finalRedirectTo = resolvedRedirectTo as Href;

    const [otp, setOtp] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const setOtpNumber = (text: string) => {
        setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
        setErrorMsg('');
    };

    const handleOtpVerify = async () => {
        setErrorMsg('');

        if (!mobile) {
            setErrorMsg('Mobile number missing. Please login again.');
            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            setErrorMsg('Enter valid OTP');
            return;
        }

        try {
            setLoading(true);

            const response = await verifyOtpLoginUI(mobile, otp, 'LOGIN');

            const userData =
                response?.user ??
                response?.data?.user ??
                response?.data ??
                response;

            await saveSession({
                id: userData.id,
                name: userData.name ?? 'User',
                email: userData.email ?? '',
                mobile: userData.mobile ?? mobile,
                role: userData.role ?? 'user',
            });

            setOtp('');

            router.dismissAll();
            router.replace(finalRedirectTo);
        } catch (error: any) {
            setErrorMsg(extractErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return {
        mobile,
        otp,
        errorMsg,
        loading,
        setOtpNumber,
        handleOtpVerify,
    };
}