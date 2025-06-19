
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export const useSecurityMonitoring = () => {
  const { logSecurityEvent, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Only set up monitoring if user is authenticated
    if (!user) return;

    // Monitor for suspicious navigation patterns
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logSecurityEvent('page_focus_gained', 'navigation', location.pathname);
      } else if (document.visibilityState === 'hidden') {
        logSecurityEvent('page_focus_lost', 'navigation', location.pathname);
      }
    };

    // Monitor for potential security-related browser events
    const handleBeforeUnload = () => {
      logSecurityEvent('session_ended_unexpectedly', 'session', null, {
        path: location.pathname,
        timestamp: new Date().toISOString()
      });
    };

    // Monitor for suspicious keyboard combinations
    const handleKeyDown = (event: KeyboardEvent) => {
      // Log potential security-related key combinations
      if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        logSecurityEvent('dev_tools_access_attempt', 'security', null, {
          path: location.pathname,
          combination: 'Ctrl+Shift+I'
        });
      }
      if (event.key === 'F12') {
        logSecurityEvent('dev_tools_access_attempt', 'security', null, {
          path: location.pathname,
          key: 'F12'
        });
      }
    };

    // Monitor for right-click context menu
    const handleContextMenu = (event: MouseEvent) => {
      logSecurityEvent('context_menu_access', 'security', null, {
        path: location.pathname,
        element: (event.target as Element)?.tagName
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    // Log initial page access
    logSecurityEvent('page_access', 'navigation', location.pathname);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [user, logSecurityEvent, location.pathname]);

  return { logSecurityEvent };
};
