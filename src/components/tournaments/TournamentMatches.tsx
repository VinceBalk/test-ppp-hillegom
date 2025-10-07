import { useParams } from "react-router-dom";
import { useTournament } from "@/hooks/useTournament";
import { useMatches } from "@/hooks/useMatches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MatchesList from "@/components/matches/MatchesList";

export default function TournamentMatches() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { data: tournament, isLoading: loadingTournament } = useTournament(tournamentId);
  const { matches, isLoading: loadingMatches } = useMatches(tournamentId);

  if (loadingTournament || loadingMatches) {
    return <p>Bezig met laden...</p>;
  }

  if (!tournament) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Toernooi niet gevonden</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Het opgegeven toernooi kon niet worden geladen.</p>
        </CardContent>
      </Card>
    );
  }

  const tournamentStatus = 
    tournament.status === 'in_progress' ? 'active' :
    tournament.status === 'completed' ? 'completed' :
    'not_started' as const;

  return (
    <MatchesList
      matches={matches}
      editMode={tournament.status === "in_progress"}
      selectedTournamentId={tournamentId!}
      tournament={{
        id: tournament.id,
        status: tournamentStatus,
        is_simulation: tournament.is_simulation ?? false,
      }}
    />
  );
}
