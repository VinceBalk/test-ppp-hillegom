
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useSecurityMonitoring = () => {
  const { logSecurityEvent, user } = useAuth();

  useEffect(() => {
    // Only set up monitoring if user is authenticated
    if (!user) return;

    // Monitor for suspicious navigation patterns
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logSecurityEvent('page_focus_gained');
      } else if (document.visibilityState === 'hidden') {
        logSecurityEvent('page_focus_lost');
      }
    };

    // Monitor for potential security-related browser events
    const handleBeforeUnload = () => {
      logSecurityEvent('session_ended_unexpectedly');
    };

    // Monitor for suspicious keyboard combinations
    const handleKeyDown = (event: KeyboardEvent) => {
      // Log potential security-related key combinations
      if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        logSecurityEvent('dev_tools_access_attempt');
      }
      if (event.key === 'F12') {
        logSecurityEvent('dev_tools_access_attempt');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);

    // Log initial page access
    logSecurityEvent('page_access', 'page', window.location.pathname);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, logSecurityEvent]);

  return { logSecurityEvent };
};
