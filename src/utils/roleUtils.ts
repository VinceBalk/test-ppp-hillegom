
import { UserProfile, AdminUser } from '@/types/auth';

export const hasRole = (profile: UserProfile | null, role: string): boolean => {
  if (!profile) {
    return false;
  }
  const roleHierarchy = { speler: 1, organisator: 2, beheerder: 3 };
  const userLevel = roleHierarchy[profile.role] || 0;
  const requiredLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0;
  return userLevel >= requiredLevel;
};

export const isSuperAdmin = (adminUser: AdminUser | null): boolean => {
  return adminUser?.is_super_admin === true;
};
