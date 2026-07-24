import api from '@/services/api';

export type EnquiryPayload = {
    fullName: string;
    mobileNumber: string;
    email?: string;
    lookingFor: string;
    message?: string;
};

export async function submitEnquiry(payload: EnquiryPayload) {
    const response = await api.post('/enquiries', payload);
    return response.data;
}

export async function getAdminEnquiries() {
    const response = await api.get('/admin/enquiries');
    return response.data;
}

export async function updateEnquiryStatus(id: number, status: string) {
    const response = await api.patch(`/admin/enquiries/${id}/status`, { status });
    return response.data;
}