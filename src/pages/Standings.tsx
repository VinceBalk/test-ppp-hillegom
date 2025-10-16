import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, ChefHat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTournamentStandings } from "@/hooks/useTournamentStandings";

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

interface R1R2Stats {
  player_id: string;
  total_games: number;
  total_specials: number;
}

export default function Standings() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [chefSpecials, setChefSpecials] = useState<ChefSpecial[]>([]);
  const [playerGroups, setPlayerGroups] = useState<{ [key: string]: string }>({});
  const [r1r2Stats, setR1R2Stats] = useState<R1R2Stats[]>([]);
  
  const { data: allStandings = [], isLoading } = useTournamentStandings(selectedTournament || undefined);

  // Helper function to sort standings: TOTAAL games → TOTAAL specials → R2 → R1
  const sortStandingsByTotal = (standings: typeof allStandings) => {
    return [...standings].sort((a, b) => {
      // Calculate total games (R1 + R2 + R3)
      const totalGamesA = a.round1_games_won + a.round2_games_won + a.round3_games_won;
      const totalGamesB = b.round1_games_won + b.round2_games_won + b.round3_games_won;
      
      // 1. Primary: Totaal games gewonnen
      if (totalGamesB !== totalGamesA) {
        return totalGamesB - totalGamesA;
      }
      
      // Calculate total specials (R1 + R2 + R3)
      const totalSpecialsA = a.round1_specials + a.round2_specials + a.round3_specials;
      const totalSpecialsB = b.round1_specials + b.round2_specials + b.round3_specials;
      
      // 2. Tie-breaker 1: Totaal specials
      if (totalSpecialsB !== totalSpecialsA) {
        return totalSpecialsB - totalSpecialsA;
      }
      
      // 3. Tie-breaker 2: Ronde 2 games won
      if (b.round2_games_won !== a.round2_games_won) {
        return b.round2_games_won - a.round2_games_won;
      }
      
      // 4. Tie-breaker 3: Ronde 1 games won
      return b.round1_games_won - a.round1_games_won;
    });
  };

  // Split R1+R2 stats by group and determine top/bottom 4
  const leftPlayersR1R2 = r1r2Stats.filter(p => playerGroups[p.player_id] === 'left');
  const rightPlayersR1R2 = r1r2Stats.filter(p => playerGroups[p.player_id] === 'right');

  const leftTop4PlayerIds = new Set(leftPlayersR1R2.slice(0, 4).map(p => p.player_id));
  const leftBottom4PlayerIds = new Set(leftPlayersR1R2.slice(4, 8).map(p => p.player_id));
  const rightTop4PlayerIds = new Set(rightPlayersR1R2.slice(0, 4).map(p => p.player_id));
  const rightBottom4PlayerIds = new Set(rightPlayersR1R2.slice(4, 8).map(p => p.player_id));

  // Create 4 groups and apply total-based sorting to each
  const leftTopStandings = sortStandingsByTotal(
    allStandings.filter(s => leftTop4PlayerIds.has(s.player_id))
  ).map((s, idx) => ({ ...s, position: idx + 1 }));

  const leftBottomStandings = sortStandingsByTotal(
    allStandings.filter(s => leftBottom4PlayerIds.has(s.player_id))
  ).map((s, idx) => ({ ...s, position: idx + 1 }));

  const rightTopStandings = sortStandingsByTotal(
    allStandings.filter(s => rightTop4PlayerIds.has(s.player_id))
  ).map((s, idx) => ({ ...s, position: idx + 1 }));

  const rightBottomStandings = sortStandingsByTotal(
    allStandings.filter(s => rightBottom4PlayerIds.has(s.player_id))
  ).map((s, idx) => ({ ...s, position: idx + 1 }));

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
      fetchPlayerGroups();
      fetchChefSpecials();
      fetchR1R2Stats();
    }
  }, [selectedTournament]);

  const fetchPlayerGroups = async () => {
    const { data: tournamentPlayers } = await supabase
      .from("tournament_players")
      .select("player_id, group")
      .eq("tournament_id", selectedTournament);

    const groups: { [key: string]: string } = {};
    tournamentPlayers?.forEach(tp => {
      groups[tp.player_id] = tp.group;
    });
    setPlayerGroups(groups);
  };

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

  const fetchChefSpecials = async () => {
    const { data, error } = await supabase.rpc('get_tournament_specials_ranking', {
      p_tournament_id: selectedTournament,
      p_round_number: null
    });

    if (!error && data) {
      setChefSpecials(data);
    }
  };

  const fetchR1R2Stats = async () => {
    const { data } = await supabase
      .from('player_tournament_stats')
      .select('player_id, games_won, tiebreaker_specials_count')
      .eq('tournament_id', selectedTournament)
      .in('round_number', [1, 2]);

    if (data) {
      // Aggregate per player
      const playerMap = new Map<string, R1R2Stats>();
      data.forEach(stat => {
        const existing = playerMap.get(stat.player_id);
        if (existing) {
          existing.total_games += stat.games_won || 0;
          existing.total_specials += stat.tiebreaker_specials_count || 0;
        } else {
          playerMap.set(stat.player_id, {
            player_id: stat.player_id,
            total_games: stat.games_won || 0,
            total_specials: stat.tiebreaker_specials_count || 0,
          });
        }
      });

      // Sort by R1+R2 performance
      const sorted = Array.from(playerMap.values()).sort((a, b) => {
        if (b.total_games !== a.total_games) return b.total_games - a.total_games;
        return b.total_specials - a.total_specials;
      });

      setR1R2Stats(sorted);
    }
  };

  const renderStandingsTable = (standings: typeof allStandings) => {
    if (isLoading) {
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
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">Geen data beschikbaar</p>
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Speler</TableHead>
            <TableHead className="text-center">R1<br/><span className="text-xs font-normal">G/S</span></TableHead>
            <TableHead className="text-center">R2<br/><span className="text-xs font-normal">G/S</span></TableHead>
            <TableHead className="text-center">R3<br/><span className="text-xs font-normal">G/S</span></TableHead>
            <TableHead className="text-center">TB</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((player) => (
            <TableRow key={player.player_id}>
              <TableCell className="font-bold">
                {player.position === 1 ? '🥇' : player.position}
              </TableCell>
              <TableCell 
                className="font-medium hover:underline cursor-pointer"
                onClick={() => navigate(`/players/${player.player_id}`)}
              >
                {player.player_name}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-medium">{player.round1_games_won}</span>
                  <span className="text-xs text-orange-600">{player.round1_specials}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-medium">{player.round2_games_won}</span>
                  <span className="text-xs text-orange-600">{player.round2_specials}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-bold text-green-600">{player.round3_games_won}</span>
                  <span className="text-xs text-orange-600 font-semibold">{player.round3_specials}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                {player.tie_breaker_used && (
                  <Badge variant="outline" className="text-xs">
                    {player.tie_breaker_used === 'r3_specials' && <Award className="h-3 w-3 mr-1" />}
                    {player.tie_breaker_used === 'r3_specials' && 'R3S'}
                    {player.tie_breaker_used === 'r2_games' && 'R2G'}
                    {player.tie_breaker_used === 'r1_games' && 'R1G'}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Standen
        </h1>
        <p className="text-muted-foreground">Rankings op basis van totaal aantal games gewonnen</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {chefSpecials.length > 0 && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Chef Special Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chefSpecials.slice(0, 2).map((chef) => (
                <div 
                  key={chef.player_id} 
                  className="relative flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/30 shadow-lg"
                >
                  {chef.rank_position === 1 ? (
                    <ChefHat className="h-20 w-20 text-orange-600" strokeWidth={1.5} />
                  ) : (
                    <Award className="h-20 w-20 text-amber-600" strokeWidth={1.5} />
                  )}
                  <div className="text-center">
                    <div className="font-bold text-2xl mb-1">{chef.player_name}</div>
                    <Badge 
                      variant={chef.rank_position === 1 ? "default" : "secondary"}
                      className="text-base px-4 py-1"
                    >
                      {chef.title}
                    </Badge>
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-4xl font-bold text-orange-600">{chef.total_specials}</div>
                    <div className="text-sm text-muted-foreground font-medium">specials</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Linker Rij - Top 4
            </CardTitle>
            <CardDescription>
              Bovenste 4 spelers (linker rij) - totaal games
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStandingsTable(leftTopStandings)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Rechter Rij - Top 4
            </CardTitle>
            <CardDescription>
              Bovenste 4 spelers (rechter rij) - totaal games
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStandingsTable(rightTopStandings)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-500" />
              Linker Rij - Onderste 4
            </CardTitle>
            <CardDescription>
              Onderste 4 spelers (linker rij) - totaal games
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStandingsTable(leftBottomStandings)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-500" />
              Rechter Rij - Onderste 4
            </CardTitle>
            <CardDescription>
              Onderste 4 spelers (rechter rij) - totaal games
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStandingsTable(rightBottomStandings)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
