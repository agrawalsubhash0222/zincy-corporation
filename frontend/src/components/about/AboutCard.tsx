import React from 'react';
import { Text, View } from 'react-native';

import { styles } from '@/styles/about.styles';

type Props = {
    title: string;
    description: string;
};

export default function AboutCard({
    title,
    description,
}: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>

            <Text style={styles.cardText}>
                {description}
            </Text>
        </View>
    );
}