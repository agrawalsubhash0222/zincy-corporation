import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { styles } from '@/styles/contact.styles';

export default function ContactForm() {
    return (
        <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="Enter your name" />

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Tell us about your requirement"
                multiline
            />

            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Submit Enquiry</Text>
            </TouchableOpacity>
        </View>
    );
}