import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Check, X, Save } from 'lucide-react';
import { ScheduleMatch } from '@/hooks/useSchedulePreview';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useCourts } from '@/hooks/useCourts';
import { useIndividualMatchSaveMutation } from '@/hooks/useIndividualMatchSaveMutation';

interface MatchEditorProps {
  match: ScheduleMatch;
  tournamentId: string;
  onUpdate: (matchId: string, updates: Partial<ScheduleMatch>) => void;
  showSaveButton?: boolean;
}

export default function MatchEditor({ match, tournamentId, onUpdate, showSaveButton = false }: MatchEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState<ScheduleMatch>(match);
  const { tournamentPlayers } = useTournamentPlayers(tournamentId);
  const { courts } = useCourts();
  const saveMatch = useIndividualMatchSaveMutation();

  const activeCourts = courts.filter(court => court.is_active);

  // Determine which group this match belongs to based on court name
  const isLeftGroup = match.court_name?.includes('Links') || false;
  const isRightGroup = match.court_name?.includes('Rechts') || false;
  
  // Filter players based on the match's group
  const availablePlayers = tournamentPlayers.filter(tp => {
    if (isLeftGroup) return tp.group === 'left';
    if (isRightGroup) return tp.group === 'right';
    return true; // If group can't be determined, show all players
  });

  const handleSave = () => {
    onUpdate(match.id, editedMatch);
    setIsEditing(false);
  };

  const handleSaveToDatabase = async () => {
    try {
      await saveMatch.mutateAsync({
        matchId: match.id,
        team1Player1Id: editedMatch.team1_player1_id,
        team1Player2Id: editedMatch.team1_player2_id,
        team2Player1Id: editedMatch.team2_player1_id,
        team2Player2Id: editedMatch.team2_player2_id,
        courtId: editedMatch.court_id,
        courtNumber: editedMatch.court_number?.toString(),
        roundWithinGroup: editedMatch.round_within_group
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save match to database:', error);
    }
  };

  const handleCancel = () => {
    setEditedMatch(match);
    setIsEditing(false);
  };

  const updatePlayer = (position: 'team1_player1' | 'team1_player2' | 'team2_player1' | 'team2_player2', playerId: string) => {
    const player = availablePlayers.find(tp => tp.player_id === playerId);
    if (!player) return;

    setEditedMatch(prev => ({
      ...prev,
      [`${position}_id`]: playerId,
      [`${position}_name`]: player.player.name,
    }));
  };

  const updateCourt = (courtId: string) => {
    const court = activeCourts.find(c => c.id === courtId);
    if (!court) return;

    setEditedMatch(prev => ({
      ...prev,
      court_id: courtId,
      court_name: court.name,
    }));
  };

  if (!isEditing) {
    return (
      <div className="p-3 border rounded-lg bg-muted/30 relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="h-3 w-3" />
        </Button>
        
        <div className="font-medium text-center">
          <div className="text-blue-600">
            {match.team1_player1_name} & {match.team1_player2_name}
          </div>
          <div className="text-sm text-muted-foreground my-1">vs</div>
          <div className="text-red-600">
            {match.team2_player1_name} & {match.team2_player2_name}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground text-center mt-2">
          <div>{match.court_name}</div>
          <div>Ronde {match.round_within_group}</div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Wedstrijd Bewerken - {isLeftGroup ? 'Links Groep' : isRightGroup ? 'Rechts Groep' : 'Onbekende Groep'}
          <div className="flex gap-1">
            {showSaveButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSaveToDatabase} 
                className="h-6 w-6 p-0"
                disabled={saveMatch.isPending}
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSave} className="h-6 w-6 p-0">
              <Check className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Court Selection */}
        <div>
          <Label className="text-xs">Baan</Label>
          <Select
            value={editedMatch.court_id || ''}
            onValueChange={updateCourt}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Selecteer baan..." />
            </SelectTrigger>
            <SelectContent>
              {activeCourts.map(court => (
                <SelectItem key={court.id} value={court.id} className="text-xs">
                  {court.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Available Players Info */}
        <div className="text-xs text-muted-foreground border-l-2 border-blue-200 pl-2">
          Beschikbare spelers uit {isLeftGroup ? 'linker' : isRightGroup ? 'rechter' : 'onbekende'} groep: {availablePlayers.length}
        </div>

        {/* Team 1 */}
        <div>
          <Label className="text-xs text-blue-600">Team 1</Label>
          <div className="grid grid-cols-2 gap-1">
            <Select
              value={editedMatch.team1_player1_id}
              onValueChange={(value) => updatePlayer('team1_player1', value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Speler 1" />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.map(tp => (
                  <SelectItem key={tp.player_id} value={tp.player_id} className="text-xs">
                    {tp.player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={editedMatch.team1_player2_id}
              onValueChange={(value) => updatePlayer('team1_player2', value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Speler 2" />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.map(tp => (
                  <SelectItem key={tp.player_id} value={tp.player_id} className="text-xs">
                    {tp.player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Team 2 */}
        <div>
          <Label className="text-xs text-red-600">Team 2</Label>
          <div className="grid grid-cols-2 gap-1">
            <Select
              value={editedMatch.team2_player1_id}
              onValueChange={(value) => updatePlayer('team2_player1', value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Speler 1" />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.map(tp => (
                  <SelectItem key={tp.player_id} value={tp.player_id} className="text-xs">
                    {tp.player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={editedMatch.team2_player2_id}
              onValueChange={(value) => updatePlayer('team2_player2', value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Speler 2" />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.map(tp => (
                  <SelectItem key={tp.player_id} value={tp.player_id} className="text-xs">
                    {tp.player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Round Info */}
        <div>
          <Label className="text-xs">Ronde binnen groep</Label>
          <Input
            type="number"
            min="1"
            max="3"
            value={editedMatch.round_within_group}
            onChange={(e) => setEditedMatch(prev => ({
              ...prev,
              round_within_group: parseInt(e.target.value) || 1
            }))}
            className="h-7 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
