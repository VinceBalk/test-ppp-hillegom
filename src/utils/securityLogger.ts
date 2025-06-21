
import { supabase } from '@/integrations/supabase/client';

export const logSecurityEvent = async (
  userId: string | undefined,
  action: string, 
  resourceType?: string, 
  resourceId?: string, 
  details?: any
) => {
  try {
    if (!userId) return;
    
    console.log('Logging security event:', action);
    await supabase.rpc('log_security_event', {
      p_user_id: userId,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: details ? JSON.stringify(details) : null
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

export const logComprehensiveSecurityEvent = async (
  userId: string,
  eventType: 'login_attempt' | 'password_change' | 'role_change' | 'data_access_violation' | 'suspicious_activity' | 'admin_action' | 'system_event',
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any,
  riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
) => {
  try {
    console.log('Logging comprehensive security event:', { eventType, action, riskLevel });
    await supabase.rpc('log_comprehensive_security_event', {
      p_user_id: userId,
      p_event_type: eventType,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: details ? JSON.stringify(details) : null,
      p_risk_level: riskLevel,
      p_ip_address: null,
      p_user_agent: navigator.userAgent.substring(0, 500)
    });
  } catch (error) {
    console.error('Error logging comprehensive security event:', error);
  }
};

export const detectSuspiciousLoginPatterns = async (email: string) => {
  try {
    const { data, error } = await supabase.rpc('detect_suspicious_login_patterns', {
      p_email: email
    });

    if (error) {
      console.error('Error detecting suspicious patterns:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in suspicious pattern detection:', error);
    return null;
  }
};
