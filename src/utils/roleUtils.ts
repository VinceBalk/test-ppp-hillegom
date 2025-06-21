
import { UserProfile, AdminUser } from '@/types/auth';

export const hasRole = (profile: UserProfile | null, role: string): boolean => {
  if (!profile) {
    console.log('No profile available for role check');
    return false;
  }
  const roleHierarchy = { speler: 1, organisator: 2, beheerder: 3 };
  const userLevel = roleHierarchy[profile.role] || 0;
  const requiredLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0;
  const hasAccess = userLevel >= requiredLevel;
  console.log(`Role check: user=${profile.role} (${userLevel}), required=${role} (${requiredLevel}), access=${hasAccess}`);
  return hasAccess;
};

export const isSuperAdmin = (adminUser: AdminUser | null): boolean => {
  const isSuper = adminUser?.is_super_admin === true;
  console.log('Super admin check:', isSuper);
  return isSuper;
};
