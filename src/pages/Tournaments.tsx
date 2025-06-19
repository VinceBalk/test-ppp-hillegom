
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Calendar } from 'lucide-react';
import { useTournaments, Tournament } from '@/hooks/useTournaments';
import { TournamentForm } from '@/components/TournamentForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function Tournaments() {
  const { tournaments, isLoading, createTournament, updateTournament, deleteTournament, isCreating, isUpdating, isDeleting } = useTournaments();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tournament.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getStatusBadge = (status?: string) => {
    const variants = {
      draft: 'secondary',
      open: 'default',
      in_progress: 'default',
      completed: 'outline',
      cancelled: 'destructive'
    } as const;
    
    const labels = {
      draft: 'Concept',
      open: 'Open',
      in_progress: 'Bezig',
      completed: 'Voltooid',
      cancelled: 'Geannuleerd'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: nl });
    } catch {
      return dateStr;
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Toernooien</h1>
          <p className="text-muted-foreground">
            Beheer alle toernooien en competities ({tournaments.length} toernooien)
          </p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Toernooi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <TournamentForm
              onSubmit={handleCreateTournament}
              onCancel={() => setShowForm(false)}
              isSubmitting={isCreating}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toernooien Overzicht</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek toernooien..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Datums</TableHead>
                <TableHead>Max Spelers</TableHead>
                <TableHead>Inschrijfgeld</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acties</TableHead>
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
                  <TableRow key={tournament.id}>
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
                    <TableCell>{getStatusBadge(tournament.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                              onSubmit={handleUpdateTournament}
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
                              <AlertDialogAction onClick={() => handleDeleteTournament(tournament.id)}>
                                Verwijderen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
