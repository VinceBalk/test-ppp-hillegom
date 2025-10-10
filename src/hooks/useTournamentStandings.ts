import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlayerStanding {
  player_id: string;
  player_name: string;
  games_won: number;
  games_lost: number;
  specials_count: number;
  position: number;
  trend?: 'up' | 'down' | 'same';
  position_change?: number;
}

interface RoundStats {
  player_id: string;
  round_number: number;
  games_won: number;
  games_lost: number;
  specials_count: number;
}

export const useTournamentStandings = (tournamentId?: string, roundNumber?: number) => {
  return useQuery({
    queryKey: ['tournament-standings', tournamentId, roundNumber],
    queryFn: async () => {
      if (!tournamentId) return [];

      // Fetch ALL stats to calculate trends
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

      // Build stats per round per player
      const playerRoundStats = new Map<string, RoundStats[]>();
      
      allData?.forEach((stat: any) => {
        const playerId = stat.player_id;
        if (!playerRoundStats.has(playerId)) {
          playerRoundStats.set(playerId, []);
        }
        playerRoundStats.get(playerId)!.push({
          player_id: playerId,
          round_number: stat.round_number,
          games_won: stat.games_won || 0,
          games_lost: stat.games_lost || 0,
          specials_count: stat.tiebreaker_specials_count || 0,
        });
      });

      // Calculate standings for current view (specific round or cumulative)
      const playerMap = new Map<string, PlayerStanding>();

      allData?.forEach((stat: any) => {
        const playerId = stat.player_id;
        
        // Filter based on roundNumber if specified
        if (roundNumber && stat.round_number > roundNumber) {
          return;
        }

        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            player_id: playerId,
            player_name: stat.player?.name || 'Onbekend',
            games_won: 0,
            games_lost: 0,
            specials_count: 0,
            position: 0,
          });
        }

        const player = playerMap.get(playerId)!;
        player.games_won += stat.games_won || 0;
        player.games_lost += stat.games_lost || 0;
        player.specials_count += stat.tiebreaker_specials_count || 0;
      });

      // Calculate standings for previous round (for trend)
      let previousStandings: PlayerStanding[] | null = null;
      if (roundNumber && roundNumber > 1) {
        const prevPlayerMap = new Map<string, PlayerStanding>();
        
        allData?.forEach((stat: any) => {
          if (stat.round_number >= roundNumber) return;
          
          const playerId = stat.player_id;
          if (!prevPlayerMap.has(playerId)) {
            prevPlayerMap.set(playerId, {
              player_id: playerId,
              player_name: stat.player?.name || 'Onbekend',
              games_won: 0,
              games_lost: 0,
              specials_count: 0,
              position: 0,
            });
          }

          const player = prevPlayerMap.get(playerId)!;
          player.games_won += stat.games_won || 0;
          player.games_lost += stat.games_lost || 0;
          player.specials_count += stat.tiebreaker_specials_count || 0;
        });

        previousStandings = Array.from(prevPlayerMap.values()).sort((a, b) => {
          if (b.games_won !== a.games_won) return b.games_won - a.games_won;
          return b.specials_count - a.specials_count;
        });

        previousStandings.forEach((standing, index) => {
          standing.position = index + 1;
        });
      }

      // Convert to array and sort
      const standings = Array.from(playerMap.values()).sort((a, b) => {
        if (b.games_won !== a.games_won) {
          return b.games_won - a.games_won;
        }
        return b.specials_count - a.specials_count;
      });

      // Assign positions and calculate trends
      standings.forEach((standing, index) => {
        standing.position = index + 1;

        if (previousStandings) {
          const prevStanding = previousStandings.find(p => p.player_id === standing.player_id);
          if (prevStanding) {
            const positionChange = prevStanding.position - standing.position;
            standing.position_change = positionChange;
            
            if (positionChange > 0) {
              standing.trend = 'up';
            } else if (positionChange < 0) {
              standing.trend = 'down';
            } else {
              standing.trend = 'same';
            }
          }
        }
      });

      return standings;
    },
    enabled: !!tournamentId,
  });
};
