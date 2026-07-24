import api from '@/services/api';

export const verifyOtpLoginUI = async (
  mobile: string,
  otp: string,
  type: string
): Promise<any> => {
  const res = await api.post('/auth/verify-otp-twilio', null, {
    params: { mobile: '+91' + mobile, otp, type: 'LOGIN' },
    
  });

  return res.data;
};