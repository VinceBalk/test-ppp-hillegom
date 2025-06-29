import Link from 'next/link';
import { format } from 'date-fns';
import { Tournament } from '@/types'; // pas aan indien nodig
import '../ui/styles/tournament-card.css';

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
