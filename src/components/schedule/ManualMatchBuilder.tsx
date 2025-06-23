
import React, { useEffect, useState } from "react";
import { useTournamentPlayers } from "@/hooks/useTournamentPlayers";
import { useMatches } from "@/hooks/useMatches";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

type Props = {
  tournamentId: string;
};

type Player = {
  id: string;
  name: string;
};

const ManualMatchBuilder: React.FC<Props> = ({ tournamentId }) => {
  const { tournamentPlayers, isLoading: loadingPlayers } = useTournamentPlayers(tournamentId);
  const { matches, isLoading: loadingMatches } = useMatches(tournamentId);
  const [round, setRound] = useState(1);
  const [selectedPairs, setSelectedPairs] = useState<{ courtId: string; team1: string; team2: string }[]>([]);
  const [courts, setCourts] = useState<{ id: string; name: string }[]>([]);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchCourts = async () => {
      const { data } = await supabase.from("courts").select("id, name").eq("is_active", true);
      if (data) setCourts(data);
    };
    fetchCourts();
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: prev } = await supabase
        .from("tournament_rounds")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("round_number", round)
        .maybeSingle();

      if (!prev) {
        await supabase.from("tournament_rounds").insert({
          tournament_id: tournamentId,
          round_number: round,
          status: "pending",
          is_manually_adjusted: true,
        });
      }

      await supabase.from("matches").delete().eq("tournament_id", tournamentId).eq("round_number", round);

      for (const match of selectedPairs) {
        await supabase.from("matches").insert({
          tournament_id: tournamentId,
          round_number: round,
          court_id: match.courtId,
          team1_player1_id: match.team1,
          team2_player1_id: match.team2,
          status: 'scheduled'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", tournamentId] });
      alert("Wedstrijden opgeslagen.");
    },
  });

  const handleAddMatch = () => {
    setSelectedPairs([...selectedPairs, { courtId: "", team1: "", team2: "" }]);
  };

  const handleChange = (index: number, key: "courtId" | "team1" | "team2", value: string) => {
    const updated = [...selectedPairs];
    updated[index][key] = value;
    setSelectedPairs(updated);
  };

  if (loadingPlayers || loadingMatches) return <p>Bezig met laden...</p>;

  // Convert tournament players to the expected format
  const players = tournamentPlayers.map(tp => ({
    id: tp.player_id,
    name: tp.player.name
  }));

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-semibold">Handmatig schema bouwen – Ronde {round}</h2>

      {selectedPairs.map((match, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center border p-2 rounded-lg bg-white shadow-sm">
          <select
            className="border rounded p-2"
            value={match.courtId}
            onChange={(e) => handleChange(index, "courtId", e.target.value)}
          >
            <option value="">Kies baan</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="border rounded p-2"
            value={match.team1}
            onChange={(e) => handleChange(index, "team1", e.target.value)}
          >
            <option value="">Speler 1</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-center">vs</span>
          <select
            className="border rounded p-2"
            value={match.team2}
            onChange={(e) => handleChange(index, "team2", e.target.value)}
          >
            <option value="">Speler 2</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="flex gap-4">
        <button onClick={handleAddMatch} className="bg-gray-200 rounded px-4 py-2">
          + Voeg wedstrijd toe
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={selectedPairs.length === 0}
          className="bg-green-600 text-white rounded px-4 py-2"
        >
          ✅ Opslaan
        </button>
      </div>
    </div>
  );
};

export default ManualMatchBuilder;
