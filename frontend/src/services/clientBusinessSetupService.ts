import { API_BASE_URL } from './api';

export type ClientBusinessSetupResponse = {
    id?: number;
    onboardingRequestId?: number;

    businessName?: string;

    ownerName?: string;
    ownerContact?: string;
    ownerEmail?: string;
    secondaryContact?: string;

    contacts?: string | string[];

    email?: string;
    businessEmail?: string;

    whatsappContact?: string;
    businessType?: string;

    businessLogo?: string;
    businessLogoUrl?: string;

    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;

    gstRegistered?: boolean | string;
    gstNumber?: string;
    panNumber?: string;

    msmeNumber?: string;
    udyamNumber?: string;

    fssaiNumber?: string;
    fssaiLicenseNumber?: string;

    createdAt?: string;
    updatedAt?: string;
};

type ClientSetupExistsResponse = {
    clientSetupCompleted?: boolean;
};

const getErrorMessage = async (
    response: Response,
    fallbackMessage: string,
): Promise<string> => {
    try {
        const text = await response.text();

        if (!text) {
            return fallbackMessage;
        }

        try {
            const parsed = JSON.parse(text);

            return (
                parsed?.message ||
                parsed?.error ||
                text
            );
        } catch {
            return text;
        }
    } catch {
        return fallbackMessage;
    }
};

export const saveClientBusinessSetup = async (
    payload: unknown,
): Promise<ClientBusinessSetupResponse> => {
    const response = await fetch(
        `${API_BASE_URL}/client-business-setup`,
        {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(payload),
        },
    );

    if (!response.ok) {
        const errorMessage =
            await getErrorMessage(
                response,
                'Failed to save business setup',
            );

        throw new Error(errorMessage);
    }

    return response.json();
};

export const getClientBusinessSetupByOnboardingId =
    async (
        onboardingRequestId: number,
    ): Promise<ClientBusinessSetupResponse> => {
        if (
            !Number.isFinite(onboardingRequestId) ||
            onboardingRequestId <= 0
        ) {
            throw new Error(
                'Valid onboarding request ID is required',
            );
        }

        const response = await fetch(
            `${API_BASE_URL}/client-business-setup/onboarding/${onboardingRequestId}`,
            {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            },
        );

        if (!response.ok) {
            const errorMessage =
                await getErrorMessage(
                    response,
                    'Failed to load saved business setup',
                );

            throw new Error(errorMessage);
        }

        return response.json();
    };

export const checkClientBusinessSetupExists =
    async (
        onboardingRequestId: number,
    ): Promise<boolean> => {
        if (
            !Number.isFinite(onboardingRequestId) ||
            onboardingRequestId <= 0
        ) {
            return false;
        }

        const response = await fetch(
            `${API_BASE_URL}/client-business-setup/onboarding/${onboardingRequestId}/exists`,
            {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            },
        );

        if (!response.ok) {
            const errorMessage =
                await getErrorMessage(
                    response,
                    'Failed to check client setup status',
                );

            throw new Error(errorMessage);
        }

        const result =
            (await response.json()) as ClientSetupExistsResponse;

        return result.clientSetupCompleted === true;
    };
