import React from 'react';
import { View } from 'react-native';

import { solutionItem } from '@/constants/solutions';
import { styles } from '@/styles/solutions/solutions.styles';

import SolutionCard from './SolutionCard';
import SolutionDetails from './SolutionDetails';

type Props = {
    rows: solutionItem[][];
    selectedSolution: solutionItem | null;
    onCardPress: (item: solutionItem) => void;
    onCloseDetails: () => void;
};

export default function SolutionGrid({
    rows,
    selectedSolution,
    onCardPress,
    onCloseDetails,
}: Props) {
    return (
        <View style={styles.servicesWrapper}>
            {rows.map((row, rowIndex) => {
                const rowHasSelected =
                    selectedSolution &&
                    row.some((item) => item.id === selectedSolution.id);

                return (
                    <View key={`row-${rowIndex}`}>
                        <View style={styles.cardGrid}>
                            {row.map((item) => (
                                <SolutionCard
                                    key={item.id}
                                    item={item}
                                    isActive={selectedSolution?.id === item.id}
                                    onPress={() => onCardPress(item)}
                                />
                            ))}
                        </View>

                        {rowHasSelected && selectedSolution && (
                            <SolutionDetails
                                item={selectedSolution}
                                onClose={onCloseDetails}
                            />
                        )}
                    </View>
                );
            })}
        </View>
    );
}