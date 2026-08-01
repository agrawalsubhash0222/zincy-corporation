import { Feather, Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
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
    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/profile' as Href);
        }
    };

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.backButton}
                    onPress={handleBack}
                >
                    <Ionicons
                        name="arrow-back"
                        size={22}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>

                <View style={styles.headerTextBox}>
                    <Text numberOfLines={1} style={styles.headerTitle}>
                        {title}
                    </Text>

                    <Text numberOfLines={2} style={styles.headerSubtitle}>
                        {subtitle}
                    </Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {actions.length > 0 && (
                    <View style={styles.actionCard}>
                        {actions.map((action, index) => (
                            <TouchableOpacity
                                key={action.title}
                                activeOpacity={0.85}
                                style={[
                                    styles.actionItem,
                                    index === actions.length - 1 &&
                                    styles.lastActionItem,
                                ]}
                                onPress={action.onPress}
                            >
                                <View style={styles.actionIconCircle}>
                                    <Ionicons
                                        name={action.icon}
                                        size={21}
                                        color="#149BD7"
                                    />
                                </View>

                                <View style={styles.actionTextBox}>
                                    <Text style={styles.actionTitle}>
                                        {action.title}
                                    </Text>

                                    {!!action.subtitle && (
                                        <Text style={styles.actionSubtitle}>
                                            {action.subtitle}
                                        </Text>
                                    )}
                                </View>

                                <Feather
                                    name="chevron-right"
                                    size={20}
                                    color="#94A3B8"
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {sections.map((section) => (
                    <View key={section.title} style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            {!!section.icon && (
                                <View style={styles.sectionIconCircle}>
                                    <Ionicons
                                        name={section.icon}
                                        size={18}
                                        color="#149BD7"
                                    />
                                </View>
                            )}

                            <Text style={styles.sectionTitle}>
                                {section.title}
                            </Text>
                        </View>

                        <Text style={styles.sectionBody}>
                            {section.body}
                        </Text>
                    </View>
                ))}

                {children}

                <View style={styles.footerCard}>
                    <Text style={styles.footerTitle}>
                        {COMPANY.name}
                    </Text>
                    <Text style={styles.footerText}>
                        {COMPANY.tagline}
                    </Text>
                    <Text style={styles.footerVersion}>
                        App Version {COMPANY.version}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const openUrl = async (url: string) => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
        await Linking.openURL(url);
    }
};

export const openDialer = async (phone: string) => {
    const number = phone.replace(/[^\d+]/g, '');
    await openUrl(`tel:${number}`);
};

export const openEmail = async (email: string) => {
    await openUrl(`mailto:${encodeURIComponent(email.trim())}`);
};

export const openWhatsApp = async (phone: string) => {
    const number = phone.replace(/\D/g, '');
    const message =
        `Hello ${COMPANY.name}, I would like to discuss a software requirement.`;

    await openUrl(
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    );
};