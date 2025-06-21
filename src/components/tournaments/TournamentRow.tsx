
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, MoreHorizontal, Trash2, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Tournament } from '@/hooks/useTournaments';
import { TournamentForm } from '../TournamentForm';
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
  const navigate = useNavigate();

  const handleCreateSchedule = () => {
    navigate(`/schedule/${tournament.id}`);
  };

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{tournament.name}</div>
          {tournament.description && (
            <div className="text-sm text-muted-foreground mt-1">
              {tournament.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {format(new Date(tournament.start_date), 'd MMM yyyy', { locale: nl })} - 
          {format(new Date(tournament.end_date), 'd MMM yyyy', { locale: nl })}
        </div>
      </TableCell>
      <TableCell>{tournament.max_players}</TableCell>
      <TableCell>€{tournament.entry_fee?.toFixed(2) || '0.00'}</TableCell>
      <TableCell>
        <TournamentStatusBadge status={tournament.status || 'draft'} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAssignPlayers(tournament.id)}
          >
            <Users className="h-4 w-4 mr-1" />
            Spelers
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateSchedule}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Schema
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingTournament(tournament)}>
                <Edit className="h-4 w-4 mr-2" />
                Bewerken
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={() => onDeleteTournament(tournament.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Verwijderen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Dialog open={editingTournament?.id === tournament.id} onOpenChange={(open) => !open && setEditingTournament(null)}>
          <DialogContent className="max-w-2xl">
            <TournamentForm
              tournament={editingTournament || undefined}
              onSubmit={onUpdateTournament}
              onCancel={() => setEditingTournament(null)}
              isSubmitting={isUpdating}
            />
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}
