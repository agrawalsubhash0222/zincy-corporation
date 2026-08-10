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
        if (!Razorpay) {
            reject(new Error('Secure card checkout is unavailable.'));
            return;
        }

        const checkout = new Razorpay({
            key: options.key,
            order_id: options.orderId,
            amount: options.amountPaise,
            currency: options.currency,
            name: options.businessName,
            description: options.description,
            handler: (response: RazorpaySuccess) => resolve(response),
            modal: {
                // Some Razorpay web flows close the modal after a successful
                // bank response without invoking the handler. The caller will
                // securely reconcile the order with Razorpay before deciding
                // whether this was a success or a cancellation.
                ondismiss: () => resolve(null),
            },
            retry: { enabled: true, max_count: 2 },
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
            reject(
                new Error(
                    response.error?.description || 'Card payment failed.'
                )
            );
        });
        checkout.open();
    });
}

export type { RazorpaySuccess };
