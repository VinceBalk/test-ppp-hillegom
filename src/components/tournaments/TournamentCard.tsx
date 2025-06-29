import Link from 'next/link';
import { format } from 'date-fns';
import '../ui/styles/tournament-card.css';

// Tijdelijk local type gebruiken om publish error te voorkomen
type Tournament = {
  id: string;
  name: string;
  date: string;
};

type Props = {
  tournament: Tournament;
};

export default function TournamentCard({ tournament }: Props) {
  return (
    <Link href={`/tournaments/${tournament.id}`} className="tournament-card">
      <div className="tournament-card__body">
        <h3 className="tournament-card__title">{tournament.name}</h3>
        <p className="tournament-card__date">
          {format(new Date(tournament.date), 'dd MMMM yyyy')}
        </p>
      </div>
    </Link>
  );
}
