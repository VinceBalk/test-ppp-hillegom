
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
import { Badge } from "@/components/ui/badge";

type Props = {
  tournamentId: string;
  initialRound?: number;
};

type Match2v2 = {
  courtId: string;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
};

const ManualMatchBuilder: React.FC<Props> = ({ tournamentId, initialRound = 1 }) => {
  const { tournamentPlayers, isLoading: loadingPlayers } = useTournamentPlayers(tournamentId);
  const { matches, isLoading: loadingMatches } = useMatches(tournamentId);
  const [round, setRound] = useState(initialRound);
  const [selectedGroup, setSelectedGroup] = useState<'left' | 'right'>('left');
  const [selectedMatches, setSelectedMatches] = useState<Match2v2[]>([]);
  const [courts, setCourts] = useState<{ id: string; name: string }[]>([]);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Update round when initialRound changes
  useEffect(() => {
    setRound(initialRound);
  }, [initialRound]);

  useEffect(() => {
    const fetchCourts = async () => {
      const { data } = await supabase.from("courts").select("id, name").eq("is_active", true);
      if (data) setCourts(data);
    };
    fetchCourts();
  }, []);

  // Load existing matches for the selected round and group when component mounts
  useEffect(() => {
    const loadExistingMatches = () => {
      const roundMatches = matches.filter(match => 
        match.round_number === round && 
        match.court?.name?.toLowerCase().includes(selectedGroup)
      );

      if (roundMatches.length > 0) {
        const existingMatches = roundMatches.map(match => ({
          courtId: match.court_id || '',
          team1Player1: match.team1_player1_id || '',
          team1Player2: match.team1_player2_id || '',
          team2Player1: match.team2_player1_id || '',
          team2Player2: match.team2_player2_id || '',
        }));
        setSelectedMatches(existingMatches);
      } else {
        // Reset matches when switching groups/rounds if no existing matches
        setSelectedMatches([]);
      }
    };

    if (!loadingMatches && matches.length > 0) {
      loadExistingMatches();
    }
  }, [round, selectedGroup, matches, loadingMatches]);

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

      // Only delete existing matches for this specific group and round
      const groupCourts = courts.filter(court => 
        court.name.toLowerCase().includes(selectedGroup)
      ).map(court => court.id);

      if (groupCourts.length > 0) {
        await supabase.from("matches")
          .delete()
          .eq("tournament_id", tournamentId)
          .eq("round_number", round)
          .in("court_id", groupCourts);
      }

      // Insert new matches
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
      alert(`${selectedGroup === 'left' ? 'Linker' : 'Rechter'} rijtje wedstrijden voor ronde ${round} opgeslagen.`);
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

  // Filter players by selected group
  const filteredPlayers = tournamentPlayers
    .filter(tp => tp.group === selectedGroup)
    .map(tp => ({
      id: tp.player_id,
      name: tp.player.name
    }));

  // Filter courts by selected group
  const filteredCourts = courts.filter(court => 
    court.name.toLowerCase().includes(selectedGroup)
  );

  // Check for existing matches in this round and group
  const existingRoundMatches = matches.filter(match => 
    match.round_number === round && 
    match.court?.name?.toLowerCase().includes(selectedGroup)
  );

  const isValidMatch = (match: Match2v2) => {
    return match.courtId && match.team1Player1 && match.team1Player2 && 
           match.team2Player1 && match.team2Player2;
  };

  const allMatchesValid = selectedMatches.length > 0 && selectedMatches.every(isValidMatch);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Handmatig 2v2 Schema Bouwen
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Rijtje:</Label>
              <Select value={selectedGroup} onValueChange={(value: 'left' | 'right') => setSelectedGroup(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Links</SelectItem>
                  <SelectItem value="right">Rechts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Ronde:</Label>
              <Select value={round.toString()} onValueChange={(value) => setRound(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardTitle>
        
        {/* Info section */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {filteredPlayers.length} spelers beschikbaar
            </Badge>
            <Badge variant="outline">
              {filteredCourts.length} banen beschikbaar
            </Badge>
          </div>
          {existingRoundMatches.length > 0 && (
            <Badge variant="secondary">
              {existingRoundMatches.length} bestaande wedstrijden
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedMatches.map((match, index) => (
          <Card key={index} className="p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">
                Wedstrijd {index + 1} - {selectedGroup === 'left' ? 'Links' : 'Rechts'} Rijtje
              </h4>
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
                <Label className="text-sm">Baan ({selectedGroup === 'left' ? 'Links' : 'Rechts'})</Label>
                <Select
                  value={match.courtId}
                  onValueChange={(value) => handleChange(index, "courtId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kies baan" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCourts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team 1 */}
              <div>
                <Label className="text-sm text-blue-600 font-medium">
                  Team 1 ({selectedGroup === 'left' ? 'Links' : 'Rechts'} Groep)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Select
                    value={match.team1Player1}
                    onValueChange={(value) => handleChange(index, "team1Player1", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Speler 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPlayers.map((p) => (
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
                      {filteredPlayers.map((p) => (
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
                <Label className="text-sm text-red-600 font-medium">
                  Team 2 ({selectedGroup === 'left' ? 'Links' : 'Rechts'} Groep)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Select
                    value={match.team2Player1}
                    onValueChange={(value) => handleChange(index, "team2Player1", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Speler 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPlayers.map((p) => (
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
                      {filteredPlayers.map((p) => (
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
            Voeg Wedstrijd Toe ({selectedGroup === 'left' ? 'Links' : 'Rechts'})
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!allMatchesValid || mutation.isPending}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {mutation.isPending ? "Opslaan..." : `✅ ${selectedGroup === 'left' ? 'Links' : 'Rechts'} Rijtje Opslaan`}
          </Button>
        </div>

        {selectedMatches.length > 0 && !allMatchesValid && (
          <p className="text-sm text-yellow-600">
            Zorg ervoor dat alle wedstrijden een baan en 4 spelers hebben voordat je opslaat.
          </p>
        )}

        {existingRoundMatches.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Let op:</strong> Er zijn al {existingRoundMatches.length} wedstrijden in deze ronde voor het {selectedGroup === 'left' ? 'linker' : 'rechter'} rijtje. 
              Het opslaan zal deze vervangen door de nieuwe wedstrijden hierboven.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualMatchBuilder;
