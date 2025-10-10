import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Match } from '@/hooks/useMatches';
import { getMatchType, getOpponentNames, getPartnerName } from '@/utils/playerMatchUtils';
import { getShortTeamName } from '@/utils/matchUtils';
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlayerMatchCardProps {
  match: Match;
  playerId: string;
}

export default function PlayerMatchCard({ match, playerId }: PlayerMatchCardProps) {
  const navigate = useNavigate();
  const isInTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
  const partnerName = getPartnerName(match, playerId);

  // Helper function to get specials count for a player
  const getPlayerSpecialsCount = (pid?: string) => {
    if (!pid || !match.match_specials) return 0;
    return match.match_specials
      .filter((special) => special.player_id === pid)
      .reduce((total, special) => total + special.count, 0);
  };

  const team1Player1Specials = getPlayerSpecialsCount(match.team1_player1_id);
  const team1Player2Specials = getPlayerSpecialsCount(match.team1_player2_id);
  const team2Player1Specials = getPlayerSpecialsCount(match.team2_player1_id);
  const team2Player2Specials = getPlayerSpecialsCount(match.team2_player2_id);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 pt-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Ronde {match.round_number}
            </Badge>
            {match.match_number && (
              <Badge variant="outline" className="text-xs">
                #{match.match_number}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {match.court?.name || (match.court_number ? `Baan ${match.court_number}` : "Baan onbekend")}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4 pt-0">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Team 1 - right aligned */}
          <div className="text-right space-y-2">
            <p className="text-xs font-semibold text-blue-600">Team 1</p>
            {match.team1_player1 && (
              <div className="flex items-center justify-end gap-2">
                <span className={`text-sm truncate max-w-[140px] sm:max-w-[200px] ${
                  match.team1_player1_id === playerId ? 'font-bold text-foreground' : 'text-muted-foreground'
                }`}>
                  {getShortTeamName(match.team1_player1)}
                </span>
                {team1Player1Specials > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-black text-xs font-bold flex-shrink-0">
                    {team1Player1Specials}
                  </span>
                )}
              </div>
            )}
            {match.team1_player2 && (
              <div className="flex items-center justify-end gap-2">
                <span className={`text-sm truncate max-w-[140px] sm:max-w-[200px] ${
                  match.team1_player2_id === playerId ? 'font-bold text-foreground' : 'text-muted-foreground'
                }`}>
                  {getShortTeamName(match.team1_player2)}
                </span>
                {team1Player2Specials > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-black text-xs font-bold flex-shrink-0">
                    {team1Player2Specials}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Score central */}
          <div className="text-center px-3">
            {match.status === 'completed' ? (
              <p className="text-2xl font-bold tabular-nums whitespace-nowrap">
                {match.team1_score ?? 0} - {match.team2_score ?? 0}
              </p>
            ) : (
              <Badge variant="outline">Gepland</Badge>
            )}
          </div>

          {/* Team 2 - left aligned */}
          <div className="text-left space-y-2">
            <p className="text-xs font-semibold text-red-600">Team 2</p>
            {match.team2_player1 && (
              <div className="flex items-center gap-2">
                <span className={`text-sm truncate max-w-[140px] sm:max-w-[200px] ${
                  match.team2_player1_id === playerId ? 'font-bold text-foreground' : 'text-muted-foreground'
                }`}>
                  {getShortTeamName(match.team2_player1)}
                </span>
                {team2Player1Specials > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-black text-xs font-bold flex-shrink-0">
                    {team2Player1Specials}
                  </span>
                )}
              </div>
            )}
            {match.team2_player2 && (
              <div className="flex items-center gap-2">
                <span className={`text-sm truncate max-w-[140px] sm:max-w-[200px] ${
                  match.team2_player2_id === playerId ? 'font-bold text-foreground' : 'text-muted-foreground'
                }`}>
                  {getShortTeamName(match.team2_player2)}
                </span>
                {team2Player2Specials > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-black text-xs font-bold flex-shrink-0">
                    {team2Player2Specials}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom info row */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t gap-2">
          <div className="text-xs text-muted-foreground flex-1">
            {match.tournament?.name || "Onbekend toernooi"}
          </div>
          {partnerName && (
            <div className="text-xs text-muted-foreground">
              Partner: <span className="font-semibold">{partnerName}</span>
            </div>
          )}
          {match.tournament_id && (
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate(`/tournaments/${match.tournament_id}/standings`)}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Stand
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
