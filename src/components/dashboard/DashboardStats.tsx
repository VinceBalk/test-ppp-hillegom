import { Trophy, Users, Calendar, Award, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from './StatsCard';

interface DashboardStatsProps {
  stats: {
    activeTournaments: number;
    totalPlayers: number;
    matchesToday: number;
  };
  recentTournaments: Array<{ name: string }>;
  chefSpecial: {
    player_name: string;
    total_specials: number;
  } | null;
  sousChef: {
    player_name: string;
    total_specials: number;
  } | null;
}

export function DashboardStats({ stats, recentTournaments, chefSpecial, sousChef }: DashboardStatsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      
      <StatsCard
        title="Chef Special"
        value={chefSpecial ? `${chefSpecial.player_name} (${chefSpecial.total_specials})` : 'Nog niet toegekend'}
        icon={Award}
        onClick={() => navigate('/standings')}
      />
      
      <StatsCard
        title="Sous Chef"
        value={sousChef ? `${sousChef.player_name} (${sousChef.total_specials})` : 'Nog niet toegekend'}
        icon={Medal}
        onClick={() => navigate('/standings')}
      />
    </div>
  );
}
