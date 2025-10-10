import { supabase } from '@/integrations/supabase/client';
import { ScheduleMatch } from '@/types/schedule';

interface PlayerStats {
  player_id: string;
  name: string;
  total_games: number;
  total_specials: number;
  group_side: string;
}

/**
 * Generates round-robin matches for a group of 4 players (3 matches)
 * Following the pattern from rounds 1 and 2
 */
const generateRoundRobinMatches = (
  players: PlayerStats[],
  groupPrefix: string,
  groupIndex: number,
  courtId: string | undefined,
  courtName: string,
  startMatchNumber: number
): ScheduleMatch[] => {
  if (players.length !== 4) {
    throw new Error('Round robin requires exactly 4 players');
  }

  const matches: ScheduleMatch[] = [];
  const courtNumber = (startMatchNumber % 4) || 4; // Cycle through 1,2,3,4

  // Match 1: Player 1&3 vs Player 2&4
  matches.push({
    id: `${groupPrefix.toLowerCase()}-g${groupIndex}-r3-m1`,
    team1_player1_id: players[0].player_id,
    team1_player2_id: players[2].player_id,
    team2_player1_id: players[1].player_id,
    team2_player2_id: players[3].player_id,
    team1_player1_name: players[0].name,
    team1_player2_name: players[2].name,
    team2_player1_name: players[1].name,
    team2_player2_name: players[3].name,
    court_name: courtName,
    court_number: courtNumber,
    court_id: courtId,
    round_within_group: 3,
  });

  // Match 2: Player 1&4 vs Player 2&3
  matches.push({
    id: `${groupPrefix.toLowerCase()}-g${groupIndex}-r3-m2`,
    team1_player1_id: players[0].player_id,
    team1_player2_id: players[3].player_id,
    team2_player1_id: players[1].player_id,
    team2_player2_id: players[2].player_id,
    team1_player1_name: players[0].name,
    team1_player2_name: players[3].name,
    team2_player1_name: players[1].name,
    team2_player2_name: players[2].name,
    court_name: courtName,
    court_number: ((courtNumber % 4) + 1) || 1,
    court_id: courtId,
    round_within_group: 3,
  });

  // Match 3: Player 1&2 vs Player 3&4
  matches.push({
    id: `${groupPrefix.toLowerCase()}-g${groupIndex}-r3-m3`,
    team1_player1_id: players[0].player_id,
    team1_player2_id: players[1].player_id,
    team2_player1_id: players[2].player_id,
    team2_player2_id: players[3].player_id,
    team1_player1_name: players[0].name,
    team1_player2_name: players[1].name,
    team2_player1_name: players[2].name,
    team2_player2_name: players[3].name,
    court_name: courtName,
    court_number: ((courtNumber + 1) % 4) + 1 || 1,
    court_id: courtId,
    round_within_group: 3,
  });

  return matches;
};

/**
 * Generates round 3 schedule based on round 1+2 stats
 * Best 4 and worst 4 per group (left/right) play round-robin
 */
export const generateRound3Schedule = async (tournamentId: string, courts: any[]) => {
  console.log('Generating Round 3 schedule for tournament:', tournamentId);

  // Get player stats from rounds 1 and 2
  const { data: stats, error: statsError } = await supabase
    .from('player_tournament_stats')
    .select(`
      player_id,
      tournament_id,
      games_won,
      tiebreaker_specials_count
    `)
    .eq('tournament_id', tournamentId)
    .in('round_number', [1, 2]);

  if (statsError) {
    console.error('Error fetching player stats:', statsError);
    throw statsError;
  }

  // Get player details and groups
  const { data: tournamentPlayers, error: playersError } = await supabase
    .from('tournament_players')
    .select(`
      player_id,
      group,
      player:players(name)
    `)
    .eq('tournament_id', tournamentId)
    .eq('active', true);

  if (playersError) {
    console.error('Error fetching tournament players:', playersError);
    throw playersError;
  }

  // Aggregate stats per player
  const playerStatsMap = new Map<string, PlayerStats>();
  
  stats?.forEach(stat => {
    const existing = playerStatsMap.get(stat.player_id);
    const player = tournamentPlayers?.find(tp => tp.player_id === stat.player_id);
    
    if (existing) {
      existing.total_games += stat.games_won || 0;
      existing.total_specials += stat.tiebreaker_specials_count || 0;
    } else if (player) {
      playerStatsMap.set(stat.player_id, {
        player_id: stat.player_id,
        name: (player.player as any)?.name || 'Unknown',
        total_games: stat.games_won || 0,
        total_specials: stat.tiebreaker_specials_count || 0,
        group_side: player.group,
      });
    }
  });

  const playerStats = Array.from(playerStatsMap.values());

  // Separate by group and sort
  const leftPlayers = playerStats
    .filter(p => p.group_side === 'left')
    .sort((a, b) => {
      if (b.total_games !== a.total_games) return b.total_games - a.total_games;
      return b.total_specials - a.total_specials;
    });

  const rightPlayers = playerStats
    .filter(p => p.group_side === 'right')
    .sort((a, b) => {
      if (b.total_games !== a.total_games) return b.total_games - a.total_games;
      return b.total_specials - a.total_specials;
    });

  console.log('Left players ranked:', leftPlayers);
  console.log('Right players ranked:', rightPlayers);

  // Get highest match number to continue numbering
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('match_number')
    .eq('tournament_id', tournamentId)
    .order('match_number', { ascending: false })
    .limit(1);

  const startMatchNumber = (existingMatches?.[0]?.match_number || 0) + 1;
  console.log('Starting match numbers from:', startMatchNumber);

  const activeCourts = courts.filter(c => c.is_active);
  const matches: ScheduleMatch[] = [];

  // Generate matches for left group - best 4
  if (leftPlayers.length >= 4) {
    const leftBest4 = leftPlayers.slice(0, 4);
    const courtIndex = 0;
    const court = activeCourts[courtIndex % activeCourts.length];
    
    const leftBestMatches = generateRoundRobinMatches(
      leftBest4,
      'Links-Top',
      1,
      court?.id,
      court ? `${court.name} (Links Top 4)` : 'Baan 1 (Links Top 4)',
      startMatchNumber
    );
    matches.push(...leftBestMatches);
  }

  // Generate matches for left group - worst 4
  if (leftPlayers.length >= 8) {
    const leftWorst4 = leftPlayers.slice(4, 8);
    const courtIndex = 1;
    const court = activeCourts[courtIndex % activeCourts.length];
    
    const leftWorstMatches = generateRoundRobinMatches(
      leftWorst4,
      'Links-Bottom',
      2,
      court?.id,
      court ? `${court.name} (Links Bottom 4)` : 'Baan 2 (Links Bottom 4)',
      startMatchNumber + 3
    );
    matches.push(...leftWorstMatches);
  }

  // Generate matches for right group - best 4
  if (rightPlayers.length >= 4) {
    const rightBest4 = rightPlayers.slice(0, 4);
    const courtIndex = 2;
    const court = activeCourts[courtIndex % activeCourts.length];
    
    const rightBestMatches = generateRoundRobinMatches(
      rightBest4,
      'Rechts-Top',
      3,
      court?.id,
      court ? `${court.name} (Rechts Top 4)` : 'Baan 3 (Rechts Top 4)',
      startMatchNumber + 6
    );
    matches.push(...rightBestMatches);
  }

  // Generate matches for right group - worst 4
  if (rightPlayers.length >= 8) {
    const rightWorst4 = rightPlayers.slice(4, 8);
    const courtIndex = 3;
    const court = activeCourts[courtIndex % activeCourts.length];
    
    const rightWorstMatches = generateRoundRobinMatches(
      rightWorst4,
      'Rechts-Bottom',
      4,
      court?.id,
      court ? `${court.name} (Rechts Bottom 4)` : 'Baan 4 (Rechts Bottom 4)',
      startMatchNumber + 9
    );
    matches.push(...rightWorstMatches);
  }

  console.log('Generated', matches.length, 'round 3 matches');
  return {
    matches,
    startMatchNumber,
    leftBest4: leftPlayers.slice(0, 4),
    leftWorst4: leftPlayers.slice(4, 8),
    rightBest4: rightPlayers.slice(0, 4),
    rightWorst4: rightPlayers.slice(4, 8),
  };
};
