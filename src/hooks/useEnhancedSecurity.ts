
import { useAuth } from '@/contexts/AuthContext';
import { logComprehensiveSecurityEvent } from '@/utils/securityLogger';

export const useEnhancedSecurity = () => {
  const { user } = useAuth();

  const logSecurityEventEnhanced = async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: any,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ) => {
    try {
      if (!user) return;
      
      await logComprehensiveSecurityEvent(
        user.id,
        'system_event',
        action,
        resourceType,
        resourceId,
        details,
        riskLevel
      );
    } catch (error) {
      console.error('Error logging enhanced security event:', error);
    }
  };

  const logHighRiskActivity = (activity: string, details?: any) => {
    if (!user) return;
    
    logComprehensiveSecurityEvent(
      user.id,
      'suspicious_activity',
      'high_risk_activity_detected',
      'security',
      null,
      { activity, ...details },
      'high'
    );
  };

  const logCriticalSecurityEvent = (event: string, details?: any) => {
    if (!user) return;
    
    logComprehensiveSecurityEvent(
      user.id,
      'suspicious_activity',
      'critical_security_event',
      'security',
      null,
      { event, ...details },
      'critical'
    );
  };

  const logDataAccessViolation = (violation: string, details?: any) => {
    if (!user) return;
    
    logComprehensiveSecurityEvent(
      user.id,
      'data_access_violation',
      violation,
      'data_access',
      null,
      details,
      'high'
    );
  };

  const logAdminAction = (action: string, details?: any) => {
    if (!user) return;
    
    logComprehensiveSecurityEvent(
      user.id,
      'admin_action',
      action,
      'admin',
      null,
      details,
      'medium'
    );
  };

  return {
    logSecurityEventEnhanced,
    logHighRiskActivity,
    logCriticalSecurityEvent,
    logDataAccessViolation,
    logAdminAction
  };
};
