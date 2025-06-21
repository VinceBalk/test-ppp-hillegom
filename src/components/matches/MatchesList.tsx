
import MatchCard from './MatchCard';
import SavedMatchEditor from './SavedMatchEditor';
import { Match } from '@/hooks/useMatches';

interface MatchesListProps {
  matches: Match[];
  editMode: boolean;
  selectedTournamentId?: string;
}

export default function MatchesList({ matches, editMode, selectedTournamentId }: MatchesListProps) {
  return (
    <div className="grid gap-4">
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
  );
}
