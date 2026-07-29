import api from '@/services/api';

export type AuthType = 'LOGIN' | 'SIGNUP';

interface VerifyWhatsAppOtpRequest {
    name?: string;
    email?: string;
    password?: string;
    mobile: string;
    otp: string;
    type: AuthType;
}

export async function sendWhatsAppOtp(
    mobile: string,
    type: AuthType
) {
    const response = await api.post('/auth/whatsapp/send-otp', {
        mobile,
        type,
    });

    return response.data;
}

export async function verifyWhatsAppOtp(
    request: VerifyWhatsAppOtpRequest
) {
    const response = await api.post(
        '/auth/whatsapp/verify-otp',
        request
    );

    return response.data;
}