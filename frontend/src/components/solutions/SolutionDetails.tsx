import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { solutionItem } from '@/constants/solutions';
import { styles } from '@/styles/solutions/solutions.styles';

type Props = {
    item: solutionItem;
    onClose: () => void;
};

export default function SolutionDetails({ item, onClose }: Props) {
    return (
        <View style={styles.detailPanel}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={styles.closeButton}
            >
                <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>

            <View style={styles.detailTop}>
                <View style={styles.detailIconBox}>
                    <Text style={styles.detailIcon}>{item.icon}</Text>
                </View>

                <View style={styles.detailHeadingBox}>
                    <Text style={styles.detailTitle}>{item.title}</Text>

                    <Text style={styles.detailText}>{item.detailText}</Text>
                </View>
            </View>

            <View style={styles.detailBody}>
                <View style={styles.detailLeft}>
                    {item.points.map((point) => (
                        <View key={point} style={styles.pointRow}>
                            <Text style={styles.checkIcon}>✓</Text>
                            <Text style={styles.pointText}>{point}</Text>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.quoteButton} activeOpacity={0.85}>
                        <Text style={styles.quoteButtonText}>Get Started →</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.detailRight}>
                    <View style={styles.metricGrid}>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricValue}>250+</Text>
                            <Text style={styles.metricLabel}>Happy Clients</Text>
                        </View>

                        <View style={styles.metricCard}>
                            <Text style={styles.metricValue}>500+</Text>
                            <Text style={styles.metricLabel}>Projects</Text>
                        </View>

                        <View style={styles.metricCard}>
                            <Text style={styles.metricValue}>2.5X</Text>
                            <Text style={styles.metricLabel}>Growth</Text>
                        </View>

                        <View style={styles.metricCard}>
                            <Text style={styles.metricValue}>98%</Text>
                            <Text style={styles.metricLabel}>Satisfaction</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}