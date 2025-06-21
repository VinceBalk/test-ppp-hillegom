
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Match } from '@/hooks/useMatches';

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface MatchesDebugProps {
  selectedTournamentId: string;
  matches: Match[];
  tournaments: Tournament[];
  selectedTournament?: Tournament;
}

export default function MatchesDebug({ 
  selectedTournamentId, 
  matches, 
  tournaments,
  selectedTournament 
}: MatchesDebugProps) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>Selected Tournament: {selectedTournamentId || 'Geen'}</div>
        <div>Matches Found: {matches.length}</div>
        <div>Tournaments Available: {tournaments.length}</div>
        <div>Raw Matches Data: {JSON.stringify(matches.slice(0, 1), null, 2)}</div>
      </CardContent>
    </Card>
  );
}
