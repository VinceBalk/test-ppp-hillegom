import { useEffect, useState, useMemo } from 'react';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { useCourts } from '@/hooks/useCourts';
import { useSimulation } from '@/hooks/useSimulation';
import MatchesHeader from './MatchesHeader';
import MatchesFilter from './MatchesFilter';
import MatchesEmptyState from './MatchesEmptyState';
import MatchesList from './MatchesList';
import MatchesResultsCount from './MatchesResultsCount';
import MatchesLoading from './MatchesLoading';
import MatchesError from './MatchesError';
import MatchesAccessInfo from './MatchesAccessInfo';
import SimulationControls from '@/components/simulation/SimulationControls';
import SimulationRankingPreview from '@/components/simulation/SimulationRankingPreview';
import SimulationScoreInput from '@/components/simulation/SimulationScoreInput';
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
  
  // Simulatie hook
  const simulation = useSimulation(selectedTournamentId, matches || [], courts || []);

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
    simulation.resetSimulation();
  }, [selectedTournamentId]);

  // Handle browser back button properly
  useEffect(() => {
    const handlePopState = () => {
      refetch();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [refetch]);

  // Gebruik gesimuleerde of echte matches
  const effectiveMatches = simulation.isSimulationActive ? simulation.simulatedMatches : matches;

  // Check round completion status
  const roundStatus = useMemo(() => {
    if (!effectiveMatches || effectiveMatches.length === 0) {
      return { round1Completed: false, round2Completed: false, round3Completed: false };
    }
    
    const round1Matches = effectiveMatches.filter(m => m.round_number === 1);
    const round2Matches = effectiveMatches.filter(m => m.round_number === 2);
    const round3Matches = effectiveMatches.filter(m => m.round_number === 3);
    
    const isMatchComplete = (m: any) => {
      if (simulation.isSimulationActive) {
        return m.simulated_status === 'completed' || 
          (m.simulated_team1_score !== null && m.simulated_team1_score !== undefined && m.simulated_team1_score >= 0);
      }
      return m.status === 'completed';
    };
    
    const round1Completed = round1Matches.length > 0 && round1Matches.every(isMatchComplete);
    const round2Completed = round2Matches.length > 0 && round2Matches.every(isMatchComplete);
    const round3Completed = round3Matches.length > 0 && round3Matches.every(isMatchComplete);
    
    return { round1Completed, round2Completed, round3Completed };
  }, [effectiveMatches, simulation.isSimulationActive]);

  // Check if rounds have matches
  const roundsGenerated = useMemo(() => {
    if (!effectiveMatches || effectiveMatches.length === 0) {
      return { round1: false, round2: false, round3: false };
    }
    
    return {
      round1: effectiveMatches.some(m => m.round_number === 1),
      round2: effectiveMatches.some(m => m.round_number === 2),
      round3: effectiveMatches.some(m => m.round_number === 3),
    };
  }, [effectiveMatches]);

  // Filter matches by selected round and row
  const filteredMatches = useMemo(() => {
    const roundNumber = parseInt(selectedRound);
    let roundMatches = effectiveMatches?.filter(m => m.round_number === roundNumber) || [];
    
    // Filter by row if not "all"
    if (selectedRow !== 'all' && courts) {
      const rowCourts = courts.filter(c => c.row_side === selectedRow).map(c => c.id);
      roundMatches = roundMatches.filter(m => m.court_id && rowCourts.includes(m.court_id));
    }
    
    return roundMatches;
  }, [effectiveMatches, selectedRound, selectedRow, courts]);

  const handleRefresh = () => {
    refetch();
  };

  const handleExportPdf = () => {
    // PDF export tijdelijk uitgeschakeld
    console.log('PDF export komt later');
  };

  const handleSetScore = (matchId: string, team1Score: number, team2Score: number) => {
    // Check of het een R3 match is
    if (matchId.startsWith('sim-r3-')) {
      simulation.setR3MatchScore(matchId, team1Score, team2Score);
    } else {
      simulation.setMatchScore(matchId, team1Score, team2Score);
    }
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
             selectedTournament.status === 'simulation' ? 'active' :
             selectedTournament.status === 'draft' ? 'not_started' : 
             'not_started') as "not_started" | "active" | "completed",
    is_simulation: selectedTournament.is_simulation || selectedTournament.status === 'simulation',
  } : undefined;

  const isSimulationMode = selectedTournament?.status === 'simulation';

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

      {/* Simulatie Controls - alleen bij simulation status */}
      {isSimulationMode && (
        <SimulationControls
          isSimulationActive={simulation.isSimulationActive}
          simulationMode={simulation.simulationMode}
          round3Generated={simulation.round3Generated}
          r1r2Complete={simulation.r1r2Complete}
          r3Complete={simulation.r3Complete}
          onStartRandomSimulation={simulation.startRandomSimulation}
          onStartManualSimulation={simulation.startManualSimulation}
          onGenerateRound3={simulation.generateRound3}
          onResetSimulation={simulation.resetSimulation}
          onExportPdf={handleExportPdf}
          tournamentStatus={selectedTournament?.status}
        />
      )}

      {/* Tussenstand na R1+R2 (simulatie) */}
      {simulation.isSimulationActive && simulation.r1r2Complete && !simulation.round3Generated && (
        <SimulationRankingPreview 
          playerStats={simulation.playerStatsAfterR1R2}
          title="Tussenstand na Ronde 1 + 2 → Indeling Ronde 3"
        />
      )}

      {/* Finale ranking (simulatie) */}
      {simulation.isSimulationActive && simulation.r3Complete && simulation.finalRankings && (
        <SimulationRankingPreview 
          finalRankings={simulation.finalRankings}
          title="🏆 Eindrangschikking"
        />
      )}

      {/* Round Tabs and Row Filter */}
      {selectedTournamentId && effectiveMatches.length > 0 && (
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
                {isSimulationMode && simulation.isSimulationActive
                  ? 'Vul eerst alle scores in voor R1 en R2, dan kan je R3 genereren.'
                  : 'Ronde 3 wordt gegenereerd zodra Ronde 1 en Ronde 2 volledig zijn afgerond.'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No matches for selected round */}
      {selectedTournamentId && effectiveMatches.length > 0 && filteredMatches.length === 0 && (
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
      {selectedTournamentId && effectiveMatches.length === 0 && (
        <MatchesEmptyState type="no-matches" selectedTournamentId={selectedTournamentId} />
      )}

      {/* Matches List */}
      {!selectedTournamentId ? (
        <MatchesEmptyState type="no-selection" />
      ) : filteredMatches.length > 0 && (
        simulation.isSimulationActive && simulation.simulationMode === 'manual' ? (
          // Handmatige invoer mode - toon SimulationScoreInput
          <SimulationMatchList 
            matches={filteredMatches}
            courts={courts || []}
            onSetScore={handleSetScore}
            onAddSpecial={simulation.addSpecial}
            onRemoveSpecial={simulation.removeSpecial}
            getMatchSpecials={simulation.getMatchSpecials}
          />
        ) : simulation.isSimulationActive ? (
          // Random mode - toon read-only view
          <SimulationMatchListReadOnly 
            matches={filteredMatches}
            courts={courts || []}
          />
        ) : (
          // Normale mode
          <MatchesList
            matches={filteredMatches}
            editMode={editMode}
            selectedTournamentId={selectedTournamentId}
            tournament={tournamentForMatches}
            onRefetch={refetch}
          />
        )
      )}

      {/* Results count */}
      {filteredMatches.length > 0 && (
        <MatchesResultsCount 
          matchCount={filteredMatches.length} 
          selectedTournament={selectedTournament}
          selectedRound={selectedRound}
          totalMatches={effectiveMatches.length}
        />
      )}
    </div>
  );
}

// Handmatige invoer lijst
function SimulationMatchList({ 
  matches, 
  courts,
  onSetScore,
  onAddSpecial,
  onRemoveSpecial,
  getMatchSpecials,
}: { 
  matches: any[]; 
  courts: any[];
  onSetScore: (matchId: string, team1: number, team2: number) => void;
  onAddSpecial: (matchId: string, playerId: string, playerName: string) => void;
  onRemoveSpecial: (matchId: string, playerId: string) => void;
  getMatchSpecials: (matchId: string) => any[];
}) {
  // Groepeer per baan
  const matchesByCourt = matches.reduce((acc, match) => {
    const courtName = match.court?.name || 'Onbekend';
    if (!acc[courtName]) {
      acc[courtName] = { matches: [], rowSide: match.court?.row_side || 'left' };
    }
    acc[courtName].matches.push(match);
    return acc;
  }, {} as Record<string, { matches: any[]; rowSide: string }>);

  const leftCourts = Object.entries(matchesByCourt).filter(([_, data]) => data.rowSide === 'left');
  const rightCourts = Object.entries(matchesByCourt).filter(([_, data]) => data.rowSide === 'right');

  return (
    <Card>
      <CardContent className="py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center text-green-700 border-b pb-2">Rij Links</h3>
            {leftCourts.map(([courtName, { matches: courtMatches }]) => (
              <div key={courtName} className="space-y-3">
                <div className="p-2 bg-amber-100 rounded text-center font-medium text-amber-800">
                  {courtName}
                </div>
                {courtMatches
                  .sort((a, b) => (a.match_number || 0) - (b.match_number || 0))
                  .map((match, idx) => (
                    <SimulationScoreInput
                      key={match.id}
                      match={match}
                      index={idx}
                      onSetScore={onSetScore}
                      onAddSpecial={onAddSpecial}
                      onRemoveSpecial={onRemoveSpecial}
                      matchSpecials={getMatchSpecials(match.id)}
                    />
                  ))}
              </div>
            ))}
          </div>

          {/* Rechts */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center text-red-700 border-b pb-2">Rij Rechts</h3>
            {rightCourts.map(([courtName, { matches: courtMatches }]) => (
              <div key={courtName} className="space-y-3">
                <div className="p-2 bg-amber-100 rounded text-center font-medium text-amber-800">
                  {courtName}
                </div>
                {courtMatches
                  .sort((a, b) => (a.match_number || 0) - (b.match_number || 0))
                  .map((match, idx) => (
                    <SimulationScoreInput
                      key={match.id}
                      match={match}
                      index={idx}
                      onSetScore={onSetScore}
                      onAddSpecial={onAddSpecial}
                      onRemoveSpecial={onRemoveSpecial}
                      matchSpecials={getMatchSpecials(match.id)}
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Read-only lijst voor random simulatie
function SimulationMatchListReadOnly({ matches, courts }: { matches: any[]; courts: any[] }) {
  // Groepeer per baan
  const matchesByCourt = matches.reduce((acc, match) => {
    const courtName = match.court?.name || 'Onbekend';
    if (!acc[courtName]) {
      acc[courtName] = { matches: [], rowSide: match.court?.row_side || 'left' };
    }
    acc[courtName].matches.push(match);
    return acc;
  }, {} as Record<string, { matches: any[]; rowSide: string }>);

  const leftCourts = Object.entries(matchesByCourt).filter(([_, data]) => data.rowSide === 'left');
  const rightCourts = Object.entries(matchesByCourt).filter(([_, data]) => data.rowSide === 'right');

  return (
    <Card>
      <CardContent className="py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center text-green-700 border-b pb-2">Rij Links</h3>
            {leftCourts.map(([courtName, { matches: courtMatches }]) => (
              <div key={courtName} className="space-y-3">
                <div className="p-2 bg-amber-100 rounded text-center font-medium text-amber-800">
                  {courtName}
                </div>
                {courtMatches
                  .sort((a, b) => (a.match_number || 0) - (b.match_number || 0))
                  .map((match, idx) => (
                    <SimulationMatchCardReadOnly key={match.id} match={match} index={idx} />
                  ))}
              </div>
            ))}
          </div>

          {/* Rechts */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center text-red-700 border-b pb-2">Rij Rechts</h3>
            {rightCourts.map(([courtName, { matches: courtMatches }]) => (
              <div key={courtName} className="space-y-3">
                <div className="p-2 bg-amber-100 rounded text-center font-medium text-amber-800">
                  {courtName}
                </div>
                {courtMatches
                  .sort((a, b) => (a.match_number || 0) - (b.match_number || 0))
                  .map((match, idx) => (
                    <SimulationMatchCardReadOnly key={match.id} match={match} index={idx} />
                  ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Read-only match card
function SimulationMatchCardReadOnly({ match, index }: { match: any; index: number }) {
  const score1 = match.simulated_team1_score ?? match.team1_score ?? '-';
  const score2 = match.simulated_team2_score ?? match.team2_score ?? '-';
  const specials = match.simulated_specials || [];

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardContent className="py-3 px-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-purple-700">Wedstrijd {index + 1}</span>
          <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">Simulatie</span>
        </div>
        
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          {/* Team 1 */}
          <div className="text-right text-sm">
            <div className="font-medium">{match.team1_player1?.name || 'Speler 1'}</div>
            <div className="text-muted-foreground">{match.team1_player2?.name || 'Speler 2'}</div>
          </div>
          
          {/* Score */}
          <div className="text-center px-3">
            <span className="text-xl font-bold">{score1} - {score2}</span>
          </div>
          
          {/* Team 2 */}
          <div className="text-left text-sm">
            <div className="font-medium">{match.team2_player1?.name || 'Speler 3'}</div>
            <div className="text-muted-foreground">{match.team2_player2?.name || 'Speler 4'}</div>
          </div>
        </div>

        {/* Specials */}
        {specials.length > 0 && (
          <div className="mt-2 text-xs text-orange-600">
            ⭐ {specials.map((s: any) => s.playerName).join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
