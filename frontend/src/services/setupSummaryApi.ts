import { API_BASE_URL } from '@/services/api';

export type ServerSetupSummary = {
    id: number;
    onboardingRequestId: number;
    serverName: string;
    billingType: 'MONTHLY' | 'YEARLY' | null;
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    skipped: boolean;
    serverSetupCompleted: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type MaintenanceSetupSummary = {
    id: number;
    onboardingRequestId: number;
    maintenanceType:
    | 'ZINCY_MANAGED'
    | 'CLIENT_MANAGED'
    | 'DECIDE_LATER';

    billingType: 'MONTHLY' | 'YEARLY' | 'NA';

    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    maintenanceSetupCompleted: boolean;
};

async function readResponse<T>(
    response: Response,
    fallbackMessage: string
): Promise<T> {
    const responseText = await response.text();

    let responseBody: unknown = null;

    if (responseText) {
        try {
            responseBody = JSON.parse(responseText);
        } catch {
            responseBody = responseText;
        }
    }

    if (!response.ok) {
        const errorBody =
            typeof responseBody === 'object' &&
                responseBody !== null
                ? (responseBody as {
                    message?: string;
                    error?: string;
                })
                : null;

        const message =
            errorBody?.message ||
            errorBody?.error ||
            (typeof responseBody === 'string'
                ? responseBody
                : fallbackMessage);

        throw new Error(message);
    }

    return responseBody as T;
}

export async function getServerSetupSummary(
    onboardingRequestId: number
): Promise<ServerSetupSummary> {
    const response = await fetch(
        `${API_BASE_URL}/server-setup/onboarding/${onboardingRequestId}`,
        {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        }
    );

    const data = await readResponse<ServerSetupSummary>(
        response,
        'Unable to load server setup.'
    );

    return {
        ...data,
        id: Number(data.id),
        onboardingRequestId: Number(
            data.onboardingRequestId
        ),
        baseAmount: Number(data.baseAmount ?? 0),
        gstAmount: Number(data.gstAmount ?? 0),
        totalAmount: Number(data.totalAmount ?? 0),
        skipped: Boolean(data.skipped),
        serverSetupCompleted: Boolean(
            data.serverSetupCompleted
        ),
    };
}

export async function getMaintenanceSetupSummary(
    onboardingRequestId: number
): Promise<MaintenanceSetupSummary | null> {
    const response = await fetch(
        `${API_BASE_URL}/maintenance-setup/onboarding/${onboardingRequestId}`,
        {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        }
    );

    if (response.status === 404) {
        return null;
    }

    const data =
        await readResponse<MaintenanceSetupSummary>(
            response,
            'Unable to load maintenance setup.'
        );

    return {
        ...data,
        id: Number(data.id),
        onboardingRequestId: Number(
            data.onboardingRequestId
        ),
        baseAmount: Number(data.baseAmount ?? 0),
        gstAmount: Number(data.gstAmount ?? 0),
        totalAmount: Number(data.totalAmount ?? 0),
        maintenanceSetupCompleted: Boolean(
            data.maintenanceSetupCompleted
        ),
    };
}