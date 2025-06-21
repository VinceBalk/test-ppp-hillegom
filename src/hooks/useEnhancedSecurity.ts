
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
      
      await supabase.rpc('log_security_event_enhanced', {
        p_user_id: user.id,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details ? JSON.stringify(details) : null,
        p_risk_level: riskLevel
      });
    } catch (error) {
      console.error('Error logging enhanced security event:', error);
    }
  };

  const logHighRiskActivity = (activity: string, details?: any) => {
    logSecurityEventEnhanced(
      'high_risk_activity_detected',
      'security',
      null,
      { activity, ...details },
      'high'
    );
  };

  const logCriticalSecurityEvent = (event: string, details?: any) => {
    logSecurityEventEnhanced(
      'critical_security_event',
      'security',
      null,
      { event, ...details },
      'critical'
    );
  };

  return {
    logSecurityEventEnhanced,
    logHighRiskActivity,
    logCriticalSecurityEvent
  };
};
