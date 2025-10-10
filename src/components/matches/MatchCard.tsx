import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Edit, CheckSquare, Eye, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Match } from "@/hooks/useMatches";
import { getShortTeamName } from "@/utils/matchUtils";
import MatchSimulator from "./MatchSimulator";
import SavedMatchEditor from "./SavedMatchEditor";
import MatchScoreInput from "./MatchScoreInput";
import QuickScoreInput from "./QuickScoreInput";
import SpecialsManager from "./SpecialsManager";

interface MatchCardProps {
  match: Match;
  matchNumberInCourtRound?: number;
  tournament?: {
    id: string;
    status: "not_started" | "active" | "completed";
    is_simulation: boolean;
  };
}

export default function MatchCard({ match, matchNumberInCourtRound, tournament }: MatchCardProps) {
  const navigate = useNavigate();
  const [showSimulator, setShowSimulator] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [showSpecials, setShowSpecials] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline">Gepland</Badge>;
      case "in_progress":
        return <Badge variant="default">Bezig</Badge>;
      case "completed":
        return <Badge variant="secondary">Voltooid</Badge>;
      default:
        return <Badge variant="outline">{status || "Onbekend"}</Badge>;
    }
  };

  const getPlayerTeams = (match: Match) => {
    if (match.team1_player1 && match.team2_player1) {
      const team1 = getShortTeamName(match.team1_player1, match.team1_player2);
      const team2 = getShortTeamName(match.team2_player1, match.team2_player2);
      return { team1, team2 };
    }

    if (match.player1 && match.player2) {
      const team1 = getShortTeamName(match.player1);
      const team2 = getShortTeamName(match.player2);
      return { team1, team2 };
    }

    return { team1: "Spelers nog niet toegewezen", team2: null };
  };

  const getTournamentDate = () => {
    if (match.tournament?.start_date) {
      return new Date(match.tournament.start_date).toLocaleDateString("nl-NL");
    }
    if (match.created_at) {
      return new Date(match.created_at).toLocaleDateString("nl-NL");
    }
    return "Geen datum";
  };

  const { team1, team2 } = getPlayerTeams(match);
  const displayMatchNumber = match.match_number || matchNumberInCourtRound;

  // Use passed tournament or create from match data
  const effectiveTournament = tournament || {
    id: match.tournament_id,
    status: (match.tournament?.status === "in_progress" ? "active" : 
             match.tournament?.status === "completed" ? "completed" :
             "not_started") as "not_started" | "active" | "completed",
    is_simulation: match.tournament?.is_simulation || false,
  };

  const toernooiStatus = effectiveTournament.status;
  const isSimulation = effectiveTournament.is_simulation;
  const round = match.round_number;

  if (showSimulator) {
    return <MatchSimulator match={match} onClose={() => setShowSimulator(false)} />;
  }

  if (showEditor) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Wedstrijd Bewerken</h3>
          <Button variant="outline" size="sm" onClick={() => setShowEditor(false)}>
            Terug naar overzicht
          </Button>
        </div>
        <SavedMatchEditor match={match} tournamentId={match.tournament_id} />
      </div>
    );
  }

  if (showScoreInput) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Snelle Score Invoer</h3>
          <Button variant="outline" size="sm" onClick={() => setShowScoreInput(false)}>
            Annuleren
          </Button>
        </div>
        <QuickScoreInput
          match={match as any}
          tournament={effectiveTournament}
          onSaved={() => setShowScoreInput(false)}
        />
      </div>
    );
  }

  if (showSpecials) {
    return (
      <SpecialsManager
        match={match}
        onClose={() => setShowSpecials(false)}
        onBack={() => setShowSpecials(false)}
      />
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        {displayMatchNumber && (
          <div className="flex justify-start mb-2">
            <Badge variant="secondary" className="text-xs">
              Wedstrijd #{displayMatchNumber}
            </Badge>
          </div>
        )}

        <div className="flex items-start justify-end mb-2">
          <div className="flex gap-1">
            {toernooiStatus === "active" && match.status !== "completed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowScoreInput(true)}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                Score Invoeren
              </Button>
            )}

            {toernooiStatus === "active" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSpecials(true)}
                className="text-purple-600 border-purple-600 hover:bg-purple-50"
              >
                <Star className="h-3 w-3 mr-1" />
                Specials
              </Button>
            )}

            {match.status === "completed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/scores/${match.id}`)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Eye className="h-3 w-3 mr-1" />
                Score Bekijken
              </Button>
            )}

            {toernooiStatus === "not_started" && isSimulation && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSimulator(true)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Play className="h-3 w-3 mr-1" />
                Simuleren
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEditor(true)}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Edit className="h-3 w-3 mr-1" />
              Bewerken
            </Button>
          </div>
        </div>

        <CardTitle className="text-base leading-tight">
          {team2 ? (
            <div className="space-y-1 text-left">
              <div>{team1}</div>
              <div className="text-sm text-muted-foreground font-normal">vs</div>
              <div>{team2}</div>
            </div>
          ) : (
            <div className="text-left">{team1}</div>
          )}
        </CardTitle>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{match.tournament?.name || "Onbekend toernooi"}</span>
            <span>•</span>
            <span>{getTournamentDate()}</span>
            <span>•</span>
            {getStatusBadge(match.status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {match.notes && (
          <div className="text-xs text-orange-600 mb-3 p-2 bg-orange-50 rounded">
            {match.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
