import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, PlayCircle, CheckCircle } from 'lucide-react';
import { Match } from '@/hooks/useMatches';
import { getShortTeamName } from '@/utils/matchUtils';
import MatchSimulator from './MatchSimulator';
import SavedMatchEditor from './SavedMatchEditor';
import MatchScoreInput from './MatchScoreInput';

interface MatchCardProps {
  match: Match;
  matchNumberInCourtRound?: number;
}

export default function MatchCard({ match, matchNumberInCourtRound }: MatchCardProps) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showScoreInput, setShowScoreInput] = useState(false);

  const toernooiStatus =
    match.tournament_status ||
    match.tournament?.status ||
    'unknown';

  const afgerond = match.status === 'completed';

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

  const getPlayerTeams = (match: Match) => {
    if (match.team1_player1 && match.team2_player1) {
      const team1 = getShortTeamName(match.team1_player1, match.team1_player2);
      const team2 = getShortTeamName(match.team2_player1, match.team2_player2);
      return { team1, team2 };
    }

    if (match.player1 && match.player2) {
      const team1 = getShortTeamName(match.player1);
      const team2 = getShortTeamName(match.player2);
      return { team1, team2 };
    }

    return { team1: 'Spelers nog niet toegewezen', team2: null };
  };

  const getTournamentDate = () => {
    if (match.tournament?.start_date) {
      return new Date(match.tournament.start_date).toLocaleDateString('nl-NL');
    }
    if (match.created_at) {
      return new Date(match.created_at).toLocaleDateString('nl-NL');
    }
    return 'Geen datum';
  };

  const displayMatchNumber = match.match_number || matchNumberInCourtRound;
  const { team1, team2 } = getPlayerTeams(match);

  if (showSimulator) {
    return <MatchSimulator match={match} onClose={() => setShowSimulator(false)} />;
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
        <SavedMatchEditor match={match} tournamentId={match.tournament_id} />
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        {/* Match number badge */}
        {displayMatchNumber && (
          <div className="flex justify-start mb-2">
            <Badge variant="secondary" className="text-xs">
              Wedstrijd #{displayMatchNumber}
            </Badge>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-start justify-end mb-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEditor(true)}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Edit className="h-3 w-3 mr-1" />
              Bewerken
            </Button>

            {toernooiStatus === 'not_started' && !afgerond && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSimulator(true)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <PlayCircle className="h-3 w-3 mr-1" />
                Simuleren
              </Button>
            )}

            {toernooiStatus === 'in_progress' && !afgerond && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowScoreInput(true)}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Score invoeren
              </Button>
            )}
          </div>
        </div>

        {/* Player names */}
        <CardTitle className="text-base leading-tight">
          {team2 ? (
            <div className="space-y-1 text-left">
              <div>{team1}</div>
              <div className="text-sm text-muted-foreground font-normal">vs</div>
              <div>{team2}</div>
            </div>
          ) : (
            <div className="text-left">{team1}</div>
          )}
        </CardTitle>

        {/* Tournament info row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{match.tournament?.name || 'Onbekend toernooi'}</span>
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

        {showScoreInput && (
          <MatchScoreInput
            match={match}
            tournament={{
              id: match.tournament_id,
              status: toernooiStatus,
              is_simulation: match.tournament?.is_simulation || false,
            }}
            round={match.round_number}
          />
        )}
      </CardContent>
    </Card>
  );
}
