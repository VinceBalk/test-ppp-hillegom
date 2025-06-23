
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
  const [selectedRound, setSelectedRound] = useState<string>('all');

  // Filter matches by round if a specific round is selected
  const filteredMatches = selectedRound === 'all' 
    ? matches 
    : matches.filter(match => match.round_number === parseInt(selectedRound));

  // Group matches by round
  const matchesByRound = filteredMatches.reduce((groups, match) => {
    const round = match.round_number;
    if (!groups[round]) {
      groups[round] = [];
    }
    groups[round].push(match);
    return groups;
  }, {} as Record<number, Match[]>);

  // Get unique rounds from all matches
  const availableRounds = [...new Set(matches.map(match => match.round_number))].sort();

  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Wedstrijden Overzicht</CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Filter op ronde:</Label>
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Alle rondes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle rondes</SelectItem>
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
          {filteredMatches.length} wedstrijd{filteredMatches.length !== 1 ? 'en' : ''} gevonden
          {selectedRound !== 'all' && ` in ronde ${selectedRound}`}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {Object.keys(matchesByRound)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(roundKey => {
            const round = parseInt(roundKey);
            const roundMatches = matchesByRound[round];
            
            // Group matches by court for better organization
            const matchesByCourtInRound = roundMatches.reduce((courtGroups, match) => {
              const courtKey = match.court?.name || match.court_number || 'Geen baan';
              if (!courtGroups[courtKey]) {
                courtGroups[courtKey] = [];
              }
              courtGroups[courtKey].push(match);
              return courtGroups;
            }, {} as Record<string, Match[]>);

            return (
              <div key={round} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">Ronde {round}</h3>
                  <Badge variant="outline">{roundMatches.length} wedstrijd{roundMatches.length !== 1 ? 'en' : ''}</Badge>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(matchesByCourtInRound).map(([courtName, courtMatches]) => (
                    <div key={courtName} className="space-y-2">
                      <h4 className="font-medium text-muted-foreground">{courtName}</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        {courtMatches.map((match, index) => (
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
            );
          })}
      </CardContent>
    </Card>
  );
}
