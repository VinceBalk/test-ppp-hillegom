import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Check, X, Save } from 'lucide-react';
import { Match } from '@/hooks/useMatches';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useCourts } from '@/hooks/useCourts';
import { useIndividualMatchSaveMutation } from '@/hooks/useIndividualMatchSaveMutation';

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

  // Get all players for this tournament
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
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {match.team1_player1?.name} & {match.team1_player2?.name} vs {match.team2_player1?.name} & {match.team2_player2?.name}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Toernooi: {match.tournament?.name}</div>
            <div>Ronde: {match.round_number}</div>
            <div>Baan: {match.court?.name || match.court_number || 'Niet toegewezen'}</div>
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
              <Save className="h-3 w-3" />
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
              value={editedMatch.team1_player1_id || ''}
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
              value={editedMatch.team1_player2_id || ''}
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
              value={editedMatch.team2_player1_id || ''}
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
              value={editedMatch.team2_player2_id || ''}
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
      </CardContent>
    </Card>
  );
}
