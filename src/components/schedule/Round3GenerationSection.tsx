import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Play, Save, XCircle } from 'lucide-react';

import { useRound3Readiness } from '@/hooks/useRound3Readiness';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';

import MatchCard from '@/components/matches/MatchCard';
import type { Match } from '@/hooks/useMatches';

interface Round3GenerationSectionProps {
  tournamentId?: string;
}

type Variant = 'default' | 'destructive' | 'secondary';

function asArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function makePlayer(id?: string, name?: string) {
  // MatchCard gebruikt vooral .name voor display
  if (!id && !name) return null;
  return {
    id: id ?? '',
    name: name ?? '',
  };
}

/**
 * Zet jouw preview-match om naar iets dat MatchCard snapt.
 * Uit jouw preview dump zagen we velden als:
 * - team1_player1_id / team1_player1_name
 * - team1_player2_id / team1_player2_name
 * - team2_player1_id / team2_player1_name
 * - team2_player2_id / team2_player2_name
 * - court_name / court_number
 * - match_number
 */
function previewMatchToMatchCardMatch(previewMatch: any, tournamentId: string): Match {
  const team1_player1 = makePlayer(previewMatch?.team1_player1_id, previewMatch?.team1_player1_name);
  const team1_player2 = makePlayer(previewMatch?.team1_player2_id, previewMatch?.team1_player2_name);
  const team2_player1 = makePlayer(previewMatch?.team2_player1_id, previewMatch?.team2_player1_name);
  const team2_player2 = makePlayer(previewMatch?.team2_player2_id, previewMatch?.team2_player2_name);

  const matchObj: any = {
    id: previewMatch?.id ?? `preview-${previewMatch?.match_number ?? crypto.randomUUID?.() ?? Math.random()}`,
    tournament_id: tournamentId,
    round_number: 3,
    status: 'scheduled', // preview is toekomstig
    match_number: previewMatch?.match_number ?? null,

    // Court info (MatchCard gebruikt match.court?.name of match.court_number)
    court_number: previewMatch?.court_number ?? null,
    court: previewMatch?.court_name ? { name: previewMatch.court_name } : null,

    // Team players (MatchCard kijkt hiernaar)
    team1_player1_id: previewMatch?.team1_player1_id ?? null,
    team1_player2_id: previewMatch?.team1_player2_id ?? null,
    team2_player1_id: previewMatch?.team2_player1_id ?? null,
    team2_player2_id: previewMatch?.team2_player2_id ?? null,

    team1_player1,
    team1_player2,
    team2_player1,
    team2_player2,

    // scores bestaan nog niet in preview
    team1_score: null,
    team2_score: null,

    // Tournament kan leeg zijn; MatchCard pakt 'm uit props als je die meegeeft.
    tournament: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return matchObj as Match;
}

export function Round3GenerationSection({ tournamentId }: Round3GenerationSectionProps) {
  const { readiness, isLoading: readinessLoading } = useRound3Readiness(tournamentId);
  const { generatePreview, isGenerating: previewGenerating, preview } = useSchedulePreview(tournamentId);
  const { generateSchedule, isGenerating: scheduleGenerating } = useScheduleGeneration();

  const [showPreview, setShowPreview] = useState(false);

  const previewMatchesRaw = useMemo(() => asArray(preview?.matches), [preview]);
  const previewMatchesAsMatchCard = useMemo(() => {
    if (!tournamentId) return [];
    return previewMatchesRaw.map((pm) => previewMatchToMatchCardMatch(pm, tournamentId));
  }, [previewMatchesRaw, tournamentId]);

  const handleGeneratePreview = async () => {
    if (!tournamentId) return;

    try {
      await generatePreview(3);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating Round 3 preview:', error);
    }
  };

  const handleApproveSchedule = async () => {
    if (!tournamentId || !preview) return;

    try {
      await generateSchedule({
        tournamentId,
        roundNumber: 3,
        preview,
      });
      setShowPreview(false);
    } catch (error) {
      console.error('Error approving Round 3 schedule:', error);
    }
  };

  const getStatusIcon = () => {
    if (!readiness) return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    if (readiness.isReady) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (readiness.r3AlreadyGenerated) return <XCircle className="h-5 w-5 text-orange-600" />;
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusVariant = (): Variant => {
    if (!readiness) return 'secondary';
    if (readiness.isReady) return 'default';
    if (readiness.r3AlreadyGenerated) return 'secondary';
    return 'destructive';
  };

  if (readinessLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ronde 3 Genereren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Status controleren...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Ronde 3 Genereren
            </CardTitle>
            <CardDescription>Genereer Ronde 3 schema op basis van prestaties in Ronde 1 en 2</CardDescription>
          </div>

          {readiness && (
            <Badge variant={getStatusVariant()}>
              {readiness.isReady ? 'Klaar voor generatie' : readiness.r3AlreadyGenerated ? 'Al gegenereerd' : 'Niet beschikbaar'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Ronde 1 Status</div>
            <div className="flex items-center gap-2">
              {readiness?.r1Complete ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                {readiness?.r1CompletedWithScores || 0}/{readiness?.r1MatchesCount || 0} compleet
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Ronde 2 Status</div>
            <div className="flex items-center gap-2">
              {readiness?.r2Complete ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                {readiness?.r2CompletedWithScores || 0}/{readiness?.r2MatchesCount || 0} compleet
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        {readiness?.message && (
          <Alert variant={readiness.isReady ? 'default' : 'destructive'}>
            <AlertDescription>{readiness.message}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleGeneratePreview}
            disabled={!readiness?.isReady || previewGenerating || scheduleGenerating}
            className="flex-1"
          >
            {previewGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Preview maken...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Preview Genereren
              </>
            )}
          </Button>

          {showPreview && preview && (
            <Button
              onClick={handleApproveSchedule}
              disabled={scheduleGenerating}
              variant="default"
              className="flex-1"
            >
              {scheduleGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Schema Goedkeuren
                </>
              )}
            </Button>
          )}
        </div>

        {/* Preview status */}
        {showPreview && preview && (
          <Alert>
            <AlertDescription>
              Preview gegenereerd: {previewMatchesAsMatchCard.length} wedstrijden klaar voor goedkeuring
            </AlertDescription>
          </Alert>
        )}

        {/* Preview cards: EXACT dezelfde UI als R1/R2 */}
        {showPreview && preview && (
          <div className="space-y-3">
            {previewMatchesAsMatchCard.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                // Dit zorgt dat je geen rare simulator/score knoppen krijgt in preview
                tournament={{
                  id: tournamentId!,
                  status: 'active',
                  is_simulation: false,
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Named + default export, zodat je imports niet weer gaan janken.
export default Round3GenerationSection;
