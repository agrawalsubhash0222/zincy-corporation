import { styles } from '@/styles/onboarding/onboarding.styles';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
    BackHandler,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function OnboardingScreen() {
    const handleBack = () => {
        router.replace('/');
    };

    useFocusEffect(
        useCallback(() => {
            const handleHardwareBack = () => {
                router.replace('/');
                return true;
            };

            const subscription = BackHandler.addEventListener(
                'hardwareBackPress',
                handleHardwareBack
            );

            return () => {
                subscription.remove();
            };
        }, [])
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    zIndex: 10,
                    elevation: 10,
                }}
            >
                <TouchableOpacity
                    onPress={handleBack}
                    activeOpacity={0.75}
                    hitSlop={{
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10,
                    }}
                    style={{
                        zIndex: 11,
                    }}
                >
                    <Ionicons
                        name="arrow-back"
                        size={26}
                        color="#1E293B"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name="business-outline"
                        size={46}
                        color="#0ea5e9"
                    />
                </View>

                <Text style={styles.title}>
                    Welcome to Zincy Corporation
                </Text>

                <Text style={styles.subtitle}>
                    Let&apos;s understand your business and project requirement
                    before we begin.
                </Text>

                <View style={styles.infoCard}>
                    <InfoItem
                        icon="time-outline"
                        text="Takes only 1-2 minutes"
                    />

                    <InfoItem
                        icon="briefcase-outline"
                        text="Business and contact details"
                    />

                    <InfoItem
                        icon="layers-outline"
                        text="Project requirement and expectations"
                    />

                    <InfoItem
                        icon="shield-checkmark-outline"
                        text="Your information stays secure"
                    />
                </View>
            </View>

            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.primaryButton}
                onPress={() => {
                    router.push(
                        '/onboarding/business-information/business-details'
                    );
                }}
            >
                <Text style={styles.primaryButtonText}>
                    Get Started
                </Text>

                <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

function InfoItem({
    icon,
    text,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
}) {
    return (
        <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
                <Ionicons
                    name={icon}
                    size={18}
                    color="#0ea5e9"
                />
            </View>

            <Text style={styles.infoText}>
                {text}
            </Text>
        </View>
    );
}