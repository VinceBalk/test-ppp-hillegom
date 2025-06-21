import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Calendar } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import ManualMatchBuilder from '@/components/schedule/ManualMatchBuilder';
import ScheduleDebug from '@/components/schedule/ScheduleDebug';

export default function Schedule() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [selectedRound, setSelectedRound] = useState(1);
  
  const { tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const { 
    preview, 
    generatePreview, 
    updateMatch, 
    clearPreview, 
    isGenerating 
  } = useSchedulePreview();
  const { 
    generateSchedule, 
    isGenerating: isGeneratingSchedule 
  } = useScheduleGeneration();

  useEffect(() => {
    if (!tournamentId) {
      navigate('/tournaments');
    }
  }, [tournamentId, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (preview) {
        event.preventDefault();
        event.returnValue = "Weet je zeker dat je de pagina wilt verlaten? Het schema is nog niet opgeslagen.";
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [preview]);

  const handleGeneratePreview = async () => {
    if (!tournament) return;
    
    try {
      console.log('Generating preview for tournament:', tournament.id, 'round:', selectedRound);
      await generatePreview(tournament.id, selectedRound);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleApproveSchedule = async () => {
    if (!tournament || !preview) return;
    
    try {
      console.log('Approving schedule for tournament:', tournament.id, 'round:', selectedRound);
      await generateSchedule(tournament.id, selectedRound);
      clearPreview();
    } catch (error) {
      console.error('Error approving schedule:', error);
    }
  };

  if (tournamentsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schema Genereren</h1>
          <p className="text-muted-foreground">Genereer wedstrijdschema's voor toernooien</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (tournamentsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schema Genereren</h1>
          <p className="text-muted-foreground">Genereer wedstrijdschema's voor toernooien</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fout bij laden van toernooien: {tournamentsError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schema Genereren</h1>
          <p className="text-muted-foreground">Genereer wedstrijdschema's voor toernooien</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Toernooi niet gevonden.{' '}
            <Button 
              variant="link" 
              className="p-0 ml-1 h-auto"
              onClick={() => navigate('/tournaments')}
            >
              Ga terug naar toernooien
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const tournament = tournaments?.find(t => t.id === tournamentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/tournaments')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar Toernooien
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schema Genereren</h1>
          <p className="text-muted-foreground">
            Genereer wedstrijdschema voor {tournament.name}
          </p>
        </div>
      </div>

      {/* Round Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ronde Selectie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[1, 2, 3].map((round) => (
              <Button
                key={round}
                variant={selectedRound === round ? "default" : "outline"}
                onClick={() => setSelectedRound(round)}
              >
                Ronde {round}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate Preview */}
      {!preview && (
        <Card>
          <CardHeader>
            <CardTitle>2v2 Schema Genereren</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleGeneratePreview} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Preview Genereren...' : `Preview Genereren voor Ronde ${selectedRound}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
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

      {/* Manual Match Builder */}
      <ManualMatchBuilder tournamentId={tournament.id} />

      {/* Debug Info */}
      <ScheduleDebug 
        tournament={tournament}
        selectedRound={selectedRound}
        preview={preview}
      />
    </div>
  );
}
