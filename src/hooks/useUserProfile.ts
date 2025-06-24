
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
      
      // First get the user's email from their profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      if (profileError || !profileData) {
        console.log('No profile found or error:', profileError);
        setAdminUser(null);
        return null;
      }

      // Then check if they exist in admin_users table
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, user_id, email, is_super_admin, created_at')
        .eq('email', profileData.email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching admin user:', error);
        setAdminUser(null);
        return null;
      }

      console.log('Admin user check result:', data);
      
      // If admin record exists, update it with the current user_id
      if (data && data.user_id !== userId) {
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({ user_id: userId })
          .eq('id', data.id);
        
        if (updateError) {
          console.error('Error updating admin user_id:', updateError);
        } else {
          data.user_id = userId;
        }
      }
      
      setAdminUser(data as AdminUser | null);
      return data;
    } catch (error) {
      console.error('Exception fetching admin user:', error);
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
