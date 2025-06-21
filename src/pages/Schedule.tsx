
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useCourts } from '@/hooks/useCourts';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import ManualMatchBuilder from '@/components/schedule/ManualMatchBuilder';

export default function Schedule() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { tournaments } = useTournaments();
  const { courts } = useCourts();
  const { generateSchedule, isGenerating } = useScheduleGeneration();
  const { 
    preview, 
    availablePlayers, 
    generatePreview, 
    addManualMatch, 
    removeMatch, 
    clearPreview, 
    isGenerating: isGeneratingPreview 
  } = useSchedulePreview();
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [showManualBuilder, setShowManualBuilder] = useState(false);

  const currentTournament = tournamentId 
    ? tournaments.find(t => t.id === tournamentId)
    : tournaments.find(t => selectedTournament === t.id);

  const { tournamentPlayers } = useTournamentPlayers(currentTournament?.id);

  const handleSetupManualSchedule = async () => {
    if (!currentTournament) {
      console.error('No tournament selected');
      return;
    }

    console.log('Setting up manual 2v2 schedule for tournament:', currentTournament.name);

    try {
      await generatePreview(
        currentTournament.id,
        currentTournament.current_round || 1
      );
      setShowManualBuilder(true);
    } catch (error) {
      console.error('Error setting up manual schedule:', error);
    }
  };

  const handleAddMatch = (match: any) => {
    if (!currentTournament) return;
    
    addManualMatch(match, currentTournament.id, currentTournament.current_round || 1);
  };

  const handleApproveSchedule = () => {
    if (!currentTournament || !preview) {
      console.error('No tournament or preview available');
      return;
    }

    console.log('Approving manual schedule for tournament:', currentTournament.name);
    console.log('Preview data being sent:', preview);
    
    generateSchedule({
      tournamentId: currentTournament.id,
      roundNumber: currentTournament.current_round || 1,
      preview: preview
    });

    // Clear preview after approval
    clearPreview();
    setShowManualBuilder(false);

    // Navigate to matches page to show the results
    setTimeout(() => {
      navigate(`/matches?tournament=${currentTournament.id}`);
    }, 1000);
  };

  const handleRejectSchedule = () => {
    clearPreview();
    setShowManualBuilder(false);
  };

  const handleTournamentSelect = (tournament: any) => {
    setSelectedTournament(tournament.id);
    navigate(`/schedule/${tournament.id}`);
  };

  const canGenerateSchedule = currentTournament && tournamentPlayers.length >= 4;
  const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
  const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');

  // Show manual builder if available
  if (showManualBuilder && availablePlayers.length > 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
          <p className="text-muted-foreground">
            Handmatig 2v2 schema samenstellen voor {currentTournament?.name}
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button 
            onClick={handleApproveSchedule} 
            disabled={!preview || preview.matches.length === 0 || isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? 'Schema Opslaan...' : `Schema Opslaan (${preview?.matches.length || 0} wedstrijden)`}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRejectSchedule}
            disabled={isGenerating}
          >
            Annuleren
          </Button>
        </div>

        <ManualMatchBuilder
          availablePlayers={availablePlayers}
          onAddMatch={handleAddMatch}
          currentMatches={preview?.matches || []}
          onRemoveMatch={removeMatch}
        />
      </div>
    );
  }

  // Show preview if available
  if (preview && currentTournament && !showManualBuilder) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
          <p className="text-muted-foreground">
            2v2 Schema preview voor {currentTournament.name}
          </p>
        </div>

        <SchedulePreview
          preview={preview}
          onApprove={handleApproveSchedule}
          onReject={handleRejectSchedule}
          isApproving={isGenerating}
          tournamentName={currentTournament.name}
          roundNumber={currentTournament.current_round || 1}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
        <p className="text-muted-foreground">
          2v2 Wedstrijd planning en speelschema beheer
        </p>
      </div>

      {!currentTournament ? (
        <Card>
          <CardHeader>
            <CardTitle>Selecteer een Toernooi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tournaments
                .filter(t => t.status === 'open' || t.status === 'in_progress')
                .map((tournament) => (
                <Card 
                  key={tournament.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTournamentSelect(tournament)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{tournament.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tournament.start_date} - {tournament.end_date}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {tournament.status === 'open' ? 'Open' : 'Bezig'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Handmatig 2v2 Schema voor {currentTournament.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Spelers: {tournamentPlayers.length} / {currentTournament.max_players}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Ronde: {currentTournament.current_round || 1} van {currentTournament.total_rounds || 3}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {currentTournament.status === 'open' ? 'Open' : 
                     currentTournament.status === 'in_progress' ? 'Bezig' : 
                     currentTournament.status}
                  </Badge>
                </div>
              </div>

              {!canGenerateSchedule && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Er moeten minimaal 4 spelers toegewezen zijn om 2v2 wedstrijden te genereren.
                    Momenteel zijn er {tournamentPlayers.length} spelers toegewezen.
                  </AlertDescription>
                </Alert>
              )}

              {canGenerateSchedule && (
                <Alert className="mt-4">
                  <AlertDescription>
                    <strong>Handmatig 2v2 Schema overzicht:</strong><br />
                    Links groep: {leftPlayers.length} spelers<br />
                    Rechts groep: {rightPlayers.length} spelers<br />
                    Je kunt nu handmatig 2v2 wedstrijden samenstellen voor beide groepen.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-6 flex gap-4">
                <Button 
                  onClick={handleSetupManualSchedule}
                  disabled={!canGenerateSchedule || isGeneratingPreview}
                >
                  {isGeneratingPreview ? 'Spelers Laden...' : 'Handmatig 2v2 Schema Maken'}
                </Button>
                <Button variant="outline" onClick={() => navigate(`/matches?tournament=${currentTournament.id}`)}>
                  Wedstrijden Bekijken
                </Button>
                <Button variant="outline" onClick={() => navigate(`/tournaments/${currentTournament.id}/assign-players`)}>
                  Spelers Beheren
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Beschikbare Banen</CardTitle>
            </CardHeader>
            <CardContent>
              {courts.length === 0 ? (
                <p className="text-muted-foreground">
                  Geen banen beschikbaar. 
                  <Button variant="link" onClick={() => navigate('/courts')} className="p-0 ml-1">
                    Voeg banen toe
                  </Button>
                </p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {courts.filter(court => court.is_active).map((court) => (
                    <div 
                      key={court.id} 
                      className="p-3 border rounded-lg"
                      style={{ backgroundColor: court.background_color || '#f3f4f6' }}
                    >
                      <span className="font-medium">{court.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
