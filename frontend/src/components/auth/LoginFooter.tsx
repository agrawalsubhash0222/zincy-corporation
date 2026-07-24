import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { styles } from '@/styles/auth/login.styles';

export default function LoginFooter() {
  const router = useRouter();

  return (
    <View style={styles.footerBox}>
      <Text style={styles.footerText}>
        Don&apos;t have an account?{' '}
        <Text style={styles.link} onPress={() => router.replace('/auth/signup')}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
}