import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getProfile } from '@/services/profile/profileService';
import { getSession, removeSession, updateSessionUser } from '@/utils/session';

export type ProfileUser = {
  id?: number;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  role?: string;
  profileImageUrl?: string;
};

export function useProfile() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      setLoading(true);

      const session = await getSession();

      if (!session?.mobile) {
        setUser(null);
        return;
      }

      const latestUser = await getProfile(session.mobile);

      await updateSessionUser(latestUser);
      setUser(latestUser);
    } catch (error) {
      console.log('Load profile error:', error);

      const session = await getSession();
      setUser(session || null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const handleLogout = async () => {
    await removeSession();
    setUser(null);
  };

  return {
    user,
    loading,
    handleLogout,
    reloadProfile: loadUser,
  };
}