import { useDashboardTournaments } from './useDashboardTournaments';
import { useDashboardPlayerRankings } from './useDashboardPlayerRankings';
import { useDashboardStats } from './useDashboardStats';
import { useChefSpecialRanking } from './useChefSpecialRanking';

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

  const {
    data: specialsRanking,
    isLoading: specialsLoading
  } = useChefSpecialRanking(currentTournament?.id);

  const chefSpecial = specialsRanking?.[0] || null;
  const sousChef = specialsRanking?.[1] || null;

  const loading = tournamentsLoading || rankingsLoading || statsLoading || specialsLoading;

  console.log('Dashboard: Current state:', {
    loading,
    currentTournament,
    recentTournaments: recentTournaments.length,
    leftRankings: leftRankings.length,
    rightRankings: rightRankings.length,
    stats,
    chefSpecial,
    sousChef
  });

  return {
    currentTournament,
    recentTournaments,
    leftRankings,
    rightRankings,
    stats,
    chefSpecial,
    sousChef,
    loading
  };
}
