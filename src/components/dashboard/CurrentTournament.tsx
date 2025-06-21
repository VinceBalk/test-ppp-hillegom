
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  current_round?: number;
  total_rounds?: number;
  player_count?: number;
}

interface CurrentTournamentProps {
  tournament: Tournament | null;
  onTournamentClick: () => void;
}

export function CurrentTournament({ tournament, onTournamentClick }: CurrentTournamentProps) {
  return (
    <Card 
      className={tournament ? "cursor-pointer hover:shadow-md transition-shadow" : ""} 
      onClick={() => tournament && onTournamentClick()}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Huidig Toernooi
        </CardTitle>
        <CardDescription>{tournament?.name || 'Geen actief toernooi'}</CardDescription>
      </CardHeader>
      <CardContent>
        {tournament ? (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Datum:</span> {format(new Date(tournament.start_date), 'd MMMM yyyy', { locale: nl })}
            </p>
            <p className="text-sm">
              <span className="font-medium">Spelers:</span> {tournament.player_count || 0}
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span> 
              <span className="ml-1 capitalize">{tournament.status.replace('_', ' ')}</span>
            </p>
            {tournament.current_round && tournament.total_rounds && (
              <p className="text-sm">
                <span className="font-medium">Ronde:</span> {tournament.current_round} van {tournament.total_rounds}
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Geen actief toernooi beschikbaar</p>
        )}
      </CardContent>
    </Card>
  );
}
