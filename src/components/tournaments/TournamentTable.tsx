
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tournament } from '@/hooks/useTournaments';
import { TournamentSearch } from './TournamentSearch';
import { TournamentRow } from './TournamentRow';

interface TournamentTableProps {
  tournaments: Tournament[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  editingTournament: Tournament | null;
  setEditingTournament: (tournament: Tournament | null) => void;
  onAssignPlayers: (tournamentId: string) => void;
  onUpdateTournament: (tournamentData: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
  onDeleteTournament: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function TournamentTable({
  tournaments,
  searchTerm,
  onSearchChange,
  editingTournament,
  setEditingTournament,
  onAssignPlayers,
  onUpdateTournament,
  onDeleteTournament,
  isUpdating,
  isDeleting
}: TournamentTableProps) {
  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tournament.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Toernooien Overzicht</CardTitle>
        <div className="w-full">
          <TournamentSearch searchTerm={searchTerm} onSearchChange={onSearchChange} />
        </div>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Naam</TableHead>
                <TableHead className="min-w-[140px]">Datums</TableHead>
                <TableHead className="min-w-[100px]">Max Spelers</TableHead>
                <TableHead className="min-w-[110px]">Inschrijfgeld</TableHead>
                <TableHead className="min-w-[90px]">Status</TableHead>
                <TableHead className="min-w-[140px]">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTournaments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Geen toernooien gevonden die voldoen aan de zoekterm.' : 'Nog geen toernooien toegevoegd.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTournaments.map((tournament) => (
                  <TournamentRow
                    key={tournament.id}
                    tournament={tournament}
                    editingTournament={editingTournament}
                    setEditingTournament={setEditingTournament}
                    onAssignPlayers={onAssignPlayers}
                    onUpdateTournament={onUpdateTournament}
                    onDeleteTournament={onDeleteTournament}
                    isUpdating={isUpdating}
                    isDeleting={isDeleting}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
