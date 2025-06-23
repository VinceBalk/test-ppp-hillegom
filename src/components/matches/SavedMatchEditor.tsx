
import { useState } from 'react';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useCourts } from '@/hooks/useCourts';
import { useIndividualMatchSaveMutation } from '@/hooks/useIndividualMatchSaveMutation';
import { Match } from '@/hooks/useMatches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Check, X, Edit } from 'lucide-react';

interface SavedMatchEditorProps {
  match: Match;
  tournamentId: string;
}

export default function SavedMatchEditor({ match, tournamentId }: SavedMatchEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState(match);
  const { tournamentPlayers } = useTournamentPlayers(tournamentId);
  const { courts } = useCourts();
  const saveMatch = useIndividualMatchSaveMutation();

  const availablePlayers = tournamentPlayers;
  const activeCourts = courts.filter(court => court.is_active);

  const handleSaveToDatabase = async () => {
    if (!editedMatch.team1_player1_id || !editedMatch.team1_player2_id || 
        !editedMatch.team2_player1_id || !editedMatch.team2_player2_id) {
      console.error('All player IDs must be provided');
      return;
    }

    try {
      await saveMatch.mutateAsync({
        matchId: match.id,
        team1Player1Id: editedMatch.team1_player1_id,
        team1Player2Id: editedMatch.team1_player2_id,
        team2Player1Id: editedMatch.team2_player1_id,
        team2Player2Id: editedMatch.team2_player2_id,
        courtId: editedMatch.court_id,
        courtNumber: editedMatch.court_number,
        roundWithinGroup: editedMatch.round_number || 1
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

  const updatePlayer = (field: string, playerId: string) => {
    const player = availablePlayers.find(tp => tp.player_id === playerId);
    if (!player) return;

    setEditedMatch(prev => ({
      ...prev,
      [field]: playerId,
    }));
  };

  const updateCourt = (courtId: string) => {
    const court = activeCourts.find(c => c.id === courtId);
    if (!court) return;

    setEditedMatch(prev => ({
      ...prev,
      court_id: courtId,
    }));
  };

  if (!isEditing) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Wedstrijd Details
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-medium text-center">
            <div className="text-blue-600">
              {match.team1_player1?.name} & {match.team1_player2?.name}
            </div>
            <div className="text-sm text-muted-foreground my-1">vs</div>
            <div className="text-red-600">
              {match.team2_player1?.name} & {match.team2_player2?.name}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground text-center mt-2">
            <div>{match.court?.name || match.court_number}</div>
            <div>Ronde {match.round_number}</div>
            <div>Status: {match.status}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Wedstrijd Bewerken
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSaveToDatabase} 
              className="h-6 w-6 p-0"
              disabled={saveMatch.isPending}
            >
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

        {/* Team 1 */}
        <div>
          <Label className="text-xs text-blue-600">Team 1</Label>
          <div className="grid grid-cols-2 gap-1">
            <Select
              value={editedMatch.team1_player1_id}
              onValueChange={(value) => updatePlayer('team1_player1_id', value)}
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
              onValueChange={(value) => updatePlayer('team1_player2_id', value)}
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
              onValueChange={(value) => updatePlayer('team2_player1_id', value)}
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
              onValueChange={(value) => updatePlayer('team2_player2_id', value)}
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
          <Label className="text-xs">Ronde</Label>
          <Input
            type="number"
            min="1"
            max="3"
            value={editedMatch.round_number}
            onChange={(e) => setEditedMatch(prev => ({ ...prev, round_number: parseInt(e.target.value) || 1 }))}
            className="h-7 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
