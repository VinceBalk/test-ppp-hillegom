import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Match } from "@/hooks/useMatches";
import MatchScoreInput from "./MatchScoreInput";
import { getShortTeamName } from "@/utils/matchUtils";

type Tournament = {
  id: string;
  status: "not_started" | "active" | "completed";
  is_simulation: boolean;
};

interface MatchEditorProps {
  match: Match;
  tournament: Tournament;
}

export default function MatchEditor({ match, tournament }: MatchEditorProps) {
  const team1 = getShortTeamName(match.team1_player1, match.team1_player2);
  const team2 = getShortTeamName(match.team2_player1, match.team2_player2);
  const courtName = match.court?.name || match.court_number || "Onbekend";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Wedstrijd Bewerken – Baan {courtName}, Ronde {match.round_number}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-semibold text-blue-700">
            Team 1: {team1}
          </p>
          <p className="font-semibold text-red-700">
            Team 2: {team2}
          </p>
        </div>

        <div className="text-muted-foreground text-sm">
          Status: {match.status}
        </div>

        <MatchScoreInput
          match={match as any}
          tournament={tournament}
          round={match.round_number}
        />
      </CardContent>
    </Card>
  );
}
