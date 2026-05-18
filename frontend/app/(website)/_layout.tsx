import { Stack } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function WebsiteLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      <View
        style={{
          backgroundColor: '#0e010131',
          paddingVertical: 5,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#9ca3af',
            fontSize: 15,
            textAlign: 'center',
          }}
        >
          © 2026 Zincy Corporation Pvt. Ltd. All Rights Reserved.
        </Text>
      </View>
    </View>
  );
}