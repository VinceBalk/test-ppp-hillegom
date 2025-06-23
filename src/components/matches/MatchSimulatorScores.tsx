
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getShortTeamName } from '@/utils/matchUtils';
import { Match } from '@/hooks/useMatches';

interface MatchSimulatorScoresProps {
  match: Match;
  team1Score: number;
  team2Score: number;
  player1Score: number;
  player2Score: number;
  onTeam1ScoreChange: (value: number) => void;
  onTeam2ScoreChange: (value: number) => void;
  onPlayer1ScoreChange: (value: number) => void;
  onPlayer2ScoreChange: (value: number) => void;
}

export default function MatchSimulatorScores({
  match,
  team1Score,
  team2Score,
  player1Score,
  player2Score,
  onTeam1ScoreChange,
  onTeam2ScoreChange,
  onPlayer1ScoreChange,
  onPlayer2ScoreChange
}: MatchSimulatorScoresProps) {
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

  return (
    <>
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
              if (is2v2) onTeam1ScoreChange(value);
              else onPlayer1ScoreChange(value);
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
              if (is2v2) onTeam2ScoreChange(value);
              else onPlayer2ScoreChange(value);
            }}
            className="w-16 ml-4"
          />
        </div>
      </div>

      <div className="text-xs text-center text-muted-foreground bg-yellow-50 p-2 rounded">
        Totaal moet altijd 8 zijn: {is2v2 ? (team1Score + team2Score) : (player1Score + player2Score)}/8
      </div>
    </>
  );
}
