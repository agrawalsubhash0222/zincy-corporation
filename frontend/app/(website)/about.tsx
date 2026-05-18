import React from 'react';
import { ScrollView, View } from 'react-native';

import AboutCard from '@/components/about/AboutCard';
import AboutHero from '@/components/about/AboutHero';
import { ABOUT_DATA } from '@/components/about/aboutData';
import Navbar from '@/components/layout/Navbar';

import { styles } from '@/styles/about.styles';

export default function AboutScreen() {
    return (
        <View style={styles.screen}>
            <Navbar />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <AboutHero />

                {ABOUT_DATA.map((item) => (
                    <AboutCard
                        key={item.title}
                        title={item.title}
                        description={item.description}
                    />
                ))}
            </ScrollView>
        </View>
    );
}