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
          player:players(name)
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
          player:players(name)
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

  // Bepaal welke spelers in welke kolom (links/rechts)
  const getTeamColumns = (match: MatchDetail) => {
    const allPlayers = [
      { player: match.team1_player1, team: 1 },
      { player: match.team1_player2, team: 1 },
      { player: match.team2_player1, team: 2 },
      { player: match.team2_player2, team: 2 }
    ].filter(p => p.player);

    const leftSidePlayers = allPlayers.filter(p => p.player?.row_side === 'left');
    const rightSidePlayers = allPlayers.filter(p => p.player?.row_side === 'right');

    // Bepaal team scores per kant
    const leftTeams = [...new Set(leftSidePlayers.map(p => p.team))];
    const rightTeams = [...new Set(rightSidePlayers.map(p => p.team))];

    let leftScore = 0;
    let rightScore = 0;

    if (leftTeams.includes(1) && !leftTeams.includes(2)) {
      // Alleen team 1 links
      leftScore = match.team1_score ?? 0;
      rightScore = match.team2_score ?? 0;
    } else if (leftTeams.includes(2) && !leftTeams.includes(1)) {
      // Alleen team 2 links  
      leftScore = match.team2_score ?? 0;
      rightScore = match.team1_score ?? 0;
    } else {
      // Mixed teams of onbekend, gebruik originele team indeling
      leftScore = match.team1_score ?? 0;
      rightScore = match.team2_score ?? 0;
    }

    return {
      leftPlayers: leftSidePlayers.length > 0 ? leftSidePlayers : [
        { player: match.team1_player1, team: 1 },
        { player: match.team1_player2, team: 1 }
      ].filter(p => p.player),
      rightPlayers: rightSidePlayers.length > 0 ? rightSidePlayers : [
        { player: match.team2_player1, team: 2 },
        { player: match.team2_player2, team: 2 }
      ].filter(p => p.player),
      leftScore,
      rightScore
    };
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

    const { leftPlayers, rightPlayers, leftScore, rightScore } = getTeamColumns(match);

    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/scores')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Scores
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Wedstrijd Details</h1>
            <p className="text-muted-foreground">Uitslag en statistieken</p>
          </div>
        </div>

        {/* Hoofduitslag Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Ronde {match.round_number} - Wedstrijd {match.match_number}</CardTitle>
                <div className="space-y-1 mt-2">
                  <p className="text-sm text-muted-foreground">{match.tournament?.name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {getCourtInfo(match)}
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Status: {match.status}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 items-center">
              {/* Linker Rijtje */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Linker Rijtje</p>
                <div className="space-y-1">
                  {leftPlayers.map((p, i) => (
                    <p key={i} className="font-semibold text-lg">{getPlayerName(p.player)}</p>
                  ))}
                </div>
              </div>
              
              {/* Score */}
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">
                  {leftScore} - {rightScore}
                </div>
              </div>
              
              {/* Rechter Rijtje */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Rechter Rijtje</p>
                <div className="space-y-1">
                  {rightPlayers.map((p, i) => (
                    <p key={i} className="font-semibold text-lg">{getPlayerName(p.player)}</p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Speler Statistieken & Specials */}
        <Card>
          <CardHeader>
            <CardTitle>Speler Statistieken & Specials</CardTitle>
          </CardHeader>
          <CardContent>
            {match.player_stats && match.player_stats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {match.player_stats.map((p) => {
                  const specials = match.match_specials?.filter((s) => s.player_id === p.player_id) || [];
                  return (
                    <div key={p.player_id} className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-2 text-base">{p.player.name}</p>
                      <p className="text-sm mb-3 text-muted-foreground">
                        Games gewonnen: <span className="font-medium text-foreground">{p.games_won}</span>
                      </p>
                      {specials.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium mb-2 text-muted-foreground">Specials:</p>
                          <ul className="text-xs space-y-1">
                            {specials.map((s, i) => (
                              <li key={i} className="flex justify-between">
                                <span>{s.special_type_id}</span>
                                <span className="font-medium">× {s.count}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Geen specials</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Geen player_stats maar wel spelers tonen
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div key={player?.id || index} className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-2 text-base">{player?.name}</p>
                      <p className="text-sm mb-3 text-muted-foreground">
                        Games gewonnen: <span className="font-medium text-foreground">-</span>
                      </p>
                      {specials.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium mb-2 text-muted-foreground">Specials:</p>
                          <ul className="text-xs space-y-1">
                            {specials.map((s, i) => (
                              <li key={i} className="flex justify-between">
                                <span>{s.special_type_id}</span>
                                <span className="font-medium">× {s.count}</span>
                              </li>
                            ))}
                          </ul>
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
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Er zijn geen specials voor deze wedstrijd
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Overzichtspagina - Match Cards
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scores</h1>
          <p className="text-muted-foreground">
            Bekijk wedstrijdscores en uitslagen ({filteredMatches.length} wedstrijden)
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
            const { leftPlayers, rightPlayers, leftScore, rightScore } = getTeamColumns(match);
            
            return (
              <Card key={match.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/scores/${match.id}`)}>
                <CardContent className="pt-4">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Ronde {match.round_number}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">#{match.match_number || '?'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {getCourtInfo(match)}
                    </div>
                  </div>

                  {/* Tournament info */}
                  <div className="text-xs text-muted-foreground mb-3">
                    {match.tournament?.name}
                  </div>

                  {/* Teams en Score - Kolom Layout */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Linker Rijtje */}
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground mb-1">Linker Rijtje</p>
                      <div className="space-y-0.5">
                        {leftPlayers.map((p, i) => (
                          <p key={i} className="font-medium text-sm leading-tight">{getPlayerName(p.player)}</p>
                        ))}
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {leftScore} - {rightScore}
                      </div>
                    </div>
                    
                    {/* Rechter Rijtje */}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Rechter Rijtje</p>
                      <div className="space-y-0.5">
                        {rightPlayers.map((p, i) => (
                          <p key={i} className="font-medium text-sm leading-tight">{getPlayerName(p.player)}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Specials Summary */}
                  {match.match_specials && match.match_specials.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {match.match_specials.length} special{match.match_specials.length !== 1 ? 's' : ''}
                        </span>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
