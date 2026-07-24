import { View } from 'react-native';

import OtpForm from '@/components/auth/OtpForm';
import { styles } from '@/styles/auth/otp.styles';

export default function OtpScreen() {
  return (
    <View style={styles.container}>
      <OtpForm />
    </View>
  );
}