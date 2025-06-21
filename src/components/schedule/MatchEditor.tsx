
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Check, X } from 'lucide-react';
import { ScheduleMatch } from '@/hooks/useSchedulePreview';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';

interface MatchEditorProps {
  match: ScheduleMatch;
  tournamentId: string;
  onUpdate: (matchId: string, updates: Partial<ScheduleMatch>) => void;
}

export default function MatchEditor({ match, tournamentId, onUpdate }: MatchEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState<ScheduleMatch>(match);
  const { tournamentPlayers } = useTournamentPlayers(tournamentId);

  const handleSave = () => {
    onUpdate(match.id, editedMatch);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedMatch(match);
    setIsEditing(false);
  };

  const updatePlayer = (position: 'team1_player1' | 'team1_player2' | 'team2_player1' | 'team2_player2', playerId: string) => {
    const player = tournamentPlayers.find(tp => tp.player_id === playerId);
    if (!player) return;

    setEditedMatch(prev => ({
      ...prev,
      [`${position}_id`]: playerId,
      [`${position}_name`]: player.player.name,
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
          Wedstrijd Bewerken
          <div className="flex gap-1">
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
        {/* Court Settings */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Baan Naam</Label>
            <Input
              value={editedMatch.court_name || ''}
              onChange={(e) => setEditedMatch(prev => ({ ...prev, court_name: e.target.value }))}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Baan Nummer</Label>
            <Input
              type="number"
              value={editedMatch.court_number || ''}
              onChange={(e) => setEditedMatch(prev => ({ ...prev, court_number: parseInt(e.target.value) || 1 }))}
              className="h-7 text-xs"
            />
          </div>
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tournamentPlayers.map(tp => (
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tournamentPlayers.map(tp => (
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tournamentPlayers.map(tp => (
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tournamentPlayers.map(tp => (
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
