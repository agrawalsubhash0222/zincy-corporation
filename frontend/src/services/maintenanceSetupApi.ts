import { API_BASE_URL } from '@/services/api';

export type MaintenanceSetupType =
    | 'ZINCY_MANAGED'
    | 'CLIENT_MANAGED'
    | 'DECIDE_LATER';

export type MaintenanceBillingType =
    | 'MONTHLY'
    | 'YEARLY'
    | 'NA';

export type MaintenanceSetupPayload = {
    onboardingRequestId: number;
    maintenanceType: MaintenanceSetupType;
    billingType: MaintenanceBillingType;
};

export type MaintenanceSetupResponse = {
    id: number;
    onboardingRequestId: number;
    maintenanceType: MaintenanceSetupType;
    billingType: MaintenanceBillingType;
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    maintenanceSetupCompleted: boolean;
};

export async function saveMaintenanceSetup(
    payload: MaintenanceSetupPayload
): Promise<MaintenanceSetupResponse> {
    const response = await fetch(
        `${API_BASE_URL}/maintenance-setup`,
        {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type':
                    'application/json',
            },
            body: JSON.stringify(payload),
        }
    );

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(
            message
            || 'Unable to save maintenance setup.'
        );
    }

    return response.json();
}

export async function getMaintenanceSetup(
    onboardingRequestId: number
): Promise<MaintenanceSetupResponse | null> {
    const response = await fetch(
        `${API_BASE_URL}/maintenance-setup/onboarding/${onboardingRequestId}`,
        {
            credentials: 'include',
        }
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(
            message
            || 'Unable to load maintenance setup.'
        );
    }

    return response.json();
}
