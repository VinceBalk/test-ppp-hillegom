import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PlayerStats {
  player_id: string;
  player_name: string;
  games_won: number;
  games_lost: number;
  specials_count: number;
  position: number;
  row_side: string;
}

interface Tournament {
  id: string;
  name: string;
}

interface ChefSpecial {
  player_id: string;
  player_name: string;
  total_specials: number;
  rank_position: number;
  title: string;
}

export default function Standings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tournamentParam = searchParams.get("tournament");
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string>("all");
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  
  const [leftRowStandings, setLeftRowStandings] = useState<PlayerStats[]>([]);
  const [rightRowStandings, setRightRowStandings] = useState<PlayerStats[]>([]);
  const [chefSpecials, setChefSpecials] = useState<ChefSpecial[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (tournamentParam && tournaments.length > 0) {
      setSelectedTournament(tournamentParam);
    }
  }, [tournamentParam, tournaments]);

  useEffect(() => {
    if (selectedTournament) {
      fetchAvailableRounds();
      fetchStandings();
      fetchChefSpecials();
    }
  }, [selectedTournament, selectedRound]);

  const fetchTournaments = async () => {
    const { data } = await supabase
      .from("tournaments")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setTournaments(data);
      setSelectedTournament(data[0].id);
    }
  };

  const fetchAvailableRounds = async () => {
    const { data } = await supabase
      .from("player_tournament_stats")
      .select("round_number")
      .eq("tournament_id", selectedTournament);

    if (data) {
      const rounds = [...new Set(data.map(d => d.round_number))].sort((a, b) => a - b);
      setAvailableRounds(rounds);
    }
  };

  const fetchStandings = async () => {
    setLoading(true);

    let query = supabase
      .from("player_tournament_stats")
      .select(`
        player_id,
        games_won,
        games_lost,
        tiebreaker_specials_count,
        players:player_id (name, row_side)
      `)
      .eq("tournament_id", selectedTournament);

    if (selectedRound !== "all") {
      query = query.eq("round_number", parseInt(selectedRound));
    }

    const { data } = await query;

    if (data) {
      const playerMap: { [key: string]: { name: string; won: number; lost: number; specials: number; row_side: string } } = {};

      data.forEach(d => {
        if (!playerMap[d.player_id]) {
          playerMap[d.player_id] = {
            name: (d.players as any)?.name || "Onbekend",
            row_side: (d.players as any)?.row_side || "left",
            won: 0,
            lost: 0,
            specials: 0,
          };
        }
        playerMap[d.player_id].won += d.games_won;
        playerMap[d.player_id].lost += d.games_lost;
        playerMap[d.player_id].specials += d.tiebreaker_specials_count || 0;
      });

      const allStats: PlayerStats[] = Object.entries(playerMap)
        .map(([id, p]) => ({
          player_id: id,
          player_name: p.name,
          games_won: p.won,
          games_lost: p.lost,
          specials_count: p.specials,
          row_side: p.row_side,
          position: 0,
        }));

      const leftStats = allStats
        .filter(s => s.row_side === "left")
        .sort((a, b) => {
          if (b.games_won !== a.games_won) return b.games_won - a.games_won;
          return b.specials_count - a.specials_count;
        })
        .map((s, idx) => ({ ...s, position: idx + 1 }));

      const rightStats = allStats
        .filter(s => s.row_side === "right")
        .sort((a, b) => {
          if (b.games_won !== a.games_won) return b.games_won - a.games_won;
          return b.specials_count - a.specials_count;
        })
        .map((s, idx) => ({ ...s, position: idx + 1 }));

      setLeftRowStandings(leftStats);
      setRightRowStandings(rightStats);
    }

    setLoading(false);
  };

  const fetchChefSpecials = async () => {
    const roundNumber = selectedRound === "all" ? null : parseInt(selectedRound);
    
    const { data, error } = await supabase.rpc('get_tournament_specials_ranking', {
      p_tournament_id: selectedTournament,
      p_round_number: roundNumber
    });

    if (!error && data) {
      setChefSpecials(data);
    }
  };

  const renderStandingsTable = (standings: PlayerStats[], title: string) => {
    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }

    if (standings.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Geen resultaten beschikbaar</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-center">{title}</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Speler</TableHead>
              <TableHead className="text-center w-20">Won</TableHead>
              <TableHead className="text-center w-20">Verl</TableHead>
              <TableHead className="text-center w-20">Spec</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((player) => (
              <TableRow key={player.player_id}>
                <TableCell className="font-bold">
                  {player.position === 1 && <span className="text-2xl">🥇</span>}
                  {player.position === 2 && <span className="text-2xl">🥈</span>}
                  {player.position === 3 && <span className="text-2xl">🥉</span>}
                  {player.position > 3 && <span className="text-base">{player.position}</span>}
                </TableCell>
                <TableCell 
                  className="font-bold text-lg text-primary hover:underline cursor-pointer"
                  onClick={() => navigate(`/players/${player.player_id}`)}
                >
                  {player.player_name}
                </TableCell>
                <TableCell className="text-center font-semibold text-green-600">
                  {player.games_won}
                </TableCell>
                <TableCell className="text-center text-red-600">
                  {player.games_lost}
                </TableCell>
                <TableCell className="text-center font-semibold text-orange-600">
                  {player.specials_count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Standen
        </h1>
        <p className="text-muted-foreground">Rankings en statistieken</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Toernooi</label>
              <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer toernooi" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ronde</label>
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer ronde" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Rondes</SelectItem>
                  {availableRounds.map(round => (
                    <SelectItem key={round} value={round.toString()}>
                      Ronde {round}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {chefSpecials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chef Special Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chefSpecials.slice(0, 2).map((chef) => (
                <div key={chef.player_id} className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <div className="text-2xl">
                    {chef.rank_position === 1 ? "👨‍🍳" : "🧑‍🍳"}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">{chef.player_name}</div>
                    <div className="text-sm text-muted-foreground">{chef.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">{chef.total_specials}</div>
                    <div className="text-xs text-muted-foreground">specials</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            {renderStandingsTable(leftRowStandings, "Linker Rij")}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {renderStandingsTable(rightRowStandings, "Rechter Rij")}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
