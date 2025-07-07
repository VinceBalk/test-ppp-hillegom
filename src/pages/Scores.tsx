import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Match {
  id: string;
  team1_score: number;
  team2_score: number;
  team1_player1: { name: string };
  team1_player2: { name: string };
  team2_player1: { name: string };
  team2_player2: { name: string };
  tournament: { name: string };
  status: string;
}

interface Special {
  id: string;
  match_id: string;
  player_id: string;
  count: number;
  special_type: {
    name: string;
  };
  player: {
    name: string;
  };
}

export default function ScoresPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [specials, setSpecials] = useState<Special[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: matchesData } = await supabase
        .from("matches")
        .select(
          `
          id,
          team1_score,
          team2_score,
          status,
          tournament(name),
          team1_player1(name),
          team1_player2(name),
          team2_player1(name),
          team2_player2(name)
        `
        )
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      const { data: specialsData } = await supabase
        .from("match_specials")
        .select(
          `
          id,
          match_id,
          player_id,
          count,
          special_type(name),
          player(name)
        `
        );

      setMatches(matchesData || []);
      setSpecials(specialsData || []);
    };

    fetchData();
  }, []);

  const getPlayerSpecials = (matchId: string, playerName: string) => {
    const playerSpecials = specials.filter(
      (s) => s.match_id === matchId && s.player.name === playerName
    );

    if (playerSpecials.length === 0) return "–";

    return playerSpecials.map((s) => (
      <div key={s.id} className="text-sm">
        {s.special_type.name}: {s.count}
      </div>
    ));
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Scores en Specials</h1>
      {matches.map((match) => (
        <Card key={match.id}>
          <CardHeader>
            <CardTitle className="text-lg">
              {match.team1_player1.name} & {match.team1_player2.name} vs{" "}
              {match.team2_player1.name} & {match.team2_player2.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Toernooi: {match.tournament.name}
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Badge variant="default">
                Uitslag: {match.team1_score} – {match.team2_score}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-primary mb-2">
                  Team 1
                </h3>
                <div className="bg-muted p-2 rounded">
                  <div className="font-medium">{match.team1_player1.name}</div>
                  {getPlayerSpecials(match.id, match.team1_player1.name)}
                  <div className="font-medium mt-2">
                    {match.team1_player2.name}
                  </div>
                  {getPlayerSpecials(match.id, match.team1_player2.name)}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-primary mb-2">
                  Team 2
                </h3>
                <div className="bg-muted p-2 rounded">
                  <div className="font-medium">{match.team2_player1.name}</div>
                  {getPlayerSpecials(match.id, match.team2_player1.name)}
                  <div className="font-medium mt-2">
                    {match.team2_player2.name}
                  </div>
                  {getPlayerSpecials(match.id, match.team2_player2.name)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
