
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMatches } from '@/hooks/useMatches';
import { useTournaments } from '@/hooks/useTournaments';
import MatchesHeader from '@/components/matches/MatchesHeader';
import MatchesFilter from '@/components/matches/MatchesFilter';
import MatchesEmptyState from '@/components/matches/MatchesEmptyState';
import MatchesList from '@/components/matches/MatchesList';
import MatchesResultsCount from '@/components/matches/MatchesResultsCount';
import MatchesLoading from '@/components/matches/MatchesLoading';
import MatchesError from '@/components/matches/MatchesError';
import MatchesDebug from '@/components/matches/MatchesDebug';

export default function Matches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || '');
  const [editMode, setEditMode] = useState(false);
  
  const { tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const { matches, isLoading: matchesLoading, error: matchesError, refetch } = useMatches(selectedTournamentId || undefined);

  console.log('=== MATCHES PAGE DEBUG ===');
  console.log('Tournament from URL:', tournamentId);
  console.log('Selected tournament:', selectedTournamentId);
  console.log('All tournaments:', tournaments);
  console.log('Tournaments loading:', tournamentsLoading);
  console.log('Tournaments error:', tournamentsError);
  console.log('Matches found:', matches?.length || 0);
  console.log('Matches data:', matches);
  console.log('Matches loading:', matchesLoading);
  console.log('Matches error:', matchesError);

  // Update URL when tournament selection changes
  useEffect(() => {
    if (selectedTournamentId) {
      setSearchParams({ tournament: selectedTournamentId });
    } else {
      setSearchParams({});
    }
  }, [selectedTournamentId, setSearchParams]);

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
    return <MatchesLoading />;
  }

  if (error) {
    return <MatchesError error={error} onRetry={handleRefresh} />;
  }

  // Show message if no tournaments exist
  if (!tournaments || tournaments.length === 0) {
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

  return (
    <div className="space-y-6">
      <MatchesHeader
        editMode={editMode}
        onEditModeToggle={() => setEditMode(!editMode)}
        onRefresh={handleRefresh}
        hasMatches={matches.length > 0}
        hasSelectedTournament={!!selectedTournamentId}
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

      {/* Debug Info */}
      <MatchesDebug
        selectedTournamentId={selectedTournamentId}
        matches={matches}
        tournaments={tournaments}
        selectedTournament={selectedTournament}
      />
    </div>
  );
}
