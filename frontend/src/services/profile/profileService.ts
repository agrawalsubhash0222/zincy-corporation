import api from '@/services/api';

export type UpdateProfilePayload = {
    firstName: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
};

export const getProfile = async (mobile: string) => {
    const response = await api.get(`/profile/${(mobile)}`);
    return response.data;
};

export const updateProfile = async (
    mobile: string,
    payload: UpdateProfilePayload
) => {
    const response = await api.put(
        `/profile/${(mobile)}`,
        payload
    );

    return response.data;
};