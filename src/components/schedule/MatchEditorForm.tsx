
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';
import { ScheduleMatch } from '@/types/schedule';
import CourtSelector from './CourtSelector';
import TeamSelector from './TeamSelector';
import RoundInput from './RoundInput';

interface MatchEditorFormProps {
  editedMatch: ScheduleMatch;
  availablePlayers: Array<{
    player_id: string;
    player: { name: string };
  }>;
  activeCourts: Array<{
    id: string;
    name: string;
  }>;
  isLeftGroup: boolean;
  isRightGroup: boolean;
  showSaveButton?: boolean;
  onSave: () => void;
  onSaveToDatabase?: () => void;
  onCancel: () => void;
  onUpdatePlayer: (position: 'team1_player1' | 'team1_player2' | 'team2_player1' | 'team2_player2', playerId: string) => void;
  onUpdateCourt: (courtId: string) => void;
  onUpdateRound: (round: number) => void;
  isSaving?: boolean;
}

export default function MatchEditorForm({
  editedMatch,
  availablePlayers,
  activeCourts,
  isLeftGroup,
  isRightGroup,
  showSaveButton = false,
  onSave,
  onSaveToDatabase,
  onCancel,
  onUpdatePlayer,
  onUpdateCourt,
  onUpdateRound,
  isSaving = false
}: MatchEditorFormProps) {
  const handleTeam1PlayerChange = (position: string, playerId: string) => {
    const fullPosition = `team1_${position}` as 'team1_player1' | 'team1_player2';
    onUpdatePlayer(fullPosition, playerId);
  };

  const handleTeam2PlayerChange = (position: string, playerId: string) => {
    const fullPosition = `team2_${position}` as 'team2_player1' | 'team2_player2';
    onUpdatePlayer(fullPosition, playerId);
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Wedstrijd Bewerken - {isLeftGroup ? 'Links Groep' : isRightGroup ? 'Rechts Groep' : 'Onbekende Groep'}
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSave} 
              className="h-6 w-6 p-0"
              disabled={isSaving}
            >
              <Check className="h-3 w-3" />
            </Button>
            {showSaveButton && onSaveToDatabase && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSaveToDatabase} 
                className="h-6 w-6 p-0"
                disabled={isSaving}
                title="Opslaan naar database"
              >
                💾
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCancel} 
              className="h-6 w-6 p-0"
              disabled={isSaving}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <CourtSelector
          courtId={editedMatch.court_id || ''}
          courts={activeCourts}
          onCourtChange={onUpdateCourt}
        />

        {/* Available Players Info */}
        <div className="text-xs text-muted-foreground border-l-2 border-blue-200 pl-2">
          Beschikbare spelers uit {isLeftGroup ? 'linker' : isRightGroup ? 'rechter' : 'onbekende'} groep: {availablePlayers.length}
        </div>

        <TeamSelector
          teamLabel="Team 1"
          teamColor="text-blue-600"
          player1Id={editedMatch.team1_player1_id}
          player2Id={editedMatch.team1_player2_id}
          availablePlayers={availablePlayers}
          onPlayerChange={handleTeam1PlayerChange}
        />

        <TeamSelector
          teamLabel="Team 2"
          teamColor="text-red-600"
          player1Id={editedMatch.team2_player1_id}
          player2Id={editedMatch.team2_player2_id}
          availablePlayers={availablePlayers}
          onPlayerChange={handleTeam2PlayerChange}
        />

        <RoundInput
          round={editedMatch.round_within_group}
          onRoundChange={onUpdateRound}
        />
      </CardContent>
    </Card>
  );
}
