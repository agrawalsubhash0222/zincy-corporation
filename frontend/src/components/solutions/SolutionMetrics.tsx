import React from 'react';
import { Text, View } from 'react-native';

import { styles } from '@/styles/solutions/solutions.styles';

export default function SolutionMetrics() {
    return (
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
    );
}