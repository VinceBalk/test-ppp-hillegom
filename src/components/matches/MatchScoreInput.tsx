import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  round: number;
};

export default function MatchScoreInput({ match, tournament, round }: Props) {
  const { toast } = useToast();
  const [team1Score, setTeam1Score] = useState<number | "">(match.team1_score ?? "");
  const team2Score = team1Score !== "" ? 8 - Number(team1Score) : "";
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [blockMessage, setBlockMessage] = useState("");

  const players = [
    { id: match.team1_player1_id, name: match.team1_player1?.name || "Speler 1" },
    { id: match.team1_player2_id, name: match.team1_player2?.name || "Speler 2" },
    { id: match.team2_player1_id, name: match.team2_player1?.name || "Speler 3" },
    { id: match.team2_player2_id, name: match.team2_player2?.name || "Speler 4" },
  ];

  const [specialTypes, setSpecialTypes] = useState<
    { id: string; name: string; is_active: boolean }[]
  >([]);
  const [specials, setSpecials] = useState<Record<string, Record<string, number>>>({});

  const isLocked = tournament.status !== "active" || match.status === "completed";

  useEffect(() => {
    const loadExistingSpecials = async () => {
      // Fetch existing specials from database
      const { data: existingSpecials } = await supabase
        .from("match_specials")
        .select("player_id, special_type_id, count")
        .eq("match_id", match.id);

      // Initialize specials object
      const initial: Record<string, Record<string, number>> = {};
      players.forEach((p) => {
        initial[p.id] = {};
      });

      // Fill in existing specials from database
      if (existingSpecials) {
        existingSpecials.forEach((special) => {
          if (initial[special.player_id]) {
            initial[special.player_id][special.special_type_id] = special.count;
          }
        });
      }

      setSpecials(initial);
    };

    loadExistingSpecials();
  }, [match.id]);

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
    fetchSpecialTypes();
  }, []);

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

  const handleSpecialChange = (playerId: string, typeId: string, value: number) => {
    setSpecials((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [typeId]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (team1Score === "" || team2Score === "") {
      toast({ title: "Vul een score in", variant: "destructive" });
      return;
    }

    // Check if there are existing scores or specials
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("team1_score, team2_score")
      .eq("id", match.id)
      .single();

    const { data: existingSpecials } = await supabase
      .from("match_specials")
      .select("player_id, special_type_id, count, player:players(name)")
      .eq("match_id", match.id);

    // Build warning message
    const warnings: string[] = [];

    if (existingMatch?.team1_score !== null && existingMatch?.team2_score !== null) {
      warnings.push(
        `Je overschrijft de bestaande score ${existingMatch.team1_score} - ${existingMatch.team2_score} met ${team1Score} - ${team2Score}`
      );
    }

    if (existingSpecials && existingSpecials.length > 0) {
      const playerNames = [...new Set(existingSpecials.map(s => s.player?.name).filter(Boolean))];
      warnings.push(
        `Je overschrijft specials van: ${playerNames.join(", ")}`
      );
    }

    // Check if new specials are being added
    const newSpecialPlayers = Object.entries(specials)
      .filter(([_, types]) => Object.values(types).some(count => count > 0))
      .map(([playerId]) => players.find(p => p.id === playerId)?.name)
      .filter(Boolean);

    if (newSpecialPlayers.length > 0) {
      warnings.push(
        `Je voegt specials toe voor: ${newSpecialPlayers.join(", ")}`
      );
    }

    // Show confirmation if there are warnings
    if (warnings.length > 0) {
      setConfirmMessage(warnings.join("\n\n"));
      setShowConfirmDialog(true);
      return;
    }

    // If no warnings, proceed directly
    await performSave();
  };

  const performSave = async () => {
    setLoading(true);
    setShowConfirmDialog(false);

    const { error: matchError } = await supabase
      .from("matches")
      .update({
        team1_score: Number(team1Score),
        team2_score: Number(team2Score),
        status: "completed",
      })
      .eq("id", match.id);

    // Delete existing stats first, then insert new ones
    const { error: deleteError } = await supabase
      .from("player_match_stats")
      .delete()
      .eq("match_id", match.id);

    if (deleteError) throw deleteError;

    const playerRows = players.map((p) => {
      const isTeam1 = match.team1_player1_id === p.id || match.team1_player2_id === p.id;
      return {
        match_id: match.id,
        player_id: p.id,
        team_number: isTeam1 ? 1 : 2,
        games_won: isTeam1 ? Number(team1Score) : Number(team2Score),
      };
    });

    const { error: statsError } = await supabase
      .from("player_match_stats")
      .insert(playerRows);

    if (statsError) throw statsError;

    const specialRows = Object.entries(specials).flatMap(([playerId, types]) =>
      Object.entries(types)
        .filter(([_, count]) => count > 0)
        .map(([specialTypeId, count]) => ({
          match_id: match.id,
          player_id: playerId,
          special_type_id: specialTypeId,
          count,
        }))
    );

    // First, delete all existing specials for this match to avoid duplicates
    await supabase
      .from("match_specials")
      .delete()
      .eq("match_id", match.id);

    // Then insert the new ones (only if there are any)
    const { error: specialError } = specialRows.length
      ? await supabase
          .from("match_specials")
          .insert(specialRows)
      : { error: null };

    setLoading(false);

    if (matchError || statsError || specialError) {
      toast({
        title: "Fout bij opslaan",
        description: matchError?.message || statsError?.message || specialError?.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Score opgeslagen",
        description: `Score: ${team1Score} – ${team2Score}`,
      });
    }
  };

  if (blocked) {
    return <p className="text-sm text-yellow-600 font-medium mt-2">{blockMessage}</p>;
  }

  return (
    <>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Let op: Data wordt overschreven</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line text-base">
              {confirmMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={performSave}>
              Doorgaan en opslaan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              {players[0].name} & {players[1].name}
            </label>
            <Input
              type="number"
              value={team1Score}
              max={8}
              min={0}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 0 && val <= 8) {
                  setTeam1Score(val);
                }
              }}
              disabled={isLocked || loading}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              {players[2].name} & {players[3].name}
            </label>
            <Input
              type="number"
              value={team2Score}
              disabled
              className="w-full opacity-70"
            />
          </div>
        </div>

        <Accordion type="multiple" className="w-full">
          {players.map((p) => (
            <AccordionItem key={p.id} value={p.id}>
              <AccordionTrigger className="text-base font-semibold">{p.name}</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {specialTypes.map((type) => (
                    <div key={type.id}>
                      <label className="block text-sm text-muted-foreground mb-1">
                        {type.name}
                      </label>
                      <Input
                        type="number"
                        value={specials[p.id]?.[type.id] || 0}
                        min={0}
                        onChange={(e) =>
                          handleSpecialChange(p.id, type.id, Number(e.target.value))
                        }
                        className="w-full"
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
          Opslaan
        </Button>
      </div>
    </>
  );
}
