
import { useNavigate } from 'react-router-dom';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { CurrentTournament } from '@/components/dashboard/CurrentTournament';
import { PlayerRankings } from '@/components/dashboard/PlayerRankings';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function Dashboard() {
  console.log('=== DASHBOARD COMPONENT RENDERING ===');
  const navigate = useNavigate();
  const {
    currentTournament,
    recentTournaments,
    leftRankings,
    rightRankings,
    stats,
    loading
  } = useDashboardData();

  console.log('Dashboard component render:', {
    loading,
    hasCurrentTournament: !!currentTournament,
    recentTournamentsCount: recentTournaments.length,
    leftRankingsCount: leftRankings.length,
    rightRankingsCount: rightRankings.length,
    stats
  });

  const handlePlayerClick = (playerId: string) => {
    console.log('Dashboard: Player clicked:', playerId);
    navigate(`/players/${playerId}`);
  };

  const handleTournamentClick = () => {
    console.log('Dashboard: Tournament clicked');
    navigate('/tournaments');
  };

  if (loading) {
    console.log('Dashboard: Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  console.log('Dashboard: Rendering main content');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welkom bij het PPP Hillegom toernooi management systeem</p>
      </div>

      <DashboardStats stats={stats} recentTournaments={recentTournaments} />

      <CurrentTournament 
        tournament={currentTournament} 
        onTournamentClick={handleTournamentClick} 
      />

      <div className="grid-2">
        <PlayerRankings
          title="Rankings - Linker Rijtje"
          description="Top 10 spelers van de linker kant"
          players={leftRankings}
          onPlayerClick={handlePlayerClick}
        />

        <PlayerRankings
          title="Rankings - Rechter Rijtje"
          description="Top 10 spelers van de rechter kant"
          players={rightRankings}
          onPlayerClick={handlePlayerClick}
        />
      </div>
    </div>
  );
}
