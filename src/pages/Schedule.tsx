
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTournaments } from '@/hooks/useTournaments';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import ScheduleHeader from '@/components/schedule/ScheduleHeader';
import RoundSelector from '@/components/schedule/RoundSelector';
import PreviewGenerator from '@/components/schedule/PreviewGenerator';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import ManualMatchBuilder from '@/components/schedule/ManualMatchBuilder';
import ScheduleDebug from '@/components/schedule/ScheduleDebug';
import ScheduleLoadingState from '@/components/schedule/ScheduleLoadingState';
import ScheduleErrorState from '@/components/schedule/ScheduleErrorState';
import TournamentNotFoundState from '@/components/schedule/TournamentNotFoundState';

export default function Schedule() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [selectedRound, setSelectedRound] = useState(1);
  const [manualMatches, setManualMatches] = useState<any[]>([]);
  
  const { tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const { tournamentPlayers } = useTournamentPlayers(tournamentId);
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
      await generatePreview();
    } catch (error) {
      console.error('Error generating preview:', error);
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

  const handleAddManualMatch = (match: any) => {
    setManualMatches(prev => [...prev, match]);
  };

  const handleRemoveManualMatch = (index: number) => {
    setManualMatches(prev => prev.filter((_, i) => i !== index));
  };

  if (tournamentsLoading) {
    return <ScheduleLoadingState />;
  }

  if (tournamentsError) {
    return <ScheduleErrorState error={tournamentsError} />;
  }

  if (!tournament) {
    return <TournamentNotFoundState />;
  }

  return (
    <div className="space-y-6">
      <ScheduleHeader tournamentName={tournament.name} />

      <RoundSelector 
        selectedRound={selectedRound}
        onRoundChange={setSelectedRound}
      />

      {!preview && (
        <PreviewGenerator
          selectedRound={selectedRound}
          onGeneratePreview={handleGeneratePreview}
          isGenerating={isGenerating}
        />
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

      <ManualMatchBuilder 
        availablePlayers={tournamentPlayers}
        onAddMatch={handleAddManualMatch}
        currentMatches={manualMatches}
        onRemoveMatch={handleRemoveManualMatch}
      />

      <ScheduleDebug 
        tournaments={tournaments || []}
        currentTournament={tournament}
        tournamentPlayers={tournamentPlayers}
        tournamentId={tournamentId}
      />
    </div>
  );
}
