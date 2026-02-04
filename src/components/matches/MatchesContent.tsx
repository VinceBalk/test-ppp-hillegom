import { useEffect, useState, useMemo } from 'react';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { useCourts } from '@/hooks/useCourts';
import MatchesHeader from './MatchesHeader';
import MatchesFilter from './MatchesFilter';
import MatchesEmptyState from './MatchesEmptyState';
import MatchesList from './MatchesList';
import MatchesResultsCount from './MatchesResultsCount';
import MatchesLoading from './MatchesLoading';
import MatchesError from './MatchesError';
import MatchesAccessInfo from './MatchesAccessInfo';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Lock } from 'lucide-react';

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
  const { courts } = useCourts();
  const [selectedRound, setSelectedRound] = useState<string>('1');
  const [selectedRow, setSelectedRow] = useState<string>('all');

  const selectedTournament = tournaments?.find(t => t.id === selectedTournamentId);

  // Auto-select eerste toernooi als er geen geselecteerd is
  useEffect(() => {
    if (!selectedTournamentId && tournaments && tournaments.length > 0) {
      setSelectedTournamentId(tournaments[0].id);
    }
  }, [selectedTournamentId, tournaments, setSelectedTournamentId]);

  // Reset filters when tournament changes
  useEffect(() => {
    setSelectedRound('1');
    setSelectedRow('all');
  }, [selectedTournamentId]);

  // Handle browser back button properly
  useEffect(() => {
    const handlePopState = () => {
      refetch();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [refetch]);

  // Check round completion status
  const roundStatus = useMemo(() => {
    if (!matches || matches.length === 0) {
      return { round1Completed: false, round2Completed: false, round3Completed: false };
    }
    
    const round1Matches = matches.filter(m => m.round_number === 1);
    const round2Matches = matches.filter(m => m.round_number === 2);
    const round3Matches = matches.filter(m => m.round_number === 3);
    
    const isMatchComplete = (m: any) => m.status === 'completed';
    
    const round1Completed = round1Matches.length > 0 && round1Matches.every(isMatchComplete);
    const round2Completed = round2Matches.length > 0 && round2Matches.every(isMatchComplete);
    const round3Completed = round3Matches.length > 0 && round3Matches.every(isMatchComplete);
    
    return { round1Completed, round2Completed, round3Completed };
  }, [matches]);

  // Check if rounds have matches
  const roundsGenerated = useMemo(() => {
    if (!matches || matches.length === 0) {
      return { round1: false, round2: false, round3: false };
    }
    
    return {
      round1: matches.some(m => m.round_number === 1),
      round2: matches.some(m => m.round_number === 2),
      round3: matches.some(m => m.round_number === 3),
    };
  }, [matches]);

  // Filter matches by selected round and row
  const filteredMatches = useMemo(() => {
    const roundNumber = parseInt(selectedRound);
    let roundMatches = matches?.filter(m => m.round_number === roundNumber) || [];
    
    // Filter by row if not "all"
    if (selectedRow !== 'all' && courts) {
      const rowCourts = courts.filter(c => c.row_side === selectedRow).map(c => c.id);
      roundMatches = roundMatches.filter(m => m.court_id && rowCourts.includes(m.court_id));
    }
    
    return roundMatches;
  }, [matches, selectedRound, selectedRow, courts]);

  const handleRefresh = () => {
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

  // Create tournament object for MatchesList with proper type mapping
  const tournamentForMatches = selectedTournament ? {
    id: selectedTournament.id,
    status: (selectedTournament.status === 'in_progress' ? 'active' : 
             selectedTournament.status === 'completed' ? 'completed' :
             selectedTournament.status === 'draft' ? 'not_started' : 
             'not_started') as "not_started" | "active" | "completed",
  } : undefined;

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

      {/* Round Tabs and Row Filter */}
      {selectedTournamentId && matches && matches.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <Tabs value={selectedRound} onValueChange={setSelectedRound}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <TabsList className="grid w-full sm:w-auto grid-cols-3">
                  <TabsTrigger 
                    value="1" 
                    className="flex items-center gap-2"
                    disabled={!roundsGenerated.round1}
                  >
                    Ronde 1
                    {roundStatus.round1Completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="2" 
                    className="flex items-center gap-2"
                    disabled={!roundsGenerated.round2}
                  >
                    Ronde 2
                    {roundStatus.round2Completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="3" 
                    disabled={!roundsGenerated.round3}
                    className="flex items-center gap-2"
                  >
                    Ronde 3
                    {!roundsGenerated.round3 && (
                      <Lock className="h-3 w-3" />
                    )}
                    {roundStatus.round3Completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  </TabsTrigger>
                </TabsList>

                <Select value={selectedRow} onValueChange={setSelectedRow}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter op rij" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Rijen</SelectItem>
                    <SelectItem value="left">Rij Links</SelectItem>
                    <SelectItem value="right">Rij Rechts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Ronde 3 locked message */}
      {selectedTournamentId && selectedRound === '3' && !roundsGenerated.round3 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Lock className="h-4 w-4" />
              <span>
                Ronde 3 wordt gegenereerd zodra Ronde 1 en Ronde 2 volledig zijn afgerond.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No matches for selected round */}
      {selectedTournamentId && matches && matches.length > 0 && filteredMatches.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground">
                Geen wedstrijden voor Ronde {selectedRound}
                {selectedRow !== 'all' && ` in ${selectedRow === 'left' ? 'Rij Links' : 'Rij Rechts'}`}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No matches alert */}
      {selectedTournamentId && (!matches || matches.length === 0) && (
        <MatchesEmptyState type="no-matches" selectedTournamentId={selectedTournamentId} />
      )}

      {/* Matches List */}
      {!selectedTournamentId ? (
        <MatchesEmptyState type="no-selection" />
      ) : filteredMatches.length > 0 && (
        <MatchesList
          matches={filteredMatches}
          editMode={editMode}
          selectedTournamentId={selectedTournamentId}
          tournament={tournamentForMatches}
          onRefetch={refetch}
        />
      )}

      {/* Results count */}
      {filteredMatches.length > 0 && (
        <MatchesResultsCount 
          matchCount={filteredMatches.length} 
          selectedTournament={selectedTournament}
          selectedRound={selectedRound}
          totalMatches={matches?.length || 0}
        />
      )}
    </div>
  );
}
