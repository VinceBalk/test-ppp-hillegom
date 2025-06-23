
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTournaments } from '@/hooks/useTournaments';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useMatches } from '@/hooks/useMatches';
import { useToast } from '@/hooks/use-toast';
import ScheduleHeader from '@/components/schedule/ScheduleHeader';
import RoundSelector from '@/components/schedule/RoundSelector';
import PreviewGenerator from '@/components/schedule/PreviewGenerator';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import ManualMatchBuilder from '@/components/schedule/ManualMatchBuilder';
import ScheduleDebug from '@/components/schedule/ScheduleDebug';
import ScheduleLoadingState from '@/components/schedule/ScheduleLoadingState';
import ScheduleErrorState from '@/components/schedule/ScheduleErrorState';
import TournamentNotFoundState from '@/components/schedule/TournamentNotFoundState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Schedule() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [selectedRound, setSelectedRound] = useState(1);
  const { toast } = useToast();
  
  const { tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const { tournamentPlayers } = useTournamentPlayers(tournamentId);
  const { matches, isLoading: matchesLoading } = useMatches(tournamentId);
  const { 
    preview, 
    generatePreview, 
    updateMatch, 
    clearPreview, 
    isGenerating 
  } = useSchedulePreview(tournamentId);
  const { 
    generateSchedule, 
    isGenerating: isGeneratingSchedule 
  } = useScheduleGeneration();

  const tournament = tournaments?.find(t => t.id === tournamentId);

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

  if (tournamentsLoading || matchesLoading) {
    return <ScheduleLoadingState />;
  }

  if (tournamentsError) {
    return <ScheduleErrorState error={tournamentsError} />;
  }

  if (!tournament) {
    return <TournamentNotFoundState />;
  }

  const roundKey = `round_${selectedRound}_schedule_generated` as keyof typeof tournament;
  const isRoundGenerated = tournament[roundKey];

  // Filter matches for the selected round
  const roundMatches = matches.filter(match => match.round_number === selectedRound);
  const hasExistingMatches = roundMatches.length > 0;

  return (
    <div className="space-y-6">
      <ScheduleHeader tournamentName={tournament.name} />

      <RoundSelector 
        selectedRound={selectedRound}
        onRoundChange={setSelectedRound}
      />

      {/* Show existing matches if they exist */}
      {hasExistingMatches && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bestaande Wedstrijden - Ronde {selectedRound}</CardTitle>
              <Badge variant="success">{roundMatches.length} wedstrijden</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {roundMatches.map((match) => (
                <div key={match.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="font-medium text-center">
                    <div className="text-blue-600">
                      {match.team1_player1?.name} & {match.team1_player2?.name}
                    </div>
                    <div className="text-sm text-muted-foreground my-1">vs</div>
                    <div className="text-red-600">
                      {match.team2_player1?.name} & {match.team2_player2?.name}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-center mt-2">
                    <div>{match.court?.name || match.court_number}</div>
                    <div>Status: {match.status}</div>
                    {match.team1_score !== undefined && match.team2_score !== undefined && (
                      <div>Score: {match.team1_score} - {match.team2_score}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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

      {tournamentId && (
        <ManualMatchBuilder tournamentId={tournamentId} />
      )}

      <ScheduleDebug 
        tournaments={tournaments || []}
        currentTournament={tournament}
        tournamentPlayers={tournamentPlayers}
        tournamentId={tournamentId}
      />
    </div>
  );
}
