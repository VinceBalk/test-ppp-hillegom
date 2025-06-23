
import MatchCard from './MatchCard';
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
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-primary">
        {courtName}
      </h3>
      <div className="space-y-4">
        {matches.map((match, index) => (
          <MatchCard 
            key={match.id} 
            match={match} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
