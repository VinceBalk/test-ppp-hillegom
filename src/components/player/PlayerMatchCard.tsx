
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';
import { Match } from '@/hooks/useMatches';
import { getMatchType, getOpponentNames, getPartnerName } from '@/utils/playerMatchUtils';

interface PlayerMatchCardProps {
  match: Match;
  playerId: string;
}

export default function PlayerMatchCard({ match, playerId }: PlayerMatchCardProps) {
  const opponents = getOpponentNames(match, playerId);
  const partner = getPartnerName(match, playerId);
  const type = getMatchType(match);

  return (
    <div className="border p-4 rounded-lg shadow-sm bg-muted/20">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">
          <Calendar className="inline w-4 h-4 mr-1" />
          {match.tournament?.name} — {type}
        </div>
        <Badge variant="outline" className="text-xs">
          Ronde {match.round_number}
        </Badge>
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

      {match.status === 'completed' && (
        <div className="text-xs mt-2 p-2 bg-green-50 rounded">
          <span className="font-medium">Uitslag: </span>
          {match.team1_player1 && match.team2_player1
            ? (match.team1_score !== undefined && match.team2_score !== undefined
              ? `${match.team1_score} - ${match.team2_score}`
              : 'Geen score')
            : (match.player1_score !== undefined && match.player2_score !== undefined
              ? `${match.player1_score} - ${match.player2_score}`
              : 'Geen score')
          }
        </div>
      )}
    </div>
  );
}
