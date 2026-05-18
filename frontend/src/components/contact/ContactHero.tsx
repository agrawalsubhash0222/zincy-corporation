import React from 'react';
import { Text, View } from 'react-native';

import { styles } from '@/styles/contact.styles';

export default function ContactHero() {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>Contact Us</Text>

            <Text style={styles.subtitle}>
                Let’s discuss how Zincy Corporation can help build your next digital solution.
            </Text>
        </View>
    );
}