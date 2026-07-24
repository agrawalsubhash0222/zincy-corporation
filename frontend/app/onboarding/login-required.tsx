// app/onboarding/login-required.tsx

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { styles } from '@/styles/onboarding/loginRequired.styles';

export default function LoginRequiredScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <View style={styles.iconBox}>
                    <Ionicons name="person-circle-outline" size={58} color="#0A74DA" />
                </View>

                <Text style={styles.title}>You’re a Valued Member</Text>

                <Text style={styles.description}>
                    To start your onboarding journey with Zincy Corporation, please login
                    or create your account first.
                </Text>

                <Text style={styles.note}>
                    This helps us save your request, track your progress, and contact you
                    with updates.
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() =>
                        router.replace({
                            pathname: '/auth/login',
                            params: {
                                redirectTo: '/onboarding/check',
                            },
                        } as any)
                    }
                >
                    <Text style={styles.primaryButtonText}>Login / Sign Up</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}