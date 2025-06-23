
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Match } from '@/hooks/useMatches';
import { Play, RotateCcw } from 'lucide-react';

interface MatchSimulatorProps {
  match: Match;
  onClose: () => void;
}

export default function MatchSimulator({ match, onClose }: MatchSimulatorProps) {
  const [team1Score, setTeam1Score] = useState(match.team1_score || 0);
  const [team2Score, setTeam2Score] = useState(match.team2_score || 0);
  const [player1Score, setPlayer1Score] = useState(match.player1_score || 0);
  const [player2Score, setPlayer2Score] = useState(match.player2_score || 0);
  const [notes, setNotes] = useState(match.notes || '');
  const [status, setStatus] = useState<'scheduled' | 'in_progress' | 'completed'>(match.status);

  const is2v2 = !!(match.team1_player1 && match.team2_player1);
  const is1v1 = !!(match.player1 && match.player2);

  const getPlayerNames = () => {
    if (is2v2) {
      const team1 = match.team1_player2 
        ? `${match.team1_player1?.name} & ${match.team1_player2?.name}`
        : match.team1_player1?.name;
      const team2 = match.team2_player2
        ? `${match.team2_player1?.name} & ${match.team2_player2?.name}`
        : match.team2_player1?.name;
      return { team1, team2 };
    }
    return { 
      team1: match.player1?.name, 
      team2: match.player2?.name 
    };
  };

  const { team1: team1Name, team2: team2Name } = getPlayerNames();

  const handleReset = () => {
    setTeam1Score(0);
    setTeam2Score(0);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setNotes('');
    setStatus('scheduled');
  };

  const handleSimulate = () => {
    console.log('=== MATCH SIMULATION ===');
    console.log('Match ID:', match.id);
    console.log('Status:', status);
    console.log('Type:', is2v2 ? '2v2' : '1v1');
    if (is2v2) {
      console.log('Team 1 Score:', team1Score);
      console.log('Team 2 Score:', team2Score);
    } else {
      console.log('Player 1 Score:', player1Score);
      console.log('Player 2 Score:', player2Score);
    }
    console.log('Notes:', notes);
    console.log('=== SIMULATION COMPLETE (NOT SAVED) ===');
    
    // Show a temporary notification
    alert(`Wedstrijd gesimuleerd!\n${team1Name}: ${is2v2 ? team1Score : player1Score}\n${team2Name}: ${is2v2 ? team2Score : player2Score}\n\n(Niet opgeslagen in database)`);
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Wedstrijd Simulator
            </CardTitle>
            <Badge variant="outline" className="bg-blue-100 text-blue-700">
              {is2v2 ? '2v2' : '1v1'}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Sluiten
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {team1Name} vs {team2Name}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div>
          <Label>Status</Label>
          <div className="flex gap-2 mt-1">
            <Button
              variant={status === 'scheduled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus('scheduled')}
            >
              Gepland
            </Button>
            <Button
              variant={status === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus('in_progress')}
            >
              Bezig
            </Button>
            <Button
              variant={status === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus('completed')}
            >
              Voltooid
            </Button>
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{team1Name}</Label>
            <Input
              type="number"
              value={is2v2 ? team1Score : player1Score}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (is2v2) setTeam1Score(value);
                else setPlayer1Score(value);
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{team2Name}</Label>
            <Input
              type="number"
              value={is2v2 ? team2Score : player2Score}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (is2v2) setTeam2Score(value);
                else setPlayer2Score(value);
              }}
              className="mt-1"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label>Opmerkingen / Specials</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Bijzonderheden, specials, opmerkingen..."
            className="mt-1"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSimulate} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Simuleren
          </Button>
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
          💡 Dit is een simulator - data wordt niet opgeslagen in de database
        </div>
      </CardContent>
    </Card>
  );
}
