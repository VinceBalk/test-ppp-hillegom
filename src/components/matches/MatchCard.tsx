
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Match } from '@/hooks/useMatches';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
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

  const getPlayerNames = (match: Match) => {
    // Check for 2v2 match first (prioritize over 1v1)
    if (match.team1_player1 && match.team2_player1) {
      const team1 = match.team1_player2 
        ? `${match.team1_player1.name} & ${match.team1_player2.name}`
        : match.team1_player1.name;
      const team2 = match.team2_player2
        ? `${match.team2_player1.name} & ${match.team2_player2.name}`
        : match.team2_player1.name;
      return `${team1} vs ${team2}`;
    }
    
    // Check for 1v1 match
    if (match.player1 && match.player2) {
      return `${match.player1.name} vs ${match.player2.name}`;
    }
    
    return 'Spelers nog niet toegewezen';
  };

  const getMatchType = (match: Match) => {
    if (match.team1_player1 && match.team2_player1) {
      return '2v2';
    }
    if (match.player1 && match.player2) {
      return '1v1';
    }
    return 'Onbekend';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">
              {getPlayerNames(match)}
            </CardTitle>
            <Badge variant={getMatchType(match) === '2v2' ? 'default' : 'secondary'}>
              {getMatchType(match)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(match.status)}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{match.tournament?.name || 'Onbekend toernooi'}</span>
          <span>•</span>
          <span>Ronde {match.round_number}</span>
          {match.created_at && (
            <>
              <span>•</span>
              <span>Aangemaakt: {new Date(match.created_at).toLocaleDateString('nl-NL')}</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          {match.match_date && (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(match.match_date).toLocaleDateString('nl-NL')}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(match.match_date).toLocaleTimeString('nl-NL', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </>
          )}
          {(match.court?.name || match.court_number) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {match.court?.name || `Baan ${match.court_number}`}
            </div>
          )}
          {match.notes && (
            <div className="text-xs text-blue-600">
              {match.notes}
            </div>
          )}
        </div>
        
        {match.status === 'completed' && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Uitslag:</div>
            <div className="text-lg">
              {getMatchType(match) === '2v2' 
                ? (match.team1_score !== undefined && match.team2_score !== undefined
                  ? `${match.team1_score} - ${match.team2_score}`
                  : 'Geen score')
                : (match.player1_score !== undefined && match.player2_score !== undefined
                  ? `${match.player1_score} - ${match.player2_score}`
                  : 'Geen score')
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
