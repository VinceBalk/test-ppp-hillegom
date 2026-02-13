import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRound3Readiness } from '@/hooks/useRound3Readiness';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';

interface Round3GenerationSectionProps {
  tournamentId: string;
}

export const Round3GenerationSection = ({ tournamentId }: Round3GenerationSectionProps) => {
  const { readiness, isLoading: readinessLoading } = useRound3Readiness(tournamentId);
  const { preview, generatePreview, isGenerating, clearPreview } = useSchedulePreview(tournamentId);
  const { generateSchedule, isGenerating: isSaving } = useScheduleGeneration();

  if (readinessLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Controleren of Ronde 3 gegenereerd kan worden...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!readiness) {
    return null;
  }

  // Show message if R3 is already generated
  if (readiness.r3AlreadyGenerated) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Ronde 3 is al gegenereerd. Bekijk de wedstrijden in het overzicht hieronder.
        </AlertDescription>
      </Alert>
    );
  }

  // Show status if not ready yet
  if (!readiness.isReady) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Ronde 3 kan nog niet gegenereerd worden</p>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                {readiness.r1Complete ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-orange-600" />
                )}
                <span>
                  Ronde 1: {readiness.r1CompletedWithScores}/12 wedstrijden compleet met scores
                </span>
              </div>
              <div className="flex items-center gap-2">
                {readiness.r2Complete ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-orange-600" />
                )}
                <span>
                  Ronde 2: {readiness.r2CompletedWithScores}/12 wedstrijden compleet met scores
                </span>
              </div>
              {!readiness.hasPermission && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">Je hebt geen toestemming om Ronde 3 te genereren</span>
                </div>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // R3 is ready to be generated!
  const handleGeneratePreview = async () => {
    try {
      await generatePreview(3); // Round 3
    } catch (error) {
      console.error('Error generating R3 preview:', error);
    }
  };

  const handleApproveSchedule = async () => {
    if (!preview) return;
    
    try {
      await generateSchedule({
        tournamentId,
        roundNumber: 3,
        preview
      });
      
      // Clear preview after successful save
      await clearPreview(3);
    } catch (error) {
      console.error('Error saving R3 schedule:', error);
    }
  };

  // Show preview if generated
  if (preview && preview.matches.length > 0) {
    const leftMatches = preview.matches.filter(m => m.id.startsWith('links-'));
    const rightMatches = preview.matches.filter(m => m.id.startsWith('rechts-'));
    
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Ronde 3 preview is gegenereerd! Controleer de wedstrijden hieronder en klik op "Wedstrijden Toevoegen" om definitief op te slaan.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Group */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Links Groep ({leftMatches.length} wedstrijden)</h3>
              <div className="space-y-3">
                {leftMatches.map((match, index) => (
                  <div key={match.id} className="p-3 bg-muted rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Wedstrijd #{match.match_number}</span>
                      <span className="text-xs text-muted-foreground">{match.court_name}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">Team 1:</span>
                        <span>{match.team1_player1_name} & {match.team1_player2_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">Team 2:</span>
                        <span>{match.team2_player1_name} & {match.team2_player2_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Group */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Rechts Groep ({rightMatches.length} wedstrijden)</h3>
              <div className="space-y-3">
                {rightMatches.map((match, index) => (
                  <div key={match.id} className="p-3 bg-muted rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Wedstrijd #{match.match_number}</span>
                      <span className="text-xs text-muted-foreground">{match.court_name}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">Team 1:</span>
                        <span>{match.team1_player1_name} & {match.team1_player2_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">Team 2:</span>
                        <span>{match.team2_player1_name} & {match.team2_player2_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
            onClick={() => clearPreview(3)}
            variant="outline"
            disabled={isSaving}
          >
            Annuleren
          </Button>
        </div>
      </div>
    );
  }

  // Show generation button
  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <CheckCircle2 className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <p className="font-medium mb-1">Ronde 3 kan nu gegenereerd worden!</p>
          <p className="text-sm">
            Ronde 1 en 2 zijn compleet. Klik op "Preview Genereren" om de Ronde 3 wedstrijden te maken 
            op basis van de ranking (beste 4 en slechtste 4 per groep).
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">2v2 Schema Genereren</h3>
            <p className="text-sm text-muted-foreground">
              Genereer automatisch Ronde 3 schema o.b.v. prestaties in Ronde 1 en 2
            </p>
            <Button
              onClick={handleGeneratePreview}
              disabled={isGenerating}
              className="w-full bg-primary hover:bg-primary/90"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
