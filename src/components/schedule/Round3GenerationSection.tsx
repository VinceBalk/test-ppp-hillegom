import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Play,
  Save,
  XCircle,
} from 'lucide-react';
import { useRound3Readiness } from '@/hooks/useRound3Readiness';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';

interface Round3GenerationSectionProps {
  tournamentId?: string;
}

type Variant = 'default' | 'destructive' | 'secondary';

function safeStr(v: unknown) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function asArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

// Probeert teams/players leesbaar te maken, maar valt altijd terug op JSON als we het niet snappen.
function describeMatch(match: any) {
  // Veelvoorkomende velden (gokjes met parachute)
  const court = match?.court_number ?? match?.courtNumber ?? match?.court ?? match?.courtName;
  const matchNo = match?.match_number ?? match?.matchNumber ?? match?.number;

  // Teams kunnen op allerlei manieren zitten
  const team1 =
    match?.team1 ??
    match?.team_1 ??
    match?.teamOne ??
    match?.home ??
    { player1: match?.team1_player1, player2: match?.team1_player2 };

  const team2 =
    match?.team2 ??
    match?.team_2 ??
    match?.teamTwo ??
    match?.away ??
    { player1: match?.team2_player1, player2: match?.team2_player2 };

  const teamToText = (t: any) => {
    if (!t) return '';
    // Als er al een string-naam is
    if (typeof t === 'string') return t;
    // Als het een array is van spelers/strings
    if (Array.isArray(t)) return t.map((p) => p?.name ?? p?.full_name ?? p?.fullName ?? safeStr(p)).join(' + ');

    // Als het een object is met players
    const p1 = t?.player1 ?? t?.p1 ?? t?.player_1 ?? t?.playerOne;
    const p2 = t?.player2 ?? t?.p2 ?? t?.player_2 ?? t?.playerTwo;

    const pToName = (p: any) => p?.name ?? p?.full_name ?? p?.fullName ?? p?.email ?? p?.id ?? safeStr(p);

    const n1 = p1 ? pToName(p1) : '';
    const n2 = p2 ? pToName(p2) : '';

    const both = [n1, n2].filter(Boolean).join(' + ');
    if (both) return both;

    // laatste redmiddel
    return safeStr(t);
  };

  const t1 = teamToText(team1);
  const t2 = teamToText(team2);

  return {
    matchNo: matchNo ?? '',
    court: court ?? '',
    team1Text: t1,
    team2Text: t2,
  };
}

export function Round3GenerationSection({ tournamentId }: Round3GenerationSectionProps) {
  const { readiness, isLoading: readinessLoading } = useRound3Readiness(tournamentId);
  const { generatePreview, isGenerating: previewGenerating, preview } = useSchedulePreview(tournamentId);
  const { generateSchedule, isGenerating: scheduleGenerating } = useScheduleGeneration();

  const [showPreview, setShowPreview] = useState(false);
  const [expandedAll, setExpandedAll] = useState(false);
  const [expandedMatchIdx, setExpandedMatchIdx] = useState<number | null>(null);

  const matches = useMemo(() => asArray(preview?.matches), [preview]);
  const previewCount = matches.length;

  const handleGeneratePreview = async () => {
    if (!tournamentId) return;

    try {
      await generatePreview(3);
      setShowPreview(true);
      setExpandedAll(false);
      setExpandedMatchIdx(null);
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
      setExpandedAll(false);
      setExpandedMatchIdx(null);
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

        {/* Message Alert */}
        {readiness?.message && (
          <Alert variant={readiness.isReady ? 'default' : 'destructive'}>
            <AlertDescription>{readiness.message}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
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

        {/* Preview Info */}
        {showPreview && preview && (
          <Alert>
            <AlertDescription>
              Preview gegenereerd: {previewCount} wedstrijden klaar voor goedkeuring
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Render */}
        {showPreview && preview && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Preview (Ronde 3)</div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setExpandedAll((v) => !v)}
                  disabled={previewCount === 0}
                >
                  {expandedAll ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Alles inklappen
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Alles uitklappen
                    </>
                  )}
                </Button>
              </div>
            </div>

            {previewCount === 0 ? (
              <div className="text-sm text-muted-foreground">
                Geen wedstrijden gevonden in de preview. (Dat is… onhandig. Dan faalt je generator stilletjes.)
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map((m: any, idx: number) => {
                  const desc = describeMatch(m);
                  const isExpanded = expandedAll || expandedMatchIdx === idx;

                  return (
                    <div key={m?.id ?? idx} className="rounded-md border">
                      <div className="flex items-start justify-between gap-3 p-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            Wedstrijd {idx + 1}
                            {desc.matchNo ? <span className="text-muted-foreground"> • #{safeStr(desc.matchNo)}</span> : null}
                            {desc.court ? <span className="text-muted-foreground"> • Baan {safeStr(desc.court)}</span> : null}
                          </div>

                          <div className="text-sm">
                            <span className="font-medium">{desc.team1Text || 'Team 1'}</span>
                            <span className="text-muted-foreground"> vs </span>
                            <span className="font-medium">{desc.team2Text || 'Team 2'}</span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setExpandedMatchIdx((cur) => (cur === idx ? null : idx))}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {isExpanded ? 'Verberg details' : 'Toon details'}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="border-t p-3">
                          <div className="text-xs text-muted-foreground mb-2">
                            Details (debug/controle). Dit is de ruwe match payload uit de preview.
                          </div>
                          <pre className="text-xs overflow-auto max-h-80 whitespace-pre-wrap">
                            {JSON.stringify(m, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Zowel named als default export, zodat imports niet weer ruzie maken.
export default Round3GenerationSection;
