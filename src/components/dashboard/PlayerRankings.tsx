
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PlayerWithTrend {
  id: string;
  name: string;
  ranking_score: number;
  position: number;
  trend: 'up' | 'down' | 'same';
}

interface PlayerRankingsProps {
  title: string;
  description: string;
  players: PlayerWithTrend[];
  onPlayerClick: (playerId: string) => void;
}

export function PlayerRankings({ title, description, players, onPlayerClick }: PlayerRankingsProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    const size = "h-3 w-3";
    switch (trend) {
      case 'up': return <TrendingUp className={`${size} text-green-500`} />;
      case 'down': return <TrendingDown className={`${size} text-red-500`} />;
      default: return <Minus className={`${size} text-muted-foreground`} />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {players.length > 0 ? (
          players.map((p, index) => (
            <div 
              key={p.id} 
              className={`flex justify-between items-center cursor-pointer p-2 rounded transition-colors hover:bg-orange-500 hover:text-black ${
                index % 2 === 0 ? 'bg-muted/30' : 'bg-transparent'
              }`}
              onClick={() => onPlayerClick(p.id)}
            >
              <span className="font-medium">#{p.position} {p.name}</span>
              <span className="flex items-center space-x-2">
                <span className="text-sm font-mono">{p.ranking_score || 0}</span>
                {getTrendIcon(p.trend)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">Geen spelers gevonden</p>
        )}
      </CardContent>
    </Card>
  );
}
