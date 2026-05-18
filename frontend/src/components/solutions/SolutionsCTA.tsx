import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { styles } from '@/styles/solutions/solutions.styles';


export default function SolutionsCTA() {
    return (
        <View style={styles.ctaBox}>
            <View style={styles.ctaContent}>
                <Text style={styles.ctaTitle}>
                    🚀 Ready to grow your business?
                </Text>

                <Text style={styles.ctaText}>
                    Let&apos;s build something great together.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.ctaButton}
                activeOpacity={0.85}
            >
                <Text style={styles.ctaButtonText}>
                    Get in Touch →
                </Text>
            </TouchableOpacity>
        </View>
    );
}