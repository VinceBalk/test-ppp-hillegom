import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchDetail {
  id: string;
  round_number: number;
  score_team1: number | null;
  score_team2: number | null;
  status: string;
  team1_player1?: { name: string };
  team1_player2?: { name: string };
  team2_player1?: { name: string };
  team2_player2?: { name: string };
  court?: { name: string };
  tournament?: { name: string };
  player_stats: {
    player_id: string;
    player: { name: string };
    games_won: number;
  }[];
  match_specials: {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (matchId) {
      // Fetch specifieke wedstrijd
      fetchMatchDetail(matchId);
    } else {
      // Fetch alle wedstrijden met scores
      fetchMatchesWithScores();
    }
  }, [matchId]);

  const fetchMatchDetail = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        id,
        round_number,
        score_team1,
        score_team2,
        status,
        court:courts(name),
        tournament:tournaments(name),
        team1_player1:players!matches_team1_player1_id_fkey(name),
        team1_player2:players!matches_team1_player2_id_fkey(name),
        team2_player1:players!matches_team2_player1_id_fkey(name),
        team2_player2:players!matches_team2_player2_id_fkey(name),
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
      setMatch(data);
    }
    setLoading(false);
  };

  const fetchMatchesWithScores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        id,
        round_number,
        score_team1,
        score_team2,
        status,
        court:courts(name),
        tournament:tournaments(name),
        team1_player1:players!matches_team1_player1_id_fkey(name),
        team1_player2:players!matches_team1_player2_id_fkey(name),
        team2_player1:players!matches_team2_player1_id_fkey(name),
        team2_player2:players!matches_team2_player2_id_fkey(name)
      `
      )
      .not('score_team1', 'is', null)
      .not('score_team2', 'is', null)
      .order('round_number', { ascending: true });

    if (error) {
      console.error("Fout bij ophalen wedstrijden:", error);
      setMatches([]);
    } else {
      setMatches(data || []);
    }
    setLoading(false);
  };

  const getPlayerName = (pid?: { name: string }) => pid?.name || "Onbekend";

  const getTeamName = (player1?: { name: string }, player2?: { name: string }) => {
    const name1 = getPlayerName(player1);
    const name2 = player2 ? getPlayerName(player2) : null;
    return name2 ? `${name1} & ${name2}` : name1;
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

        <Card>
          <CardHeader>
            <CardTitle>Uitslag: Ronde {match.round_number}</CardTitle>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{match.tournament?.name}</p>
              <p className="text-sm text-muted-foreground">{match.court?.name}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <p className="font-semibold mb-2 text-lg">
                  {getPlayerName(match.team1_player1)}
                  {match.team1_player2 && (
                    <>
                      <span className="text-muted-foreground mx-2">&</span>
                      {getPlayerName(match.team1_player2)}
                    </>
                  )}
                </p>
                <p className="text-4xl font-bold text-primary">{match.score_team1}</p>
              </div>
              
              <div className="text-center">
                <p className="font-semibold mb-2 text-lg">
                  {getPlayerName(match.team2_player1)}
                  {match.team2_player2 && (
                    <>
                      <span className="text-muted-foreground mx-2">&</span>
                      {getPlayerName(match.team2_player2)}
                    </>
                  )}
                </p>
                <p className="text-4xl font-bold text-primary">{match.score_team2}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {match.player_stats && match.player_stats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Speler Statistieken & Specials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {match.player_stats.map((p) => {
                  const specials = match.match_specials?.filter((s) => s.player_id === p.player_id) || [];
                  return (
                    <div key={p.player_id} className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-2 text-lg">{p.player.name}</p>
                      <p className="text-sm mb-3 text-muted-foreground">
                        Games gewonnen: <span className="font-medium text-foreground">{p.games_won}</span>
                      </p>
                      {specials.length > 0 ? (
                        <div>
                          <p className="text-sm font-medium mb-2">Specials:</p>
                          <ul className="text-sm space-y-1">
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
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Overzichtspagina van alle scores
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scores</h1>
        <p className="text-muted-foreground">
          Bekijk wedstrijdscores en uitslagen ({matches.length} wedstrijden met scores)
        </p>
      </div>
      
      {matches.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Er zijn nog geen wedstrijden met scores.
              </p>
              <Button onClick={() => navigate('/matches')}>
                Ga naar Wedstrijden
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <Card key={match.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">
                        Ronde {match.round_number}
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        {match.tournament?.name} • {match.court?.name}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="text-center md:text-left">
                        <p className="font-medium">
                          {getTeamName(match.team1_player1, match.team1_player2)}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {match.score_team1} - {match.score_team2}
                        </div>
                      </div>
                      
                      <div className="text-center md:text-right">
                        <p className="font-medium">
                          {getTeamName(match.team2_player1, match.team2_player2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/scores/${match.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
