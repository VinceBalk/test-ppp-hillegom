
import { useDashboardTournaments } from './useDashboardTournaments';
import { useDashboardPlayerRankings } from './useDashboardPlayerRankings';
import { useDashboardStats } from './useDashboardStats';

export function useDashboardData() {
  const {
    currentTournament,
    recentTournaments,
    loading: tournamentsLoading
  } = useDashboardTournaments();

  const {
    leftRankings,
    rightRankings,
    loading: rankingsLoading
  } = useDashboardPlayerRankings();

  const {
    stats,
    loading: statsLoading
  } = useDashboardStats();

  const loading = tournamentsLoading || rankingsLoading || statsLoading;

  console.log('Dashboard: Current state:', {
    loading,
    currentTournament,
    recentTournaments: recentTournaments.length,
    leftRankings: leftRankings.length,
    rightRankings: rightRankings.length,
    stats
  });

  return {
    currentTournament,
    recentTournaments,
    leftRankings,
    rightRankings,
    stats,
    loading
  };
}
