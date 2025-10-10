import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award } from "lucide-react";
import { useChefSpecialRanking } from "@/hooks/useChefSpecialRanking";

interface ChefSpecialRankingProps {
  tournamentId: string;
}

export default function ChefSpecialRanking({ tournamentId }: ChefSpecialRankingProps) {
  const { data: ranking = [], isLoading } = useChefSpecialRanking(tournamentId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Chef Special Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Laden...</p>
        </CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Chef Special Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nog geen specials geregistreerd voor dit toernooi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Chef Special Ranking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ranking.slice(0, 10).map((player) => (
            <div
              key={player.player_id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold">
                  {player.rank_position}
                </div>
                <div>
                  <p className="font-medium">{player.player_name}</p>
                  {player.title && (
                    <Badge variant={player.title === 'Chef Special' ? 'default' : 'secondary'} className="mt-1">
                      {player.title === 'Chef Special' ? (
                        <><Trophy className="h-3 w-3 mr-1" /> Chef Special</>
                      ) : (
                        <><Award className="h-3 w-3 mr-1" /> Sous Chef</>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{player.total_specials}</p>
                <p className="text-xs text-muted-foreground">specials</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
