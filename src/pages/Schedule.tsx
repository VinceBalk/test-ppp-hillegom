
import { useParams } from 'react-router-dom';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import ScheduleHeader from '@/components/schedule/ScheduleHeader';
import ScheduleContent from '@/components/schedule/ScheduleContent';
import ScheduleLoadingState from '@/components/schedule/ScheduleLoadingState';
import ScheduleErrorState from '@/components/schedule/ScheduleErrorState';

export default function Schedule() {
  const { tournamentId: urlTournamentId } = useParams<{ tournamentId: string }>();
  
  const { tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const { isLoading: matchesLoading } = useMatches(urlTournamentId || '');

  const tournament = tournaments?.find(t => t.id === urlTournamentId);

  if (tournamentsLoading || matchesLoading) {
    return <ScheduleLoadingState />;
  }

  if (tournamentsError) {
    return <ScheduleErrorState error={tournamentsError} />;
  }

  return (
    <div className="space-y-6">
      <ScheduleHeader tournamentName={tournament?.name || "Schema Generatie"} />
      <ScheduleContent urlTournamentId={urlTournamentId} />
    </div>
  );
}
