
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function Matches() {
  // TODO: Implement matches hook to fetch data
  const mockMatches = [
    {
      id: '1',
      tournament_name: 'Voorjaarstoernooi 2024',
      player1_name: 'Jan de Vries',
      player2_name: 'Piet Janssen',
      court_name: 'Baan 1',
      match_date: '2024-06-22T10:00:00',
      status: 'scheduled',
      round_number: 1
    },
    {
      id: '2',
      tournament_name: 'Voorjaarstoernooi 2024',
      player1_name: 'Marie van Dam',
      player2_name: 'Lisa Peters',
      court_name: 'Baan 2',
      match_date: '2024-06-22T11:00:00',
      status: 'in_progress',
      round_number: 1
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Gepland</Badge>;
      case 'in_progress':
        return <Badge variant="default">Bezig</Badge>;
      case 'completed':
        return <Badge variant="secondary">Voltooid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
        <p className="text-muted-foreground">
          Overzicht van alle wedstrijden en resultaten
        </p>
      </div>

      <div className="grid gap-4">
        {mockMatches.map((match) => (
          <Card key={match.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {match.player1_name} vs {match.player2_name}
                </CardTitle>
                {getStatusBadge(match.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {match.tournament_name} - Ronde {match.round_number}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(match.match_date).toLocaleDateString('nl-NL')}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {new Date(match.match_date).toLocaleTimeString('nl-NL', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {match.court_name}
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm">
                  Details
                </Button>
                {match.status === 'scheduled' && (
                  <Button variant="outline" size="sm">
                    Score Invoeren
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockMatches.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Nog geen wedstrijden gepland.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
