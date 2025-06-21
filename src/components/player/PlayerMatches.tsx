
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
    if (match.team1_player1 && match.team2_player1) {
      return '2v2';
    }
    if (match.player1 && match.player2) {
      return '1v1';
    }
    return 'Onbekend';
  };

  const getOpponentNames = (match: Match, playerId: string) => {
    // Check for 2v2 match
    if (match.team1_player1 && match.team2_player1) {
      // Determine which team the player is on
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
    
    // Check for 1v1 match
    if (match.player1 && match.player2) {
      return match.player1_id === playerId ? match.player2.name : match.player1.name;
    }
    
    return 'Onbekende tegenstander';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Gepland</Badge>;
      case 'in_progress':
        return <Badge variant="default">Bezig</Badge>;
      case 'completed':
        return <Badge variant="secondary">Voltooid</Badge>;
      default:
        return <Badge variant="outline">{status || 'Onbekend'}</Badge>;
    }
  };

  const getMatchResult = (match: Match, playerId: string) => {
    if (match.status !== 'completed') return null;

    // For 2v2 matches
    if (match.team1_player1 && match.team2_player1) {
      const isInTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
      const playerScore = isInTeam1 ? match.team1_score : match.team2_score;
      const opponentScore = isInTeam1 ? match.team2_score : match.team1_score;
      
      return `${playerScore} - ${opponentScore}`;
    }

    // For 1v1 matches
    if (match.player1 && match.player2) {
      const isPlayer1 = match.player1_id === playerId;
      const playerScore = isPlayer1 ? match.player1_score : match.player2_score;
      const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;
      
      return `${playerScore} - ${opponentScore}`;
    }

    return 'Geen score';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wedstrijden van {playerName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wedstrijden van {playerName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Fout bij laden van wedstrijden: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wedstrijden van {playerName}</CardTitle>
        <p className="text-sm text-muted-foreground">{matches.length} wedstrijden gevonden</p>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-muted-foreground">Geen wedstrijden gevonden voor deze speler.</p>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">vs {getOpponentNames(match, playerId)}</span>
                    <Badge variant={getMatchType(match) === '2v2' ? 'default' : 'secondary'}>
                      {getMatchType(match)}
                    </Badge>
                  </div>
                  {getStatusBadge(match.status)}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <span>{match.tournament?.name || 'Onbekend toernooi'}</span>
                  <span>•</span>
                  <span>Ronde {match.round_number}</span>
                  {match.court?.name && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {match.court.name}
                      </div>
                    </>
                  )}
                </div>

                {match.status === 'completed' && (
                  <div className="mt-2 p-2 bg-muted rounded">
                    <div className="text-sm font-medium">Uitslag: {getMatchResult(match, playerId)}</div>
                  </div>
                )}

                {match.created_at && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(match.created_at).toLocaleDateString('nl-NL')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
