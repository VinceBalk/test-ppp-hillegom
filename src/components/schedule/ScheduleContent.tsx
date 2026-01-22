import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { useCourts } from '@/hooks/useCourts';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Users, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { ScheduleMatch } from '@/types/schedule';

interface ScheduleContentProps {
  urlTournamentId?: string;
}

export default function ScheduleContent({ urlTournamentId }: ScheduleContentProps) {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { tournaments } = useTournaments();
  const { courts } = useCourts();
  
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(urlTournamentId || '');
  const [selectedRound, setSelectedRound] = useState<string>('1');
  const [selectedRow, setSelectedRow] = useState<string>('all');
  
  const { matches, refetch: refetchMatches } = useMatches(selectedTournamentId);
  const { preview, generatePreview, isGenerating, clearPreview } = useSchedulePreview(selectedTournamentId);
  const { generateSchedule, isGenerating: isSaving } = useScheduleGeneration();

  // Get selected tournament
  const selectedTournament = tournaments?.find(t => t.id === selectedTournamentId);
  
  // Check round completion status
  const roundStatus = useMemo(() => {
    if (!matches || matches.length === 0) {
      return { round1Completed: false, round2Completed: false, round3Completed: false };
    }
    
    const round1Matches = matches.filter(m => m.round_number === 1);
    const round2Matches = matches.filter(m => m.round_number === 2);
    const round3Matches = matches.filter(m => m.round_number === 3);
    
    const round1Completed = round1Matches.length > 0 && round1Matches.every(m => m.status === 'completed');
    const round2Completed = round2Matches.length > 0 && round2Matches.every(m => m.status === 'completed');
    const round3Completed = round3Matches.length > 0 && round3Matches.every(m => m.status === 'completed');
    
    return { round1Completed, round2Completed, round3Completed };
  }, [matches]);

  // Check if rounds have matches (generated)
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

  // Can generate round 3 only if round 1 and 2 are completed
  const canGenerateRound3 = roundStatus.round1Completed && roundStatus.round2Completed && !roundsGenerated.round3;

  // Filter matches by selected round
  const filteredMatches = useMemo(() => {
    const roundNumber = parseInt(selectedRound);
    let roundMatches = matches?.filter(m => m.round_number === roundNumber) || [];
    
    // Also filter by row if not "all"
    if (selectedRow !== 'all' && courts) {
      const rowCourts = courts.filter(c => c.row_side === selectedRow).map(c => c.id);
      roundMatches = roundMatches.filter(m => m.court_id && rowCourts.includes(m.court_id));
    }
    
    return roundMatches;
  }, [matches, selectedRound, selectedRow, courts]);

  // Group matches by court
  const matchesByCourt = useMemo(() => {
    const grouped: Record<string, typeof filteredMatches> = {};
    
    filteredMatches.forEach(match => {
      const courtName = match.court?.name || 'Onbekend';
      if (!grouped[courtName]) {
        grouped[courtName] = [];
      }
      grouped[courtName].push(match);
    });
    
    // Sort matches within each court by match_number
    Object.keys(grouped).forEach(courtName => {
      grouped[courtName].sort((a, b) => (a.match_number || 0) - (b.match_number || 0));
    });
    
    return grouped;
  }, [filteredMatches]);

  // Separate courts by row
  const { leftCourts, rightCourts } = useMemo(() => {
    if (!courts) return { leftCourts: [], rightCourts: [] };
    
    const activeCourts = courts.filter(c => c.is_active);
    const left = activeCourts
      .filter(c => c.row_side === 'left')
      .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));
    const right = activeCourts
      .filter(c => c.row_side === 'right')
      .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));
    
    return { leftCourts: left, rightCourts: right };
  }, [courts]);

  // Check if we need to show generation controls
  const showGenerationControls = useMemo(() => {
    if (!selectedTournament) return false;
    if (selectedTournament.status === 'completed') return false;
    
    const roundNumber = parseInt(selectedRound);
    
    // Round 3 can only be generated if R1 and R2 are completed
    if (roundNumber === 3) {
      return canGenerateRound3;
    }
    
    // For rounds 1 and 2, show if not yet generated
    if (roundNumber === 1 && !roundsGenerated.round1) return true;
    if (roundNumber === 2 && !roundsGenerated.round2 && roundsGenerated.round1) return true;
    
    return false;
  }, [selectedTournament, selectedRound, roundsGenerated, canGenerateRound3]);

  // Handle tournament selection
  useEffect(() => {
    if (urlTournamentId) {
      setSelectedTournamentId(urlTournamentId);
    }
  }, [urlTournamentId]);

  // Handle generate preview
  const handleGeneratePreview = async () => {
    const roundNumber = parseInt(selectedRound);
    await generatePreview(roundNumber);
  };

  // Handle approve schedule
  const handleApproveSchedule = async () => {
    if (!preview || !selectedTournamentId) return;
    
    const roundNumber = parseInt(selectedRound);
    await generateSchedule({
      tournamentId: selectedTournamentId,
      roundNumber,
      preview,
    });
    
    await refetchMatches();
    await clearPreview(roundNumber);
  };

  // Render match card
  const renderMatchCard = (match: any, index: number) => {
    const isCompleted = match.status === 'completed';
    const team1Won = isCompleted && (match.team1_score || 0) > (match.team2_score || 0);
    const team2Won = isCompleted && (match.team2_score || 0) > (match.team1_score || 0);
    
    return (
      <Card key={match.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Wedstrijd {index + 1}
            </span>
            <Badge variant={isCompleted ? 'default' : 'secondary'}>
              {isCompleted ? 'Afgerond' : 'Gepland'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-3">
            {/* Team 1 */}
            <div className={`flex items-center justify-between p-2 rounded ${team1Won ? 'bg-green-50 border border-green-200' : ''}`}>
              <div className="flex-1">
                <p className="text-sm font-medium">{match.team1_player1?.name || 'Speler 1'}</p>
                <p className="text-sm text-muted-foreground">{match.team1_player2?.name || 'Speler 2'}</p>
              </div>
              <div className="text-xl font-bold tabular-nums">
                {match.team1_score ?? '-'}
              </div>
            </div>
            
            <div className="text-center text-xs text-muted-foreground">vs</div>
            
            {/* Team 2 */}
            <div className={`flex items-center justify-between p-2 rounded ${team2Won ? 'bg-green-50 border border-green-200' : ''}`}>
              <div className="flex-1">
                <p className="text-sm font-medium">{match.team2_player1?.name || 'Speler 3'}</p>
                <p className="text-sm text-muted-foreground">{match.team2_player2?.name || 'Speler 4'}</p>
              </div>
              <div className="text-xl font-bold tabular-nums">
                {match.team2_score ?? '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render preview match card
  const renderPreviewMatchCard = (match: ScheduleMatch, index: number) => {
    return (
      <Card key={match.id} className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardHeader className="pb-2 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Wedstrijd {index + 1}
            </span>
            <Badge variant="outline">Preview</Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-3">
            {/* Team 1 */}
            <div className="flex items-center justify-between p-2 rounded bg-background">
              <div className="flex-1">
                <p className="text-sm font-medium">{match.team1_player1_name}</p>
                <p className="text-sm text-muted-foreground">{match.team1_player2_name}</p>
              </div>
            </div>
            
            <div className="text-center text-xs text-muted-foreground">vs</div>
            
            {/* Team 2 */}
            <div className="flex items-center justify-between p-2 rounded bg-background">
              <div className="flex-1">
                <p className="text-sm font-medium">{match.team2_player1_name}</p>
                <p className="text-sm text-muted-foreground">{match.team2_player2_name}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render court section
  const renderCourtSection = (courtName: string, courtMatches: any[], isPreview: boolean = false) => {
    return (
      <div key={courtName} className="space-y-3">
        <h4 className="font-semibold text-lg border-b pb-2">{courtName}</h4>
        <div className="space-y-3">
          {courtMatches.map((match, index) => 
            isPreview ? renderPreviewMatchCard(match, index) : renderMatchCard(match, index)
          )}
        </div>
      </div>
    );
  };

  // Render row section (left or right)
  const renderRowSection = (rowName: string, rowCourts: any[], isPreview: boolean = false) => {
    const courtNames = rowCourts.map(c => c.name);
    
    // Get matches or preview matches for this row
    let rowMatches: Record<string, any[]> = {};
    
    if (isPreview && preview) {
      const previewMatches = rowName === 'Rij Links' 
        ? preview.leftGroupMatches 
        : preview.rightGroupMatches;
      
      // Group preview matches by court
      previewMatches.forEach(match => {
        const courtName = match.court_name || 'Onbekend';
        if (!rowMatches[courtName]) {
          rowMatches[courtName] = [];
        }
        rowMatches[courtName].push(match);
      });
    } else {
      // Filter matchesByCourt for this row
      courtNames.forEach(courtName => {
        if (matchesByCourt[courtName]) {
          rowMatches[courtName] = matchesByCourt[courtName];
        }
      });
    }

    const hasMatches = Object.keys(rowMatches).length > 0;

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          {rowName}
        </h3>
        
        {hasMatches ? (
          <div className="space-y-6">
            {rowCourts.map(court => {
              const courtMatchList = rowMatches[court.name] || [];
              if (courtMatchList.length === 0) return null;
              return renderCourtSection(court.name, courtMatchList, isPreview);
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Geen wedstrijden voor deze rij in deze ronde.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // No tournament selected
  if (!selectedTournamentId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Selecteer een toernooi</h3>
              <p className="text-muted-foreground">Kies een toernooi om het schema te bekijken</p>
            </div>
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger className="w-full max-w-xs mx-auto">
                <SelectValue placeholder="Selecteer toernooi" />
              </SelectTrigger>
              <SelectContent>
                {tournaments?.map(tournament => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament selector (if not from URL) */}
      {!urlTournamentId && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <label className="text-sm font-medium">Toernooi:</label>
              <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Selecteer toernooi" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments?.map(tournament => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Round tabs and row filter */}
      <div className="space-y-4">
        <Tabs value={selectedRound} onValueChange={setSelectedRound}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="1" className="flex items-center gap-2">
                Ronde 1
                {roundStatus.round1Completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
              </TabsTrigger>
              <TabsTrigger value="2" className="flex items-center gap-2">
                Ronde 2
                {roundStatus.round2Completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
              </TabsTrigger>
              <TabsTrigger 
                value="3" 
                disabled={!roundStatus.round1Completed || !roundStatus.round2Completed}
                className="flex items-center gap-2"
              >
                Ronde 3
                {(!roundStatus.round1Completed || !roundStatus.round2Completed) && (
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

          {/* Generation controls for organizers */}
          {showGenerationControls && hasRole('organisator') && (
            <Card className="mt-4">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <span className="text-sm">
                      {preview 
                        ? `Preview gegenereerd: ${preview.totalMatches} wedstrijden` 
                        : `Ronde ${selectedRound} schema nog niet gegenereerd`
                      }
                    </span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {!preview ? (
                      <Button 
                        onClick={handleGeneratePreview} 
                        disabled={isGenerating}
                        className="w-full sm:w-auto"
                      >
                        {isGenerating ? 'Genereren...' : 'Preview Genereren'}
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => clearPreview(parseInt(selectedRound))}
                          className="w-full sm:w-auto"
                        >
                          Annuleren
                        </Button>
                        <Button 
                          onClick={handleApproveSchedule} 
                          disabled={isSaving}
                          className="w-full sm:w-auto"
                        >
                          {isSaving ? 'Opslaan...' : 'Goedkeuren & Opslaan'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Round 3 locked message */}
          {selectedRound === '3' && (!roundStatus.round1Completed || !roundStatus.round2Completed) && (
            <Alert className="mt-4">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Ronde 3 wordt automatisch gegenereerd zodra Ronde 1 en Ronde 2 volledig zijn afgerond.
              </AlertDescription>
            </Alert>
          )}

          {/* Content for each round tab */}
          <TabsContent value={selectedRound} className="mt-6">
            {/* Show preview if available */}
            {preview && showGenerationControls ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {(selectedRow === 'all' || selectedRow === 'left') && (
                  renderRowSection('Rij Links', leftCourts, true)
                )}
                {(selectedRow === 'all' || selectedRow === 'right') && (
                  renderRowSection('Rij Rechts', rightCourts, true)
                )}
              </div>
            ) : filteredMatches.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {(selectedRow === 'all' || selectedRow === 'left') && (
                  renderRowSection('Rij Links', leftCourts, false)
                )}
                {(selectedRow === 'all' || selectedRow === 'right') && (
                  renderRowSection('Rij Rechts', rightCourts, false)
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">Geen wedstrijden</h3>
                      <p className="text-muted-foreground">
                        Er zijn nog geen wedstrijden voor Ronde {selectedRound}
                        {selectedRow !== 'all' && ` in ${selectedRow === 'left' ? 'Rij Links' : 'Rij Rechts'}`}.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
