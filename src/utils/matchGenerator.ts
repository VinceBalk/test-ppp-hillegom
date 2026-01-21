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
 * Genereert een max-variety schema voor R1 en R2
 * Elke groep van 4 spelers speelt 3 wedstrijden waarbij iedereen 
 * precies 1x met elke andere speler als partner speelt
 */
export const generateMaxVarietySchedule = (
  players: TournamentPlayer[], 
  courtPrefix: string, 
  courts: Court[],
  startMatchNumber: number = 1
): { matches: ScheduleMatch[], nextMatchNumber: number } => {
  const matches: ScheduleMatch[] = [];
  const activeCourts = courts
    .filter(court => court.is_active)
    .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));
  
  // Groepeer spelers in groepen van 4 voor round-robin style wedstrijden
  for (let groupStart = 0; groupStart < players.length; groupStart += 4) {
    const groupPlayers = players.slice(groupStart, groupStart + 4);
    
    if (groupPlayers.length >= 4) {
      const courtIndex = Math.floor(groupStart / 4);
      const assignedCourt = activeCourts[courtIndex % activeCourts.length];
      
      const courtName = assignedCourt 
        ? `${assignedCourt.name} (${courtPrefix})` 
        : `${courtPrefix} Baan ${courtIndex + 1}`;
      const courtId = assignedCourt ? assignedCourt.id : undefined;
      const courtMenuOrder = assignedCourt?.menu_order || 0;
      
      // Round-robin patroon voor max variety:
      // Ronde 1: Speler 1&3 vs Speler 2&4
      matches.push({
        id: `${courtPrefix.toLowerCase()}-g${courtIndex + 1}-r1`,
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
        id: `${courtPrefix.toLowerCase()}-g${courtIndex + 1}-r2`,
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
        id: `${courtPrefix.toLowerCase()}-g${courtIndex + 1}-r3`,
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
  
  // Sorteer: eerst op round_within_group, dan op court menu_order
  matches.sort((a: any, b: any) => {
    if (a.round_within_group !== b.round_within_group) {
      return a.round_within_group - b.round_within_group;
    }
    return a.courtMenuOrder - b.courtMenuOrder;
  });
  
  // Wijs sequentiële match nummers toe
  const numberedMatches = matches.map((match, index) => ({
    ...match,
    match_number: startMatchNumber + index,
  }));
  
  const nextMatchNumber = startMatchNumber + numberedMatches.length;
  
  return { 
    matches: numberedMatches, 
    nextMatchNumber 
  };
};

// Behoud backward compatibility
export const generateGroupMatches = generateMaxVarietySchedule;
