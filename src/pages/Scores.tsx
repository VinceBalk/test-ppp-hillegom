import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchDetail {
  id: string;
  round_number: number;
  score_team1: number;
  score_team2: number;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Als er geen matchId is, toon een overzichtspagina of redirect
    if (!matchId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          id,
          round_number,
          score_team1,
          score_team2,
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
        .eq("id", matchId)
        .single();

      if (error) {
        console.error("Fout bij ophalen:", error);
        setMatch(null);
      } else {
        setMatch(data);
      }
      setLoading(false);
    };

    fetchData();
  }, [matchId]);

  // Als er geen matchId is, toon de scores overzichtspagina
  if (!matchId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scores</h1>
          <p className="text-muted-foreground">
            Bekijk wedstrijdscores en uitslagen
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Selecteer een wedstrijd om de score details te bekijken.
              </p>
              <Button onClick={() => navigate('/matches')}>
                Ga naar Wedstrijden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  if (!match) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
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

  const getPlayerName = (pid?: { name: string }) => pid?.name || "Onbekend";

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug
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

      <Card>
        <CardHeader>
          <CardTitle>Speler Statistieken & Specials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {match.player_stats.map((p) => {
              const specials = match.match_specials.filter((s) => s.player_id === p.player_id);
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
    </div>
  );
}
