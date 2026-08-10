import api from '@/services/api';

export type PaymentMethod = 'PHONEPE' | 'CARD' | 'GOOGLE_PAY';
export type PaymentProvider = 'PHONEPE' | 'RAZORPAY';
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
export type PaymentStatus =
    | 'CREATED'
    | 'PENDING'
    | 'PAID'
    | 'FAILED'
    | 'EXPIRED'
    | 'REVIEW_REQUIRED'
    | 'REFUNDED';

export type CreatePaymentOrderResponse = {
    paymentRecordId: number;
    provider: PaymentProvider;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    merchantOrderId: string;
    providerOrderId?: string;
    publicKey?: string;
    checkoutUrl?: string;
    amountPaise: number;
    amount: number;
    currency: string;
    businessName: string;
    description: string;
    expiresAt?: string;
};

export type PaymentResponse = {
    id: number;
    onboardingRequestId: number;
    provider: PaymentProvider;
    paymentMethod: PaymentMethod;
    merchantOrderId: string;
    providerOrderId?: string;
    providerPaymentId?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    providerState?: string;
    failureReason?: string;
    paidAt?: string;
    expiresAt?: string;
    terminal: boolean;
    successful: boolean;
    refundId?: number;
    refundStatus?: RefundStatus;
    refundReason?: RefundReason;
    refundAmount?: number;
    refundFailureReason?: string;
    automaticRefund: boolean;
    refundInProgress: boolean;
    refundCompletedAt?: string;
};

export type RefundResponse = {
    id: number;
    paymentOrderId: number;
    onboardingRequestId: number;
    provider: PaymentProvider;
    reason: RefundReason;
    status: RefundStatus;
    amount: number;
    currency: string;
    merchantRefundId: string;
    providerRefundId?: string;
    providerState?: string;
    failureCode?: string;
    failureReason?: string;
    reconcileAttempts: number;
    nextReconcileAt?: string;
    lastReconciledAt?: string;
    automatic: boolean;
    createdAt: string;
    completedAt?: string;
};

export async function createPaymentOrder(
    onboardingRequestId: number,
    preferredMethod: Extract<PaymentMethod, 'PHONEPE' | 'CARD'>,
    idempotencyKey: string
): Promise<CreatePaymentOrderResponse> {
    const response = await api.post<CreatePaymentOrderResponse>(
        '/payments/orders',
        { onboardingRequestId, preferredMethod, idempotencyKey }
    );

    return response.data;
}

export async function verifyRazorpayPayment(input: {
    paymentRecordId: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}): Promise<PaymentResponse> {
    const response = await api.post<PaymentResponse>(
        '/payments/razorpay/verify',
        input
    );

    return response.data;
}

export async function getPaymentStatus(
    paymentRecordId: number,
    refresh = true
): Promise<PaymentResponse> {
    const response = await api.get<PaymentResponse>(
        `/payments/${paymentRecordId}/status`,
        { params: { refresh } }
    );

    return response.data;
}

export function paymentErrorMessage(
    error: unknown,
    fallback = 'Payment request failed.'
): string {
    const value = error as {
        response?: { data?: { message?: string; error?: string } };
        description?: string;
        message?: string;
    };

    return (
        value?.response?.data?.message ||
        value?.response?.data?.error ||
        value?.description ||
        value?.message ||
        fallback
    );
}
