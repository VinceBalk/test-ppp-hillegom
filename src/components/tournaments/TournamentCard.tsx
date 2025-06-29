import Link from 'next/link';
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
    <Link href={`/tournaments/${tournament.id}`} className="block">
      <Card className="tournament-card">
        <CardHeader>
          <div className="tournament-card__header">
            <CardTitle className="tournament-card__title">{tournament.name}</CardTitle>
            {tournament.status && (
              <Badge variant={getStatusVariant(tournament.status)}>
                {tournament.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="tournament-card__dates">
            {format(new Date(tournament.start_date), 'dd MMMM yyyy')} – {format(new Date(tournament.end_date), 'dd MMMM yyyy')}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
