import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, Minus, Check } from 'lucide-react';
import { SimulatedSpecial } from '@/hooks/useSimulation';

interface SimulationScoreInputProps {
  match: {
    id: string;
    match_number?: number;
    court?: { name?: string; row_side?: string };
    team1_player1?: { id?: string; name?: string };
    team1_player2?: { id?: string; name?: string };
    team2_player1?: { id?: string; name?: string };
    team2_player2?: { id?: string; name?: string };
    team1_player1_id?: string;
    team1_player2_id?: string;
    team2_player1_id?: string;
    team2_player2_id?: string;
    simulated_team1_score?: number | null;
    simulated_team2_score?: number | null;
    simulated_specials?: SimulatedSpecial[];
    simulated_status?: string;
  };
  index: number;
  onSetScore: (matchId: string, team1Score: number, team2Score: number) => void;
  onAddSpecial: (matchId: string, playerId: string, playerName: string) => void;
  onRemoveSpecial: (matchId: string, playerId: string) => void;
  matchSpecials: SimulatedSpecial[];
}

export default function SimulationScoreInput({
  match,
  index,
  onSetScore,
  onAddSpecial,
  onRemoveSpecial,
  matchSpecials,
}: SimulationScoreInputProps) {
  const [team1Score, setTeam1Score] = useState<number>(
    match.simulated_team1_score !== null && match.simulated_team1_score !== undefined && match.simulated_team1_score >= 0
      ? match.simulated_team1_score 
      : 4
  );
  
  const isComplete = match.simulated_status === 'completed' || 
    (match.simulated_team1_score !== null && match.simulated_team1_score !== undefined && match.simulated_team1_score >= 0);
  
  const team2Score = 8 - team1Score;

  const handleScoreChange = (newTeam1Score: number) => {
    if (newTeam1Score < 0 || newTeam1Score > 8) return;
    setTeam1Score(newTeam1Score);
  };

  const handleConfirmScore = () => {
    onSetScore(match.id, team1Score, team2Score);
  };

  const getPlayerSpecialCount = (playerId?: string) => {
    if (!playerId) return 0;
    return matchSpecials
      .filter(s => s.playerId === playerId)
      .reduce((sum, s) => sum + s.count, 0);
  };

  const players = [
    { id: match.team1_player1_id, name: match.team1_player1?.name, team: 1 },
    { id: match.team1_player2_id, name: match.team1_player2?.name, team: 1 },
    { id: match.team2_player1_id, name: match.team2_player1?.name, team: 2 },
    { id: match.team2_player2_id, name: match.team2_player2?.name, team: 2 },
  ].filter(p => p.id && p.name);

  return (
    <Card className={`border-2 ${isComplete ? 'border-green-300 bg-green-50/50' : 'border-purple-200 bg-purple-50/30'}`}>
      <CardContent className="py-4 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <Badge variant="secondary" className="text-xs">
            Wedstrijd {index + 1}
          </Badge>
          {isComplete && (
            <Badge className="bg-green-600 text-xs">
              <Check className="h-3 w-3 mr-1" />
              Ingevuld
            </Badge>
          )}
        </div>

        {/* Teams en Score */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-4">
          {/* Team 1 */}
          <div className="text-right">
            <div className="text-xs font-semibold text-blue-600 mb-1">Team 1</div>
            <div className="text-sm font-medium truncate">{match.team1_player1?.name || 'Speler 1'}</div>
            <div className="text-sm text-muted-foreground truncate">{match.team1_player2?.name || 'Speler 2'}</div>
          </div>

          {/* Score Input */}
          <div className="flex flex-col items-center gap-2">
            {!isComplete ? (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => handleScoreChange(team1Score - 1)}
                    disabled={team1Score <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="text-2xl font-bold w-16 text-center tabular-nums">
                    {team1Score} - {team2Score}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => handleScoreChange(team1Score + 1)}
                    disabled={team1Score >= 8}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={handleConfirmScore}
                  className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Bevestig
                </Button>
              </>
            ) : (
              <div className="text-2xl font-bold tabular-nums text-green-700">
                {match.simulated_team1_score} - {match.simulated_team2_score}
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div className="text-left">
            <div className="text-xs font-semibold text-red-600 mb-1">Team 2</div>
            <div className="text-sm font-medium truncate">{match.team2_player1?.name || 'Speler 3'}</div>
            <div className="text-sm text-muted-foreground truncate">{match.team2_player2?.name || 'Speler 4'}</div>
          </div>
        </div>

        {/* Specials */}
        <div className="border-t pt-3">
          <div className="text-xs font-medium text-purple-700 mb-2 flex items-center gap-1">
            <Star className="h-3 w-3" />
            Specials
          </div>
          <div className="grid grid-cols-2 gap-2">
            {players.map(player => {
              const count = getPlayerSpecialCount(player.id);
              return (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                >
                  <span className="truncate flex-1 mr-2">{player.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-600"
                      onClick={() => onRemoveSpecial(match.id, player.id!)}
                      disabled={count === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className={`w-5 text-center font-bold ${count > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {count}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-green-600"
                      onClick={() => onAddSpecial(match.id, player.id!, player.name!)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
