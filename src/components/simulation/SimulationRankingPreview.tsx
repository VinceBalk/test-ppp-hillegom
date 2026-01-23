import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp } from 'lucide-react';

interface PlayerStat {
  playerId: string;
  playerName: string;
  gamesWon: number;
  specials: number;
  groupSide: string;
}

interface FinalRanking {
  playerId: string;
  playerName: string;
  groupSide: string;
  r1r2Games: number;
  r1r2Specials: number;
  r3Games: number;
  r3Specials: number;
  totalGames: number;
  totalSpecials: number;
  r3Group: string;
}

interface SimulationRankingPreviewProps {
  playerStats?: PlayerStat[];
  finalRankings?: {
    left: FinalRanking[];
    right: FinalRanking[];
  };
  title: string;
}

export default function SimulationRankingPreview({ 
  playerStats, 
  finalRankings,
  title 
}: SimulationRankingPreviewProps) {
  
  // Tussenstand na R1+R2
  if (playerStats && !finalRankings) {
    const leftPlayers = playerStats
      .filter(p => p.groupSide === 'left')
      .sort((a, b) => {
        if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
        return b.specials - a.specials;
      });

    const rightPlayers = playerStats
      .filter(p => p.groupSide === 'right')
      .sort((a, b) => {
        if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
        return b.specials - a.specials;
      });

    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Links */}
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Rij Links</h4>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground mb-1">Top 4 → Baan 1 | Bottom 4 → Baan 3</div>
                {leftPlayers.map((player, idx) => (
                  <div 
                    key={player.playerId}
                    className={`flex justify-between items-center p-2 rounded text-sm ${
                      idx < 4 ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    <span>
                      <span className="font-medium">{idx + 1}.</span> {player.playerName}
                    </span>
                    <span className="text-muted-foreground">
                      {player.gamesWon}g / {player.specials}⭐
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rechts */}
            <div>
              <h4 className="font-semibold text-red-700 mb-2">Rij Rechts</h4>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground mb-1">Top 4 → Baan 2 | Bottom 4 → Baan 4</div>
                {rightPlayers.map((player, idx) => (
                  <div 
                    key={player.playerId}
                    className={`flex justify-between items-center p-2 rounded text-sm ${
                      idx < 4 ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    <span>
                      <span className="font-medium">{idx + 1}.</span> {player.playerName}
                    </span>
                    <span className="text-muted-foreground">
                      {player.gamesWon}g / {player.specials}⭐
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Eindrangschikking na R3
  if (finalRankings) {
    return (
      <Card className="border-yellow-300 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Trophy className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Links */}
            <div>
              <h4 className="font-semibold text-green-700 mb-2">🏆 Rij Links</h4>
              <div className="space-y-1">
                {finalRankings.left.map((player, idx) => (
                  <div 
                    key={player.playerId}
                    className={`flex justify-between items-center p-2 rounded text-sm ${
                      idx === 0 ? 'bg-yellow-200 font-bold' :
                      idx < 4 ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    <span>
                      <span className="font-medium">{idx + 1}.</span> {player.playerName}
                      {idx === 0 && ' 🥇'}
                      {idx === 1 && ' 🥈'}
                      {idx === 2 && ' 🥉'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      R3: {player.r3Games}g/{player.r3Specials}⭐ | Tot: {player.totalGames}g
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rechts */}
            <div>
              <h4 className="font-semibold text-red-700 mb-2">🏆 Rij Rechts</h4>
              <div className="space-y-1">
                {finalRankings.right.map((player, idx) => (
                  <div 
                    key={player.playerId}
                    className={`flex justify-between items-center p-2 rounded text-sm ${
                      idx === 0 ? 'bg-yellow-200 font-bold' :
                      idx < 4 ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    <span>
                      <span className="font-medium">{idx + 1}.</span> {player.playerName}
                      {idx === 0 && ' 🥇'}
                      {idx === 1 && ' 🥈'}
                      {idx === 2 && ' 🥉'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      R3: {player.r3Games}g/{player.r3Specials}⭐ | Tot: {player.totalGames}g
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
