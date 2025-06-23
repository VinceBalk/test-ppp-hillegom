
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

  const getOpponentNames = (match: Match, playerId: string) => {
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

  const getPartnerName = (match: Match, playerId: string) => {
    if (match.team1_player1 && match.team2_player1) {
      if (match.team1_player1_id === playerId) return match.team1_player2?.name ?? 'geen';
      if (match.team1_player2_id === playerId) return match.team1_player1?.name ?? 'geen';
      if (match.team2_player1_id === playerId) return match.team2_player2?.name ?? 'geen';
      if (match.team2_player2_id === playerId) return match.team2_player1?.name ?? 'geen';
    }
    return null;
  };

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
          const opponents = getOpponentNames(match, playerId);
          const partner = getPartnerName(match, playerId);
          const type = getMatchType(match);

          return (
            <div key={match.id} className="border p-4 rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                Ronde {match.round_number} — {type}
              </div>

              {partner && (
                <div className="text-sm mb-1">
                  <span className="font-medium">Met:</span> {partner}
                </div>
              )}

              <div className="text-sm">
                <span className="font-medium">Tegen:</span> {opponents}
              </div>

              {match.court?.name && (
                <div className="text-xs text-gray-500 mt-1">
                  <MapPin className="inline w-3 h-3 mr-1" />
                  Baan: {match.court.name}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
