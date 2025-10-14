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
 * Match numbers will be assigned later in round-robin fashion
 */
const generateRoundRobinMatches = (
  players: PlayerStats[],
  groupPrefix: string,
  groupIndex: number,
  groupCourtIndex: number
): ScheduleMatch[] => {
  if (players.length !== 4) {
    throw new Error('Round robin requires exactly 4 players');
  }

  const matches: ScheduleMatch[] = [];

  // CORRECTE ROUND-ROBIN PATROON VOOR 4 SPELERS:
  // Spelers gesorteerd op prestatie: 1=beste, 2=tweede, 3=derde, 4=vierde
  // 
  // Match 1: Speler 1&3 vs Speler 2&4 (beste+derde vs tweede+vierde)
  // Match 2: Speler 1&4 vs Speler 2&3 (beste+vierde vs tweede+derde)  
  // Match 3: Speler 1&2 vs Speler 3&4 (beste+tweede vs derde+vierde)
  //
  // Dit zorgt ervoor dat elke speler 1x speelt met elk ander teamlid
  // en tegen elke tegenstander precies 1 keer.

  // Match 1: Speler 1&3 vs Speler 2&4
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
    round_within_group: 3,
    groupCourtIndex,
    matchIndexWithinGroup: 0,
  } as any);

  // Match 2: Speler 1&4 vs Speler 2&3
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
    round_within_group: 3,
    groupCourtIndex,
    matchIndexWithinGroup: 1,
  } as any);

  // Match 3: Speler 1&2 vs Speler 3&4
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
    round_within_group: 3,
    groupCourtIndex,
    matchIndexWithinGroup: 2,
  } as any);

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

  // Sort courts by menu_order for consistent assignment
  const activeCourts = courts
    .filter(c => c.is_active)
    .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));

  console.log('Active courts sorted by menu_order:', activeCourts.map(c => `${c.name} (${c.menu_order})`));

  const allMatches: any[] = [];

  // Generate matches for all 4 groups (without match numbers yet)
  const groups = [
    { players: leftPlayers.slice(0, 4), prefix: 'Links-Top', index: 1, courtIndex: 0 },
    { players: leftPlayers.slice(4, 8), prefix: 'Links-Bottom', index: 2, courtIndex: 1 },
    { players: rightPlayers.slice(0, 4), prefix: 'Rechts-Top', index: 3, courtIndex: 2 },
    { players: rightPlayers.slice(4, 8), prefix: 'Rechts-Bottom', index: 4, courtIndex: 3 },
  ];

  groups.forEach(group => {
    if (group.players.length >= 4) {
      const groupMatches = generateRoundRobinMatches(
        group.players,
        group.prefix,
        group.index,
        group.courtIndex
      );
      allMatches.push(...groupMatches);
    }
  });

  // Sort matches: first all "match 1", then all "match 2", then all "match 3"
  // Within each round, sort by groupCourtIndex (corresponds to court order)
  allMatches.sort((a, b) => {
    if (a.matchIndexWithinGroup !== b.matchIndexWithinGroup) {
      return a.matchIndexWithinGroup - b.matchIndexWithinGroup;
    }
    return a.groupCourtIndex - b.groupCourtIndex;
  });

  // Assign match numbers and courts in round-robin fashion
  const matches: ScheduleMatch[] = allMatches.map((match, index) => {
    const matchNumber = startMatchNumber + index;
    const court = activeCourts[match.groupCourtIndex % activeCourts.length];
    
    return {
      ...match,
      match_number: matchNumber,
      court_id: court?.id,
      court_name: court?.name || `Baan ${match.groupCourtIndex + 1}`,
      court_number: matchNumber.toString(),
    };
  });

  console.log('Generated', matches.length, 'round 3 matches with round-robin numbering');
  console.log('Match numbering:', matches.map(m => `#${m.match_number} on ${m.court_name}`));

  return {
    matches,
    startMatchNumber,
    leftBest4: leftPlayers.slice(0, 4),
    leftWorst4: leftPlayers.slice(4, 8),
    rightBest4: rightPlayers.slice(0, 4),
    rightWorst4: rightPlayers.slice(4, 8),
  };
};
