
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMatches } from '@/hooks/useMatches';
import { useTournaments } from '@/hooks/useTournaments';
import { useAuth } from '@/contexts/AuthContext';
import MatchesHeader from '@/components/matches/MatchesHeader';
import MatchesFilter from '@/components/matches/MatchesFilter';
import MatchesEmptyState from '@/components/matches/MatchesEmptyState';
import MatchesList from '@/components/matches/MatchesList';
import MatchesResultsCount from '@/components/matches/MatchesResultsCount';
import MatchesLoading from '@/components/matches/MatchesLoading';
import MatchesError from '@/components/matches/MatchesError';
import MatchesDebug from '@/components/matches/MatchesDebug';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';

export default function Matches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || '');
  const [editMode, setEditMode] = useState(false);
  
  const { user, isSuperAdmin, hasRole } = useAuth();
  const { tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const { matches, isLoading: matchesLoading, error: matchesError, refetch } = useMatches(selectedTournamentId || undefined);

  console.log('=== MATCHES PAGE DEBUG ===');
  console.log('Current user:', user?.email);
  console.log('Is super admin:', isSuperAdmin());
  console.log('Has organisator role:', hasRole('organisator'));
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

  // Show info about access levels
  const showAccessInfo = () => {
    if (isSuperAdmin()) {
      return (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Je bent ingelogd als super admin en kunt alle wedstrijden bekijken en bewerken.
          </AlertDescription>
        </Alert>
      );
    } else if (hasRole('organisator')) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <Info className="h-4 w-4 text-green-600" />  
          <AlertDescription className="text-green-800">
            Je bent ingelogd als organisator en kunt alle wedstrijden bekijken en bewerken.
          </AlertDescription>
        </Alert>
      );
    } else if (hasRole('speler')) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Je bent ingelogd als speler en kunt alleen wedstrijden bekijken waarin je speelt.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

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
      {showAccessInfo()}

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
      {isSuperAdmin() && (
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
