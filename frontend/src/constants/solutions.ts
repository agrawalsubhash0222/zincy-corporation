export type solutionGroup = 'digital' | 'software';

export type solutionItem = {
    id: string;
    group: solutionGroup;
    icon: string;
    title: string;
    shortText: string;
    detailText: string;
    points: string[];
};

export const SOLUTIONS: solutionItem[] = [
    {
        id: 'social-media',
        group: 'digital',
        icon: '📱',
        title: 'Social Media Marketing',
        shortText: 'Facebook, YouTube, Instagram and brand growth campaigns.',
        detailText:
            'We create engaging social media strategies that build brand awareness, increase audience engagement and drive real business results.',
        points: [
            'Profile Setup & Branding',
            'Content Strategy & Creation',
            'Paid Advertising Campaigns',
            'Audience Growth & Engagement',
            'Performance Tracking & Reporting',
        ],
    },
    {
        id: 'seo',
        group: 'digital',
        icon: '🔍',
        title: 'Search Engine Optimization',
        shortText: 'Improve Google ranking, visibility and organic traffic.',
        detailText:
            'We optimize your website to rank better on search engines and bring long-term organic traffic to your business.',
        points: [
            'Keyword Research',
            'On-page SEO',
            'Technical SEO',
            'Local SEO',
            'SEO Reports',
        ],
    },
    {
        id: 'google-ads',
        group: 'digital',
        icon: '🎯',
        title: 'Google Ads',
        shortText: 'Targeted ad campaigns to generate leads and conversions.',
        detailText:
            'We run result-focused Google Ads campaigns to bring quality leads, website traffic and measurable conversions.',
        points: [
            'Search Ads',
            'Display Ads',
            'Lead Campaigns',
            'Conversion Tracking',
            'Campaign Optimization',
        ],
    },
    // {
    //     id: 'custom-software',
    //     group: 'software',
    //     icon: '💻',
    //     title: 'Customized Software Development',
    //     shortText: 'Custom software built to solve your unique business challenges.',
    //     detailText:
    //         'We build secure and scalable software solutions based on your exact business process.',
    //     points: ['Requirement Analysis', 'Custom Development', 'Admin Panel', 'API Integration'],
    // },
    {
        id: 'mobile-app',
        group: 'software',
        icon: '📲',
        title: 'Mobile App Development',
        shortText: 'High performance, feature-rich Android & iOS applications.',
        detailText:
            'We create fast, modern and scalable mobile apps for Android and iOS platforms.',
        points: ['Android App', 'iOS App', 'API Integration', 'Secure Login'],
    },
    {
        id: 'web-development',
        group: 'software',
        icon: '🌐',
        title: 'Web Designing & Development',
        shortText: 'Modern, responsive websites and e-commerce solutions.',
        detailText:
            'We design and develop professional websites for businesses, e-commerce and solution platforms.',
        points: ['Business Website', 'E-commerce Website', 'Responsive UI', 'SEO Friendly'],
    },
    {
        id: 'billing-invoicing',
        group: 'software',
        icon: '🧾',
        title: 'Billing & Invoicing Software',
        shortText:
            'Smart billing, invoice generation, payment tracking and business reports.',
        detailText:
            'We build billing and invoicing software to help businesses create invoices, manage customers, track payments, monitor sales and generate reports easily.',
        points: [
            'Invoice Generation',
            'Customer Management',
            'Payment Tracking',
            'Sales Reports',
            'GST-ready Billing Flow',
        ],
    },

    // {
    //     id: 'crm',
    //     group: 'software',
    //     icon: '🤝',
    //     title: 'CRM Solutions',
    //     shortText: 'Manage leads, customers and relationships efficiently.',
    //     detailText:
    //         'We help businesses manage leads, customers, follow-ups and sales activity in one place.',
    //     points: ['Lead Management', 'Customer Records', 'Follow-ups', 'Sales Reports'],
    // },
    // {
    //     id: 'erp',
    //     group: 'software',
    //     icon: '🏢',
    //     title: 'ERP Solutions',
    //     shortText: 'Streamline operations and manage your entire business in one place.',
    //     detailText:
    //         'ERP solutions help you manage inventory, billing, employees, finance and operations together.',
    //     points: ['Inventory', 'Billing', 'Reports', 'Operations Management'],
    // },
    {
        id: 'business-solutions',
        group: 'software',
        icon: '⚙️',
        title: 'Customized Business Solutions',
        shortText: 'Tailor-made solutions to meet all your business requirements.',
        detailText:
            'We create digital solutions for your specific business problems and growth requirements.',
        points: ['Business Automation', 'Custom Workflow', 'Reports', 'Digital Transformation'],
    },
];