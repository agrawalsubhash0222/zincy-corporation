import LegalScreen from '@/components/legal/LegalScreen';

export default function FAQsScreen() {
    return (
        <LegalScreen
            title="FAQs"
            subtitle="Quick answers about Zincy Corporation and our software services."
            icon="help-circle-outline"
            sections={[
                {
                    title: 'What is Zincy Corporation?',
                    body: 'Zincy Corporation is a software company that designs and develops websites, mobile applications, business software, e-commerce platforms, and customized digital solutions.',
                },
                {
                    title: 'What software services do you provide?',
                    body: 'We provide website development, mobile app development, custom software development, e-commerce solutions, UI/UX design, software maintenance, technical support, and other technology services based on client requirements.',
                },
                {
                    title: 'How can I discuss a project?',
                    body: 'You can contact us by phone, WhatsApp, or email and share your requirements, business goals, preferred timeline, and available budget. Our team will review the details and discuss a suitable solution with you.',
                },
                {
                    title: 'How is the project cost determined?',
                    body: 'Project cost depends on requirements, features, design, technology, integrations, timeline, and overall complexity. A quotation or proposal is provided after the requirements have been reviewed.',
                },
                {
                    title: 'How long does development take?',
                    body: 'The development timeline depends on the project scope and complexity. An estimated timeline is shared after the requirements are understood and may be updated if the scope changes during development.',
                },
                {
                    title: 'Can I request changes during development?',
                    body: 'Yes. Changes can be requested during development. Minor changes may be included within the agreed scope, while significant changes or additional features may affect the cost and delivery timeline.',
                },
                {
                    title: 'Will I receive updates about my project?',
                    body: 'Yes. We provide progress updates at appropriate stages and may share designs, demonstrations, or test versions for review and feedback.',
                },
                {
                    title: 'Do you provide support after delivery?',
                    body: 'Yes. Post-delivery support, maintenance, updates, and issue resolution may be provided according to the project agreement or a separate support plan.',
                },
                {
                    title: 'Can I cancel a project or request a refund?',
                    body: 'Cancellation and refund eligibility depend on the project stage, completed work, committed resources, and agreed terms. Please refer to our Refund & Cancellation Policy for complete details.',
                },
            ]}
        />
    );
}