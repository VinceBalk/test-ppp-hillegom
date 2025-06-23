
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Match } from '@/hooks/useMatches';
import { useCourts } from '@/hooks/useCourts';
import MatchCard from './MatchCard';

interface MatchesListProps {
  matches: Match[];
  editMode: boolean;
  selectedTournamentId: string;
}

export default function MatchesList({ matches, editMode, selectedTournamentId }: MatchesListProps) {
  const [selectedRound, setSelectedRound] = useState<string>('1');
  const { courts } = useCourts();

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

  // Sort courts by the order they appear in the courts management system
  // Active courts first, then by name if court is not found in management system
  const sortedCourtNames = Object.keys(matchesByCourt).sort((a, b) => {
    const courtA = courts.find(court => court.name === a);
    const courtB = courts.find(court => court.name === b);
    
    // If both courts exist in management system, sort by their order (by name alphabetically for now)
    if (courtA && courtB) {
      return courtA.name.localeCompare(courtB.name);
    }
    
    // If only one exists, prioritize the managed court
    if (courtA && !courtB) return -1;
    if (!courtA && courtB) return 1;
    
    // If neither exists in management, sort alphabetically
    return a.localeCompare(b);
  });

  // Split courts into left and right columns
  const leftCourts = [];
  const rightCourts = [];
  
  sortedCourtNames.forEach((courtName, index) => {
    if (index % 2 === 0) {
      leftCourts.push(courtName);
    } else {
      rightCourts.push(courtName);
    }
  });

  // Get court styling from courts management
  const getCourtStyling = (courtName: string) => {
    const court = courts.find(c => c.name === courtName);
    return {
      backgroundColor: court?.background_color || '#e3f2fd',
      borderColor: court?.background_color || '#2196f3',
      logoUrl: court?.logo_url
    };
  };

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
            {/* Left Column */}
            <div className="space-y-6">
              {leftCourts.map((courtName) => {
                const styling = getCourtStyling(courtName);
                return (
                  <div key={courtName} className="space-y-4">
                    <div 
                      className="p-3 border rounded text-center"
                      style={{ 
                        backgroundColor: styling.backgroundColor,
                        borderColor: styling.borderColor 
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {styling.logoUrl && (
                          <img 
                            src={styling.logoUrl} 
                            alt={`${courtName} logo`}
                            className="w-6 h-6 object-contain"
                          />
                        )}
                        <div className="text-sm font-medium" style={{ color: styling.borderColor }}>
                          {courtName}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {matchesByCourt[courtName].map((match, index) => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          matchNumberInCourtRound={index + 1}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {rightCourts.map((courtName) => {
                const styling = getCourtStyling(courtName);
                return (
                  <div key={courtName} className="space-y-4">
                    <div 
                      className="p-3 border rounded text-center"
                      style={{ 
                        backgroundColor: styling.backgroundColor,
                        borderColor: styling.borderColor 
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {styling.logoUrl && (
                          <img 
                            src={styling.logoUrl} 
                            alt={`${courtName} logo`}
                            className="w-6 h-6 object-contain"
                          />
                        )}
                        <div className="text-sm font-medium" style={{ color: styling.borderColor }}>
                          {courtName}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {matchesByCourt[courtName].map((match, index) => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          matchNumberInCourtRound={index + 1}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
