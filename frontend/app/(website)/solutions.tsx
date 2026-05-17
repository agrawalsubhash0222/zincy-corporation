import React, { useMemo, useRef, useState } from 'react';
import {
    Animated,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import Navbar from '@/components/Navbar';
import SolutionCard from '@/components/solutions/SolutionCard';
import { SOLUTIONS, solutionGroup, solutionItem } from '@/constants/solutions';
import { styles } from '@/styles/solutions.styles';

export default function SolutionsScreen() {
    const [activeGroup, setActiveGroup] = useState<solutionGroup>('digital');
    const [selectedSolution, setSelectedSolution] = useState<solutionItem>(SOLUTIONS[0]);

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const filteredSolutions = useMemo(
        () => SOLUTIONS.filter(item => item.group === activeGroup),
        [activeGroup]
    );

    const handleGroupChange = (group: solutionGroup) => {
        setActiveGroup(group);

        const firstSolution = SOLUTIONS.find(item => item.group === group);
        if (firstSolution) {
            setSelectedSolution(firstSolution);
        }
    };

    const handleCardPress = (item: solutionItem) => {
        setSelectedSolution(item);

        fadeAnim.setValue(0);
        slideAnim.setValue(18);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <View style={{ width: '100%', alignSelf: 'stretch' }}>
                <Navbar />
            </View>
            <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>

                    <Text style={styles.title}>Explore Our Services & Solutions</Text>

                    <Text style={styles.subtitle}>
                        We provide end-to-end digital services & solutions to help your business grow,
                        scale and succeed in the digital world.
                    </Text>
                </View>

                <View style={styles.tabWrapper}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleGroupChange('digital')}
                        style={[
                            styles.tabButton,
                            activeGroup === 'digital' && styles.activeTabButton,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeGroup === 'digital' && styles.activeTabText,
                            ]}
                        >
                            📣 Digital Marketing
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleGroupChange('software')}
                        style={[
                            styles.tabButton,
                            activeGroup === 'software' && styles.activeTabButton,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeGroup === 'software' && styles.activeTabText,
                            ]}
                        >
                            💻 Software & Solutions
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.cardGrid}>
                    {filteredSolutions.map(item => (
                        <SolutionCard
                            key={item.id}
                            item={item}
                            isActive={selectedSolution.id === item.id}
                            onPress={() => handleCardPress(item)}
                        />
                    ))}
                </View>

                <Animated.View
                    style={[
                        styles.detailPanel,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.detailLeft}>
                        <Text style={styles.detailTitle}>{selectedSolution.title}</Text>
                        <Text style={styles.detailText}>{selectedSolution.detailText}</Text>

                        {selectedSolution.points.map(point => (
                            <View key={point} style={styles.pointRow}>
                                <Text style={styles.checkIcon}>✓</Text>
                                <Text style={styles.pointText}>{point}</Text>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.quoteButton} activeOpacity={0.85}>
                            <Text style={styles.quoteButtonText}>Request a Quote  →</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailRight}>
                        <Text style={styles.bigIcon}>{selectedSolution.icon}</Text>

                        <View style={styles.metricGrid}>
                            <View style={styles.metricCard}>
                                <Text style={styles.metricValue}>250+</Text>
                                <Text style={styles.metricLabel}>Clients</Text>
                            </View>

                            <View style={styles.metricCard}>
                                <Text style={styles.metricValue}>500+</Text>
                                <Text style={styles.metricLabel}>Projects</Text>
                            </View>

                            <View style={styles.metricCard}>
                                <Text style={styles.metricValue}>98%</Text>
                                <Text style={styles.metricLabel}>Satisfaction</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                <View style={styles.ctaBox}>
                    <View>
                        <Text style={styles.ctaTitle}>🚀 Ready to grow your business?</Text>
                        <Text style={styles.ctaText}>Let&apos;s build something great together.</Text>
                    </View>

                    <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
                        <Text style={styles.ctaButtonText}>Get in Touch →</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}