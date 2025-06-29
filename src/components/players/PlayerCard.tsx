
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/hooks/usePlayers';

interface PlayerCardProps {
  player: Player;
}

export default function PlayerCard({ player }: PlayerCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'actief':
        return 'bg-green-100 text-green-800';
      case 'inactief':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link to={`/players/${player.id}`} className="block transition-transform hover:scale-105">
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{player.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {player.ranking_score !== undefined && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Rating:</span> {player.ranking_score}
            </div>
          )}
          
          {player.email && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Email:</span> {player.email}
            </div>
          )}
          
          {player.phone && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Telefoon:</span> {player.phone}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            {player.group_side && (
              <Badge variant="outline" className="text-xs">
                {player.group_side === 'left' ? 'Links' : 'Rechts'}
              </Badge>
            )}
            
            {player.position !== undefined && (
              <div className="text-sm font-medium text-primary">
                #{player.position}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
