import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CheckCircle2, Clock, Loader2, Plus, Trophy, Users } from 'lucide-react';
import { Round3GenerationSection } from '@/components/schedule/Round3GenerationSection';

interface ScheduleContentProps {
  urlTournamentId?: string;
}

export default function ScheduleContent({ urlTournamentId }: ScheduleContentProps) {
  const navigate = useNavigate();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(urlTournamentId || '');
  const [activeTab, setActiveTab] = useState<string>('ronde-1');

  const { tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { matches, isLoading: matchesLoading } = useMatches(selectedTournamentId);
  const { tournamentPlayers } = useTournamentPlayers(selectedTournamentId);
  const { preview, generatePreview, isGenerating, clearPreview } = useSchedulePreview(selectedTournamentId);
  const { generateSchedule, isGenerating: isSaving } = useScheduleGeneration();

  const activeTournaments = tournaments?.filter(t => 
    t.status === 'open' || t.status === 'in_progress'
  ) || [];

  const selectedTournament = tournaments?.find(t => t.id === selectedTournamentId);

  // Separate matches by round
  const round1Matches = matches?.filter(m => m.round_number === 1) || [];
  const round2Matches = matches?.filter(m => m.round_number === 2) || [];
  const round3Matches = matches?.filter(m => m.round_number === 3) || [];

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
    navigate(`/schedule/${tournamentId}`);
  };

  const handleGeneratePreview = async () => {
    if (!selectedTournamentId) return;
    
    try {
      // Round 1 generates both R1 and R2 together
      await generatePreview(1);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleApproveSchedule = async () => {
    if (!preview || !selectedTournamentId) return;
    
    try {
      await generateSchedule({
        tournamentId: selectedTournamentId,
        roundNumber: 1, // This saves both R1 and R2
        preview
      });
      
      // Clear preview after successful save
      await clearPreview(1);
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  if (tournamentsLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Toernooien laden...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeTournaments || activeTournaments.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Geen actieve toernooien gevonden. Maak eerst een toernooi aan.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Toernooi Selectie
          </CardTitle>
          <CardDescription>Genereer wedstrijdschema voor Schema Generatie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Selecteer Toernooi</label>
              <Select value={selectedTournamentId} onValueChange={handleTournamentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies een toernooi" />
                </SelectTrigger>
                <SelectContent>
                  {activeTournaments.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                      {tournament.start_date && (
                        <span className="text-muted-foreground ml-2">
                          ({new Date(tournament.start_date).toLocaleDateString('nl-NL', { 
                            day: 'numeric', 
                            month: 'short' 
                          })})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTournament && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">{tournamentPlayers?.length || 0}</span>
                    <span className="text-muted-foreground"> spelers</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">{matches?.length || 0}</span>
                    <span className="text-muted-foreground"> wedstrijden</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    selectedTournament.status === 'completed' ? 'default' :
                    selectedTournament.status === 'in_progress' ? 'secondary' : 'outline'
                  }>
                    {selectedTournament.status === 'open' ? 'Open' :
                     selectedTournament.status === 'in_progress' ? 'Bezig' : 'Voltooid'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Rounds */}
      {selectedTournamentId && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ronde-1" className="flex items-center gap-2">
              Ronde 1
              {round1Matches.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {round1Matches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ronde-2" className="flex items-center gap-2">
              Ronde 2
              {round2Matches.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {round2Matches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ronde-3" className="flex items-center gap-2">
              Ronde 3
              {round3Matches.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {round3Matches.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Ronde 1 & 2 Combined Generation */}
          <TabsContent value="ronde-1">
            <div className="space-y-4">
              {/* Show preview or generation button */}
              {!preview && round1Matches.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">2v2 Schema Genereren</h3>
                      <p className="text-sm text-muted-foreground">
                        Genereer wedstrijdschema voor Ronde 1 en 2 (24 wedstrijden)
                      </p>
                      <Button
                        onClick={handleGeneratePreview}
                        disabled={isGenerating || (tournamentPlayers?.length || 0) < 16}
                        className="w-full"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Preview Genereren...
                          </>
                        ) : (
                          <>Preview Genereren</>
                        )}
                      </Button>
                      {(tournamentPlayers?.length || 0) < 16 && (
                        <p className="text-sm text-red-600">
                          Minimaal 16 spelers nodig (8 per groep). Momenteel: {tournamentPlayers?.length || 0}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show preview if generated */}
              {preview && preview.matches.length > 0 && (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Preview gegenereerd! {preview.totalMatches} wedstrijden (12 Ronde 1 + 12 Ronde 2) klaar om op te slaan.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Links Groep</CardTitle>
                        <CardDescription>{preview.leftGroupMatches.length} wedstrijden</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {preview.leftGroupMatches.slice(0, 5).map((match) => (
                            <div key={match.id} className="p-2 bg-muted rounded">
                              <div className="font-medium">Wedstrijd #{match.match_number}</div>
                              <div className="text-xs text-muted-foreground">
                                {match.team1_player1_name} & {match.team1_player2_name} vs{' '}
                                {match.team2_player1_name} & {match.team2_player2_name}
                              </div>
                            </div>
                          ))}
                          {preview.leftGroupMatches.length > 5 && (
                            <div className="text-center text-xs text-muted-foreground">
                              + {preview.leftGroupMatches.length - 5} meer...
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Rechts Groep</CardTitle>
                        <CardDescription>{preview.rightGroupMatches.length} wedstrijden</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {preview.rightGroupMatches.slice(0, 5).map((match) => (
                            <div key={match.id} className="p-2 bg-muted rounded">
                              <div className="font-medium">Wedstrijd #{match.match_number}</div>
                              <div className="text-xs text-muted-foreground">
                                {match.team1_player1_name} & {match.team1_player2_name} vs{' '}
                                {match.team2_player1_name} & {match.team2_player2_name}
                              </div>
                            </div>
                          ))}
                          {preview.rightGroupMatches.length > 5 && (
                            <div className="text-center text-xs text-muted-foreground">
                              + {preview.rightGroupMatches.length - 5} meer...
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleApproveSchedule}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Opslaan...
                        </>
                      ) : (
                        <>✓ Wedstrijden Toevoegen</>
                      )}
                    </Button>
                    <Button
                      onClick={() => clearPreview(1)}
                      variant="outline"
                      disabled={isSaving}
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}

              {/* Show existing R1 matches */}
              {round1Matches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ronde 1 Wedstrijden</CardTitle>
                    <CardDescription>
                      {round1Matches.length} wedstrijden gegenereerd
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {round1Matches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">Wedstrijd #{match.match_number}</div>
                            <div className="text-xs text-muted-foreground">
                              {match.court?.name || `Baan ${match.court_number || '?'}`}
                            </div>
                          </div>
                          <Badge variant={
                            match.status === 'completed' ? 'default' :
                            match.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {match.status === 'scheduled' ? 'Gepland' :
                             match.status === 'in_progress' ? 'Bezig' : 'Afgerond'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Ronde 2 Tab */}
          <TabsContent value="ronde-2">
            <div className="space-y-4">
              {round2Matches.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Ronde 2 Wedstrijden</CardTitle>
                    <CardDescription>
                      {round2Matches.length} wedstrijden gegenereerd
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {round2Matches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">Wedstrijd #{match.match_number}</div>
                            <div className="text-xs text-muted-foreground">
                              {match.court?.name || `Baan ${match.court_number || '?'}`}
                            </div>
                          </div>
                          <Badge variant={
                            match.status === 'completed' ? 'default' :
                            match.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {match.status === 'scheduled' ? 'Gepland' :
                             match.status === 'in_progress' ? 'Bezig' : 'Afgerond'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <AlertDescription>
                    Ronde 2 wordt automatisch gegenereerd samen met Ronde 1. Ga naar Ronde 1 tab om het schema te maken.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Ronde 3 Tab - WITH NEW R3 GENERATION SECTION */}
          <TabsContent value="ronde-3">
            <div className="space-y-6">
              {/* NIEUW: R3 Generation Section */}
              <Round3GenerationSection tournamentId={selectedTournamentId} />

              {/* Existing R3 matches display */}
              {round3Matches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ronde 3 Wedstrijden</CardTitle>
                    <CardDescription>
                      {round3Matches.length} finalegroep wedstrijden
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {round3Matches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">Wedstrijd #{match.match_number}</div>
                            <div className="text-xs text-muted-foreground">
                              {match.court?.name || `Baan ${match.court_number || '?'}`}
                            </div>
                          </div>
                          <Badge variant={
                            match.status === 'completed' ? 'default' :
                            match.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {match.status === 'scheduled' ? 'Gepland' :
                             match.status === 'in_progress' ? 'Bezig' : 'Afgerond'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Manual match addition section (if you have it) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Handmatig 2v2 Wedstrijd Toevoegen – Ronde 3</CardTitle>
                  <CardDescription>
                    Klik op "Voeg 2v2 Wedstrijd Toe" om een nieuwe wedstrijd aan ronde 3 toe te voegen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Navigate to manual match creation if you have that feature
                      // navigate(`/matches/create?tournament=${selectedTournamentId}&round=3`);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Voeg 2v2 Wedstrijd Toe
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
