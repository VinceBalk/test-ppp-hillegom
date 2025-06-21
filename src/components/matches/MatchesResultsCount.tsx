
import { Tournament } from '@/hooks/useTournaments';

interface MatchesResultsCountProps {
  matchCount: number;
  selectedTournament?: Tournament;
}

export default function MatchesResultsCount({ matchCount, selectedTournament }: MatchesResultsCountProps) {
  if (matchCount === 0) return null;

  return (
    <div className="text-center text-sm text-muted-foreground">
      {matchCount} wedstrijd{matchCount !== 1 ? 'en' : ''} gevonden
      {selectedTournament && ` voor ${selectedTournament.name}`}
    </div>
  );
}
