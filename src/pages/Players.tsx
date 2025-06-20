
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePlayers, Player } from '@/hooks/usePlayers';
import { PlayerForm } from '@/components/PlayerForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Players() {
  const { players, isLoading, createPlayer, updatePlayer, deletePlayer, isCreating, isUpdating, isDeleting } = usePlayers();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePlayer = (playerData: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    createPlayer(playerData);
    setShowForm(false);
  };

  const handleUpdatePlayer = (playerData: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (editingPlayer) {
      updatePlayer({ id: editingPlayer.id, ...playerData });
      setEditingPlayer(null);
    }
  };

  const handleDeletePlayer = (id: string) => {
    deletePlayer(id);
  };

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
    if (!change || change === 0) return <Minus className="h-3 w-3 text-gray-400" />;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  const formatSpecials = (specials?: any) => {
    if (!specials || typeof specials !== 'object') return '-';
    const specialsObj = typeof specials === 'string' ? JSON.parse(specials) : specials;
    const specialsArray = Object.keys(specialsObj).filter(key => specialsObj[key]);
    return specialsArray.length > 0 ? specialsArray.join(', ') : '-';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spelers</h1>
          <p className="text-muted-foreground">Beheer alle geregistreerde spelers</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spelers</h1>
          <p className="text-muted-foreground">
            Beheer alle geregistreerde spelers ({players.length} spelers)
          </p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Speler
            </Button>
          </DialogTrigger>
          <DialogContent>
            <PlayerForm
              onSubmit={handleCreatePlayer}
              onCancel={() => setShowForm(false)}
              isSubmitting={isCreating}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spelers Overzicht</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek spelers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefoon</TableHead>
                <TableHead>Rij</TableHead>
                <TableHead>Positie</TableHead>
                <TableHead>Ranking</TableHead>
                <TableHead>Toernooien</TableHead>
                <TableHead>Gem. Winst</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Specials</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Geen spelers gevonden die voldoen aan de zoekterm.' : 'Nog geen spelers toegevoegd.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>{player.email || '-'}</TableCell>
                    <TableCell>{player.phone || '-'}</TableCell>
                    <TableCell>{getRowSideBadge(player.group_side)}</TableCell>
                    <TableCell>{player.position || 0}</TableCell>
                    <TableCell>{player.ranking_score || 0}</TableCell>
                    <TableCell>{player.total_tournaments || 0}</TableCell>
                    <TableCell>{player.avg_games_per_tournament?.toFixed(1) || '0.0'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getRankChangeIcon(player.rank_change)}
                        <span className="text-xs">{Math.abs(player.rank_change || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{formatSpecials(player.specials)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog open={editingPlayer?.id === player.id} onOpenChange={(open) => !open && setEditingPlayer(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingPlayer(player)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <PlayerForm
                              player={editingPlayer || undefined}
                              onSubmit={handleUpdatePlayer}
                              onCancel={() => setEditingPlayer(null)}
                              isSubmitting={isUpdating}
                            />
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isDeleting}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Speler verwijderen</AlertDialogTitle>
                              <AlertDialogDescription>
                                Weet je zeker dat je {player.name} wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuleren</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePlayer(player.id)}>
                                Verwijderen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
