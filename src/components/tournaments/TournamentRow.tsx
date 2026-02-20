import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Edit, MoreHorizontal, Trash2, Users, Calendar, TrendingUp, PlayCircle, CheckCircle, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Tournament } from '@/hooks/useTournaments';
import { TournamentForm } from '../TournamentForm';
import { TournamentStatusBadge } from './TournamentStatusBadge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TournamentRowProps {
  tournament: Tournament;
  editingTournament: Tournament | null;
  setEditingTournament: (tournament: Tournament | null) => void;
  onAssignPlayers: (tournamentId: string) => void;
  onViewStandings: (tournamentId: string) => void;
  onViewMatches: (tournamentId: string) => void;
  onUpdateTournament: (tournamentData: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
  onDeleteTournament: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  canManage: boolean;
}

export function TournamentRow({
  tournament,
  editingTournament,
  setEditingTournament,
  onAssignPlayers,
  onViewStandings,
  onViewMatches,
  onUpdateTournament,
  onDeleteTournament,
  isUpdating,
  isDeleting,
  canManage,
}: TournamentRowProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const { isSuperAdmin } = useAuth();

  const handleCreateSchedule = () => {
    navigate(`/schedule/${tournament.id}`);
  };

  const handleRowClick = () => {
    if (canManage) setEditingTournament(tournament);
  };

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isSuperAdmin()) {
      toast({
        title: 'Geen toegang',
        description: 'Alleen superadmins kunnen de toernooi status wijzigen',
        variant: 'destructive',
      });
      return;
    }

    const newStatus = tournament.status === 'completed' ? 'in_progress' : 'completed';
    setIsTogglingStatus(true);

    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: newStatus })
        .eq('id', tournament.id);

      if (error) throw error;

      toast({
        title: 'Status gewijzigd',
        description: `Toernooi status is gewijzigd naar ${newStatus === 'completed' ? 'Voltooid' : 'Bezig'}`,
      });

      window.location.reload();
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon status niet wijzigen',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <>
      <TableRow
        className={canManage ? 'cursor-pointer hover:bg-muted/50' : ''}
        onClick={handleRowClick}
      >
        <TableCell>
          <div className="font-medium">{tournament.name}</div>
          {tournament.description && (
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {tournament.description}
            </div>
          )}
        </TableCell>
        <TableCell className="text-sm whitespace-nowrap">
          {format(new Date(tournament.start_date), 'd MMM yy', { locale: nl })}
        </TableCell>
        <TableCell className="text-center text-sm">{tournament.max_players}</TableCell>
        <TableCell className="text-sm">€{tournament.entry_fee?.toFixed(0) || '0'}</TableCell>
        <TableCell>
          <TournamentStatusBadge status={tournament.status || 'draft'} />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {/* Stand — zichtbaar voor iedereen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewStandings(tournament.id)}
              title="Stand bekijken"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>

            {/* Wedstrijden — zichtbaar voor iedereen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewMatches(tournament.id)}
              title="Wedstrijden bekijken"
            >
              <Swords className="h-4 w-4" />
            </Button>

            {/* Beheer-acties — alleen organisator/beheerder */}
            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAssignPlayers(tournament.id)}
                  title="Spelers toewijzen"
                >
                  <Users className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCreateSchedule}
                  title="Schema beheren"
                >
                  <Calendar className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(tournament.status === 'completed' || tournament.status === 'in_progress') && (
                      <>
                        <DropdownMenuItem onClick={handleToggleStatus} disabled={isTogglingStatus}>
                          {tournament.status === 'completed' ? (
                            <>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Zet op Bezig
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Zet op Voltooid
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
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
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {canManage && (
        <Dialog
          open={editingTournament?.id === tournament.id}
          onOpenChange={(open) => !open && setEditingTournament(null)}
        >
          <DialogContent className="max-w-2xl">
            <TournamentForm
              tournament={editingTournament || undefined}
              onSubmit={onUpdateTournament}
              onCancel={() => setEditingTournament(null)}
              isSubmitting={isUpdating}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
