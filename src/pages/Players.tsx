import { usePlayers, Player } from '@/hooks/usePlayers';
import PlayerCard from '@/components/players/PlayerCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function PlayersPage() {
  const { players, isLoading, error } = usePlayers();

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

  if (!players || players.length === 0) {
    return (
      <div className="section">
        <h1 className="h1">Spelers</h1>
        <p className="text-m">Er zijn nog geen spelers toegevoegd.</p>
      </div>
    );
  }

  const leftSidePlayers = players
    .filter((p) => p.group_side === 'left')
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const rightSidePlayers = players
    .filter((p) => p.group_side === 'right')
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div className="section stack-l">
      <h1 className="h1">Spelers</h1>

      <div className="grid-2">
        <section className="stack-m">
          <h2 className="h2">Linker rij</h2>
          <ul className="stack-s">
            {leftSidePlayers.map((player: Player) => (
              <li key={player.id}>
                <PlayerCard player={player} />
              </li>
            ))}
          </ul>
        </section>

        <section className="stack-m">
          <h2 className="h2">Rechter rij</h2>
          <ul className="stack-s">
            {rightSidePlayers.map((player: Player) => (
              <li key={player.id}>
                <PlayerCard player={player} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
