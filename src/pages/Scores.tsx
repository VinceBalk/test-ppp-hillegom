import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tournament = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  current_round: number;
};

type Match = {
  id: string;
  tournament_id: string;
  round_number: number;
  court_name: string;
  team1_name: string;
  team2_name: string;
  score_team1: number | null;
  score_team2: number | null;
  players: PlayerSpecials[];
};

type PlayerSpecials = {
  player_name: string;
  specials: { type: string; count: number }[];
};

export default function ScoresPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matchesByTournament, setMatchesByTournament] = useState<
    Record<string, Match[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);

      const { data: tournaments } = await supabase
        .from("tournaments")
        .select("*")
        .eq("status", "in_progress");

      if (!tournaments) return;

      const result: Record<string, Match[]> = {};

      for (const tournament of tournaments) {
        const { data: matches } = await supabase.rpc("get_completed_match_scores", {
          tournamentid: tournament.id,
        });

        if (matches) result[tournament.id] = matches;
      }

      setTournaments(tournaments);
      setMatchesByTournament(result);
      setLoading(false);
    };

    fetchScores();
  }, []);

  if (loading) return <p>Bezig met laden...</p>;

  return (
    <div className="space-y-8 px-4 md:px-8 pb-12">
      <h1 className="text-2xl font-bold">Scores & Uitslagen</h1>
      <p className="text-muted-foreground">Bekijk de resultaten van alle toernooien</p>

      {tournaments.map((tournament) => (
        <Card key={tournament.id} className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">{tournament.name}</CardTitle>
            <div className="text-sm text-muted-foreground flex gap-2 flex-wrap">
              <span>
                {new Date(tournament.start_date).toLocaleDateString("nl-NL")} –{" "}
                {new Date(tournament.end_date).toLocaleDateString("nl-NL")}
              </span>
              <span>•</span>
              <span>Status: {tournament.status === "in_progress" ? "Actief" : tournament.status}</span>
              <span>•</span>
              <span>Huidige ronde: {tournament.current_round}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {matchesByTournament[tournament.id]?.length ? (
              matchesByTournament[tournament.id].map((match) => (
                <div
                  key={match.id}
                  className="p-4 bg-white rounded border border-gray-200 shadow-sm space-y-2"
                >
                  <div className="flex flex-wrap justify-between items-center">
                    <div className="font-medium">
                      {match.team1_name} vs {match.team2_name}
                    </div>
                    <div>
                      <Badge variant="secondary">Ronde {match.round_number}</Badge>{" "}
                      <Badge variant="outline">{match.court_name}</Badge>
                    </div>
                  </div>

                  <div className="text-lg font-bold">
                    {match.score_team1} – {match.score_team2}
                  </div>

                  <div className="mt-2 space-y-1">
                    <h4 className="font-semibold text-sm">Specials:</h4>
                    {match.players.map((player) => (
                      <div key={player.player_name} className="text-sm pl-2">
                        <span className="font-medium">{player.player_name}:</span>{" "}
                        {player.specials.length > 0 ? (
                          player.specials.map((s, i) => (
                            <span key={i}>
                              {s.type} × {s.count}
                              {i < player.specials.length - 1 && ", "}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Geen</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nog geen voltooide wedstrijden</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
