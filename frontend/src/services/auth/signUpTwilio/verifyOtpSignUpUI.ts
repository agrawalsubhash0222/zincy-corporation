import api from '@/services/api';

export const verifyOtpSignUpUI = async (
  name: string,
  email: string,
  password: string,
  mobile: string,
  otp: string,
  type: string
) => {

  const res = await api.post(
    '/auth/verify-otp-twilio',
    null,
    {
      params: {
        name,
        email,
        password,
        mobile: '+91' + mobile,
        otp,
        type: 'SIGNUP',
      },
    }
  );

  return res.data;
};