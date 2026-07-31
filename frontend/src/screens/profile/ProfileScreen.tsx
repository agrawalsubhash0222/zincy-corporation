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
                <ActivityIndicator size="large" color="#149BD7" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ProfileHeader />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {user ? (
                    <LoggedInView
                        user={user}
                        onLogout={handleLogout}
                    />
                ) : (
                    <GuestView />
                )}
            </ScrollView>
        </View>
    );
}