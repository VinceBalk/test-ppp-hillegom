
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Trophy, Target, Calendar } from 'lucide-react';
import { usePlayers } from '@/hooks/usePlayers';

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { players, isLoading } = usePlayers();

  const player = players.find(p => p.id === id);

  const getRowSideBadge = (side?: string) => {
    const variants = {
      left: 'default',
      right: 'secondary'
    } as const;
    
    const labels = {
      left: 'Links',
      right: 'Rechts'
    };

    return (
      <Badge variant={variants[side as keyof typeof variants] || 'default'}>
        {labels[side as keyof typeof labels] || side}
      </Badge>
    );
  };

  const getRankChangeIcon = (change?: number) => {
    if (!change || change === 0) return <Minus className="h-4 w-4 text-gray-400" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const formatSpecials = (specials?: any) => {
    if (!specials || typeof specials !== 'object') return [];
    const specialsObj = typeof specials === 'string' ? JSON.parse(specials) : specials;
    return Object.keys(specialsObj).filter(key => specialsObj[key]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Speler Details</h1>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Speler niet gevonden</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">De opgevraagde speler kon niet worden gevonden.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
          <p className="text-muted-foreground">Speler Details</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Algemene Informatie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Email:</span>
              <span>{player.email || 'Niet opgegeven'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Telefoon:</span>
              <span>{player.phone || 'Niet opgegeven'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Rij:</span>
              {getRowSideBadge(player.row_side)}
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Positie:</span>
              <span>#{player.position || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Prestaties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Ranking Score:</span>
              <span className="text-lg font-bold">{player.ranking_score || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Totaal Toernooien:</span>
              <span>{player.total_tournaments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Totaal Gewonnen:</span>
              <span>{player.total_games_won || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Gem. per Toernooi:</span>
              <span>{player.avg_games_per_tournament?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Trend:</span>
              <div className="flex items-center space-x-2">
                {getRankChangeIcon(player.rank_change)}
                <span>{Math.abs(player.rank_change || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {formatSpecials(player.specials).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Specials</CardTitle>
            <CardDescription>Behaalde speciale prestaties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {formatSpecials(player.specials).map((special, index) => (
                <Badge key={index} variant="outline">
                  {special}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
