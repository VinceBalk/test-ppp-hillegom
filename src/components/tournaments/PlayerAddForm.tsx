
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface Player {
  id: string;
  name: string;
}

interface PlayerAddFormProps {
  availablePlayers: Player[];
  onAddPlayer: (playerId: string, tournamentId: string, group: 'left' | 'right') => void;
  tournamentId: string;
  isAddingPlayer: boolean;
}

export default function PlayerAddForm({ 
  availablePlayers, 
  onAddPlayer, 
  tournamentId, 
  isAddingPlayer 
}: PlayerAddFormProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<'left' | 'right'>('left');

  const handleAddPlayer = () => {
    if (!selectedPlayerId || !tournamentId) return;
    
    onAddPlayer(selectedPlayerId, tournamentId, selectedGroup);
    
    setSelectedPlayerId('');
    setSelectedGroup('left');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Speler Toevoegen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="player-select">Selecteer Speler</Label>
          <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
            <SelectTrigger>
              <SelectValue placeholder="Kies een speler..." />
            </SelectTrigger>
            <SelectContent>
              {availablePlayers.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Groep</Label>
          <RadioGroup 
            value={selectedGroup} 
            onValueChange={(value) => setSelectedGroup(value as 'left' | 'right')}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="left" id="left" />
              <Label htmlFor="left">Links</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="right" id="right" />
              <Label htmlFor="right">Rechts</Label>
            </div>
          </RadioGroup>
        </div>

        <Button 
          onClick={handleAddPlayer}
          disabled={!selectedPlayerId || isAddingPlayer}
          className="w-full"
        >
          {isAddingPlayer ? 'Toevoegen...' : 'Speler Toevoegen'}
        </Button>
      </CardContent>
    </Card>
  );
}
