import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Match = {
  id: string;
  score_team1: number | null;
  score_team2: number | null;
  round_number: number;
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

  const isLocked =
    tournament.status !== "active" ||
    (match.status === "completed" && !tournament.is_simulation);

  const canSimulate =
    tournament.is_simulation && tournament.status === "not_started";

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
