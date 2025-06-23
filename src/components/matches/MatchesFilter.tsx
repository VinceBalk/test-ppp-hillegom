
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
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
        <div className="flex items-center justify-between">
          <CardTitle>Filter Wedstrijden</CardTitle>
          {selectedTournament && (
            <Badge variant="outline">{selectedTournament.status}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Selecteer Toernooi
            </label>
            <Select value={selectedTournamentId} onValueChange={onTournamentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Kies een toernooi..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle toernooien</SelectItem>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{tournament.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {tournament.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedTournament && (
            <div className="text-sm text-muted-foreground">
              <div>Status: {selectedTournament.status}</div>
              <div>Periode: {new Date(selectedTournament.start_date).toLocaleDateString('nl-NL')} - {new Date(selectedTournament.end_date).toLocaleDateString('nl-NL')}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
