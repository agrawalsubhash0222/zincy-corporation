import { View } from 'react-native';

import SignupForm from '@/components/auth/SignupForm';
import { styles } from '@/styles/auth/signup.styles';

export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <SignupForm />
    </View>
  );
}