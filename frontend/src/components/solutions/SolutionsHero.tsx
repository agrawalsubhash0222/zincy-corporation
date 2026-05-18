import React from 'react';
import { Text, View } from 'react-native';

import { styles } from '@/styles/solutions/solutions.styles';

export default function SolutionsHero() {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>
                Explore Our Services & Solutions
            </Text>

            <Text style={styles.subtitle}>
                We provide end-to-end digital services & solutions to help your
                business grow, scale and succeed in the digital world.
            </Text>
        </View>
    );
}