import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy } from "lucide-react";

interface PlayerStats {
  player_id: string;
  player_name: string;
  games_won: number;
  games_lost: number;
  total_games: number;
  win_percentage: number;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
}

export default function Standings() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedView, setSelectedView] = useState<string>("cumulative");
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  const [standings, setStandings] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
      fetchAvailableRounds();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (tournamentId) {
      if (selectedView === "cumulative") {
        fetchCumulativeStandings();
      } else {
        fetchRoundStandings(selectedRound);
      }
    }
  }, [tournamentId, selectedView, selectedRound]);

  const fetchTournament = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, status")
      .eq("id", tournamentId)
      .single();

    if (!error && data) {
      setTournament(data);
    }
  };

  const fetchAvailableRounds = async () => {
    const { data } = await supabase
      .from("player_tournament_stats")
      .select("round_number")
      .eq("tournament_id", tournamentId);

    if (data) {
      const rounds = [...new Set(data.map(d => d.round_number))].sort();
      setAvailableRounds(rounds);
      if (rounds.length > 0) {
        setSelectedRound(rounds[0]);
      }
    }
  };

  const fetchRoundStandings = async (round: number) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("player_tournament_stats")
      .select(`
        player_id,
        games_won,
        games_lost,
        players:player_id (name)
      `)
      .eq("tournament_id", tournamentId)
      .eq("round_number", round);

    if (!error && data) {
      const stats: PlayerStats[] = data.map(d => ({
        player_id: d.player_id,
        player_name: (d.players as any)?.name || "Onbekend",
        games_won: d.games_won,
        games_lost: d.games_lost,
        total_games: d.games_won + d.games_lost,
        win_percentage: d.games_won + d.games_lost > 0 
          ? (d.games_won / (d.games_won + d.games_lost)) * 100 
          : 0,
      })).sort((a, b) => {
        // Sort by games won DESC, then by win percentage DESC
        if (b.games_won !== a.games_won) return b.games_won - a.games_won;
        return b.win_percentage - a.win_percentage;
      });

      setStandings(stats);
    }

    setLoading(false);
  };

  const fetchCumulativeStandings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("player_tournament_stats")
      .select(`
        player_id,
        games_won,
        games_lost,
        players:player_id (name)
      `)
      .eq("tournament_id", tournamentId);

    if (!error && data) {
      // Aggregate all rounds per player
      const playerMap: { [key: string]: PlayerStats } = {};

      data.forEach(d => {
        if (!playerMap[d.player_id]) {
          playerMap[d.player_id] = {
            player_id: d.player_id,
            player_name: (d.players as any)?.name || "Onbekend",
            games_won: 0,
            games_lost: 0,
            total_games: 0,
            win_percentage: 0,
          };
        }

        playerMap[d.player_id].games_won += d.games_won;
        playerMap[d.player_id].games_lost += d.games_lost;
      });

      const stats: PlayerStats[] = Object.values(playerMap).map(p => ({
        ...p,
        total_games: p.games_won + p.games_lost,
        win_percentage: p.games_won + p.games_lost > 0 
          ? (p.games_won / (p.games_won + p.games_lost)) * 100 
          : 0,
      })).sort((a, b) => {
        if (b.games_won !== a.games_won) return b.games_won - a.games_won;
        return b.win_percentage - a.win_percentage;
      });

      setStandings(stats);
    }

    setLoading(false);
  };

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Ranking
          </h1>
          <p className="text-muted-foreground">{tournament.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Stand</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedView} onValueChange={setSelectedView}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Selecteer weergave" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cumulative">Totaal</SelectItem>
                  <SelectItem value="round">Per Ronde</SelectItem>
                </SelectContent>
              </Select>

              {selectedView === "round" && availableRounds.length > 0 && (
                <Select 
                  value={selectedRound.toString()} 
                  onValueChange={(val) => setSelectedRound(parseInt(val))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Ronde" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRounds.map(round => (
                      <SelectItem key={round} value={round.toString()}>
                        Ronde {round}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laden...</p>
            </div>
          ) : standings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nog geen resultaten beschikbaar voor deze weergave.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Speler</TableHead>
                  <TableHead className="text-right">Games Won</TableHead>
                  <TableHead className="text-right">Games Lost</TableHead>
                  <TableHead className="text-right">Totaal</TableHead>
                  <TableHead className="text-right">Win %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((player, index) => (
                  <TableRow key={player.player_id}>
                    <TableCell className="font-medium">
                      {index + 1 === 1 && (
                        <Badge className="bg-yellow-500 text-white">🥇</Badge>
                      )}
                      {index + 1 === 2 && (
                        <Badge className="bg-gray-400 text-white">🥈</Badge>
                      )}
                      {index + 1 === 3 && (
                        <Badge className="bg-orange-600 text-white">🥉</Badge>
                      )}
                      {index + 1 > 3 && index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{player.player_name}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {player.games_won}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {player.games_lost}
                    </TableCell>
                    <TableCell className="text-right">{player.total_games}</TableCell>
                    <TableCell className="text-right">
                      {player.win_percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
