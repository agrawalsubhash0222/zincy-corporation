import axios from 'axios';

const API_BASE_URL = 'http://192.168.29.136:8081';

export type ContactPayload = {
  fullName: string;
  mobileNumber: string;
  email: string;
  lookingFor: string[];
  message: string;
};

export const submitContactEnquiry = async (payload: ContactPayload) => {
  const response = await axios.post(`${API_BASE_URL}/api/contact`, payload);
  return response.data;
};