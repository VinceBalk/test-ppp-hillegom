
import { Trophy, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from './StatsCard';

interface DashboardStatsProps {
  stats: {
    activeTournaments: number;
    totalPlayers: number;
    matchesToday: number;
  };
  recentTournaments: Array<{ name: string }>;
}

export function DashboardStats({ stats, recentTournaments }: DashboardStatsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Actieve Toernooien"
        value={stats.activeTournaments}
        icon={Trophy}
        onClick={() => navigate('/tournaments')}
      />
      
      <StatsCard
        title="Spelers"
        value={stats.totalPlayers}
        icon={Users}
        onClick={() => navigate('/players')}
      />
      
      <StatsCard
        title="Geplande Wedstrijden"
        value={stats.matchesToday}
        icon={Calendar}
        onClick={() => navigate('/matches')}
      />
      
      <StatsCard
        title="Laatste Toernooi"
        value={recentTournaments[0]?.name || 'Geen recent toernooi'}
        icon={Trophy}
        onClick={() => navigate('/tournaments')}
      />
    </div>
  );
}
