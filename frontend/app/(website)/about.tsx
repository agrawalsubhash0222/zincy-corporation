//import Navbar from '@/src/components/common/Navbar';
import Navbar from '@/components/Navbar';
import { styles } from '@/styles/about.styles';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function AboutScreen() {
    return (
         <View style={styles.screen}>
             <Navbar />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.badge}>ABOUT ZINCY CORPORATION</Text>

                <Text style={styles.title}>
                    We Build Digital Solutions That Help Businesses Grow
                </Text>

                <Text style={styles.description}>
                    Zincy Corporation PVT. LTD. is a technology company focused on building
                    smart, secure, scalable and future-ready digital solutions for modern
                    businesses.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Our Mission</Text>
                    <Text style={styles.cardText}>
                        To transform ideas into reliable digital products that create real
                        business impact.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>What We Do</Text>
                    <Text style={styles.cardText}>
                        We design and develop websites, mobile apps, business software,
                        automation systems and custom technology platforms.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Why Choose Us</Text>
                    <Text style={styles.cardText}>
                        We focus on clean design, strong security, scalable architecture and
                        long-term business value.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}