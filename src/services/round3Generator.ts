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
  console.log(`📊 Received ${courts.length} courts:`, courts.map(c => c.name));
  
  // CRITICAL: Check if courts are loaded
  if (!courts || courts.length === 0) {
    console.error('❌ CRITICAL: No courts available - courts may not be loaded yet!');
    throw new Error('Geen banen beschikbaar. Wacht tot de banen zijn geladen en probeer opnieuw.');
  }

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

  console.log('Left players ranked:', leftPlayers.length, 'players');
  console.log('Right players ranked:', rightPlayers.length, 'players');
  
  // Valideer dat we genoeg spelers hebben
  if (leftPlayers.length < 8) {
    console.error(`❌ CRITICAL: Linker groep heeft slechts ${leftPlayers.length} spelers, minimaal 8 nodig voor Ronde 3!`);
    throw new Error(`Onvoldoende spelers in linker groep: ${leftPlayers.length}/8`);
  }
  
  if (rightPlayers.length < 8) {
    console.error(`❌ CRITICAL: Rechter groep heeft slechts ${rightPlayers.length} spelers, minimaal 8 nodig voor Ronde 3!`);
    throw new Error(`Onvoldoende spelers in rechter groep: ${rightPlayers.length}/8`);
  }

  // Get highest match number to continue numbering
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('match_number')
    .eq('tournament_id', tournamentId)
    .order('match_number', { ascending: false })
    .limit(1);

  const startMatchNumber = (existingMatches?.[0]?.match_number || 0) + 1;
  console.log('Starting match numbers from:', startMatchNumber);

  // Log beschikbare banen
  console.log(`Available courts (${courts.length}):`, courts.map(c => `${c.name} (active: ${c.is_active})`));

  // Zoek specifieke banen (zonder dubbele is_active check - dat gebeurt al in useSchedulePreview)
  const jopenBierCourt = courts.find(c => c.name === 'Jopen Bier Baan');
  const newYorkCourt = courts.find(c => c.name === 'New York Pizza Baan');
  const btaCourt = courts.find(c => c.name === 'BTA Baan');
  const keekCourt = courts.find(c => c.name === 'KEEK Baan');

  // Fallback: gebruik eerste beschikbare baan per row_side
  const leftCourts = courts.filter(c => c.row_side === 'left');
  const rightCourts = courts.filter(c => c.row_side === 'right');

  // DEFENSIVE CHECK: Verify all 4 expected courts exist
  const missingCourts = [];
  if (!jopenBierCourt) missingCourts.push('Jopen Bier Baan');
  if (!newYorkCourt) missingCourts.push('New York Pizza Baan');
  if (!btaCourt) missingCourts.push('BTA Baan');
  if (!keekCourt) missingCourts.push('KEEK Baan');
  
  if (missingCourts.length > 0) {
    console.warn(`⚠️ Missing courts: ${missingCourts.join(', ')}`);
    console.warn(`📋 Available courts: ${courts.map(c => c.name).join(', ')}`);
  }

  console.log('Court assignments:', {
    'Links Top (beste 4)': jopenBierCourt?.name || '❌ NOT FOUND',
    'Links Bottom (slechtste 4)': newYorkCourt?.name || '❌ NOT FOUND',
    'Rechts Top (beste 4)': btaCourt?.name || '❌ NOT FOUND',
    'Rechts Bottom (slechtste 4)': keekCourt?.name || '❌ NOT FOUND',
    'Fallback left courts available': leftCourts.length,
    'Fallback right courts available': rightCourts.length
  });

  const allMatches: any[] = [];

  // Generate matches voor alle 4 groepen met specifieke baan toewijzing + fallback
  const groups = [
    { 
      players: leftPlayers.slice(0, 4), 
      prefix: 'Links-Top', 
      index: 1, 
      court: jopenBierCourt || leftCourts[0],
      fallback: !jopenBierCourt
    },
    { 
      players: leftPlayers.slice(4, 8), 
      prefix: 'Links-Bottom', 
      index: 2, 
      court: newYorkCourt || leftCourts[1] || leftCourts[0],
      fallback: !newYorkCourt
    },
    { 
      players: rightPlayers.slice(0, 4), 
      prefix: 'Rechts-Top', 
      index: 3, 
      court: btaCourt || rightCourts[0],
      fallback: !btaCourt
    },
    { 
      players: rightPlayers.slice(4, 8), 
      prefix: 'Rechts-Bottom', 
      index: 4, 
      court: keekCourt || rightCourts[1] || rightCourts[0],
      fallback: !keekCourt
    },
  ];

  groups.forEach(group => {
    const courtInfo = group.court?.name || 'MISSING';
    const fallbackWarning = group.fallback ? ' (FALLBACK!)' : '';
    console.log(`Processing ${group.prefix}: ${group.players.length} players, court: ${courtInfo}${fallbackWarning}`);
    
    if (group.players.length < 4) {
      console.warn(`⚠️ Skipping ${group.prefix}: only ${group.players.length} players (need 4)`);
      return;
    }
    
    if (!group.court) {
      console.error(`❌ CRITICAL: Skipping ${group.prefix}: no court available even with fallback!`);
      return;
    }
    
    if (group.fallback) {
      console.warn(`⚠️ WARNING: ${group.prefix} using fallback court "${group.court.name}" - expected court not found!`);
    }
    
    const groupMatches = generateRoundRobinMatches(
      group.players.slice(0, 4), // Take exactly 4 players
      group.prefix,
      group.index,
      group.index // Gebruik group index voor sortering
    );
    
    // Wijs baan direct toe aan elke match in deze groep
    groupMatches.forEach(match => {
      match.court_id = group.court.id;
      match.court_name = group.court.name;
    });
    
    allMatches.push(...groupMatches);
    console.log(`✓ Generated 3 matches for ${group.prefix} on ${group.court.name}`);
  });

  // Sorteer matches: eerst alle "match 1", dan alle "match 2", dan alle "match 3"
  // Binnen elke ronde: sorteer op group index (1=Links Top, 2=Links Bottom, 3=Rechts Top, 4=Rechts Bottom)
  allMatches.sort((a, b) => {
    if (a.matchIndexWithinGroup !== b.matchIndexWithinGroup) {
      return a.matchIndexWithinGroup - b.matchIndexWithinGroup;
    }
    return a.groupCourtIndex - b.groupCourtIndex;
  });

  // Wijs match nummers toe (baan is al toegewezen)
  const matches: ScheduleMatch[] = allMatches.map((match, index) => {
    const matchNumber = startMatchNumber + index;
    
    return {
      ...match,
      match_number: matchNumber,
      court_number: matchNumber.toString(),
    };
  });

  console.log('Gegenereerd', matches.length, 'ronde 3 wedstrijden met correcte baan toewijzing');
  console.log('Wedstrijd nummering:', matches.map(m => `#${m.match_number} op ${m.court_name}`));

  return {
    matches,
    startMatchNumber,
    leftBest4: leftPlayers.slice(0, 4),
    leftWorst4: leftPlayers.slice(4, 8),
    rightBest4: rightPlayers.slice(0, 4),
    rightWorst4: rightPlayers.slice(4, 8),
  };
};
