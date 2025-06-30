import { useNavigate } from 'react-router-dom';
import { useTournaments, Tournament } from '@/hooks/useTournaments';
import { TournamentHeader } from '@/components/tournaments/TournamentHeader';
import { TournamentTable } from '@/components/tournaments/TournamentTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Tournaments() {
  const navigate = useNavigate();
  const {
    tournaments,
    isLoading,
    error,
    createTournament,
    updateTournament,
    deleteTournament,
    isCreating,
    isUpdating,
    isDeleting
  } = useTournaments();

  const handleCreateTournament = (t: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    createTournament(t);
  };

  const handleUpdateTournament = (t: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    updateTournament({ id: t.id, ...t });
  };

  const handleDeleteTournament = (id: string) => {
    deleteTournament(id);
  };

  const handleAssignPlayers = (tournamentId: string) => {
    navigate(`/tournaments/${tournamentId}/assign-players`);
  };

  if (isLoading) {
    return (
      <div className="section stack-l">
        <h1 className="h1">Toernooien</h1>
        <p className="text-m">Bezig met laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section stack-l">
        <h1 className="h1">Toernooien</h1>
        <Alert variant="destructive">
          <AlertCircle className="icon-s" />
          <AlertDescription>
            Fout bij het laden van toernooien: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="section stack-l">
        <TournamentHeader
          tournamentCount={0}
          showForm={true}
          setShowForm={() => {}}
          onCreateTournament={handleCreateTournament}
          isCreating={isCreating}
        />
        <Alert>
          <AlertCircle className="icon-s" />
          <AlertDescription>
            Nog geen toernooien aangemaakt. Maak je eerste toernooi aan met de knop hierboven.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="section stack-l">
      <TournamentHeader
        tournamentCount={tournaments.length}
        showForm={false}
        setShowForm={() => {}}
        onCreateTournament={handleCreateTournament}
        isCreating={isCreating}
      />

      <TournamentTable
        tournaments={tournaments}
        searchTerm=""
        onSearchChange={() => {}}
        editingTournament={null}
        setEditingTournament={() => {}}
        onAssignPlayers={handleAssignPlayers}
        onUpdateTournament={handleUpdateTournament}
        onDeleteTournament={handleDeleteTournament}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  );
}
