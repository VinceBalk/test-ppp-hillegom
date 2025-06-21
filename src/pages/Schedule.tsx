
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Calendar, Users, CheckCircle } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import TournamentMatches from '@/components/tournaments/TournamentMatches';

export default function Schedule() {
  const { tournamentId } = useParams<{ tournamentId?: string }>();
  const navigate = useNavigate();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || '');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [scheduleGenerated, setScheduleGenerated] = useState<boolean>(false);

  const { tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { tournamentPlayers, isLoading: playersLoading } = useTournamentPlayers(selectedTournamentId);
  const { 
    preview, 
    generatePreview, 
    updatePreviewMatch, 
    isGeneratingPreview 
  } = useSchedulePreview();
  const { generateSchedule, isGenerating } = useScheduleGeneration();

  console.log('=== SCHEDULE PAGE DEBUG ===');
  console.log('Tournament ID from URL:', tournamentId);
  console.log('Selected tournament ID:', selectedTournamentId);
  console.log('Current round:', currentRound);
  console.log('Schedule generated:', scheduleGenerated);

  useEffect(() => {
    if (tournamentId) {
      setSelectedTournamentId(tournamentId);
    }
  }, [tournamentId]);

  // Check if schedule has already been generated
  useEffect(() => {
    if (selectedTournamentId) {
      const tournament = tournaments.find(t => t.id === selectedTournamentId);
      if (tournament) {
        // Check if any round has been generated
        const hasGeneratedSchedule = tournament.round_1_generated || 
                                   tournament.round_2_generated || 
                                   tournament.round_3_generated;
        setScheduleGenerated(hasGeneratedSchedule);
        
        // Set current round based on what's been generated
        if (tournament.round_3_generated) setCurrentRound(3);
        else if (tournament.round_2_generated) setCurrentRound(2);
        else setCurrentRound(1);
      }
    }
  }, [selectedTournamentId, tournaments]);

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);
  const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
  const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');

  const handleGeneratePreview = () => {
    if (selectedTournamentId) {
      generatePreview({
        tournamentId: selectedTournamentId,
        roundNumber: currentRound
      });
    }
  };

  const handleApproveSchedule = () => {
    if (preview && selectedTournamentId) {
      generateSchedule({
        tournamentId: selectedTournamentId,
        roundNumber: currentRound,
        preview: preview
      });
      setScheduleGenerated(true);
    }
  };

  const isLoading = tournamentsLoading || playersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Schema Planning</h1>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!selectedTournament) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Schema Planning</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Toernooi niet gevonden. Ga terug naar de toernooien lijst.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schema Planning</h1>
          <p className="text-muted-foreground">Genereer wedstrijdschema voor {selectedTournament.name}</p>
        </div>
      </div>

      {/* Tournament Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {selectedTournament.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{tournamentPlayers.length} spelers ingeschreven</span>
            </div>
            <div>
              <span className="font-medium">Links groep:</span> {leftPlayers.length} spelers
            </div>
            <div>
              <span className="font-medium">Rechts groep:</span> {rightPlayers.length} spelers
            </div>
          </div>
        </CardContent>
      </Card>

      {scheduleGenerated ? (
        /* Show generated matches */
        <div className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Het wedstrijdschema is succesvol gegenereerd en opgeslagen. Hieronder zie je alle wedstrijden voor dit toernooi.
            </AlertDescription>
          </Alert>
          
          <TournamentMatches 
            tournamentId={selectedTournamentId} 
            tournamentName={selectedTournament.name}
          />
        </div>
      ) : (
        /* Show generation interface */
        <div className="space-y-6">
          {tournamentPlayers.length < 4 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Minimaal 4 spelers nodig om een schema te genereren. 
                Ga naar de toernooi instellingen om meer spelers toe te voegen.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Schema Genereren</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Huidige Ronde:</label>
                      <select 
                        value={currentRound} 
                        onChange={(e) => setCurrentRound(parseInt(e.target.value))}
                        className="border rounded px-3 py-2"
                      >
                        <option value={1}>Ronde 1</option>
                        <option value={2}>Ronde 2</option>
                        <option value={3}>Ronde 3</option>
                      </select>
                    </div>
                    
                    <Button 
                      onClick={handleGeneratePreview}
                      disabled={isGeneratingPreview}
                      className="w-full md:w-auto"
                    >
                      {isGeneratingPreview ? 'Preview Genereren...' : '2v2 Schema Preview Genereren'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {preview && (
                <SchedulePreview
                  preview={preview}
                  onApprove={handleApproveSchedule}
                  onReject={() => setScheduleGenerated(false)}
                  onUpdateMatch={updatePreviewMatch}
                  isApproving={isGenerating}
                  tournamentName={selectedTournament.name}
                  tournamentId={selectedTournamentId}
                  roundNumber={currentRound}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
