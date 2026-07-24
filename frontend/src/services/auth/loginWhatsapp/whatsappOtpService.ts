import api from '@/services/api';

export type AuthType = 'LOGIN' | 'SIGNUP';

export async function sendWhatsAppOtpLogin(mobile: string) {
    const response = await api.post('/auth/whatsapp/send-otp', {
        mobile,
        type: 'LOGIN',
    });

    return response.data;
}

export async function verifyWhatsAppOtpLogin(mobile: string, otp: string) {
    const response = await api.post('/auth/whatsapp/verify-otp', {
        mobile,
        otp,
        type: 'LOGIN',
    });

    return response.data;
}