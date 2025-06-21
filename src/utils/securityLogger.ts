
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
