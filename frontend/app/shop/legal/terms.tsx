import LegalScreen from '@/components/legal/LegalScreen';
import { COMPANY } from '@/constants/company';

export default function TermsScreen() {
    return (
        <LegalScreen
            title="Terms & Conditions"
            subtitle={`Terms governing the use of ${COMPANY.name} software and services.`}
            icon="document-text-outline"
            sections={[
                {
                    title: 'Acceptance of Terms',
                    body: `By accessing or using ${COMPANY.name} websites, applications, software products, or services, you agree to these Terms & Conditions. If you do not agree with these terms, you should not use our services.`,
                },
                {
                    title: 'Software Services',
                    body: `${COMPANY.name} provides website development, mobile application development, custom software, e-commerce solutions, maintenance, technical support, and related technology services based on agreed project requirements.`,
                },
                {
                    title: 'Project Scope',
                    body: 'The project scope, features, deliverables, timeline, technology, and cost will be based on the quotation, proposal, agreement, or written requirements accepted by the client. Work outside the agreed scope may require additional time and charges.',
                },
                {
                    title: 'Client Responsibilities',
                    body: 'Clients must provide accurate requirements, content, approvals, credentials, feedback, and other resources required for the project. Delays in providing these items may affect the project timeline and delivery.',
                },
                {
                    title: 'Payments',
                    body: 'Payments must be made according to the agreed schedule or project milestones. Work may be paused or delivery withheld when a payment becomes overdue. Third-party costs may require advance payment.',
                },
                {
                    title: 'Changes and Revisions',
                    body: 'Reasonable revisions may be provided within the agreed project scope. New features, major design changes, or requirements introduced after approval may be treated as additional work and may affect the cost and delivery timeline.',
                },
                {
                    title: 'Project Delivery',
                    body: 'Delivery dates are reasonable estimates based on the agreed scope and timely client cooperation. Timelines may change due to revised requirements, delayed feedback, third-party dependencies, technical complexity, or circumstances beyond our reasonable control.',
                },
                {
                    title: 'Third-Party Services',
                    body: 'Projects may use third-party products or services such as hosting, domains, cloud platforms, APIs, payment gateways, messaging services, and software libraries. Their availability, pricing, security, and terms are controlled by their respective providers.',
                },
                {
                    title: 'Intellectual Property',
                    body: `Unless otherwise agreed in writing, ${COMPANY.name} retains ownership of its pre-existing tools, reusable components, frameworks, methods, branding, and general technical knowledge. Ownership of project-specific deliverables will be governed by the applicable project agreement and completion of all required payments.`,
                },
                {
                    title: 'Confidentiality',
                    body: 'Both parties should protect confidential business, technical, and project information received during the engagement and should not disclose it except when required to deliver the services or comply with applicable law.',
                },
                {
                    title: 'Acceptable Use',
                    body: `Users must not misuse ${COMPANY.name} services, attempt unauthorised access, introduce malicious code, disrupt system operations, violate intellectual property rights, or use our services for unlawful or fraudulent activities.`,
                },
                {
                    title: 'Warranty and Support',
                    body: 'Support and correction of verified software issues will be provided according to the applicable project agreement or support plan. Issues caused by unauthorised modifications, third-party services, misuse, or requirements outside the agreed scope may require additional charges.',
                },
                {
                    title: 'Cancellation and Refunds',
                    body: 'Project cancellation and refund requests are handled according to our Refund & Cancellation Policy, completed work, committed resources, third-party expenses, and the terms agreed with the client.',
                },
                {
                    title: 'Limitation of Liability',
                    body: `${COMPANY.name} will not be liable for indirect, incidental, special, or consequential losses arising from the use or inability to use our software or services, except where liability cannot be excluded under applicable law.`,
                },
                {
                    title: 'Policy Updates',
                    body: `These Terms & Conditions may be updated to reflect changes in our services, business practices, or legal obligations. Continued use of ${COMPANY.name} services after an update constitutes acceptance of the revised terms.`,
                },
                {
                    title: 'Contact Us',
                    body: `For questions regarding these Terms & Conditions, contact ${COMPANY.name} at ${COMPANY.email}.`,
                },
            ]}
        />
    );
}