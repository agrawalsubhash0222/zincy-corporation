import api from '@/services/api';

export type UpdateProfilePayload = {
    firstName: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
};

export const getProfile = async () => {
    const response = await api.get('/profile/me');
    return response.data;
};

export const updateProfile = async (
    payload: UpdateProfilePayload
) => {
    const response = await api.put(
        '/profile/me',
        payload
    );

    return response.data;
};
