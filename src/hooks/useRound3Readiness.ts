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
 * Custom hook to check if Round 3 is ready to be generated
 * 
 * R3 CAN be generated when:
 * - Tournament status = "in_progress"
 * - All 12 R1 matches are completed AND have scores
 * - All 12 R2 matches are completed AND have scores  
 * - R3 has NOT been generated yet (no matches with round_number=3)
 * - User has role "organisator" or "beheerder"
 */
export const useRound3Readiness = (tournamentId?: string) => {
  const { user, hasRole } = useAuth();
  
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
          message: 'Geen toernooi geselecteerd'
        };
      }

      console.log('=== CHECKING R3 READINESS ===');
      console.log('Tournament ID:', tournamentId);

      // Check user permissions
      const hasPermission = hasRole('organisator') || hasRole('beheerder');
      console.log('User has permission:', hasPermission);

      // Fetch tournament status
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('status, round_3_schedule_generated')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournament) {
        console.error('Tournament fetch error:', tournamentError);
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
          message: 'Fout bij ophalen toernooi'
        };
      }

      console.log('Tournament status:', tournament.status);
      console.log('R3 already generated:', tournament.round_3_schedule_generated);

      // Fetch all matches for this tournament
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, round_number, status, score_team1, score_team2')
        .eq('tournament_id', tournamentId);

      if (matchesError || !matches) {
        console.error('Matches fetch error:', matchesError);
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
          message: 'Fout bij ophalen wedstrijden'
        };
      }

      // Separate matches by round
      const r1Matches = matches.filter(m => m.round_number === 1);
      const r2Matches = matches.filter(m => m.round_number === 2);
      const r3Matches = matches.filter(m => m.round_number === 3);

      console.log(`R1 matches: ${r1Matches.length}, R2 matches: ${r2Matches.length}, R3 matches: ${r3Matches.length}`);

      // Check if R1 is complete (all 12 matches completed with scores)
      const r1CompletedWithScores = r1Matches.filter(m => 
        m.status === 'completed' && 
        m.score_team1 !== null && 
        m.score_team2 !== null
      ).length;
      const r1Complete = r1Matches.length === 12 && r1CompletedWithScores === 12;

      console.log(`R1 completed with scores: ${r1CompletedWithScores}/12`);

      // Check if R2 is complete (all 12 matches completed with scores)
      const r2CompletedWithScores = r2Matches.filter(m => 
        m.status === 'completed' && 
        m.score_team1 !== null && 
        m.score_team2 !== null
      ).length;
      const r2Complete = r2Matches.length === 12 && r2CompletedWithScores === 12;

      console.log(`R2 completed with scores: ${r2CompletedWithScores}/12`);

      // Check if R3 already generated
      const r3AlreadyGenerated = r3Matches.length > 0 || tournament.round_3_schedule_generated;

      // Determine if R3 is ready to be generated
      const isReady = 
        tournament.status === 'in_progress' &&
        r1Complete &&
        r2Complete &&
        !r3AlreadyGenerated &&
        hasPermission;

      console.log('R3 ready status:', isReady);

      // Build status message
      let message = '';
      if (r3AlreadyGenerated) {
        message = 'Ronde 3 is al gegenereerd';
      } else if (!hasPermission) {
        message = 'Je hebt geen toestemming om Ronde 3 te genereren';
      } else if (tournament.status !== 'in_progress') {
        message = `Toernooi status is "${tournament.status}", moet "in_progress" zijn`;
      } else if (!r1Complete) {
        message = `Ronde 1 is nog niet compleet (${r1CompletedWithScores}/12 met scores)`;
      } else if (!r2Complete) {
        message = `Ronde 2 is nog niet compleet (${r2CompletedWithScores}/12 met scores)`;
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
        message
      };
    },
    enabled: !!tournamentId,
    refetchInterval: 10000, // Refetch every 10 seconds to stay up to date
  });

  return {
    readiness: data,
    isLoading,
    error
  };
};
