import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp } from "lucide-react";

type Match = {
  id: string;
  tournament_id: string;
  round_number: number;
  score_team1: number | null;
  score_team2: number | null;
  status: string;
  team1_player1_id: string;
  team1_player2_id: string;
  team2_player1_id: string;
  team2_player2_id: string;
  team1_player1?: { name: string };
  team1_player2?: { name: string };
  team2_player1?: { name: string };
  team2_player2?: { name: string };
};

type Tournament = {
  id: string;
  status: "not_started" | "active" | "completed";
  is_simulation: boolean;
};

type Props = {
  match: Match;
  tournament: Tournament;
  round: number;
};

export default function MatchScoreInput({ match, tournament, round }: Props) {
  const { toast } = useToast();
  const [team1Score, setTeam1Score] = useState<number | "">(match.score_team1 ?? "");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  const [specials, setSpecials] = useState<Record<string, number>>({
    [match.team1_player1_id]: 0,
    [match.team1_player2_id]: 0,
    [match.team2_player1_id]: 0,
    [match.team2_player2_id]: 0,
  });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isLocked =
    tournament.status !== "active" ||
    (match.status === "completed" && !tournament.is_simulation);

  const canSimulate = tournament.is_simulation && tournament.status === "not_started";

  const team2Score = team1Score === "" ? "" : 8 - Number(team1Score);

  useEffect(() => {
    const checkPreviousRoundComplete = async () => {
      if (round === 1 || tournament.status !== "active") return;

      const prevRound = round - 1;
      const { data: matches, error } = await supabase
        .from("matches")
        .select("id, status")
        .eq("tournament_id", match.tournament_id)
        .eq("round_number", prevRound);

      if (error || !matches) {
        setBlocked(true);
        setBlockMessage("Kan eerdere ronde niet controleren.");
        return;
      }

      const notCompleted = matches.filter((m) => m.status !== "completed");

      if (notCompleted.length > 0) {
        setBlocked(true);
        setBlockMessage(
          `Ronde ${prevRound} is nog niet volledig afgerond. Invoer is geblokkeerd.`
        );
      }
    };

    checkPreviousRoundComplete();
  }, [match.tournament_id, round, tournament.status]);

  const handleSubmit = async () => {
    if (team1Score === "") {
      toast({ title: "Vul een score voor Team 1 in", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error: matchError } = await supabase
      .from("matches")
      .update({
        score_team1: Number(team1Score),
        score_team2: Number(team2Score),
        status: "completed",
      })
      .eq("id", match.id);

    const players = [
      { player_id: match.team1_player1_id, team_number: 1, games_won: Number(team1Score) },
      { player_id: match.team1_player2_id, team_number: 1, games_won: Number(team1Score) },
      { player_id: match.team2_player1_id, team_number: 2, games_won: Number(team2Score) },
      { player_id: match.team2_player2_id, team_number: 2, games_won: Number(team2Score) },
    ];

    const { error: statsError } = await supabase
      .from("player_match_stats")
      .upsert(
        players.map((p) => ({
          match_id: match.id,
          player_id: p.player_id,
          team_number: p.team_number,
          games_won: p.games_won,
        })),
        { onConflict: "match_id,player_id" }
      );

    const specialsToInsert = Object.entries(specials)
      .filter(([_, count]) => count > 0)
      .map(([player_id, count]) => ({
        match_id: match.id,
        player_id,
        special_type_id: "tiebreaker",
        count,
      }));

    const { error: specialsError } = specialsToInsert.length
      ? await supabase
          .from("match_specials")
          .upsert(specialsToInsert, { onConflict: "match_id,player_id,special_type_id" })
      : { error: null };

    setLoading(false);

    if (matchError || statsError || specialsError) {
      toast({
        title: "Fout bij opslaan",
        description: matchError?.message || statsError?.message || specialsError?.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Score opgeslagen",
        description: `Score: ${team1Score} – ${team2Score}, specials ook opgeslagen.`,
      });
    }
  };

  if (blocked) {
    return (
      <p className="text-sm text-yellow-600 font-medium mt-2">{blockMessage}</p>
    );
  }

  const allPlayers = [
    {
      id: match.team1_player1_id,
      name: match.team1_player1?.name?.split(" ")[0] || "Speler 1A",
    },
    {
      id: match.team1_player2_id,
      name: match.team1_player2?.name?.split(" ")[0] || "Speler 1B",
    },
    {
      id: match.team2_player1_id,
      name: match.team2_player1?.name?.split(" ")[0] || "Speler 2A",
    },
    {
      id: match.team2_player2_id,
      name: match.team2_player2?.name?.split(" ")[0] || "Speler 2B",
    },
  ];

  return (
    <div className="mt-4 space-y-4">
      {/* Score invoer */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-sm text-muted-foreground">Team 1:</span>
        <Input
          type="number"
          value={team1Score}
          onChange={(e) => setTeam1Score(Number(e.target.value))}
          disabled={isLocked || loading}
          placeholder="0"
          className="w-20"
          min={0}
          max={8}
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="number"
          value={team2Score}
          disabled
          placeholder="0"
          className="w-20 bg-gray-50"
        />
        <span className="font-medium text-sm text-muted-foreground">Team 2</span>
      </div>

      {/* Specials */}
      <div className="space-y-2">
        {allPlayers.map((player) => (
          <div key={player.id} className="border rounded-md p-2 bg-muted/10">
            <button
              type="button"
              className="flex items-center justify-between w-full text-sm font-medium text-left"
              onClick={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [player.id]: !prev[player.id],
                }))
              }
            >
              <span>Specials voor {player.name}</span>
              {expanded[player.id] ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expanded[player.id] && (
              <div className="mt-2">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Aantal tiebreaker specials
                </label>
                <Input
                  type="number"
                  min={0}
                  value={specials[player.id] || 0}
                  onChange={(e) =>
                    setSpecials((prev) => ({
                      ...prev,
                      [player.id]: Number(e.target.value),
                    }))
                  }
                  className="w-24"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLocked || loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {canSimulate ? "▶️ Simuleer" : "✅ Score Opslaan"}
      </Button>
    </div>
  );
}
