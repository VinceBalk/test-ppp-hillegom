
import React, { useEffect, useState } from "react";
import { useTournamentPlayers } from "@/hooks/useTournamentPlayers";
import { useMatches } from "@/hooks/useMatches";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

type Props = {
  tournamentId: string;
};

type Match2v2 = {
  courtId: string;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
};

const ManualMatchBuilder: React.FC<Props> = ({ tournamentId }) => {
  const { tournamentPlayers, isLoading: loadingPlayers } = useTournamentPlayers(tournamentId);
  const { matches, isLoading: loadingMatches } = useMatches(tournamentId);
  const [round, setRound] = useState(1);
  const [selectedMatches, setSelectedMatches] = useState<Match2v2[]>([]);
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

      for (const match of selectedMatches) {
        await supabase.from("matches").insert({
          tournament_id: tournamentId,
          round_number: round,
          court_id: match.courtId,
          team1_player1_id: match.team1Player1,
          team1_player2_id: match.team1Player2,
          team2_player1_id: match.team2Player1,
          team2_player2_id: match.team2Player2,
          status: 'scheduled'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", tournamentId] });
      alert("2v2 Wedstrijden opgeslagen.");
    },
  });

  const handleAddMatch = () => {
    setSelectedMatches([...selectedMatches, { 
      courtId: "", 
      team1Player1: "", 
      team1Player2: "", 
      team2Player1: "", 
      team2Player2: "" 
    }]);
  };

  const handleRemoveMatch = (index: number) => {
    const updated = selectedMatches.filter((_, i) => i !== index);
    setSelectedMatches(updated);
  };

  const handleChange = (index: number, key: keyof Match2v2, value: string) => {
    const updated = [...selectedMatches];
    updated[index][key] = value;
    setSelectedMatches(updated);
  };

  if (loadingPlayers || loadingMatches) return <p>Bezig met laden...</p>;

  // Convert tournament players to the expected format
  const players = tournamentPlayers.map(tp => ({
    id: tp.player_id,
    name: tp.player.name
  }));

  const isValidMatch = (match: Match2v2) => {
    return match.courtId && match.team1Player1 && match.team1Player2 && 
           match.team2Player1 && match.team2Player2;
  };

  const allMatchesValid = selectedMatches.length > 0 && selectedMatches.every(isValidMatch);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Handmatig 2v2 Schema Bouwen – Ronde {round}
          <div className="flex items-center gap-2">
            <Label className="text-sm">Ronde:</Label>
            <Select value={round.toString()} onValueChange={(value) => setRound(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedMatches.map((match, index) => (
          <Card key={index} className="p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Wedstrijd {index + 1}</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleRemoveMatch(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid gap-4">
              {/* Court Selection */}
              <div>
                <Label className="text-sm">Baan</Label>
                <Select
                  value={match.courtId}
                  onValueChange={(value) => handleChange(index, "courtId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kies baan" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team 1 */}
              <div>
                <Label className="text-sm text-blue-600 font-medium">Team 1</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Select
                    value={match.team1Player1}
                    onValueChange={(value) => handleChange(index, "team1Player1", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Speler 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={match.team1Player2}
                    onValueChange={(value) => handleChange(index, "team1Player2", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Speler 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* VS */}
              <div className="text-center font-bold text-muted-foreground">VS</div>

              {/* Team 2 */}
              <div>
                <Label className="text-sm text-red-600 font-medium">Team 2</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Select
                    value={match.team2Player1}
                    onValueChange={(value) => handleChange(index, "team2Player1", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Speler 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={match.team2Player2}
                    onValueChange={(value) => handleChange(index, "team2Player2", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Speler 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>
        ))}

        <div className="flex gap-4">
          <Button onClick={handleAddMatch} variant="outline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Voeg 2v2 Wedstrijd Toe
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!allMatchesValid || mutation.isPending}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {mutation.isPending ? "Opslaan..." : "✅ Schema Opslaan"}
          </Button>
        </div>

        {selectedMatches.length > 0 && !allMatchesValid && (
          <p className="text-sm text-yellow-600">
            Zorg ervoor dat alle wedstrijden een baan en 4 spelers hebben voordat je opslaat.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualMatchBuilder;
