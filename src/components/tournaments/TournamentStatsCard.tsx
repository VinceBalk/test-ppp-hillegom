
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface Tournament {
  max_players?: number;
}

interface TournamentStatsCardProps {
  tournament: Tournament;
  leftPlayersCount: number;
  rightPlayersCount: number;
  totalPlayersCount: number;
}

export default function TournamentStatsCard({ 
  tournament, 
  leftPlayersCount, 
  rightPlayersCount, 
  totalPlayersCount 
}: TournamentStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Toernooi Statistieken
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{leftPlayersCount}</div>
            <div className="text-sm text-muted-foreground">Links Groep</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{rightPlayersCount}</div>
            <div className="text-sm text-muted-foreground">Rechts Groep</div>
          </div>
          <div className="text-center p-4 bg-primary/10 rounded-lg col-span-2">
            <div className="text-2xl font-bold text-primary">{totalPlayersCount}</div>
            <div className="text-sm text-muted-foreground">Totaal Spelers</div>
            <div className="text-xs text-muted-foreground mt-1">
              Max: {tournament.max_players || 'Onbeperkt'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
