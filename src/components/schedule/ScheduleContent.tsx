// src/components/schedule/ScheduleContent.tsx
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
import { Calendar, CheckCircle2, Loader2, Plus, Trophy, Users } from 'lucide-react';
import { Round3GenerationSection } from '@/components/schedule/Round3GenerationSection';
import { ScheduleMatch } from '@/types/schedule';

interface ScheduleContentProps {
  urlTournamentId?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Bepaal toernooironde: gebruik tournament_round property (gezet door useSchedulePreview), fallback naar ID */
function getTournamentRound(match: ScheduleMatch): number {
  const tr = (match as any).tournament_round;
  if (tr === 1 || tr === 2) return tr;
  if (match.id.includes('-r2-')) return 2;
  return 1;
}

/** Kleur + label op basis van match-id prefix */
function courtSideStyle(matchId: string): { bg: string; border: string; badge: string; label: string } {
  const isRight = matchId.startsWith('rechts-');
  return isRight
    ? { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-700 text-white', label: 'Rechts' }
    : { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-700 text-white', label: 'Links' };
}

// ─── PreviewCourtBlock ────────────────────────────────────────────────────────

interface CourtBlock {
  courtName: string;
  side: ReturnType<typeof courtSideStyle>;
  rounds: {
    roundNumber: number;
    matches: ScheduleMatch[];
  }[];
}

function PlayerName({ name, rank }: { name: string; rank: number | undefined }) {
  return (
    <span className="text-sm leading-5">
      {name}
      {rank !== undefined && (
        <span className="ml-1 text-[11px] font-bold text-muted-foreground">#{rank}</span>
      )}
    </span>
  );
}

function MatchRow({
  match,
  potje,
  rankMap,
}: {
  match: ScheduleMatch;
  potje: number;
  rankMap: Map<string, number>;
}) {
  return (
    <div className="py-2 border-b last:border-0">
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide shrink-0 w-12 pt-0.5">
          Potje {potje}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-0.5">
            <PlayerName name={match.team1_player1_name} rank={rankMap.get(match.team1_player1_id)} />
            <PlayerName name={match.team1_player2_name} rank={rankMap.get(match.team1_player2_id)} />
          </div>
        </div>
        <span className="text-xs font-bold text-muted-foreground shrink-0 pt-1">vs</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-0.5">
            <PlayerName name={match.team2_player1_name} rank={rankMap.get(match.team2_player1_id)} />
            <PlayerName name={match.team2_player2_name} rank={rankMap.get(match.team2_player2_id)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CourtPreviewCard({
  block,
  rankMap,
}: {
  block: CourtBlock;
  rankMap: Map<string, number>;
}) {
  const { bg, border, badge, label } = block.side;

  return (
    <div className={`rounded-lg border-2 ${border} ${bg} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${border}`}>
        <span className="font-bold text-sm">{block.courtName}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge}`}>{label}</span>
      </div>

      {/* Rounds */}
      <div className="divide-y divide-gray-200">
        {block.rounds.map(({ roundNumber, matches }) => (
          <div key={roundNumber} className="px-4 py-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Ronde {roundNumber}
            </p>
            {matches.map((m, idx) => (
              <MatchRow key={m.id} match={m} potje={idx + 1} rankMap={rankMap} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScheduleContent({ urlTournamentId }: ScheduleContentProps) {
  const navigate = useNavigate();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(urlTournamentId || '');
  const [activeTab, setActiveTab] = useState<string>('ronde-1');

  const { tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { matches, isLoading: matchesLoading } = useMatches(selectedTournamentId);
  const { tournamentPlayers } = useTournamentPlayers(selectedTournamentId);
  const { preview, generatePreview, isGenerating, clearPreview } = useSchedulePreview(selectedTournamentId);
  const { generateSchedule, isGenerating: isSaving } = useScheduleGeneration();

  const activeTournaments = tournaments?.filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  ) || [];

  const selectedTournament = tournaments?.find((t) => t.id === selectedTournamentId);

  const round1Matches = matches?.filter((m) => m.round_number === 1) || [];
  const round2Matches = matches?.filter((m) => m.round_number === 2) || [];
  const round3Matches = matches?.filter((m) => m.round_number === 3) || [];

  // ── Ranking map: player_id → rank binnen eigen groep (1 = best) ────────────
  const rankMap = new Map<string, number>();
  (['left', 'right'] as const).forEach((group) => {
    const gp = tournamentPlayers?.filter((p) => p.group === group) || [];
    gp.forEach((p, idx) => rankMap.set(p.player_id, idx + 1));
  });

  // ── Preview: groepeer per court_name, dan per toernooironde ───────────────
  function buildCourtBlocks(allMatches: ScheduleMatch[]): CourtBlock[] {
    const courtOrder: string[] = [];
    const courtMap = new Map<string, Map<number, ScheduleMatch[]>>();

    for (const m of allMatches) {
      const cn = m.court_name || 'Onbekende baan';
      if (!courtMap.has(cn)) {
        courtMap.set(cn, new Map());
        courtOrder.push(cn);
      }
      const tr = getTournamentRound(m);  // ← gebruik match object
      const rounds = courtMap.get(cn)!;
      if (!rounds.has(tr)) rounds.set(tr, []);
      rounds.get(tr)!.push(m);
    }

    const blocks: CourtBlock[] = [];
    for (const cn of courtOrder) {
      const rounds = courtMap.get(cn)!;
      const roundEntries = Array.from(rounds.entries())
        .sort(([a], [b]) => a - b)
        .map(([roundNumber, ms]) => ({
          roundNumber,
          matches: [...ms].sort((a, b) => a.round_within_group - b.round_within_group),
        }));

      const firstId = roundEntries[0]?.matches[0]?.id || '';
      blocks.push({
        courtName: cn,
        side: courtSideStyle(firstId),
        rounds: roundEntries,
      });
    }

    return blocks;
  }

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
    navigate(`/schedule/${tournamentId}`);
  };

  const handleGeneratePreview = async () => {
    if (!selectedTournamentId) return;
    try {
      await generatePreview(1);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleApproveSchedule = async () => {
    if (!preview || !selectedTournamentId) return;
    try {
      await generateSchedule({ tournamentId: selectedTournamentId, roundNumber: 1, preview });
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
      {/* Tournament Selection ───────────────────────────────────────────────── */}
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
                          (
                          {new Date(tournament.start_date).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                          })}
                          )
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
                  <Badge
                    variant={
                      selectedTournament.status === 'completed'
                        ? 'default'
                        : selectedTournament.status === 'in_progress'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {selectedTournament.status === 'open'
                      ? 'Open'
                      : selectedTournament.status === 'in_progress'
                      ? 'Bezig'
                      : 'Voltooid'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs ────────────────────────────────────────────────────────────────── */}
      {selectedTournamentId && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ronde-1">
              Ronde 1
              {round1Matches.length > 0 && (
                <Badge variant="secondary" className="ml-1">{round1Matches.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ronde-2">
              Ronde 2
              {round2Matches.length > 0 && (
                <Badge variant="secondary" className="ml-1">{round2Matches.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ronde-3">
              Ronde 3
              {round3Matches.length > 0 && (
                <Badge variant="secondary" className="ml-1">{round3Matches.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── Ronde 1 ──────────────────────────────────────────────────── */}
          <TabsContent value="ronde-1">
            <div className="space-y-4">

              {/* Generate knop (geen preview, geen wedstrijden) */}
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
                          'Preview Genereren'
                        )}
                      </Button>
                      {(tournamentPlayers?.length || 0) < 16 && (
                        <p className="text-sm text-red-600">
                          Minimaal 16 spelers nodig (8 per groep). Momenteel:{' '}
                          {tournamentPlayers?.length || 0}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Preview: per baan, per ronde, met rankings ─────────────── */}
              {preview && preview.matches.length > 0 && (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Preview gegenereerd! {preview.totalMatches} wedstrijden (12 Ronde 1 + 12 Ronde
                      2) klaar om op te slaan.
                    </AlertDescription>
                  </Alert>

                  {/* Baan-kaarten */}
                  {(() => {
                    const blocks = buildCourtBlocks(preview.matches);
                    // Verdeel links en rechts
                    const left  = blocks.filter((b) => b.side.label === 'Links');
                    const right = blocks.filter((b) => b.side.label === 'Rechts');

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide">
                            Links Groep
                          </h3>
                          {left.map((block) => (
                            <CourtPreviewCard key={block.courtName} block={block} rankMap={rankMap} />
                          ))}
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                            Rechts Groep
                          </h3>
                          {right.map((block) => (
                            <CourtPreviewCard key={block.courtName} block={block} rankMap={rankMap} />
                          ))}
                        </div>
                      </div>
                    );
                  })()}

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
                        '✓ Wedstrijden Toevoegen'
                      )}
                    </Button>
                    <Button onClick={() => clearPreview(1)} variant="outline" disabled={isSaving}>
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}

              {/* Bestaande R1 wedstrijden */}
              {round1Matches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ronde 1 Wedstrijden</CardTitle>
                    <CardDescription>{round1Matches.length} wedstrijden gegenereerd</CardDescription>
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
                          <Badge
                            variant={
                              match.status === 'completed'
                                ? 'default'
                                : match.status === 'in_progress'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {match.status === 'scheduled'
                              ? 'Gepland'
                              : match.status === 'in_progress'
                              ? 'Bezig'
                              : 'Afgerond'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ─── Ronde 2 ──────────────────────────────────────────────────── */}
          <TabsContent value="ronde-2">
            <div className="space-y-4">
              {round2Matches.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Ronde 2 Wedstrijden</CardTitle>
                    <CardDescription>{round2Matches.length} wedstrijden gegenereerd</CardDescription>
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
                          <Badge
                            variant={
                              match.status === 'completed'
                                ? 'default'
                                : match.status === 'in_progress'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {match.status === 'scheduled'
                              ? 'Gepland'
                              : match.status === 'in_progress'
                              ? 'Bezig'
                              : 'Afgerond'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <AlertDescription>
                    Ronde 2 wordt automatisch gegenereerd samen met Ronde 1. Ga naar Ronde 1 tab om
                    het schema te maken.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* ─── Ronde 3 ──────────────────────────────────────────────────── */}
          <TabsContent value="ronde-3">
            <div className="space-y-6">
              <Round3GenerationSection tournamentId={selectedTournamentId} />

              {round3Matches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ronde 3 Wedstrijden</CardTitle>
                    <CardDescription>{round3Matches.length} finalegroep wedstrijden</CardDescription>
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
                          <Badge
                            variant={
                              match.status === 'completed'
                                ? 'default'
                                : match.status === 'in_progress'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {match.status === 'scheduled'
                              ? 'Gepland'
                              : match.status === 'in_progress'
                              ? 'Bezig'
                              : 'Afgerond'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Handmatig 2v2 Wedstrijd Toevoegen – Ronde 3</CardTitle>
                  <CardDescription>
                    Klik op "Voeg 2v2 Wedstrijd Toe" om een nieuwe wedstrijd aan ronde 3 toe te voegen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => {}}>
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
