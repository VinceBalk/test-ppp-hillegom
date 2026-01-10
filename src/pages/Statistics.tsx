import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Search, Trophy, Award, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerStatistics, PlayerStatistics } from "@/hooks/usePlayerStatistics";
import { usePlayerRankings } from "@/hooks/usePlayerRankings";

interface Tournament {
  id: string;
  name: string;
}

export default function Statistics() {
  const navigate = useNavigate();
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"totaal" | "per_rij">("totaal");
  const [sortField, setSortField] = useState<string>("total_games_won");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [rowFilter, setRowFilter] = useState<"all" | "left" | "right">("all");
  
  const { data: statistics, isLoading: statsLoading } = usePlayerStatistics(
    selectedTournament === "all" ? undefined : selectedTournament
  );

  const { data: rankings, isLoading: rankingsLoading } = usePlayerRankings(
    selectedTournament === "all" ? undefined : selectedTournament,
    rowFilter === "all" ? undefined : rowFilter
  );

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    const { data } = await supabase
      .from("tournaments")
      .select("id, name")
      .in("status", ["in_progress", "completed"])
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setTournaments(data);
    }
  };

  const splitPlayerName = (name: string) => {
    const parts = name.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return { firstName, lastName };
  };

  const getRankChangeIcon = (change?: number) => {
    if (!change || change === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredStatistics = statistics?.filter(stat =>
    stat.player_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRankings = rankings?.filter(rank =>
    rank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedStatistics = [...(filteredStatistics || [])].sort((a, b) => {
    let compareResult = 0;
    
    if (sortField === "player_name") {
      const aName = splitPlayerName(a.player_name);
      const bName = splitPlayerName(b.player_name);
      compareResult = aName.firstName.localeCompare(bName.firstName);
      if (compareResult === 0) {
        compareResult = aName.lastName.localeCompare(bName.lastName);
      }
    } else if (sortField === "avg_specials") {
      const aAvg = a.total_tournaments > 0 ? a.total_specials / a.total_tournaments : 0;
      const bAvg = b.total_tournaments > 0 ? b.total_specials / b.total_tournaments : 0;
      compareResult = aAvg - bAvg;
    } else {
      compareResult = (a[sortField as keyof PlayerStatistics] as number || 0) - (b[sortField as keyof PlayerStatistics] as number || 0);
    }
    
    return sortDirection === "asc" ? compareResult : -compareResult;
  });

  const leftPlayers = sortedStatistics.filter(s => s.row_side === 'left');
  const rightPlayers = sortedStatistics.filter(s => s.row_side === 'right');

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Speler Statistieken
        </h1>
        <p className="text-muted-foreground">Overall prestaties en gemiddelden</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Toernooi</label>
              <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer toernooi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Toernooien</SelectItem>
                  {tournaments.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Weergave</label>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as "totaal" | "per_rij")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer weergave" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totaal">Totaal</SelectItem>
                  <SelectItem value="per_rij">Per Rij</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Zoeken</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek speler..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="statistics">Statistieken</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Ranking
                {filteredRankings && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({filteredRankings.length} spelers)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={rowFilter} onValueChange={(value) => setRowFilter(value as "all" | "left" | "right")}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Rijen</SelectItem>
                    <SelectItem value="left">Links</SelectItem>
                    <SelectItem value="right">Rechts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {rankingsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredRankings && filteredRankings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Speler</TableHead>
                        <TableHead>Rij</TableHead>
                        <TableHead className="text-center">Toernooien</TableHead>
                        <TableHead className="text-center">Totaal Punten</TableHead>
                        <TableHead className="text-center">Gem. Positie</TableHead>
                        <TableHead className="text-center">Games Won</TableHead>
                        <TableHead className="text-center">Specials</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRankings.map((rank, index) => {
                        // Find player in statistics to get rank_change
                        const playerStats = statistics?.find(s => s.player_id === rank.player_id);
                        
                        return (
                          <TableRow key={rank.player_id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell 
                              className="font-semibold text-primary hover:underline cursor-pointer"
                              onClick={() => navigate(`/players/${rank.player_id}`)}
                            >
                              <div className="flex items-center gap-2">
                                {rank.name}
                                {playerStats?.rank_change !== undefined && getRankChangeIcon(playerStats.rank_change)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {rank.row_side === 'left' ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                  Links
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                  Rechts
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{rank.tournaments_played}</TableCell>
                            <TableCell className="text-center">{rank.total_points}</TableCell>
                            <TableCell className="text-center font-semibold">{rank.avg_position}</TableCell>
                            <TableCell className="text-center text-green-600">{rank.total_games_won}</TableCell>
                            <TableCell className="text-center text-orange-600">{rank.total_specials}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Geen spelers gevonden' : 'Geen rankings beschikbaar'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Speler Statistieken
                {filteredStatistics && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({filteredStatistics.length} spelers)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : sortedStatistics && sortedStatistics.length > 0 ? (
                viewMode === "totaal" ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleSort("player_name")}
                          >
                            Speler {sortField === "player_name" && (sortDirection === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead>Rij</TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleSort("total_games_won")}
                          >
                            Gewonnen {sortField === "total_games_won" && (sortDirection === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleSort("total_games_lost")}
                          >
                            Verloren {sortField === "total_games_lost" && (sortDirection === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleSort("win_percentage")}
                          >
                            Win % {sortField === "win_percentage" && (sortDirection === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleSort("total_specials")}
                          >
                            Specials {sortField === "total_specials" && (sortDirection === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleSort("total_tournaments")}
                          >
                            Toernooien {sortField === "total_tournaments" && (sortDirection === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleSort("avg_games_per_tournament")}
                          >
                            Gem. Games {sortField === "avg_games_per_tournament" && (sortDirection === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleSort("avg_specials")}
                          >
                            Gem. Specials {sortField === "avg_specials" && (sortDirection === "asc" ? "↑" : "↓")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedStatistics.map((stat, index) => (
                          <TableRow key={stat.player_id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell 
                              className="font-semibold text-primary hover:underline cursor-pointer"
                              onClick={() => navigate(`/players/${stat.player_id}`)}
                            >
                              {stat.player_name}
                            </TableCell>
                            <TableCell>
                              {stat.row_side === 'left' ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                  Links
                                </Badge>
                              ) : stat.row_side === 'right' ? (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                  Rechts
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Onbekend</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-green-600">
                              {stat.total_games_won}
                            </TableCell>
                            <TableCell className="text-center text-red-600">
                              {stat.total_games_lost}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {stat.win_percentage}%
                            </TableCell>
                            <TableCell className="text-center font-semibold text-orange-600">
                              {stat.total_specials}
                            </TableCell>
                            <TableCell className="text-center">
                              {stat.total_tournaments}
                            </TableCell>
                            <TableCell className="text-center">
                              {stat.avg_games_per_tournament}
                            </TableCell>
                            <TableCell className="text-center">
                              {stat.total_tournaments > 0
                                ? (stat.total_specials / stat.total_tournaments).toFixed(1)
                                : '0.0'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          Links
                        </Badge>
                        Rankings ({leftPlayers.length} spelers)
                      </h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Speler</TableHead>
                              <TableHead className="text-center">Gewonnen</TableHead>
                              <TableHead className="text-center">Win %</TableHead>
                              <TableHead className="text-center">Specials</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leftPlayers.map((stat, index) => (
                              <TableRow key={stat.player_id}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell 
                                  className="font-semibold text-primary hover:underline cursor-pointer"
                                  onClick={() => navigate(`/players/${stat.player_id}`)}
                                >
                                  {stat.player_name}
                                </TableCell>
                                <TableCell className="text-center font-semibold text-green-600">
                                  {stat.total_games_won}
                                </TableCell>
                                <TableCell className="text-center font-semibold">
                                  {stat.win_percentage}%
                                </TableCell>
                                <TableCell className="text-center font-semibold text-orange-600">
                                  {stat.total_specials}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          Rechts
                        </Badge>
                        Rankings ({rightPlayers.length} spelers)
                      </h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Speler</TableHead>
                              <TableHead className="text-center">Gewonnen</TableHead>
                              <TableHead className="text-center">Win %</TableHead>
                              <TableHead className="text-center">Specials</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rightPlayers.map((stat, index) => (
                              <TableRow key={stat.player_id}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell 
                                  className="font-semibold text-primary hover:underline cursor-pointer"
                                  onClick={() => navigate(`/players/${stat.player_id}`)}
                                >
                                  {stat.player_name}
                                </TableCell>
                                <TableCell className="text-center font-semibold text-green-600">
                                  {stat.total_games_won}
                                </TableCell>
                                <TableCell className="text-center font-semibold">
                                  {stat.win_percentage}%
                                </TableCell>
                                <TableCell className="text-center font-semibold text-orange-600">
                                  {stat.total_specials}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Geen spelers gevonden met deze zoekopdracht' : 'Geen statistieken beschikbaar'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
