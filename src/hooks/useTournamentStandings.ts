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
  court_name?: string;
  court_position_range?: string;
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

      // Fetch R3 matches with court info
      const { data: r3Matches, error: r3Error } = await supabase
        .from('matches')
        .select(`
          team1_player1_id,
          team1_player2_id,
          team2_player1_id,
          team2_player2_id,
          court:courts(name, menu_order, row_side)
        `)
        .eq('tournament_id', tournamentId)
        .eq('round_number', 3);

      if (r3Error) {
        console.error('Error fetching R3 matches:', r3Error);
        throw r3Error;
      }

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

      // Build player stats map
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

      // Map players to their R3 courts
      const courtPlayerMap = new Map<string, Set<string>>();

      r3Matches?.forEach((match: any) => {
        const courtName = match.court?.name || 'Onbekend';
        if (!courtPlayerMap.has(courtName)) {
          courtPlayerMap.set(courtName, new Set());
        }
        const playerSet = courtPlayerMap.get(courtName)!;
        [match.team1_player1_id, match.team1_player2_id, match.team2_player1_id, match.team2_player2_id]
          .filter(Boolean)
          .forEach(pid => playerSet.add(pid));
      });

      // Extract unique courts from R3 matches with row_side info
      const courtsFromMatches = r3Matches
        ?.map((m: any) => m.court)
        .filter((court: any, index: number, self: any[]) => 
          court && self.findIndex((c: any) => c?.name === court.name) === index
        ) || [];

      // Split courts by row_side and sort by menu_order
      const leftCourts = courtsFromMatches
        .filter((c: any) => c.row_side === 'left')
        .sort((a: any, b: any) => (a.menu_order || 0) - (b.menu_order || 0));

      const rightCourts = courtsFromMatches
        .filter((c: any) => c.row_side === 'right')
        .sort((a: any, b: any) => (a.menu_order || 0) - (b.menu_order || 0));

      // Define court position ranges
      const courtRanges: Record<string, { start: number; end: number }> = {};

      // Assign positions for LEFT courts (starting at 1)
      let positionCounter = 1;
      leftCourts.forEach((court: any) => {
        const playerCount = courtPlayerMap.get(court.name)?.size || 0;
        courtRanges[court.name] = {
          start: positionCounter,
          end: positionCounter + playerCount - 1,
        };
        positionCounter += playerCount;
      });

      // Assign positions for RIGHT courts (starting at 9)
      positionCounter = 9;
      rightCourts.forEach((court: any) => {
        const playerCount = courtPlayerMap.get(court.name)?.size || 0;
        courtRanges[court.name] = {
          start: positionCounter,
          end: positionCounter + playerCount - 1,
        };
        positionCounter += playerCount;
      });

      // Create sorted court list for display (left first, then right)
      const sortedCourts = [...leftCourts, ...rightCourts].map((c: any) => c.name);

      // Group players by court and rank within each court
      const courtGroups = new Map<string, PlayerStanding[]>();

      courtPlayerMap.forEach((playerIds, courtName) => {
        const courtPlayers = Array.from(playerIds)
          .map(pid => playerMap.get(pid))
          .filter(Boolean) as PlayerStanding[];

        // Sort within court group: R3 games won DESC → R3 specials DESC → R2 games won DESC → R1 games won DESC
        courtPlayers.sort((a, b) => {
          if (b.round3_games_won !== a.round3_games_won) {
            return b.round3_games_won - a.round3_games_won;
          }
          if (b.round3_specials !== a.round3_specials) {
            return b.round3_specials - a.round3_specials;
          }
          if (b.round2_games_won !== a.round2_games_won) {
            return b.round2_games_won - a.round2_games_won;
          }
          return b.round1_games_won - a.round1_games_won;
        });

        // Assign positions based on court range
        const range = courtRanges[courtName];
        courtPlayers.forEach((player, idx) => {
          player.position = range.start + idx;
          player.court_name = courtName;
          player.court_position_range = `${range.start}-${range.end}`;

          // Detect tie-breaker used
          if (idx < courtPlayers.length - 1) {
            const next = courtPlayers[idx + 1];
            if (player.round3_games_won === next.round3_games_won) {
              if (player.round3_specials !== next.round3_specials) {
                player.tie_breaker_used = 'r3_specials';
              } else if (player.round2_games_won !== next.round2_games_won) {
                player.tie_breaker_used = 'r2_games';
              } else if (player.round1_games_won !== next.round1_games_won) {
                player.tie_breaker_used = 'r1_games';
              }
            }
          }
        });

        courtGroups.set(courtName, courtPlayers);
      });

      // Flatten and return sorted by position
      const standings: PlayerStanding[] = [];
      sortedCourts.forEach(courtName => {
        const group = courtGroups.get(courtName);
        if (group) standings.push(...group);
      });

      return standings;
    },
    enabled: !!tournamentId,
  });
};
