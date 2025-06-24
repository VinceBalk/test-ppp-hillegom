
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hash } from 'lucide-react';
import { Match } from '@/hooks/useMatches';
import MatchCard from './MatchCard';
import MatchNumberManager from './MatchNumberManager';

interface MatchesListProps {
  matches: Match[];
  editMode: boolean;
  selectedTournamentId: string;
}

export default function MatchesList({ matches, editMode, selectedTournamentId }: MatchesListProps) {
  const [showNumberManager, setShowNumberManager] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  if (!matches || matches.length === 0) {
    return null;
  }

  // Group matches by court
  const matchesByCourt = matches.reduce((groups, match) => {
    const courtKey = match.court?.name || (match.court_number ? `Baan ${match.court_number}` : 'Onbekende baan');
    if (!groups[courtKey]) {
      groups[courtKey] = [];
    }
    groups[courtKey].push(match);
    return groups;
  }, {} as Record<string, Match[]>);

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

  // Get unique rounds for display
  const rounds = [...new Set(matches.map(match => match.round_number))].sort();
  const roundText = rounds.length === 1 ? `ronde ${rounds[0]}` : `${rounds.length} rondes`;

  const handleManageNumbers = (roundNumber: number) => {
    setSelectedRound(roundNumber);
    setShowNumberManager(true);
  };

  if (showNumberManager && selectedRound) {
    const roundMatches = matches.filter(match => match.round_number === selectedRound);
    return (
      <MatchNumberManager
        matches={roundMatches}
        tournamentId={selectedTournamentId}
        roundNumber={selectedRound}
        onClose={() => {
          setShowNumberManager(false);
          setSelectedRound(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Wedstrijden Overzicht</CardTitle>
          {editMode && rounds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Nummers beheren:</span>
              {rounds.map(round => (
                <Button
                  key={round}
                  variant="outline"
                  size="sm"
                  onClick={() => handleManageNumbers(round)}
                  className="text-xs"
                >
                  <Hash className="h-3 w-3 mr-1" />
                  Ronde {round}
                </Button>
              ))}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {matches.length} wedstrijd{matches.length !== 1 ? 'en' : ''} in {roundText}
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
