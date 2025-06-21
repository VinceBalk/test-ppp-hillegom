import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, AlertCircle } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import ScheduleDebug from '@/components/schedule/ScheduleDebug';

export default function Schedule() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { tournaments, isLoading: tournamentsLoading } = useTournaments();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || '');

  console.log('=== SCHEDULE DEBUG ===');
  console.log('Tournament ID from URL:', tournamentId);
  console.log('Selected Tournament ID:', selectedTournamentId);

  // Find the current tournament
  const currentTournament = tournaments.find(t => 
    t.id === (tournamentId || selectedTournamentId)
  );

  const { tournamentPlayers = [], isLoading: playersLoading } = useTournamentPlayers(
    currentTournament?.id
  );

  const { preview, generatePreview, updateMatch, clearPreview, isGenerating } = useSchedulePreview(
    currentTournament?.id
  );

  const { generateSchedule, isGenerating: isSaving } = useScheduleGeneration();

  if (tournamentsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
          <p className="text-muted-foreground">2v2 Wedstrijd planning en speelschema beheer</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // No tournament selected - show tournament selector
  if (!currentTournament) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
          <p className="text-muted-foreground">2v2 Wedstrijd planning en speelschema beheer</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecteer een Toernooi</CardTitle>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Geen toernooien gevonden. Maak eerst een toernooi aan.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tournaments
                  .filter(t => t.status === 'open' || t.status === 'in_progress')
                  .map((tournament) => (
                  <Card 
                    key={tournament.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedTournamentId(tournament.id);
                      navigate(`/schedule/${tournament.id}`);
                    }}
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
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tournament selected - show schedule interface
  const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
  const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');
  const canGenerateSchedule = tournamentPlayers.length >= 4;

  const handleGeneratePreview = async () => {
    try {
      await generatePreview();
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleApproveSchedule = () => {
    if (preview && currentTournament) {
      generateSchedule({
        tournamentId: currentTournament.id,
        roundNumber: currentTournament.current_round || 1,
        preview
      });
      clearPreview();
    }
  };

  const handleRejectSchedule = () => {
    clearPreview();
  };

  // Show preview if available
  if (preview) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
          <p className="text-muted-foreground">2v2 Wedstrijd planning en speelschema beheer</p>
        </div>

        <SchedulePreview
          preview={preview}
          onApprove={handleApproveSchedule}
          onReject={handleRejectSchedule}
          onUpdateMatch={updateMatch}
          isApproving={isSaving}
          tournamentName={currentTournament.name}
          tournamentId={currentTournament.id}
          roundNumber={currentTournament.current_round || 1}
        />

        <ScheduleDebug
          tournaments={tournaments}
          currentTournament={currentTournament}
          tournamentPlayers={tournamentPlayers}
          tournamentId={tournamentId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
        <p className="text-muted-foreground">2v2 Wedstrijd planning en speelschema beheer</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            2v2 Schema voor {currentTournament.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {playersLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2">Spelers laden...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tournament Info */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Spelers: {tournamentPlayers.length} / {currentTournament.max_players || 16}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Status: {currentTournament.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Ronde: {currentTournament.current_round || 1}
                  </Badge>
                </div>
              </div>

              {/* Player Groups Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Links Groep</h4>
                  <p className="text-sm text-muted-foreground">
                    {leftPlayers.length} spelers
                  </p>
                  {leftPlayers.map(tp => (
                    <div key={tp.id} className="text-sm">
                      {tp.player.name}
                    </div>
                  ))}
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Rechts Groep</h4>
                  <p className="text-sm text-muted-foreground">
                    {rightPlayers.length} spelers
                  </p>
                  {rightPlayers.map(tp => (
                    <div key={tp.id} className="text-sm">
                      {tp.player.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              {!canGenerateSchedule && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Er moeten minimaal 4 spelers toegewezen zijn om 2v2 wedstrijden te genereren.
                    Momenteel zijn er {tournamentPlayers.length} spelers toegewezen.
                  </AlertDescription>
                </Alert>
              )}

              {canGenerateSchedule && (
                <Alert>
                  <AlertDescription>
                    <strong>2v2 Schema gereed voor generatie!</strong><br />
                    Links groep: {leftPlayers.length} spelers<br />
                    Rechts groep: {rightPlayers.length} spelers
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={handleGeneratePreview}
                  disabled={!canGenerateSchedule || isGenerating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isGenerating ? '2v2 Schema Genereren...' : '2v2 Schema Genereren'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/matches?tournament=${currentTournament.id}`)}
                >
                  Wedstrijden Bekijken
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/tournaments/${currentTournament.id}/assign-players`)}
                >
                  Spelers Beheren
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleDebug
        tournaments={tournaments}
        currentTournament={currentTournament}
        tournamentPlayers={tournamentPlayers}
        tournamentId={tournamentId}
      />
    </div>
  );
}
