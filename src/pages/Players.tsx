import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayers, Player } from '@/hooks/usePlayers';
import { usePlayerRankings } from '@/hooks/usePlayerRankings';
import { PlayerForm } from '@/components/PlayerForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Users, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlayersPage() {
  const navigate = useNavigate();
  const { players, isLoading: playersLoading, error, createPlayer, updatePlayer } = usePlayers();
  const { data: rankings, isLoading: rankingsLoading } = usePlayerRankings();
  const { hasRole, isSuperAdmin, user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Nieuwe speler aanmaken: alleen organisator/superadmin
  const canCreate = hasRole('organisator') || isSuperAdmin();
  const isLoading = playersLoading || rankingsLoading;

  // Per speler: mag ik dit pennetje zien?
  const canEditPlayer = (player: Player) => {
    if (isSuperAdmin()) return true;
    if (user?.id && player.user_id && user.id === player.user_id) return true;
    return false;
  };

  const handleCreatePlayer = async (playerData: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    createPlayer(playerData);
    setDialogOpen(false);
  };

  const handleUpdatePlayer = async (playerData: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (editingPlayer) {
      updatePlayer({ ...playerData, id: editingPlayer.id });
      setEditingPlayer(null);
      setDialogOpen(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, player: Player) => {
    e.stopPropagation();
    setEditingPlayer(player);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingPlayer(null);
    }
  };

  // Combine players with their rankings
  const playersWithRankings = players.map(player => {
    const ranking = rankings?.find(r => r.player_id === player.id);
    const globalPosition = rankings?.findIndex(r => r.player_id === player.id);
    return {
      ...player,
      ranking,
      globalPosition: globalPosition !== undefined && globalPosition >= 0 ? globalPosition + 1 : null
    };
  }).sort((a, b) => {
    if (a.globalPosition === null) return 1;
    if (b.globalPosition === null) return -1;
    return a.globalPosition - b.globalPosition;
  });

  // Toon pennetje-kolom als er minimaal één speler bewerkbaar is
  const showEditColumn = players.some(p => canEditPlayer(p));

  if (error) {
    return (
      <div className="space-y-6 p-4 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Spelers
        </h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fout bij het laden van spelers: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Spelers
          </h1>
          <p className="text-muted-foreground">Beheer en bekijk alle spelers</p>
        </div>

        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Speler toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingPlayer ? 'Speler bewerken' : 'Nieuwe speler toevoegen'}
                </DialogTitle>
              </DialogHeader>
              <PlayerForm
                player={editingPlayer || undefined}
                onSubmit={editingPlayer ? handleUpdatePlayer : handleCreatePlayer}
                onCancel={() => handleDialogClose(false)}
                isSuperAdmin={isSuperAdmin()}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Edit dialog voor niet-admins (eigen speler via pennetje) */}
        {!canCreate && (
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Speler bewerken</DialogTitle>
              </DialogHeader>
              <PlayerForm
                player={editingPlayer || undefined}
                onSubmit={handleUpdatePlayer}
                onCancel={() => handleDialogClose(false)}
                isSuperAdmin={isSuperAdmin()}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Alle Spelers
            <span className="text-sm font-normal text-muted-foreground">
              ({playersWithRankings.length} spelers)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : playersWithRankings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Geen spelers gevonden.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Naam</TableHead>
                    <TableHead>Rij</TableHead>
                    <TableHead className="text-center">Toernooien</TableHead>
                    <TableHead className="text-center">Positie</TableHead>
                    {showEditColumn && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playersWithRankings.map((player) => (
                    <TableRow
                      key={player.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/players/${player.id}`)}
                    >
                      <TableCell className="font-semibold text-muted-foreground">
                        {player.globalPosition || '-'}
                      </TableCell>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>
                        {player.group_side === 'left' ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Links
                          </Badge>
                        ) : player.group_side === 'right' ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            Rechts
                          </Badge>
                        ) : (
                          <Badge variant="secondary">-</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {player.ranking?.tournaments_played || 0}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        #{player.globalPosition || '-'}
                      </TableCell>
                      {showEditColumn && (
                        <TableCell>
                          {canEditPlayer(player) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleEditClick(e, player)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
