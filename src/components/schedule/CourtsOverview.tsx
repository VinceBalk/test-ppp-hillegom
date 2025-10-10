
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

  // Get all unique court names from both groups
  const allCourtNames = Array.from(new Set([
    ...Object.keys(leftGroupCourts),
    ...Object.keys(rightGroupCourts)
  ])).sort();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Schema per Baan</h3>
        <p className="text-gray-600">Wedstrijden gegroepeerd per baan in oplopende volgorde</p>
      </div>

      {allCourtNames.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
          <p className="text-lg text-muted-foreground">Geen banen gevonden</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {allCourtNames.map((courtName) => {
            const leftMatches = leftGroupCourts[courtName] || [];
            const rightMatches = rightGroupCourts[courtName] || [];
            const totalMatches = leftMatches.length + rightMatches.length;

            if (totalMatches === 0) return null;

            return (
              <div key={courtName} className="space-y-4">
                {leftMatches.length > 0 && (
                  <CourtMatchList
                    courtName={`${courtName} - Linker rijtje`}
                    matches={leftMatches}
                    groupColor="bg-green-500"
                  />
                )}
                {rightMatches.length > 0 && (
                  <CourtMatchList
                    courtName={`${courtName} - Rechter rijtje`}
                    matches={rightMatches}
                    groupColor="bg-purple-500"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
