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
 * R1: 1,4,5,8 op baan 1 — 2,3,6,7 op baan 2
 * R2: 1,3,5,7 op baan 1 — 2,4,6,8 op baan 2
 *
 * Spelers komen gesorteerd binnen op ranking_score DESC:
 * index 0 = rank 1 (beste), index 7 = rank 8 (laagste)
 */
export const generateGroupMatches = (
  players: TournamentPlayer[],
  courtPrefix: string,
  courts: Court[],
  startMatchNumber: number = 1,
  roundNumber: number = 1
): { matches: ScheduleMatch[], nextMatchNumber: number } => {
  const activeCourts = courts
    .filter(court => court.is_active)
    .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));

  const sideCourts = activeCourts.filter(c => {
    if (courtPrefix === 'Links')  return c.row_side === 'left';
    if (courtPrefix === 'Rechts') return c.row_side === 'right';
    return true;
  });

  const courtsToUse = sideCourts.length > 0 ? sideCourts : activeCourts;

  // ── Groepering op basis van gewenste baanindeling ────────────────────────
  // p = players gesorteerd op ranking (index 0 = rank 1, index 7 = rank 8)
  let groups: TournamentPlayer[][];

  if (roundNumber === 1) {
    // R1: baan 1 = 1,4,5,8  →  indices 0,3,4,7
    //     baan 2 = 2,3,6,7  →  indices 1,2,5,6
    groups = [
      [players[0], players[3], players[4], players[7]], // baan 1
      [players[1], players[2], players[5], players[6]], // baan 2
    ];
  } else {
    // R2: baan 1 = 1,3,5,7  →  indices 0,2,4,6
    //     baan 2 = 2,4,6,8  →  indices 1,3,5,7
    groups = [
      [players[0], players[2], players[4], players[6]], // baan 1
      [players[1], players[3], players[5], players[7]], // baan 2
    ];
  }

  const matches: ScheduleMatch[] = [];

  groups.forEach((groupPlayers, courtIndex) => {
    // Sla over als er niet genoeg spelers zijn (veiligheidcheck)
    if (groupPlayers.some(p => !p)) return;

    const assignedCourt = courtsToUse[courtIndex % courtsToUse.length];
    const courtName     = assignedCourt?.name       || `${courtPrefix} Baan ${courtIndex + 1}`;
    const courtId       = assignedCourt?.id;
    const courtMenuOrder = assignedCourt?.menu_order || 0;

    // 3 potjes per baan — vaste combinaties zodat iedereen
    // zoveel mogelijk verschillende partners/tegenstanders krijgt
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

  // Sorteer: eerst potje 1 alle banen, dan potje 2, dan potje 3
  matches.sort((a: any, b: any) => {
    if (a.round_within_group !== b.round_within_group) {
      return a.round_within_group - b.round_within_group;
    }
    return (a.courtMenuOrder || 0) - (b.courtMenuOrder || 0);
  });

  const numberedMatches = matches.map((match, index) => ({
    ...match,
    match_number: startMatchNumber + index,
  }));

  return {
    matches: numberedMatches,
    nextMatchNumber: startMatchNumber + numberedMatches.length,
  };
};

// ─── Helper: maak één ScheduleMatch aan ──────────────────────────────────────

function createMatch(
  courtPrefix: string,
  courtIndex: number,
  roundWithinGroup: number,
  roundNumber: number,
  team1: TournamentPlayer[],
  team2: TournamentPlayer[],
  courtName: string,
  courtId: string | undefined,
  courtMenuOrder: number
): ScheduleMatch {
  const id = `${courtPrefix.toLowerCase()}-court${courtIndex}-r${roundWithinGroup}-round${roundNumber}-${Date.now()}-${Math.random()}`;

  return {
    id,
    match_number: 0, // wordt overschreven door nummering hierboven
    round_number: roundNumber,
    round_within_group: roundWithinGroup,
    court_id: courtId,
    court_name: courtName,
    courtMenuOrder,
    groupCourtIndex: courtIndex,
    matchIndexWithinGroup: roundWithinGroup,
    team1_player1_id: team1[0]?.player_id,
    team1_player2_id: team1[1]?.player_id,
    team2_player1_id: team2[0]?.player_id,
    team2_player2_id: team2[1]?.player_id,
    team1_player1_name: team1[0]?.player?.name || '',
    team1_player2_name: team1[1]?.player?.name || '',
    team2_player1_name: team2[0]?.player?.name || '',
    team2_player2_name: team2[1]?.player?.name || '',
    status: 'pending',
  } as ScheduleMatch;
}
