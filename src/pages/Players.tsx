
import { usePlayers, Player } from '@/hooks/usePlayers';
import PlayerCard from '@/components/players/PlayerCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function PlayersPage() {
  const { players, isLoading, error } = usePlayers();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Spelers</h1>
        <p>Bezig met laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Spelers</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fout bij het laden van spelers: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Spelers</h1>
        <p>Er zijn nog geen spelers toegevoegd.</p>
      </div>
    );
  }

  // Groepeer en sorteer spelers
  const leftSidePlayers = players
    .filter((p) => p.group_side === 'left')
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const rightSidePlayers = players
    .filter((p) => p.group_side === 'right')
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold tracking-tight">Spelers</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">Linker rij</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leftSidePlayers.map((player: Player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Rechter rij</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rightSidePlayers.map((player: Player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </section>
    </div>
  );
}
