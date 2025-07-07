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
  team1_score: number | null;
  team2_score: number | null;
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
  status: "not_started" | "in_progress" | "completed";
  is_simulation: boolean;
};

type Props = {
  match: Match;
  tournament: Tournament;
  round: number;
};

type SpecialType = {
  id: string;
  name: string;
};

export default function MatchScoreInput({ match, tournament, round }: Props) {
  const { toast } = useToast();
  const [team1Score, setTeam1Score] = useState<number | "">(match.team1_score ?? "");
  const [specialTypes, setSpecialTypes] = useState<SpecialType[]>([]);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  const allPlayers = [
    {
      id: match.team1_player1_id,
      name: match.team1_player1?.name ?? "Speler 1",
    },
    {
      id: match.team1_player2_id,
      name: match.team1_player2?.name ?? "Speler 2",
    },
    {
      id: match.team2_player1_id,
      name: match.team2_player1?.name ?? "Speler 3",
    },
    {
      id: match.team2_player2_id,
      name: match.team2_player2?.name ?? "Speler 4",
    },
  ];

  const [specials, setSpecials] = useState<{
    [playerId: string]: { [specialId: string]: number };
  }>({});

  const isLocked = tournament.status !== "in_progress";

  useEffect(() => {
    const fetchSpecialTypes = async () => {
      const { data, error } = await supabase
        .from("special_types")
        .select("*")
        .eq("is_active", true);

      if (!error && data) {
        setSpecialTypes(data);
      }
    };

    const initSpecials = () => {
      const init = {};
      for (const player of allPlayers) {
        init[player.id] = {};
        for (const s of specialTypes) {
          init[player.id][s.id] = 0;
        }
      }
      setSpecials(init);
    };

    fetchSpecialTypes();
  }, []);

  useEffect(() => {
    if (specialTypes.length > 0) {
      const init = {};
      for (const player of allPlayers) {
        init[player.id] = {};
        for (const s of specialTypes) {
          init[player.id][s.id] = 0;
        }
      }
      setSpecials(init);
    }
  }, [specialTypes]);

  useEffect(() => {
    const checkPreviousRoundComplete = async () => {
      if (round === 1 || tournament.status !== "in_progress") return;

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
    if (team1Score === "" || isNaN(Number(team1Score))) {
      toast({ title: "Vul een geldige score in", variant: "destructive" });
      return;
    }

    const team1 = Number(team1Score);
    const team2 = 8 - team1;

    setLoading(true);

    const { error: matchError } = await supabase
      .from("matches")
      .update({
        team1_score: team1,
        team2_score: team2,
        status: "completed",
      })
      .eq("id", match.id);

    const allPlayersScores = [
      { player_id: match.team1_player1_id, team_number: 1, games_won: team1 },
      { player_id: match.team1_player2_id, team_number: 1, games_won: team1 },
      { player_id: match.team2_player1_id, team_number: 2, games_won: team2 },
      { player_id: match.team2_player2_id, team_number: 2, games_won: team2 },
    ];

    const { error: statsError } = await supabase
      .from("player_match_stats")
      .upsert(
        allPlayersScores.map((p) => ({
          match_id: match.id,
          player_id: p.player_id,
          team_number: p.team_number,
          games_won: p.games_won,
        })),
        { onConflict: "match_id,player_id" }
      );

    const specialsToInsert = [];

    for (const playerId in specials) {
      for (const specialId in specials[playerId]) {
        const count = specials[playerId][specialId];
        if (count > 0) {
          specialsToInsert.push({
            match_id: match.id,
            player_id: playerId,
            special_type_id: specialId,
            count,
          });
        }
      }
    }

    const { error: specialsError } = specialsToInsert.length
      ? await supabase
          .from("match_specials")
          .upsert(specialsToInsert, {
            onConflict: "match_id,player_id,special_type_id",
          })
      : { error: null };

    setLoading(false);

    if (matchError || statsError || specialsError) {
      toast({
        title: "Fout bij opslaan",
        description:
          matchError?.message || statsError?.message || specialsError?.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Opgeslagen",
        description: `Score: ${team1} – ${team2}`,
      });
    }
  };

  if (blocked) {
    return <p className="text-sm text-yellow-600 font-medium mt-2">{blockMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-1">
            {allPlayers[0].name} & {allPlayers[1].name}
          </label>
          <Input
            type="number"
            min={0}
            max={8}
            value={team1Score}
            onChange={(e) => {
              const val = Math.min(8, Math.max(0, Number(e.target.value)));
              setTeam1Score(val);
            }}
            disabled={isLocked || loading}
            placeholder="Score team 1"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">
            {allPlayers[2].name} & {allPlayers[3].name}
          </label>
          <Input
            type="number"
            value={team1Score === "" ? "" : 8 - Number(team1Score)}
            disabled
            placeholder="Score team 2"
          />
        </div>
      </div>

      <Accordion type="multiple" className="w-full">
        {allPlayers.map((player) => (
          <AccordionItem key={player.id} value={player.id}>
            <AccordionTrigger className="text-sm font-semibold">
              {player.name}
            </AccordionTrigger>
            <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {specialTypes.map((s) => (
                <div key={s.id}>
                  <label className="text-sm text-muted-foreground">
                    {s.name}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={specials[player.id]?.[s.id] ?? 0}
                    onChange={(e) =>
                      setSpecials((prev) => ({
                        ...prev,
                        [player.id]: {
                          ...prev[player.id],
                          [s.id]: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button
        onClick={handleSubmit}
        disabled={isLocked || loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        ✅ Score bevestigen
      </Button>
    </div>
  );
}
