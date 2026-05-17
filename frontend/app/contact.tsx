import React from 'react';
import {
    Linking,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import Navbar from '@/components/Navbar';
import { styles } from '@/styles/contact.styles';

export default function ContactScreen() {
  const openEmail = () => {
    Linking.openURL('mailto:contact@zincycorp.in');
  };

  const openPhone = () => {
    Linking.openURL('tel:+919999999999');
  };

  return (
    <View style={styles.screen}>
                 <Navbar />
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Contact Us</Text>
        <Text style={styles.subtitle}>
          Let’s discuss how Zincy Corporation can help build your next digital solution.
        </Text>
      </View>

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
    </ScrollView>
        </View>
  );
}