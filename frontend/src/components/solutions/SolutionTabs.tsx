import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import {
    solutionGroup,
} from '@/constants/solutions';

import { styles } from '@/styles/solutions/solutions.styles';

type Props = {
    activeGroup: solutionGroup;
    onChange: (group: solutionGroup) => void;
};

export default function SolutionTabs({
    activeGroup,
    onChange,
}: Props) {
    return (
        <View style={styles.tabWrapper}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onChange('software')}
                style={[
                    styles.tabButton,
                    activeGroup === 'software' &&
                    styles.activeTabButton,
                ]}
            >
                <Text
                    style={[
                        styles.tabText,
                        activeGroup === 'software' &&
                        styles.activeTabText,
                    ]}
                >
                    💻 Software & Solutions
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onChange('digital')}
                style={[
                    styles.tabButton,
                    activeGroup === 'digital' &&
                    styles.activeTabButton,
                ]}
            >
                <Text
                    style={[
                        styles.tabText,
                        activeGroup === 'digital' &&
                        styles.activeTabText,
                    ]}
                >
                    📣 Digital Marketing
                </Text>
            </TouchableOpacity>
        </View>
    );
}