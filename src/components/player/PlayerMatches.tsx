
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayerMatchesLogic } from '@/hooks/usePlayerMatchesLogic';
import PlayerMatchesFilters from './PlayerMatchesFilters';
import PlayerMatchesList from './PlayerMatchesList';
import PlayerMatchesStats from './PlayerMatchesStats';

interface PlayerMatchesProps {
  playerId: string;
  playerName: string;
}

export default function PlayerMatches({ playerId, playerName }: PlayerMatchesProps) {
  const {
    matches,
    isLoading,
    error,
    selectedTournamentId,
    selectedRound,
    setSelectedTournamentId,
    setSelectedRound,
    allAvailableRounds,
    filteredMatches,
    playerTournaments,
  } = usePlayerMatchesLogic(playerId);

  if (isLoading) return <p>Bezig met laden...</p>;
  if (error) return <p>Fout bij laden van wedstrijden.</p>;
  if (!matches || matches.length === 0) return <p>Geen wedstrijden gevonden.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wedstrijden van {playerName}</CardTitle>
        
        <PlayerMatchesFilters
          selectedTournamentId={selectedTournamentId}
          selectedRound={selectedRound}
          onTournamentChange={setSelectedTournamentId}
          onRoundChange={setSelectedRound}
          playerTournaments={playerTournaments}
          allAvailableRounds={allAvailableRounds}
        />

        <PlayerMatchesStats
          totalMatches={matches.length}
          filteredMatches={filteredMatches.length}
          selectedTournamentId={selectedTournamentId}
          selectedRound={selectedRound}
        />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <PlayerMatchesList matches={filteredMatches} playerId={playerId} />
      </CardContent>
    </Card>
  );
}
