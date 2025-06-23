
import { useEffect } from 'react';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import MatchesHeader from './MatchesHeader';
import MatchesFilter from './MatchesFilter';
import MatchesEmptyState from './MatchesEmptyState';
import MatchesList from './MatchesList';
import MatchesResultsCount from './MatchesResultsCount';
import MatchesLoading from './MatchesLoading';
import MatchesError from './MatchesError';
import MatchesDebug from './MatchesDebug';
import MatchesAccessInfo from './MatchesAccessInfo';

interface MatchesContentProps {
  selectedTournamentId: string;
  setSelectedTournamentId: (id: string) => void;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  isSuperAdmin: boolean;
  hasOrganizerRole: boolean;
  hasPlayerRole: boolean;
}

export default function MatchesContent({
  selectedTournamentId,
  setSelectedTournamentId,
  editMode,
  setEditMode,
  isSuperAdmin,
  hasOrganizerRole,
  hasPlayerRole,
}: MatchesContentProps) {
  const { tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const { matches, isLoading: matchesLoading, error: matchesError, refetch } = useMatches(selectedTournamentId || undefined);

  console.log('Tournament from URL:', selectedTournamentId);
  console.log('Selected tournament:', selectedTournamentId);
  console.log('All tournaments:', tournaments);
  console.log('Tournaments loading:', tournamentsLoading);
  console.log('Tournaments error:', tournamentsError);
  console.log('Matches found:', matches?.length || 0);
  console.log('Matches data:', matches);
  console.log('Matches loading:', matchesLoading);
  console.log('Matches error:', matchesError);

  // Handle browser back button properly
  useEffect(() => {
    const handlePopState = () => {
      console.log('Browser popstate event detected');
      // Force a refetch when user navigates back
      refetch();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [refetch]);

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    refetch();
  };

  const isLoading = tournamentsLoading || matchesLoading;
  const error = tournamentsError || matchesError;

  if (isLoading) {
    console.log('=== SHOWING LOADING STATE ===');
    return <MatchesLoading />;
  }

  if (error) {
    console.log('=== SHOWING ERROR STATE ===', error);
    return <MatchesError error={error} onRetry={handleRefresh} />;
  }

  // Show message if no tournaments exist
  if (!tournaments || tournaments.length === 0) {
    console.log('=== NO TOURNAMENTS FOUND ===');
    return (
      <div className="space-y-6">
        <MatchesHeader
          editMode={editMode}
          onEditModeToggle={() => setEditMode(!editMode)}
          onRefresh={handleRefresh}
          hasMatches={matches.length > 0}
          hasSelectedTournament={!!selectedTournamentId}
        />
        <MatchesEmptyState type="no-tournaments" />
      </div>
    );
  }

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  console.log('=== RENDERING MATCHES CONTENT ===');

  return (
    <div className="space-y-6">
      <MatchesHeader
        editMode={editMode}
        onEditModeToggle={() => setEditMode(!editMode)}
        onRefresh={handleRefresh}
        hasMatches={matches.length > 0}
        hasSelectedTournament={!!selectedTournamentId}
      />

      {/* Access level info */}
      <MatchesAccessInfo
        isSuperAdmin={isSuperAdmin}
        hasOrganizerRole={hasOrganizerRole}
        hasPlayerRole={hasPlayerRole}
      />

      {/* Tournament Filter */}
      <MatchesFilter
        tournaments={tournaments}
        selectedTournamentId={selectedTournamentId}
        onTournamentChange={setSelectedTournamentId}
        selectedTournament={selectedTournament}
      />

      {/* No matches alert */}
      {selectedTournamentId && matches.length === 0 && (
        <MatchesEmptyState type="no-matches" selectedTournamentId={selectedTournamentId} />
      )}

      {/* Matches List */}
      {matches.length === 0 && !selectedTournamentId ? (
        <MatchesEmptyState type="no-selection" />
      ) : (
        <MatchesList
          matches={matches}
          editMode={editMode}
          selectedTournamentId={selectedTournamentId}
        />
      )}

      {/* Results count */}
      <MatchesResultsCount matchCount={matches.length} selectedTournament={selectedTournament} />

      {/* Debug Info - only show for super admins */}
      {isSuperAdmin && (
        <MatchesDebug
          selectedTournamentId={selectedTournamentId}
          matches={matches}
          tournaments={tournaments}
          selectedTournament={selectedTournament}
        />
      )}
    </div>
  );
}
