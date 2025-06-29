import Link from 'next/link';
import { format } from 'date-fns';

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
    <Link
      href={`/tournaments/${tournament.id}`}
      style={{
        display: 'block',
        backgroundColor: '#2c3b8d',
        color: '#fff',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        textDecoration: 'none',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{tournament.name}</h3>
        <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>
          {format(new Date(tournament.date), 'dd MMMM yyyy')}
        </p>
      </div>
    </Link>
  );
}
