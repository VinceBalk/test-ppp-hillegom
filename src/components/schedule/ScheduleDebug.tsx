
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ScheduleDebugProps {
  tournaments: any[];
  currentTournament: any;
  tournamentPlayers: any[];
  tournamentId?: string;
}

export default function ScheduleDebug({ 
  tournaments, 
  currentTournament, 
  tournamentPlayers, 
  tournamentId 
}: ScheduleDebugProps) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <Badge variant="outline">URL Tournament ID: {tournamentId || 'Geen'}</Badge>
        </div>
        <div>
          <Badge variant="outline">Tournaments Loaded: {tournaments.length}</Badge>
        </div>
        <div>
          <Badge variant="outline">Current Tournament: {currentTournament?.name || 'Geen'}</Badge>
        </div>
        <div>
          <Badge variant="outline">Players Count: {tournamentPlayers.length}</Badge>
        </div>
        {tournaments.length > 0 && (
          <div className="mt-2">
            <p className="font-medium text-orange-800">Beschikbare Toernooien:</p>
            {tournaments.map(t => (
              <div key={t.id} className="text-xs text-orange-600">
                {t.name} ({t.status}) - ID: {t.id.substring(0, 8)}...
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
