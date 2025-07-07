import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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

type PlayerSpecial = {
  player_id: string;
  count: number;
};

export default function MatchScoreInput({ match, tournament, round }: Props) {
  const { toast } = useToast();
  const [team1Score, setTeam1Score] = useState<number | "">(match.score_team1 ?? "");
  const [team2Score, setTeam2Score] = useState<number | "">(match.score_team2 ?? "");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  const [specials, setSpecials] = useState<{
    [playerId: string]: number;
  }>({
    [match.team1_player1_id]: 0,
    [match.team1_player2_id]: 0,
    [match.team2_player1_id]: 0,
    [match.team2_player2_id]: 0,
  });

  const isLocked =
    tournament.status !== "active" ||
    (match.status === "completed" && !tournament.is_simulation);

  const canSimulate =
    tournament.is_simulation && tournament.status === "not_started";

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
    if (team1Score === "" || team2Score === "") {
      toast({ title: "Vul beide scores in", variant: "destructive" });
      return;
    }

    if (canSimulate) {
      toast({
        title: "Score gesimuleerd",
        description: `Score: ${team1Score} – ${team2Score}`,
      });
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
        special_type_id: "tiebreaker", // pas aan als je meerdere types gebruikt
        count,
      }));

    const { error: specialsError } = specialsToInsert.length
      ? await supabase.from("match_specials").upsert(specialsToInsert, { onConflict: "match_id,player_id,special_type_id" })
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

  const handleSpecialChange = (playerId: string, value: number) => {
    setSpecials((prev) => ({
      ...prev,
      [playerId]: value,
    }));
  };

  const allPlayerIds = [
    match.team1_player1_id,
    match.team1_player2_id,
    match.team2_player1_id,
    match.team2_player2_id,
  ];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={team1Score}
          onChange={(e) => setTeam1Score(Number(e.target.value))}
          disabled={isLocked || loading}
          placeholder="Team 1"
          className="w-20"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          value={team2Score}
          onChange={(e) => setTeam2Score(Number(e.target.value))}
          disabled={isLocked || loading}
          placeholder="Team 2"
          className="w-20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allPlayerIds.map((pid) => (
          <div key={pid} className="flex items-center gap-2">
            <span className="text-sm w-24">Specials {pid.slice(0, 4)}…</span>
            <Input
              type="number"
              value={specials[pid]}
              onChange={(e) => handleSpecialChange(pid, Number(e.target.value))}
              className="w-24"
              min={0}
            />
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLocked || loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {canSimulate ? "▶️ Simuleer" : "✅ Opslaan"}
      </Button>
    </div>
  );
}
