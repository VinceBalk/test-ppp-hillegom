import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

type Match = {
  id: string;
  tournament_id: string;
  round_number: number;
  status: string;
  team1_score?: number;
  team2_score?: number;
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
  onSaved?: () => void;
};

export default function QuickScoreInput({ match, tournament, onSaved }: Props) {
  const { toast } = useToast();
  const [selectedScore, setSelectedScore] = useState<number | null>(
    match.team1_score ?? null
  );
  const [loading, setLoading] = useState(false);

  const isLocked = tournament.status !== "active" || match.status === "completed";
  const scores = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  const handleSave = async (score: number) => {
    setSelectedScore(score);
    setLoading(true);

    const team2Score = 8 - score;

    try {
      const { error: matchError } = await supabase
        .from("matches")
        .update({
          team1_score: score,
          team2_score: team2Score,
          status: "completed",
        })
        .eq("id", match.id);

      if (matchError) throw matchError;

      const players = [
        { id: match.team1_player1_id, isTeam1: true },
        { id: match.team1_player2_id, isTeam1: true },
        { id: match.team2_player1_id, isTeam1: false },
        { id: match.team2_player2_id, isTeam1: false },
      ];

      const playerRows = players.map((p) => ({
        match_id: match.id,
        player_id: p.id,
        team_number: p.isTeam1 ? 1 : 2,
        games_won: p.isTeam1 ? score : team2Score,
      }));

      const { error: statsError } = await supabase
        .from("player_match_stats")
        .upsert(playerRows, { onConflict: "match_id,player_id" });

      if (statsError) throw statsError;

      toast({
        title: "✓ Score succesvol opgeslagen!",
        description: `Eindstand: ${score} - ${team2Score}`,
        duration: 3000,
      });

      // Wait briefly to show success state before closing
      setTimeout(() => {
        if (onSaved) onSaved();
      }, 800);
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (isLocked && match.status === "completed") {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <Check className="h-5 w-5 text-green-600" />
        <span className="text-base font-medium">
          {match.team1_score} - {match.team2_score}
        </span>
      </div>
    );
  }

  if (isLocked) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Toernooi moet actief zijn om scores in te voeren
      </p>
    );
  }

  return (
    <div className="py-4">
      <p className="text-sm text-muted-foreground mb-3 text-center">
        Score voor {match.team1_player1?.name} & {match.team1_player2?.name}:
      </p>
      <div className="grid grid-cols-9 gap-2">
        {scores.map((score) => (
          <Button
            key={score}
            size="lg"
            variant={selectedScore === score ? "default" : "outline"}
            onClick={() => handleSave(score)}
            disabled={loading}
            className={`text-lg font-bold h-14 w-full transition-all ${
              loading && selectedScore === score
                ? "bg-green-600 text-white animate-pulse"
                : ""
            }`}
          >
            {loading && selectedScore === score ? (
              <Check className="h-5 w-5" />
            ) : (
              score
            )}
          </Button>
        ))}
      </div>
      {loading && (
        <p className="text-sm text-green-600 font-medium text-center mt-3 animate-pulse">
          Bezig met opslaan...
        </p>
      )}
    </div>
  );
}
