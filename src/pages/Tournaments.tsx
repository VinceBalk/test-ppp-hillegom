
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournaments, Tournament } from '@/hooks/useTournaments';
import { TournamentHeader } from '@/components/tournaments/TournamentHeader';
import { TournamentTable } from '@/components/tournaments/TournamentTable';
import { TournamentMobileCard } from '@/components/tournaments/TournamentMobileCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Tournaments() {
  const navigate = useNavigate();
  const { tournaments, isLoading, error, createTournament, updateTournament, deleteTournament, isCreating, isUpdating, isDeleting } = useTournaments();
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

  const handleViewStandings = (tournamentId: string) => {
    navigate(`/tournaments/${tournamentId}/standings`);
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Toernooien</h1>
          <p className="text-muted-foreground">Beheer alle toernooien en competities</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fout bij het laden van toernooien: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="space-y-6">
        <TournamentHeader
          tournamentCount={0}
          showForm={showForm}
          setShowForm={setShowForm}
          onCreateTournament={handleCreateTournament}
          isCreating={isCreating}
        />
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nog geen toernooien aangemaakt. Maak je eerste toernooi aan met de knop hierboven.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tournament.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <TournamentHeader
        tournamentCount={tournaments.length}
        showForm={showForm}
        setShowForm={setShowForm}
        onCreateTournament={handleCreateTournament}
        isCreating={isCreating}
      />

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredTournaments.map((tournament) => (
          <TournamentMobileCard
            key={tournament.id}
            tournament={tournament}
            onEdit={setEditingTournament}
            onDelete={handleDeleteTournament}
            onAssignPlayers={handleAssignPlayers}
            onViewStandings={handleViewStandings}
            isDeleting={isDeleting}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <TournamentTable
          tournaments={tournaments}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          editingTournament={editingTournament}
          setEditingTournament={setEditingTournament}
          onAssignPlayers={handleAssignPlayers}
          onViewStandings={handleViewStandings}
          onUpdateTournament={handleUpdateTournament}
          onDeleteTournament={handleDeleteTournament}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
