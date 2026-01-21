import { useState, useEffect } from 'react';
import { useTournaments } from '@/hooks/useTournaments';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useMatches } from '@/hooks/useMatches';
import { useToast } from '@/hooks/use-toast';
import TournamentSelector from '@/components/schedule/TournamentSelector';
import PreviewGenerator from '@/components/schedule/PreviewGenerator';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import ManualMatchBuilder from '@/components/schedule/ManualMatchBuilder';
import ScheduleMatchesDisplay from '@/components/schedule/ScheduleMatchesDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScheduleContentProps {
  urlTournamentId?: string;
}

export default function ScheduleContent({ urlTournamentId }: ScheduleContentProps) {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(urlTournamentId || '');
  const { toast } = useToast();
  
  const { tournaments: allTournaments } = useTournaments();
  const tournaments = allTournaments?.filter(t => t.status !== 'completed');
  const { tournamentPlayers } = useTournamentPlayers(selectedTournamentId);
  const { matches } = useMatches(selectedTournamentId);
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

  // Set initial tournament from URL parameter
  useEffect(() => {
    if (urlTournamentId && tournaments?.length > 0) {
      setSelectedTournamentId(urlTournamentId);
    }
  }, [urlTournamentId, tournaments]);

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

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
    clearPreview();
  };

  const handleGeneratePreview = async () => {
    if (!tournament) return;
    
    try {
      console.log('Generating preview for tournament:', tournament.id);
      
      // Check of R1+R2 al gegenereerd zijn
      if (tournament.round_1_schedule_generated && tournament.round_2_schedule_generated) {
        toast({
          title: "Schema al gegenereerd",
          description: "Ronde 1 en 2 zijn al eerder gegenereerd en goedgekeurd.",
          variant: "destructive",
        });
        return;
      }

      // Genereer voor ronde 1 (R1 en R2 samen)
      await generatePreview(1);
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
      console.log('Approving schedule for tournament:', tournament.id);
      // Sla op als ronde 1 (bevat R1+R2 matches)
      generateSchedule({ 
        tournamentId: tournament.id, 
        roundNumber: 1, 
        preview 
      });
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

  const isScheduleGenerated = tournament?.round_1_schedule_generated && tournament?.round_2_schedule_generated;
  
  // Filter matches voor R1+R2 (niet R3)
  const r1r2Matches = matches.filter(match => match.round_number === 1 || match.round_number === 2);
  const hasExistingMatches = r1r2Matches.length > 0;

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
          {/* Bestaande matches tonen */}
          {hasExistingMatches && (
            <ScheduleMatchesDisplay 
              matches={r1r2Matches}
              roundNumber={1}
            />
          )}

          {/* Preview generator - alleen als nog niet gegenereerd */}
          {!preview && !isScheduleGenerated && !hasExistingMatches && (
            <PreviewGenerator
              selectedRound={1}
              onGeneratePreview={handleGeneratePreview}
              isGenerating={isGenerating}
              courtsLoading={courtsLoading}
            />
          )}

          {/* Al gegenereerd melding */}
          {isScheduleGenerated && !preview && !hasExistingMatches && (
            <div className="text-center py-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Schema al gegenereerd
                </h3>
                <p className="text-blue-700">
                  Het schema voor ronde 1 en 2 is al eerder gegenereerd en goedgekeurd.
                </p>
              </div>
            </div>
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
              roundNumber={1}
            />
          )}

          {/* Handmatig wedstrijden toevoegen */}
          <ManualMatchBuilder tournamentId={selectedTournamentId} initialRound={1} />
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
