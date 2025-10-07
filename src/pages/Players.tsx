import { useState } from 'react';
import { usePlayers, Player } from '@/hooks/usePlayers';
import PlayerCard from '@/components/players/PlayerCard';
import { PlayerForm } from '@/components/PlayerForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Plus } from 'lucide-react';

export default function PlayersPage() {
  const { players, isLoading, error, createPlayer } = usePlayers();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreatePlayer = async (playerData: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    createPlayer(playerData);
    setDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="section">
        <h1 className="h1">Spelers</h1>
        <p className="text-m">Bezig met laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <h1 className="h1">Spelers</h1>
        <Alert variant="destructive">
          <AlertCircle className="icon-s" />
          <AlertDescription>
            Fout bij het laden van spelers: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const leftSidePlayers = players
    .filter((p) => p.group_side === 'left')
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const rightSidePlayers = players
    .filter((p) => p.group_side === 'right')
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const hasNoPlayers = !players || players.length === 0;

  return (
    <div className="section stack-l">
      <div className="flex items-center justify-between">
        <h1 className="h1">Spelers</h1>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Speler toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nieuwe speler toevoegen</DialogTitle>
            </DialogHeader>
            <PlayerForm onSubmit={handleCreatePlayer} />
          </DialogContent>
        </Dialog>
      </div>

      {hasNoPlayers ? (
        <p className="text-m text-muted-foreground">Er zijn nog geen spelers toegevoegd.</p>
      ) : (
        <div className="grid-2">
          <section className="stack-m">
            <h2 className="h2">Linker rij</h2>
            {leftSidePlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen spelers in linker rij</p>
            ) : (
              <ul className="stack-s">
                {leftSidePlayers.map((player: Player) => (
                  <li key={player.id}>
                    <PlayerCard player={player} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="stack-m">
            <h2 className="h2">Rechter rij</h2>
            {rightSidePlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen spelers in rechter rij</p>
            ) : (
              <ul className="stack-s">
                {rightSidePlayers.map((player: Player) => (
                  <li key={player.id}>
                    <PlayerCard player={player} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
