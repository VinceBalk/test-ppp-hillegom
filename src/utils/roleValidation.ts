
// Centralized role validation utilities
export const VALID_ROLES = ['speler', 'organisator', 'beheerder'] as const;
export type ValidRole = typeof VALID_ROLES[number];

export const isValidRole = (role: string): role is ValidRole => {
  return VALID_ROLES.includes(role as ValidRole);
};

export const validateRoleTransition = (currentRole: ValidRole, newRole: ValidRole, isSuperAdmin: boolean): boolean => {
  // Super admins can perform any role transition
  if (isSuperAdmin) return true;
  
  // Regular admins (beheerder) can manage organisator and speler roles
  if (currentRole === 'beheerder') {
    return newRole === 'organisator' || newRole === 'speler';
  }
  
  // Lower roles cannot change roles
  return false;
};
