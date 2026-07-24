import { ClientSetupProvider } from '@/context/ClientSetupContext';
import { Stack } from 'expo-router';

export default function ClientSetupLayout() {
    return (
        <ClientSetupProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </ClientSetupProvider>
    );
}