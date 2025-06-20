
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournaments, Tournament } from '@/hooks/useTournaments';
import { TournamentHeader } from '@/components/tournaments/TournamentHeader';
import { TournamentTable } from '@/components/tournaments/TournamentTable';

export default function Tournaments() {
  const navigate = useNavigate();
  const { tournaments, isLoading, createTournament, updateTournament, deleteTournament, isCreating, isUpdating, isDeleting } = useTournaments();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleCreateTournament = (tournamentData: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    createTournament(tournamentData);
    setShowForm(false);
  };

  const handleUpdateTournament = (tournamentData: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (editingTournament) {
      updateTournament({ id: editingTournament.id, ...tournamentData });
      setEditingTournament(null);
    }
  };

  const handleDeleteTournament = (id: string) => {
    deleteTournament(id);
  };

  const handleAssignPlayers = (tournamentId: string) => {
    navigate(`/tournaments/${tournamentId}/assign-players`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Toernooien</h1>
          <p className="text-muted-foreground">Beheer alle toernooien en competities</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TournamentHeader
        tournamentCount={tournaments.length}
        showForm={showForm}
        setShowForm={setShowForm}
        onCreateTournament={handleCreateTournament}
        isCreating={isCreating}
      />

      <TournamentTable
        tournaments={tournaments}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        editingTournament={editingTournament}
        setEditingTournament={setEditingTournament}
        onAssignPlayers={handleAssignPlayers}
        onUpdateTournament={handleUpdateTournament}
        onDeleteTournament={handleDeleteTournament}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  );
}
