
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Tournament {
  id: string;
  name: string;
  status?: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
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
  const handleTournamentChange = (value: string) => {
    // Convert "all" back to empty string for the parent component
    onTournamentChange(value === "all" ? "" : value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filter Wedstrijden</CardTitle>
          {selectedTournament && selectedTournament.status && (
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
            <Select 
              value={selectedTournamentId || "all"} 
              onValueChange={handleTournamentChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kies een toernooi..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle toernooien</SelectItem>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{tournament.name}</span>
                      {tournament.status && (
                        <Badge variant="outline" className="ml-2">
                          {tournament.status}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedTournament && (
            <div className="text-sm text-muted-foreground">
              {selectedTournament.status && (
                <div>Status: {selectedTournament.status}</div>
              )}
              <div>Periode: {new Date(selectedTournament.start_date).toLocaleDateString('nl-NL')} - {new Date(selectedTournament.end_date).toLocaleDateString('nl-NL')}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
