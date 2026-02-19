import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  Award,
  Pencil,
} from 'lucide-react';
import { usePlayers } from '@/hooks/usePlayers';
import { usePlayerRankings } from '@/hooks/usePlayerRankings';
import { useAuth } from '@/contexts/AuthContext';
import { PlayerForm } from '@/components/PlayerForm';
import PlayerMatches from '@/components/player/PlayerMatches';

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { players, isLoading, updatePlayer } = usePlayers();
  const { data: rankings } = usePlayerRankings();
  const { user, isSuperAdmin } = useAuth();

  const [editOpen, setEditOpen] = useState(false);

  const player = players.find((p) => p.id === id);
  const playerRanking = rankings?.find((r) => r.player_id === id);
  const globalPosition = rankings?.findIndex((r) => r.player_id === id);

  // Bewerkrecht: superadmin OF eigen spelerrecord
  const isOwnPlayer = user?.id && player?.user_id && user.id === player.user_id;
  const canEdit = isSuperAdmin() || isOwnPlayer;

  const handleUpdate = (playerData: any) => {
    if (player) {
      updatePlayer({ ...playerData, id: player.id });
      setEditOpen(false);
    }
  };

  const getRowSideBadge = (side?: string) => {
    const variants = { left: 'default', right: 'secondary' } as const;
    const labels = { left: 'Links', right: 'Rechts' };
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
      {/* Header met terugknop en optionele bewerkknop */}
      <div className="flex items-start justify-between">
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

        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="mt-1"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Bewerken
          </Button>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Speler bewerken</DialogTitle>
          </DialogHeader>
          <PlayerForm
            player={player}
            onSubmit={handleUpdate}
            onCancel={() => setEditOpen(false)}
            isSuperAdmin={isSuperAdmin()}
          />
        </DialogContent>
      </Dialog>

      <div className="grid-2">
        {/* Algemene informatie — email/telefoon alleen voor canEdit of eigen profiel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="icon-s" />
              Algemene Informatie
            </CardTitle>
          </CardHeader>
          <CardContent className="stack-s">
            {canEdit && (
              <>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{player.email || 'Niet opgegeven'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Telefoon:</span>
                  <span>{player.phone || 'Niet opgegeven'}</span>
                </div>
              </>
            )}
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

        {/* Ranking */}
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
              <span className="font-medium">Gem. Games/Toernooi:</span>
              <span>
                {player.avg_games_per_tournament
                  ? Number(player.avg_games_per_tournament).toFixed(1)
                  : '0.0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Ranking Trend:</span>
              <div className="flex items-center gap-1">
                {getRankChangeIcon(player.rank_change)}
                <span>{player.rank_change || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistieken */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="icon-s" />
              Statistieken
            </CardTitle>
          </CardHeader>
          <CardContent className="stack-s">
            <div className="flex justify-between">
              <span className="font-medium">Totaal Games Gewonnen:</span>
              <span>{player.total_games_won || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Totaal Specials:</span>
              <span>{player.total_specials || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Toernooien:</span>
              <span>{player.total_tournaments || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Specials */}
        {formatSpecials(player.specials).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="icon-s" />
                Behaalde Specials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {formatSpecials(player.specials).map((special) => (
                  <Badge key={special} variant="secondary">
                    {special}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Wedstrijden */}
      <PlayerMatches playerId={id || ''} />
    </div>
  );
}
