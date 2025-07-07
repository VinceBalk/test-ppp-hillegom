import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function MatchScorePage() {
  const router = useRouter();
  const { matchId } = router.query;
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId || typeof matchId !== "string") return;

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

  if (loading) return <p className="p-4 text-sm text-muted-foreground">Laden...</p>;
  if (!match) return <p className="p-4 text-red-600">Geen score gevonden voor deze wedstrijd.</p>;

  const getPlayerName = (pid?: { name: string }) => pid?.name || "Onbekend";

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Uitslag: Ronde {match.round_number}</CardTitle>
          <p className="text-sm text-muted-foreground">{match.tournament?.name}</p>
          <p className="text-sm text-muted-foreground">{match.court?.name}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-1">
                {getPlayerName(match.team1_player1)}{" "}
                {match.team1_player2 && `& ${getPlayerName(match.team1_player2)}`}
              </p>
              <p className="text-2xl">{match.score_team1}</p>
            </div>
            <div>
              <p className="font-semibold mb-1">
                {getPlayerName(match.team2_player1)}{" "}
                {match.team2_player2 && `& ${getPlayerName(match.team2_player2)}`}
              </p>
              <p className="text-2xl">{match.score_team2}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specials & Stats per speler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {match.player_stats.map((p) => {
              const specials = match.match_specials.filter((s) => s.player_id === p.player_id);
              return (
                <div key={p.player_id} className="bg-muted/50 p-3 rounded">
                  <p className="font-semibold mb-1">{p.player.name}</p>
                  <p className="text-sm mb-2">Games gewonnen: {p.games_won}</p>
                  {specials.length > 0 ? (
                    <ul className="text-sm list-disc list-inside">
                      {specials.map((s, i) => (
                        <li key={i}>
                          {s.special_type_id} × {s.count}
                        </li>
                      ))}
                    </ul>
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
