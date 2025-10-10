
import { ScheduleMatch } from '@/types/schedule';
import CourtMatchList from './CourtMatchList';

interface CourtsOverviewProps {
  leftGroupMatches: ScheduleMatch[];
  rightGroupMatches: ScheduleMatch[];
}

export default function CourtsOverview({ leftGroupMatches, rightGroupMatches }: CourtsOverviewProps) {
  // Group matches by court for both groups
  const groupMatchesByCourt = (matches: ScheduleMatch[]) => {
    const grouped: { [courtName: string]: ScheduleMatch[] } = {};
    
    matches.forEach(match => {
      const courtKey = match.court_name || 'Onbekende Baan';
      if (!grouped[courtKey]) {
        grouped[courtKey] = [];
      }
      grouped[courtKey].push(match);
    });
    
    return grouped;
  };

  const leftGroupCourts = groupMatchesByCourt(leftGroupMatches);
  const rightGroupCourts = groupMatchesByCourt(rightGroupMatches);

  // Get all unique court names and sort them
  const leftCourtNames = Object.keys(leftGroupCourts).sort();
  const rightCourtNames = Object.keys(rightGroupCourts).sort();

  const hasMatches = leftCourtNames.length > 0 || rightCourtNames.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Schema per Baan</h3>
        <p className="text-gray-600">Wedstrijden gegroepeerd per baan in oplopende volgorde</p>
      </div>

      {!hasMatches ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
          <p className="text-lg text-muted-foreground">Geen banen gevonden</p>
        </div>
      ) : (
        <div className="grid-2">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Linker rijtje</h3>
            {leftCourtNames.length > 0 ? (
              leftCourtNames.map((courtName) => (
                <CourtMatchList
                  key={courtName}
                  courtName={courtName}
                  matches={leftGroupCourts[courtName]}
                  groupColor="bg-green-500"
                />
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Geen wedstrijden</p>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Rechter rijtje</h3>
            {rightCourtNames.length > 0 ? (
              rightCourtNames.map((courtName) => (
                <CourtMatchList
                  key={courtName}
                  courtName={courtName}
                  matches={rightGroupCourts[courtName]}
                  groupColor="bg-purple-500"
                />
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Geen wedstrijden</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
