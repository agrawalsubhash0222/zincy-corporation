import React from 'react';
import { ScrollView, View } from 'react-native';

import ContactForm from '@/components/contact/ContactForm';
import ContactHero from '@/components/contact/ContactHero';
import ContactInfo from '@/components/contact/ContactInfo';
import Navbar from '@/components/layout/Navbar';

import { styles } from '@/styles/contact.styles';

export default function ContactScreen() {
  return (
    <View style={styles.screen}>
      <Navbar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <ContactHero />

          <ContactForm />

          <ContactInfo />
        </View>
      </ScrollView>
    </View>
  );
}