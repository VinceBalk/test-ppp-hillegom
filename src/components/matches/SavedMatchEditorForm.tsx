
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import { Match } from '@/hooks/useMatches';

interface SavedMatchEditorFormProps {
  editedMatch: Match;
  availablePlayers: any[];
  activeCourts: any[];
  onSave: () => void;
  onCancel: () => void;
  onUpdatePlayer: (field: string, playerId: string) => void;
  onUpdateCourt: (courtId: string) => void;
  isSaving: boolean;
}

export default function SavedMatchEditorForm({
  editedMatch,
  availablePlayers,
  activeCourts,
  onSave,
  onCancel,
  onUpdatePlayer,
  onUpdateCourt,
  isSaving
}: SavedMatchEditorFormProps) {
  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Wedstrijd Bewerken
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSave} 
              className="h-6 w-6 p-0"
              disabled={isSaving}
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} className="h-6 w-6 p-0">
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
            onValueChange={onUpdateCourt}
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
              onValueChange={(value) => onUpdatePlayer('team1_player1_id', value)}
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
              onValueChange={(value) => onUpdatePlayer('team1_player2_id', value)}
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
              onValueChange={(value) => onUpdatePlayer('team2_player1_id', value)}
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
              onValueChange={(value) => onUpdatePlayer('team2_player2_id', value)}
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
