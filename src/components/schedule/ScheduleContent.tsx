
import { useState, useEffect } from 'react';
import { useTournaments } from '@/hooks/useTournaments';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useMatches } from '@/hooks/useMatches';
import { useToast } from '@/hooks/use-toast';
import TournamentSelector from '@/components/schedule/TournamentSelector';
import RoundSelector from '@/components/schedule/RoundSelector';
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
  const [selectedRound, setSelectedRound] = useState(1);
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
    isGenerating 
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
    setSelectedRound(1); // Reset round when tournament changes
    clearPreview(); // Clear any existing preview
  };

  const handleGeneratePreview = async () => {
    if (!tournament) return;
    
    try {
      console.log('Generating preview for tournament:', tournament.id, 'round:', selectedRound);
      
      // Check if this round has already been generated and approved
      const roundKey = `round_${selectedRound}_schedule_generated` as keyof typeof tournament;
      if (tournament[roundKey]) {
        toast({
          title: "Schema al gegenereerd",
          description: `Ronde ${selectedRound} is al eerder gegenereerd en goedgekeurd.`,
          variant: "destructive",
        });
        return;
      }

      // For round 3, verify rounds 1 and 2 are complete
      if (selectedRound === 3) {
        if (!tournament.round_1_schedule_generated || !tournament.round_2_schedule_generated) {
          toast({
            title: "Vorige rondes niet compleet",
            description: "Ronde 1 en 2 moeten eerst gegenereerd zijn voordat je ronde 3 kunt genereren.",
            variant: "destructive",
          });
          return;
        }
      }

      await generatePreview(selectedRound);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Fout bij genereren",
        description: "Er is een fout opgetreden bij het genereren van het schema.",
        variant: "destructive",
      });
    }
  };

  const handleApproveSchedule = async () => {
    if (!tournament || !preview) return;
    
    try {
      console.log('Approving schedule for tournament:', tournament.id, 'round:', selectedRound);
      generateSchedule({ 
        tournamentId: tournament.id, 
        roundNumber: selectedRound, 
        preview 
      });
      clearPreview();
    } catch (error) {
      console.error('Error approving schedule:', error);
    }
  };

  // Show message if no tournaments exist
  if (!tournaments || tournaments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geen Toernooien Gevonden</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Er zijn nog geen toernooien aangemaakt. Maak eerst een toernooi aan voordat je een schema kunt genereren.
          </p>
        </CardContent>
      </Card>
    );
  }

  const roundKey = `round_${selectedRound}_schedule_generated` as keyof typeof tournament;
  const isRoundGenerated = tournament && tournament[roundKey];

  // Filter matches for the selected round
  const roundMatches = matches.filter(match => match.round_number === selectedRound);
  const hasExistingMatches = roundMatches.length > 0;

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
          <RoundSelector 
            selectedRound={selectedRound}
            onRoundChange={setSelectedRound}
          />

          {/* Show existing matches with same styling as matches page */}
          {hasExistingMatches && (
            <ScheduleMatchesDisplay 
              matches={roundMatches}
              roundNumber={selectedRound}
            />
          )}

          {!preview && !isRoundGenerated && !hasExistingMatches && (
            <PreviewGenerator
              selectedRound={selectedRound}
              onGeneratePreview={handleGeneratePreview}
              isGenerating={isGenerating}
            />
          )}

          {isRoundGenerated && !preview && !hasExistingMatches && (
            <div className="text-center py-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Ronde {selectedRound} al gegenereerd
                </h3>
                <p className="text-blue-700">
                  Het schema voor ronde {selectedRound} is al eerder gegenereerd en goedgekeurd.
                </p>
              </div>
            </div>
          )}


          {preview && (
            <SchedulePreview
              preview={preview}
              onApprove={handleApproveSchedule}
              onReject={clearPreview}
              onUpdateMatch={updateMatch}
              isApproving={isGeneratingSchedule}
              tournamentName={tournament.name}
              tournamentId={tournament.id}
              roundNumber={selectedRound}
            />
          )}

          {/* Handmatig wedstrijden toevoegen - beschikbaar voor alle rondes */}
          <ManualMatchBuilder tournamentId={selectedTournamentId} initialRound={selectedRound} />
        </>
      )}

      {/* Show message when no tournament is selected */}
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
