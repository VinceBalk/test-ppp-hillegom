
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useComprehensiveSecurityMonitoring = () => {
  const { user } = useAuth();
  const location = useLocation();

  const logSecurityEvent = async (
    eventType: 'login_attempt' | 'password_change' | 'role_change' | 'data_access_violation' | 'suspicious_activity' | 'admin_action' | 'system_event',
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: any,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ) => {
    try {
      if (!user) return;
      
      await supabase.rpc('log_comprehensive_security_event', {
        p_user_id: user.id,
        p_event_type: eventType,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details ? JSON.stringify(details) : null,
        p_risk_level: riskLevel,
        p_ip_address: null, // Will be handled by RLS/triggers if needed
        p_user_agent: navigator.userAgent.substring(0, 500) // Limit length
      });
    } catch (error) {
      console.error('Error logging comprehensive security event:', error);
    }
  };

  const detectSuspiciousPatterns = async (email: string) => {
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

  const trackSessionActivity = async (action: 'session_start' | 'session_end' | 'page_access') => {
    if (!user) return;

    await logSecurityEvent('system_event', action, 'session', user.id, {
      path: location.pathname,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent.substring(0, 200)
    });
  };

  useEffect(() => {
    if (!user) return;

    // Track page access
    trackSessionActivity('page_access');

    // Enhanced keyboard monitoring for security threats
    const handleKeyDown = (event: KeyboardEvent) => {
      // Developer tools access attempts
      if (event.key === 'F12' || 
          (event.ctrlKey && event.shiftKey && event.key === 'I') ||
          (event.ctrlKey && event.shiftKey && event.key === 'C') ||
          (event.ctrlKey && event.key === 'U')) {
        
        logSecurityEvent('suspicious_activity', 'dev_tools_access_attempt', 'security', null, {
          path: location.pathname,
          key_combination: event.ctrlKey ? `Ctrl+${event.shiftKey ? 'Shift+' : ''}${event.key}` : event.key,
          timestamp: new Date().toISOString()
        }, 'medium');
      }

      // Console access attempts
      if (event.ctrlKey && event.shiftKey && (event.key === 'K' || event.key === 'J')) {
        logSecurityEvent('suspicious_activity', 'console_access_attempt', 'security', null, {
          path: location.pathname,
          key_combination: `Ctrl+Shift+${event.key}`,
          timestamp: new Date().toISOString()
        }, 'medium');
      }
    };

    // Context menu monitoring (right-click)
    const handleContextMenu = (event: MouseEvent) => {
      logSecurityEvent('system_event', 'context_menu_access', 'user_interaction', location.pathname, {
        path: location.pathname,
        timestamp: new Date().toISOString()
      }, 'low');
    };

    // Focus/blur monitoring for tab switching
    const handleVisibilityChange = () => {
      const action = document.hidden ? 'tab_hidden' : 'tab_visible';
      logSecurityEvent('system_event', action, 'user_behavior', location.pathname, {
        path: location.pathname,
        timestamp: new Date().toISOString()
      }, 'low');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, location.pathname]);

  return { 
    logSecurityEvent,
    detectSuspiciousPatterns,
    trackSessionActivity
  };
};
