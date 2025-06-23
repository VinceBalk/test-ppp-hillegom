
import { Match } from '@/hooks/useMatches';

export const getMatchType = (match: Match) => {
  if (match.team1_player1 && match.team2_player1) return '2v2';
  if (match.player1 && match.player2) return '1v1';
  return 'Onbekend';
};

export const getOpponentNames = (match: Match, playerId: string) => {
  if (match.team1_player1 && match.team2_player1) {
    const isInTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
    if (isInTeam1) {
      return match.team2_player2
        ? `${match.team2_player1.name} & ${match.team2_player2.name}`
        : match.team2_player1.name;
    } else {
      return match.team1_player2
        ? `${match.team1_player1.name} & ${match.team1_player2.name}`
        : match.team1_player1.name;
    }
  }

  if (match.player1 && match.player2) {
    return match.player1_id === playerId ? match.player2.name : match.player1.name;
  }

  return 'Onbekend';
};

export const getPartnerName = (match: Match, playerId: string) => {
  if (match.team1_player1 && match.team2_player1) {
    if (match.team1_player1_id === playerId) return match.team1_player2?.name ?? 'geen';
    if (match.team1_player2_id === playerId) return match.team1_player1?.name ?? 'geen';
    if (match.team2_player1_id === playerId) return match.team2_player2?.name ?? 'geen';
    if (match.team2_player2_id === playerId) return match.team2_player1?.name ?? 'geen';
  }
  return null;
};

export const groupMatchesByRound = (matches: Match[]) => {
  return matches.reduce((groups, match) => {
    const round = match.round_number;
    if (!groups[round]) {
      groups[round] = [];
    }
    groups[round].push(match);
    return groups;
  }, {} as Record<number, Match[]>);
};
