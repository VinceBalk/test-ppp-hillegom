
-- Fix all function search path security warnings by setting immutable search paths

-- 1. Fix calculate_player_tournament_ranking
CREATE OR REPLACE FUNCTION public.calculate_player_tournament_ranking(p_tournament_id uuid, p_player_id uuid)
RETURNS TABLE(total_games_won integer, total_tiebreaker_specials integer, ranking_position integer)
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  WITH player_totals AS (
    SELECT 
      player_id,
      SUM(games_won) as total_games,
      SUM(tiebreaker_specials_count) as total_specials
    FROM public.player_tournament_stats 
    WHERE tournament_id = p_tournament_id
    GROUP BY player_id
  ),
  ranked_players AS (
    SELECT 
      player_id,
      total_games,
      total_specials,
      ROW_NUMBER() OVER (ORDER BY total_games DESC, total_specials DESC) as rank
    FROM player_totals
  )
  SELECT 
    COALESCE(rp.total_games, 0)::INTEGER,
    COALESCE(rp.total_specials, 0)::INTEGER,
    COALESCE(rp.rank, 999)::INTEGER
  FROM ranked_players rp
  WHERE rp.player_id = p_player_id;
$function$;

-- 2. Fix log_security_event_enhanced
CREATE OR REPLACE FUNCTION public.log_security_event_enhanced(
  p_user_id uuid, 
  p_action text, 
  p_resource_type text DEFAULT NULL, 
  p_resource_id text DEFAULT NULL, 
  p_details jsonb DEFAULT NULL, 
  p_risk_level text DEFAULT 'low'
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, details, risk_level
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id, p_details, p_risk_level
  );
$function$;

-- 3. Fix check_login_rate_limit
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_email text, 
  p_ip_address inet DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  recent_failures integer;
BEGIN
  -- Check failed attempts in last 15 minutes
  SELECT COUNT(*)
  INTO recent_failures
  FROM public.login_attempts
  WHERE email = p_email
    AND attempt_time > NOW() - INTERVAL '15 minutes'
    AND success = FALSE;

  -- Allow if fewer than 5 failed attempts
  RETURN recent_failures < 5;
END;
$function$;

-- 4. Fix log_login_attempt
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email text, 
  p_success boolean, 
  p_ip_address inet DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  INSERT INTO public.login_attempts (email, success, ip_address)
  VALUES (p_email, p_success, p_ip_address);
$function$;

-- 5. Fix save_individual_match
CREATE OR REPLACE FUNCTION public.save_individual_match(
  p_match_id uuid,
  p_team1_player1_id uuid,
  p_team1_player2_id uuid,
  p_team2_player1_id uuid,
  p_team2_player2_id uuid,
  p_court_id uuid DEFAULT NULL,
  p_court_number text DEFAULT NULL,
  p_round_within_group integer DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result_match json;
BEGIN
  -- Update de wedstrijd met nieuwe gegevens
  UPDATE public.matches
  SET 
    team1_player1_id = p_team1_player1_id,
    team1_player2_id = p_team1_player2_id,
    team2_player1_id = p_team2_player1_id,
    team2_player2_id = p_team2_player2_id,
    court_id = p_court_id,
    court_number = p_court_number,
    updated_at = NOW()
  WHERE id = p_match_id;

  -- Haal de bijgewerkte wedstrijd op met alle gerelateerde data
  SELECT row_to_json(match_data) INTO result_match
  FROM (
    SELECT 
      m.*,
      t.name as tournament_name,
      tp1.name as team1_player1_name,
      tp2.name as team1_player2_name,
      tp3.name as team2_player1_name,
      tp4.name as team2_player2_name,
      c.name as court_name
    FROM public.matches m
    LEFT JOIN public.tournaments t ON m.tournament_id = t.id
    LEFT JOIN public.players tp1 ON m.team1_player1_id = tp1.id
    LEFT JOIN public.players tp2 ON m.team1_player2_id = tp2.id
    LEFT JOIN public.players tp3 ON m.team2_player1_id = tp3.id
    LEFT JOIN public.players tp4 ON m.team2_player2_id = tp4.id
    LEFT JOIN public.courts c ON m.court_id = c.id
    WHERE m.id = p_match_id
  ) match_data;

  RETURN result_match;
END;
$function$;

-- 6. Fix log_comprehensive_security_event
CREATE OR REPLACE FUNCTION public.log_comprehensive_security_event(
  p_user_id uuid,
  p_event_type security_event_type,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_risk_level text DEFAULT 'low',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  INSERT INTO public.security_audit_log (
    user_id, event_type, action, resource_type, resource_id, 
    details, risk_level, ip_address, user_agent
  ) VALUES (
    p_user_id, p_event_type, p_action, p_resource_type, p_resource_id, 
    p_details, p_risk_level, p_ip_address, p_user_agent
  );
$function$;

-- 7. Fix detect_suspicious_login_patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_login_patterns(
  p_email text,
  p_ip_address inet DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  recent_failures integer;
  different_ips integer;
  rapid_attempts integer;
  result jsonb;
BEGIN
  -- Check failed attempts in last hour
  SELECT COUNT(*)
  INTO recent_failures
  FROM public.login_attempts
  WHERE email = p_email
    AND attempt_time > NOW() - INTERVAL '1 hour'
    AND success = FALSE;

  -- Check attempts from different IPs in last 24 hours
  SELECT COUNT(DISTINCT ip_address)
  INTO different_ips
  FROM public.login_attempts
  WHERE email = p_email
    AND attempt_time > NOW() - INTERVAL '24 hours'
    AND ip_address IS NOT NULL;

  -- Check rapid attempts in last 5 minutes
  SELECT COUNT(*)
  INTO rapid_attempts
  FROM public.login_attempts
  WHERE email = p_email
    AND attempt_time > NOW() - INTERVAL '5 minutes';

  result := jsonb_build_object(
    'recent_failures', recent_failures,
    'different_ips', different_ips,
    'rapid_attempts', rapid_attempts,
    'is_suspicious', (recent_failures > 5 OR different_ips > 3 OR rapid_attempts > 10)
  );

  RETURN result;
END;
$function$;

-- 8. Fix cleanup_old_audit_logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(
  p_days_to_keep integer DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.security_audit_log
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::interval
    AND risk_level IN ('low', 'medium'); -- Keep high and critical logs longer

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- 9. Fix get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$;

-- 10. Fix has_role_or_higher
CREATE OR REPLACE FUNCTION public.has_role_or_higher(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $function$
  SELECT CASE 
    WHEN required_role = 'speler' THEN 
      public.get_user_role(user_id) IN ('speler', 'organisator', 'beheerder')
    WHEN required_role = 'organisator' THEN 
      public.get_user_role(user_id) IN ('organisator', 'beheerder')
    WHEN required_role = 'beheerder' THEN 
      public.get_user_role(user_id) = 'beheerder'
    ELSE FALSE
  END;
$function$;

-- 11. Fix is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = $1 AND is_super_admin = TRUE
  );
$function$;

-- 12. Fix log_security_event
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id, p_details
  );
$function$;

-- 13. Fix validate_email_format
CREATE OR REPLACE FUNCTION public.validate_email_format(email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
    AND length(email) <= 254 
    AND length(email) >= 5;
END;
$function$;

-- 14. Fix sanitize_user_input
CREATE OR REPLACE FUNCTION public.sanitize_user_input(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove potentially dangerous characters
  RETURN regexp_replace(
    regexp_replace(input, '[<>"\''&]', '', 'g'),
    '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g'
  );
END;
$function$;
