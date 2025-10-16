import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function Standings() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [chefSpecials, setChefSpecials] = useState<ChefSpecial[]>([]);
  
  const { data: standings = [], isLoading } = useTournamentStandings(selectedTournament || undefined);

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
      fetchChefSpecials();
    }
  }, [selectedTournament]);

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

  const renderStandingsTable = () => {
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
        <div className="text-center py-8">
          <p className="text-muted-foreground">Geen resultaten beschikbaar</p>
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Speler</TableHead>
            <TableHead className="text-center">Ronde 1<br/><span className="text-xs font-normal">G / S</span></TableHead>
            <TableHead className="text-center">Ronde 2<br/><span className="text-xs font-normal">G / S</span></TableHead>
            <TableHead className="text-center">Ronde 3<br/><span className="text-xs font-normal">G / S</span></TableHead>
            <TableHead className="text-center">Tie-breaker</TableHead>
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
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-medium">{player.round1_games_won}</span>
                  <span className="text-xs text-orange-600">{player.round1_specials}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-medium">{player.round2_games_won}</span>
                  <span className="text-xs text-orange-600">{player.round2_specials}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-bold text-green-600">{player.round3_games_won}</span>
                  <span className="text-xs text-orange-600 font-semibold">{player.round3_specials}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                {player.tie_breaker_used === 'r3_specials' && (
                  <Badge variant="outline" className="text-xs">
                    <Award className="h-3 w-3 mr-1" /> R3 Specials
                  </Badge>
                )}
                {player.tie_breaker_used === 'r2_games' && (
                  <Badge variant="outline" className="text-xs">
                    R2 Games
                  </Badge>
                )}
                {player.tie_breaker_used === 'r1_games' && (
                  <Badge variant="outline" className="text-xs">
                    R1 Games
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

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Toernooi Ranking
            <Badge variant="outline" className="ml-2">Ronde 3 Primair</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Gerankt op basis van Ronde 3 prestaties. Bij gelijke stand: R3 specials → R2 games → R1 games.
          </p>
        </CardHeader>
        <CardContent>
          {renderStandingsTable()}
        </CardContent>
      </Card>
    </div>
  );
}
