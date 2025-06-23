
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Edit } from 'lucide-react';
import { Match } from '@/hooks/useMatches';
import { getShortTeamName } from '@/utils/matchUtils';
import MatchSimulator from './MatchSimulator';
import SavedMatchEditor from './SavedMatchEditor';

interface MatchCardProps {
  match: Match;
  matchNumberInCourtRound: number;
}

export default function MatchCard({ match, matchNumberInCourtRound }: MatchCardProps) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

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

  const getTournamentDate = () => {
    // Use tournament start_date if available, otherwise fall back to created_at
    if (match.tournament?.start_date) {
      return new Date(match.tournament.start_date).toLocaleDateString('nl-NL');
    }
    if (match.created_at) {
      return new Date(match.created_at).toLocaleDateString('nl-NL');
    }
    return 'Geen datum';
  };

  if (showSimulator) {
    return (
      <MatchSimulator 
        match={match} 
        onClose={() => setShowSimulator(false)} 
      />
    );
  }

  if (showEditor) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Wedstrijd Bewerken</h3>
          <Button variant="outline" size="sm" onClick={() => setShowEditor(false)}>
            Terug naar overzicht
          </Button>
        </div>
        <SavedMatchEditor 
          match={match} 
          tournamentId={match.tournament_id} 
        />
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        {/* Round badge and action buttons */}
        <div className="flex items-start justify-between mb-2">
          <Badge variant="default" className="bg-blue-600 text-white">
            Ronde {match.round_number}
          </Badge>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowEditor(true)}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Edit className="h-3 w-3 mr-1" />
              Bewerken
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowSimulator(true)}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Play className="h-3 w-3 mr-1" />
              Simuleren
            </Button>
          </div>
        </div>
        
        {/* Player names */}
        <CardTitle className="text-base leading-tight">
          {getPlayerNames(match)}
        </CardTitle>
        
        {/* Tournament info row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{match.tournament?.name || 'Onbekend toernooi'}</span>
            <span>•</span>
            <span>Wedstrijd {matchNumberInCourtRound}</span>
            <span>•</span>
            <span>{getTournamentDate()}</span>
            <span>•</span>
            {getStatusBadge(match.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {match.notes && (
          <div className="text-xs text-orange-600 mb-3 p-2 bg-orange-50 rounded">
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
