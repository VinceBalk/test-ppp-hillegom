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
 * R1: Spelers blijven op hun toegewezen baan, spelen 3 potjes in round-robin
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
    // R2: Herschik spelers voor maximale variatie
    return generateRound2Matches(players, courtPrefix, courtsToUse, startMatchNumber);
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
      
      // 3 potjes per groep - alle mogelijke 2v2 combinaties
      // Potje 1: Speler 1+3 vs Speler 2+4
      matches.push(createMatch({
        courtPrefix,
        courtIndex,
        potje: 1,
        team1: [groupPlayers[0], groupPlayers[2]],
        team2: [groupPlayers[1], groupPlayers[3]],
        courtName,
        courtId,
        courtMenuOrder,
      }));

      // Potje 2: Speler 1+4 vs Speler 2+3
      matches.push(createMatch({
        courtPrefix,
        courtIndex,
        potje: 2,
        team1: [groupPlayers[0], groupPlayers[3]],
        team2: [groupPlayers[1], groupPlayers[2]],
        courtName,
        courtId,
        courtMenuOrder,
      }));

      // Potje 3: Speler 1+2 vs Speler 3+4
      matches.push(createMatch({
        courtPrefix,
        courtIndex,
        potje: 3,
        team1: [groupPlayers[0], groupPlayers[1]],
        team2: [groupPlayers[2], groupPlayers[3]],
        courtName,
        courtId,
        courtMenuOrder,
      }));
    }
  }
  
  // Sorteer op potje, dan op baan
  matches.sort((a: any, b: any) => {
    if (a.round_within_group !== b.round_within_group) {
      return a.round_within_group - b.round_within_group;
    }
    return a.courtMenuOrder - b.courtMenuOrder;
  });
  
  // Nummer de wedstrijden
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
 * 
 * Strategie: Roteer spelers tussen banen
 * - Van elke baan gaan 2 spelers naar een andere baan
 * - Dit maximaliseert nieuwe tegenstanders
 */
function generateRound2Matches(
  players: TournamentPlayer[],
  courtPrefix: string,
  courts: Court[],
  startMatchNumber: number
): { matches: ScheduleMatch[], nextMatchNumber: number } {
  const matches: ScheduleMatch[] = [];
  
  // Splits spelers in groepen van 4 (zoals in R1)
  const groups: TournamentPlayer[][] = [];
  for (let i = 0; i < players.length; i += 4) {
    const group = players.slice(i, i + 4);
    if (group.length === 4) {
      groups.push(group);
    }
  }

  if (groups.length < 2) {
    // Te weinig groepen voor rotatie, gebruik zelfde als R1 maar andere combinaties
    return generateRound2SameGroup(players, courtPrefix, courts, startMatchNumber);
  }

  // Rotatie: wissel spelers 2 en 4 tussen opeenvolgende groepen
  // Groep A: [A1, A2, A3, A4] -> [A1, B2, A3, B4]
  // Groep B: [B1, B2, B3, B4] -> [B1, A2, B3, A4]
  const rotatedGroups: TournamentPlayer[][] = groups.map((group, idx) => {
    const nextIdx = (idx + 1) % groups.length;
    const nextGroup = groups[nextIdx];
    
    return [
      group[0],      // Blijft
      nextGroup[1],  // Van volgende groep
      group[2],      // Blijft
      nextGroup[3],  // Van volgende groep
    ];
  });

  // Genereer matches voor geroteerde groepen
  rotatedGroups.forEach((groupPlayers, courtIndex) => {
    const assignedCourt = courts[courtIndex % courts.length];
    const courtName = assignedCourt?.name || `${courtPrefix} Baan ${courtIndex + 1}`;
    const courtId = assignedCourt?.id;
    const courtMenuOrder = assignedCourt?.menu_order || 0;

    // Potje 1: Speler 1+3 vs Speler 2+4
    matches.push(createMatch({
      courtPrefix,
      courtIndex,
      potje: 1,
      team1: [groupPlayers[0], groupPlayers[2]],
      team2: [groupPlayers[1], groupPlayers[3]],
      courtName,
      courtId,
      courtMenuOrder,
    }));

    // Potje 2: Speler 1+4 vs Speler 2+3
    matches.push(createMatch({
      courtPrefix,
      courtIndex,
      potje: 2,
      team1: [groupPlayers[0], groupPlayers[3]],
      team2: [groupPlayers[1], groupPlayers[2]],
      courtName,
      courtId,
      courtMenuOrder,
    }));

    // Potje 3: Speler 1+2 vs Speler 3+4
    matches.push(createMatch({
      courtPrefix,
      courtIndex,
      potje: 3,
      team1: [groupPlayers[0], groupPlayers[1]],
      team2: [groupPlayers[2], groupPlayers[3]],
      courtName,
      courtId,
      courtMenuOrder,
    }));
  });

  // Sorteer en nummer
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
 * Fallback voor R2 als er maar 1 groep is: gebruik andere combinatievolgorde
 */
function generateRound2SameGroup(
  players: TournamentPlayer[],
  courtPrefix: string,
  courts: Court[],
  startMatchNumber: number
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

      // Andere volgorde dan R1 voor variatie
      // Potje 1: Speler 1+2 vs Speler 3+4 (was potje 3 in R1)
      matches.push(createMatch({
        courtPrefix,
        courtIndex,
        potje: 1,
        team1: [groupPlayers[0], groupPlayers[1]],
        team2: [groupPlayers[2], groupPlayers[3]],
        courtName,
        courtId,
        courtMenuOrder,
      }));

      // Potje 2: Speler 1+3 vs Speler 2+4 (was potje 1 in R1)
      matches.push(createMatch({
        courtPrefix,
        courtIndex,
        potje: 2,
        team1: [groupPlayers[0], groupPlayers[2]],
        team2: [groupPlayers[1], groupPlayers[3]],
        courtName,
        courtId,
        courtMenuOrder,
      }));

      // Potje 3: Speler 1+4 vs Speler 2+3 (was potje 2 in R1)
      matches.push(createMatch({
        courtPrefix,
        courtIndex,
        potje: 3,
        team1: [groupPlayers[0], groupPlayers[3]],
        team2: [groupPlayers[1], groupPlayers[2]],
        courtName,
        courtId,
        courtMenuOrder,
      }));
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

interface CreateMatchParams {
  courtPrefix: string;
  courtIndex: number;
  potje: number;
  team1: TournamentPlayer[];
  team2: TournamentPlayer[];
  courtName: string;
  courtId?: string;
  courtMenuOrder: number;
}

function createMatch(params: CreateMatchParams): ScheduleMatch {
  const { courtPrefix, courtIndex, potje, team1, team2, courtName, courtId, courtMenuOrder } = params;
  
  return {
    id: `${courtPrefix.toLowerCase()}-g${courtIndex + 1}-p${potje}`,
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
