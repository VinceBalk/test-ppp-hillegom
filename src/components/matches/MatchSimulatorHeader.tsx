
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { getShortTeamName } from '@/utils/matchUtils';
import { Match } from '@/hooks/useMatches';

interface MatchSimulatorHeaderProps {
  match: Match;
  onClose: () => void;
}

export default function MatchSimulatorHeader({ match, onClose }: MatchSimulatorHeaderProps) {
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
  );
}
