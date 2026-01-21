import { ScheduleMatch } from '@/types/schedule';
import { TournamentPlayer } from '@/hooks/useTournamentPlayers';

interface Court {
  id: string;
  name: string;
  is_active: boolean;
  menu_order?: number;
  row_side?: string;
}

/**
 * Genereert round-robin wedstrijden voor 4 spelers op 1 baan
 * Resultaat: 3 wedstrijden waarbij iedereen 1x met iedereen als partner speelt
 */
const generateRoundRobinForFour = (
  players: TournamentPlayer[],
  court: Court,
  groupPrefix: string,
  groupIndex: number,
  roundNumber: number
): ScheduleMatch[] => {
  if (players.length !== 4) {
    console.error(`Expected 4 players, got ${players.length}`);
    return [];
  }

  const matches: ScheduleMatch[] = [];
  const [p1, p2, p3, p4] = players;

  // Wedstrijd 1: Speler 1&3 vs Speler 2&4
  matches.push({
    id: `${groupPrefix}-r${roundNumber}-g${groupIndex}-m1`,
    team1_player1_id: p1.player_id,
    team1_player2_id: p3.player_id,
    team2_player1_id: p2.player_id,
    team2_player2_id: p4.player_id,
    team1_player1_name: p1.player.name,
    team1_player2_name: p3.player.name,
    team2_player1_name: p2.player.name,
    team2_player2_name: p4.player.name,
    court_name: court.name,
    court_id: court.id,
    court_number: groupIndex,
    round_within_group: 1,
  });

  // Wedstrijd 2: Speler 1&4 vs Speler 2&3
  matches.push({
    id: `${groupPrefix}-r${roundNumber}-g${groupIndex}-m2`,
    team1_player1_id: p1.player_id,
    team1_player2_id: p4.player_id,
    team2_player1_id: p2.player_id,
    team2_player2_id: p3.player_id,
    team1_player1_name: p1.player.name,
    team1_player2_name: p4.player.name,
    team2_player1_name: p2.player.name,
    team2_player2_name: p3.player.name,
    court_name: court.name,
    court_id: court.id,
    court_number: groupIndex,
    round_within_group: 2,
  });

  // Wedstrijd 3: Speler 1&2 vs Speler 3&4
  matches.push({
    id: `${groupPrefix}-r${roundNumber}-g${groupIndex}-m3`,
    team1_player1_id: p1.player_id,
    team1_player2_id: p2.player_id,
    team2_player1_id: p3.player_id,
    team2_player2_id: p4.player_id,
    team1_player1_name: p1.player.name,
    team1_player2_name: p2.player.name,
    team2_player1_name: p3.player.name,
    team2_player2_name: p4.player.name,
    court_name: court.name,
    court_id: court.id,
    court_number: groupIndex,
    round_within_group: 3,
  });

  return matches;
};

/**
 * Genereert R1 + R2 schema met maximale variatie
 * 
 * Voor 8 spelers (genummerd 1-8 op ranking):
 * R1: Baan 1 = [1,4,5,8], Baan 2 = [2,3,6,7]
 * R2: Baan 1 = [1,3,6,8], Baan 2 = [2,4,5,7]
 */
export const generateR1R2Schedule = (
  players: TournamentPlayer[],
  groupPrefix: string,
  courts: Court[],
  startMatchNumber: number = 1
): { matches: ScheduleMatch[], nextMatchNumber: number } => {
  
  if (players.length !== 8) {
    console.error(`Expected 8 players for ${groupPrefix}, got ${players.length}`);
    return { matches: [], nextMatchNumber: startMatchNumber };
  }

  if (courts.length < 2) {
    console.error(`Expected at least 2 courts for ${groupPrefix}, got ${courts.length}`);
    return { matches: [], nextMatchNumber: startMatchNumber };
  }

  // Sorteer courts op menu_order
  const sortedCourts = [...courts].sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));
  const court1 = sortedCourts[0];
  const court2 = sortedCourts[1];

  // Spelers zijn al gesorteerd op ranking (1-8)
  const [s1, s2, s3, s4, s5, s6, s7, s8] = players;

  console.log(`Generating R1+R2 for ${groupPrefix}:`);
  console.log(`Players: ${players.map(p => p.player.name).join(', ')}`);
  console.log(`Courts: ${court1.name}, ${court2.name}`);

  const allMatches: ScheduleMatch[] = [];

  // R1: Baan 1 = [1,4,5,8], Baan 2 = [2,3,6,7]
  const r1Court1Players = [s1, s4, s5, s8];
  const r1Court2Players = [s2, s3, s6, s7];

  console.log(`R1 Court1 [${court1.name}]: ${r1Court1Players.map(p => p.player.name).join(', ')}`);
  console.log(`R1 Court2 [${court2.name}]: ${r1Court2Players.map(p => p.player.name).join(', ')}`);

  const r1Court1Matches = generateRoundRobinForFour(r1Court1Players, court1, groupPrefix, 1, 1);
  const r1Court2Matches = generateRoundRobinForFour(r1Court2Players, court2, groupPrefix, 2, 1);

  // R2: Baan 1 = [1,3,6,8], Baan 2 = [2,4,5,7]
  const r2Court1Players = [s1, s3, s6, s8];
  const r2Court2Players = [s2, s4, s5, s7];

  console.log(`R2 Court1 [${court1.name}]: ${r2Court1Players.map(p => p.player.name).join(', ')}`);
  console.log(`R2 Court2 [${court2.name}]: ${r2Court2Players.map(p => p.player.name).join(', ')}`);

  const r2Court1Matches = generateRoundRobinForFour(r2Court1Players, court1, groupPrefix, 1, 2);
  const r2Court2Matches = generateRoundRobinForFour(r2Court2Players, court2, groupPrefix, 2, 2);

  // Combineer alle matches
  allMatches.push(...r1Court1Matches, ...r1Court2Matches, ...r2Court1Matches, ...r2Court2Matches);

  // Sorteer: eerst op ronde (R1 dan R2), dan op round_within_group, dan op court
  allMatches.sort((a, b) => {
    // Extract ronde nummer uit ID (r1 of r2)
    const aRound = a.id.includes('-r1-') ? 1 : 2;
    const bRound = b.id.includes('-r1-') ? 1 : 2;
    
    if (aRound !== bRound) return aRound - bRound;
    if (a.round_within_group !== b.round_within_group) return a.round_within_group - b.round_within_group;
    
    const aCourtOrder = courts.find(c => c.id === a.court_id)?.menu_order || 0;
    const bCourtOrder = courts.find(c => c.id === b.court_id)?.menu_order || 0;
    return aCourtOrder - bCourtOrder;
  });

  // Nummeren
  const numberedMatches = allMatches.map((match, index) => ({
    ...match,
    match_number: startMatchNumber + index,
  }));

  console.log(`Generated ${numberedMatches.length} matches for ${groupPrefix}`);

  return {
    matches: numberedMatches,
    nextMatchNumber: startMatchNumber + numberedMatches.length,
  };
};

// Backward compatibility alias
export const generateGroupMatches = generateR1R2Schedule;
export const generateMaxVarietySchedule = generateR1R2Schedule;
