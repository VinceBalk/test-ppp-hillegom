
import MatchCard from './MatchCard';
import SavedMatchEditor from './SavedMatchEditor';
import { Match } from '@/hooks/useMatches';

interface MatchesCourtGroupProps {
  courtName: string;
  matches: Match[];
  editMode: boolean;
  selectedTournamentId?: string;
}

export default function MatchesCourtGroup({ 
  courtName, 
  matches, 
  editMode, 
  selectedTournamentId 
}: MatchesCourtGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-muted-foreground border-b pb-1">
        {courtName}
      </h3>
      <div className="flex flex-col gap-3">
        {matches.map((match) => (
          editMode ? (
            <SavedMatchEditor 
              key={match.id} 
              match={match} 
              tournamentId={selectedTournamentId || match.tournament_id} 
            />
          ) : (
            <MatchCard key={match.id} match={match} />
          )
        ))}
      </div>
    </div>
  );
}
