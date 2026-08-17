type RazorpaySuccess = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
};

type RazorpayFailure = {
    error?: {
        description?: string;
    };
};

type RazorpayInstance = {
    open: () => void;
    close: () => void;
    on: (event: string, callback: (response: RazorpayFailure) => void) => void;
};

type RazorpayConstructor = new (
    options: Record<string, unknown>
) => RazorpayInstance;

declare global {
    interface Window {
        Razorpay?: RazorpayConstructor;
    }
}

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Card checkout requires a browser.'));
    }

    if (window.Razorpay) {
        return Promise.resolve();
    }

    if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => {
                scriptPromise = null;
                reject(new Error('Unable to load secure card checkout.'));
            };
            document.head.appendChild(script);
        });
    }

    return scriptPromise;
}

export async function openRazorpayCardCheckout(options: {
    key: string;
    orderId: string;
    amountPaise: number;
    currency: string;
    businessName: string;
    description: string;
}): Promise<RazorpaySuccess | null> {
    await loadRazorpayScript();

    return new Promise((resolve, reject) => {
        const Razorpay = window.Razorpay;
        let settled = false;
        let checkout: RazorpayInstance;
        if (!Razorpay) {
            reject(new Error('Secure card checkout is unavailable.'));
            return;
        }

        const finish = (result: RazorpaySuccess | null) => {
            if (settled) return;
            settled = true;
            resolve(result);
        };

        const fail = (error: Error) => {
            if (settled) return;
            settled = true;
            reject(error);
        };

        checkout = new Razorpay({
            key: options.key,
            order_id: options.orderId,
            amount: options.amountPaise,
            currency: options.currency,
            name: options.businessName,
            description: options.description,
            handler: (response: RazorpaySuccess) => finish(response),
            modal: {
                // Some Razorpay web flows close the modal after a successful
                // bank response without invoking the handler. The caller will
                // securely reconcile the order with Razorpay before deciding
                // whether this was a success or a cancellation.
                ondismiss: () => finish(null),
            },
            // A failed gateway attempt is terminal in Zincy's database. Do
            // not let Checkout retry the same Razorpay order after that row
            // has been marked FAILED and its active-payment lock released.
            retry: { enabled: false },
            theme: { color: '#0EA5E9' },
            method: {
                card: true,
                upi: false,
                netbanking: false,
                wallet: false,
                emi: false,
                paylater: false,
            },
            config: {
                display: {
                    blocks: {
                        cards: {
                            name: 'Pay using credit or debit card',
                            instruments: [{ method: 'card' }],
                        },
                    },
                    sequence: ['block.cards'],
                    preferences: { show_default_blocks: false },
                },
            },
        });

        checkout.on('payment.failed', (response) => {
            const error = new Error(
                response.error?.description || 'Card payment failed.'
            );
            // Reject first so modal.ondismiss cannot turn a known failure
            // into a cancellation result while close() is firing.
            fail(error);
            checkout.close();
        });
        checkout.open();
    });
}

export type { RazorpaySuccess };
