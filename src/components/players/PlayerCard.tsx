
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Player } from '@/hooks/usePlayers';
import { Trophy, Award, Star, Pencil } from 'lucide-react';
import { usePlayerSpecials } from '@/hooks/usePlayerSpecials';

interface PlayerCardProps {
  player: Player;
  canEdit?: boolean;
  onEdit?: (player: Player) => void;
}

export default function PlayerCard({ player, canEdit, onEdit }: PlayerCardProps) {
  const currentYear = new Date().getFullYear();
  const { data: specialsStats } = usePlayerSpecials(player.id, currentYear);

  const getCardClassName = () => {
    if (!specialsStats) return "h-full hover:shadow-md transition-shadow relative";
    
    if (specialsStats.year_rank === 1) {
      return "h-full hover:shadow-xl transition-all relative bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 shadow-lg";
    }
    
    if (specialsStats.year_rank === 2) {
      return "h-full hover:shadow-xl transition-all relative bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-2 border-amber-500/30 shadow-md";
    }
    
    return "h-full hover:shadow-md transition-shadow relative";
  };

  return (
    <Card className={getCardClassName()}>
      {canEdit && onEdit && (
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 p-0"
          onClick={(e) => {
            e.preventDefault();
            onEdit(player);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      <Link to={`/players/${player.id}`} className="block">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start pr-10">
            <CardTitle className="text-xl font-semibold">{player.name}</CardTitle>
            <div className="text-xl font-bold text-primary">
              {player.ranking_score || 0}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 2025 Seizoen sectie */}
          {specialsStats && specialsStats.total_specials > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {currentYear} Seizoen:
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-orange-600" />
                  <span className="font-semibold">{specialsStats.total_specials} specials</span>
                </div>
                {specialsStats.year_rank === 1 && (
                  <Badge variant="default" className="ml-2">
                    <Trophy className="h-3 w-3 mr-1" />
                    Chef Special
                  </Badge>
                )}
                {specialsStats.year_rank === 2 && (
                  <Badge variant="secondary" className="ml-2">
                    <Award className="h-3 w-3 mr-1" />
                    Sous Chef
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Footer met alleen rijtje */}
          <div className="pt-2 border-t">
            <Badge variant="outline">
              {player.row_side === 'left' ? 'Links' : 'Rechts'}
            </Badge>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
