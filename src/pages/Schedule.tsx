
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTournaments } from '@/hooks/useTournaments';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useMatches } from '@/hooks/useMatches';
import { useToast } from '@/hooks/use-toast';
import ScheduleHeader from '@/components/schedule/ScheduleHeader';
import TournamentSelector from '@/components/schedule/TournamentSelector';
import RoundSelector from '@/components/schedule/RoundSelector';
import PreviewGenerator from '@/components/schedule/PreviewGenerator';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import ManualMatchBuilder from '@/components/schedule/ManualMatchBuilder';
import ScheduleDebug from '@/components/schedule/ScheduleDebug';
import ScheduleLoadingState from '@/components/schedule/ScheduleLoadingState';
import ScheduleErrorState from '@/components/schedule/ScheduleErrorState';
import MatchCard from '@/components/matches/MatchCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Schedule() {
  const { tournamentId: urlTournamentId } = useParams<{ tournamentId: string }>();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(urlTournamentId || '');
  const [selectedRound, setSelectedRound] = useState(1);
  const { toast } = useToast();
  
  const { tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const { tournamentPlayers } = useTournamentPlayers(selectedTournamentId);
  const { matches, isLoading: matchesLoading } = useMatches(selectedTournamentId);
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

  // Show message if no tournaments exist
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="space-y-6">
        <ScheduleHeader tournamentName="Schema Generatie" />
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
      </div>
    );
  }

  const roundKey = `round_${selectedRound}_schedule_generated` as keyof typeof tournament;
  const isRoundGenerated = tournament && tournament[roundKey];

  // Filter matches for the selected round
  const roundMatches = matches.filter(match => match.round_number === selectedRound);
  const hasExistingMatches = roundMatches.length > 0;

  // Group matches by court and row_side for display, matching MatchesList component
  const groupMatchesByCourt = (matches: typeof roundMatches) => {
    return matches.reduce((groups, match) => {
      const courtKey = match.court?.name || (match.court_number ? `Baan ${match.court_number}` : 'Onbekende baan');
      if (!groups[courtKey]) {
        groups[courtKey] = [];
      }
      groups[courtKey].push(match);
      return groups;
    }, {} as Record<string, typeof roundMatches>);
  };

  const matchesByCourt = groupMatchesByCourt(roundMatches);

  // Separate courts based on row_side from the court data
  const leftCourts: Array<{ name: string; matches: typeof roundMatches; menuOrder: number; backgroundColor: string }> = [];
  const rightCourts: Array<{ name: string; matches: typeof roundMatches; menuOrder: number; backgroundColor: string }> = [];

  Object.entries(matchesByCourt).forEach(([courtName, courtMatches]) => {
    const court = courtMatches[0]?.court;
    const menuOrder = court?.menu_order ?? 999;
    const backgroundColor = court?.background_color || '#ffffff';
    const rowSide = court?.row_side || 'left'; // Default to left if not specified
    
    const courtData = {
      name: courtName,
      matches: courtMatches,
      menuOrder,
      backgroundColor
    };

    // Use the actual row_side from the database
    if (rowSide === 'left') {
      leftCourts.push(courtData);
    } else {
      rightCourts.push(courtData);
    }
  });

  // Sort courts within each column by menu_order (ascending)
  leftCourts.sort((a, b) => a.menuOrder - b.menuOrder);
  rightCourts.sort((a, b) => a.menuOrder - b.menuOrder);

  return (
    <div className="space-y-6">
      <ScheduleHeader tournamentName={tournament?.name || "Schema Generatie"} />

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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Wedstrijden Overzicht</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  {roundMatches.length} wedstrijd{roundMatches.length !== 1 ? 'en' : ''} in ronde {selectedRound}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Courts with row_side = 'left' */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-primary mb-4">Linker Groep</h3>
                    </div>
                    {leftCourts.map((court) => (
                      <div key={court.name} className="space-y-4">
                        <div 
                          className="p-3 border rounded text-center"
                          style={{ 
                            backgroundColor: court.backgroundColor,
                            borderColor: court.backgroundColor
                          }}
                        >
                          <div className="text-sm font-medium text-black">
                            Baan: {court.name}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {court.matches.map((match, index) => (
                            <MatchCard 
                              key={match.id} 
                              match={match} 
                              matchNumberInCourtRound={index + 1}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Right Column - Courts with row_side = 'right' */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-primary mb-4">Rechter Groep</h3>
                    </div>
                    {rightCourts.map((court) => (
                      <div key={court.name} className="space-y-4">
                        <div 
                          className="p-3 border rounded text-center"
                          style={{ 
                            backgroundColor: court.backgroundColor,
                            borderColor: court.backgroundColor
                          }}
                        >
                          <div className="text-sm font-medium text-black">
                            Baan: {court.name}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {court.matches.map((match, index) => (
                            <MatchCard 
                              key={match.id} 
                              match={match} 
                              matchNumberInCourtRound={index + 1}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!preview && !isRoundGenerated && !hasExistingMatches && selectedRound <= 2 && (
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

          {selectedRound === 3 && !hasExistingMatches && (
            <div className="text-center py-8">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  Ronde 3 wordt automatisch bepaald
                </h3>
                <p className="text-amber-700">
                  Ronde 3 wordt automatisch gegenereerd na het tellen van de uitslag van ronde 1 en 2, 
                  inclusief eventuele tiebreakers als beslisser.
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

          {selectedRound <= 2 && (
            <ManualMatchBuilder tournamentId={selectedTournamentId} initialRound={selectedRound} />
          )}

          <ScheduleDebug 
            tournaments={tournaments || []}
            currentTournament={tournament}
            tournamentPlayers={tournamentPlayers}
            tournamentId={selectedTournamentId}
          />
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
    </div>
  );
}
