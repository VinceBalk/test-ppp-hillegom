import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Round3ReadinessCheck {
  isReady: boolean;
  r1Complete: boolean;
  r2Complete: boolean;
  r3AlreadyGenerated: boolean;
  hasPermission: boolean;
  r1MatchesCount: number;
  r2MatchesCount: number;
  r3MatchesCount: number;
  r1CompletedWithScores: number;
  r2CompletedWithScores: number;
  message: string;
}

/**
 * R3 CAN be generated when:
 * - Tournament status = "in_progress"
 * - ALL R1 matches are completed AND have valid scores (team1_score + team2_score = 8)
 * - ALL R2 matches are completed AND have valid scores (team1_score + team2_score = 8)
 * - R3 has NOT been generated yet (no matches with round_number=3 OR tournament.round_3_schedule_generated)
 * - User has role "organisator" or "beheerder"
 */
export const useRound3Readiness = (tournamentId?: string) => {
  const { hasRole } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['round3-readiness', tournamentId],
    queryFn: async (): Promise<Round3ReadinessCheck> => {
      if (!tournamentId) {
        return {
          isReady: false,
          r1Complete: false,
          r2Complete: false,
          r3AlreadyGenerated: false,
          hasPermission: false,
          r1MatchesCount: 0,
          r2MatchesCount: 0,
          r3MatchesCount: 0,
          r1CompletedWithScores: 0,
          r2CompletedWithScores: 0,
          message: 'Geen toernooi geselecteerd',
        };
      }

      // Check user permissions
      const hasPermission = hasRole('organisator') || hasRole('beheerder');

      // Fetch tournament status
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('status, round_3_schedule_generated')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournament) {
        return {
          isReady: false,
          r1Complete: false,
          r2Complete: false,
          r3AlreadyGenerated: false,
          hasPermission,
          r1MatchesCount: 0,
          r2MatchesCount: 0,
          r3MatchesCount: 0,
          r1CompletedWithScores: 0,
          r2CompletedWithScores: 0,
          message: 'Fout bij ophalen toernooi',
        };
      }

      // Fetch all matches for this tournament
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, round_number, status, team1_score, team2_score')
        .eq('tournament_id', tournamentId);

      if (matchesError || !matches) {
        return {
          isReady: false,
          r1Complete: false,
          r2Complete: false,
          r3AlreadyGenerated: false,
          hasPermission,
          r1MatchesCount: 0,
          r2MatchesCount: 0,
          r3MatchesCount: 0,
          r1CompletedWithScores: 0,
          r2CompletedWithScores: 0,
          message: 'Fout bij ophalen wedstrijden',
        };
      }

      // Separate matches by round
      const r1Matches = matches.filter((m) => m.round_number === 1);
      const r2Matches = matches.filter((m) => m.round_number === 2);
      const r3Matches = matches.filter((m) => m.round_number === 3);

      // Your definition of "complete":
      // status === 'completed' AND team1_score + team2_score === 8
      const isComplete = (m: any) => {
        const s1 = Number(m.team1_score ?? 0);
        const s2 = Number(m.team2_score ?? 0);
        return m.status === 'completed' && (s1 + s2) === 8;
      };

      const r1CompletedWithScores = r1Matches.filter(isComplete).length;
      const r1Complete = r1Matches.length > 0 && r1CompletedWithScores === r1Matches.length;

      const r2CompletedWithScores = r2Matches.filter(isComplete).length;
      const r2Complete = r2Matches.length > 0 && r2CompletedWithScores === r2Matches.length;

      // Check if R3 already generated
      const r3AlreadyGenerated = r3Matches.length > 0 || !!tournament.round_3_schedule_generated;

      // Determine if R3 is ready to be generated
      const isReady =
        tournament.status === 'in_progress' &&
        r1Complete &&
        r2Complete &&
        !r3AlreadyGenerated &&
        hasPermission;

      // Build status message
      let message = '';
      if (r3AlreadyGenerated) {
        message = 'Ronde 3 is al gegenereerd';
      } else if (!hasPermission) {
        message = 'Je hebt geen toestemming om Ronde 3 te genereren';
      } else if (tournament.status !== 'in_progress') {
        message = `Toernooi status is "${tournament.status}", moet "in_progress" zijn`;
      } else if (!r1Complete) {
        message = `Ronde 1 is nog niet compleet (${r1CompletedWithScores}/${r1Matches.length} met totaal=8)`;
      } else if (!r2Complete) {
        message = `Ronde 2 is nog niet compleet (${r2CompletedWithScores}/${r2Matches.length} met totaal=8)`;
      } else {
        message = 'Ronde 3 kan nu gegenereerd worden!';
      }

      return {
        isReady,
        r1Complete,
        r2Complete,
        r3AlreadyGenerated,
        hasPermission,
        r1MatchesCount: r1Matches.length,
        r2MatchesCount: r2Matches.length,
        r3MatchesCount: r3Matches.length,
        r1CompletedWithScores,
        r2CompletedWithScores,
        message,
      };
    },
    enabled: !!tournamentId,
    refetchInterval: 10000,
  });

  return {
    readiness: data,
    isLoading,
    error,
  };
};
