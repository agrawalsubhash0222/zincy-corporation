import { Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { sendWhatsAppOtp } from '@/services/auth/loginWhatsapp/whatsappOtpService';
import { getSession } from '@/utils/session';

function extractErrorMessage(error: any) {
    const data = error?.response?.data;

    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    return 'Unable to send OTP. Please try again.';
}

export function useLogin(redirectTo?: string | string[]) {
    const router = useRouter();

    const [mobile, setMobile] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    const redirectPath = useMemo(() => {
        const path = Array.isArray(redirectTo)
            ? redirectTo[0]
            : redirectTo || '/profile';

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
                console.log('Login session check error:', error);
            } finally {
                setCheckingSession(false);
            }
        };

        checkExistingSession();
    }, [router, redirectPath]);

    const setMobileNumber = (text: string) => {
        setMobile(text.replace(/[^0-9]/g, '').slice(0, 10));
        setErrorMsg('');
    };

    const handleOtpSend = async () => {
        setErrorMsg('');

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            setErrorMsg('Please enter a valid mobile number');
            return;
        }

        try {
            setLoading(true);

            await sendWhatsAppOtp(mobile, 'LOGIN');

            router.replace({
                pathname: '/auth/otp',
                params: {
                    mobile,
                    type: 'LOGIN',
                    channel: 'WHATSAPP',
                    redirectTo: String(redirectPath),
                },
            } as any);
        } catch (error: any) {
            setErrorMsg(extractErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return {
        mobile,
        errorMsg,
        loading,
        checkingSession,
        setMobileNumber,
        handleOtpSend,
    };
}