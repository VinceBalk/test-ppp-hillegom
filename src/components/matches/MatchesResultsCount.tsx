
import { Badge } from '@/components/ui/badge';

interface Tournament {
  id: string;
  name: string;
  status?: string;
  start_date: string;
  end_date: string;
}

interface MatchesResultsCountProps {
  matchCount: number;
  selectedTournament?: Tournament;
  selectedRound?: string;
  totalMatches?: number;
}

export default function MatchesResultsCount({ 
  matchCount, 
  selectedTournament,
  selectedRound = 'all',
  totalMatches = 0
}: MatchesResultsCountProps) {
  if (!selectedTournament || matchCount === 0) {
    return null;
  }

  const getRoundText = () => {
    if (selectedRound === 'all') {
      return 'alle rondes';
    }
    return `ronde ${selectedRound}`;
  };

  const getCountText = () => {
    if (selectedRound === 'all') {
      return `${matchCount} wedstrijd${matchCount !== 1 ? 'en' : ''}`;
    }
    return `${matchCount} van ${totalMatches} wedstrijd${matchCount !== 1 ? 'en' : ''}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <span>
        {getCountText()} gevonden voor <strong>{selectedTournament.name}</strong> ({getRoundText()})
      </span>
      {selectedTournament.status && (
        <Badge variant="outline" className="text-xs">
          {selectedTournament.status}
        </Badge>
      )}
    </div>
  );
}
