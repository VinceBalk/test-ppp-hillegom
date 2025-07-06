import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MatchScoreInput from "./MatchScoreInput";

type Match = {
  id: string;
  court_name: string;
  round_number: number;
  team1_names: string[];
  team2_names: string[];
  score_team1: number | null;
  score_team2: number | null;
  status: string;
};

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Wedstrijd Bewerken – Baan {match.court_name}, Ronde {match.round_number}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-semibold text-blue-700">
            Team 1: {match.team1_names.join(" & ")}
          </p>
          <p className="font-semibold text-red-700">
            Team 2: {match.team2_names.join(" & ")}
          </p>
        </div>

        <div className="text-muted-foreground text-sm">
          Status: {match.status}
        </div>

        <MatchScoreInput
          match={match}
          tournament={tournament}
          round={match.round_number}
        />
      </CardContent>
    </Card>
  );
}
