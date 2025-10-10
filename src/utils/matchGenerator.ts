
import { ScheduleMatch } from '@/types/schedule';
import { TournamentPlayer } from '@/hooks/useTournamentPlayers';

interface Court {
  id: string;
  name: string;
  is_active: boolean;
  menu_order?: number;
}

export const generateGroupMatches = (
  players: TournamentPlayer[], 
  courtPrefix: string, 
  courts: Court[],
  startMatchNumber: number = 1
): { matches: ScheduleMatch[], nextMatchNumber: number } => {
  const matches: ScheduleMatch[] = [];
  const activeCourts = courts
    .filter(court => court.is_active)
    .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));
  
  // Group players into groups of 4 for round-robin style matches
  for (let groupStart = 0; groupStart < players.length; groupStart += 4) {
    const groupPlayers = players.slice(groupStart, groupStart + 4);
    
    if (groupPlayers.length >= 4) {
      const courtIndex = Math.floor(groupStart / 4);
      const assignedCourt = activeCourts[courtIndex % activeCourts.length];
      
      // Create more meaningful court names that include group info
      const courtName = assignedCourt ? 
        `${assignedCourt.name} (${courtPrefix})` : 
        `${courtPrefix} Baan ${courtIndex + 1}`;
      const courtId = assignedCourt ? assignedCourt.id : undefined;
      const courtMenuOrder = assignedCourt?.menu_order || 0;
      
      // Based on the Excel pattern:
      // Round 1: Player 1&3 vs Player 2&4
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
      } as any);

      // Round 2: Player 1&4 vs Player 2&3 
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
      } as any);

      // Round 3: Player 1&2 vs Player 3&4
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
      } as any);
    }
  }
  
  // Sort round-robin style: first by round_within_group, then by court menu_order
  matches.sort((a: any, b: any) => {
    if (a.round_within_group !== b.round_within_group) {
      return a.round_within_group - b.round_within_group;
    }
    return a.courtMenuOrder - b.courtMenuOrder;
  });
  
  // Assign sequential match numbers
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
