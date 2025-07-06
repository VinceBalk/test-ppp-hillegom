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
  const [team1Score, setTeam1Score] = useState<number | "">(
    match.score_team1 ?? ""
  );
  const [team2Score, setTeam2Score] = useState<number | "">(
    match.score_team2 ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  const isLocked =
    tournament.status !== "active" ||
    (match.status === "completed" && !tournament.is_simulation);

  const canSimulate =
    tournament.is_simulation && tournament.status === "not_started";

  // Check vorige ronde status
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
      toast({
        title: "Vul beide scores in",
        variant: "destructive",
      });
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

    const { error } = await supabase
      .from("matches")
      .update({
        score_team1: Number(team1Score),
        score_team2: Number(team2Score),
        status: "completed",
      })
      .eq("id", match.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Score opgeslagen",
        description: `De score is bijgewerkt naar ${team1Score} – ${team2Score}`,
      });
    }
  };

  if (blocked) {
    return (
      <p className="text-sm text-yellow-600 font-medium mt-2">{blockMessage}</p>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-4">
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
