import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Player = {
  id: string;
  name: string;
};

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
  const [team2Score, setTeam2Score] = useState<number | "">(match.score_team2 ?? "");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const [expandedPlayers, setExpandedPlayers] = useState<string[]>([]);
  const [specials, setSpecials] = useState<{
    [playerId: string]: { [specialType: string]: number };
  }>({});

  const allPlayers = [
    {
      id: match.team1_player1_id,
      name: match.team1_player1?.name || "Team 1 - Speler 1",
    },
    {
      id: match.team1_player2_id,
      name: match.team1_player2?.name || "Team 1 - Speler 2",
    },
    {
      id: match.team2_player1_id,
      name: match.team2_player1?.name || "Team 2 - Speler 1",
    },
    {
      id: match.team2_player2_id,
      name: match.team2_player2?.name || "Team 2 - Speler 2",
    },
  ];

  const team1Names = `${match.team1_player1.name.split(" ")[0]} & ${match.team1_player2.name.split(" ")[0]}`;
  const team2Names = `${match.team2_player1.name.split(" ")[0]} & ${match.team2_player2.name.split(" ")[0]}`;

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

  const handleSpecialChange = (
    playerId: string,
    type: string,
    value: number
  ) => {
    setSpecials((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [type]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (team1Score === "" || Number(team1Score) > 8 || Number(team1Score) < 0) {
      toast({ title: "Score team 1 is ongeldig", variant: "destructive" });
      return;
    }

    const score1 = Number(team1Score);
    const score2 = 8 - score1;
    setTeam2Score(score2);

    setLoading(true);

    const { error: matchError } = await supabase
      .from("matches")
      .update({
        score_team1: score1,
        score_team2: score2,
        status: "completed",
      })
      .eq("id", match.id);

    const players = [
      { player_id: match.team1_player1_id, games_won: score1 },
      { player_id: match.team1_player2_id, games_won: score1 },
      { player_id: match.team2_player1_id, games_won: score2 },
      { player_id: match.team2_player2_id, games_won: score2 },
    ];

    const { error: statsError } = await supabase
      .from("player_match_stats")
      .upsert(
        players.map((p) => ({
          match_id: match.id,
          player_id: p.player_id,
          games_won: p.games_won,
        })),
        { onConflict: "match_id,player_id" }
      );

    const specialsToInsert: any[] = [];

    Object.entries(specials).forEach(([playerId, types]) => {
      Object.entries(types).forEach(([specialTypeId, count]) => {
        if (count > 0) {
          specialsToInsert.push({
            match_id: match.id,
            player_id: playerId,
            special_type_id: specialTypeId,
            count,
          });
        }
      });
    });

    const { error: specialsError } = specialsToInsert.length
      ? await supabase
          .from("match_specials")
          .upsert(specialsToInsert, { onConflict: "match_id,player_id,special_type_id" })
      : { error: null };

    setLoading(false);

    if (matchError || statsError || specialsError) {
      toast({
        title: "Fout bij opslaan",
        description:
          matchError?.message ||
          statsError?.message ||
          specialsError?.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Score opgeslagen",
        description: "Scores en specials zijn succesvol verwerkt.",
      });
    }
  };

  const togglePlayer = (playerId: string) => {
    setExpandedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  if (blocked) {
    return (
      <p className="text-sm text-yellow-600 font-medium mt-2">{blockMessage}</p>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Score invoer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
          <label className="block text-sm font-medium mb-1">{team1Names}</label>
          <Input
            type="number"
            min={0}
            max={8}
            value={team1Score}
            onChange={(e) => setTeam1Score(Number(e.target.value))}
            disabled={isLocked || loading}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{team2Names}</label>
          <Input
            type="number"
            value={team2Score !== "" ? 8 - Number(team1Score) : ""}
            disabled
            className="w-full bg-gray-100"
          />
        </div>
      </div>

      {/* Specials per speler */}
      <div className="space-y-4">
        {allPlayers.map((player) => (
          <div key={player.id}>
            <button
              type="button"
              className="text-sm font-semibold underline text-left w-full"
              onClick={() => togglePlayer(player.id)}
            >
              {player.name}
            </button>
            {expandedPlayers.includes(player.id) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {["aces", "dubbele_fout", "love_game", "uit_kooi", "zijwand"].map(
                  (type) => (
                    <div key={type}>
                      <label className="block text-xs text-muted-foreground mb-1">
                        {type.replace("_", " ")}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={specials[player.id]?.[type] || 0}
                        onChange={(e) =>
                          handleSpecialChange(player.id, type, Number(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>
                  )
                )}
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
        Opslaan
      </Button>
    </div>
  );
}
