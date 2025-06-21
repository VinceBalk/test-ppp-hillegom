
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useEnhancedSecurity } from './useEnhancedSecurity';
import { useAuth } from '../contexts/AuthContext';

export const useSecurityMonitoring = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { logSecurityEventEnhanced, logHighRiskActivity } = useEnhancedSecurity();

  useEffect(() => {
    if (!user) return;

    // Log page access with enhanced details
    logSecurityEventEnhanced('page_access', 'navigation', location.pathname, {
      path: location.pathname,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent.substring(0, 200) // Limit length
    });

    // Enhanced keyboard monitoring
    const handleKeyDown = (event: KeyboardEvent) => {
      // Developer tools access attempts
      if (event.key === 'F12' || 
          (event.ctrlKey && event.shiftKey && event.key === 'I') ||
          (event.ctrlKey && event.shiftKey && event.key === 'C') ||
          (event.ctrlKey && event.key === 'U')) {
        
        logHighRiskActivity('dev_tools_access_attempt', {
          path: location.pathname,
          key_combination: event.ctrlKey ? `Ctrl+${event.shiftKey ? 'Shift+' : ''}${event.key}` : event.key,
          timestamp: new Date().toISOString()
        });
      }

      // Console access attempts
      if (event.ctrlKey && event.shiftKey && (event.key === 'K' || event.key === 'J')) {
        logHighRiskActivity('console_access_attempt', {
          path: location.pathname,
          key_combination: `Ctrl+Shift+${event.key}`,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Context menu monitoring (right-click)
    const handleContextMenu = (event: MouseEvent) => {
      logSecurityEventEnhanced('context_menu_access', 'user_interaction', location.pathname, {
        path: location.pathname,
        timestamp: new Date().toISOString()
      }, 'low');
    };

    // Focus/blur monitoring for tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSecurityEventEnhanced('tab_hidden', 'user_behavior', location.pathname, {
          path: location.pathname,
          timestamp: new Date().toISOString()
        }, 'low');
      } else {
        logSecurityEventEnhanced('tab_visible', 'user_behavior', location.pathname, {
          path: location.pathname,
          timestamp: new Date().toISOString()
        }, 'low');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, location.pathname, logSecurityEventEnhanced, logHighRiskActivity]);

  return { 
    logSecurityEventEnhanced,
    logHighRiskActivity
  };
};
