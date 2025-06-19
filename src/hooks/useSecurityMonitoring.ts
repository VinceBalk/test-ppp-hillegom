
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export const useSecurityMonitoring = () => {
  const { logSecurityEvent, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    // Log page access
    logSecurityEvent('page_access', 'navigation', location.pathname);

    // Monitor for suspicious keyboard combinations (reduced logging)
    const handleKeyDown = (event: KeyboardEvent) => {
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

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, logSecurityEvent, location.pathname]);

  return { logSecurityEvent };
};
