import React from 'react';
import {
    Image,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import { solutionItem } from '@/constants/solutions';
import { styles } from '@/styles/solutions/solutions.styles';

type Props = {
    item: solutionItem;
    onClose: () => void;
};

export default function SolutionDetails({ item, onClose }: Props) {
    const { width } = useWindowDimensions();

    const isMobile = width <= 700;

    return (
        <View style={styles.detailPanel}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={styles.closeButton}
            >
                <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>

            <View style={styles.detailTop}>
                <View style={styles.detailIconBox}>
                    <Text style={styles.detailIcon}>{item.icon}</Text>
                </View>

                <View style={styles.detailHeadingBox}>
                    <Text style={styles.detailTitle}>{item.title}</Text>

                    <Text style={styles.detailText}>
                        {item.detailText}
                    </Text>
                </View>
            </View>

            <View style={styles.detailBody}>
                {/* LEFT SIDE */}
                <View style={styles.detailLeft}>
                    {item.points.map((point) => (
                        <View key={point} style={styles.pointRow}>
                            <Text style={styles.checkIcon}>✓</Text>
                            <Text style={styles.pointText}>{point}</Text>
                        </View>
                    ))}

                    {/* WEB BUTTON */}
                    {!isMobile && (
                        <TouchableOpacity
                            style={styles.quoteButton}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.quoteButtonText}>
                                Get Started →
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* IMAGE */}
                {item.detailImage && (
                    <View style={styles.detailImageBox}>
                        <Image
                            source={item.detailImage}
                            style={styles.detailImage}
                            resizeMode="contain"
                        />
                    </View>
                )}
            </View>

            {/* MOBILE BUTTON */}
            {isMobile && (
                <TouchableOpacity
                    style={styles.quoteButton}
                    activeOpacity={0.85}
                >
                    <Text style={styles.quoteButtonText}>
                        Get Started →
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}