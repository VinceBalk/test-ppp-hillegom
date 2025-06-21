
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, AdminUser } from '@/types/auth';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      console.log('User profile fetched:', data);
      setProfile(data as UserProfile);
      return data;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  };

  const fetchAdminUser = async (userId: string) => {
    try {
      console.log('Checking admin status for user:', userId);
      // Use a simple query to avoid RLS recursion issues
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, user_id, email, is_super_admin, created_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching admin user:', error);
        // Don't set adminUser on error, just return null
        return null;
      }

      console.log('Admin user check result:', data);
      setAdminUser(data as AdminUser | null);
      return data;
    } catch (error) {
      console.error('Exception fetching admin user:', error);
      // Set adminUser to null on exception to prevent issues
      setAdminUser(null);
      return null;
    }
  };

  const clearProfile = () => {
    setProfile(null);
    setAdminUser(null);
  };

  return {
    profile,
    adminUser,
    fetchUserProfile,
    fetchAdminUser,
    clearProfile,
    setProfile,
    setAdminUser
  };
}
