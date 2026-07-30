import InfoScreen from '@/components/info/InfoScreen';
import { COMPANY } from '@/constants/company';

export default function AboutUsScreen() {
    return (
        <InfoScreen
            title="About Us"
            subtitle={`Discover how ${COMPANY.name} turns ideas into digital solutions.`}
            icon="code-slash-outline"
            sections={[
                {
                    title: 'Who We Are',
                    icon: 'business-outline',
                    body: `${COMPANY.name} is a software company focused on building reliable, secure, and user-friendly digital solutions for individuals, startups, and businesses.`,
                },
                {
                    title: 'What We Do',
                    icon: 'laptop-outline',
                    body: 'We design and develop modern websites, mobile applications, business software, e-commerce platforms, and customized digital solutions based on our clients’ requirements.',
                },
                {
                    title: 'Our Mission',
                    icon: 'flag-outline',
                    body: 'Our mission is to simplify technology and help businesses grow through practical, scalable, and cost-effective software solutions.',
                },
                {
                    title: 'Our Approach',
                    icon: 'git-branch-outline',
                    body: 'We understand each requirement carefully and follow a structured development process—from planning and design to development, testing, deployment, and ongoing support.',
                },
                {
                    title: 'Why Choose Us',
                    icon: 'shield-checkmark-outline',
                    body: `At ${COMPANY.name}, we value quality, transparency, security, and timely delivery. We build solutions that are easy to use, maintain, and scale as your business grows.`,
                },
                {
                    title: 'Our Vision',
                    icon: 'eye-outline',
                    body: 'Our vision is to become a trusted technology partner for businesses by delivering innovative digital products that create meaningful and lasting value.',
                },
                {
                    title: 'Our Commitment',
                    icon: 'ribbon-outline',
                    body: `We are committed to providing dependable technology, responsive support, and a professional experience throughout every project delivered by ${COMPANY.name}.`,
                },
            ]}
        />
    );
}