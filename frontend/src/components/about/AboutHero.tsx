import React from 'react';
import { Text } from 'react-native';

import { styles } from '@/styles/about.styles';

export default function AboutHero() {
    return (
        <>
            <Text style={styles.badge}>ABOUT ZINCY CORPORATION</Text>

            <Text style={styles.title}>
                We Build Digital Solutions That Help Businesses Grow
            </Text>

            <Text style={styles.description}>
                Zincy Corporation Pvt. Ltd. is a technology company focused on
                building smart, secure, scalable and future-ready digital solutions
                for modern businesses.
            </Text>
        </>
    );
}