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
 * Genereert max-variety schema voor R1 en R2
 * Per groep van 4 spelers: 3 wedstrijden waarbij iedereen 1x met iedereen als partner speelt
 */
export const generateGroupMatches = (
  players: TournamentPlayer[], 
  groupPrefix: string, 
  courts: Court[],
  startMatchNumber: number = 1
): { matches: ScheduleMatch[], nextMatchNumber: number } => {
  const matches: ScheduleMatch[] = [];
  const activeCourts = courts
    .filter(court => court.is_active)
    .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));
  
  console.log(`generateGroupMatches: ${players.length} players, prefix: ${groupPrefix}, courts:`, activeCourts.map(c => c.name));
  
  // Groepeer spelers in groepen van 4
  for (let groupStart = 0; groupStart < players.length; groupStart += 4) {
    const groupPlayers = players.slice(groupStart, groupStart + 4);
    
    if (groupPlayers.length >= 4) {
      const courtIndex = Math.floor(groupStart / 4);
      const assignedCourt = activeCourts[courtIndex % activeCourts.length];
      
      // Court name ZONDER suffix - gewoon de baan naam
      const courtName = assignedCourt?.name || `Baan ${courtIndex + 1}`;
      const courtId = assignedCourt?.id;
      const courtMenuOrder = assignedCourt?.menu_order || 0;
      
      console.log(`Group ${courtIndex + 1}: ${groupPlayers.map(p => p.player.name).join(', ')} -> ${courtName}`);
      
      // Ronde 1: Speler 1&3 vs Speler 2&4
      matches.push({
        id: `${groupPrefix}-g${courtIndex + 1}-r1`,
        team1_player1_id: groupPlayers[0].player_id,
        team1_player2_id: groupPlayers[2].player_id,
        team2_player1_id: groupPlayers[1].player_id,
        team2_player2_id: groupPlayers[3].player_id,
        team1_player1_name: groupPlayers[0].player.name,
        team1_player2_name: groupPlayers[2].player.name,
        team2_player1_name: groupPlayers[1].player.name,
        team2_player2_name: groupPlayers[3].player.name,
        court_name: courtName,
        court_number: courtIndex + 1,
        court_id: courtId,
        round_within_group: 1,
        courtMenuOrder,
      } as ScheduleMatch & { courtMenuOrder: number });

      // Ronde 2: Speler 1&4 vs Speler 2&3
      matches.push({
        id: `${groupPrefix}-g${courtIndex + 1}-r2`,
        team1_player1_id: groupPlayers[0].player_id,
        team1_player2_id: groupPlayers[3].player_id,
        team2_player1_id: groupPlayers[1].player_id,
        team2_player2_id: groupPlayers[2].player_id,
        team1_player1_name: groupPlayers[0].player.name,
        team1_player2_name: groupPlayers[3].player.name,
        team2_player1_name: groupPlayers[1].player.name,
        team2_player2_name: groupPlayers[2].player.name,
        court_name: courtName,
        court_number: courtIndex + 1,
        court_id: courtId,
        round_within_group: 2,
        courtMenuOrder,
      } as ScheduleMatch & { courtMenuOrder: number });

      // Ronde 3: Speler 1&2 vs Speler 3&4
      matches.push({
        id: `${groupPrefix}-g${courtIndex + 1}-r3`,
        team1_player1_id: groupPlayers[0].player_id,
        team1_player2_id: groupPlayers[1].player_id,
        team2_player1_id: groupPlayers[2].player_id,
        team2_player2_id: groupPlayers[3].player_id,
        team1_player1_name: groupPlayers[0].player.name,
        team1_player2_name: groupPlayers[1].player.name,
        team2_player1_name: groupPlayers[2].player.name,
        team2_player2_name: groupPlayers[3].player.name,
        court_name: courtName,
        court_number: courtIndex + 1,
        court_id: courtId,
        round_within_group: 3,
        courtMenuOrder,
      } as ScheduleMatch & { courtMenuOrder: number });
    }
  }
  
  // Sorteer op ronde, dan op court menu_order
  matches.sort((a: any, b: any) => {
    if (a.round_within_group !== b.round_within_group) {
      return a.round_within_group - b.round_within_group;
    }
    return a.courtMenuOrder - b.courtMenuOrder;
  });
  
  // Nummeren
  const numberedMatches = matches.map((match, index) => ({
    ...match,
    match_number: startMatchNumber + index,
  }));
  
  console.log(`Generated ${numberedMatches.length} matches for ${groupPrefix}`);
  
  return { 
    matches: numberedMatches, 
    nextMatchNumber: startMatchNumber + numberedMatches.length 
  };
};

// Alias voor backward compatibility
export const generateMaxVarietySchedule = generateGroupMatches;
