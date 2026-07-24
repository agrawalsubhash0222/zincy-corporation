import { ActivityIndicator, ScrollView, View } from 'react-native';

import GuestView from '@/components/profile/GuestView';
import LoggedInView from '@/components/profile/LoggedInView';
import ProfileHeader from '@/components/profile/ProfileHeader';

import { useProfile } from '@/hooks/profile/useProfile';
import { styles } from '@/styles/profile/profile.styles';

export default function ProfileScreen() {
    const { user, loading, handleLogout } = useProfile();

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0B8F5A" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <ProfileHeader />

            {user ? (
                <LoggedInView
                    user={user}
                    onLogout={handleLogout}
                />
            ) : (
                <GuestView />
            )}
        </ScrollView>
    );
}