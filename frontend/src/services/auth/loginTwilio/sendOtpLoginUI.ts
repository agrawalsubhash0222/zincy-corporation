import api from '@/services/api';

export const sendOtpLoginUI = async (mobile: string, type: string) => {
  const response = await api.post('/auth/send-otp-twilio', null, {
    params: { mobile: '+91' + mobile, type: 'LOGIN' },
  });
  return response.data;
};
