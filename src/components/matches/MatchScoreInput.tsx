import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Match = {
  id: string;
  tournament_id: string;
  round_number: number;
  score_team1: number | null;
  score_team2: number | null;
  status: string;
  team1_player1: { id: string; name: string };
  team1_player2: { id: string; name: string };
  team2_player1: { id: string; name: string };
  team2_player2: { id: string; name: string };
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
  const [specials, setSpecials] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  const allPlayers = [
    match.team1_player1,
    match.team1_player2,
    match.team2_player1,
    match.team2_player2,
  ];

  const isLocked =
    tournament.status !== "active" ||
    (match.status === "completed" && !tournament.is_simulation);

  const canSimulate =
    tournament.is_simulation && tournament.status === "not_started";

  useEffect(() => {
    const checkPreviousRoundComplete = async () => {
      if (round === 1 || tournament.status !== "active") return;

      const { data, error } = await supabase
        .from("matches")
        .select("id, status")
        .eq("tournament_id", match.tournament_id)
        .eq("round_number", round - 1);

      if (error || !data) {
        setBlocked(true);
        setBlockMessage("Kan eerdere ronde niet controleren.");
        return;
      }

      if (data.some((m) => m.status !== "completed")) {
        setBlocked(true);
        setBlockMessage(`Ronde ${round - 1} is nog niet volledig afgerond.`);
      }
    };

    checkPreviousRoundComplete();
  }, [match.tournament_id, round, tournament.status]);

  const handleSubmit = async () => {
    if (team1Score === "") {
      toast({ title: "Vul de score in voor team 1", variant: "destructive" });
      return;
    }

    const score1 = Number(team1Score);
    const score2 = 8 - score1;

    setLoading(true);

    const { error: matchError } = await supabase
      .from("matches")
      .update({
        score_team1: score1,
        score_team2: score2,
        status: "completed",
      })
      .eq("id", match.id);

    const stats = allPlayers.map((p) => ({
      match_id: match.id,
      player_id: p.id,
      team_number:
        p.id === match.team1_player1.id || p.id === match.team1_player2.id ? 1 : 2,
      games_won:
        p.id === match.team1_player1.id || p.id === match.team1_player2.id
          ? score1
          : score2,
    }));

    const { error: statsError } = await supabase
      .from("player_match_stats")
      .upsert(stats, { onConflict: "match_id,player_id" });

    const specialsFlat: any[] = [];
    Object.entries(specials).forEach(([player_id, types]) => {
      Object.entries(types).forEach(([special_type_id, count]) => {
        if (count > 0) {
          specialsFlat.push({ match_id: match.id, player_id, special_type_id, count });
        }
      });
    });

    const { error: specialsError } = specialsFlat.length
      ? await supabase
          .from("match_specials")
          .upsert(specialsFlat, { onConflict: "match_id,player_id,special_type_id" })
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
        description: `Score: ${score1} – ${score2}, specials ook opgeslagen.`,
      });
    }
  };

  if (blocked) {
    return <p className="text-sm text-yellow-600 font-medium mt-2">{blockMessage}</p>;
  }

  const handleSpecialChange = (playerId: string, typeId: string, count: number) => {
    setSpecials((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [typeId]: count,
      },
    }));
  };

  return (
    <div className="mt-4 space-y-6">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={team1Score}
          onChange={(e) => setTeam1Score(Number(e.target.value))}
          disabled={isLocked || loading}
          placeholder="Score team 1"
          className="w-28"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          value={team1Score !== "" ? 8 - Number(team1Score) : ""}
          disabled
          placeholder="Score team 2"
          className="w-28"
        />
      </div>

      <Accordion type="multiple" className="w-full">
        {allPlayers.map((player) => (
          <AccordionItem key={player.id} value={player.id}>
            <AccordionTrigger>{player.name.split(" ")[0]}</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-2">
                {[
                  { id: "ace", label: "Ace" },
                  { id: "double_fault", label: "Dubbele fout" },
                  { id: "love_game", label: "Love game" },
                  { id: "out_of_cage", label: "Uit de kooi" },
                  { id: "via_sidewall", label: "Via zijwand" },
                ].map(({ id, label }) => (
                  <div key={id} className="flex items-center gap-2">
                    <label className="w-36 text-sm">{label}</label>
                    <Input
                      type="number"
                      min={0}
                      value={specials[player.id]?.[id] || 0}
                      onChange={(e) =>
                        handleSpecialChange(player.id, id, Number(e.target.value))
                      }
                      className="w-20"
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button
        onClick={handleSubmit}
        disabled={isLocked || loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        ✅ Opslaan
      </Button>
    </div>
  );
}
