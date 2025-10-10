
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Save } from 'lucide-react';

interface MatchEditorFormProps {
  editedMatch: any;
  availablePlayers: any[];
  activeCourts: any[];
  isLeftGroup: boolean;
  isRightGroup: boolean;
  showSaveButton: boolean;
  onSave: () => void;
  onSaveToDatabase: () => void;
  onCancel: () => void;
  onUpdatePlayer: (position: string, playerId: string) => void;
  onUpdateCourt: (courtId: string) => void;
  onUpdateRound: (round: number) => void;
  isSaving: boolean;
}

export default function MatchEditorForm({
  editedMatch,
  availablePlayers,
  activeCourts,
  isLeftGroup,
  isRightGroup,
  showSaveButton,
  onSave,
  onSaveToDatabase,
  onCancel,
  onUpdatePlayer,
  onUpdateCourt,
  onUpdateRound,
  isSaving
}: MatchEditorFormProps) {
  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Wedstrijd Bewerken - {isLeftGroup ? 'Linker rijtje' : isRightGroup ? 'Rechter rijtje' : 'Onbekende Groep'}
          <div className="flex gap-1">
            {showSaveButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSaveToDatabase} 
                className="h-6 w-6 p-0"
                disabled={isSaving}
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onSave} className="h-6 w-6 p-0">
              <Check className="h-3 w-3" />
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
              onValueChange={(value) => onUpdatePlayer('team1_player1', value)}
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
              onValueChange={(value) => onUpdatePlayer('team1_player2', value)}
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
              onValueChange={(value) => onUpdatePlayer('team2_player1', value)}
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
              onValueChange={(value) => onUpdatePlayer('team2_player2', value)}
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
            onChange={(e) => onUpdateRound(parseInt(e.target.value) || 1)}
            className="h-7 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
