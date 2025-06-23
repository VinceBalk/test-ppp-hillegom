
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

  // Group courts by left/right based on menu_order
  const leftCourts: string[] = [];
  const rightCourts: string[] = [];

  // Get all court names and sort them by menu_order
  const courtNames = Object.keys(matchesByCourt);
  
  // Sort courts by menu_order
  const sortedCourtNames = courtNames.sort((a, b) => {
    const courtA = filteredMatches.find(m => (m.court?.name || `Baan ${m.court_number}`) === a)?.court;
    const courtB = filteredMatches.find(m => (m.court?.name || `Baan ${m.court_number}`) === b)?.court;
    
    const orderA = courtA?.menu_order ?? 999;
    const orderB = courtB?.menu_order ?? 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return a.localeCompare(b);
  });

  // Distribute courts based on menu_order: odd numbers go left, even numbers go right
  sortedCourtNames.forEach((courtName) => {
    const court = filteredMatches.find(m => (m.court?.name || `Baan ${m.court_number}`) === courtName)?.court;
    const menuOrder = court?.menu_order ?? 999;
    
    if (menuOrder % 2 === 1) {
      // Odd menu_order goes to left column
      leftCourts.push(courtName);
    } else {
      // Even menu_order goes to right column
      rightCourts.push(courtName);
    }
  });

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
              {leftCourts.map((courtName) => (
                <div key={courtName} className="space-y-4">
                  <div className="p-3 bg-green-100 border border-green-200 rounded text-center">
                    <div className="text-sm font-medium text-green-800">
                      {courtName}
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
              ))}
            </div>
            
            {/* Right Column - Even menu_order courts */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-primary mb-4">Rechter Groep</h3>
              </div>
              {rightCourts.map((courtName) => (
                <div key={courtName} className="space-y-4">
                  <div className="p-3 bg-purple-100 border border-purple-200 rounded text-center">
                    <div className="text-sm font-medium text-purple-800">
                      {courtName}
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
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
