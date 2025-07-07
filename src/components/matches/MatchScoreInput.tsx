import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getShortTeamName } from "@/utils/matchUtils";

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

type SpecialType = {
  id: string;
  name: string;
};

export default function MatchScoreInput({ match, tournament, round }: Props) {
  const { toast } = useToast();
  const [team1Score, setTeam1Score] = useState<number | "">(match.score_team1 ?? "");
  const [specialTypes, setSpecialTypes] = useState<SpecialType[]>([]);
  const [specials, setSpecials] = useState<Record<string, Record<string, number>>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  const team1Name = getShortTeamName(match.team1_player1, match.team1_player2);
  const team2Name = getShortTeamName(match.team2_player1, match.team2_player2);
  const allPlayerIds = [
    match.team1_player1_id,
    match.team1_player2_id,
    match.team2_player1_id,
    match.team2_player2_id,
  ];

  const isLocked =
    tournament.status !== "active" ||
    (match.status === "completed" && !tournament.is_simulation);

  useEffect(() => {
    const checkPreviousRoundComplete = async () => {
      if (round === 1 || tournament.status !== "active") return;
      const { data: matches } = await supabase
        .from("matches")
        .select("id, status")
        .eq("tournament_id", match.tournament_id)
        .eq("round_number", round - 1);

      if (!matches) {
        setBlocked(true);
        setBlockMessage("Kan eerdere ronde niet controleren.");
        return;
      }

      const notCompleted = matches.filter((m) => m.status !== "completed");
      if (notCompleted.length > 0) {
        setBlocked(true);
        setBlockMessage(`Ronde ${round - 1} is nog niet afgerond.`);
      }
    };

    const fetchSpecials = async () => {
      const { data } = await supabase
        .from("special_types")
        .select("id, name")
        .eq("is_active", true);
      if (data) setSpecialTypes(data);
    };

    checkPreviousRoundComplete();
    fetchSpecials();
  }, [match.tournament_id, round, tournament.status]);

  useEffect(() => {
    const initial: Record<string, Record<string, number>> = {};
    allPlayerIds.forEach((pid) => {
      initial[pid] = {};
      specialTypes.forEach((s) => {
        initial[pid][s.id] = 0;
      });
    });
    setSpecials(initial);
  }, [specialTypes]);

  const handleSpecialChange = (playerId: string, specialId: string, value: number) => {
    setSpecials((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [specialId]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (team1Score === "" || isNaN(Number(team1Score))) {
      toast({ title: "Vul een geldige score in", variant: "destructive" });
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setLoading(true);
    const score1 = Number(team1Score);
    const score2 = 8 - score1;

    await supabase
      .from("matches")
      .update({
        score_team1: score1,
        score_team2: score2,
        status: "completed",
      })
      .eq("id", match.id);

    const players = [
      { id: match.team1_player1_id, score: score1 },
      { id: match.team1_player2_id, score: score1 },
      { id: match.team2_player1_id, score: score2 },
      { id: match.team2_player2_id, score: score2 },
    ];

    await supabase.from("player_match_stats").upsert(
      players.map((p) => ({
        match_id: match.id,
        player_id: p.id,
        games_won: p.score,
      })),
      { onConflict: "match_id,player_id" }
    );

    const specialsArray = Object.entries(specials)
      .flatMap(([playerId, specialsByType]) =>
        Object.entries(specialsByType).map(([specialId, count]) => ({
          match_id: match.id,
          player_id: playerId,
          special_type_id: specialId,
          count,
        }))
      )
      .filter((s) => s.count > 0);

    if (specialsArray.length > 0) {
      await supabase.from("match_specials").upsert(specialsArray, {
        onConflict: "match_id,player_id,special_type_id",
      });
    }

    toast({ title: "Score opgeslagen", description: `${score1} – ${score2}` });
    setLoading(false);
    setShowConfirm(false);
  };

  if (blocked) {
    return <p className="text-sm text-yellow-600 font-medium mt-2">{blockMessage}</p>;
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span>{team1Name}</span>
        <span>–</span>
        <span>{team2Name}</span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={team1Score}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val >= 0 && val <= 8) setTeam1Score(val);
          }}
          disabled={isLocked || loading}
          className="w-24"
          min={0}
          max={8}
        />
        <span className="text-muted-foreground">–</span>
        <Input value={team1Score !== "" ? 8 - Number(team1Score) : ""} disabled className="w-24" />
      </div>

      {specialTypes.length > 0 && (
        <div className="space-y-4">
          {allPlayerIds.map((pid) => (
            <div key={pid} className="space-y-2">
              <div className="font-medium text-sm">
                Specials voor {pid.slice(0, 4)}… {/* eventueel vervangen door echte naam */}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {specialTypes.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-sm w-24">{s.name}</span>
                    <Input
                      type="number"
                      value={specials[pid]?.[s.id] ?? 0}
                      onChange={(e) => handleSpecialChange(pid, s.id, Number(e.target.value))}
                      className="w-20"
                      min={0}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isLocked || loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        ✅ Score bevestigen
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bevestig de ingevoerde score</DialogTitle>
          </DialogHeader>
          <p>
            Team 1: <strong>{team1Name}</strong> — {team1Score} <br />
            Team 2: <strong>{team2Name}</strong> — {team1Score !== "" ? 8 - Number(team1Score) : ""}
          </p>
          <DialogFooter>
            <Button onClick={confirmSubmit} disabled={loading}>
              Bevestig en sla op
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
