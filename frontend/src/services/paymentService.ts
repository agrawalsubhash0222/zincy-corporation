import api from '@/services/api';

export type PaymentMethod = 'PHONEPE' | 'CARD' | 'GOOGLE_PAY';
export type PaymentProvider = 'PHONEPE' | 'RAZORPAY';
export type PaymentClientPlatform = 'WEB' | 'NATIVE';
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
    phonePeSdkToken?: string;
    phonePeMerchantId?: string;
    phonePeEnvironment?: 'SANDBOX' | 'PRODUCTION';
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
    failureCode?: string;
    failureReason?: string;
    paidAt?: string;
    expiresAt?: string;
    cancelRetryAllowed: boolean;
    cancelRetrySecondsRemaining: number;
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
    idempotencyKey: string,
    clientPlatform: PaymentClientPlatform = 'WEB'
): Promise<CreatePaymentOrderResponse> {
    const response = await api.post<CreatePaymentOrderResponse>(
        '/payments/orders',
        { onboardingRequestId, preferredMethod, idempotencyKey, clientPlatform }
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

export async function abandonPaymentAttempt(
    paymentRecordId: number,
    options?: { customerCancelled?: boolean }
): Promise<PaymentResponse> {
    const response = await api.post<PaymentResponse>(
        `/payments/${paymentRecordId}/abandon`,
        undefined,
        {
            params: options?.customerCancelled
                ? { customerCancelled: true }
                : undefined,
        }
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

    const candidates = [
        value?.response?.data?.message,
        value?.response?.data?.error,
        value?.description,
        value?.message,
    ];

    for (const candidate of candidates) {
        if (typeof candidate !== 'string') {
            continue;
        }

        const message = candidate.trim();
        const looksLikeInternalProviderPayload =
            message.length > 220 ||
            message.startsWith('{') ||
            message.includes('key_error_') ||
            message.includes('ERROR_B2B_') ||
            message.includes('customCheckoutSdkPayApi');

        if (message && !looksLikeInternalProviderPayload) {
            if (/network error|timeout|failed to fetch/i.test(message)) {
                return 'Unable to reach the payment service. Check your connection and try again.';
            }

            return message;
        }
    }

    return fallback;
}

export function paymentFailureMessage(
    payment: PaymentResponse | null | undefined
): string {
    if (!payment) {
        return "The payment could not be verified.";
    }

    const failureCode = (payment.failureCode || "")
        .trim()
        .toLowerCase();

    const failureReason = (payment.failureReason || "")
        .trim()
        .toLowerCase();

    /*
     * IMPORTANT:
     * The backend remains the source of truth for payment status.
     *
     * This function changes DISPLAY TEXT ONLY.
     * It must never decide whether a payment is PAID/FAILED/PENDING.
     */

    if (payment.status === "REVIEW_REQUIRED") {
        return (
            "We could not safely confirm the final payment status. " +
            "Please do not make another payment. Check the payment " +
            "status again or contact support."
        );
    }

    if (payment.status === "EXPIRED") {
        return (
            "This payment attempt has expired. No completed payment " +
            "was confirmed. You can safely try again."
        );
    }

    /*
     * Foreign/international card used while the Razorpay merchant
     * account accepts domestic Indian cards only.
     */
    if (
        failureReason.includes("domestic") &&
        failureReason.includes("card")
    ) {
        return (
            "This card is not supported for this payment. " +
            "Please use an Indian-issued credit/debit card " +
            "or choose another payment method."
        );
    }

    /*
     * Insufficient funds / balance.
     */
    if (
        failureReason.includes("insufficient") ||
        failureReason.includes("insufficient funds") ||
        failureReason.includes("insufficient balance")
    ) {
        return (
            "Your bank declined this payment because sufficient funds " +
            "were not available. Please use another card or payment method."
        );
    }

    /*
     * Card has expired.
     */
    if (
        failureReason.includes("expired card") ||
        failureReason.includes("card has expired")
    ) {
        return "This card has expired. Please use another card.";
    }

    /*
     * OTP / 3DS / card authentication failure.
     */
    if (
        failureReason.includes("otp") ||
        failureReason.includes("authentication") ||
        failureReason.includes("3d secure") ||
        failureReason.includes("3ds")
    ) {
        return (
            "Card authentication was not completed. " +
            "Please try again or use another payment method."
        );
    }

    /*
     * Bank/card issuer declined the transaction.
     */
    if (
        failureReason.includes("declined") ||
        failureReason.includes("issuer") ||
        failureCode.includes("declined")
    ) {
        return (
            "Your bank declined this card payment. " +
            "Please try another card or contact your bank."
        );
    }

    /*
     * Card disabled / restricted for online transactions.
     */
    if (
        failureReason.includes("online transaction") ||
        failureReason.includes("online transactions") ||
        failureReason.includes("not enabled") ||
        failureReason.includes("disabled")
    ) {
        return (
            "This card is not enabled for this transaction. " +
            "Please check your card settings, contact your bank, " +
            "or use another payment method."
        );
    }

    /*
     * Incorrect CVV/CVC.
     */
    if (
        failureReason.includes("cvv") ||
        failureReason.includes("cvc")
    ) {
        return (
            "The card security details could not be verified. " +
            "Please check the card details and try again."
        );
    }

    /*
     * Bank/payment network unavailable.
     */
    if (
        failureReason.includes("bank") &&
        (
            failureReason.includes("unavailable") ||
            failureReason.includes("down") ||
            failureReason.includes("timeout")
        )
    ) {
        return (
            "Your bank could not process the payment right now. " +
            "Please wait a moment and try again."
        );
    }

    /*
     * Generic card failure.
     *
     * DO NOT return payment.failureReason here because Razorpay may
     * return technical/provider-specific wording that should not be
     * exposed directly to the customer.
     */
    if (payment.paymentMethod === "CARD") {
        return (
            "The card payment was not completed. " +
            "Please try again or use another payment method."
        );
    }

    /*
     * Safe generic fallback for any other gateway.
     */
    return (
        "The payment was not completed. " +
        "Please try again or use another payment method."
    );
}
