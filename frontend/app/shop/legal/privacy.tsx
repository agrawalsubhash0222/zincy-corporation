import LegalScreen from '@/components/legal/LegalScreen';
import { COMPANY } from '@/constants/company';

export default function PrivacyScreen() {
    return (
        <LegalScreen
            title="Privacy Policy"
            subtitle={`How ${COMPANY.name} collects, uses, and protects your information.`}
            icon="shield-checkmark-outline"
            sections={[
                {
                    title: 'Information We Collect',
                    body: 'We may collect information such as your name, mobile number, email address, business details, project requirements, communications, payment records, and any information you provide while using our services.',
                },
                {
                    title: 'Technical Information',
                    body: 'When you use our website, application, or other digital services, we may collect limited technical information such as device type, browser, IP address, usage activity, and diagnostic data.',
                },
                {
                    title: 'How We Use Your Information',
                    body: 'We use your information to respond to enquiries, understand project requirements, provide software services, manage payments, communicate project updates, offer technical support, improve our services, and meet legal obligations.',
                },
                {
                    title: 'Project and Business Data',
                    body: 'Information, documents, credentials, content, and other materials shared for a project are used only for delivering the agreed services, providing support, and fulfilling applicable business or legal requirements.',
                },
                {
                    title: 'Sharing of Information',
                    body: 'We do not sell or rent your personal information. Information may be shared with trusted service providers when necessary for hosting, communication, payments, analytics, project delivery, or legal compliance.',
                },
                {
                    title: 'Payment Information',
                    body: 'Payments may be processed through third-party payment providers. We may retain transaction references and billing records, but sensitive payment details are handled according to the payment provider’s security and privacy practices.',
                },
                {
                    title: 'Data Security',
                    body: `${COMPANY.name} uses reasonable technical and organisational measures to protect information against unauthorised access, loss, misuse, or disclosure. However, no digital system or internet transmission can be guaranteed to be completely secure.`,
                },
                {
                    title: 'Data Retention',
                    body: 'We retain information only for as long as reasonably necessary to provide services, maintain project and payment records, resolve disputes, provide support, and comply with legal or regulatory requirements.',
                },
                {
                    title: 'Your Rights',
                    body: 'You may request access to or correction of your personal information. You may also request deletion where permitted, subject to contractual, legal, accounting, and legitimate business requirements.',
                },
                {
                    title: 'Policy Updates',
                    body: 'This Privacy Policy may be updated when our services, technology, or legal obligations change. The latest version will be made available through our website or application.',
                },
                {
                    title: 'Contact Us',
                    body: `For privacy-related questions, corrections, or requests, contact ${COMPANY.name} at ${COMPANY.email}.`,
                },
            ]}
        />
    );
}