import InfoScreen, {
    openDialer,
    openEmail,
    openWhatsApp,
} from '@/components/info/InfoScreen';
import { COMPANY } from '@/constants/company';

export default function ContactUsScreen() {
    return (
        <InfoScreen
            title="Contact Us"
            subtitle={`Connect with ${COMPANY.name} for software solutions and support.`}
            icon="call-outline"
            actions={[
                {
                    title: 'Call Us',
                    subtitle: COMPANY.supportNumber,
                    icon: 'call-outline',
                    onPress: () => openDialer(COMPANY.supportNumber),
                },
                {
                    title: 'WhatsApp Us',
                    subtitle: COMPANY.whatsappNumber,
                    icon: 'logo-whatsapp',
                    onPress: () => openWhatsApp(COMPANY.whatsappNumber),
                },
                {
                    title: 'Email Us',
                    subtitle: COMPANY.email,
                    icon: 'mail-outline',
                    onPress: () => openEmail(COMPANY.email),
                },
            ]}
            sections={[
                {
                    title: 'Office Address',
                    icon: 'location-outline',
                    body: COMPANY.address,
                },
                {
                    title: 'Business Hours',
                    icon: 'time-outline',
                    body: COMPANY.workingHours,
                },
                {
                    title: 'Project Enquiries',
                    icon: 'code-slash-outline',
                    body: 'Have an idea or need a custom software solution? Contact us with your requirements, preferred timeline, and business goals. Our team will review your enquiry and discuss the best way to bring your idea to life.',
                },
                {
                    title: 'Technical Support',
                    icon: 'construct-outline',
                    body: 'For technical assistance with an existing project, please share the project name and a clear description of the issue. Screenshots or error details can help our team provide faster support.',
                },
                {
                    title: 'Response Time',
                    icon: 'chatbubbles-outline',
                    body: `${COMPANY.name} usually responds during business hours. Response times may vary depending on the nature and complexity of your enquiry.`,
                },
            ]}
        />
    );
}