
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tournament } from '@/hooks/useTournaments';
import { Calendar } from 'lucide-react';

interface TournamentSelectorProps {
  tournaments: Tournament[];
  selectedTournamentId: string;
  onTournamentChange: (tournamentId: string) => void;
  selectedTournament?: Tournament;
}

export default function TournamentSelector({ 
  tournaments, 
  selectedTournamentId, 
  onTournamentChange,
  selectedTournament 
}: TournamentSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Toernooi Selectie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Selecteer Toernooi
            </label>
            <Select 
              value={selectedTournamentId || ""} 
              onValueChange={onTournamentChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kies een toernooi..." />
              </SelectTrigger>
              <SelectContent>
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
              <div>Status: {selectedTournament.status}</div>
              <div>Periode: {new Date(selectedTournament.start_date).toLocaleDateString('nl-NL')} - {new Date(selectedTournament.end_date).toLocaleDateString('nl-NL')}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
