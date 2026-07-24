import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { verifyWhatsAppOtpLogin } from '@/services/auth/loginWhatsapp/OtpServiceWhatsapp';

function extractError(error: any) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        'Invalid OTP. Please try again.'
    );
}

export function useOtp() {
    const params = useLocalSearchParams<{
        mobile?: string;
        type?: string;
        channel?: string;
    }>();

    const mobile = params.mobile || '';

    const [otp, setOtp] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const setOtpValue = (value: string) => {
        setOtp(value);
        setErrorMsg('');
    };

    const handleVerifyOtp = async () => {
        if (!/^\d{6}$/.test(otp)) {
            setErrorMsg('Please enter valid 6-digit OTP');
            return;
        }

        try {
            setLoading(true);
            setErrorMsg('');

            await verifyWhatsAppOtpLogin(mobile, otp);

            router.replace('/(website)');
        } catch (error: any) {
            setErrorMsg(extractError(error));
        } finally {
            setLoading(false);
        }
    };

    return {
        mobile,
        otp,
        errorMsg,
        loading,
        setOtpValue,
        handleVerifyOtp,
    };
}