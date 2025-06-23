import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';
import { usePlayerMatches } from '@/hooks/usePlayerMatches';
import { Match } from '@/hooks/useMatches';

interface PlayerMatchesProps {
  playerId: string;
  playerName: string;
}

export default function PlayerMatches({ playerId, playerName }: PlayerMatchesProps) {
  const { matches, isLoading, error } = usePlayerMatches(playerId);

  const getMatchType = (match: Match) => {
    if (match.team1_player1 && match.team2_player1) return '2v2';
    if (match.player1 && match.player2) return '1v1';
    return 'Onbekend';
  };

  const getOpponentNames = (match: Match) => {
    if (match.team1_player1 && match.team2_player1) {
      return `${match.team2_player1.name} & ${match.team2_player2?.name ?? '...'}`;
    }
    if (match.player1 && match.player2) {
      return match.player1.name === playerName ? match.player2.name : match.player1.name;
    }
    return 'Onbekend';
  };

  const getPartnerName = (match: Match, playerId: string) => {
    if (match.team1_player1 && match.team2_player1) {
      if (match.team1_player1_id === playerId) return match.team1_player2?.name ?? '—';
      if (match.team1_player2_id === playerId) return match.team1_player1?.name ?? '—';
      if (match.team2_player1_id === playerId) return match.team2_player2?.name ?? '—';
      if (match.team2_player2_id === playerId) return match.team2_player1?.name ?? '—';
    }
    return null;
  };

  const getRound = (match: Match) => match.round_within_group ?? '—';
  const getCourt = (match: Match) => match.court_name ?? '—';

  if (isLoading) return <p>Bezig met laden...</p>;
  if (error) return <p>Fout bij laden van wedstrijden.</p>;
  if (!matches || matches.length === 0) return <p>Geen wedstrijden gevonden.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wedstrijden van {playerName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {matches.map((match) => {
          const type = getMatchType(match);
          const opponents = getOpponentNames(match);
          const partner = getPartnerName(match, playerId);
          const round = getRound(match);
          const court = getCourt(match);

          return (
            <div key={match.id} className="border p-4 rounded-lg shadow-sm text-sm space-y-1">
              <div className="flex items-center gap-4 text-muted-foreground text-xs mb-1">
                <span><Calendar className="inline w-4 h-4 mr-1" /> Ronde {round}</span>
                <span><MapPin className="inline w-4 h-
