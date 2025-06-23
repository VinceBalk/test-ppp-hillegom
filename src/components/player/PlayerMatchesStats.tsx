
interface PlayerMatchesStatsProps {
  totalMatches: number;
  filteredMatches: number;
  selectedTournamentId: string;
  selectedRound: string;
}

export default function PlayerMatchesStats({ 
  totalMatches, 
  filteredMatches, 
  selectedTournamentId, 
  selectedRound 
}: PlayerMatchesStatsProps) {
  if (totalMatches === 0) {
    return <p>Geen wedstrijden gevonden.</p>;
  }

  const isFiltered = selectedTournamentId !== 'all' || selectedRound !== 'all';
  
  if (isFiltered) {
    return (
      <p className="text-sm text-muted-foreground">
        {filteredMatches} van {totalMatches} wedstrijden getoond
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {totalMatches} wedstrijd{totalMatches !== 1 ? 'en' : ''} gevonden
    </p>
  );
}
