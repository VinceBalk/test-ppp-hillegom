
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/hooks/usePlayers';
import { Trophy, Award, Star } from 'lucide-react';
import { usePlayerSpecials } from '@/hooks/usePlayerSpecials';

interface PlayerCardProps {
  player: Player;
}

export default function PlayerCard({ player }: PlayerCardProps) {
  const currentYear = new Date().getFullYear();
  const { data: specialsStats } = usePlayerSpecials(player.id, currentYear);

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
          <CardTitle className="text-xl font-semibold">{player.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {player.ranking_score !== undefined && (
            <div className="text-base text-muted-foreground">
              <span className="font-medium">Rating:</span> {player.ranking_score}
            </div>
          )}
          
          {player.email && (
            <div className="text-base text-muted-foreground">
              <span className="font-medium">Email:</span> {player.email}
            </div>
          )}
          
          {player.phone && (
            <div className="text-base text-muted-foreground">
              <span className="font-medium">Telefoon:</span> {player.phone}
            </div>
          )}

          {/* Specials Stats */}
          {specialsStats && (specialsStats.chef_special_titles > 0 || specialsStats.sous_chef_titles > 0 || specialsStats.total_specials > 0) && (
            <div className="pt-2 space-y-1 border-t">
              <div className="text-xs font-medium text-muted-foreground mb-1">{currentYear} Seizoen:</div>
              {specialsStats.chef_special_titles > 0 && (
                <Badge variant="default" className="mr-1">
                  <Trophy className="h-3 w-3 mr-1" />
                  {specialsStats.chef_special_titles}x Chef Special
                </Badge>
              )}
              {specialsStats.sous_chef_titles > 0 && (
                <Badge variant="secondary" className="mr-1">
                  <Award className="h-3 w-3 mr-1" />
                  {specialsStats.sous_chef_titles}x Sous Chef
                </Badge>
              )}
              {specialsStats.total_specials > 0 && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {specialsStats.total_specials} specials
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            {player.group_side && (
              <Badge variant="outline" className="text-sm">
                {player.group_side === 'left' ? 'Links' : 'Rechts'}
              </Badge>
            )}
            
            {player.position !== undefined && (
              <div className="text-base font-medium text-primary">
                #{player.position}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
