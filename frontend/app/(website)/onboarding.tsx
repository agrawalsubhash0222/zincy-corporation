import { Text, View } from 'react-native';

export default function OnboardingScreen() {
    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#ffffff',
                padding: 24,
                justifyContent: 'center',
            }}
        >
            <Text
                style={{
                    fontSize: 28,
                    fontWeight: '900',
                    color: '#020617',
                    marginBottom: 12,
                }}
            >
                Start Onboarding
            </Text>

            <Text
                style={{
                    fontSize: 16,
                    lineHeight: 24,
                    color: '#475569',
                }}
            >
                Welcome to Zincy Corporation onboarding. We will collect your business
                details and understand your project requirement here.
            </Text>
        </View>
    );
}