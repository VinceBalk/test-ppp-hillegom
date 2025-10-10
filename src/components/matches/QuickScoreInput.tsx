import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Edit } from "lucide-react";

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
      // Save score WITHOUT completing the match
      const { error: matchError } = await supabase
        .from("matches")
        .update({
          team1_score: score,
          team2_score: team2Score,
          status: "in_progress",
        })
        .eq("id", match.id);

      if (matchError) throw matchError;

      const players = [
        { id: match.team1_player1_id, isTeam1: true },
        { id: match.team1_player2_id, isTeam1: true },
        { id: match.team2_player1_id, isTeam1: false },
        { id: match.team2_player2_id, isTeam1: false },
      ];

      // Delete existing stats first, then insert new ones
      const { error: deleteError } = await supabase
        .from("player_match_stats")
        .delete()
        .eq("match_id", match.id);

      if (deleteError) throw deleteError;

      const playerRows = players.map((p) => ({
        match_id: match.id,
        player_id: p.id,
        team_number: p.isTeam1 ? 1 : 2,
        games_won: p.isTeam1 ? score : team2Score,
      }));

      const { error: statsError } = await supabase
        .from("player_match_stats")
        .insert(playerRows);

      if (statsError) throw statsError;

      toast({
        title: "✓ Score opgeslagen!",
        description: `Stand: ${score} - ${team2Score}`,
        duration: 2000,
      });

      setLoading(false);
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (selectedScore === null) return;
    
    setLoading(true);

    try {
      // 1. Mark match as completed
      const { error: matchError } = await supabase
        .from("matches")
        .update({ status: "completed" })
        .eq("id", match.id);

      if (matchError) throw matchError;

      // 2. Get current match data to update tournament stats
      const { data: matchData } = await supabase
        .from("matches")
        .select("team1_score, team2_score, tournament_id, round_number")
        .eq("id", match.id)
        .single();

      if (matchData && matchData.team1_score !== null && matchData.team2_score !== null) {
        // 3. Update player_tournament_stats
        const players = [
          { id: match.team1_player1_id, isTeam1: true },
          { id: match.team1_player2_id, isTeam1: true },
          { id: match.team2_player1_id, isTeam1: false },
          { id: match.team2_player2_id, isTeam1: false },
        ];

        for (const player of players) {
          const gamesWon = player.isTeam1 ? matchData.team1_score : matchData.team2_score;
          const gamesLost = player.isTeam1 ? matchData.team2_score : matchData.team1_score;

          // Check if stats already exist for this player/tournament/round
          const { data: existing } = await supabase
            .from("player_tournament_stats")
            .select("id, games_won, games_lost")
            .eq("tournament_id", matchData.tournament_id)
            .eq("player_id", player.id)
            .eq("round_number", matchData.round_number)
            .maybeSingle();

          if (existing) {
            // Update: add to existing totals
            await supabase
              .from("player_tournament_stats")
              .update({
                games_won: existing.games_won + gamesWon,
                games_lost: existing.games_lost + gamesLost,
              })
              .eq("id", existing.id);
          } else {
            // Insert new record
            await supabase
              .from("player_tournament_stats")
              .insert({
                tournament_id: matchData.tournament_id,
                player_id: player.id,
                round_number: matchData.round_number,
                games_won: gamesWon,
                games_lost: gamesLost,
              });
          }
        }
      }

      toast({
        title: "✓ Wedstrijd voltooid!",
        description: "Stats zijn bijgewerkt voor ranking",
        duration: 2000,
      });

      setTimeout(() => {
        if (onSaved) onSaved();
      }, 800);
    } catch (error: any) {
      toast({
        title: "Fout bij voltooien",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: "in_progress" })
        .eq("id", match.id);

      if (error) throw error;

      toast({
        title: "✓ Wedstrijd heropend",
        description: "Je kunt nu de score aanpassen",
        duration: 2000,
      });

      // Reload de pagina om de nieuwe status te tonen
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Fout bij heropenen",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (isLocked && match.status === "completed") {
    return (
      <div className="py-4 space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          <span className="text-base font-medium">
            {match.team1_score} - {match.team2_score}
          </span>
        </div>
        
        {/* Reopen button for corrections */}
        <div className="pt-3 border-t">
          <Button
            onClick={handleReopen}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
            size="lg"
          >
            <Edit className="h-5 w-5 mr-2" />
            Wedstrijd Bewerken (Score Corrigeren)
          </Button>
        </div>
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
    <div className="py-4 space-y-4">
      <div>
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

      {/* Complete match button - only show if score is selected */}
      {selectedScore !== null && !loading && (
        <div className="pt-3 border-t">
          <Button
            onClick={handleComplete}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            size="lg"
          >
            <Check className="h-5 w-5 mr-2" />
            Wedstrijd Voltooien ({selectedScore} - {8 - selectedScore})
          </Button>
        </div>
      )}
    </div>
  );
}
