import api from "../../api";

const verifyOtpMSG91 = async (phone: string, otp: string) => {
  return await api.post("/auth/verify-otp-msg91", null, {
    params: { phone, otp },
  });
};

export default verifyOtpMSG91;