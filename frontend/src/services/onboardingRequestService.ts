import axios from 'axios';
import { API_BASE_URL } from './api';

export type PaymentStatus =
    | 'CREATED'
    | 'PENDING'
    | 'PAID'
    | 'FAILED'
    | 'EXPIRED'
    | 'REVIEW_REQUIRED'
    | 'REFUNDED';

export type PaymentProvider = 'PHONEPE' | 'RAZORPAY';

export type PaymentMethod =
    | 'PHONEPE'
    | 'CARD'
    | 'GOOGLE_PAY';

export type RefundStatus =
    | 'REQUESTED'
    | 'PENDING'
    | 'COMPLETED'
    | 'FAILED'
    | 'REVIEW_REQUIRED';

export type RefundReason =
    | 'CUSTOMER_CANCELLATION'
    | 'SERVICE_CANCELLATION'
    | 'DUPLICATE_CAPTURE'
    | 'FORBIDDEN_PAYMENT_METHOD'
    | 'LATE_CAPTURE'
    | 'OTHER';

export type OnboardingStatus =
    | 'SUBMITTED'
    | 'REVIEW'
    | 'CONTACTED'
    | 'APPROVED'
    | 'REJECTED';

export type OnboardingNextStep =
    | 'REQUEST_DETAILS'
    | 'CLIENT_SETUP_SUCCESS'
    | 'SERVER_SETUP_SUCCESS'
    | 'CHECKOUT';

export type OnboardingRequest = {
    id: number;
    businessName?: string;
    ownerName?: string;
    mobile?: string;
    userMobile?: string;
    email?: string;
    projectTypes?: string;
    requirement?: string;
    budget?: string;
    timeline?: string;
    status: OnboardingStatus;
    clientSetupCompleted?: boolean;
    serverSetupCompleted?: boolean;
    maintenanceSetupCompleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    paymentStatus?: PaymentStatus;
    paymentRecordId?: number;
    paymentProvider?: PaymentProvider;
    paymentMethod?: PaymentMethod;
    refundStatus?: RefundStatus;
};

export type CustomerOnboardingRequest =
    OnboardingRequest & {
        nextStep: OnboardingNextStep;
    };

export type AdminClientSetupDetails = {
    id: number;
    onboardingRequestId: number;
    businessName?: string;
    ownerName?: string;
    ownerContact?: string;
    ownerEmail?: string;
    secondaryContact?: string;
    contacts?: string;
    businessEmail?: string;
    whatsappContact?: string;
    businessType?: string;
    businessLogoUrl?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstRegistered?: boolean;
    gstNumber?: string;
    panNumber?: string;
    udyamNumber?: string;
    fssaiLicenseNumber?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type AdminServerSetupDetails = {
    id: number;
    onboardingRequestId: number;
    serverName?: string;
    billingType?: 'MONTHLY' | 'YEARLY' | null;
    baseAmount?: number;
    gstAmount?: number;
    totalAmount?: number;
    skipped?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type AdminMaintenanceSetupDetails = {
    id: number;
    onboardingRequestId: number;
    maintenanceType?:
    | 'ZINCY_MANAGED'
    | 'CLIENT_MANAGED'
    | 'DECIDE_LATER';
    billingType?: 'MONTHLY' | 'YEARLY' | 'NA' | null;
    baseAmount?: number;
    gstAmount?: number;
    totalAmount?: number;
    createdAt?: string;
    updatedAt?: string;
};

export type AdminOnboardingDetails = {
    onboardingRequest: OnboardingRequest;
    clientSetupCompleted: boolean;
    clientSetup: AdminClientSetupDetails | null;
    serverSetupCompleted: boolean;
    serverSetup: AdminServerSetupDetails | null;
    maintenanceSetupCompleted: boolean;
    maintenanceSetup: AdminMaintenanceSetupDetails | null;
    payment: AdminPaymentDetails | null;
};

export type AdminPaymentDetails = {
    id: number;
    onboardingRequestId: number;
    provider: PaymentProvider;
    paymentMethod: PaymentMethod;
    amount: number;
    currency: string;
    status: PaymentStatus;
    providerState?: string;
    providerPaymentId?: string;
    paidAt?: string;
    refundStatus?: RefundStatus;
    refundReason?: RefundReason;
    refundAmount?: number;
    refundCompletedAt?: string;
};

const onboardingApi = axios.create({
    baseURL: `${API_BASE_URL}/onboarding-requests`,
    timeout: 15000,
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

export const getOnboardingRequests =
    async (): Promise<OnboardingRequest[]> => {
        const response =
            await onboardingApi.get<OnboardingRequest[]>(
                '/admin'
            );

        if (!Array.isArray(response.data)) {
            throw new Error(
                'Invalid onboarding request response.'
            );
        }

        return response.data;
    };

export const getAdminOnboardingDetails =
    async (
        requestId: number
    ): Promise<AdminOnboardingDetails> => {
        const response =
            await onboardingApi.get<AdminOnboardingDetails>(
                `/admin/${requestId}/details`
            );

        return response.data;
    };

export const updateOnboardingRequestStatus =
    async (
        requestId: number,
        status: OnboardingStatus
    ): Promise<OnboardingRequest> => {
        const response =
            await onboardingApi.patch<OnboardingRequest>(
                `/admin/${requestId}/status`,
                { status }
            );

        return response.data;
    };

export const getMyOnboardingRequests =
    async (): Promise<CustomerOnboardingRequest[]> => {
        const response =
            await onboardingApi.get<
                CustomerOnboardingRequest[]
            >(
                '/customer/me'
            );

        if (!Array.isArray(response.data)) {
            throw new Error(
                'Invalid customer onboarding response.'
            );
        }

        return response.data;
    };

export const getOnboardingRequestProgress =
    async (
        onboardingRequestId: number
    ): Promise<CustomerOnboardingRequest> => {
        const response =
            await onboardingApi.get<
                CustomerOnboardingRequest
            >(
                `/customer/request/${onboardingRequestId}/progress`
            );

        return response.data;
    };
