
import MatchesCourtGroup from './MatchesCourtGroup';
import { Match } from '@/hooks/useMatches';
import { groupByCourt, splitCourtsByPosition } from '@/utils/matchUtils';

interface MatchesListProps {
  matches: Match[];
  editMode: boolean;
  selectedTournamentId?: string;
}

export default function MatchesList({ matches, editMode, selectedTournamentId }: MatchesListProps) {
  // First group all matches by court
  const courtGroups = groupByCourt(matches);
  
  // Then split the courts (not individual matches) between left and right
  const { leftCourts, rightCourts } = splitCourtsByPosition(courtGroups);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Linker rijtje */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-primary">Linker rijtje</h2>
        {leftCourts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
            <p>Geen wedstrijden in het linker rijtje</p>
          </div>
        ) : (
          leftCourts.map(({ courtName, matches }) => (
            <MatchesCourtGroup
              key={courtName}
              courtName={courtName}
              matches={matches}
              editMode={editMode}
              selectedTournamentId={selectedTournamentId}
            />
          ))
        )}
      </div>

      {/* Rechter rijtje */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-primary">Rechter rijtje</h2>
        {rightCourts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
            <p>Geen wedstrijden in het rechter rijtje</p>
          </div>
        ) : (
          rightCourts.map(({ courtName, matches }) => (
            <MatchesCourtGroup
              key={courtName}
              courtName={courtName}
              matches={matches}
              editMode={editMode}
              selectedTournamentId={selectedTournamentId}
            />
          ))
        )}
      </div>
    </div>
  );
}
