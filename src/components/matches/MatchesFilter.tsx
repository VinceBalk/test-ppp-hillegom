
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Tournament {
  id: string;
  name: string;
  status?: string;
}

interface MatchesFilterProps {
  tournaments: Tournament[];
  selectedTournamentId: string;
  onTournamentChange: (tournamentId: string) => void;
  selectedTournament?: Tournament;
}

export default function MatchesFilter({ 
  tournaments, 
  selectedTournamentId, 
  onTournamentChange,
  selectedTournament 
}: MatchesFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter op Toernooi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Select value={selectedTournamentId} onValueChange={onTournamentChange}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Selecteer een toernooi..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle toernooien</SelectItem>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTournament && (
            <Badge variant="outline">
              {selectedTournament.name} - Status: {selectedTournament.status || 'Onbekend'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
