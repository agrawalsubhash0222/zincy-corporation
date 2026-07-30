import { Feather, Ionicons } from '@expo/vector-icons';
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

    const toggleSection = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
                <View style={styles.heroTop}>
                    <View style={styles.heroIcon}>
                        <Ionicons name={icon} size={26} color="#149BD7" />
                    </View>

                    <View style={styles.heroTextBox}>
                        <Text style={styles.heroTitle}>{title}</Text>
                        <Text style={styles.heroSubtitle}>{subtitle}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.infoCard}>
                {sections.map((section, index) => {
                    const isOpen = openIndex === index;

                    return (
                        <TouchableOpacity
                            key={section.title}
                            activeOpacity={0.86}
                            style={[
                                styles.accordionItem,
                                index === sections.length - 1 && styles.lastAccordionItem,
                            ]}
                            onPress={() => toggleSection(index)}
                        >
                            <View style={styles.accordionHeader}>
                                <Text style={styles.accordionTitle}>{section.title}</Text>

                                <Feather
                                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color="#64748B"
                                />
                            </View>

                            {isOpen && (
                                <Text style={styles.accordionBody}>{section.body}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.footerNote}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#149BD7" />
                <Text style={styles.footerText}>
                    Zincy Corporation keeps customer service simple, transparent, and secure.
                </Text>
            </View>
        </ScrollView>
    );
}