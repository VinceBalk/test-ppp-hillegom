import { useParams } from "react-router-dom";
import { useTournament } from "@/hooks/useTournament";
import { useMatches } from "@/hooks/useMatches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MatchesList from "@/components/matches/MatchesList";

export default function TournamentMatches() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { tournament, isLoading: loadingTournament } = useTournament(tournamentId);
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

  return (
    <MatchesList
      matches={matches}
      editMode={tournament.status === "active"}
      selectedTournamentId={tournamentId!}
      tournament={{
        id: tournament.id,
        status: tournament.status,
        is_simulation: tournament.is_simulation ?? false,
      }}
    />
  );
}
