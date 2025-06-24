
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, ArrowDown, Save, X } from 'lucide-react';
import { Match } from '@/hooks/useMatches';
import { useMatchNumberUpdate } from '@/hooks/useMatchNumberUpdate';
import { getShortTeamName } from '@/utils/matchUtils';

interface MatchNumberManagerProps {
  matches: Match[];
  tournamentId: string;
  roundNumber: number;
  onClose: () => void;
}

export default function MatchNumberManager({ 
  matches, 
  tournamentId, 
  roundNumber, 
  onClose 
}: MatchNumberManagerProps) {
  const [localMatches, setLocalMatches] = useState(
    matches.map((match, index) => ({
      ...match,
      tempMatchNumber: match.match_number || index + 1
    }))
  );
  
  const updateMatchNumbers = useMatchNumberUpdate();

  const moveMatch = (index: number, direction: 'up' | 'down') => {
    const newMatches = [...localMatches];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newMatches.length) {
      // Swap the matches
      [newMatches[index], newMatches[targetIndex]] = [newMatches[targetIndex], newMatches[index]];
      
      // Update their temp match numbers
      newMatches.forEach((match, idx) => {
        match.tempMatchNumber = idx + 1;
      });
      
      setLocalMatches(newMatches);
    }
  };

  const updateMatchNumber = (index: number, newNumber: number) => {
    const newMatches = [...localMatches];
    newMatches[index].tempMatchNumber = newNumber;
    setLocalMatches(newMatches);
  };

  const handleSave = () => {
    const matchIds = localMatches.map(m => m.id);
    const matchNumbers = localMatches.map(m => m.tempMatchNumber);
    
    updateMatchNumbers.mutate({
      tournamentId,
      roundNumber,
      matchIds,
      matchNumbers
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const getPlayerTeams = (match: Match) => {
    if (match.team1_player1 && match.team2_player1) {
      const team1 = getShortTeamName(match.team1_player1, match.team1_player2);
      const team2 = getShortTeamName(match.team2_player1, match.team2_player2);
      return `${team1} vs ${team2}`;
    }
    
    if (match.player1 && match.player2) {
      const team1 = getShortTeamName(match.player1);
      const team2 = getShortTeamName(match.player2);
      return `${team1} vs ${team2}`;
    }
    
    return 'Spelers niet toegewezen';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Wedstrijdnummers Beheren - Ronde {roundNumber}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Pas de volgorde van wedstrijden aan door ze te verslepen of nummers in te voeren.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {localMatches.map((match, index) => (
          <div key={match.id} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={match.tempMatchNumber}
                onChange={(e) => updateMatchNumber(index, parseInt(e.target.value) || 1)}
                className="w-16"
                min="1"
              />
            </div>
            
            <div className="flex-1">
              <div className="text-sm font-medium">
                {getPlayerTeams(match)}
              </div>
              <div className="text-xs text-muted-foreground">
                Baan: {match.court?.name || match.court_number || 'Onbekend'}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveMatch(index, 'up')}
                disabled={index === 0}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveMatch(index, 'down')}
                disabled={index === localMatches.length - 1}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateMatchNumbers.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMatchNumbers.isPending ? 'Opslaan...' : 'Wijzigingen Opslaan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
