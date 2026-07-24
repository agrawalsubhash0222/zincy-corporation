import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { styles } from '@/styles/onboarding/budgetTimeline.styles';

const BUDGET_OPTIONS = [
    'Below ₹25,000',
    '₹25,000 - ₹50,000',
    '₹50,000 - ₹1,00,000',
    'Above ₹1,00,000',
    'Not Sure',
];

const TIMELINE_OPTIONS = [
    'Within 7 Days',
    'Within 15 Days',
    'Within 1 Month',
    'Flexible',
];

export default function BudgetTimelineScreen() {
    const { data, updateData } = useOnboarding();

    const [budget, setBudget] = useState(data.budget || '');
    const [timeline, setTimeline] = useState(data.timeline || '');

    const [errors, setErrors] = useState({
        budget: '',
        timeline: '',
    });

    const handleContinue = () => {
        const newErrors = {
            budget: '',
            timeline: '',
        };

        if (!budget) {
            newErrors.budget = 'Please select your estimated budget.';
        }

        if (!timeline) {
            newErrors.timeline = 'Please select your expected timeline.';
        }

        setErrors(newErrors);

        const hasError = Object.values(newErrors).some((error) => error !== '');

        if (hasError) {
            return;
        }

        updateData({
            budget,
            timeline,
        });

        router.push('/onboarding/review-submit');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={{ marginRight: 12 }}>
                                <Ionicons name="arrow-back" size={24} color="#0F172A" />
                            </TouchableOpacity>

                            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A' }}>
                                Budget & Timeline
                            </Text>
                        </View>

                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#0EA5E9' }}>
                            Step 3 of 4
                        </Text>
                    </View>

                    <Text style={{ marginTop: 12, fontSize: 15, color: '#64748B', lineHeight: 22 }}>
                        This helps us suggest a realistic plan for your project.
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.sectionTitle}>Estimated Budget</Text>
                    <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '900', marginLeft: 3 }}>
                        *
                    </Text>
                </View>

                <View style={styles.optionList}>
                    {BUDGET_OPTIONS.map((item) => (
                        <OptionCard
                            key={item}
                            label={item}
                            selected={budget === item}
                            onPress={() => {
                                setBudget(item);
                                setErrors((prev) => ({ ...prev, budget: '' }));
                            }}
                        />
                    ))}
                </View>

                {errors.budget ? (
                    <Text style={{ marginTop: 6, fontSize: 12, fontWeight: '600', color: '#EF4444' }}>
                        {errors.budget}
                    </Text>
                ) : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
                    <Text style={styles.sectionTitle}>Expected Timeline</Text>
                    <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '900', marginLeft: 3 }}>
                        *
                    </Text>
                </View>

                <View style={styles.optionList}>
                    {TIMELINE_OPTIONS.map((item) => (
                        <OptionCard
                            key={item}
                            label={item}
                            selected={timeline === item}
                            onPress={() => {
                                setTimeline(item);
                                setErrors((prev) => ({ ...prev, timeline: '' }));
                            }}
                        />
                    ))}
                </View>

                {errors.timeline ? (
                    <Text style={{ marginTop: 6, fontSize: 12, fontWeight: '600', color: '#EF4444' }}>
                        {errors.timeline}
                    </Text>
                ) : null}
            </ScrollView>

            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.button}
                onPress={handleContinue}
            >
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

type OptionCardProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
};

function OptionCard({ label, selected, onPress }: OptionCardProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.optionCard, selected && styles.optionCardActive]}
            onPress={onPress}
        >
            <Text style={[styles.optionText, selected && styles.optionTextActive]}>
                {label}
            </Text>

            <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={selected ? '#0ea5e9' : '#CBD5E1'}
            />
        </TouchableOpacity>
    );
}