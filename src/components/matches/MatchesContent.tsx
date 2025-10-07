import { useEffect, useState } from 'react';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import MatchesHeader from './MatchesHeader';
import MatchesFilter from './MatchesFilter';
import MatchesRoundFilter from './MatchesRoundFilter';
import MatchesEmptyState from './MatchesEmptyState';
import MatchesList from './MatchesList';
import MatchesResultsCount from './MatchesResultsCount';
import MatchesLoading from './MatchesLoading';
import MatchesError from './MatchesError';
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
  const [selectedRound, setSelectedRound] = useState<string>('all');

  console.log('Tournament from URL:', selectedTournamentId);
  console.log('Selected tournament:', selectedTournamentId);
  console.log('All tournaments:', tournaments);
  console.log('Tournaments loading:', tournamentsLoading);
  console.log('Tournaments error:', tournamentsError);
  console.log('Matches found:', matches?.length || 0);
  console.log('Matches data:', matches);
  console.log('Matches loading:', matchesLoading);
  console.log('Matches error:', matchesError);

  // Reset round filter when tournament changes
  useEffect(() => {
    setSelectedRound('all');
  }, [selectedTournamentId]);

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

  // Get available rounds from matches
  const availableRounds = [...new Set(matches?.map(match => match.round_number) || [])].sort();

  // Filter matches by selected round
  const filteredMatches = selectedRound === 'all' 
    ? matches 
    : matches?.filter(match => match.round_number === parseInt(selectedRound)) || [];

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

  // Create tournament object for MatchesList with proper type mapping
  const tournamentForMatches = selectedTournament ? {
    id: selectedTournament.id,
    status: (selectedTournament.status === 'in_progress' ? 'active' : 
             selectedTournament.status === 'completed' ? 'completed' :
             selectedTournament.status === 'draft' ? 'not_started' : 
             'not_started') as "not_started" | "active" | "completed",
    is_simulation: selectedTournament.is_simulation || false
  } : undefined;

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

      {/* Round Filter - only show when tournament is selected and has matches */}
      {selectedTournamentId && matches.length > 0 && availableRounds.length > 1 && (
        <MatchesRoundFilter
          availableRounds={availableRounds}
          selectedRound={selectedRound}
          onRoundChange={setSelectedRound}
        />
      )}

      {/* No matches alert */}
      {selectedTournamentId && matches.length === 0 && (
        <MatchesEmptyState type="no-matches" selectedTournamentId={selectedTournamentId} />
      )}

      {/* Matches List */}
      {matches.length === 0 && !selectedTournamentId ? (
        <MatchesEmptyState type="no-selection" />
      ) : (
        <MatchesList
          matches={filteredMatches}
          editMode={editMode}
          selectedTournamentId={selectedTournamentId}
          tournament={tournamentForMatches}
        />
      )}

      {/* Results count */}
      <MatchesResultsCount 
        matchCount={filteredMatches.length} 
        selectedTournament={selectedTournament}
        selectedRound={selectedRound}
        totalMatches={matches.length}
      />
    </div>
  );
}
