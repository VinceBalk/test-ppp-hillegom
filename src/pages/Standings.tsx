import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PlayerStats {
  player_id: string;
  player_name: string;
  games_won: number;
  games_lost: number;
  specials_count: number;
  position: number;
  row_side: string;
  previous_position?: number;
  trend?: 'up' | 'down' | 'same';
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
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string>("all");
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  
  const [leftRowStandings, setLeftRowStandings] = useState<PlayerStats[]>([]);
  const [rightRowStandings, setRightRowStandings] = useState<PlayerStats[]>([]);
  const [chefSpecials, setChefSpecials] = useState<ChefSpecial[]>([]);
  const [previousRoundStandings, setPreviousRoundStandings] = useState<{left: PlayerStats[], right: PlayerStats[]}>({left: [], right: []});
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (tournamentId) {
      setSelectedTournament(tournamentId);
    } else if (tournaments.length > 0) {
      setSelectedTournament(tournaments[0].id);
    }
  }, [tournamentId, tournaments]);

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
      .in("status", ["in_progress", "completed"])
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setTournaments(data);
      if (!tournamentId) {
        setSelectedTournament(data[0].id);
      }
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

    // First fetch tournament players to get their group/side
    const { data: tournamentPlayers } = await supabase
      .from("tournament_players")
      .select("player_id, group")
      .eq("tournament_id", selectedTournament);

    const playerGroups: { [key: string]: string } = {};
    tournamentPlayers?.forEach(tp => {
      playerGroups[tp.player_id] = tp.group;
    });

    // Fetch current round/all rounds standings
    let query = supabase
      .from("player_tournament_stats")
      .select(`
        player_id,
        games_won,
        games_lost,
        tiebreaker_specials_count,
        round_number,
        players:player_id (name)
      `)
      .eq("tournament_id", selectedTournament);

    if (selectedRound !== "all") {
      query = query.lte("round_number", parseInt(selectedRound));
    }

    const { data } = await query;

    // Also fetch previous round data if we're viewing a specific round > 1
    let previousData = null;
    if (selectedRound !== "all" && parseInt(selectedRound) > 1) {
      const { data: prevData } = await supabase
        .from("player_tournament_stats")
        .select(`
          player_id,
          games_won,
          games_lost,
          tiebreaker_specials_count,
          players:player_id (name)
        `)
        .eq("tournament_id", selectedTournament)
        .lte("round_number", parseInt(selectedRound) - 1);
      
      previousData = prevData;
    }

    if (data) {
      const playerMap: { [key: string]: { name: string; won: number; lost: number; specials: number; row_side: string } } = {};

      data.forEach(d => {
        if (!playerMap[d.player_id]) {
          playerMap[d.player_id] = {
            name: (d.players as any)?.name || "Onbekend",
            row_side: playerGroups[d.player_id] || "left",
            won: 0,
            lost: 0,
            specials: 0,
          };
        }
        playerMap[d.player_id].won += d.games_won;
        playerMap[d.player_id].lost += d.games_lost;
        playerMap[d.player_id].specials += d.tiebreaker_specials_count || 0;
      });

      // Process previous round data
      let previousPlayerMap: { [key: string]: { won: number; lost: number; specials: number; row_side: string } } = {};
      if (previousData) {
        previousData.forEach(d => {
          if (!previousPlayerMap[d.player_id]) {
            previousPlayerMap[d.player_id] = {
              row_side: playerGroups[d.player_id] || "left",
              won: 0,
              lost: 0,
              specials: 0,
            };
          }
          previousPlayerMap[d.player_id].won += d.games_won;
          previousPlayerMap[d.player_id].lost += d.games_lost;
          previousPlayerMap[d.player_id].specials += d.tiebreaker_specials_count || 0;
        });
      }

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

      // Calculate previous positions if we have previous data
      const calculatePreviousPositions = (stats: PlayerStats[], side: string) => {
        if (!previousData) return stats;
        
        const previousStats = Object.entries(previousPlayerMap)
          .filter(([_, p]) => p.row_side === side)
          .map(([id, p]) => ({
            player_id: id,
            won: p.won,
            lost: p.lost,
            specials: p.specials,
          }))
          .sort((a, b) => {
            if (b.won !== a.won) return b.won - a.won;
            return b.specials - a.specials;
          });

        return stats.map(s => {
          const prevIndex = previousStats.findIndex(p => p.player_id === s.player_id);
          const previousPosition = prevIndex >= 0 ? prevIndex + 1 : undefined;
          
          let trend: 'up' | 'down' | 'same' | undefined = undefined;
          if (previousPosition !== undefined) {
            if (s.position < previousPosition) trend = 'up';
            else if (s.position > previousPosition) trend = 'down';
            else trend = 'same';
          }
          
          return {
            ...s,
            previous_position: previousPosition,
            trend,
          };
        });
      };

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

      setLeftRowStandings(calculatePreviousPositions(leftStats, "left"));
      setRightRowStandings(calculatePreviousPositions(rightStats, "right"));
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

    const showTrend = selectedRound !== "all" && parseInt(selectedRound) > 1;
    
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-center">{title}</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              {showTrend && <TableHead className="w-12"></TableHead>}
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
                {showTrend && (
                  <TableCell>
                    {player.trend === 'up' && (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    )}
                    {player.trend === 'down' && (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    {player.trend === 'same' && (
                      <Minus className="h-5 w-5 text-muted-foreground" />
                    )}
                  </TableCell>
                )}
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
            {renderStandingsTable(leftRowStandings, "Linker rijtje")}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {renderStandingsTable(rightRowStandings, "Rechter rijtje")}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
