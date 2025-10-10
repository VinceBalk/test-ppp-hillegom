import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";

interface PlayerStats {
  player_id: string;
  player_name: string;
  games_won: number;
  games_lost: number;
  specials_count: number;
  position: number;
  previous_position?: number;
  row_side?: string;
}

interface Tournament {
  id: string;
  name: string;
}

export default function GlobalStandings() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedRowFilter, setSelectedRowFilter] = useState<string>("all");
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  
  const [totalStandings, setTotalStandings] = useState<PlayerStats[]>([]);
  const [tournamentStandings, setTournamentStandings] = useState<PlayerStats[]>([]);
  const [roundStandings, setRoundStandings] = useState<PlayerStats[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
    fetchTotalStandings();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchAvailableRounds();
      fetchTournamentStandings();
    }
  }, [selectedTournament]);

  useEffect(() => {
    if (selectedTournament && selectedRound) {
      fetchRoundStandings();
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
      const rounds = [...new Set(data.map(d => d.round_number))].sort();
      setAvailableRounds(rounds);
      if (rounds.length > 0) {
        setSelectedRound(rounds[0]);
      }
    }
  };

  const fetchTotalStandings = async () => {
    setLoading(true);

    const { data: statsData } = await supabase
      .from("player_tournament_stats")
      .select(`
        player_id,
        games_won,
        games_lost,
        tiebreaker_specials_count,
        players:player_id (name, row_side)
      `);

    if (statsData) {
      // Aggregate across ALL tournaments and rounds
      const playerMap: { [key: string]: { name: string; won: number; lost: number; specials: number; row_side: string } } = {};

      statsData.forEach(d => {
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

      // Separate and rank each row independently
      const leftRowStats = allStats
        .filter(s => s.row_side === "left")
        .sort((a, b) => {
          if (b.games_won !== a.games_won) return b.games_won - a.games_won;
          return b.specials_count - a.specials_count;
        })
        .map((s, idx) => ({ ...s, position: idx + 1 }));

      const rightRowStats = allStats
        .filter(s => s.row_side === "right")
        .sort((a, b) => {
          if (b.games_won !== a.games_won) return b.games_won - a.games_won;
          return b.specials_count - a.specials_count;
        })
        .map((s, idx) => ({ ...s, position: idx + 1 }));

      // For mobile filter
      if (selectedRowFilter === "left") {
        setTotalStandings(leftRowStats);
      } else if (selectedRowFilter === "right") {
        setTotalStandings(rightRowStats);
      } else {
        setTotalStandings([...leftRowStats, ...rightRowStats]);
      }
    }

    setLoading(false);
  };

  const fetchTournamentStandings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("player_tournament_stats")
      .select(`
        player_id,
        games_won,
        games_lost,
        tiebreaker_specials_count,
        players:player_id (name, row_side)
      `)
      .eq("tournament_id", selectedTournament);

    if (!error && data) {
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

      const leftRowStats = allStats
        .filter(s => s.row_side === "left")
        .sort((a, b) => {
          if (b.games_won !== a.games_won) return b.games_won - a.games_won;
          return b.specials_count - a.specials_count;
        })
        .map((s, idx) => ({ ...s, position: idx + 1 }));

      const rightRowStats = allStats
        .filter(s => s.row_side === "right")
        .sort((a, b) => {
          if (b.games_won !== a.games_won) return b.games_won - a.games_won;
          return b.specials_count - a.specials_count;
        })
        .map((s, idx) => ({ ...s, position: idx + 1 }));

      if (selectedRowFilter === "left") {
        setTournamentStandings(leftRowStats);
      } else if (selectedRowFilter === "right") {
        setTournamentStandings(rightRowStats);
      } else {
        setTournamentStandings([...leftRowStats, ...rightRowStats]);
      }
    }

    setLoading(false);
  };

  const fetchRoundStandings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("player_tournament_stats")
      .select(`
        player_id,
        games_won,
        games_lost,
        tiebreaker_specials_count,
        players:player_id (name, row_side)
      `)
      .eq("tournament_id", selectedTournament)
      .eq("round_number", selectedRound);

    if (!error && data) {
      const allStats: PlayerStats[] = data
        .map(d => ({
          player_id: d.player_id,
          player_name: (d.players as any)?.name || "Onbekend",
          games_won: d.games_won,
          games_lost: d.games_lost,
          specials_count: d.tiebreaker_specials_count || 0,
          row_side: (d.players as any)?.row_side || "left",
          position: 0,
        }));

      const leftRowStats = allStats
        .filter(s => s.row_side === "left")
        .sort((a, b) => {
          if (b.games_won !== a.games_won) return b.games_won - a.games_won;
          return b.specials_count - a.specials_count;
        })
        .map((s, idx) => ({ ...s, position: idx + 1 }));

      const rightRowStats = allStats
        .filter(s => s.row_side === "right")
        .sort((a, b) => {
          if (b.games_won !== a.games_won) return b.games_won - a.games_won;
          return b.specials_count - a.specials_count;
        })
        .map((s, idx) => ({ ...s, position: idx + 1 }));

      if (selectedRowFilter === "left") {
        setRoundStandings(leftRowStats);
      } else if (selectedRowFilter === "right") {
        setRoundStandings(rightRowStats);
      } else {
        setRoundStandings([...leftRowStats, ...rightRowStats]);
      }
    }

    setLoading(false);
  };

  const renderStandingsTable = (standings: PlayerStats[]) => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      );
    }

    if (standings.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nog geen resultaten beschikbaar.</p>
        </div>
      );
    }

    const leftRowStandings = standings.filter(s => s.row_side === "left");
    const rightRowStandings = standings.filter(s => s.row_side === "right");

    const renderSingleTable = (data: PlayerStats[], title: string) => (
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-3 text-center">{title}</h3>
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
            {data.map((player) => (
              <TableRow key={player.player_id}>
                <TableCell className="font-bold">
                  {player.position === 1 && <Badge className="bg-yellow-500 px-2 py-1">🥇</Badge>}
                  {player.position === 2 && <Badge className="bg-gray-400 px-2 py-1">🥈</Badge>}
                  {player.position === 3 && <Badge className="bg-orange-600 px-2 py-1">🥉</Badge>}
                  {player.position > 3 && <span className="text-base">{player.position}</span>}
                </TableCell>
                <TableCell className="font-bold text-lg">{player.player_name}</TableCell>
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

    // Desktop: side-by-side, Mobile: filtered view
    return (
      <>
        {/* Mobile: Show filter and single table */}
        <div className="block md:hidden">
          {selectedRowFilter === "left" && renderSingleTable(leftRowStandings, "Linker Rij")}
          {selectedRowFilter === "right" && renderSingleTable(rightRowStandings, "Rechter Rij")}
          {selectedRowFilter === "all" && (
            <div className="space-y-6">
              {renderSingleTable(leftRowStandings, "Linker Rij")}
              {renderSingleTable(rightRowStandings, "Rechter Rij")}
            </div>
          )}
        </div>

        {/* Desktop: Side-by-side tables */}
        <div className="hidden md:flex gap-6">
          {renderSingleTable(leftRowStandings, "Linker Rij")}
          {renderSingleTable(rightRowStandings, "Rechter Rij")}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Standen & Rankings
        </h1>
        <p className="text-muted-foreground">Overzicht van alle rankings</p>
      </div>

      <Tabs defaultValue="total" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="total">
            <TrendingUp className="h-4 w-4 mr-2" />
            Totaal
          </TabsTrigger>
          <TabsTrigger value="tournament">Per Toernooi</TabsTrigger>
          <TabsTrigger value="round">Per Ronde</TabsTrigger>
        </TabsList>

        <TabsContent value="total">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Totale Stand - Alle Toernooien</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cumulatief overzicht van alle gespeelde rondes in alle toernooien
                  </p>
                </div>
                <Select value={selectedRowFilter} onValueChange={(val) => {
                  setSelectedRowFilter(val);
                  fetchTotalStandings();
                }}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter op rij" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Rijen</SelectItem>
                    <SelectItem value="left">Linker Rij</SelectItem>
                    <SelectItem value="right">Rechter Rij</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {renderStandingsTable(totalStandings)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournament">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Stand per Toernooi</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Alle rondes van een specifiek toernooi
                  </p>
                </div>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Selecteer toernooi" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {renderStandingsTable(tournamentStandings)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="round">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div>
                  <CardTitle>Stand per Ronde</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Resultaten van een specifieke ronde
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Selecteer toernooi" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {availableRounds.length > 0 && (
                    <Select 
                      value={selectedRound.toString()} 
                      onValueChange={(val) => setSelectedRound(parseInt(val))}
                    >
                      <SelectTrigger className="w-full sm:w-40">
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
              {renderStandingsTable(roundStandings)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
