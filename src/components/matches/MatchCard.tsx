
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Play } from 'lucide-react';
import { Match } from '@/hooks/useMatches';
import { getShortTeamName } from '@/utils/matchUtils';
import MatchSimulator from './MatchSimulator';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const [showSimulator, setShowSimulator] = useState(false);

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
      const team1 = getShortTeamName(match.team1_player1, match.team1_player2);
      const team2 = getShortTeamName(match.team2_player1, match.team2_player2);
      return `${team1} vs ${team2}`;
    }
    
    // Check for 1v1 match
    if (match.player1 && match.player2) {
      const team1 = getShortTeamName(match.player1);
      const team2 = getShortTeamName(match.player2);
      return `${team1} vs ${team2}`;
    }
    
    return 'Spelers nog niet toegewezen';
  };

  // Fix court name display - prioritize court.name over court_number
  const getCourtName = (match: Match) => {
    if (match.court?.name) {
      return match.court.name;
    }
    if (match.court_number) {
      return `Baan ${match.court_number}`;
    }
    return 'Geen baan toegewezen';
  };

  if (showSimulator) {
    return (
      <MatchSimulator 
        match={match} 
        onClose={() => setShowSimulator(false)} 
      />
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base leading-tight">
            {getPlayerNames(match)}
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusBadge(match.status)}
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowSimulator(true)}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Play className="h-3 w-3 mr-1" />
              Simuleren
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{match.tournament?.name || 'Onbekend toernooi'}</span>
          <span>•</span>
          <span>R{match.round_number}</span>
          {match.created_at && (
            <>
              <span>•</span>
              <span>{new Date(match.created_at).toLocaleDateString('nl-NL')}</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          {match.match_date && (
            <>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(match.match_date).toLocaleDateString('nl-NL')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(match.match_date).toLocaleTimeString('nl-NL', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </>
          )}
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {getCourtName(match)}
          </div>
        </div>
        
        {match.notes && (
          <div className="text-xs text-blue-600 mb-3 p-2 bg-blue-50 rounded">
            {match.notes}
          </div>
        )}
        
        {match.status === 'completed' && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs font-medium mb-1">Uitslag:</div>
            <div className="text-lg font-bold">
              {match.team1_player1 && match.team2_player1
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
