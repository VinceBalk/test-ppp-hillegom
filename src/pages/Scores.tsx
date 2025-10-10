import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Eye, MapPin, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchDetail {
  id: string;
  round_number: number;
  match_number: number;
  team1_score: number | null;
  team2_score: number | null;
  status: string;
  court_number: string | null;
  team1_player1?: { name: string; row_side?: string };
  team1_player2?: { name: string; row_side?: string };
  team2_player1?: { name: string; row_side?: string };
  team2_player2?: { name: string; row_side?: string };
  court?: { name: string };
  tournament?: { name: string };
  player_stats?: {
    player_id: string;
    player: { name: string };
    games_won: number;
  }[];
  match_specials?: {
    player_id: string;
    player: { name: string };
    special_type_id: string;
    special_type: { name: string };
    count: number;
  }[];
}

export default function Scores() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<string>("all");
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);

  useEffect(() => {
    if (matchId) {
      fetchMatchDetail(matchId);
    } else {
      fetchMatchesWithScores();
    }
  }, [matchId]);

  useEffect(() => {
    // Filter matches op geselecteerde ronde
    if (selectedRound === "all") {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(matches.filter(match => match.round_number === parseInt(selectedRound)));
    }
  }, [matches, selectedRound]);

  const fetchMatchDetail = async (id: string) => {
    setLoading(true);
    console.log("Fetching match detail for:", id);
    
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        id,
        round_number,
        match_number,
        team1_score,
        team2_score,
        status,
        court_number,
        court:courts(name),
        tournament:tournaments(name),
        team1_player1:players!matches_team1_player1_id_fkey(name, row_side),
        team1_player2:players!matches_team1_player2_id_fkey(name, row_side),
        team2_player1:players!matches_team2_player1_id_fkey(name, row_side),
        team2_player2:players!matches_team2_player2_id_fkey(name, row_side),
        player_stats:player_match_stats (
          player_id,
          games_won,
          player:players(name)
        ),
        match_specials:match_specials (
          player_id,
          special_type_id,
          count,
          player:players(name),
          special_type:special_types(name)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Fout bij ophalen wedstrijd:", error);
      setMatch(null);
    } else {
      console.log("Match detail data:", data);
      setMatch(data);
    }
    setLoading(false);
  };

  const fetchMatchesWithScores = async () => {
    setLoading(true);
    console.log("Fetching matches with scores...");
    
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        id,
        round_number,
        match_number,
        team1_score,
        team2_score,
        status,
        court_number,
        court:courts(name),
        tournament:tournaments(name),
        team1_player1:players!matches_team1_player1_id_fkey(name, row_side),
        team1_player2:players!matches_team1_player2_id_fkey(name, row_side),
        team2_player1:players!matches_team2_player1_id_fkey(name, row_side),
        team2_player2:players!matches_team2_player2_id_fkey(name, row_side),
        player_stats:player_match_stats (
          player_id,
          games_won,
          player:players(name)
        ),
        match_specials:match_specials (
          player_id,
          special_type_id,
          count,
          player:players(name),
          special_type:special_types(name)
        )
      `
      )
      .eq('status', 'completed')
      .not('team1_score', 'is', null)
      .not('team2_score', 'is', null);

    if (error) {
      console.error("Fout bij ophalen completed wedstrijden:", error);
      setMatches([]);
    } else {
      console.log("Completed wedstrijden opgehaald:", data?.length, "matches");
      
      // Filter op wedstrijden die daadwerkelijk scores hebben
      const matchesWithScores = (data || []).filter(match => 
        match.team1_score !== null && 
        match.team2_score !== null
      );

      // Sorteer op: Ronde -> Baan -> Wedstrijd
      matchesWithScores.sort((a, b) => {
        // Eerst op ronde
        if (a.round_number !== b.round_number) {
          return a.round_number - b.round_number;
        }
        
        // Dan op baan (court_number of court name)
        const aCourtNum = parseInt(a.court_number || '0') || 0;
        const bCourtNum = parseInt(b.court_number || '0') || 0;
        if (aCourtNum !== bCourtNum) {
          return aCourtNum - bCourtNum;
        }
        
        // Dan op wedstrijd nummer
        const aMatchNum = a.match_number || 0;
        const bMatchNum = b.match_number || 0;
        return aMatchNum - bMatchNum;
      });
      
      console.log("Matches met echte scores (gesorteerd):", matchesWithScores.length);
      setMatches(matchesWithScores);
      
      // Verkrijg beschikbare rondes voor filter
      const rounds = [...new Set(matchesWithScores.map(m => m.round_number))].sort((a, b) => a - b);
      setAvailableRounds(rounds);
    }
    
    setLoading(false);
  };

  const getPlayerName = (pid?: { name: string }) => pid?.name || "Onbekend";

  const getCourtInfo = (match: MatchDetail) => {
    if (match.court?.name) return match.court.name;
    if (match.court_number) return `Baan ${match.court_number}`;
    return "Geen baan";
  };

  const getPlayerSpecialsCount = (match: MatchDetail, playerName: string) => {
    if (!match.match_specials) return 0;
    return match.match_specials
      .filter(special => special.player?.name === playerName)
      .reduce((total, special) => total + special.count, 0);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  // Specifieke wedstrijd details
  if (matchId) {
    if (!match) {
      return (
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate('/scores')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Scores
            </Button>
            <h1 className="text-2xl font-bold">Wedstrijd niet gevonden</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600">Geen score gevonden voor deze wedstrijd.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/scores')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Scores
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold">Wedstrijd Details</h1>
          <p className="text-sm text-muted-foreground">Uitslag en statistieken</p>
        </div>

        {/* Match Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start text-sm">
              <div>
                <CardTitle className="text-lg">Ronde {match.round_number} - #{match.match_number}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{match.tournament?.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {getCourtInfo(match)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {match.status}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Mobiele score layout - gestackt */}
            <div className="space-y-3">
              {/* Team 1 */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-0.5">Team 1</p>
                  <p className="font-semibold text-sm">{getPlayerName(match.team1_player1)}</p>
                  {match.team1_player2 && (
                    <p className="font-semibold text-sm">{getPlayerName(match.team1_player2)}</p>
                  )}
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {match.team1_score ?? 0}
                </div>
              </div>
              
              {/* VS divider */}
              <div className="text-center">
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">VS</span>
              </div>
              
              {/* Team 2 */}
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-xs text-red-600 font-medium mb-0.5">Team 2</p>
                  <p className="font-semibold text-sm">{getPlayerName(match.team2_player1)}</p>
                  {match.team2_player2 && (
                    <p className="font-semibold text-sm">{getPlayerName(match.team2_player2)}</p>
                  )}
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {match.team2_score ?? 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Speler Statistieken - Mobile optimized */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Specials</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {match.player_stats && match.player_stats.length > 0 ? (
              <div className="space-y-3">
                {match.player_stats.map((p) => {
                  const specials = match.match_specials?.filter((s) => s.player_id === p.player_id) || [];
                  return (
                    <div key={p.player_id} className="border border-muted rounded-lg p-3">
                      <p className="font-medium text-sm mb-2">{p.player.name}</p>
                      {specials.length > 0 ? (
                        <div className="space-y-1">
                          {specials.map((s, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">{s.special_type?.name || s.special_type_id}</span>
                              <span className="font-medium bg-muted px-2 py-0.5 rounded">×{s.count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Geen specials</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { id: 'team1_player1', name: getPlayerName(match.team1_player1) },
                  match.team1_player2 && { id: 'team1_player2', name: getPlayerName(match.team1_player2) },
                  { id: 'team2_player1', name: getPlayerName(match.team2_player1) },
                  match.team2_player2 && { id: 'team2_player2', name: getPlayerName(match.team2_player2) }
                ].filter(Boolean).map((player, index) => {
                  const specials = match.match_specials?.filter((s) => 
                    s.player?.name === player?.name
                  ) || [];
                  
                  return (
                    <div key={player?.id || index} className="border border-muted rounded-lg p-3">
                      <p className="font-medium text-sm mb-2">{player?.name}</p>
                      {specials.length > 0 ? (
                        <div className="space-y-1">
                          {specials.map((s, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">{s.special_type?.name || s.special_type_id}</span>
                              <span className="font-medium bg-muted px-2 py-0.5 rounded">×{s.count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Geen specials</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Fallback bericht als er helemaal geen specials zijn */}
            {(!match.match_specials || match.match_specials.length === 0) && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Er zijn geen specials voor deze wedstrijd
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Conditionele logica voor filters
  const isFilteredByRound = selectedRound !== "all";
  
  // Overzichtspagina - Match Cards
  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isFilteredByRound ? `Ronde ${selectedRound} - Scores` : 'Alle Scores'}
          </h1>
          <p className="text-muted-foreground">
            {filteredMatches.length} {filteredMatches.length === 1 ? 'wedstrijd' : 'wedstrijden'}
          </p>
        </div>
        
        {/* Ronde Filter */}
        {availableRounds.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Alle rondes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle rondes</SelectItem>
                {availableRounds.map((round) => (
                  <SelectItem key={round} value={round.toString()}>
                    Ronde {round}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {filteredMatches.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {selectedRound === "all" 
                  ? "Er zijn nog geen completed wedstrijden met scores."
                  : `Geen wedstrijden gevonden voor ronde ${selectedRound}.`
                }
              </p>
              <Button onClick={() => navigate('/matches')}>
                Ga naar Wedstrijden
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const team1Player1Specials = getPlayerSpecialsCount(match, getPlayerName(match.team1_player1));
            const team1Player2Specials = match.team1_player2 ? getPlayerSpecialsCount(match, getPlayerName(match.team1_player2)) : 0;
            const team2Player1Specials = getPlayerSpecialsCount(match, getPlayerName(match.team2_player1));
            const team2Player2Specials = match.team2_player2 ? getPlayerSpecialsCount(match, getPlayerName(match.team2_player2)) : 0;
            
            return (
              <Card key={match.id} className="w-full hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/scores/${match.id}`)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="inline-block border border-muted rounded px-2 py-0.5 text-xs font-medium mb-1">
                        {isFilteredByRound 
                          ? `#${match.match_number || '?'}`
                          : `Ronde ${match.round_number} • #${match.match_number || '?'}`
                        }
                      </div>
                      {match.tournament?.name && (
                        <p className="text-sm text-muted-foreground mt-1">{match.tournament.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {getCourtInfo(match)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-3">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    {/* Team 1 - rechts uitgelijnd */}
                    <div className="text-right">
                      <p className="font-semibold text-sm mb-1">Team 1</p>
                      <div className="flex items-center justify-end gap-1">
                        <p className="text-xs text-muted-foreground">{getPlayerName(match.team1_player1)}</p>
                        {team1Player1Specials > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-black text-xs font-bold">
                            {team1Player1Specials}
                          </span>
                        )}
                      </div>
                      {match.team1_player2 && (
                        <div className="flex items-center justify-end gap-1">
                          <p className="text-xs text-muted-foreground">{getPlayerName(match.team1_player2)}</p>
                          {team1Player2Specials > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-black text-xs font-bold">
                              {team1Player2Specials}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Score - centraal */}
                    <div className="text-center px-3">
                      <p className="text-3xl font-bold tabular-nums">
                        {match.team1_score ?? 0} - {match.team2_score ?? 0}
                      </p>
                    </div>
                    
                    {/* Team 2 - links uitgelijnd */}
                    <div className="text-left">
                      <p className="font-semibold text-sm mb-1">Team 2</p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground">{getPlayerName(match.team2_player1)}</p>
                        {team2Player1Specials > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-black text-xs font-bold">
                            {team2Player1Specials}
                          </span>
                        )}
                      </div>
                      {match.team2_player2 && (
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-muted-foreground">{getPlayerName(match.team2_player2)}</p>
                          {team2Player2Specials > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-black text-xs font-bold">
                              {team2Player2Specials}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
