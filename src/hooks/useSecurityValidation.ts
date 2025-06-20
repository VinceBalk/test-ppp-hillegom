
import { useAuth } from '../contexts/AuthContext';
import { validateRoleTransition, isValidRole, ValidRole } from '../utils/roleValidation';

export const useSecurityValidation = () => {
  const { profile, isSuperAdmin, logSecurityEvent } = useAuth();

  const validateRoleChange = (targetUserId: string, currentRole: string, newRole: string): boolean => {
    if (!isValidRole(currentRole) || !isValidRole(newRole)) {
      logSecurityEvent('invalid_role_validation_attempt', 'security', null, {
        target_user_id: targetUserId,
        attempted_current_role: currentRole,
        attempted_new_role: newRole
      });
      return false;
    }

    const isValid = validateRoleTransition(
      profile?.role as ValidRole || 'speler',
      newRole as ValidRole,
      isSuperAdmin()
    );

    if (!isValid) {
      logSecurityEvent('unauthorized_role_change_attempt', 'security', targetUserId, {
        current_user_role: profile?.role,
        attempted_role_change: `${currentRole} -> ${newRole}`,
        is_super_admin: isSuperAdmin()
      });
    }

    return isValid;
  };

  const logSuspiciousActivity = (activity: string, details?: any) => {
    logSecurityEvent('suspicious_activity_detected', 'security', null, {
      activity,
      user_role: profile?.role,
      ...details
    });
  };

  return {
    validateRoleChange,
    logSuspiciousActivity
  };
};
