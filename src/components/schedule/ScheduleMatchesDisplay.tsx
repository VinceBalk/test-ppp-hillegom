
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MatchCard from '@/components/matches/MatchCard';
import { Match } from '@/hooks/useMatches';

interface ScheduleMatchesDisplayProps {
  matches: Match[];
  roundNumber: number;
}

export default function ScheduleMatchesDisplay({ matches, roundNumber }: ScheduleMatchesDisplayProps) {
  // Group matches by court and row_side for display, matching MatchesList component
  const groupMatchesByCourt = (matches: Match[]) => {
    return matches.reduce((groups, match) => {
      const courtKey = match.court?.name || (match.court_number ? `Baan ${match.court_number}` : 'Onbekende baan');
      if (!groups[courtKey]) {
        groups[courtKey] = [];
      }
      groups[courtKey].push(match);
      return groups;
    }, {} as Record<string, Match[]>);
  };

  const matchesByCourt = groupMatchesByCourt(matches);

  // Separate courts based on row_side from the court data
  const leftCourts: Array<{ name: string; matches: Match[]; menuOrder: number; backgroundColor: string }> = [];
  const rightCourts: Array<{ name: string; matches: Match[]; menuOrder: number; backgroundColor: string }> = [];

  Object.entries(matchesByCourt).forEach(([courtName, courtMatches]) => {
    const court = courtMatches[0]?.court;
    const menuOrder = court?.menu_order ?? 999;
    const backgroundColor = court?.background_color || '#ffffff';
    const rowSide = court?.row_side || 'left'; // Default to left if not specified
    
    // Sort matches within each court by match_number first, then creation order
    const sortedMatches = courtMatches.sort((a, b) => {
      // If both have match numbers, sort by match number
      if (a.match_number !== null && b.match_number !== null) {
        return a.match_number - b.match_number;
      }
      
      // If only one has match number, prioritize it
      if (a.match_number !== null && b.match_number === null) return -1;
      if (a.match_number === null && b.match_number !== null) return 1;
      
      // Fallback to creation time
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return 0;
    });
    
    const courtData = {
      name: courtName,
      matches: sortedMatches,
      menuOrder,
      backgroundColor
    };

    // Use the actual row_side from the database
    if (rowSide === 'left') {
      leftCourts.push(courtData);
    } else {
      rightCourts.push(courtData);
    }
  });

  // Sort courts within each column by menu_order (ascending)
  leftCourts.sort((a, b) => a.menuOrder - b.menuOrder);
  rightCourts.sort((a, b) => a.menuOrder - b.menuOrder);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Wedstrijden Overzicht</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          {matches.length} wedstrijd{matches.length !== 1 ? 'en' : ''} in ronde {roundNumber}
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Courts with row_side = 'left' */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary mb-4">Linker Groep</h3>
            </div>
            {leftCourts.map((court) => (
              <div key={court.name} className="space-y-4">
                <div 
                  className="p-3 border rounded text-center"
                  style={{ 
                    backgroundColor: court.backgroundColor,
                    borderColor: court.backgroundColor
                  }}
                >
                  <div className="text-sm font-medium text-black">
                    Baan: {court.name}
                  </div>
                </div>
                <div className="space-y-3">
                  {court.matches.map((match, index) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      matchNumberInCourtRound={index + 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Right Column - Courts with row_side = 'right' */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary mb-4">Rechter Groep</h3>
            </div>
            {rightCourts.map((court) => (
              <div key={court.name} className="space-y-4">
                <div 
                  className="p-3 border rounded text-center"
                  style={{ 
                    backgroundColor: court.backgroundColor,
                    borderColor: court.backgroundColor
                  }}
                >
                  <div className="text-sm font-medium text-black">
                    Baan: {court.name}
                  </div>
                </div>
                <div className="space-y-3">
                  {court.matches.map((match, index) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      matchNumberInCourtRound={index + 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
