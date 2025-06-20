
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Users, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Tournament } from '@/hooks/useTournaments';
import { TournamentForm } from '@/components/TournamentForm';
import { TournamentStatusBadge } from './TournamentStatusBadge';

interface TournamentRowProps {
  tournament: Tournament;
  editingTournament: Tournament | null;
  setEditingTournament: (tournament: Tournament | null) => void;
  onAssignPlayers: (tournamentId: string) => void;
  onUpdateTournament: (tournamentData: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
  onDeleteTournament: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function TournamentRow({
  tournament,
  editingTournament,
  setEditingTournament,
  onAssignPlayers,
  onUpdateTournament,
  onDeleteTournament,
  isUpdating,
  isDeleting
}: TournamentRowProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: nl });
    } catch {
      return dateStr;
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{tournament.name}</div>
          {tournament.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {tournament.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3" />
          {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
        </div>
      </TableCell>
      <TableCell>{tournament.max_players}</TableCell>
      <TableCell>€{tournament.entry_fee?.toFixed(2) || '0.00'}</TableCell>
      <TableCell>
        <TournamentStatusBadge status={tournament.status} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAssignPlayers(tournament.id)}
            title="Spelers toewijzen"
          >
            <Users className="h-4 w-4" />
          </Button>

          <Dialog open={editingTournament?.id === tournament.id} onOpenChange={(open) => !open && setEditingTournament(null)}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingTournament(tournament)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <TournamentForm
                tournament={editingTournament || undefined}
                onSubmit={onUpdateTournament}
                onCancel={() => setEditingTournament(null)}
                isSubmitting={isUpdating}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDeleting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Toernooi verwijderen</AlertDialogTitle>
                <AlertDialogDescription>
                  Weet je zeker dat je "{tournament.name}" wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden en verwijdert ook alle bijbehorende wedstrijden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteTournament(tournament.id)}>
                  Verwijderen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
