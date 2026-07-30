import { Feather, Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { COMPANY } from '@/constants/company';
import { infoStyles as styles } from '@/styles/shop/info/info.styles';

export type InfoSection = {
    title: string;
    body: string;
    icon?: keyof typeof Ionicons.glyphMap;
};

type ActionButton = {
    title: string;
    subtitle?: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
};

type InfoScreenProps = {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    sections?: InfoSection[];
    actions?: ActionButton[];
    children?: ReactNode;
};

export default function InfoScreen({
    title,
    subtitle,
    icon,
    sections = [],
    actions = [],
    children,
}: InfoScreenProps) {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
                <View style={styles.heroRow}>
                    <View style={styles.heroIcon}>
                        <Ionicons name={icon} size={27} color="#149BD7" />
                    </View>

                    <View style={styles.heroTextBox}>
                        <Text style={styles.heroTitle}>{title}</Text>
                        <Text style={styles.heroSubtitle}>{subtitle}</Text>

                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Updated {COMPANY.updatedAt}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {actions.length > 0 && (
                <View style={styles.actionCard}>
                    {actions.map((action, index) => (
                        <TouchableOpacity
                            key={action.title}
                            activeOpacity={0.85}
                            style={[
                                styles.actionItem,
                                index === actions.length - 1 && styles.lastActionItem,
                            ]}
                            onPress={action.onPress}
                        >
                            <View style={styles.actionIconCircle}>
                                <Ionicons name={action.icon} size={21} color="#149BD7" />
                            </View>

                            <View style={styles.actionTextBox}>
                                <Text style={styles.actionTitle}>{action.title}</Text>
                                {!!action.subtitle && (
                                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                                )}
                            </View>

                            <Feather name="chevron-right" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {sections.map((section) => (
                <View key={section.title} style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        {!!section.icon && (
                            <View style={styles.sectionIconCircle}>
                                <Ionicons name={section.icon} size={18} color="#149BD7" />
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>{section.title}</Text>
                    </View>

                    <Text style={styles.sectionBody}>{section.body}</Text>
                </View>
            ))}

            {children}

            <View style={styles.footerCard}>
                <Text style={styles.footerTitle}>{COMPANY.name}</Text>
                <Text style={styles.footerText}>{COMPANY.tagline}</Text>
                <Text style={styles.footerVersion}>App Version {COMPANY.version}</Text>
            </View>
        </ScrollView>
    );
}

export const openDialer = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
};

export const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
};

export const openWhatsApp = (phone: string) => {
    const number = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${number}`);
};