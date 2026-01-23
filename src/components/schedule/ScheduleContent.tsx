import { useState, useEffect, useMemo } from 'react';
import { useTournaments } from '@/hooks/useTournaments';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useMatches } from '@/hooks/useMatches';
import { useCourts } from '@/hooks/useCourts';
import { useToast } from '@/hooks/use-toast';
import TournamentSelector from '@/components/schedule/TournamentSelector';
import PreviewGenerator from '@/components/schedule/PreviewGenerator';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import ManualMatchBuilder from '@/components/schedule/ManualMatchBuilder';
import ScheduleMatchesDisplay from '@/components/schedule/ScheduleMatchesDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Lock } from 'lucide-react';

interface ScheduleContentProps {
  urlTournamentId?: string;
}

export default function ScheduleContent({ urlTournamentId }: ScheduleContentProps) {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(urlTournamentId || '');
  const [selectedRound, setSelectedRound] = useState<string>('1');
  const [selectedRow, setSelectedRow] = useState<string>('all');
  const { toast } = useToast();
  
  const { tournaments: allTournaments } = useTournaments();
  const tournaments = allTournaments?.filter(t => t.status !== 'completed');
  const { tournamentPlayers } = useTournamentPlayers(selectedTournamentId);
  const { matches, refetch: refetchMatches } = useMatches(selectedTournamentId);
  const { courts } = useCourts();
  const { 
    preview, 
    generatePreview, 
    updateMatch, 
    clearPreview, 
    isGenerating,
    courtsLoading 
  } = useSchedulePreview(selectedTournamentId);
  const { 
    generateSchedule, 
    isGenerating: isGeneratingSchedule 
  } = useScheduleGeneration();

  const tournament = tournaments?.find(t => t.id === selectedTournamentId);

  // Set initial tournament from URL parameter OR select first available tournament
  useEffect(() => {
    if (urlTournamentId && tournaments?.length > 0) {
      setSelectedTournamentId(urlTournamentId);
    } else if (!selectedTournamentId && tournaments?.length > 0) {
      // Automatisch eerste (komende/actieve) toernooi selecteren
      setSelectedTournamentId(tournaments[0].id);
    }
  }, [urlTournamentId, tournaments, selectedTournamentId]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (preview) {
        event.preventDefault();
        event.returnValue = "Weet je zeker dat je de pagina wilt verlaten? Het schema is nog niet opgeslagen.";
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [preview]);

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

  // Check if we need to show generation controls for current round
  const showGenerationControls = useMemo(() => {
    if (!tournament) return false;
    if (tournament.status === 'completed') return false;
    
    const roundNumber = parseInt(selectedRound);
    
    // Round 3 can only be generated if R1 and R2 are completed
    if (roundNumber === 3) {
      return canGenerateRound3;
    }
    
    // For rounds 1 and 2, show if not yet generated
    if (roundNumber === 1 && !roundsGenerated.round1) return true;
    if (roundNumber === 2 && !roundsGenerated.round2 && roundsGenerated.round1) return true;
    
    return false;
  }, [tournament, selectedRound, roundsGenerated, canGenerateRound3]);

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
    clearPreview();
  };

  const handleGeneratePreview = async () => {
    if (!tournament) return;
    
    try {
      const roundNumber = parseInt(selectedRound);
      console.log('Generating preview for tournament:', tournament.id, 'round:', roundNumber);
      
      // Check of deze ronde al gegenereerd is
      if (roundNumber === 1 && tournament.round_1_schedule_generated) {
        toast({
          title: "Schema al gegenereerd",
          description: "Ronde 1 is al eerder gegenereerd en goedgekeurd.",
          variant: "destructive",
        });
        return;
      }
      
      if (roundNumber === 2 && tournament.round_2_schedule_generated) {
        toast({
          title: "Schema al gegenereerd",
          description: "Ronde 2 is al eerder gegenereerd en goedgekeurd.",
          variant: "destructive",
        });
        return;
      }

      await generatePreview(roundNumber);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Fout bij genereren",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden.",
        variant: "destructive",
      });
    }
  };

  const handleApproveSchedule = async () => {
    if (!tournament || !preview) return;
    
    try {
      const roundNumber = parseInt(selectedRound);
      console.log('Approving schedule for tournament:', tournament.id, 'round:', roundNumber);
      
      generateSchedule({ 
        tournamentId: tournament.id, 
        roundNumber, 
        preview 
      });
      
      await refetchMatches();
      clearPreview();
    } catch (error) {
      console.error('Error approving schedule:', error);
    }
  };

  // Geen toernooien
  if (!tournaments || tournaments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geen Toernooien Gevonden</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Er zijn nog geen toernooien aangemaakt. Maak eerst een toernooi aan.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasMatchesForRound = filteredMatches.length > 0;

  return (
    <>
      {/* Tournament Selection */}
      <TournamentSelector
        tournaments={tournaments}
        selectedTournamentId={selectedTournamentId}
        onTournamentChange={handleTournamentChange}
        selectedTournament={tournament}
      />

      {/* Show rest of the interface only when tournament is selected */}
      {selectedTournamentId && tournament && (
        <>
          {/* Round Tabs and Row Filter */}
          <Card className="mt-4">
            <CardContent className="py-4">
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
              </Tabs>
            </CardContent>
          </Card>

          {/* Ronde 3 locked message */}
          {selectedRound === '3' && (!roundStatus.round1Completed || !roundStatus.round2Completed) && (
            <Card className="mt-4 border-amber-200 bg-amber-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <Lock className="h-4 w-4" />
                  <span>
                    Ronde 3 wordt automatisch gegenereerd zodra Ronde 1 en Ronde 2 volledig zijn afgerond.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bestaande matches tonen voor geselecteerde ronde */}
          {hasMatchesForRound && (
            <ScheduleMatchesDisplay 
              matches={filteredMatches}
              roundNumber={parseInt(selectedRound)}
            />
          )}

          {/* Preview generator - alleen als nog niet gegenereerd voor deze ronde */}
          {!preview && showGenerationControls && !hasMatchesForRound && (
            <PreviewGenerator
              selectedRound={parseInt(selectedRound)}
              onGeneratePreview={handleGeneratePreview}
              isGenerating={isGenerating}
              courtsLoading={courtsLoading}
            />
          )}

          {/* Al gegenereerd melding voor deze ronde */}
          {!showGenerationControls && !preview && !hasMatchesForRound && selectedRound !== '3' && (
            <Card className="mt-4">
              <CardContent className="py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Er zijn nog geen wedstrijden voor Ronde {selectedRound}
                    {selectedRow !== 'all' && ` in ${selectedRow === 'left' ? 'Rij Links' : 'Rij Rechts'}`}.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview tonen met edit mogelijkheid */}
          {preview && (
            <SchedulePreview
              preview={preview}
              onApprove={handleApproveSchedule}
              onReject={clearPreview}
              onUpdateMatch={updateMatch}
              isApproving={isGeneratingSchedule}
              tournamentName={tournament.name}
              tournamentId={tournament.id}
              roundNumber={parseInt(selectedRound)}
            />
          )}

          {/* Handmatig wedstrijden toevoegen - alleen als er nog geen wedstrijden zijn voor deze ronde */}
          {!hasMatchesForRound && (
            <ManualMatchBuilder tournamentId={selectedTournamentId} initialRound={parseInt(selectedRound)} />
          )}
        </>
      )}

      {/* Geen toernooi geselecteerd */}
      {!selectedTournamentId && (
        <Card>
          <CardHeader>
            <CardTitle>Selecteer een Toernooi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Selecteer eerst een toernooi hierboven om een schema te kunnen genereren.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
