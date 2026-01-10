import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  Award,
} from 'lucide-react';
import { usePlayers } from '@/hooks/usePlayers';
import { usePlayerRankings } from '@/hooks/usePlayerRankings';
import PlayerMatches from '@/components/player/PlayerMatches';

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { players, isLoading } = usePlayers();
  const { data: rankings } = usePlayerRankings();

  const player = players.find((p) => p.id === id);
  const playerRanking = rankings?.find((r) => r.player_id === id);
  const globalPosition = rankings?.findIndex((r) => r.player_id === id);

  const getRowSideBadge = (side?: string) => {
    const variants = {
      left: 'default',
      right: 'secondary',
    } as const;

    const labels = {
      left: 'Links',
      right: 'Rechts',
    };

    return (
      <Badge variant={variants[side as keyof typeof variants] || 'default'}>
        {labels[side as keyof typeof labels] || side}
      </Badge>
    );
  };

  const getRankChangeIcon = (change?: number) => {
    if (!change || change === 0)
      return <Minus className="icon-s text-muted-foreground" />;
    if (change > 0)
      return <TrendingUp className="icon-s text-green-500" />;
    return <TrendingDown className="icon-s text-red-500" />;
  };

  const formatSpecials = (specials?: any) => {
    if (!specials || typeof specials !== 'object') return [];
    const specialsObj =
      typeof specials === 'string' ? JSON.parse(specials) : specials;
    return Object.keys(specialsObj).filter((key) => specialsObj[key]);
  };

  if (isLoading) {
    return (
      <div className="section stack-l">
        <div className="stack-s">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="icon-s mr-2" />
            Terug
          </Button>
          <h1 className="h1">Speler Details</h1>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="section stack-l">
        <div className="stack-s">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="icon-s mr-2" />
            Terug
          </Button>
          <h1 className="h1">Speler niet gevonden</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-m text-muted-foreground">
              De opgevraagde speler kon niet worden gevonden.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="section stack-l">
      <div className="stack-s">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="icon-s mr-2" />
          Terug
        </Button>
        <div>
          <h1 className="h1">{player.name}</h1>
          <p className="text-m text-muted-foreground">Speler Details</p>
        </div>
      </div>

      <div className="grid-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="icon-s" />
              Algemene Informatie
            </CardTitle>
          </CardHeader>
          <CardContent className="stack-s">
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>
              <span>{player.email || 'Niet opgegeven'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Telefoon:</span>
              <span>{player.phone || 'Niet opgegeven'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Rij:</span>
              {getRowSideBadge(player.row_side)}
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Positie:</span>
              <span>#{player.position || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="icon-s" />
              Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="stack-s">
            <div className="flex justify-between">
              <span className="font-medium">Globale Positie:</span>
              <span className="text-l font-bold">
                #{globalPosition !== undefined ? globalPosition + 1 : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Toernooien Gespeeld:</span>
              <span>{playerRanking?.tournaments_played || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Totaal Punten:</span>
              <span>{playerRanking?.total_points || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Gem. Positie:</span>
              <span className="font-semibold">{playerRanking?.avg_position || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Trend:</span>
              <div className="flex items-center gap-2">
                {getRankChangeIcon(player.rank_change)}
                <span>{Math.abs(player.rank_change || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="icon-s" />
            Prestaties
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Ranking Score</span>
            <p className="text-2xl font-bold">{player.ranking_score || 0}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Totaal Gewonnen</span>
            <p className="text-2xl font-bold text-green-600">{player.total_games_won || 0}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Totaal Specials</span>
            <p className="text-2xl font-bold text-orange-600">{playerRanking?.total_specials || 0}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Gem. per Toernooi</span>
            <p className="text-2xl font-bold">{player.avg_games_per_tournament?.toFixed(1) || '0.0'}</p>
          </div>
        </CardContent>
      </Card>

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

      <PlayerMatches playerId={player.id} playerName={player.name} />
    </div>
  );
}
