import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { BarChart3, Search, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerStatistics } from "@/hooks/usePlayerStatistics";

interface Tournament {
  id: string;
  name: string;
}

export default function Statistics() {
  const navigate = useNavigate();
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: statistics, isLoading } = usePlayerStatistics(
    selectedTournament === "all" ? undefined : selectedTournament
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

  const filteredStatistics = statistics?.filter(stat =>
    stat.player_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredStatistics && filteredStatistics.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Speler</TableHead>
                    <TableHead className="text-center">Gewonnen</TableHead>
                    <TableHead className="text-center">Verloren</TableHead>
                    <TableHead className="text-center">Win %</TableHead>
                    <TableHead className="text-center">Specials</TableHead>
                    <TableHead className="text-center">Toernooien</TableHead>
                    <TableHead className="text-center">Gem. Games</TableHead>
                    <TableHead className="text-center">Gem. Specials</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStatistics.map((stat, index) => (
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
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery ? 'Geen spelers gevonden met deze zoekopdracht' : 'Geen statistieken beschikbaar'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
