import React, { useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import Navbar from '@/components/layout/Navbar';
import SolutionGrid from '@/components/solutions/SolutionGrid';
import SolutionsCTA from '@/components/solutions/SolutionsCTA';
import SolutionsHero from '@/components/solutions/SolutionsHero';
import SolutionTabs from '@/components/solutions/SolutionTabs';

import {
    solutionGroup,
    solutionItem,
    SOLUTIONS,
} from '@/constants/solutions';

import { styles } from '@/styles/solutions/solutions.styles';

export default function SolutionsScreen() {
    const { width } = useWindowDimensions();

    const columns = width <= 700 ? 1 : width <= 1050 ? 2 : 3;

    const [activeGroup, setActiveGroup] =
        useState<solutionGroup>('software');

    const [selectedSolution, setSelectedSolution] =
        useState<solutionItem | null>(null);

    const filteredSolutions = useMemo(
        () => SOLUTIONS.filter((item) => item.group === activeGroup),
        [activeGroup]
    );

    const rows = useMemo(() => {
        const result: solutionItem[][] = [];

        for (let i = 0; i < filteredSolutions.length; i += columns) {
            result.push(filteredSolutions.slice(i, i + columns));
        }

        return result;
    }, [filteredSolutions, columns]);

    const handleGroupChange = (group: solutionGroup) => {
        setActiveGroup(group);
        setSelectedSolution(null);
    };

    const handleCardPress = (item: solutionItem) => {
        if (selectedSolution?.id === item.id) {
            setSelectedSolution(null);
            return;
        }

        setSelectedSolution(item);
    };

    return (
        <View style={styles.root}>
            <Navbar />

            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <SolutionsHero />

                <SolutionTabs
                    activeGroup={activeGroup}
                    onChange={handleGroupChange}
                />

                <SolutionGrid
                    rows={rows}
                    selectedSolution={selectedSolution}
                    onCardPress={handleCardPress}
                    onCloseDetails={() => setSelectedSolution(null)}
                />

                <SolutionsCTA />
            </ScrollView>
        </View>
    );
}