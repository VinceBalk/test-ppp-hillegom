
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Match } from '@/hooks/useMatches';
import { getShortTeamName } from '@/utils/matchUtils';
import { Play, RotateCcw, Plus } from 'lucide-react';
import SpecialsManager from './SpecialsManager';

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
  const [showSpecials, setShowSpecials] = useState(false);

  const is2v2 = !!(match.team1_player1 && match.team2_player1);
  const is1v1 = !!(match.player1 && match.player2);

  const getPlayerNames = () => {
    if (is2v2) {
      const team1 = getShortTeamName(match.team1_player1, match.team1_player2);
      const team2 = getShortTeamName(match.team2_player1, match.team2_player2);
      return { team1, team2 };
    }
    return { 
      team1: getShortTeamName(match.player1), 
      team2: getShortTeamName(match.player2) 
    };
  };

  const { team1: team1Name, team2: team2Name } = getPlayerNames();

  // Enforce total score = 8 constraint
  useEffect(() => {
    if (is2v2) {
      const total = team1Score + team2Score;
      if (total > 8) {
        // Auto-adjust to maintain total of 8
        if (team1Score > team2Score) {
          setTeam1Score(8 - team2Score);
        } else {
          setTeam2Score(8 - team1Score);
        }
      }
    } else {
      const total = player1Score + player2Score;
      if (total > 8) {
        if (player1Score > player2Score) {
          setPlayer1Score(8 - player2Score);
        } else {
          setPlayer2Score(8 - player1Score);
        }
      }
    }
  }, [team1Score, team2Score, player1Score, player2Score, is2v2]);

  const handleTeam1ScoreChange = (value: number) => {
    if (value < 0) value = 0;
    if (value > 8) value = 8;
    setTeam1Score(value);
    setTeam2Score(8 - value);
  };

  const handleTeam2ScoreChange = (value: number) => {
    if (value < 0) value = 0;
    if (value > 8) value = 8;
    setTeam2Score(value);
    setTeam1Score(8 - value);
  };

  const handlePlayer1ScoreChange = (value: number) => {
    if (value < 0) value = 0;
    if (value > 8) value = 8;
    setPlayer1Score(value);
    setPlayer2Score(8 - value);
  };

  const handlePlayer2ScoreChange = (value: number) => {
    if (value < 0) value = 0;
    if (value > 8) value = 8;
    setPlayer2Score(value);
    setPlayer1Score(8 - value);
  };

  const handleReset = () => {
    setTeam1Score(0);
    setTeam2Score(8);
    setPlayer1Score(0);
    setPlayer2Score(8);
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

  if (showSpecials) {
    return (
      <SpecialsManager 
        match={match} 
        onClose={() => setShowSpecials(false)} 
        onBack={() => setShowSpecials(false)}
      />
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5 text-blue-600" />
            Wedstrijd Simulator
          </CardTitle>
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

        {/* Scores - stacked layout with team names and scores side by side */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex-1">{team1Name}</Label>
            <Input
              type="number"
              min="0"
              max="8"
              value={is2v2 ? team1Score : player1Score}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (is2v2) handleTeam1ScoreChange(value);
                else handlePlayer1ScoreChange(value);
              }}
              className="w-16 ml-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="flex-1">{team2Name}</Label>
            <Input
              type="number"
              min="0"
              max="8"
              value={is2v2 ? team2Score : player2Score}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (is2v2) handleTeam2ScoreChange(value);
                else handlePlayer2ScoreChange(value);
              }}
              className="w-16 ml-4"
            />
          </div>
        </div>

        <div className="text-xs text-center text-muted-foreground bg-yellow-50 p-2 rounded">
          Totaal moet altijd 8 zijn: {is2v2 ? (team1Score + team2Score) : (player1Score + player2Score)}/8
        </div>

        {/* Specials Button */}
        <Button 
          onClick={() => setShowSpecials(true)} 
          variant="outline" 
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Specials Registreren
        </Button>

        {/* Notes */}
        <div>
          <Label>Opmerkingen</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Bijzonderheden, opmerkingen..."
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
