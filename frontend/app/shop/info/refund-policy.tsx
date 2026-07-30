import InfoScreen from '@/components/info/InfoScreen';
import { COMPANY } from '@/constants/company';

export default function RefundPolicyScreen() {
    return (
        <InfoScreen
            title="Refund & Cancellation"
            subtitle="Our policy for software projects, service cancellations, and refunds."
            icon="cash-outline"
            sections={[
                {
                    title: 'Project Cancellation',
                    icon: 'close-circle-outline',
                    body: 'A project or service may be cancelled before development begins. Once planning, designing, development, or any other agreed work has started, cancellation will be subject to the completed work and the applicable project terms.',
                },
                {
                    title: 'Refund Eligibility',
                    icon: 'wallet-outline',
                    body: `Refund requests are reviewed by ${COMPANY.name} based on the project stage, completed work, payments received, and the terms agreed with the client. Approval of a refund is not automatic and depends on the circumstances of each request.`,
                },
                {
                    title: 'Completed Work',
                    icon: 'code-slash-outline',
                    body: 'Payments for completed milestones, delivered designs, developed features, consultations, maintenance, support, or other services already provided are generally non-refundable.',
                },
                {
                    title: 'Advance Payments',
                    icon: 'card-outline',
                    body: 'Advance payments are used to reserve resources and begin project planning or development. If a project is cancelled after work has started, the cost of completed work and committed resources may be deducted from any eligible refund.',
                },
                {
                    title: 'Third-Party Charges',
                    icon: 'link-outline',
                    body: 'Payments made for domains, hosting, cloud services, software licences, APIs, payment gateways, messaging services, or other third-party products are non-refundable once purchased or activated.',
                },
                {
                    title: 'Refund Timeline',
                    icon: 'time-outline',
                    body: 'If a refund is approved, it will be processed through the applicable payment method. The time required for the amount to appear may depend on the bank, payment provider, and any necessary verification.',
                },
                {
                    title: 'How to Raise a Request',
                    icon: 'headset-outline',
                    body: `To request a cancellation or refund, contact ${COMPANY.name} at ${COMPANY.supportNumber} or email ${COMPANY.email} with your project details, payment information, and reason for the request.`,
                },
            ]}
        />
    );
}