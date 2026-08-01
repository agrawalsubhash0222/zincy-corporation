import { Feather, Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

import { legalStyles as styles } from '@/styles/shop/legal/legal.styles';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export type LegalSection = {
    title: string;
    body: string;
};

type LegalScreenProps = {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    sections: LegalSection[];
};

export default function LegalScreen({
    title,
    subtitle,
    icon,
    sections,
}: LegalScreenProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/profile' as Href);
        }
    };

    const toggleSection = (index: number) => {
        LayoutAnimation.configureNext(
            LayoutAnimation.Presets.easeInEaseOut
        );

        setOpenIndex((currentIndex) =>
            currentIndex === index ? null : index
        );
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
                <View style={styles.infoCard}>
                    {sections.map((section, index) => {
                        const isOpen = openIndex === index;

                        return (
                            <TouchableOpacity
                                key={section.title}
                                activeOpacity={0.86}
                                style={[
                                    styles.accordionItem,
                                    index === sections.length - 1 &&
                                    styles.lastAccordionItem,
                                ]}
                                onPress={() => toggleSection(index)}
                            >
                                <View style={styles.accordionHeader}>
                                    <Text style={styles.accordionTitle}>
                                        {section.title}
                                    </Text>

                                    <Feather
                                        name={
                                            isOpen
                                                ? 'chevron-up'
                                                : 'chevron-down'
                                        }
                                        size={20}
                                        color="#64748B"
                                    />
                                </View>

                                {isOpen && (
                                    <Text style={styles.accordionBody}>
                                        {section.body}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.footerNote}>
                    <Ionicons
                        name="shield-checkmark-outline"
                        size={18}
                        color="#149BD7"
                    />

                    <Text style={styles.footerText}>
                        Zincy Corporation is committed to transparent,
                        secure, and dependable software services.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}