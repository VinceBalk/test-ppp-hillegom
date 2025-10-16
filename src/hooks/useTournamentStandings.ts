import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlayerStanding {
  player_id: string;
  player_name: string;
  round1_games_won: number;
  round1_specials: number;
  round2_games_won: number;
  round2_specials: number;
  round3_games_won: number;
  round3_specials: number;
  position: number;
  trend?: 'up' | 'down' | 'same';
  position_change?: number;
  tie_breaker_used?: 'r3_specials' | 'r2_games' | 'r1_games' | null;
}

interface RoundStats {
  player_id: string;
  round_number: number;
  games_won: number;
  games_lost: number;
  specials_count: number;
}

export const useTournamentStandings = (
  tournamentId?: string
) => {
  return useQuery({
    queryKey: ['tournament-standings', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];

      // Fetch ALL stats for all rounds
      const { data: allData, error: allError } = await supabase
        .from('player_tournament_stats')
        .select(`
          player_id,
          games_won,
          games_lost,
          tiebreaker_specials_count,
          round_number,
          player:players(name)
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true });

      if (allError) {
        console.error('Error fetching tournament standings:', allError);
        throw allError;
      }

      // Calculate standings with per-round data
      const playerMap = new Map<string, PlayerStanding>();

      allData?.forEach((stat: any) => {
        const playerId = stat.player_id;

        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            player_id: playerId,
            player_name: stat.player?.name || 'Onbekend',
            round1_games_won: 0,
            round1_specials: 0,
            round2_games_won: 0,
            round2_specials: 0,
            round3_games_won: 0,
            round3_specials: 0,
            position: 0,
            tie_breaker_used: null,
          });
        }

        const player = playerMap.get(playerId)!;
        
        // Store stats per round
        if (stat.round_number === 1) {
          player.round1_games_won = stat.games_won || 0;
          player.round1_specials = stat.tiebreaker_specials_count || 0;
        } else if (stat.round_number === 2) {
          player.round2_games_won = stat.games_won || 0;
          player.round2_specials = stat.tiebreaker_specials_count || 0;
        } else if (stat.round_number === 3) {
          player.round3_games_won = stat.games_won || 0;
          player.round3_specials = stat.tiebreaker_specials_count || 0;
        }
      });

      // Convert to array and sort with R3-primary logic
      const standings = Array.from(playerMap.values()).sort((a, b) => {
        // 1. Primary: Ronde 3 games won
        if (b.round3_games_won !== a.round3_games_won) {
          return b.round3_games_won - a.round3_games_won;
        }
        
        // 2. Tie-breaker 1: Ronde 3 specials
        if (b.round3_specials !== a.round3_specials) {
          return b.round3_specials - a.round3_specials;
        }
        
        // 3. Tie-breaker 2: Ronde 2 games won
        if (b.round2_games_won !== a.round2_games_won) {
          return b.round2_games_won - a.round2_games_won;
        }
        
        // 4. Tie-breaker 3: Ronde 1 games won
        return b.round1_games_won - a.round1_games_won;
      });

      // Assign positions and detect which tie-breaker was used
      standings.forEach((standing, index) => {
        standing.position = index + 1;
        
        // Determine tie-breaker used by comparing with next player
        if (index < standings.length - 1) {
          const next = standings[index + 1];
          if (standing.round3_games_won === next.round3_games_won) {
            if (standing.round3_specials !== next.round3_specials) {
              standing.tie_breaker_used = 'r3_specials';
            } else if (standing.round2_games_won !== next.round2_games_won) {
              standing.tie_breaker_used = 'r2_games';
            } else if (standing.round1_games_won !== next.round1_games_won) {
              standing.tie_breaker_used = 'r1_games';
            }
          }
        }
      });

      return standings;
    },
    enabled: !!tournamentId,
  });
};
