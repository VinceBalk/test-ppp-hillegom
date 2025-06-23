
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Match } from '@/hooks/useMatches';
import { getShortTeamName } from '@/utils/matchUtils';
import SpecialsManager from './SpecialsManager';
import MatchSimulatorHeader from './MatchSimulatorHeader';
import MatchSimulatorStatus from './MatchSimulatorStatus';
import MatchSimulatorScores from './MatchSimulatorScores';
import MatchSimulatorNotes from './MatchSimulatorNotes';
import MatchSimulatorActions from './MatchSimulatorActions';

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
      <MatchSimulatorHeader match={match} onClose={onClose} />
      <CardContent className="space-y-4">
        <MatchSimulatorStatus 
          status={status} 
          onStatusChange={setStatus} 
        />

        <MatchSimulatorScores
          match={match}
          team1Score={team1Score}
          team2Score={team2Score}
          player1Score={player1Score}
          player2Score={player2Score}
          onTeam1ScoreChange={handleTeam1ScoreChange}
          onTeam2ScoreChange={handleTeam2ScoreChange}
          onPlayer1ScoreChange={handlePlayer1ScoreChange}
          onPlayer2ScoreChange={handlePlayer2ScoreChange}
        />

        <MatchSimulatorNotes 
          notes={notes} 
          onNotesChange={setNotes} 
        />

        <MatchSimulatorActions
          onSimulate={handleSimulate}
          onReset={handleReset}
          onShowSpecials={() => setShowSpecials(true)}
        />
      </CardContent>
    </Card>
  );
}
