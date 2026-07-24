declare module 'react-native-razorpay' {
    export type RazorpayOptions = {
        key: string;
        amount: number | string;
        currency: string;
        name: string;
        description?: string;
        order_id: string;

        theme?: {
            color?: string;
        };

        retry?: {
            enabled?: boolean;
            max_count?: number;
        };

        method?: {
            upi?: boolean;
            netbanking?: boolean;
            card?: boolean;
            wallet?: boolean;
            emi?: boolean;
            paylater?: boolean;
        };
    };

    export type RazorpaySuccessResponse = {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    };

    const RazorpayCheckout: {
        open(
            options: RazorpayOptions
        ): Promise<RazorpaySuccessResponse>;
    };

    export default RazorpayCheckout;
}