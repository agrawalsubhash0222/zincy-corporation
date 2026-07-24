import api from '@/services/api';
const sendOtpMSG91 = async (phone: string) => {
  try {
    const res = await api.post('/auth/send-otp-msg91', null, {params: { phone: phone },});
    console.log(res.data);
  } catch (err) {
    console.log("ERROR:", err);
  }
};

export default sendOtpMSG91;