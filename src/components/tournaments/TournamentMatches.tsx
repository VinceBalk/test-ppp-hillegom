
import { useMatches } from '@/hooks/useMatches';
import MatchesSection from './MatchesSection';

interface TournamentMatchesProps {
  tournamentId: string;
  tournamentName: string;
  maxMatches?: number;
}

export default function TournamentMatches({ tournamentId, tournamentName, maxMatches = 5 }: TournamentMatchesProps) {
  const { matches, isLoading, error } = useMatches(tournamentId);

  return (
    <MatchesSection
      matches={matches}
      tournamentName={tournamentName}
      tournamentId={tournamentId}
      maxMatches={maxMatches}
      isLoading={isLoading}
      error={error}
    />
  );
}
