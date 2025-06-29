
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Tournament = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status?: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
};

type Props = {
  tournament: Tournament;
};

export default function TournamentCard({ tournament }: Props) {
  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Link to={`/tournaments/${tournament.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{tournament.name}</CardTitle>
            {tournament.status && (
              <Badge variant={getStatusVariant(tournament.status)}>
                {tournament.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {format(new Date(tournament.start_date), 'dd MMMM yyyy')} - {format(new Date(tournament.end_date), 'dd MMMM yyyy')}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
