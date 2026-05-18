import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

import { styles } from '@/styles/contact.styles';

export default function ContactInfo() {
    const openEmail = () => {
        Linking.openURL('mailto:contact@zincycorp.in');
    };

    const openPhone = () => {
        Linking.openURL('tel:+917033097278');
    };

    return (
        <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Get in Touch</Text>

            <TouchableOpacity onPress={openEmail}>
                <Text style={styles.infoText}>Email: contact@zincycorp.in</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={openPhone}>
                <Text style={styles.infoText}>Phone: +91 7033097278</Text>
            </TouchableOpacity>

            <Text style={styles.infoText}>Website: www.zincycorp.in</Text>
        </View>
    );
}