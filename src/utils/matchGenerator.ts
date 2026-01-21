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
 * Genereert matches voor een specifieke toernooironde (R1 of R2)
 * 
 * R1: Spelers blijven op hun toegewezen baan, spelen 3 potjes
 * R2: Spelers worden herschikt voor maximale variatie in tegenstanders
 */
export const generateGroupMatches = (
  players: TournamentPlayer[], 
  courtPrefix: string, 
  courts: Court[],
  startMatchNumber: number = 1,
  roundNumber: number = 1
): { matches: ScheduleMatch[], nextMatchNumber: number } => {
  const matches: ScheduleMatch[] = [];
  const activeCourts = courts
    .filter(court => court.is_active)
    .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));
  
  // Filter courts voor deze groep (links of rechts)
  const sideCourts = activeCourts.filter(c => {
    if (courtPrefix === 'Links') return c.row_side === 'left';
    if (courtPrefix === 'Rechts') return c.row_side === 'right';
    return true;
  });

  const courtsToUse = sideCourts.length > 0 ? sideCourts : activeCourts;

  if (roundNumber === 2) {
    return generateRound2Matches(players, courtPrefix, courtsToUse, startMatchNumber, roundNumber);
  }

  // R1: Standaard groepering - 4 spelers per baan, 3 potjes
  for (let groupStart = 0; groupStart < players.length; groupStart += 4) {
    const groupPlayers = players.slice(groupStart, groupStart + 4);
    
    if (groupPlayers.length >= 4) {
      const courtIndex = Math.floor(groupStart / 4);
      const assignedCourt = courtsToUse[courtIndex % courtsToUse.length];
      
      const courtName = assignedCourt?.name || `${courtPrefix} Baan ${courtIndex + 1}`;
      const courtId = assignedCourt?.id;
      const courtMenuOrder = assignedCourt?.menu_order || 0;
      
      // Potje 1: Speler 1+3 vs Speler 2+4
      matches.push(createMatch(
        courtPrefix, courtIndex, 1, roundNumber,
        [groupPlayers[0], groupPlayers[2]],
        [groupPlayers[1], groupPlayers[3]],
        courtName, courtId, courtMenuOrder
      ));

      // Potje 2: Speler 1+4 vs Speler 2+3
      matches.push(createMatch(
        courtPrefix, courtIndex, 2, roundNumber,
        [groupPlayers[0], groupPlayers[3]],
        [groupPlayers[1], groupPlayers[2]],
        courtName, courtId, courtMenuOrder
      ));

      // Potje 3: Speler 1+2 vs Speler 3+4
      matches.push(createMatch(
        courtPrefix, courtIndex, 3, roundNumber,
        [groupPlayers[0], groupPlayers[1]],
        [groupPlayers[2], groupPlayers[3]],
        courtName, courtId, courtMenuOrder
      ));
    }
  }
  
  // Sorteer op potje, dan op baan
  matches.sort((a: any, b: any) => {
    if (a.round_within_group !== b.round_within_group) {
      return a.round_within_group - b.round_within_group;
    }
    return a.courtMenuOrder - b.courtMenuOrder;
  });
  
  const numberedMatches = matches.map((match, index) => ({
    ...match,
    match_number: startMatchNumber + index,
  }));
  
  return { 
    matches: numberedMatches, 
    nextMatchNumber: startMatchNumber + numberedMatches.length 
  };
};

/**
 * R2: Herschik spelers zodat ze tegen andere tegenstanders spelen
 */
function generateRound2Matches(
  players: TournamentPlayer[],
  courtPrefix: string,
  courts: Court[],
  startMatchNumber: number,
  roundNumber: number
): { matches: ScheduleMatch[], nextMatchNumber: number } {
  const matches: ScheduleMatch[] = [];
  
  const groups: TournamentPlayer[][] = [];
  for (let i = 0; i < players.length; i += 4) {
    const group = players.slice(i, i + 4);
    if (group.length === 4) {
      groups.push(group);
    }
  }

  if (groups.length < 2) {
    return generateRound2SameGroup(players, courtPrefix, courts, startMatchNumber, roundNumber);
  }

  // Optimale rotatie: maximale variatie in tegenstanders
  // R1 Baan 1: [A, B, C, D], Baan 2: [E, F, G, H]
  // R2 Baan 1: [A, B, E, F], Baan 2: [C, D, G, H]
  // Zo speelt iedereen tegen volledig nieuwe tegenstanders
  const rotatedGroups: TournamentPlayer[][] = [];
  
  if (groups.length === 2) {
    // 2 banen: wissel onderste helft
    rotatedGroups.push([
      groups[0][0], groups[0][1],
      groups[1][0], groups[1][1],
    ]);
    rotatedGroups.push([
      groups[0][2], groups[0][3],
      groups[1][2], groups[1][3],
    ]);
  } else {
    // Fallback voor meer dan 2 banen: roteer paren
    groups.forEach((group, idx) => {
      const nextIdx = (idx + 1) % groups.length;
      const nextGroup = groups[nextIdx];
      
      rotatedGroups.push([
        group[0], group[1],
        nextGroup[2], nextGroup[3],
      ]);
    });
  }

  rotatedGroups.forEach((groupPlayers, courtIndex) => {
    const assignedCourt = courts[courtIndex % courts.length];
    const courtName = assignedCourt?.name || `${courtPrefix} Baan ${courtIndex + 1}`;
    const courtId = assignedCourt?.id;
    const courtMenuOrder = assignedCourt?.menu_order || 0;

    matches.push(createMatch(
      courtPrefix, courtIndex, 1, roundNumber,
      [groupPlayers[0], groupPlayers[2]],
      [groupPlayers[1], groupPlayers[3]],
      courtName, courtId, courtMenuOrder
    ));

    matches.push(createMatch(
      courtPrefix, courtIndex, 2, roundNumber,
      [groupPlayers[0], groupPlayers[3]],
      [groupPlayers[1], groupPlayers[2]],
      courtName, courtId, courtMenuOrder
    ));

    matches.push(createMatch(
      courtPrefix, courtIndex, 3, roundNumber,
      [groupPlayers[0], groupPlayers[1]],
      [groupPlayers[2], groupPlayers[3]],
      courtName, courtId, courtMenuOrder
    ));
  });

  matches.sort((a: any, b: any) => {
    if (a.round_within_group !== b.round_within_group) {
      return a.round_within_group - b.round_within_group;
    }
    return a.courtMenuOrder - b.courtMenuOrder;
  });

  const numberedMatches = matches.map((match, index) => ({
    ...match,
    match_number: startMatchNumber + index,
  }));

  return {
    matches: numberedMatches,
    nextMatchNumber: startMatchNumber + numberedMatches.length,
  };
}

/**
 * Fallback voor R2 als er maar 1 groep is
 */
function generateRound2SameGroup(
  players: TournamentPlayer[],
  courtPrefix: string,
  courts: Court[],
  startMatchNumber: number,
  roundNumber: number
): { matches: ScheduleMatch[], nextMatchNumber: number } {
  const matches: ScheduleMatch[] = [];

  for (let groupStart = 0; groupStart < players.length; groupStart += 4) {
    const groupPlayers = players.slice(groupStart, groupStart + 4);
    
    if (groupPlayers.length >= 4) {
      const courtIndex = Math.floor(groupStart / 4);
      const assignedCourt = courts[courtIndex % courts.length];
      const courtName = assignedCourt?.name || `${courtPrefix} Baan ${courtIndex + 1}`;
      const courtId = assignedCourt?.id;
      const courtMenuOrder = assignedCourt?.menu_order || 0;

      // Andere volgorde dan R1
      matches.push(createMatch(
        courtPrefix, courtIndex, 1, roundNumber,
        [groupPlayers[0], groupPlayers[1]],
        [groupPlayers[2], groupPlayers[3]],
        courtName, courtId, courtMenuOrder
      ));

      matches.push(createMatch(
        courtPrefix, courtIndex, 2, roundNumber,
        [groupPlayers[0], groupPlayers[2]],
        [groupPlayers[1], groupPlayers[3]],
        courtName, courtId, courtMenuOrder
      ));

      matches.push(createMatch(
        courtPrefix, courtIndex, 3, roundNumber,
        [groupPlayers[0], groupPlayers[3]],
        [groupPlayers[1], groupPlayers[2]],
        courtName, courtId, courtMenuOrder
      ));
    }
  }

  matches.sort((a: any, b: any) => {
    if (a.round_within_group !== b.round_within_group) {
      return a.round_within_group - b.round_within_group;
    }
    return a.courtMenuOrder - b.courtMenuOrder;
  });

  const numberedMatches = matches.map((match, index) => ({
    ...match,
    match_number: startMatchNumber + index,
  }));

  return {
    matches: numberedMatches,
    nextMatchNumber: startMatchNumber + numberedMatches.length,
  };
}

function createMatch(
  courtPrefix: string,
  courtIndex: number,
  potje: number,
  roundNumber: number,
  team1: TournamentPlayer[],
  team2: TournamentPlayer[],
  courtName: string,
  courtId: string | undefined,
  courtMenuOrder: number
): ScheduleMatch {
  return {
    id: `${courtPrefix.toLowerCase()}-r${roundNumber}-g${courtIndex + 1}-p${potje}`,
    team1_player1_id: team1[0].player_id,
    team1_player2_id: team1[1].player_id,
    team2_player1_id: team2[0].player_id,
    team2_player2_id: team2[1].player_id,
    team1_player1_name: team1[0].player.name,
    team1_player2_name: team1[1].player.name,
    team2_player1_name: team2[0].player.name,
    team2_player2_name: team2[1].player.name,
    court_name: courtName,
    court_number: courtIndex + 1,
    court_id: courtId,
    round_within_group: potje,
    courtMenuOrder,
  } as any;
}
