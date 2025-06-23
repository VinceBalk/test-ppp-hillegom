
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

  // Split matches into left and right columns for better layout
  const splitMatches = (matches: Match[]) => {
    const leftColumn = [];
    const rightColumn = [];
    
    matches.forEach((match, index) => {
      if (index % 2 === 0) {
        leftColumn.push(match);
      } else {
        rightColumn.push(match);
      }
    });
    
    return { leftColumn, rightColumn };
  };

  const { leftColumn, rightColumn } = splitMatches(filteredMatches);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {leftColumn.map((match, index) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  matchNumberInCourtRound={index * 2 + 1}
                />
              ))}
            </div>
            
            {/* Right Column */}
            <div className="space-y-4">
              {rightColumn.map((match, index) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  matchNumberInCourtRound={index * 2 + 2}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
