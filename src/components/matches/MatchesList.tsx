
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Match } from '@/hooks/useMatches';
import MatchCard from './MatchCard';

interface MatchesListProps {
  matches: Match[];
  editMode: boolean;
  selectedTournamentId: string;
}

export default function MatchesList({ matches, editMode, selectedTournamentId }: MatchesListProps) {
  const [selectedRound, setSelectedRound] = useState<string>('1');

  // Filter matches by selected round
  const filteredMatches = matches.filter(match => match.round_number === parseInt(selectedRound));

  // Get unique rounds from all matches
  const availableRounds = [...new Set(matches.map(match => match.round_number))].sort();

  if (!matches || matches.length === 0) {
    return null;
  }

  // Group matches by court
  const matchesByCourt = filteredMatches.reduce((groups, match) => {
    const courtKey = match.court?.name || (match.court_number ? `Baan ${match.court_number}` : 'Onbekende baan');
    if (!groups[courtKey]) {
      groups[courtKey] = [];
    }
    groups[courtKey].push(match);
    return groups;
  }, {} as Record<string, Match[]>);

  // Separate courts based on menu_order: odd = left, even = right
  const leftCourts: Array<{ name: string; matches: Match[]; menuOrder: number; backgroundColor: string }> = [];
  const rightCourts: Array<{ name: string; matches: Match[]; menuOrder: number; backgroundColor: string }> = [];

  Object.entries(matchesByCourt).forEach(([courtName, courtMatches]) => {
    const court = courtMatches[0]?.court;
    const menuOrder = court?.menu_order ?? 999;
    const backgroundColor = court?.background_color || '#ffffff';
    
    const courtData = {
      name: courtName,
      matches: courtMatches,
      menuOrder,
      backgroundColor
    };

    if (menuOrder % 2 === 1) {
      // Odd menu_order goes to left column
      leftCourts.push(courtData);
    } else {
      // Even menu_order goes to right column
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
          <div className="flex items-center gap-2">
            <Label className="text-sm">Ronde:</Label>
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Kies ronde" />
              </SelectTrigger>
              <SelectContent>
                {availableRounds.map(round => (
                  <SelectItem key={round} value={round.toString()}>
                    Ronde {round}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredMatches.length} wedstrijd{filteredMatches.length !== 1 ? 'en' : ''} in ronde {selectedRound}
        </p>
      </CardHeader>
      
      <CardContent>
        {filteredMatches.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Geen wedstrijden gevonden voor ronde {selectedRound}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Odd menu_order courts */}
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
                    <div 
                      className="text-sm font-medium"
                      style={{ 
                        color: court.backgroundColor === '#ffffff' || court.backgroundColor === '#FFFFFF' ? '#000000' : '#ffffff'
                      }}
                    >
                      {court.name} (Volgorde: {court.menuOrder})
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
            
            {/* Right Column - Even menu_order courts */}
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
                    <div 
                      className="text-sm font-medium"
                      style={{ 
                        color: court.backgroundColor === '#ffffff' || court.backgroundColor === '#FFFFFF' ? '#000000' : '#ffffff'
                      }}
                    >
                      {court.name} (Volgorde: {court.menuOrder})
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
        )}
      </CardContent>
    </Card>
  );
}
