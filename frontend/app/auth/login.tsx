import { View } from 'react-native';

import LoginFooter from '@/components/auth/LoginFooter';
import LoginForm from '@/components/auth/LoginForm';
import { styles } from '@/styles/auth/login.styles';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <LoginForm />
      <LoginFooter />
    </View>
  );
}